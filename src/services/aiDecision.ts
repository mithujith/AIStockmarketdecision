import { CanonicalInstrument, IndicatorSuite, FundamentalMetrics, AIDecisionScore, ScoreRating } from '../types/market.ts';

/**
 * 5-Pillar Explainable AI Decision Engine
 * Deterministic scoring framework combined with explainable reasoning.
 */

export function calculateAIDecisionScore(
  instrument: CanonicalInstrument,
  currentPrice: number,
  suite: IndicatorSuite,
  fundamentals?: FundamentalMetrics,
  sentimentScore = 65,
  recentPerformance1M = 4.2
): AIDecisionScore {
  // 1. Technical Pillar (35%)
  let techScore = 50;
  const supportingEvidence: string[] = [];
  const contradictingEvidence: string[] = [];
  const riskFactors: string[] = [];
  const invalidationConditions: string[] = [];

  // Moving Average alignment
  if (currentPrice > suite.sma200) {
    techScore += 12;
    supportingEvidence.push(`Macro Trend: Trading above 200-day SMA ($${suite.sma200}) confirming primary bull trend.`);
  } else {
    techScore -= 15;
    contradictingEvidence.push(`Under 200-day SMA ($${suite.sma200}) indicates macro overhead supply pressure.`);
    riskFactors.push(`Trading below 200 SMA increases breakdown vulnerability.`);
  }

  if (suite.ema20 > suite.ema50) {
    techScore += 8;
    supportingEvidence.push(`Intermediate Trend: 20 EMA ($${suite.ema20}) is stacked above 50 EMA ($${suite.ema50}).`);
  } else {
    techScore -= 8;
    contradictingEvidence.push(`20 EMA ($${suite.ema20}) is below 50 EMA ($${suite.ema50}) indicating short-term loss of momentum.`);
  }

  // RSI
  if (suite.rsi14 >= 45 && suite.rsi14 <= 62) {
    techScore += 10;
    supportingEvidence.push(`RSI(14) at ${suite.rsi14}: Ideal swing-trading sweet spot (neither overbought nor oversold).`);
  } else if (suite.rsi14 > 70) {
    techScore -= 8;
    contradictingEvidence.push(`RSI(14) at ${suite.rsi14}: Approaching overbought conditions; elevated pullback probability.`);
    riskFactors.push(`High RSI increases mean-reversion pullback risk.`);
  } else if (suite.rsi14 < 35) {
    techScore += 5;
    supportingEvidence.push(`RSI(14) at ${suite.rsi14}: Oversold territory with mean-reversion upside potential.`);
  }

  // MACD
  if (suite.macd.histogram > 0) {
    techScore += 8;
    supportingEvidence.push(`MACD histogram positive (+${suite.macd.histogram}) indicating active buyer control.`);
  } else {
    techScore -= 6;
    contradictingEvidence.push(`MACD histogram negative (${suite.macd.histogram}) indicating seller dominance.`);
  }

  // ADX
  if (suite.adx14.adx > 25 && suite.adx14.plusDI > suite.adx14.minusDI) {
    techScore += 7;
    supportingEvidence.push(`ADX trend strength (${suite.adx14.adx}) with +DI (${suite.adx14.plusDI}) exceeding -DI (${suite.adx14.minusDI}).`);
  }

  techScore = Math.max(10, Math.min(95, techScore));

  // 2. Fundamental Pillar (25%)
  let fundScore = 55;
  if (fundamentals) {
    // Valuation
    if (fundamentals.peRatio > 0 && fundamentals.peRatio < 25) {
      fundScore += 10;
      supportingEvidence.push(`Attractive Valuation: P/E of ${fundamentals.peRatio}x is healthy relative to sector peers.`);
    } else if (fundamentals.peRatio > 45) {
      fundScore -= 8;
      contradictingEvidence.push(`High Valuation Multiple: P/E of ${fundamentals.peRatio}x implies elevated growth expectations.`);
      riskFactors.push(`Vulnerable to multiple compression on earnings misses.`);
    }

    // Profitability
    if (fundamentals.roe > 15) {
      fundScore += 12;
      supportingEvidence.push(`High Capital Efficiency: ROE of ${fundamentals.roe}% demonstrates strong compound profitability.`);
    } else if (fundamentals.roe < 5) {
      fundScore -= 10;
      contradictingEvidence.push(`Subdued ROE (${fundamentals.roe}%) indicates muted returns on shareholder equity.`);
    }

    // Financial Health
    if (fundamentals.debtToEquity < 0.8 && fundamentals.currentRatio > 1.2) {
      fundScore += 12;
      supportingEvidence.push(`Robust Balance Sheet: Conservative Debt/Equity of ${fundamentals.debtToEquity} and Current Ratio of ${fundamentals.currentRatio}.`);
    } else if (fundamentals.debtToEquity > 2.0) {
      fundScore -= 12;
      contradictingEvidence.push(`Elevated Leverage: Debt/Equity of ${fundamentals.debtToEquity} poses refinancing risk.`);
      riskFactors.push(`High debt burden in a high interest-rate environment.`);
    }

    // Growth
    if (fundamentals.revenueYoY > 10) {
      fundScore += 8;
      supportingEvidence.push(`Growth Momentum: Topline Revenue expanded +${fundamentals.revenueYoY}% YoY.`);
    } else if (fundamentals.revenueYoY < 0) {
      fundScore -= 10;
      contradictingEvidence.push(`Revenue Contraction: Revenue fell ${fundamentals.revenueYoY}% YoY.`);
    }
  }
  fundScore = Math.max(10, Math.min(95, fundScore));

  // 3. Price Momentum Pillar (15%)
  let momScore = 50;
  if (recentPerformance1M > 8) {
    momScore = 88;
    supportingEvidence.push(`Strong 1-Month Price Velocity (+${recentPerformance1M}%).`);
  } else if (recentPerformance1M > 2) {
    momScore = 70;
    supportingEvidence.push(`Moderate Positive 1-Month Price Momentum (+${recentPerformance1M}%).`);
  } else if (recentPerformance1M < -5) {
    momScore = 32;
    contradictingEvidence.push(`Negative 1-Month Trend (-${Math.abs(recentPerformance1M)}%).`);
  } else {
    momScore = 48;
  }

  // 4. Sentiment Pillar (15%)
  const sentScore = Math.max(15, Math.min(90, sentimentScore));
  if (sentScore > 65) {
    supportingEvidence.push(`Financial news sentiment is positive (Score: ${sentScore}/100) with favorable earnings & product tone.`);
  } else if (sentScore < 45) {
    contradictingEvidence.push(`Market & headline sentiment is subdued (Score: ${sentScore}/100) with cautious analyst revisions.`);
  }

  // 5. Risk Penalty Pillar (10% inverted)
  // Higher volatility (ATR % of price), extreme beta, or high debt increases risk penalty
  const atrPercent = (suite.atr14 / currentPrice) * 100;
  let riskPenalty = 30; // base moderate risk
  if (atrPercent > 3.5) {
    riskPenalty += 25;
    riskFactors.push(`High Daily Volatility: ATR is ${atrPercent.toFixed(1)}% of stock price.`);
  } else if (atrPercent < 1.8) {
    riskPenalty -= 10;
  }

  if (suite.bollingerBands.bandwidth > 15) {
    riskPenalty += 15;
    riskFactors.push(`Bollinger Bandwidth (${suite.bollingerBands.bandwidth.toFixed(1)}%) indicates wide volatility expansion.`);
  }

  riskPenalty = Math.max(10, Math.min(90, riskPenalty));

  // Composite Calculation:
  // Technical (35%), Fundamental (25%), Momentum (15%), Sentiment (15%), Risk Inverted (10%)
  const overallScore = Math.round(
    0.35 * techScore +
    0.25 * fundScore +
    0.15 * momScore +
    0.15 * sentScore +
    0.10 * (100 - riskPenalty)
  );

  let rating: ScoreRating = 'NEUTRAL';
  if (overallScore >= 78) rating = 'STRONG_BULLISH';
  else if (overallScore >= 64) rating = 'BULLISH';
  else if (overallScore >= 45) rating = 'NEUTRAL';
  else if (overallScore >= 32) rating = 'BEARISH';
  else rating = 'STRONG_BEARISH';

  // Invalidation Conditions
  invalidationConditions.push(`Close below 50 EMA ($${suite.ema50}) on above-average daily volume.`);
  invalidationConditions.push(`RSI(14) breakdown under 40 signaling structural loss of buyer support.`);
  if (suite.supportLevels.length > 0) {
    invalidationConditions.push(`Decisive breach below primary key support at $${suite.supportLevels[0]}.`);
  }

  const aiSynthesis = `${instrument.companyName} (${instrument.canonicalSymbol}) displays an overall analytical score of ${overallScore}/100 (${rating.replace('_', ' ')}). Technical alignment is ${techScore > 65 ? 'favorable' : 'neutral'} with key moving averages defended. Fundamental backing provides a score of ${fundScore}/100, supported by ${fundamentals?.financialHealthAssessment || 'stable'} liquidity metrics. Swing-trade thesis remains valid as long as $${suite.ema50} holds on daily closes.`;

  return {
    canonicalSymbol: instrument.canonicalSymbol,
    companyName: instrument.companyName,
    technicalScore: Math.round(techScore),
    fundamentalScore: Math.round(fundScore),
    momentumScore: Math.round(momScore),
    sentimentScore: Math.round(sentScore),
    riskPenalty: Math.round(riskPenalty),
    overallScore,
    rating,
    weights: {
      technical: 0.35,
      fundamental: 0.25,
      momentum: 0.15,
      sentiment: 0.15,
      risk: 0.10,
    },
    supportingEvidence,
    contradictingEvidence,
    riskFactors,
    invalidationConditions,
    aiSynthesis,
    timestamp: new Date().toISOString(),
  };
}
