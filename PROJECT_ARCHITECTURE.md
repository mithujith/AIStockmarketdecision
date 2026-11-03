# GLOBALSTOCK INTELLIGENCE — SYSTEM ARCHITECTURE & FEASIBILITY REPORT (PHASE 1)

**Document Version:** 1.0.0  
**Status:** Under Client Review (Phase 1 Discovery & Architecture)  
**Date:** November 2026  

---

## 1. Project Feasibility Assessment

### 1.1 Executive Summary
GlobalStock Intelligence is engineered as a high-fidelity, institutional-grade FinTech research and decision-support web platform tailored for personal investment and swing-trading workflows. The system decouples raw market data ingestion, quantitative and technical indicator calculations, fundamental evaluation, and LLM-driven explainable intelligence into resilient, verifiable architectural layers.

### 1.2 Core Feasibility Findings
| Dimension | Feasibility Rating | Key Dependencies & Risk Mitigations |
| :--- | :--- | :--- |
| **Global Data Ingestion (US, EU, UK, Asia, India, CSE)** | **High / Tiered** | Tier 1 (US, EU, UK, IN) supported via multi-provider failover (FMP, Alpha Vantage, Twelve Data, Yahoo/Stooq endpoints). Tier 2 (Colombo CSE, specialized emerging markets) requires dedicated scrapers or CSE direct API/delayed endpoints. |
| **Deterministic Technical & Quantitative Engine** | **Very High (100% In-house)** | Pure deterministic mathematical engine implemented in TypeScript/Node (SMA, EMA, ADX, RSI, MACD, Stochastic, ROC, Bollinger Bands, ATR, OBV, VWAP, Pivot Points, Fibonacci) with zero external calculation dependencies. |
| **Swing Trading Strategy Scanner** | **Very High** | Rule-based multi-timeframe condition evaluation (Trend Following, Breakout, Pullback, Reversal, Support/Resistance bounce) with exact mathematical entry zones, ATR-derived stop losses, and target levels. |
| **Fundamental Research Engine** | **High** | Normalized multi-currency financial ratio computation (P/E, Forward P/E, P/B, EV/EBITDA, ROE, ROA, Net Margin, Debt/Equity, Current Ratio, Free Cash Flow, Dividend Yield) with stale-data tracking. |
| **Explainable AI Decision Support** | **Very High** | Deterministic 5-pillar scoring model (Technical 35%, Fundamental 25%, Sentiment 15%, Momentum 15%, Risk Exposure 10%). Server-side Gemini 2.5/Flash used strictly for natural-language narrative synthesis, evidence cross-checking, and news digest—*never* for hallucinating financial figures. |
| **Risk Management & Position Sizing** | **Very High** | Strict quantitative formulas: Kelly Criterion, ATR-based volatility sizing, Fixed Fractional Risk (% of capital), Portfolio VaR, Beta, Sharpe/Sortino ratios, and drawdown guardrails. |
| **Simulated Paper Trading Engine** | **Very High** | Non-brokerage simulated execution ledger supporting Market, Limit, Stop-Loss, and Bracket orders with configurable transaction fees, slippage simulation, mark-to-market valuation, and full trade audit logging. |

---

## 2. Global Market Coverage Strategy & Symbol Canonicalization

### 2.1 The Global Instrument Identity Problem
Global tickers are not globally unique. For instance, `SAN` represents Banco Santander on NYSE (ADR), but also Sanoma on Helsinki (`SAN.HE`), and Sandvik on Stockholm (`SAND.ST`). Furthermore, exchanges like the Colombo Stock Exchange (CSE) utilize dot-notated security identifiers (e.g. `JKH.N0000` for John Keells Holdings).

