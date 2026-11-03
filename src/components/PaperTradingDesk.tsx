import React, { useState } from 'react';
import {
  PaperAccount,
  SimulatedPosition,
  SimulatedOrder,
  OrderType,
  OrderSide,
  CanonicalInstrument,
} from '../types/market.ts';
import {
  Briefcase,
  DollarSign,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  PlusCircle,
  XCircle,
  Shield,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface PaperTradingDeskProps {
  account: PaperAccount;
  positions: SimulatedPosition[];
  orders: SimulatedOrder[];
  instruments: CanonicalInstrument[];
  selectedSymbol: string;
  onPlaceOrder: (order: {
    canonicalSymbol: string;
    side: OrderSide;
    type: OrderType;
    quantity: number;
    limitPrice?: number;
    stopPrice?: number;
    takeProfitPrice?: number;
  }) => Promise<void>;
  onClosePosition: (symbol: string, shares: number) => Promise<void>;
  onResetAccount: () => Promise<void>;
}

export const PaperTradingDesk: React.FC<PaperTradingDeskProps> = ({
  account,
  positions,
  orders,
  instruments,
  selectedSymbol,
  onPlaceOrder,
  onClosePosition,
  onResetAccount,
}) => {
  const [symbol, setSymbol] = useState(selectedSymbol || 'AAPL.US');
  const [side, setSide] = useState<OrderSide>('BUY');
  const [type, setType] = useState<OrderType>('MARKET');
  const [quantity, setQuantity] = useState<number>(50);
  const [limitPrice, setLimitPrice] = useState<string>('');
  const [stopPrice, setStopPrice] = useState<string>('');
  const [takeProfitPrice, setTakeProfitPrice] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      await onPlaceOrder({
        canonicalSymbol: symbol,
        side,
        type,
        quantity,
        limitPrice: limitPrice ? Number(limitPrice) : undefined,
        stopPrice: stopPrice ? Number(stopPrice) : undefined,
        takeProfitPrice: takeProfitPrice ? Number(takeProfitPrice) : undefined,
      });
      setFeedback({
        type: 'success',
        message: `Simulated ${side} order executed for ${quantity} shares of ${symbol}.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedback({ type: 'error', message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Account Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Equity */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="text-xs text-slate-400 font-mono uppercase">Portfolio Total Equity</div>
          <div className="text-2xl font-extrabold text-white font-mono mt-1">
            ${account.equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Initial Balance: ${account.initialBalance.toLocaleString()}
          </div>
        </div>

        {/* Cash Balance */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="text-xs text-slate-400 font-mono uppercase">Available Virtual Cash</div>
          <div className="text-2xl font-extrabold text-sky-400 font-mono mt-1">
            ${account.cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Currency: {account.currency}
          </div>
        </div>

        {/* Unrealized P&L */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="text-xs text-slate-400 font-mono uppercase">Unrealized Open P&amp;L</div>
          <div className={`text-2xl font-extrabold font-mono mt-1 flex items-center gap-1 ${
            account.totalUnrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {account.totalUnrealizedPnL >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            {account.totalUnrealizedPnL >= 0 ? '+' : ''}${account.totalUnrealizedPnL.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Across {positions.length} active positions
          </div>
        </div>

        {/* Realized P&L */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="text-xs text-slate-400 font-mono uppercase">Realized Closed P&amp;L</div>
            <div className={`text-2xl font-extrabold font-mono mt-1 ${
              account.totalRealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {account.totalRealizedPnL >= 0 ? '+' : ''}${account.totalRealizedPnL.toFixed(2)}
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-400 font-mono">{account.tradesCount} executed trades</span>
            <button
              onClick={() => {
                if (window.confirm('Reset simulated paper trading account to $100,000.00?')) {
                  onResetAccount();
                }
              }}
              className="text-[11px] text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Reset Account
            </button>
          </div>
        </div>
      </div>

      {/* Main Trading Area: Order Ticket & Positions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Order Ticket */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase mb-4">
            <Briefcase className="w-4 h-4" />
            Simulated Order Ticket
          </div>

          {feedback && (
            <div className={`mb-4 p-3 rounded-lg text-xs flex items-start gap-2 ${
              feedback.type === 'success' ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-900/50' : 'bg-rose-950/40 text-rose-300 border border-rose-900/50'
            }`}>
              {feedback.message}
            </div>
          )}

          <form onSubmit={handleSubmitOrder} className="space-y-4 text-xs font-mono">
            {/* Buy / Sell Toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setSide('BUY')}
                className={`py-2 rounded-md font-bold transition-colors ${
                  side === 'BUY' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                BUY / LONG
              </button>
              <button
                type="button"
                onClick={() => setSide('SELL')}
                className={`py-2 rounded-md font-bold transition-colors ${
                  side === 'SELL' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                SELL / SHORT
              </button>
            </div>

            {/* Instrument Select */}
            <div>
              <label className="text-slate-400 block mb-1">Select Instrument</label>
              <select
                value={symbol}
                onChange={e => setSymbol(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-500"
              >
                {instruments.map(inst => (
                  <option key={inst.canonicalSymbol} value={inst.canonicalSymbol}>
                    {inst.canonicalSymbol} — {inst.companyName} ({inst.currency})
                  </option>
                ))}
              </select>
            </div>

            {/* Order Type */}
            <div>
              <label className="text-slate-400 block mb-1">Order Type</label>
              <div className="grid grid-cols-3 gap-2">
                {(['MARKET', 'LIMIT', 'BRACKET'] as OrderType[]).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`py-1.5 px-2 rounded border text-center transition-colors ${
                      type === t ? 'bg-indigo-600 border-indigo-500 text-white font-bold' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="text-slate-400 block mb-1">Share Quantity</label>
              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Limit Price */}
            {type === 'LIMIT' && (
              <div>
                <label className="text-slate-400 block mb-1">Limit Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 225.50"
                  value={limitPrice}
                  onChange={e => setLimitPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sky-400 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {/* Bracket Parameters */}
            {type === 'BRACKET' && (
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="text-rose-400 block mb-1">Stop-Loss Trigger ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 216.00"
                    value={stopPrice}
                    onChange={e => setStopPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-rose-400 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-emerald-400 block mb-1">Take-Profit Target ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 242.00"
                    value={takeProfitPrice}
                    onChange={e => setTakeProfitPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-emerald-400 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* Execution Fee Note */}
            <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Simulated Commission:</span>
                <span className="text-slate-200 font-mono">$1.00 min / 0.05%</span>
              </div>
              <div className="flex justify-between">
                <span>Modeled Slippage:</span>
                <span className="text-slate-200 font-mono">0.02% of value</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-3 rounded-xl font-bold text-sm text-white transition-all shadow-lg ${
                side === 'BUY'
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-rose-600 hover:bg-rose-500'
              }`}
            >
              {submitting ? 'Executing Simulation...' : `Submit Simulated ${side} Order`}
            </button>
          </form>
        </div>

        {/* Open Positions & Execution History */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active Positions Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <span>Open Portfolio Holdings</span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {positions.length}
                </span>
              </div>
            </div>

            {positions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No active positions. Place an order on the ticket to open a simulated holding.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono text-left">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800 pb-2">
                      <th className="pb-2">Security</th>
                      <th className="pb-2">Shares</th>
                      <th className="pb-2">Avg Entry</th>
                      <th className="pb-2">Current</th>
                      <th className="pb-2">Market Value</th>
                      <th className="pb-2">Unrealized P&amp;L</th>
                      <th className="pb-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {positions.map(pos => (
                      <tr key={pos.canonicalSymbol} className="hover:bg-slate-950/40">
                        <td className="py-3">
                          <div className="font-bold text-white">{pos.canonicalSymbol}</div>
                          <div className="text-[10px] text-slate-400 font-sans truncate max-w-[130px]">
                            {pos.companyName}
                          </div>
                        </td>
                        <td className="py-3 text-slate-200">{pos.shares}</td>
                        <td className="py-3 text-slate-300">${pos.averageEntryPrice}</td>
                        <td className="py-3 text-white font-semibold">${pos.currentPrice}</td>
                        <td className="py-3 text-slate-200">${pos.marketValue.toLocaleString()}</td>
                        <td className="py-3">
                          <span className={`font-bold flex items-center gap-0.5 ${
                            pos.unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {pos.unrealizedPnL >= 0 ? '+' : ''}${pos.unrealizedPnL.toFixed(2)}
                            <span className="text-[10px]">({pos.unrealizedPnLPercent >= 0 ? '+' : ''}{pos.unrealizedPnLPercent}%)</span>
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => onClosePosition(pos.canonicalSymbol, pos.shares)}
                            className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded font-sans font-semibold transition-colors text-[11px]"
                          >
                            Close
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Simulated Order History Log */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Simulated Order Audit Trail</span>
            </div>

            <div className="overflow-x-auto max-h-56 overflow-y-auto">
              <table className="w-full text-[11px] font-mono text-left">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800">
                    <th className="pb-2">Timestamp</th>
                    <th className="pb-2">Symbol</th>
                    <th className="pb-2">Side</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Qty</th>
                    <th className="pb-2">Fill Price</th>
                    <th className="pb-2">Fee / Slip</th>
                    <th className="pb-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {orders.map(ord => (
                    <tr key={ord.id} className="hover:bg-slate-950/40">
                      <td className="py-2 text-slate-400">{new Date(ord.createdAt).toLocaleTimeString()}</td>
                      <td className="py-2 font-bold text-white">{ord.canonicalSymbol}</td>
                      <td className="py-2">
                        <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                          ord.side === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {ord.side}
                        </span>
                      </td>
                      <td className="py-2 text-slate-300">{ord.type}</td>
                      <td className="py-2 text-slate-200">{ord.quantity}</td>
                      <td className="py-2 text-white font-semibold">${ord.fillPrice || ord.price}</td>
                      <td className="py-2 text-slate-400">${ord.estimatedFee} / ${ord.estimatedSlippage}</td>
                      <td className="py-2 text-right">
                        <span className="text-emerald-400 font-bold">{ord.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
