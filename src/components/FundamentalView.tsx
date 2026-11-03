import React from 'react';
import { FundamentalMetrics, CanonicalInstrument } from '../types/market.ts';
import { Building2, DollarSign, Activity, Percent, ShieldCheck, Scale, AlertCircle } from 'lucide-react';

interface FundamentalViewProps {
  instrument: CanonicalInstrument;
  fundamentals: FundamentalMetrics | null;
  loading: boolean;
}

export const FundamentalView: React.FC<FundamentalViewProps> = ({
  instrument,
  fundamentals,
  loading,
}) => {
  if (loading) {
    return (
      <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl text-slate-400">
        Loading financial statements and fundamental balance sheet ratios...
      </div>
    );
  }

  if (!fundamentals) {
    return (
      <div className="p-10 text-center bg-slate-900 border border-slate-800 rounded-xl text-slate-400">
        No fundamental metrics available for this security.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold tracking-wider uppercase mb-1">
              <Building2 className="w-4 h-4" />
              Fundamental Research &amp; Balance Sheet Intelligence
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {instrument.companyName} ({instrument.canonicalSymbol})
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400">
              <span>{instrument.sector}</span>
              <span>&bull;</span>
              <span>{instrument.industry}</span>
              <span>&bull;</span>
              <span className="font-mono text-slate-300">Reporting: {fundamentals.reportingPeriod}</span>
              {fundamentals.isStale && (
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Stale Report
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-center">
              <div className="text-[10px] text-slate-400 font-mono uppercase">Financial Health</div>
              <div className="text-sm font-bold text-emerald-400 mt-0.5">
                {fundamentals.financialHealthAssessment}
              </div>
            </div>
            <div className="px-3.5 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-center">
              <div className="text-[10px] text-slate-400 font-mono uppercase">Valuation Multiple</div>
              <div className="text-sm font-bold text-sky-400 mt-0.5">
                {fundamentals.valuationAssessment.replace('_', ' ')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Valuation Metrics */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold uppercase mb-3">
              <Scale className="w-4 h-4" />
              Valuation
            </div>
            <div className="space-y-2.5 font-mono text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">P/E Ratio (TTM)</span>
                <span className="font-bold text-white">{fundamentals.peRatio}x</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">Forward P/E</span>
                <span className="font-bold text-slate-200">{fundamentals.forwardPe}x</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">P/B Ratio</span>
                <span className="font-bold text-slate-200">{fundamentals.pbRatio}x</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">PEG Ratio</span>
                <span className="font-bold text-slate-200">{fundamentals.pegRatio}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">EV / EBITDA</span>
                <span className="font-bold text-slate-200">{fundamentals.evToEbitda}x</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Dividend Yield</span>
                <span className="font-bold text-emerald-400">{fundamentals.dividendYield}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Profitability Metrics */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase mb-3">
              <Percent className="w-4 h-4" />
              Profitability &amp; Returns
            </div>
            <div className="space-y-2.5 font-mono text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">Return on Equity (ROE)</span>
                <span className="font-bold text-emerald-400">{fundamentals.roe}%</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">Return on Assets (ROA)</span>
                <span className="font-bold text-slate-200">{fundamentals.roa}%</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">Net Profit Margin</span>
                <span className="font-bold text-slate-200">{fundamentals.netProfitMargin}%</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">Operating Margin</span>
                <span className="font-bold text-slate-200">{fundamentals.operatingMargin}%</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Diluted EPS</span>
                <span className="font-bold text-white">${fundamentals.eps}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Growth Metrics */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase mb-3">
              <Activity className="w-4 h-4" />
              Growth Rates (YoY)
            </div>
            <div className="space-y-2.5 font-mono text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">Revenue Growth</span>
                <span className={`font-bold ${fundamentals.revenueYoY >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {fundamentals.revenueYoY >= 0 ? '+' : ''}{fundamentals.revenueYoY}%
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">EPS Growth</span>
                <span className={`font-bold ${fundamentals.epsYoY >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {fundamentals.epsYoY >= 0 ? '+' : ''}{fundamentals.epsYoY}%
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">Free Cash Flow</span>
                <span className="font-bold text-white">
                  ${fundamentals.freeCashFlow.toLocaleString()}M
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Reporting Currency</span>
                <span className="font-bold text-sky-400">{fundamentals.currency}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Financial Health & Debt */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase mb-3">
              <ShieldCheck className="w-4 h-4" />
              Solvency &amp; Debt Safety
            </div>
            <div className="space-y-2.5 font-mono text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">Debt-to-Equity</span>
                <span className={`font-bold ${fundamentals.debtToEquity > 1.5 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {fundamentals.debtToEquity}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">Current Ratio</span>
                <span className={`font-bold ${fundamentals.currentRatio < 1.0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {fundamentals.currentRatio}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">Interest Coverage</span>
                <span className="font-bold text-slate-200">{fundamentals.interestCoverage}x</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Capital Health</span>
                <span className="font-bold text-emerald-400">{fundamentals.financialHealthAssessment}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
