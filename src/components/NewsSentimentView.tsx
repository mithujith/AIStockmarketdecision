import React, { useState } from 'react';
import { NewsArticle } from '../types/market.ts';
import { Newspaper, TrendingUp, TrendingDown, Minus, Filter, ExternalLink, Calendar } from 'lucide-react';

interface NewsSentimentViewProps {
  news: NewsArticle[];
  selectedTicker: string;
  onSelectTicker: (ticker: string) => void;
}

export const NewsSentimentView: React.FC<NewsSentimentViewProps> = ({
  news,
  selectedTicker,
  onSelectTicker,
}) => {
  const [filterSentiment, setFilterSentiment] = useState<string>('ALL');

  const filteredNews = news.filter(item => {
    const matchesTicker = selectedTicker === 'ALL' || item.relevantTicker === selectedTicker;
    const matchesSentiment = filterSentiment === 'ALL' || item.sentiment === filterSentiment;
    return matchesTicker && matchesSentiment;
  });

  const getSentimentBadge = (sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL', confidence: number) => {
    switch (sentiment) {
      case 'POSITIVE':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            <TrendingUp className="w-3 h-3" />
            BULLISH ({confidence}%)
          </span>
        );
      case 'NEGATIVE':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
            <TrendingDown className="w-3 h-3" />
            BEARISH ({confidence}%)
          </span>
        );
      case 'NEUTRAL':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            <Minus className="w-3 h-3" />
            NEUTRAL ({confidence}%)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold tracking-wider uppercase mb-1">
              <Newspaper className="w-4 h-4" />
              Financial News &amp; NLP Sentiment Intelligence
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Verified Market Headlines &amp; Catalyst Feeds
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              NLP-classified financial news tracking corporate releases, earnings surprises, regulatory shifts, and management actions with source attribution.
            </p>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {['ALL', 'POSITIVE', 'NEGATIVE', 'NEUTRAL'].map(sent => (
              <button
                key={sent}
                onClick={() => setFilterSentiment(sent)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  filterSentiment === sent
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {sent === 'ALL' ? 'All Sentiment' : sent}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* News Articles List */}
      <div className="space-y-3">
        {filteredNews.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl text-slate-500 text-sm">
            No news items matching selected filters.
          </div>
        ) : (
          filteredNews.map(item => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 transition-all shadow-md group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-white text-xs bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {item.relevantTicker}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {item.exchange}
                  </span>
                  <span className="text-slate-600">&bull;</span>
                  <span className="text-xs font-semibold text-indigo-400">
                    {item.category.replace('_', ' ')}
                  </span>
                  <span className="text-slate-600">&bull;</span>
                  <span className="text-xs text-slate-400 font-medium">
                    {item.source}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {getSentimentBadge(item.sentiment, item.sentimentConfidence)}
                  <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(item.publishedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <h3 className="text-base font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors mt-2">
                {item.title}
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                {item.summary}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