### 2.2 Canonical Instrument Model
Every financial asset in the system is assigned a deterministic Canonical Instrument Identity:
```typescript
interface CanonicalInstrument {
  id: string;               // UUID / Internal unique hash: e.g. "inst_cse_jkh"
  canonicalSymbol: string;  // Standardized unique symbol: e.g. "JKH.LK", "AAPL.US", "RELIANCE.IN", "AZN.L"
  nativeTicker: string;     // Local exchange ticker: e.g. "JKH.N0000", "AAPL", "500325"
  isin?: string;            // International Securities Identification Number (e.g. US0378331005)
  companyName: string;      // Official legal name
  exchangeCode: string;     // MIC code (e.g. XNYS, XNAS, XLON, XNSE, XBOM, XCOL)
  exchangeName: string;     // "Colombo Stock Exchange", "National Stock Exchange of India", etc.
  countryCode: string;      // ISO 3166-1 alpha-2 (US, GB, DE, IN, LK, JP, SG)
  currency: string;         // Base trading currency (USD, GBP, EUR, INR, LKR, JPY)
  timezone: string;         // IANA Timezone (e.g. "Asia/Colombo", "Asia/Kolkata", "America/New_York")
  marketTier: 'LARGE_CAP' | 'MID_CAP' | 'SMALL_CAP' | 'FRONTIER';
  tradingHours: {
    openUTC: string;        // "04:00"
    closeUTC: string;       // "09:00"
    regularSessionLocal: string; // "09:30 - 14:30"
  };
}
```

### 2.3 Exchange Coverage Matrix
| Region | Exchange | MIC Code | Provider Primary | Provider Backup | Data Latency |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **United States** | NYSE, NASDAQ | XNYS, XNAS | Finnhub / FMP | Alpha Vantage / Polygon | Real-time / 15m Delayed |
| **United Kingdom** | London Stock Exchange (LSE) | XLON | Financial Modeling Prep | Twelve Data | 15m Delayed |
| **Europe** | Euronext, Deutsche Börse (XETRA) | XAMS, XPAR, XETR | FMP / Twelve Data | Alpha Vantage | 15m Delayed |
| **India** | National Stock Exchange (NSE) & BSE | XNSE, XBOM | Twelve Data / FMP | Yahoo Finance Engine | 15m Delayed |
| **Sri Lanka** | Colombo Stock Exchange (CSE) | XCOL | CSE Direct API / Scraping Feed | Delayed EOD feed | 15m Delayed / EOD |
| **Japan & Asia-Pac** | Tokyo (TSE), Hong Kong (HKEX), SGX | XTYO, XHKG, XSES | FMP / Twelve Data | Alpha Vantage | 15m Delayed |

---

## 3. Data Provider Comparative Evaluation & Licensing

| Provider | Global Market Breadth | Historical OHLCV Depth | Fundamentals & Financial Statements | Rate Limits (Free/Standard) | Paid Pricing Tiers | Assessment for GlobalStock Intelligence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Financial Modeling Prep (FMP)** | 90+ global exchanges (US, EU, UK, Asian ADRs, select CSE/India) | 30+ years historical | Extensive 3-statement filings, ratios, DCF, earnings calendar | Free: 250 req/day<br>Starter: $19/mo | $19–$99/month | **Primary Recommendation** for fundamentals, financial statements, and multi-exchange coverage. |
| **Twelve Data** | 100+ exchanges including NSE, BSE, LSE, European bourses | 15+ years intraday & daily | Basic metrics | Free: 8 req/min (800/day)<br>Pro: $29/mo | $29–$79/month | **Best for international technical OHLCV** (India, UK, European stocks). |
| **Finnhub** | Strong US, major global bourses | High quality 1-min to daily | Institutional metrics, insider, earnings, news sentiment | Free: 60 req/min | $50–$500/month | **Best for real-time US quotes**, company news sentiment, and earnings calendars. |
| **Alpha Vantage** | US & top 30 global bourses | 20+ years daily, intraday | Income statement, balance sheet, overview | Free: 25 req/day<br>Premium: $29.99/mo | $29.99–$99/month | Solid fallback provider for US equities and standard technical benchmarks. |
| **Polygon.io** | US equities & options focus | Full tick-level & aggregated | Financials available | Free: 5 API calls/min (US only) | $29–$199/month | Top-tier for US tick/intraday, but lacks direct Asian/CSE emerging coverage. |
| **CSE Direct / Open-Source Feed** | Colombo Stock Exchange (Sri Lanka) exclusively | 5–10 years EOD / daily | Annual reports, CSE announcements | Free public portal / scraping | No commercial fee | Dedicated custom connector required for Sri Lankan equity coverage. |

