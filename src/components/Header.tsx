import React, { useState, useEffect } from 'react';
import {
  Globe,
  Clock,
  TrendingUp,
  TrendingDown,
  Search,
  Sparkles,
  Bot,
  Briefcase,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { CanonicalInstrument, MarketQuote, PaperAccount } from '../types/market.ts';

interface HeaderProps {
  instruments: CanonicalInstrument[];
  quotes: Record<string, MarketQuote>;
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  account: PaperAccount;
  onOpenCopilot: () => void;
  onNavigateToTab: (tab: string) => void;
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({
  instruments,
  quotes,
  selectedSymbol,
  onSelectSymbol,
  account,
  onOpenCopilot,
  onNavigateToTab,
  activeTab,
}) => {
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [timeUTC, setTimeUTC] = useState(new Date().toUTCString());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeUTC(new Date().toUTCString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const searchResults = instruments.filter(
    i =>
      i.canonicalSymbol.toLowerCase().includes(search.toLowerCase()) ||
      i.companyName.toLowerCase().includes(search.toLowerCase()) ||
      i.exchangeName.toLowerCase().includes(search.toLowerCase())
  );

  const selectedInst = instruments.find(i => i.canonicalSymbol === selectedSymbol);
  const currentQuote = quotes[selectedSymbol];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur border-b border-slate-800 text-slate-200">
      {/* Top Global Exchange Clocks Strip */}
      <div className="hidden md:flex items-center justify-between px-6 py-1.5 bg-slate-900/60 border-b border-slate-800/80 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-semibold text-white">GLOBAL TERMINAL</span>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <span className="text-slate-500">NYC: </span>
              <span className="text-emerald-400 font-medium">OPEN</span>
            </div>
            <div>
              <span className="text-slate-500">LON: </span>
              <span className="text-slate-400">CLOSED</span>
            </div>
            <div>
              <span className="text-slate-500">FRA: </span>
              <span className="text-slate-400">CLOSED</span>
            </div>
            <div>
              <span className="text-slate-500">BOM: </span>
              <span className="text-slate-400">CLOSED</span>
            </div>
            <div>
              <span className="text-slate-500">COL (CSE): </span>
              <span className="text-slate-400">CLOSED</span>
            </div>
            <div>
              <span className="text-slate-500">TYO: </span>
              <span className="text-slate-400">CLOSED</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-slate-400">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>UTC: {timeUTC.slice(17, 25)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-400 font-semibold text-[10px]">FEED ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand Logo & Selected Stock Pill */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigateToTab('terminal')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 font-black text-lg tracking-wider">
              G
            </div>
            <div>
              <div className="font-black text-base text-white tracking-tight flex items-center gap-1.5">
                GlobalStock
                <span className="text-[10px] px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded font-mono font-normal">
                  INTELLIGENCE
                </span>
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                FinTech Decision Engine
              </div>
            </div>
          </div>

          {/* Quick Stock Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-xs font-mono transition-colors"
            >
              <span className="font-bold text-white">{selectedSymbol}</span>
              {currentQuote && (
                <span className={`font-semibold ${currentQuote.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ${currentQuote.price} ({currentQuote.changePercent >= 0 ? '+' : ''}{currentQuote.changePercent}%)
                </span>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {searchOpen && (
              <div className="absolute left-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50">
                <input
                  type="text"
                  placeholder="Search global stocks..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 mb-2"
                  autoFocus
                />
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {searchResults.map(inst => (
                    <button
                      key={inst.canonicalSymbol}
                      onClick={() => {
                        onSelectSymbol(inst.canonicalSymbol);
                        setSearchOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-800 transition-colors flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-mono font-bold text-white">{inst.canonicalSymbol}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{inst.companyName}</div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                        {inst.exchangeCode}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Global Tab Navigation */}
        <nav className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-medium">
          <button
            onClick={() => onNavigateToTab('terminal')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'terminal' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Terminal
          </button>
          <button
            onClick={() => onNavigateToTab('chart')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'chart' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Technical Chart
          </button>
          <button
            onClick={() => onNavigateToTab('scanner')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'scanner' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Swing Radar
          </button>
          <button
            onClick={() => onNavigateToTab('ai')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'ai' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            5-Pillar AI
          </button>
          <button
            onClick={() => onNavigateToTab('fundamentals')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'fundamentals' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Fundamentals
          </button>
          <button
            onClick={() => onNavigateToTab('risk')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'risk' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Risk Sizer
          </button>
          <button
            onClick={() => onNavigateToTab('paper')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'paper' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Paper Desk
          </button>
          <button
            onClick={() => onNavigateToTab('news')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'news' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            News
          </button>
        </nav>

        {/* Right CTA Strip: Virtual Equity & AI Copilot */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => onNavigateToTab('paper')}
            className="cursor-pointer hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono"
            title="View Paper Portfolio"
          >
            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
            <div>
              <span className="text-[10px] text-slate-500 uppercase block leading-none">Paper Equity</span>
              <span className="font-bold text-white text-xs">${account.equity.toLocaleString()}</span>
            </div>
          </div>

          <button
            onClick={onOpenCopilot}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/25 transition-all"
          >
            <Bot className="w-4 h-4" />
            <span className="hidden sm:inline">AI Copilot</span>
          </button>
        </div>
      </div>
    </header>
  );
};
