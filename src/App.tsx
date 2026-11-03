import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { TerminalView } from './components/TerminalView.tsx';
import { CandlestickChart } from './components/CandlestickChart.tsx';
import { SwingScannerView } from './components/SwingScannerView.tsx';
import { AIDecisionHub } from './components/AIDecisionHub.tsx';
import { FundamentalView } from './components/FundamentalView.tsx';
import { RiskCalculatorView } from './components/RiskCalculatorView.tsx';
import { PaperTradingDesk } from './components/PaperTradingDesk.tsx';
import { NewsSentimentView } from './components/NewsSentimentView.tsx';
import { AICopilotDrawer } from './components/AICopilotDrawer.tsx';

import {
  CanonicalInstrument,
  GlobalIndex,
  MarketQuote,
  OHLCVBar,
  IndicatorSuite,
  FundamentalMetrics,
  SwingOpportunity,
  AIDecisionScore,
  PaperAccount,
  SimulatedPosition,
  SimulatedOrder,
  NewsArticle,
  OrderType,
  OrderSide,
} from './types/market.ts';

export default function App() {
  // Navigation & Active Security State
  const [activeTab, setActiveTab] = useState<string>('terminal');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('AAPL.US');
  const [copilotOpen, setCopilotOpen] = useState<boolean>(false);

  // Application Data Stores
  const [indices, setIndices] = useState<GlobalIndex[]>([]);
  const [instruments, setInstruments] = useState<CanonicalInstrument[]>([]);
  const [quotes, setQuotes] = useState<Record<string, MarketQuote>>({});
  const [bars, setBars] = useState<OHLCVBar[]>([]);
  const [indicators, setIndicators] = useState<IndicatorSuite | undefined>(undefined);
  const [fundamentals, setFundamentals] = useState<FundamentalMetrics | null>(null);
  const [swingSetups, setSwingSetups] = useState<SwingOpportunity[]>([]);
  const [aiDecision, setAiDecision] = useState<AIDecisionScore | null>(null);
  const [news, setNews] = useState<NewsArticle[]>([]);

  // Paper Trading State
  const [paperAccount, setPaperAccount] = useState<PaperAccount>({
    cashBalance: 100000.0,
    initialBalance: 100000.0,
    currency: 'USD',
    equity: 100000.0,
    totalRealizedPnL: 0.0,
    totalUnrealizedPnL: 0.0,
    tradesCount: 0,
    winRate: 0.0,
  });
  const [paperPositions, setPaperPositions] = useState<SimulatedPosition[]>([]);
  const [paperOrders, setPaperOrders] = useState<SimulatedOrder[]>([]);

  // Staged Setup for Risk Calculator & Order Ticket
  const [activeSetupForRisk, setActiveSetupForRisk] = useState<SwingOpportunity | null>(null);

  // Loading flags
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingDecision, setLoadingDecision] = useState(false);
  const [loadingFundamentals, setLoadingFundamentals] = useState(false);

  // Initial Data Fetch
  useEffect(() => {
    // 1. Indices
    fetch('/api/market/indices')
      .then(res => res.json())
      .then(data => { if (data.success) setIndices(data.data); })
      .catch(console.error);

    // 2. Instruments
    fetch('/api/market/instruments')
      .then(res => res.json())
      .then(data => { if (data.success) setInstruments(data.data); })
      .catch(console.error);

    // 3. Quotes
    fetch('/api/market/quotes')
      .then(res => res.json())
      .then(data => { if (data.success) setQuotes(data.data); })
      .catch(console.error);

    // 4. Swing Opportunities
    fetch('/api/scanner/swing')
      .then(res => res.json())
      .then(data => { if (data.success) setSwingSetups(data.data); })
      .catch(console.error);

    // 5. News
    fetch('/api/news')
      .then(res => res.json())
      .then(data => { if (data.success) setNews(data.data); })
      .catch(console.error);

    // 6. Paper Account
    fetch('/api/paper/account')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPaperAccount(data.account);
          setPaperPositions(data.positions);
          setPaperOrders(data.orders);
        }
      })
      .catch(console.error);
  }, []);

  // Fetch symbol-specific data when selectedSymbol changes
  useEffect(() => {
    if (!selectedSymbol) return;

    // Fetch Historical Bars & Indicators
    setLoadingHistory(true);
    fetch(`/api/market/history/${selectedSymbol}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setBars(data.bars);
          setIndicators(data.indicators);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingHistory(false));

    // Fetch Fundamentals
    setLoadingFundamentals(true);
    fetch(`/api/market/fundamentals/${selectedSymbol}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setFundamentals(data.data);
        else setFundamentals(null);
      })
      .catch(() => setFundamentals(null))
      .finally(() => setLoadingFundamentals(false));

    // Fetch 5-Pillar AI Decision
    setLoadingDecision(true);
    fetch(`/api/ai/decision/${selectedSymbol}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setAiDecision(data.data);
      })
      .catch(console.error)
      .finally(() => setLoadingDecision(false));
  }, [selectedSymbol]);

  // Handle Paper Order Placement
  const handlePlaceOrder = async (orderPayload: {
    canonicalSymbol: string;
    side: OrderSide;
    type: OrderType;
    quantity: number;
    limitPrice?: number;
    stopPrice?: number;
    takeProfitPrice?: number;
  }) => {
    const res = await fetch('/api/paper/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to place order');
    }
    // Refresh Account state
    const accRes = await fetch('/api/paper/account');
    const accData = await accRes.json();
    if (accData.success) {
      setPaperAccount(accData.account);
      setPaperPositions(accData.positions);
      setPaperOrders(accData.orders);
    }
  };

  // Close simulated position
  const handleClosePosition = async (symbol: string, shares: number) => {
    await handlePlaceOrder({
      canonicalSymbol: symbol,
      side: 'SELL',
      type: 'MARKET',
      quantity: shares,
    });
  };

  // Reset paper trading account
  const handleResetAccount = async () => {
    const res = await fetch('/api/paper/reset', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      setPaperAccount(data.account);
      setPaperPositions([]);
      setPaperOrders([]);
    }
  };

  const selectedInst = instruments.find(i => i.canonicalSymbol === selectedSymbol) || {
    id: 'inst_fallback',
    canonicalSymbol: selectedSymbol,
    nativeTicker: selectedSymbol.split('.')[0],
    companyName: 'Selected Instrument',
    exchangeCode: 'GLOBAL',
    exchangeName: 'International Exchange',
    countryCode: 'US',
    currency: 'USD',
    sector: 'Equities',
    industry: 'Financial Assets',
    marketCapTier: 'LARGE_CAP',
    dataLatency: 'REALTIME',
    description: '',
  };

  const activeSetup = swingSetups.find(s => s.canonicalSymbol === selectedSymbol);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Global Header */}
      <Header
        instruments={instruments}
        quotes={quotes}
        selectedSymbol={selectedSymbol}
        onSelectSymbol={setSelectedSymbol}
        account={paperAccount}
        onOpenCopilot={() => setCopilotOpen(true)}
        onNavigateToTab={setActiveTab}
        activeTab={activeTab}
      />

      {/* Main App Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {activeTab === 'terminal' && (
          <TerminalView
            indices={indices}
            instruments={instruments}
            quotes={quotes}
            swingSetups={swingSetups}
            selectedSymbol={selectedSymbol}
            onSelectSymbol={setSelectedSymbol}
            onNavigateToTab={setActiveTab}
            onOpenRiskCalcWithSetup={(setup) => {
              setActiveSetupForRisk(setup);
              setSelectedSymbol(setup.canonicalSymbol);
              setActiveTab('risk');
            }}
          />
        )}

        {activeTab === 'chart' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white font-mono">{selectedInst.companyName}</h2>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 font-mono text-slate-300">
                    {selectedInst.canonicalSymbol}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                    selectedInst.dataLatency === 'REALTIME' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {selectedInst.dataLatency}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedInst.exchangeName} &bull; {selectedInst.sector} &bull; Base Currency: {selectedInst.currency}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('scanner')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-200 transition-colors"
                >
                  Scanner Setups
                </button>
                <button
                  onClick={() => setActiveTab('ai')}
                  className="px-3 py-1.5 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/40 text-xs font-semibold rounded-lg transition-colors"
                >
                  5-Pillar AI Analysis
                </button>
                <button
                  onClick={() => setActiveTab('paper')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Paper Trade
                </button>
              </div>
            </div>

            {loadingHistory ? (
              <div className="p-16 text-center bg-slate-900 border border-slate-800 rounded-xl text-slate-400">
                Loading interactive financial chart and indicators...
              </div>
            ) : (
              <CandlestickChart
                symbol={selectedInst.canonicalSymbol}
                currency={selectedInst.currency}
                bars={bars}
                indicators={indicators}
                swingLevels={activeSetup ? {
                  entry: activeSetup.entryZone.max,
                  stopLoss: activeSetup.stopLoss,
                  target1: activeSetup.target1,
                  target2: activeSetup.target2,
                } : undefined}
              />
            )}
          </div>
        )}

        {activeTab === 'scanner' && (
          <SwingScannerView
            opportunities={swingSetups}
            onSelectSetup={(setup) => {
              setSelectedSymbol(setup.canonicalSymbol);
              setActiveTab('chart');
            }}
            onTradeSetup={(setup) => {
              setSelectedSymbol(setup.canonicalSymbol);
              setActiveTab('paper');
            }}
            onOpenRiskCalc={(setup) => {
              setActiveSetupForRisk(setup);
              setSelectedSymbol(setup.canonicalSymbol);
              setActiveTab('risk');
            }}
          />
        )}

        {activeTab === 'ai' && (
          <AIDecisionHub
            decision={aiDecision}
            loading={loadingDecision}
          />
        )}

        {activeTab === 'fundamentals' && (
          <FundamentalView
            instrument={selectedInst}
            fundamentals={fundamentals}
            loading={loadingFundamentals}
          />
        )}

        {activeTab === 'risk' && (
          <RiskCalculatorView
            initialSetup={activeSetupForRisk}
            defaultAccountBalance={paperAccount.equity}
            onSendToPaperTrading={({ symbol, shares, entryPrice, stopLoss, takeProfit }) => {
              setSelectedSymbol(symbol);
              setActiveTab('paper');
              handlePlaceOrder({
                canonicalSymbol: symbol,
                side: 'BUY',
                type: 'BRACKET',
                quantity: shares,
                limitPrice: entryPrice,
                stopPrice: stopLoss,
                takeProfitPrice: takeProfit,
              }).catch(console.error);
            }}
          />
        )}

        {activeTab === 'paper' && (
          <PaperTradingDesk
            account={paperAccount}
            positions={paperPositions}
            orders={paperOrders}
            instruments={instruments}
            selectedSymbol={selectedSymbol}
            onPlaceOrder={handlePlaceOrder}
            onClosePosition={handleClosePosition}
            onResetAccount={handleResetAccount}
          />
        )}

        {activeTab === 'news' && (
          <NewsSentimentView
            news={news}
            selectedTicker={selectedSymbol}
            onSelectTicker={setSelectedSymbol}
          />
        )}
      </main>

      {/* Grounded AI Copilot Drawer */}
      <AICopilotDrawer
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        activeSymbol={selectedSymbol}
      />
    </div>
  );
}
