import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import {
  GLOBAL_INDICES,
  GLOBAL_INSTRUMENTS,
  MOCK_QUOTES,
  MOCK_FUNDAMENTALS,
  MOCK_NEWS,
  generateRealisticHistoricalOHLCV,
} from './src/services/marketUniverse.ts';
import { computeIndicatorSuite } from './src/services/indicators.ts';
import { scanSwingOpportunity } from './src/services/swingScanner.ts';
import { calculateAIDecisionScore } from './src/services/aiDecision.ts';
import {
  SimulatedOrder,
  SimulatedPosition,
  PaperAccount,
  OHLCVBar,
} from './src/types/market.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// In-memory Historical Data Cache
const historicalCache: Record<string, OHLCVBar[]> = {};
for (const inst of GLOBAL_INSTRUMENTS) {
  const quote = MOCK_QUOTES[inst.canonicalSymbol];
  const basePrice = quote ? quote.price : 100;
  // Vary trend and volatility realistically
  const vol = inst.marketCapTier === 'MEGA_CAP' ? 1.8 : 2.5;
  const trend = inst.canonicalSymbol.includes('NVDA') ? 0.35 : 0.12;
  historicalCache[inst.canonicalSymbol] = generateRealisticHistoricalOHLCV(basePrice, vol, trend, 120);
}

// In-Memory Paper Trading State
let paperAccount: PaperAccount = {
  cashBalance: 100000.0,
  initialBalance: 100000.0,
  currency: 'USD',
  equity: 100000.0,
  totalRealizedPnL: 0.0,
  totalUnrealizedPnL: 0.0,
  tradesCount: 0,
  winRate: 0.0,
};

let paperPositions: SimulatedPosition[] = [
  {
    canonicalSymbol: 'AAPL.US',
    companyName: 'Apple Inc.',
    shares: 50,
    averageEntryPrice: 222.50,
    currentPrice: 228.45,
    marketValue: 11422.50,
    unrealizedPnL: 297.50,
    unrealizedPnLPercent: 2.67,
    realizedPnL: 0.0,
    currency: 'USD',
    stopLoss: 216.00,
    takeProfit: 238.00,
  },
  {
    canonicalSymbol: 'NVDA.US',
    companyName: 'NVIDIA Corporation',
    shares: 80,
    averageEntryPrice: 132.00,
    currentPrice: 139.80,
    marketValue: 11184.00,
    unrealizedPnL: 624.00,
    unrealizedPnLPercent: 5.91,
    realizedPnL: 0.0,
    currency: 'USD',
    stopLoss: 126.50,
    takeProfit: 152.00,
  },
];

let paperOrders: SimulatedOrder[] = [
  {
    id: 'ord_init_1',
    canonicalSymbol: 'AAPL.US',
    side: 'BUY',
    type: 'MARKET',
    quantity: 50,
    price: 222.50,
    fillPrice: 222.50,
    status: 'FILLED',
    estimatedFee: 1.00,
    estimatedSlippage: 2.50,
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    filledAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'ord_init_2',
    canonicalSymbol: 'NVDA.US',
    side: 'BUY',
    type: 'MARKET',
    quantity: 80,
    price: 132.00,
    fillPrice: 132.00,
    status: 'FILLED',
    estimatedFee: 1.00,
    estimatedSlippage: 4.20,
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    filledAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  },
];

function updateAccountEquity() {
  let unrealizedTotal = 0;
  for (const pos of paperPositions) {
    const q = MOCK_QUOTES[pos.canonicalSymbol];
    if (q) {
      pos.currentPrice = q.price;
      pos.marketValue = Number((pos.shares * q.price).toFixed(2));
      pos.unrealizedPnL = Number(((q.price - pos.averageEntryPrice) * pos.shares).toFixed(2));
      pos.unrealizedPnLPercent = Number((((q.price - pos.averageEntryPrice) / pos.averageEntryPrice) * 100).toFixed(2));
      unrealizedTotal += pos.unrealizedPnL;
    }
  }
  const posValue = paperPositions.reduce((sum, p) => sum + p.marketValue, 0);
  paperAccount.equity = Number((paperAccount.cashBalance + posValue).toFixed(2));
  paperAccount.totalUnrealizedPnL = Number(unrealizedTotal.toFixed(2));
}

updateAccountEquity();

// Initialize GoogleGenAI SDK safely
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI({});
  } catch (err) {
    console.warn('Gemini API client initialization failed:', err);
  }
}

// -------------------------------------------------------------
// API ENDPOINTS
// -------------------------------------------------------------

// Global Indices
app.get('/api/market/indices', (_req: Request, res: Response) => {
  res.json({ success: true, data: GLOBAL_INDICES });
});