### Architecture Strategy for Data Ingestion:
1. **Zero-Lock-in Unified Adapter Interface (`IMarketDataProvider`)**: All providers implement standard methods (`getQuote`, `getHistoricalBars`, `getFinancialStatements`, `searchSymbols`).
2. **Local Caching Layer**: In-memory Redis/LRU cache with strict TTLs:
   - Quotes: 60 seconds during active trading hours; 15 minutes off-market.
   - Intraday Candles: 5 minutes.
   - Daily Candles: 12 hours.
   - Financial Statements: 7 days.
3. **Graceful Multi-Source Fallback**: If Primary FMP call fails or hits rate-limit, fallback to Twelve Data, then cached historical data with clear `"DATA_DELAYED"` or `"DATA_CACHED_AS_OF"` tags in UI.

---

## 4. Technical Architecture Diagram

```
+-----------------------------------------------------------------------------------------+
|                                    PRESENTATION LAYER                                   |
|   React 19 SPA + TypeScript + Tailwind CSS v4 + Motion + TradingView Lightweight Charts   |
|   - Terminal Dashboard (Global Indices, Market Breadth, Timezone Conversion)             |
|   - Interactive Charting Workspace (Candlestick, Multi-Timeframe, Overlays, Indicators)  |
|   - Swing Trading Scanner & Setup Cards (Entry Zone, Invalidation, Stop, Targets, R:R)   |
|   - Fundamental Deep-Dive (P/E, ROE, Debt/Equity, 3-Statement Trends, Peer Comp)        |
|   - AI Decision Support Hub (5-Pillar Spider Chart, Explanations, Contradiction Flags)  |
|   - Portfolio & Paper Trading Desk (Virtual Cash, Order Terminal, Slippage/Fee Ledger)  |
|   - AI Research Copilot Drawer (Grounded in Verified Data, Sources & Timestamps)        |
+-----------------------------------------------------------------------------------------+
                                             |
                                             v  REST / Server-Sent Events (SSE)
+-----------------------------------------------------------------------------------------+
|                                   BACKEND APPLICATION                                  |
|                           Express.js / Node.js Engine (Server.ts)                       |
|                                                                                         |
|  +--------------------+  +----------------------+  +---------------------------------+  |
|  | Market Data Engine |  | Technical Engine     |  | Fundamental Engine              |  |
|  | - Provider Router  |  | - SMA/EMA/ADX        |  | - Valuation & Health Scoring    |  |
|  | - Symbol Normalizer|  | - RSI / MACD / Stoch |  | - Earnings & Growth Trends      |  |
|  | - LRU / TTL Cache  |  | - ATR / Bollinger    |  | - Multi-Currency Normalizer     |  |
|  | - Rate-Limit Buffer|  | - Support/Resistance |  | - Peer Benchmarking             |  |
|  +--------------------+  +----------------------+  +---------------------------------+  |
|                                                                                         |
|  +--------------------+  +----------------------+  +---------------------------------+  |
|  | Swing Trade Scanner|  | Risk Engine          |  | Paper Trading Engine            |  |
|  | - Trend Following  |  | - Position Sizing    |  | - Order Book Simulation         |  |
|  | - Pullback & Break |  | - Kelly & Fixed Risk |  | - Slippage & Fee Modeling       |  |
|  | - Bullish X-Overs  |  | - Drawdown & VaR     |  | - Mark-to-Market P&L            |  |
|  | - R:R Filter >=2.0 |  | - Portfolio Beta/Cov |  | - Position & History Ledger     |  |
|  +--------------------+  +----------------------+  +---------------------------------+  |
|                                                                                         |
|  +--------------------+  +----------------------+  +---------------------------------+  |
|  | AI Decision Hub    |  | News & Sentiment     |  | ML Scenario Engine              |  |
|  | - 5-Pillar Score   |  | - NLP Classifier     |  | - Volatility Clustering         |  |
|  | - Gemini Explainer |  | - Deduplication Hub  |  | - Statistical Regime Shift      |  |
|  | - Grounded Answers |  | - Catalyst Scoring   |  | - Anomaly & Volume Spike Det    |  |
|  +--------------------+  +----------------------+  +---------------------------------+  |
+-----------------------------------------------------------------------------------------+
                                             |
                      +----------------------+----------------------+
                      |                                             |
                      v                                             v
        +---------------------------+                 +---------------------------+
        | External Market Providers |                 | Persistent Storage Layer  |
        | - Finnhub / FMP           |                 | - PostgreSQL Schema       |
        | - Twelve Data             |                 | - Local Storage / SQLite  |
        | - Google Gemini 2.5 SDK   |                 | - Trade & Watchlist State |
        +---------------------------+                 +---------------------------+
```

