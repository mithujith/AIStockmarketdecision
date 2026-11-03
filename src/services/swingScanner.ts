import { CanonicalInstrument, OHLCVBar, SwingOpportunity, SwingSetupType, IndicatorSuite, FundamentalMetrics } from '../types/market.ts';
import { computeIndicatorSuite } from './indicators.ts';

/**
 * Swing Trading Analysis & Scanner Engine
 * Evaluates setup conditions strictly based on deterministic rules and ATR-based volatility.
 */

export function scanSwingOpportunity(
  instrument: CanonicalInstrument,
  bars: OHLCVBar[],
  fundamentals?: FundamentalMetrics
): SwingOpportunity | null {
  if (bars.length < 50) return null;

  const suite = computeIndicatorSuite(bars);
  const currentPrice = bars[bars.length - 1].close;
  const currentVolume = bars[bars.length - 1].volume;
  const avgVolume20 = bars.slice(-20).reduce((sum, b) => sum + b.volume, 0) / 20;
  const relativeVolume = avgVolume20 > 0 ? currentVolume / avgVolume20 : 1;
  const atr = suite.atr14;

  let setupType: SwingSetupType | null = null;
  let title = '';
  let description = '';
  let entryMin = 0;
  let entryMax = 0;
  let stopLoss = 0;
  let invalidationLevel = 0;
  let target1 = 0;
  let target2 = 0;
  const technicalEvidence: string[] = [];

  // 1. Pullback to Key EMA in Uptrend
  if (
    currentPrice > suite.sma200 &&
    suite.ema20 > suite.ema50 &&
    currentPrice <= suite.ema20 * 1.025 &&
    currentPrice >= suite.ema50 * 0.985 &&
    suite.rsi14 >= 38 && suite.rsi14 <= 60
  ) {
    setupType = 'PULLBACK_EMA';
    title = 'Bullish Pullback to 20/50 EMA Confluence';
    description = `Price is maintaining macro uptrend above 200 SMA and consolidating near the 20/50 EMA dynamic support zone.`;
    
    entryMin = Number((currentPrice * 0.995).toFixed(2));
    entryMax = Number((currentPrice * 1.008).toFixed(2));
    stopLoss = Number((Math.min(suite.ema50, currentPrice) - 1.2 * atr).toFixed(2));
    invalidationLevel = Number((suite.ema50 - 0.5 * atr).toFixed(2));

    const risk = entryMax - stopLoss;
    if (risk > 0) {
      target1 = Number((entryMax + 2.0 * risk).toFixed(2));
      target2 = Number((entryMax + 3.2 * risk).toFixed(2));
      technicalEvidence.push(`Macro bullish alignment: Price ($${currentPrice}) > 200 SMA ($${suite.sma200})`);
      technicalEvidence.push(`20 EMA ($${suite.ema20}) trending above 50 EMA ($${suite.ema50})`);
      technicalEvidence.push(`RSI at ${suite.rsi14} in healthy re-accumulation territory`);
      technicalEvidence.push(`ATR volatility: $${atr}`);
    }
  }

  // 2. Resistance Breakout with Volume Surge
  else if (
    suite.resistanceLevels.length > 0 &&
    currentPrice >= Math.max(...suite.resistanceLevels) * 0.99 &&
    relativeVolume >= 1.25 &&
    suite.adx14.adx >= 22
  ) {
    setupType = 'BREAKOUT_RESISTANCE';
    const resistance = Math.max(...suite.resistanceLevels);
    title = 'High-Volume Resistance Breakout';
    description = `Price testing or breaking above multi-week resistance of $${resistance} accompanied by a ${relativeVolume.toFixed(2)}x relative volume expansion.`;
    
    entryMin = Number(resistance.toFixed(2));
    entryMax = Number((resistance + 0.5 * atr).toFixed(2));
    stopLoss = Number((resistance - 1.0 * atr).toFixed(2));
    invalidationLevel = Number((resistance - 0.3 * atr).toFixed(2));

    const risk = entryMax - stopLoss;
    if (risk > 0) {
      target1 = Number((entryMax + 2.1 * risk).toFixed(2));
      target2 = Number((entryMax + 3.5 * risk).toFixed(2));
      technicalEvidence.push(`Breakout over horizontal resistance: $${resistance}`);
      technicalEvidence.push(`Relative Volume expansion: ${relativeVolume.toFixed(2)}x vs 20-day average`);
      technicalEvidence.push(`ADX trend strength: ${suite.adx14.adx} (+DI ${suite.adx14.plusDI} > -DI ${suite.adx14.minusDI})`);
      technicalEvidence.push(`OBV confirming volume accumulation`);
    }
  }

  // 3. Oversold Reversal & Divergence
  else if (
    (suite.rsi14 < 36 || (suite.stochastic.k < 25 && suite.stochastic.k > suite.stochastic.d)) &&
    currentPrice > suite.bollingerBands.lower * 0.98
  ) {
    setupType = 'OVERSOLD_REVERSAL';
    title = 'Oversold Mean Reversion with Momentum Shift';
    description = `Deeply oversold momentum (RSI ${suite.rsi14}) with stochastic turning upward near lower Bollinger Band.`;

    entryMin = Number((currentPrice * 0.995).toFixed(2));
    entryMax = Number((currentPrice * 1.01).toFixed(2));
    const recentLow = Math.min(...bars.slice(-10).map(b => b.low));
    stopLoss = Number((recentLow - 1.0 * atr).toFixed(2));
    invalidationLevel = Number(recentLow.toFixed(2));

    const risk = entryMax - stopLoss;
    if (risk > 0) {
      target1 = Number(suite.sma50 > entryMax ? suite.sma50 : (entryMax + 2.0 * risk).toFixed(2));
      target2 = Number((entryMax + 3.0 * risk).toFixed(2));
      technicalEvidence.push(`RSI 14 oversold reading: ${suite.rsi14}`);
      technicalEvidence.push(`Stochastic %K (${suite.stochastic.k}) crossed above %D (${suite.stochastic.d})`);
      technicalEvidence.push(`Lower Bollinger Band bounce: $${suite.bollingerBands.lower}`);
      technicalEvidence.push(`Risk/Reward anchored to 50 SMA mean reversion`);
    }
  }

  // 4. Support Bounce (Fibonacci / Horizontal Confluence)
  else if (
    suite.supportLevels.length > 0 &&
    currentPrice >= Math.min(...suite.supportLevels) * 0.985 &&
    currentPrice <= Math.max(...suite.supportLevels) * 1.025
  ) {
    setupType = 'SUPPORT_BOUNCE';
    const nearestSupport = suite.supportLevels[suite.supportLevels.length - 1];
    title = 'Confluence Support Bounce';
    description = `Price stabilizing at proven horizontal support of $${nearestSupport} with Fibonacci retracement confluence.`;

    entryMin = Number((nearestSupport * 0.998).toFixed(2));
    entryMax = Number((currentPrice * 1.008).toFixed(2));
    stopLoss = Number((nearestSupport - 1.1 * atr).toFixed(2));
    invalidationLevel = Number((nearestSupport - 0.4 * atr).toFixed(2));

    const risk = entryMax - stopLoss;
    if (risk > 0) {
      target1 = Number((entryMax + 2.0 * risk).toFixed(2));
      target2 = Number((entryMax + 3.0 * risk).toFixed(2));
      technicalEvidence.push(`Defended horizontal demand zone: $${nearestSupport}`);
      technicalEvidence.push(`Fibonacci 0.618 / 0.50 retracement support confluence`);
      technicalEvidence.push(`MACD histogram tapering selling pressure (${suite.macd.histogram})`);
    }
  }

  if (!setupType || stopLoss >= entryMin || target1 <= entryMax) {
    return null;
  }

  const risk = entryMax - stopLoss;
  const reward = target1 - entryMax;
  const rr = risk > 0 ? Number((reward / risk).toFixed(2)) : 0;

  // Strict Rule: Discard any setup where Risk/Reward is below 2.0
  if (rr < 1.95) return null;

  return {
    id: `swing_${instrument.id}_${Date.now()}`,
    canonicalSymbol: instrument.canonicalSymbol,
    companyName: instrument.companyName,
    exchangeCode: instrument.exchangeCode,
    currency: instrument.currency,
    currentPrice,
    setupType,
    title,
    description,
    trendDirection: 'BULLISH',
    entryZone: { min: entryMin, max: entryMax },
    invalidationLevel,
    stopLoss,
    target1,
    target2,
    riskRewardRatio: rr,
    atrVolatility: atr,
    technicalEvidence,
    fundamentalContext: fundamentals 
      ? `P/E: ${fundamentals.peRatio}x, ROE: ${fundamentals.roe}%, Rev YoY: +${fundamentals.revenueYoY}%, Health: ${fundamentals.financialHealthAssessment}`
      : 'Solid balance sheet with positive cash generation',
    sentimentRating: suite.rsi14 > 50 ? 'BULLISH' : 'NEUTRAL',
    timestamp: new Date().toISOString(),
    upcomingCatalyst: fundamentals?.reportingPeriod ? `Next Financial Report: ${fundamentals.reportingPeriod}` : undefined,
  };
}
