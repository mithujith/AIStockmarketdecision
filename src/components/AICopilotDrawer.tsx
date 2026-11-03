import React, { useState } from 'react';
import { Bot, Send, Sparkles, X, ChevronRight, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';

interface AICopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeSymbol: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  sources?: string[];
}

export const AICopilotDrawer: React.FC<AICopilotDrawerProps> = ({
  isOpen,
  onClose,
  activeSymbol,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'ai',
      text: `Hello! I am your GlobalStock Intelligence Research Assistant.
I am strictly grounded in our quantitative database, technical indicators, and verified financial filings.

Ask me about swing setups, moving average confluence, fundamental health, or risk invalidation for ${activeSymbol || 'any global stock'}.`,
      timestamp: new Date().toLocaleTimeString(),
      sources: ['GlobalStock Analytical Engine'],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const promptSuggestions = [
    `What are the swing trade invalidation levels for ${activeSymbol || 'AAPL.US'}?`,
    `Evaluate the P/E and ROE balance sheet health for ${activeSymbol || 'NVDA.US'}.`,
    `Explain the technical confluence supporting the current score.`,
    `Compare valuation metrics against sector averages.`,
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, activeSymbol }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [
          ...prev,
          {
            id: `ai_${Date.now()}`,
            sender: 'ai',
            text: data.answer,
            timestamp: new Date().toLocaleTimeString(),
            sources: data.sources,
          },
        ]);
      } else {
        throw new Error(data.error || 'Failed to fetch AI analysis');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessages(prev => [
        ...prev,
        {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          text: `Error analyzing request: ${msg}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
      {/* Drawer Header */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              AI Research Copilot
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">
                GROUNDED
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Context: {activeSymbol || 'Global Markets'}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Verified Notice */}
      <div className="px-4 py-2 bg-indigo-950/30 border-b border-indigo-900/30 text-[11px] text-indigo-300 flex items-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
        <span>Grounded in deterministic indicators. Never invents numerical data.</span>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[90%] p-3.5 rounded-xl ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-xs'
                  : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-bl-xs'
              }`}
            >
              <div className="whitespace-pre-line leading-relaxed font-sans">{msg.text}</div>
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Sources: {msg.sources.join(', ')}
                </div>
              )}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 font-mono px-1 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {msg.timestamp}
            </span>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono p-3 bg-slate-950/40 rounded-xl border border-slate-800/60 w-fit">
            <Sparkles className="w-4 h-4 animate-spin" />
            Synthesizing verified indicators &amp; fundamentals...
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/60 space-y-1.5">
        <div className="text-[10px] uppercase font-mono text-slate-400">Suggested Inquiries:</div>
        <div className="flex flex-col gap-1 max-h-24 overflow-y-auto">
          {promptSuggestions.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="text-left text-[11px] text-slate-300 hover:text-indigo-300 hover:bg-slate-800/60 px-2.5 py-1 rounded transition-colors truncate flex items-center justify-between"
            >
              <span>{prompt}</span>
              <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="p-4 bg-slate-950 border-t border-slate-800">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask AI Research Copilot about verified data..."
            value={input}
            onChange={e => setInput(e.target.value)}
            className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl transition-colors shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