---

## 5. Database Schema & Entity Relationship Diagram (ERD)

```
 [EXCHANGES]
      | 1
      |
      | *
 [INSTRUMENTS] 1 --------- * [HISTORICAL_PRICES (OHLCV)]
      | 1                     (timestamp, open, high, low, close, volume)
      |
      | 1 ------------------- * [FINANCIAL_STATEMENTS]
      |                       (period, revenue, net_income, eps, fcf, debt, equity)
      |
      | 1 ------------------- * [TECHNICAL_INDICATORS_CACHE]
      |                       (timeframe, rsi, macd, sma20/50/200, atr, adx)
      |
      | 1 ------------------- * [NEWS_ARTICLES & SENTIMENT]
      |                       (headline, summary, sentiment_score, source, published_at)
      |
      | 1 ------------------- * [SWING_OPPORTUNITIES]
      |                       (setup_type, entry_min, entry_max, stop_loss, target_1/2, rr)
      |
      | 1 ------------------- * [AI_ANALYSIS_SNAPSHOTS]
      |                       (tech_score, fund_score, sent_score, mom_score, risk_score)
      |
      +---------------------- * [PORTFOLIO_HOLDINGS]
                                      | *
                                      | 1
                              [PORTFOLIO_ACCOUNTS]
                                      | 1
                                      | *
                              [SIMULATED_ORDERS] (order_type, status, price, qty, fill_price)
                                      | 1
                                      | *
                              [SIMULATED_TRANSACTIONS] (fees, slippage, realized_pnl)
```

---

## 6. Technical Indicator Verification & Mathematical Definitions

All calculations are coded deterministically without third-party black-box libraries:
1. **Exponential Moving Average (EMA)**:
   $$\alpha = \frac{2}{N + 1}, \quad EMA_t = Price_t \times \alpha + EMA_{t-1} \times (1 - \alpha)$$
2. **Relative Strength Index (RSI - 14 Wilders)**:
   $$RS = \frac{\text{Smoothed Gain}}{\text{Smoothed Loss}}, \quad RSI = 100 - \frac{100}{1 + RS}$$
3. **Moving Average Convergence Divergence (MACD)**:
   $$\text{MACD Line} = EMA_{12}(Close) - EMA_{26}(Close), \quad \text{Signal Line} = EMA_9(\text{MACD Line}), \quad \text{Histogram} = \text{MACD Line} - \text{Signal Line}$$
4. **Average True Range (ATR - 14)**:
   $$TR = \max(High - Low, |High - Close_{prev}|, |Low - Close_{prev}|)$$
   $$ATR_t = \frac{ATR_{t-1} \times 13 + TR_t}{14}$$
5. **Bollinger Bands (20, 2)**:
   $$Middle = SMA_{20}(Close), \quad Upper = Middle + 2\sigma, \quad Lower = Middle - 2\sigma$$
6. **Average Directional Index (ADX)**:
   Directional movement $+DM$ and $-DM$ smoothed over 14 periods, calculating $DX$ and subsequent smoothed $ADX$.
7. **Volume Weighted Average Price (VWAP)**:
   $$VWAP = \frac{\sum (TypicalPrice_i \times Volume_i)}{\sum Volume_i}, \quad TypicalPrice = \frac{High + Low + Close}{3}$$

---

## 7. Swing Trading Engine: Setups & Invalidation Rules

