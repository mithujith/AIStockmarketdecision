import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  CandlestickData,
  LineData,
  HistogramData,
  Time,
} from 'lightweight-charts';
import { OHLCVBar, IndicatorSuite } from '../types/market.ts';

interface CandlestickChartProps {
  symbol: string;
  currency: string;
  bars: OHLCVBar[];
  indicators?: IndicatorSuite;
  swingLevels?: {
    entry?: number;
    stopLoss?: number;
    target1?: number;
    target2?: number;
  };
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({
  symbol,
  currency,
  bars,
  indicators,
  swingLevels,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  // Indicator Toggles
  const [showSMA20, setShowSMA20] = useState(true);
  const [showSMA50, setShowSMA50] = useState(true);
  const [showSMA200, setShowSMA200] = useState(true);
  const [showBollinger, setShowBollinger] = useState(false);
  const [showVolume, setShowVolume] = useState(true);

  useEffect(() => {
    if (!chartContainerRef.current || bars.length === 0) return;

    // Clean up previous chart instance
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 480,
      layout: {
        background: { color: '#090D16' },
        textColor: '#94A3B8',
        fontSize: 12,
      },
      grid: {
        vertLines: { color: 'rgba(30, 41, 59, 0.5)' },
        horzLines: { color: 'rgba(30, 41, 59, 0.5)' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#1E293B',
      },
      timeScale: {
        borderColor: '#1E293B',
        timeVisible: true,
      },
    });

    chartRef.current = chart;

    // 1. Candlestick Main Series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10B981',
      downColor: '#EF4444',
      borderVisible: false,
      wickUpColor: '#10B981',
      wickDownColor: '#EF4444',
    });

    const candleData: CandlestickData[] = bars.map(b => ({
      time: b.time as Time,
      open: b.open,
      high: b.high,
      low: b.low,
      close: b.close,
    }));
    candleSeries.setData(candleData);

    // 2. Volume Series
    if (showVolume) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: '#26a69a',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: '', // Set as overlay
      });
      volumeSeries.priceScale().applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });

      const volumeData: HistogramData[] = bars.map(b => ({
        time: b.time as Time,
        value: b.volume,
        color: b.close >= b.open ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)',
      }));
      volumeSeries.setData(volumeData);
    }

    // 3. Technical Indicator Overlays
    const closes = bars.map(b => b.close);

    // Moving Averages
    if (showSMA20 && bars.length >= 20) {
      const sma20Series = chart.addSeries(LineSeries, {
        color: '#38BDF8', // Cyan
        lineWidth: 1,
        title: 'SMA 20',
      });
      const smaData: LineData[] = [];
      let sum = 0;
      for (let i = 0; i < bars.length; i++) {
        sum += closes[i];
        if (i >= 19) {
          if (i > 19) sum -= closes[i - 20];
          smaData.push({ time: bars[i].time as Time, value: Number((sum / 20).toFixed(2)) });
        }
      }
      sma20Series.setData(smaData);
    }

    if (showSMA50 && bars.length >= 50) {
      const sma50Series = chart.addSeries(LineSeries, {
        color: '#F59E0B', // Amber
        lineWidth: 2,
        title: 'SMA 50',
      });
      const smaData: LineData[] = [];
      let sum = 0;
      for (let i = 0; i < bars.length; i++) {
        sum += closes[i];
        if (i >= 49) {
          if (i > 49) sum -= closes[i - 50];
          smaData.push({ time: bars[i].time as Time, value: Number((sum / 50).toFixed(2)) });
        }
      }
      sma50Series.setData(smaData);
    }

    if (showSMA200 && bars.length >= 60) {
      const period = Math.min(bars.length, 200);
      const sma200Series = chart.addSeries(LineSeries, {
        color: '#8B5CF6', // Purple
        lineWidth: 2,
        title: `SMA ${period}`,
      });
      const smaData: LineData[] = [];
      let sum = 0;
      for (let i = 0; i < bars.length; i++) {
        sum += closes[i];
        if (i >= period - 1) {
          if (i > period - 1) sum -= closes[i - period];
          smaData.push({ time: bars[i].time as Time, value: Number((sum / period).toFixed(2)) });
        }
      }
      sma200Series.setData(smaData);
    }

    // Bollinger Bands Overlay
    if (showBollinger && bars.length >= 20) {
      const bbUpper = chart.addSeries(LineSeries, { color: 'rgba(236, 72, 153, 0.7)', lineWidth: 1, title: 'BB Upper' });
      const bbLower = chart.addSeries(LineSeries, { color: 'rgba(236, 72, 153, 0.7)', lineWidth: 1, title: 'BB Lower' });

      const upperData: LineData[] = [];
      const lowerData: LineData[] = [];

      for (let i = 19; i < bars.length; i++) {
        const slice = closes.slice(i - 19, i + 1);
        const mean = slice.reduce((a, b) => a + b, 0) / 20;
        const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / 20;
        const stdDev = Math.sqrt(variance);
        upperData.push({ time: bars[i].time as Time, value: Number((mean + 2 * stdDev).toFixed(2)) });
        lowerData.push({ time: bars[i].time as Time, value: Number((mean - 2 * stdDev).toFixed(2)) });
      }

      bbUpper.setData(upperData);
      bbLower.setData(lowerData);
    }

    // Swing Trade Price Lines (Entry, Stop Loss, Target 1, Target 2)
    if (swingLevels) {
      if (swingLevels.entry) {
        candleSeries.createPriceLine({
          price: swingLevels.entry,
          color: '#3B82F6',
          lineWidth: 2,
          lineStyle: 0,
          axisLabelVisible: true,
          title: 'ENTRY ZONE',
        });
      }
      if (swingLevels.stopLoss) {
        candleSeries.createPriceLine({
          price: swingLevels.stopLoss,
          color: '#EF4444',
          lineWidth: 2,
          lineStyle: 2,
          axisLabelVisible: true,
          title: 'STOP LOSS',
        });
      }
      if (swingLevels.target1) {
        candleSeries.createPriceLine({
          price: swingLevels.target1,
          color: '#10B981',
          lineWidth: 2,
          lineStyle: 1,
          axisLabelVisible: true,
          title: 'TARGET 1 (2R)',
        });
      }
      if (swingLevels.target2) {
        candleSeries.createPriceLine({
          price: swingLevels.target2,
          color: '#059669',
          lineWidth: 1,
          lineStyle: 3,
          axisLabelVisible: true,
          title: 'TARGET 2 (3R+)',
        });
      }
    }

    chart.timeScale().fitContent();

    // Resize Handler
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [bars, showSMA20, showSMA50, showSMA200, showBollinger, showVolume, swingLevels]);

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Top Chart Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-950/80 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2 font-mono">
          <span className="font-bold text-white text-sm">{symbol}</span>
          <span className="text-slate-400">({currency})</span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold text-[11px] border border-emerald-500/20">
            DAILY
          </span>
        </div>

        {/* Indicator Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowSMA20(!showSMA20)}
            className={`px-2.5 py-1 rounded transition-colors font-medium ${
              showSMA20 ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            SMA 20
          </button>
          <button
            onClick={() => setShowSMA50(!showSMA50)}
            className={`px-2.5 py-1 rounded transition-colors font-medium ${
              showSMA50 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            SMA 50
          </button>
          <button
            onClick={() => setShowSMA200(!showSMA200)}
            className={`px-2.5 py-1 rounded transition-colors font-medium ${
              showSMA200 ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            SMA 200
          </button>
          <button
            onClick={() => setShowBollinger(!showBollinger)}
            className={`px-2.5 py-1 rounded transition-colors font-medium ${
              showBollinger ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            Bollinger (20,2)
          </button>
          <button
            onClick={() => setShowVolume(!showVolume)}
            className={`px-2.5 py-1 rounded transition-colors font-medium ${
              showVolume ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            Volume
          </button>
        </div>
      </div>

      {/* Main Chart Canvas Container */}
      <div ref={chartContainerRef} className="w-full relative min-h-[480px]" />

      {/* Indicator Reading Strip */}
      {indicators && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 px-4 py-2.5 bg-slate-950/90 border-t border-slate-800/80 text-[11px] font-mono">
          <div>
            <span className="text-slate-400">RSI(14): </span>
            <span className={`font-semibold ${indicators.rsi14 >= 70 ? 'text-amber-400' : indicators.rsi14 <= 35 ? 'text-emerald-400' : 'text-slate-200'}`}>
              {indicators.rsi14}
            </span>
          </div>
          <div>
            <span className="text-slate-400">MACD: </span>
            <span className={`font-semibold ${indicators.macd.histogram >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {indicators.macd.line} / {indicators.macd.signal} ({indicators.macd.histogram >= 0 ? '+' : ''}{indicators.macd.histogram})
            </span>
          </div>
          <div>
            <span className="text-slate-400">ATR(14): </span>
            <span className="font-semibold text-slate-200">${indicators.atr14}</span>
          </div>
          <div>
            <span className="text-slate-400">ADX: </span>
            <span className="font-semibold text-indigo-300">{indicators.adx14.adx} (+DI {indicators.adx14.plusDI})</span>
          </div>
          <div>
            <span className="text-slate-400">EMA 20/50: </span>
            <span className="font-semibold text-slate-200">${indicators.ema20} / ${indicators.ema50}</span>
          </div>
          <div>
            <span className="text-slate-400">Stoch %K: </span>
            <span className="font-semibold text-slate-200">{indicators.stochastic.k}</span>
          </div>
          <div>
            <span className="text-slate-400">OBV: </span>
            <span className="font-semibold text-slate-200">{indicators.obv.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
};
