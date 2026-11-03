import React, { useState } from 'react';
import { Target, AlertTriangle, ShieldCheck, ArrowRight, DollarSign, Calculator } from 'lucide-react';
import { SwingOpportunity } from '../types/market.ts';

interface RiskCalculatorViewProps {
  initialSetup?: SwingOpportunity | null;
  defaultAccountBalance?: number;
  onSendToPaperTrading: (orderParams: {
    symbol: string;
    shares: number;
    entryPrice: number;
    stopLoss?: number;
    takeProfit?: number;
  }) => void;
}

export const RiskCalculatorView: React.FC<RiskCalculatorViewProps> = ({
  initialSetup,
  defaultAccountBalance = 100000,
  onSendToPaperTrading,
}) => {
  const [accountSize, setAccountSize] = useState<number>(defaultAccountBalance);
  const [riskPercent, setRiskPercent] = useState<number>(1.0); // 1.0% default risk
  const [entryPrice, setEntryPrice] = useState<number>(initialSetup ? initialSetup.entryZone.max : 225.0);
  const [stopLoss, setStopLoss] = useState<number>(initialSetup ? initialSetup.stopLoss : 216.0);
  const [targetPrice, setTargetPrice] = useState<number>(initialSetup ? initialSetup.target1 : 243.0);
  const [symbol, setSymbol] = useState<string>(initialSetup ? initialSetup.canonicalSymbol : 'AAPL.US');

  // Mathematical Calculations
  const riskAmount = Number(((accountSize * riskPercent) / 100).toFixed(2));
  const riskPerShare = Math.max(0.01, entryPrice - stopLoss);
  const calculatedShares = Math.floor(riskAmount / riskPerShare);
  const capitalRequired = Number((calculatedShares * entryPrice).toFixed(2));
  const portfolioAllocation = accountSize > 0 ? Number(((capitalRequired / accountSize) * 100).toFixed(1)) : 0;
  const rewardPerShare = Math.max(0, targetPrice - entryPrice);
  const potentialReward = Number((calculatedShares * rewardPerShare).toFixed(2));
  const rrRatio = riskPerShare > 0 ? Number((rewardPerShare / riskPerShare).toFixed(2)) : 0;

  const isStopValid = stopLoss < entryPrice;
  const isTargetValid = targetPrice > entryPrice;
  const isAllocationHigh = portfolioAllocation > 25.0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold tracking-wider uppercase mb-1">
          <Calculator className="w-4 h-4" />
          Quantitative Risk Management &amp; Position Sizing Engine
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Position Size &amp; Capital Protection Calculator
        </h2>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Determines exact share quantities so that if your stop loss is triggered, you lose no more than your specified risk limit.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Parameters Form */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-2 flex items-center justify-between">
            <span>Trading Parameters</span>
            <span className="font-mono text-xs text-indigo-400">{symbol}</span>
          </div>

          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1">Instrument Symbol</label>
            <input
              type="text"
              value={symbol}
              onChange={e => setSymbol(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1">Total Account Equity ($)</label>
            <input
              type="number"
              value={accountSize}
              onChange={e => setAccountSize(Math.max(1, Number(e.target.value)))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-slate-400 font-medium">Risk Per Trade (%)</label>
              <span className="text-xs font-mono text-emerald-400 font-bold">${riskAmount.toFixed(2)} at risk</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0.25"
                max="5.0"
                step="0.25"
                value={riskPercent}
                onChange={e => setRiskPercent(Number(e.target.value))}
                className="flex-1 accent-indigo-500"
              />
              <span className="font-mono text-white text-sm font-bold w-12 text-right">{riskPercent}%</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Entry Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={entryPrice}
                onChange={e => setEntryPrice(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-sky-400 font-mono text-sm font-bold"
              />
            </div>
            <div>
              <label className="text-[11px] text-rose-400 block mb-1">Stop Loss ($)</label>
              <input
                type="number"
                step="0.01"
                value={stopLoss}
                onChange={e => setStopLoss(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-rose-400 font-mono text-sm font-bold"
              />
            </div>
            <div>
              <label className="text-[11px] text-emerald-400 block mb-1">Target Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={targetPrice}
                onChange={e => setTargetPrice(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-emerald-400 font-mono text-sm font-bold"
              />
            </div>
          </div>

          {!isStopValid && (
            <div className="text-xs text-rose-400 flex items-center gap-1.5 bg-rose-950/20 p-2 rounded border border-rose-900/30">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Stop Loss must be lower than the Entry Price for long trades.
            </div>
          )}

          {!isTargetValid && (
            <div className="text-xs text-rose-400 flex items-center gap-1.5 bg-rose-950/20 p-2 rounded border border-rose-900/30">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Target Price must be higher than the Entry Price.
            </div>
          )}
        </div>

        {/* Calculated Results Panel */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-2 mb-4">
              Calculated Execution Plan
            </div>

            {/* Big Metrics Header */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400 font-mono uppercase">Position Quantity</div>
                <div className="text-2xl font-extrabold text-white font-mono mt-1">
                  {calculatedShares.toLocaleString()} <span className="text-xs font-normal text-slate-400">shares</span>
                </div>
              </div>
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400 font-mono uppercase">Capital Required</div>
                <div className="text-2xl font-extrabold text-sky-400 font-mono mt-1">
                  ${capitalRequired.toLocaleString()}
                </div>
              </div>
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
                <div className="text-xs text-slate-400 font-mono uppercase">Risk / Reward Ratio</div>
                <div className="text-2xl font-extrabold text-indigo-400 font-mono mt-1">
                  {rrRatio}:1
                </div>
              </div>
            </div>

            {/* Breakdown Detail Table */}
            <div className="space-y-2 text-xs font-mono bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Risk per Share</span>
                <span className="text-white font-semibold">${riskPerShare.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Reward per Share</span>
                <span className="text-emerald-400 font-semibold">${rewardPerShare.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Maximum Potential Loss</span>
                <span className="text-rose-400 font-bold">-${riskAmount.toFixed(2)} (-{riskPercent}%)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Potential Profit Target</span>
                <span className="text-emerald-400 font-bold">+${potentialReward.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Portfolio Allocation</span>
                <span className={`font-semibold ${isAllocationHigh ? 'text-amber-400' : 'text-slate-200'}`}>
                  {portfolioAllocation}% of equity
                </span>
              </div>
            </div>

            {isAllocationHigh && (
              <div className="mt-3 text-xs text-amber-300 flex items-center gap-1.5 bg-amber-950/20 p-2.5 rounded-lg border border-amber-900/30">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>
                  High Concentration Warning: This position requires {portfolioAllocation}% of total equity. Consider widening the stop or scaling account size.
                </span>
              </div>
            )}
          </div>

          {/* Action CTA */}
          <div className="mt-5 pt-4 border-t border-slate-800">
            <button
              onClick={() => onSendToPaperTrading({
                symbol,
                shares: calculatedShares,
                entryPrice,
                stopLoss,
                takeProfit: targetPrice,
              })}
              disabled={!isStopValid || !isTargetValid || calculatedShares <= 0}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm"
            >
              <ShieldCheck className="w-4 h-4" />
              Transfer Calculated Plan to Paper Order Ticket
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
