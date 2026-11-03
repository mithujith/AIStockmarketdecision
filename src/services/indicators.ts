import { OHLCVBar, IndicatorSuite } from '../types/market.ts';

/**
 * Deterministic Technical Analysis Engine
 * Calculates financial indicators rigorously from raw OHLCV series.
 */

// Simple Moving Average (SMA)
export function calculateSMA(data: number[], period: number): number[] {
  const result: number[] = new Array(data.length).fill(0);
  if (data.length < period) return result;

  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  result[period - 1] = sum / period;

  for (let i = period; i < data.length; i++) {
    sum += data[i] - data[i - period];
    result[i] = sum / period;
  }
  return result;
}

// Exponential Moving Average (EMA)
export function calculateEMA(data: number[], period: number): number[] {
  const result: number[] = new Array(data.length).fill(0);
  if (data.length < period) return result;

  const multiplier = 2 / (period + 1);

  // Initialize with SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  result[period - 1] = sum / period;

  // Apply recursive smoothing
  for (let i = period; i < data.length; i++) {
    result[i] = (data[i] - result[i - 1]) * multiplier + result[i - 1];
  }
  return result;
}

// Wilder's Relative Strength Index (RSI - 14)
export function calculateRSI(closes: number[], period = 14): number[] {
  const rsi: number[] = new Array(closes.length).fill(50);
  if (closes.length <= period) return rsi;

  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? Math.abs(diff) : 0);
  }

  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  rsi[period] = avgLoss === 0 ? 100 : 100 - (100 / (1 + (avgGain / avgLoss)));

  for (let i = period + 1; i < closes.length; i++) {
    const currentGain = gains[i - 1];
    const currentLoss = losses[i - 1];

    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

    if (avgLoss === 0) {
      rsi[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      rsi[i] = 100 - (100 / (1 + rs));
    }
  }

  return rsi;
}

// MACD (12, 26, 9)
export function calculateMACD(closes: number[], fast = 12, slow = 26, signalPeriod = 9) {
  const emaFast = calculateEMA(closes, fast);
  const emaSlow = calculateEMA(closes, slow);

  const macdLine: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    macdLine.push(emaFast[i] - emaSlow[i]);
  }

  // Signal line is EMA of MACD Line (effective from slow - 1 + signalPeriod)
  const signalLine = calculateEMA(macdLine.slice(slow - 1), signalPeriod);
  const fullSignalLine = new Array(slow - 1).fill(0).concat(signalLine);

  const histogram: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    histogram.push(macdLine[i] - fullSignalLine[i]);
  }

  return { macdLine, signalLine: fullSignalLine, histogram };
}

// Average True Range (ATR - 14)
export function calculateATR(bars: OHLCVBar[], period = 14): number[] {
  const atr: number[] = new Array(bars.length).fill(0);
  if (bars.length < 2) return atr;

  const tr: number[] = [bars[0].high - bars[0].low];

  for (let i = 1; i < bars.length; i++) {
    const h = bars[i].high;
    const l = bars[i].low;
    const prevC = bars[i - 1].close;
    const trueRange = Math.max(h - l, Math.abs(h - prevC), Math.abs(l - prevC));
    tr.push(trueRange);
  }

  if (bars.length < period) return atr;

  let sumTR = 0;
  for (let i = 0; i < period; i++) {
    sumTR += tr[i];
  }
  atr[period - 1] = sumTR / period;

  for (let i = period; i < bars.length; i++) {
    atr[i] = (atr[i - 1] * (period - 1) + tr[i]) / period;
  }

  return atr;
}

// Bollinger Bands (20, 2)
export function calculateBollingerBands(closes: number[], period = 20, multiplier = 2) {
  const sma = calculateSMA(closes, period);
  const upper: number[] = new Array(closes.length).fill(0);
  const lower: number[] = new Array(closes.length).fill(0);
  const bandwidth: number[] = new Array(closes.length).fill(0);
  const percentB: number[] = new Array(closes.length).fill(0.5);

  for (let i = period - 1; i < closes.length; i++) {
    const slice = closes.slice(i - period + 1, i + 1);
    const mean = sma[i];
    const variance = slice.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    upper[i] = mean + multiplier * stdDev;
    lower[i] = mean - multiplier * stdDev;
    bandwidth[i] = mean > 0 ? ((upper[i] - lower[i]) / mean) * 100 : 0;
    const spread = upper[i] - lower[i];
    percentB[i] = spread > 0 ? (closes[i] - lower[i]) / spread : 0.5;
  }

  return { upper, middle: sma, lower, bandwidth, percentB };
}

