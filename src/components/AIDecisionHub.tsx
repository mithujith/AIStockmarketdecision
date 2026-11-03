import React from 'react';
import { AIDecisionScore, ScoreRating } from '../types/market.ts';
import { Brain, CheckCircle2, AlertTriangle, ShieldX, TrendingUp, Info } from 'lucide-react';

interface AIDecisionHubProps {
  decision: AIDecisionScore | null;
  loading: boolean;
  onRefresh?: () => void;
}

export const AIDecisionHub: React.FC<AIDecisionHubProps> = ({ decision, loading }) => {
  if (loading) {
    return (
      <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl">
        <Brain className="w-8 h-8 text-indigo-400 animate-pulse mx-auto mb-3" />
        <div className="text-white font-semibold">Running 5-Pillar Analytical Evaluation...</div>
        <p className="text-xs text-slate-400 mt-1">
          Synthesizing technical moving averages, fundamental ratios, sentiment polarity, and risk penalties.
        </p>
      </div>
    );
  }

  if (!decision) {
    return (
      <div className="p-10 text-center bg-slate-900 border border-slate-800 rounded-xl text-slate-400">
        Select an instrument to view its Explainable AI Decision Evaluation.
      </div>
    );
  }

  const getRatingStyle = (rating: ScoreRating) => {
    switch (rating) {
      case 'STRONG_BULLISH':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'BULLISH':
        return 'bg-teal-500/20 text-teal-400 border-teal-500/40';
      case 'NEUTRAL':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'BEARISH':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
      case 'STRONG_BEARISH':
        return 'bg-red-500/20 text-red-400 border-red-500/40';
    }
  };

  const getPillarColor = (score: number) => {
    if (score >= 70) return 'bg-emerald-500';
    if (score >= 50) return 'bg-sky-500';
    if (score >= 35) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="space-y-6">
      {/* Top AI Score Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950/40 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold tracking-wider uppercase mb-1">
              <Brain className="w-4 h-4" />
              Explainable Decision Support
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {decision.companyName} ({decision.canonicalSymbol})
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Deterministic 5-Pillar Multi-Factor Model &bull; Evaluated as of {new Date(decision.timestamp).toLocaleDateString()}
            </p>
          </div>

          {/* Master Score Dial */}
          <div className="flex items-center gap-4 bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
            <div className="text-center">
              <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Composite Score</div>
              <div className="text-3xl font-extrabold text-white font-mono mt-0.5">
                {decision.overallScore}<span className="text-slate-500 text-lg">/100</span>
              </div>
            </div>
            <div className="h-10 w-px bg-slate-800" />
            <div>
              <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Classification</div>
              <div className={`text-xs font-bold px-3 py-1 rounded-full border mt-1 font-mono ${getRatingStyle(decision.rating)}`}>
                {decision.rating.replace('_', ' ')}
              </div>
            </div>
          </div>
        </div>

        {/* 5-Pillar Breakdown Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 mt-6 pt-5 border-t border-slate-800">
          {/* Technical (35%) */}
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Technical (35%)</span>
              <span className="font-mono font-bold text-white">{decision.technicalScore}/100</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full ${getPillarColor(decision.technicalScore)} transition-all duration-500`}
                style={{ width: `${decision.technicalScore}%` }}
              />
            </div>
          </div>

          {/* Fundamental (25%) */}
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Fundamental (25%)</span>
              <span className="font-mono font-bold text-white">{decision.fundamentalScore}/100</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full ${getPillarColor(decision.fundamentalScore)} transition-all duration-500`}
                style={{ width: `${decision.fundamentalScore}%` }}
              />
            </div>
          </div>

          {/* Momentum (15%) */}
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Momentum (15%)</span>
              <span className="font-mono font-bold text-white">{decision.momentumScore}/100</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full ${getPillarColor(decision.momentumScore)} transition-all duration-500`}
                style={{ width: `${decision.momentumScore}%` }}
              />
            </div>
          </div>

          {/* Sentiment (15%) */}
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Sentiment (15%)</span>
              <span className="font-mono font-bold text-white">{decision.sentimentScore}/100</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full ${getPillarColor(decision.sentimentScore)} transition-all duration-500`}
                style={{ width: `${decision.sentimentScore}%` }}
              />
            </div>
          </div>

          {/* Risk Penalty (10% inverted) */}
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Risk Penalty (10%)</span>
              <span className="font-mono font-bold text-rose-400">-{decision.riskPenalty}/100</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-500 transition-all duration-500"
                style={{ width: `${decision.riskPenalty}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* AI Synthesis Summary Box */}
      <div className="bg-indigo-950/20 border border-indigo-900/40 rounded-xl p-5 shadow-md">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold mb-2 uppercase tracking-wide">
          <Brain className="w-4 h-4" />
          Executive Analytical Synthesis &amp; Trade Rationale
        </div>
        <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-line font-sans">
          {decision.aiSynthesis}
        </p>
      </div>

      {/* Detailed Evidence Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Supporting Factors */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-3">
            <CheckCircle2 className="w-4 h-4" />
            Supporting Analytical Evidence ({decision.supportingEvidence.length})
          </div>
          <div className="space-y-2.5">
            {decision.supportingEvidence.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-950/50 p-2.5 rounded-lg border border-emerald-950/30">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Contradicting Factors */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm mb-3">
            <AlertTriangle className="w-4 h-4" />
            Contradicting / Neutral Evidence ({decision.contradictingEvidence.length})
          </div>
          <div className="space-y-2.5">
            {decision.contradictingEvidence.length === 0 ? (
              <div className="text-xs text-slate-500 italic p-3">No major contradictory signals detected.</div>
            ) : (
              decision.contradictingEvidence.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-950/50 p-2.5 rounded-lg border border-amber-950/30">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span>{item}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Risks & Invalidation Rules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Risk Factors */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm mb-3">
            <ShieldX className="w-4 h-4" />
            Identified Risk Factors
          </div>
          <div className="space-y-2">
            {decision.riskFactors.map((rf, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-rose-300/90 bg-rose-950/20 p-2.5 rounded-lg border border-rose-900/30">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                <span>{rf}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Invalidation Conditions */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm mb-3">
            <Info className="w-4 h-4" />
            Setup Invalidation Conditions (Exit Rules)
          </div>
          <div className="space-y-2">
            {decision.invalidationConditions.map((ic, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-sky-200/90 bg-sky-950/20 p-2.5 rounded-lg border border-sky-900/30">
                <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                <span>{ic}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
