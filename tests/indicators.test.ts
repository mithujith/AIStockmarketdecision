import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateBollingerBands,
  calculateATR,
} from '../src/services/indicators.ts';
import { OHLCVBar } from '../src/types/market.ts';

test('calculateSMA computes correct moving average values', () => {
  const prices = [10, 11, 12, 13, 14, 15];
  const sma3 = calculateSMA(prices, 3);
  // Index 0: 0, Index 1: 0, Index 2: (10+11+12)/3 = 11, Index 3: (11+12+13)/3 = 12
  assert.equal(sma3[2], 11);
  assert.equal(sma3[3], 12);
  assert.equal(sma3[4], 13);
  assert.equal(sma3[5], 14);
});

test('calculateEMA applies proper smoothing multiplier', () => {
  const prices = [10, 10, 10, 10, 20];
  const ema4 = calculateEMA(prices, 4);
  // Initial SMA at index 3 is 10
  assert.equal(ema4[3], 10);
  // Multiplier for period 4 is 2 / (4 + 1) = 0.4
  // EMA at index 4 = (20 - 10) * 0.4 + 10 = 14
  assert.equal(ema4[4], 14);
});

test('calculateRSI stays within standard 0-100 bounds', () => {
  const upwardPrices = Array.from({ length: 30 }, (_, i) => 100 + i * 2);
  const rsi = calculateRSI(upwardPrices, 14);
  const lastRSI = rsi[rsi.length - 1];
  assert.ok(lastRSI >= 70, `Expected overbought RSI for pure upward trend, got ${lastRSI}`);
  assert.ok(lastRSI <= 100);
});

test('calculateBollingerBands maintains Upper > Middle > Lower relationship', () => {
  const prices = [100, 102, 101, 103, 105, 104, 106, 108, 107, 109, 111, 110, 112, 114, 113, 115, 117, 116, 118, 120, 122];
  const bb = calculateBollingerBands(prices, 20, 2);
  const last = prices.length - 1;
  assert.ok(bb.upper[last] > bb.middle[last]);
  assert.ok(bb.middle[last] > bb.lower[last]);
  assert.ok(bb.bandwidth[last] > 0);
});

test('calculateATR computes positive volatility from price ranges', () => {
  const bars: OHLCVBar[] = Array.from({ length: 20 }, (_, i) => ({
    time: `2026-01-${String(i + 1).padStart(2, '0')}`,
    open: 100 + i,
    high: 105 + i,
    low: 95 + i,
    close: 102 + i,
    volume: 1000000,
  }));
  const atr = calculateATR(bars, 14);
  const lastATR = atr[atr.length - 1];
  assert.ok(lastATR >= 9.5 && lastATR <= 11.0, `Expected ATR near 10, got ${lastATR}`);
});