// Canonical Instruments List
app.get('/api/market/instruments', (req: Request, res: Response) => {
  const query = (req.query.q as string || '').toLowerCase().trim();
  const exchange = req.query.exchange as string;
  const sector = req.query.sector as string;

  let filtered = GLOBAL_INSTRUMENTS;
  if (query) {
    filtered = filtered.filter(
      i =>
        i.canonicalSymbol.toLowerCase().includes(query) ||
        i.nativeTicker.toLowerCase().includes(query) ||
        i.companyName.toLowerCase().includes(query) ||
        i.sector.toLowerCase().includes(query)
    );
  }
  if (exchange && exchange !== 'ALL') {
    filtered = filtered.filter(i => i.exchangeCode === exchange);
  }
  if (sector && sector !== 'ALL') {
    filtered = filtered.filter(i => i.sector === sector);
  }

  res.json({ success: true, count: filtered.length, data: filtered });
});

// Real-Time Quotes
app.get('/api/market/quotes', (req: Request, res: Response) => {
  const symbol = req.query.symbol as string;
  if (symbol) {
    const quote = MOCK_QUOTES[symbol];
    if (!quote) return res.status(404).json({ success: false, error: 'Quote not found' });
    return res.json({ success: true, data: quote });
  }
  res.json({ success: true, data: MOCK_QUOTES });
});

// Historical Bars & Computed Indicators
app.get('/api/market/history/:symbol', (req: Request, res: Response) => {
  const symbol = req.params.symbol;
  const bars = historicalCache[symbol];
  if (!bars) {
    return res.status(404).json({ success: false, error: `Historical data not found for ${symbol}` });
  }
  const indicators = computeIndicatorSuite(bars);
  res.json({
    success: true,
    symbol,
    barsCount: bars.length,
    bars,
    indicators,
  });
});

// Fundamentals
app.get('/api/market/fundamentals/:symbol', (req: Request, res: Response) => {
  const symbol = req.params.symbol;
  const fund = MOCK_FUNDAMENTALS[symbol];
  if (!fund) {
    return res.status(404).json({ success: false, error: `Fundamental metrics not found for ${symbol}` });
  }
  res.json({ success: true, data: fund });
});

// Swing Scanner
app.get('/api/scanner/swing', (_req: Request, res: Response) => {
  const opportunities = [];
  for (const inst of GLOBAL_INSTRUMENTS) {
    const bars = historicalCache[inst.canonicalSymbol];
    if (bars && bars.length >= 50) {
      const fund = MOCK_FUNDAMENTALS[inst.canonicalSymbol];
      const opp = scanSwingOpportunity(inst, bars, fund);
      if (opp) opportunities.push(opp);
    }
  }
  res.json({ success: true, count: opportunities.length, data: opportunities });
});

// 5-Pillar Explainable AI Decision Score
app.get('/api/ai/decision/:symbol', async (req: Request, res: Response) => {
  const symbol = req.params.symbol;
  const inst = GLOBAL_INSTRUMENTS.find(i => i.canonicalSymbol === symbol);
  const quote = MOCK_QUOTES[symbol];
  const bars = historicalCache[symbol];
  const fundamentals = MOCK_FUNDAMENTALS[symbol];

  if (!inst || !quote || !bars) {
    return res.status(404).json({ success: false, error: `Instrument ${symbol} not found` });
  }

  const indicators = computeIndicatorSuite(bars);
  const decision = calculateAIDecisionScore(inst, quote.price, indicators, fundamentals);

  // Optional: Enhance narrative with Gemini 2.5/Flash if API key is present
  if (aiClient && process.env.GEMINI_API_KEY) {
    try {
      const prompt = `You are the lead Quantitative and Technical Analysis Specialist for GlobalStock Intelligence.
Explain the following stock analysis strictly using the verified factual metrics provided below.
DO NOT hallucinate or alter any numbers.

Company: ${inst.companyName} (${inst.canonicalSymbol})
Exchange: ${inst.exchangeName} (${inst.currency})
Current Price: ${quote.price} (Change: ${quote.changePercent}%)
Calculated Overall Score: ${decision.overallScore}/100 (${decision.rating})
Pillars:
- Technical Score (35%): ${decision.technicalScore}/100
- Fundamental Score (25%): ${decision.fundamentalScore}/100
- Price Momentum (15%): ${decision.momentumScore}/100
- Sentiment (15%): ${decision.sentimentScore}/100
- Risk Penalty (10%): ${decision.riskPenalty}/100

Key Technicals: 200 SMA=$${indicators.sma200}, 50 EMA=$${indicators.ema50}, 20 EMA=$${indicators.ema20}, RSI(14)=${indicators.rsi14}, ATR=$${indicators.atr14}
Key Fundamentals: P/E=${fundamentals?.peRatio ?? 'N/A'}, ROE=${fundamentals?.roe ?? 'N/A'}%, Health=${fundamentals?.financialHealthAssessment ?? 'STABLE'}

Task:
Provide a concise, professional 3-sentence executive summary:
1. Primary analytical stance with clear technical justification.
2. Balance sheet / fundamental backing or risk warning.
3. Definite invalidation condition (price level) for swing traders.`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      if (response && response.text) {
        decision.aiSynthesis = response.text.trim();
      }
    } catch (aiErr) {
      console.warn('Gemini narrative generation skipped, using deterministic template:', aiErr);
    }
  }

  res.json({ success: true, data: decision });
});

