import React, { useState } from 'react';
import { SwingOpportunity, SwingSetupType } from '../types/market.ts';
import { Target, ShieldAlert, ArrowUpRight, TrendingUp, Sparkles, Filter, ChevronRight } from 'lucide-react';

interface SwingScannerViewProps {
  opportunities: SwingOpportunity[];
  onSelectSetup: (setup: SwingOpportunity) => void;
  onTradeSetup: (setup: SwingOpportunity) => void;
  onOpenRiskCalc: (setup: SwingOpportunity) => void;
}

export const SwingScannerView: React.FC<SwingScannerViewProps> = ({
  opportunities,
  onSelectSetup,
  onTradeSetup,
  onOpenRiskCalc,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = opportunities.filter(opp => {
    const matchesType = filterType === 'ALL' || opp.setupType === filterType;
    const matchesSearch =
      opp.canonicalSymbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getBadgeColor = (type: SwingSetupType) => {
    switch (type) {
      case 'PULLBACK_EMA':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'BREAKOUT_RESISTANCE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'OVERSOLD_REVERSAL':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'SUPPORT_BOUNCE':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Strategy Description */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold tracking-wider uppercase mb-1">
              <Sparkles className="w-4 h-4" />
              Automated Rule-Based Scanner
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Swing Trading Radar &amp; Opportunity Scanner
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Screening global markets for high-probability setups with verified Risk/Reward ratios ($\ge 2.0$), ATR-calibrated stop losses, and explicit invalidation thresholds.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-lg text-center">
              <div className="text-xs text-slate-400 font-mono">CANDIDATES</div>
              <div className="text-lg font-bold text-emerald-400">{opportunities.length} Active</div>
            </div>
            <div className="px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-lg text-center">
              <div className="text-xs text-slate-400 font-mono">MIN R:R RATIO</div>
              <div className="text-lg font-bold text-sky-400">&ge; 2.0 : 1</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Setup Filter:</span>
          </div>
          {['ALL', 'PULLBACK_EMA', 'BREAKOUT_RESISTANCE', 'OVERSOLD_REVERSAL', 'SUPPORT_BOUNCE'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterType === type
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {type === 'ALL' ? 'All Setups' : type.replace('_', ' ')}
            </button>
          ))}
          <input
            type="text"
            placeholder="Search ticker or company..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="ml-auto px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-52"
          />
        </div>
      </div>

      {/* Grid of Opportunity Cards */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl">
          <ShieldAlert className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No Swing Setups Matching Filters</h3>
          <p className="text-sm text-slate-500 mt-1">Try selecting 'All Setups' or clearing your search filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(opp => (
            <div
              key={opp.id}
              className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all rounded-xl p-5 shadow-lg flex flex-col justify-between group"
            >
              <div>
                {/* Header Strip */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-base">{opp.canonicalSymbol}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                        {opp.exchangeCode}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 font-medium truncate max-w-[200px]">
                      {opp.companyName}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-white text-base">
                      {opp.currentPrice} {opp.currency}
                    </div>
                    <span className="text-[11px] font-mono text-emerald-400 flex items-center justify-end gap-0.5">
                      <TrendingUp className="w-3 h-3" />
                      ATR: ${opp.atrVolatility}
                    </span>
                  </div>
                </div>

                {/* Setup Badge & Title */}
                <div className="mb-3">
                  <span className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full border mb-1.5 ${getBadgeColor(opp.setupType)}`}>
                    {opp.setupType.replace('_', ' ')}
                  </span>
                  <h4 className="text-sm font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
                    {opp.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {opp.description}
                  </p>
                </div>

                {/* Core Levels Matrix */}
                <div className="grid grid-cols-3 gap-2 bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 my-3 font-mono text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Entry Zone</div>
                    <div className="font-bold text-sky-400 mt-0.5">
                      ${opp.entryZone.min} - ${opp.entryZone.max}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-rose-400 uppercase">Stop Loss</div>
                    <div className="font-bold text-rose-400 mt-0.5">
                      ${opp.stopLoss}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-emerald-400 uppercase">Target 1 (2R)</div>
                    <div className="font-bold text-emerald-400 mt-0.5">
                      ${opp.target1}
                    </div>
                  </div>
                </div>

                {/* Invalidation & R:R */}
                <div className="flex items-center justify-between text-xs py-1.5 px-2 bg-slate-800/40 rounded border border-slate-700/50 mb-3">
                  <span className="text-slate-400 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    Invalidation: <strong className="text-slate-200">${opp.invalidationLevel}</strong>
                  </span>
                  <span className="font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    R:R {opp.riskRewardRatio}:1
                  </span>
                </div>

                {/* Evidence bullets */}
                <div className="space-y-1 mb-4">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase">Technical Confluence:</div>
                  {opp.technicalEvidence.slice(0, 2).map((ev, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                      <span>{ev}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-800 text-xs">
                <button
                  onClick={() => onSelectSetup(opp)}
                  className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  View Chart
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onOpenRiskCalc(opp)}
                  className="py-2 px-3 bg-indigo-950/70 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-700/40 font-semibold rounded-lg transition-colors flex items-center gap-1"
                  title="Calculate exact position size for your account"
                >
                  <Target className="w-3.5 h-3.5" />
                  Size
                </button>
                <button
                  onClick={() => onTradeSetup(opp)}
                  className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors flex items-center gap-1"
                  title="Simulate paper order"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Trade
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