| Strategy Category | Entry Trigger Conditions | Invalidation / Stop-Loss Level | Profit Target Rules | Minimum Target R:R |
| :--- | :--- | :--- | :--- | :--- |
| **Trend Following (Pullback to EMA)** | Price > 200 SMA; 20 EMA > 50 EMA; pullback to 20/50 EMA with hammer/bullish engulfing candle | Lowest low of the pullback swing minus $1.0 \times ATR$ | Target 1: Recent swing high ($1.5 \times R$); Target 2: Fibonacci 1.618 extension | **2.0 : 1** |
| **Breakout Trading (Resistance + Volume)** | Price breaks above 20-day consolidation high; Volume > 1.5x 20-day Average Volume; ADX > 25 | Breakout candle low or previous resistance line minus $0.5 \times ATR$ | Measured move height of consolidation added to breakout price | **2.5 : 1** |
| **Oversold Reversal (RSI Divergence)** | Lower low in price, higher low in 14 RSI below 40; MACD histogram ticks positive | Lowest wick of the divergence low minus $1.0 \times ATR$ | 50-day SMA or previous breakdown resistance | **2.2 : 1** |
| **Support Bounce (Key Confluence)** | Confluence of horizontal support + 50 EMA + 0.618 Fibonacci level; bullish reversal wick | Breakdown below key support level by $1.2 \times ATR$ | Previous local swing high | **2.0 : 1** |

---

## 8. Explainable AI Decision Support Engine Architecture

### 8.1 5-Pillar Quantitative Scoring Methodology (0–100 Scale)
1. **Technical Pillar (35%)**:
   - Trend Alignment (SMA 20/50/200 stack, ADX strength): 40 pts
   - Momentum (RSI 40–65 sweetspot, MACD bullish crossover): 30 pts
   - Volume Confirmation (OBV uptrend, Relative Volume > 1.2): 30 pts
2. **Fundamental Pillar (25%)**:
   - Valuation (P/E relative to 5-yr avg and sector, PEG < 1.5): 30 pts
   - Profitability (ROE > 15%, Operating Margin expanding): 35 pts
   - Financial Health (Debt/Equity < 1.0, Current Ratio > 1.3, Positive FCF): 35 pts
3. **Price Momentum Pillar (15%)**:
   - 1-month and 3-month relative price velocity vs market index: 60 pts
   - Proximity to 52-week high vs 52-week low: 40 pts
4. **Market & News Sentiment Pillar (15%)**:
   - NLP sentiment score aggregated across verified news articles (past 14 days): 70 pts
   - Earnings surprise history: 30 pts
5. **Risk Exposure Pillar (10% - Inverted Penalty Model)**:
   - Beta > 1.5, High ATR % of price, High Short Interest deduct points from overall score.

**Final Composite AI Score:**
$$\text{Composite Score} = (0.35 \times Tech) + (0.25 \times Fund) + (0.15 \times Mom) + (0.15 \times Sent) + (0.10 \times [100 - RiskPenalty])$$

### 8.2 Role of the LLM (Gemini 2.5 Flash)
- **Role Boundary:** The LLM does *not* calculate numbers. It accepts pre-calculated metrics, timestamps, and verifiable indicators as structured JSON context.
- **Narrative Tasks:**
  1. Generate natural-language synthesis explaining *why* the score was awarded.
  2. List explicit bullish confirmations and contradictory warning signs.
  3. Highlight critical event catalysts (upcoming earnings, ex-dividend dates).
  4. Answer user queries in the AI Research Assistant drawer with exact citations and timestamps.

---

## 9. Risk Management & Position Sizing Engine

The system provides three deterministic position sizing calculators:
1. **Fixed Capital Risk Sizing**:
   $$\text{Position Shares} = \frac{\text{Account Size} \times \text{Risk \% per trade}}{|\text{Entry Price} - \text{Stop Loss Price}|}$$
   Example: \$50,000 account, 1% risk (\$500). Entry = \$150, Stop = \$145 (Risk = \$5/share). Position = 100 shares (\$15,000 capital).
2. **ATR Volatility Sizing**:
   Stop loss dynamic distance:
   $$\text{Stop Distance} = 1.5 \times ATR_{14}$$