// AI Research Copilot Query Endpoint
app.post('/api/ai/copilot', async (req: Request, res: Response) => {
  const { query, activeSymbol } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ success: false, error: 'Query text required' });
  }

  // Gather verified context
  const activeInst = activeSymbol ? GLOBAL_INSTRUMENTS.find(i => i.canonicalSymbol === activeSymbol) : null;
  const activeQuote = activeSymbol ? MOCK_QUOTES[activeSymbol] : null;
  const activeFund = activeSymbol ? MOCK_FUNDAMENTALS[activeSymbol] : null;

  const contextData = {
    globalIndices: GLOBAL_INDICES.map(i => `${i.name}: ${i.price} (${i.changePercent > 0 ? '+' : ''}${i.changePercent}%)`),
    topInstruments: GLOBAL_INSTRUMENTS.slice(0, 8).map(i => {
      const q = MOCK_QUOTES[i.canonicalSymbol];
      return `${i.companyName} (${i.canonicalSymbol}): ${q ? q.price : 'N/A'} ${i.currency}, Latency: ${i.dataLatency}`;
    }),
    selectedStock: activeInst ? {
      name: activeInst.companyName,
      ticker: activeInst.canonicalSymbol,
      exchange: activeInst.exchangeName,
      price: activeQuote?.price,
      changePercent: activeQuote?.changePercent,
      peRatio: activeFund?.peRatio,
      roe: activeFund?.roe,
      debtToEquity: activeFund?.debtToEquity,
    } : 'None selected',
  };

  if (!aiClient || !process.env.GEMINI_API_KEY) {
    // Deterministic fallback response if API key is not yet configured
    return res.json({
      success: true,
      answer: `[Grounded Response] Based on the current verified data in GlobalStock Intelligence:
• ${activeInst ? `${activeInst.companyName} (${activeInst.canonicalSymbol}) trades at ${activeQuote?.price} ${activeQuote?.currency} with P/E ${activeFund?.peRatio}x and ROE ${activeFund?.roe}%.` : 'Global indices are displaying moderate upward momentum.'}
• Swing trading setups demand maintaining strict risk/reward ratios ($\ge 2.0$) and invalidation levels anchored to verified ATR volatility buffers.
*Note: Connect your Gemini API Key in Settings to unlock dynamic generative synthesis.*`,
      sources: [activeSymbol || 'Global Market Feeds'],
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const prompt = `You are the lead FinTech AI Research Assistant for GlobalStock Intelligence.
Answer the user's inquiry based strictly on the verified factual context below.
DO NOT invent financial figures or claim guaranteed returns. Always display timestamps and relevant risk caveats.

VERIFIED APPLICATION CONTEXT:
${JSON.stringify(contextData, null, 2)}

USER QUESTION:
"${query}"

GUIDELINES:
- Provide an objective, evidence-based, concise answer.
- Highlight specific technical levels (support/resistance/EMAs) and fundamental metrics where applicable.
- Emphasize risk parameters and swing-trading invalidation conditions.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    res.json({
      success: true,
      answer: response.text?.trim() || 'No response generated.',
      sources: [activeSymbol || 'Global Markets Engine'],
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('Gemini copilot error:', errMsg);
    res.status(500).json({ success: false, error: errMsg });
  }
});

// Verified News
app.get('/api/news', (req: Request, res: Response) => {
  const ticker = req.query.ticker as string;
  let news = MOCK_NEWS;
  if (ticker && ticker !== 'ALL') {
    news = news.filter(n => n.relevantTicker === ticker);
  }
  res.json({ success: true, count: news.length, data: news });
});

// Paper Trading Endpoints
app.get('/api/paper/account', (_req: Request, res: Response) => {
  updateAccountEquity();
  res.json({
    success: true,
    account: paperAccount,
    positions: paperPositions,
    orders: paperOrders,
  });
});

app.post('/api/paper/order', (req: Request, res: Response) => {
  const { canonicalSymbol, side, type, quantity, limitPrice, stopPrice, takeProfitPrice } = req.body;

  if (!canonicalSymbol || !side || !type || !quantity || quantity <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid order parameters' });
  }

  const quote = MOCK_QUOTES[canonicalSymbol];
  const inst = GLOBAL_INSTRUMENTS.find(i => i.canonicalSymbol === canonicalSymbol);
  if (!quote || !inst) {
    return res.status(404).json({ success: false, error: 'Symbol not found' });
  }

  const executionPrice = type === 'LIMIT' && limitPrice ? Number(limitPrice) : quote.price;
  const orderValue = executionPrice * quantity;
  const fee = Number(Math.max(1.0, orderValue * 0.0005).toFixed(2));
  const slippage = Number((orderValue * 0.0002).toFixed(2));

  if (side === 'BUY') {
    const totalCost = orderValue + fee + slippage;
    if (paperAccount.cashBalance < totalCost) {
      return res.status(400).json({
        success: false,
        error: `Insufficient virtual cash balance. Required: $${totalCost.toFixed(2)}, Available: $${paperAccount.cashBalance.toFixed(2)}`,
      });
    }

    paperAccount.cashBalance = Number((paperAccount.cashBalance - totalCost).toFixed(2));

    // Update or add position
    const existingIndex = paperPositions.findIndex(p => p.canonicalSymbol === canonicalSymbol);
    if (existingIndex >= 0) {
      const existing = paperPositions[existingIndex];
      const newTotalShares = existing.shares + quantity;
      const newAvg = (existing.shares * existing.averageEntryPrice + quantity * executionPrice) / newTotalShares;
      existing.shares = newTotalShares;
      existing.averageEntryPrice = Number(newAvg.toFixed(2));
      if (stopPrice) existing.stopLoss = Number(stopPrice);
      if (takeProfitPrice) existing.takeProfit = Number(takeProfitPrice);
    } else {
      paperPositions.push({
        canonicalSymbol,
        companyName: inst.companyName,
        shares: quantity,
        averageEntryPrice: executionPrice,
        currentPrice: quote.price,
        marketValue: Number((quantity * quote.price).toFixed(2)),
        unrealizedPnL: 0,
        unrealizedPnLPercent: 0,
        realizedPnL: 0,
        currency: inst.currency,
        stopLoss: stopPrice ? Number(stopPrice) : undefined,
        takeProfit: takeProfitPrice ? Number(takeProfitPrice) : undefined,
      });
    }
  } else if (side === 'SELL') {
    const existingIndex = paperPositions.findIndex(p => p.canonicalSymbol === canonicalSymbol);
    if (existingIndex < 0 || paperPositions[existingIndex].shares < quantity) {
      return res.status(400).json({
        success: false,
        error: `Insufficient shares to sell. Available: ${existingIndex >= 0 ? paperPositions[existingIndex].shares : 0}`,
      });
    }

    const pos = paperPositions[existingIndex];
    const netProceeds = orderValue - fee - slippage;
    const realized = (executionPrice - pos.averageEntryPrice) * quantity;

    paperAccount.cashBalance = Number((paperAccount.cashBalance + netProceeds).toFixed(2));
    paperAccount.totalRealizedPnL = Number((paperAccount.totalRealizedPnL + realized).toFixed(2));

    pos.shares -= quantity;
    if (pos.shares <= 0) {
      paperPositions.splice(existingIndex, 1);
    }
  }

  const newOrder: SimulatedOrder = {
    id: `ord_${Date.now()}`,
    canonicalSymbol,
    side,
    type,
    quantity,
    price: executionPrice,
    stopPrice: stopPrice ? Number(stopPrice) : undefined,
    takeProfitPrice: takeProfitPrice ? Number(takeProfitPrice) : undefined,
    fillPrice: executionPrice,
    status: 'FILLED',
    estimatedFee: fee,
    estimatedSlippage: slippage,
    createdAt: new Date().toISOString(),
    filledAt: new Date().toISOString(),
  };

  paperOrders.unshift(newOrder);
  paperAccount.tradesCount += 1;
  updateAccountEquity();

  res.json({
    success: true,
    message: `Simulated ${side} order of ${quantity} shares of ${canonicalSymbol} filled at ${executionPrice} ${inst.currency}`,
    order: newOrder,
    account: paperAccount,
  });
});

app.post('/api/paper/reset', (_req: Request, res: Response) => {
  paperAccount = {
    cashBalance: 100000.0,
    initialBalance: 100000.0,
    currency: 'USD',
    equity: 100000.0,
    totalRealizedPnL: 0.0,
    totalUnrealizedPnL: 0.0,
    tradesCount: 0,
    winRate: 0.0,
  };
  paperPositions = [];
  paperOrders = [];
  res.json({ success: true, message: 'Paper trading account reset to $100,000.00', account: paperAccount });
});

// Vite Middleware integration in dev, static files in production
async function startServer() {
  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`GlobalStock Intelligence server running on http://localhost:${PORT}`);
  });
}

startServer();