// ADX (Average Directional Index - 14)
export function calculateADX(bars: OHLCVBar[], period = 14) {
  const n = bars.length;
  const adxResult = {
    adx: new Array(n).fill(0),
    plusDI: new Array(n).fill(0),
    minusDI: new Array(n).fill(0),
  };
  if (n <= period * 2) return adxResult;

  const tr: number[] = [];
  const plusDM: number[] = [];
  const minusDM: number[] = [];

  for (let i = 1; i < n; i++) {
    const h = bars[i].high;
    const l = bars[i].low;
    const prevH = bars[i - 1].high;
    const prevL = bars[i - 1].low;
    const prevC = bars[i - 1].close;

    tr.push(Math.max(h - l, Math.abs(h - prevC), Math.abs(l - prevC)));

    const upMove = h - prevH;
    const downMove = prevL - l;

    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
  }

  // Smooth TR, +DM, -DM
  let smoothTR = tr.slice(0, period).reduce((a, b) => a + b, 0);
  let smoothPlusDM = plusDM.slice(0, period).reduce((a, b) => a + b, 0);
  let smoothMinusDM = minusDM.slice(0, period).reduce((a, b) => a + b, 0);

  const dxList: number[] = [];

  for (let i = period; i < tr.length; i++) {
    smoothTR = smoothTR - smoothTR / period + tr[i];
    smoothPlusDM = smoothPlusDM - smoothPlusDM / period + plusDM[i];
    smoothMinusDM = smoothMinusDM - smoothMinusDM / period + minusDM[i];

    const pDI = smoothTR > 0 ? (smoothPlusDM / smoothTR) * 100 : 0;
    const mDI = smoothTR > 0 ? (smoothMinusDM / smoothTR) * 100 : 0;
    const diSum = pDI + mDI;
    const dx = diSum > 0 ? (Math.abs(pDI - mDI) / diSum) * 100 : 0;

    dxList.push(dx);
    adxResult.plusDI[i + 1] = pDI;
    adxResult.minusDI[i + 1] = mDI;
  }

  // Smooth DX to get ADX
  if (dxList.length >= period) {
    let adx = dxList.slice(0, period).reduce((a, b) => a + b, 0) / period;
    const startIndex = period * 2;
    adxResult.adx[startIndex] = adx;

    for (let i = period; i < dxList.length; i++) {
      adx = (adx * (period - 1) + dxList[i]) / period;
      if (startIndex + (i - period + 1) < n) {
        adxResult.adx[startIndex + (i - period + 1)] = adx;
      }
    }
  }

  return adxResult;
}

// Volume Weighted Average Price (VWAP)
export function calculateVWAP(bars: OHLCVBar[]): number[] {
  const vwap: number[] = [];
  let cumTypicalVolume = 0;
  let cumVolume = 0;

  for (const bar of bars) {
    const typicalPrice = (bar.high + bar.low + bar.close) / 3;
    cumTypicalVolume += typicalPrice * bar.volume;
    cumVolume += bar.volume;
    vwap.push(cumVolume > 0 ? cumTypicalVolume / cumVolume : typicalPrice);
  }
  return vwap;
}

// On-Balance Volume (OBV)
export function calculateOBV(bars: OHLCVBar[]): number[] {
  const obv: number[] = [0];
  for (let i = 1; i < bars.length; i++) {
    const prev = obv[i - 1];
    if (bars[i].close > bars[i - 1].close) {
      obv.push(prev + bars[i].volume);
    } else if (bars[i].close < bars[i - 1].close) {
      obv.push(prev - bars[i].volume);
    } else {
      obv.push(prev);
    }
  }
  return obv;
}

// Stochastic Oscillator (%K = 14, %D = 3)
export function calculateStochastic(bars: OHLCVBar[], kPeriod = 14, dPeriod = 3) {
  const kList: number[] = [];
  for (let i = 0; i < bars.length; i++) {
    if (i < kPeriod - 1) {
      kList.push(50);
      continue;
    }
    const window = bars.slice(i - kPeriod + 1, i + 1);
    const highestHigh = Math.max(...window.map(b => b.high));
    const lowestLow = Math.min(...window.map(b => b.low));
    const range = highestHigh - lowestLow;
    const k = range > 0 ? ((bars[i].close - lowestLow) / range) * 100 : 50;
    kList.push(k);
  }

  const dList = calculateSMA(kList, dPeriod);
  return { k: kList, d: dList };
}

// Rate of Change (ROC - 12)
export function calculateROC(closes: number[], period = 12): number[] {
  const roc: number[] = new Array(closes.length).fill(0);
  for (let i = period; i < closes.length; i++) {
    const prev = closes[i - period];
    roc[i] = prev !== 0 ? ((closes[i] - prev) / prev) * 100 : 0;
  }
  return roc;
}

// Support and Resistance Levels (Pivot Extremes)
export function identifySupportResistance(bars: OHLCVBar[]): { support: number[]; resistance: number[] } {
  const support: number[] = [];
  const resistance: number[] = [];
  const lookback = 5;

  for (let i = lookback; i < bars.length - lookback; i++) {
    const currentHigh = bars[i].high;
    const currentLow = bars[i].low;

    let isPeak = true;
    let isTrough = true;

    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j === i) continue;
      if (bars[j].high >= currentHigh) isPeak = false;
      if (bars[j].low <= currentLow) isTrough = false;
    }

    if (isPeak) resistance.push(Number(currentHigh.toFixed(2)));
    if (isTrough) support.push(Number(currentLow.toFixed(2)));
  }

  // Filter nearby levels and return the most prominent 3
  const dedupe = (levels: number[]) => {
    const sorted = [...new Set(levels)].sort((a, b) => a - b);
    const result: number[] = [];
    for (const lvl of sorted) {
      if (result.length === 0 || Math.abs(lvl - result[result.length - 1]) / lvl > 0.015) {
        result.push(lvl);
      }
    }
    return result.slice(-3);
  };

  return {
    support: dedupe(support),
    resistance: dedupe(resistance),
  };
}

