export type DataLatency = 'REALTIME' | 'DELAYED_15M' | 'EOD';

export type MarketStatus = 'OPEN' | 'CLOSED' | 'PRE_MARKET' | 'AFTER_HOURS';

export interface ExchangeInfo {
  code: string;           // e.g. "XNYS", "XNAS", "XLON", "XNSE", "XCOL", "XETR", "XTYO"
  name: string;
  country: string;
  countryCode: string;    // "US", "GB", "DE", "IN", "LK", "JP"
  city: string;
  currency: string;
  timezone: string;       // IANA timezone
  openLocal: string;      // "09:30"
  closeLocal: string;     // "16:00"
}

export interface CanonicalInstrument {
  id: string;
  canonicalSymbol: string;  // e.g. "AAPL.US", "AZN.L", "RELIANCE.IN", "JKH.LK", "ASML.AS"
  nativeTicker: string;     // "AAPL", "AZN", "RELIANCE", "JKH.N0000", "ASML"
  isin?: string;
  companyName: string;
  exchangeCode: string;
  exchangeName: string;
  countryCode: string;
  currency: string;
  sector: string;
  industry: string;
  marketCapTier: 'MEGA_CAP' | 'LARGE_CAP' | 'MID_CAP' | 'SMALL_CAP';
  dataLatency: DataLatency;
  description: string;
}

export interface MarketQuote {
  canonicalSymbol: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  averageVolume: number;
  marketCap: number;
  currency: string;
  timestamp: string;      // ISO string
  latency: DataLatency;
  exchangeCode: string;
}

export interface GlobalIndex {
  symbol: string;
  name: string;
  exchange: string;
  region: 'Americas' | 'Europe' | 'Asia-Pacific' | 'South Asia';
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  status: MarketStatus;
  localTime: string;
}

export interface OHLCVBar {
  time: string;           // YYYY-MM-DD or ISO timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type Timeframe = '1h' | '4h' | '1d' | '1w';

export interface IndicatorSuite {
  timestamp: string;
  sma20: number;
  sma50: number;
  sma100: number;
  sma200: number;
  ema9: number;
  ema20: number;
  ema50: number;
  ema200: number;
  rsi14: number;
  macd: {
    line: number;
    signal: number;
    histogram: number;
  };
  stochastic: {
    k: number;
    d: number;
  };
  roc: number; // Rate of change %
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
    bandwidth: number;
    percentB: number;
  };
  atr14: number;
  adx14: {
    adx: number;
    plusDI: number;
    minusDI: number;
  };
  vwap: number;
  obv: number;
  supportLevels: number[];
  resistanceLevels: number[];
  fibonacciLevels: {
    level0: number;
    level236: number;
    level382: number;
    level500: number;
    level618: number;
    level786: number;
    level1000: number;
  };
}

export interface FundamentalMetrics {
  canonicalSymbol: string;
  currency: string;
  peRatio: number;
  forwardPe: number;
  pbRatio: number;
  pegRatio: number;
  evToEbitda: number;
  dividendYield: number;
  roe: number;            // %
  roa: number;            // %
  netProfitMargin: number;// %
  operatingMargin: number;// %
  eps: number;
  revenueYoY: number;     // %
  epsYoY: number;         // %
  freeCashFlow: number;   // in millions
  debtToEquity: number;
  currentRatio: number;
  interestCoverage: number;
  valuationAssessment: 'UNDERVALUED' | 'FAIRLY_VALUED' | 'OVERVALUED';
  financialHealthAssessment: 'ROBUST' | 'STABLE' | 'CAUTION' | 'STRESSED';
  reportingPeriod: string;
  isStale: boolean;
}

export type SwingSetupType = 
  | 'PULLBACK_EMA'
  | 'BREAKOUT_RESISTANCE'
  | 'OVERSOLD_REVERSAL'
  | 'SUPPORT_BOUNCE'
  | 'TREND_MOMENTUM';

export interface SwingOpportunity {
  id: string;
  canonicalSymbol: string;
  companyName: string;
  exchangeCode: string;
  currency: string;
  currentPrice: number;
  setupType: SwingSetupType;
  title: string;
  description: string;
  trendDirection: 'BULLISH' | 'NEUTRAL';
  entryZone: {
    min: number;
    max: number;
  };
  invalidationLevel: number;
  stopLoss: number;
  target1: number;
  target2: number;
  riskRewardRatio: number;
  atrVolatility: number;
  technicalEvidence: string[];
  fundamentalContext: string;
  sentimentRating: 'BULLISH' | 'NEUTRAL' | 'CAUTIOUS';
  timestamp: string;
  upcomingCatalyst?: string;
}

export type ScoreRating = 'STRONG_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'STRONG_BEARISH';

export interface AIDecisionScore {
  canonicalSymbol: string;
  companyName: string;
  technicalScore: number;     // 0-100 (Weight: 35%)
  fundamentalScore: number;   // 0-100 (Weight: 25%)
  momentumScore: number;      // 0-100 (Weight: 15%)
  sentimentScore: number;     // 0-100 (Weight: 15%)
  riskPenalty: number;        // 0-100 (Weight: 10% inverted)
  overallScore: number;       // 0-100
  rating: ScoreRating;
  weights: {
    technical: number;
    fundamental: number;
    momentum: number;
    sentiment: number;
    risk: number;
  };
  supportingEvidence: string[];
  contradictingEvidence: string[];
  riskFactors: string[];
  invalidationConditions: string[];
  aiSynthesis: string;
  timestamp: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  sentimentConfidence: number; // 0-100
  relevantTicker: string;
  exchange: string;
  category: 'EARNINGS' | 'MACRO' | 'CORPORATE_ACTION' | 'REGULATORY' | 'PRODUCT';
}

export type OrderType = 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'BRACKET';
export type OrderSide = 'BUY' | 'SELL';
export type OrderStatus = 'PENDING' | 'FILLED' | 'CANCELLED' | 'REJECTED';

export interface SimulatedOrder {
  id: string;
  canonicalSymbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  price: number;              // Target/Limit price or Market price at submission
  stopPrice?: number;
  takeProfitPrice?: number;
  fillPrice?: number;
  status: OrderStatus;
  estimatedFee: number;
  estimatedSlippage: number;
  createdAt: string;
  filledAt?: string;
}

export interface SimulatedPosition {
  canonicalSymbol: string;
  companyName: string;
  shares: number;
  averageEntryPrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  realizedPnL: number;
  currency: string;
  stopLoss?: number;
  takeProfit?: number;
}

export interface PaperAccount {
  cashBalance: number;
  initialBalance: number;
  currency: string;
  equity: number;
  totalRealizedPnL: number;
  totalUnrealizedPnL: number;
  tradesCount: number;
  winRate: number;
}