3. **Portfolio Protection Guardrails**:
   - Max 20% total portfolio allocation in any single stock.
   - Max 30% concentration in any single sector.
   - Circuit-breaker alert when portfolio unrealized drawdown exceeds 5%.

---

## 10. Paper Trading Simulation Specifications

- **Virtual Capital**: Configurable starting balance (e.g. \$100,000 USD default, multi-currency toggle).
- **Supported Order Types**:
  - `MARKET`: Filled at current verified ask/bid with configurable slippage (default 0.05%).
  - `LIMIT`: Placed into simulated order book; filled only when low $\le$ limit price (buy) or high $\ge$ limit price (sell).
  - `STOP_LOSS`: Triggers market order when stop price breached.
  - `BRACKET (OCO)`: Simultaneous Entry with linked Stop-Loss and Take-Profit orders; executing one cancels the other.
- **Transaction Costs**: Configurable broker commissions (e.g. \$0 flat or \$0.005/share) and exchange transaction levies.
- **Execution Truthfulness**: Orders cannot execute on stale or future data. All orders logged with transaction timestamp, simulated fill price, slippage amount, and fees.

---

## 11. Feature Breakdown by Roadmap Tier

### Tier 1: MVP (Phase 1–6 Core Deliverable)
- Complete responsive Financial Research Terminal UI (Dark/Light terminal theme).
- Global market watchlist with real-time/delayed badge, timezone conversion (US, UK, Europe, India, Sri Lanka).
- Interactive Candlestick Charts (Lightweight Charts) with multi-timeframe switching (1h, 4h, Daily, Weekly).
- Indicator suite: SMA (20, 50, 100, 200), EMA (9, 20, 50, 200), RSI, MACD, Bollinger Bands, ATR, ADX, VWAP, Support/Resistance lines.
- Swing Trading Opportunity Scanner with 4 validated setup archetypes and mathematical Entry / Stop / Target / R:R calculations.
- Comprehensive Fundamental Analysis (P/E, Forward P/E, P/B, EV/EBITDA, ROE, Margins, Debt/Equity, FCF, Dividend).
- 5-Pillar Explainable AI scoring engine with transparent calculation breakdown.
- AI Stock Research Assistant drawer powered by Gemini with verified context grounding.
- Financial news aggregator with NLP sentiment polarity scoring.
- Comprehensive Risk Calculator & Position Sizing module (Fixed risk, ATR risk, Max drawdown).
- Full Paper Trading Desk with virtual balance, simulated Market/Limit/Bracket orders, open positions, and P&L ledger.

### Tier 2: Version 2.0 (Post-MVP Enhancements)
- Automated alerts (email/web push for price breakout, RSI overbought/oversold, AI score change).
- Multi-portfolio management (separate Swing account vs Long-term Dividend account).
- Multi-currency automatic FX conversion for international holdings.
- Custom user indicator builder and scriptable scanner rules.
- Direct broker API webhooks (read-only portfolio sync).

### Tier 3: Future Research (Advanced Quantitative / ML)
- Deep Learning LSTM & XGBoost time-series volatility regime forecasting.
- Automated SEC 10-K / 10-Q filing diff analyzer and management commentary sentiment extraction.
- Institutional order flow and dark pool liquidity estimation models.

---

## 12. Security & Reliability

- **API Secret Isolation**: All provider keys (`GEMINI_API_KEY`, Finnhub, FMP, etc.) stored server-side only in environment variables; zero client exposure.
- **Fail-Safe Data Handling**: Stale data explicitly marked with timestamp; no silent substitution of null metrics with zero.
- **Rate-Limiting & Protection**: In-memory token bucket rate limiters to prevent API exhaustion.
- **Input Sanitization**: Strict validation of tickers, search queries, and simulated order parameters.

---

## 13. Project Verification & Next Steps

This complete technical discovery report details the mathematical foundations, system boundaries, data provider strategy, and roadmap for GlobalStock Intelligence. Upon client review and confirmation, implementation will commence systematically across frontend terminal modules, backend market ingestion, quantitative engines, and paper trading ledgers.
