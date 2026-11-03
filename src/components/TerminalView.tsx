import React, { useState } from 'react';
import {
  GlobalIndex,
  CanonicalInstrument,
  MarketQuote,
  SwingOpportunity,
} from '../types/market.ts';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ShieldAlert,
  Sparkles,
  Target,
  BarChart2,
  ExternalLink,
  ChevronRight,
  Layers,
} from 'lucide-react';

interface TerminalViewProps {
  indices: GlobalIndex[];
  instruments: CanonicalInstrument[];
  quotes: Record<string, MarketQuote>;
  swingSetups: SwingOpportunity[];
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  onNavigateToTab: (tab: string) => void;
  onOpenRiskCalcWithSetup: (setup: SwingOpportunity) => void;
}

export const TerminalView: React.FC<TerminalViewProps> = ({
  indices,
  instruments,
  quotes,
  swingSetups,
  selectedSymbol,
  onSelectSymbol,
  onNavigateToTab,
  onOpenRiskCalcWithSetup,
}) => {
  const [selectedExchange, setSelectedExchange] = useState<string>('ALL');

  const filteredInstruments = instruments.filter(
    inst => selectedExchange === 'ALL' || inst.exchangeCode === selectedExchange
  );

  return (
    <div className="space-y-6">
      {/* 1. Global Major Market Indices Banner */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
            Global Market Indices &bull; Live &amp; Delayed Feeds
          </h3>
          <span className="text-[11px] font-mono text-slate-500">6 Global Exchanges Monitored</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {indices.map(idx => (
            <div
              key={idx.symbol}
              className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md hover:border-slate-700 transition-all font-mono"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-white truncate">{idx.name}</span>
                <span className={`text-[10px] px-1 py-0.2 rounded font-sans font-semibold ${
                  idx.status === 'OPEN' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'
                }`}>
                  {idx.status}
                </span>
              </div>
              <div className="text-base font-extrabold text-white mt-1">
                {idx.price.toLocaleString()}
              </div>
              <div className={`text-[11px] font-semibold flex items-center gap-0.5 mt-0.5 ${
                idx.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {idx.changePercent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {idx.changePercent >= 0 ? '+' : ''}{idx.changePercent}%
              </div>
              <div className="text-[10px] text-slate-500 font-sans truncate mt-1">
                {idx.exchange}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Top Swing Trading Opportunity Spotlight */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              Algorithmic Swing Trading Setups
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight mt-0.5">
              High-Confluence Swing Setups (Risk/Reward &ge; 2.0)
            </h3>
          </div>
          <button
            onClick={() => onNavigateToTab('scanner')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors self-start sm:self-auto"
          >
            Open Full Scanner ({swingSetups.length} Setups)
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {swingSetups.slice(0, 3).map(opp => (
            <div
              key={opp.id}
              className="bg-slate-950/80 border border-slate-800 hover:border-indigo-500/40 rounded-xl p-4 transition-all shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-white text-sm">{opp.canonicalSymbol}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    R:R {opp.riskRewardRatio}:1
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-200 truncate">{opp.companyName}</div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{opp.description}</p>

                <div className="grid grid-cols-3 gap-1 bg-slate-900 p-2 rounded-lg border border-slate-800 mt-3 font-mono text-[10px]">
                  <div>
                    <span className="text-slate-500 block">Entry</span>
                    <span className="text-sky-400 font-bold">${opp.entryZone.max}</span>
                  </div>
                  <div>
                    <span className="text-rose-500 block">Stop</span>
                    <span className="text-rose-400 font-bold">${opp.stopLoss}</span>
                  </div>
                  <div>
                    <span className="text-emerald-500 block">Target 1</span>
                    <span className="text-emerald-400 font-bold">${opp.target1}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800/80 text-xs">
                <button
                  onClick={() => {
                    onSelectSymbol(opp.canonicalSymbol);
                    onNavigateToTab('chart');
                  }}
                  className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-[11px] transition-colors"
                >
                  Analyze Chart
                </button>
                <button
                  onClick={() => onOpenRiskCalcWithSetup(opp)}
                  className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-[11px] transition-colors flex items-center gap-1"
                >
                  <Target className="w-3 h-3" /> Size Trade
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Global Instruments Watchlist Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Global Equity Watchlist &amp; Exchange Coverage
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Canonical multi-exchange security catalog across US, UK, Europe, India, and Sri Lanka (CSE).
            </p>
          </div>

          {/* Exchange Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
            {[
              { label: 'All Exchanges', code: 'ALL' },
              { label: 'US (NASDAQ)', code: 'XNAS' },
              { label: 'UK (LSE)', code: 'XLON' },
              { label: 'EU (Euronext/XETRA)', code: 'XAMS' },
              { label: 'India (NSE)', code: 'XNSE' },
              { label: 'Sri Lanka (CSE)', code: 'XCOL' },
            ].map(tab => (
              <button
                key={tab.code}
                onClick={() => setSelectedExchange(tab.code)}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  selectedExchange === tab.code
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Watchlist Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800 pb-2">
                <th className="pb-2.5">Security</th>
                <th className="pb-2.5">Exchange</th>
                <th className="pb-2.5">Data Latency</th>
                <th className="pb-2.5">Price</th>
                <th className="pb-2.5">Change (24h)</th>
                <th className="pb-2.5">Market Cap</th>
                <th className="pb-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredInstruments.map(inst => {
                const quote = quotes[inst.canonicalSymbol];
                const isSelected = inst.canonicalSymbol === selectedSymbol;

                return (
                  <tr
                    key={inst.canonicalSymbol}
                    className={`hover:bg-slate-950/60 transition-colors ${
                      isSelected ? 'bg-indigo-950/20' : ''
                    }`}
                  >
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{inst.canonicalSymbol}</span>
                        <span className="text-[10px] text-slate-500 font-sans">({inst.nativeTicker})</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans truncate max-w-[200px]">
                        {inst.companyName}
                      </div>
                    </td>

                    <td className="py-3 text-slate-300 font-sans">
                      <div>{inst.exchangeName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{inst.exchangeCode} &bull; {inst.countryCode}</div>
                    </td>

                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        inst.dataLatency === 'REALTIME'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : inst.dataLatency === 'DELAYED_15M'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {inst.dataLatency}
                      </span>
                    </td>

                    <td className="py-3 font-bold text-white">
                      {quote ? `${quote.price.toFixed(2)} ${inst.currency}` : '—'}
                    </td>

                    <td className="py-3">
                      {quote ? (
                        <span className={`font-semibold flex items-center gap-0.5 ${
                          quote.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {quote.changePercent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {quote.changePercent >= 0 ? '+' : ''}{quote.changePercent}%
                        </span>
                      ) : '—'}
                    </td>

                    <td className="py-3 text-slate-400 font-sans text-[11px]">
                      {quote ? `$${(quote.marketCap / 1e9).toFixed(1)}B` : '—'}
                    </td>

                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 font-sans">
                        <button
                          onClick={() => {
                            onSelectSymbol(inst.canonicalSymbol);
                            onNavigateToTab('chart');
                          }}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-semibold text-[11px] transition-colors"
                          title="Open Chart"
                        >
                          Chart
                        </button>
                        <button
                          onClick={() => {
                            onSelectSymbol(inst.canonicalSymbol);
                            onNavigateToTab('ai');
                          }}
                          className="px-2 py-1 bg-indigo-950/70 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-700/40 rounded font-semibold text-[11px] transition-colors"
                          title="5-Pillar AI Analysis"
                        >
                          AI
                        </button>
                        <button
                          onClick={() => {
                            onSelectSymbol(inst.canonicalSymbol);
                            onNavigateToTab('paper');
                          }}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold text-[11px] transition-colors"
                          title="Paper Trade"
                        >
                          Trade
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