// Fibonacci Retracements
export function calculateFibonacci(bars: OHLCVBar[]) {
  if (bars.length < 20) {
    const c = bars[bars.length - 1]?.close || 100;
    return {
      level0: c, level236: c, level382: c, level500: c, level618: c, level786: c, level1000: c,
    };
  }
  const recent = bars.slice(-60);
  const high = Math.max(...recent.map(b => b.high));
  const low = Math.min(...recent.map(b => b.low));
  const diff = high - low;

  return {
    level0: Number(high.toFixed(2)),
    level236: Number((high - 0.236 * diff).toFixed(2)),
    level382: Number((high - 0.382 * diff).toFixed(2)),
    level500: Number((high - 0.500 * diff).toFixed(2)),
    level618: Number((high - 0.618 * diff).toFixed(2)),
    level786: Number((high - 0.786 * diff).toFixed(2)),
    level1000: Number(low.toFixed(2)),
  };
}

// Master Suite Aggregator
export function computeIndicatorSuite(bars: OHLCVBar[]): IndicatorSuite {
  const closes = bars.map(b => b.close);
  const n = bars.length;
  const lastIndex = n - 1;

  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  const sma100 = calculateSMA(closes, 100);
  const sma200 = calculateSMA(closes, 200);

  const ema9 = calculateEMA(closes, 9);
  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);
  const ema200 = calculateEMA(closes, 200);

  const rsi = calculateRSI(closes, 14);
  const macd = calculateMACD(closes);
  const stoch = calculateStochastic(bars);
  const roc = calculateROC(closes, 12);
  const bb = calculateBollingerBands(closes, 20, 2);
  const atr = calculateATR(bars, 14);
  const adx = calculateADX(bars, 14);
  const vwap = calculateVWAP(bars);
  const obv = calculateOBV(bars);
  const sr = identifySupportResistance(bars);
  const fib = calculateFibonacci(bars);

  return {
    timestamp: bars[lastIndex]?.time || new Date().toISOString(),
    sma20: Number(sma20[lastIndex]?.toFixed(2) || 0),
    sma50: Number(sma50[lastIndex]?.toFixed(2) || 0),
    sma100: Number(sma100[lastIndex]?.toFixed(2) || 0),
    sma200: Number(sma200[lastIndex]?.toFixed(2) || 0),
    ema9: Number(ema9[lastIndex]?.toFixed(2) || 0),
    ema20: Number(ema20[lastIndex]?.toFixed(2) || 0),
    ema50: Number(ema50[lastIndex]?.toFixed(2) || 0),
    ema200: Number(ema200[lastIndex]?.toFixed(2) || 0),
    rsi14: Number(rsi[lastIndex]?.toFixed(2) || 50),
    macd: {
      line: Number(macd.macdLine[lastIndex]?.toFixed(2) || 0),
      signal: Number(macd.signalLine[lastIndex]?.toFixed(2) || 0),
      histogram: Number(macd.histogram[lastIndex]?.toFixed(2) || 0),
    },
    stochastic: {
      k: Number(stoch.k[lastIndex]?.toFixed(2) || 50),
      d: Number(stoch.d[lastIndex]?.toFixed(2) || 50),
    },
    roc: Number(roc[lastIndex]?.toFixed(2) || 0),
    bollingerBands: {
      upper: Number(bb.upper[lastIndex]?.toFixed(2) || 0),
      middle: Number(bb.middle[lastIndex]?.toFixed(2) || 0),
      lower: Number(bb.lower[lastIndex]?.toFixed(2) || 0),
      bandwidth: Number(bb.bandwidth[lastIndex]?.toFixed(2) || 0),
      percentB: Number(bb.percentB[lastIndex]?.toFixed(2) || 0.5),
    },
    atr14: Number(atr[lastIndex]?.toFixed(2) || 1),
    adx14: {
      adx: Number(adx.adx[lastIndex]?.toFixed(2) || 20),
      plusDI: Number(adx.plusDI[lastIndex]?.toFixed(2) || 20),
      minusDI: Number(adx.minusDI[lastIndex]?.toFixed(2) || 20),
    },
    vwap: Number(vwap[lastIndex]?.toFixed(2) || closes[lastIndex] || 0),
    obv: Math.round(obv[lastIndex] || 0),
    supportLevels: sr.support,
    resistanceLevels: sr.resistance,
    fibonacciLevels: fib,
  };
}
