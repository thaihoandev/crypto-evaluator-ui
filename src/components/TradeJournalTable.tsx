import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TradeResponse, CloseTradeRequest } from '../types/trade';
import { BookOpen, CheckCircle, XCircle, Clock, RefreshCw, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface TradeJournalTableProps {
  trades: TradeResponse[];
  onCloseTrade: (id: string, request: CloseTradeRequest) => Promise<void>;
  onSelectTrade: (id: string) => void;
}

export const TradeJournalTable: React.FC<TradeJournalTableProps> = ({
  trades,
  onCloseTrade,
  onSelectTrade
}) => {
  const { t } = useLanguage();

  const [selectedTradeForClose, setSelectedTradeForClose] = useState<TradeResponse | null>(null);
  const [exitPrice, setExitPrice] = useState<number>(0);
  const [exitReason, setExitReason] = useState<string>('Take Profit');
  const [notes, setNotes] = useState<string>('');
  const [isSubmittingClose, setIsSubmittingClose] = useState(false);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = trades.length;
    const open = trades.filter((t) => t.status === 'Open').length;
    const closed = trades.filter((t) => t.status === 'Closed');
    let totalPnl = 0;
    let winCount = 0;

    closed.forEach((t: any) => {
      if (t.realizedPnl != null) {
        totalPnl += t.realizedPnl;
        if (t.realizedPnl > 0) winCount++;
      }
    });

    const winRate = closed.length > 0 ? (winCount / closed.length) * 100 : 0;

    return { total, open, closedCount: closed.length, totalPnl, winRate };
  }, [trades]);

  const handleOpenCloseModal = (trade: TradeResponse) => {
    setSelectedTradeForClose(trade);
    setExitPrice(trade.takeProfit);
    setExitReason('Take Profit');
    setNotes('');
  };

  const handleConfirmClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTradeForClose) return;

    try {
      setIsSubmittingClose(true);
      await onCloseTrade(selectedTradeForClose.id, {
        exitPrice,
        exitReason,
        notes
      });
      setSelectedTradeForClose(null);
    } catch (err: any) {
      alert(err.message || 'Failed to close trade');
    } finally {
      setIsSubmittingClose(false);
    }
  };

  const formatPrice = (p: number | null | undefined) => (p != null ? p.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '—');

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-panel rounded-2xl overflow-hidden shadow-2xl border border-slate-800/80 space-y-4 p-4 sm:p-6"
    >
      {/* Table Header & Metrics Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <BookOpen size={22} />
          </div>
          <div>
            <h2 className="font-heading font-black text-lg text-slate-100 flex items-center gap-2">
              {t.journal.title}
              <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                {trades.length} RECORDS
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Automated Trade Execution & Performance Log</p>
          </div>
        </div>

        {/* Quick Journal Stats */}
        <div className="grid grid-cols-3 gap-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-center">
          <div>
            <div className="text-[10px] font-extrabold text-slate-500 uppercase">OPEN POSITIONS</div>
            <div className="text-xs font-mono font-black text-cyan-400 mt-0.5">{metrics.open}</div>
          </div>
          <div>
            <div className="text-[10px] font-extrabold text-slate-500 uppercase">WIN RATE</div>
            <div className="text-xs font-mono font-black text-emerald-400 mt-0.5">{metrics.winRate.toFixed(0)}%</div>
          </div>
          <div>
            <div className="text-[10px] font-extrabold text-slate-500 uppercase">REALIZED P&L</div>
            <div className={`text-xs font-mono font-black mt-0.5 ${metrics.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              ${metrics.totalPnl.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {trades.length === 0 ? (
        <div className="text-center py-12 px-4 text-slate-400 text-sm font-medium bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
          No trade setups evaluated yet. Evaluate your first crypto trade parameters on the Trading Desk!
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800/80">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/90 text-slate-400 text-[11px] uppercase font-extrabold tracking-wider border-b border-slate-800">
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">{t.journal.symbolCol}</th>
                <th className="py-3 px-4">{t.journal.directionCol}</th>
                <th className="py-3 px-4">{t.journal.entryCol}</th>
                <th className="py-3 px-4">{t.journal.slCol} / {t.journal.tpCol}</th>
                <th className="py-3 px-4">{t.journal.scoreCol}</th>
                <th className="py-3 px-4">{t.journal.statusCol}</th>
                <th className="py-3 px-4 text-right">{t.journal.actionsCol}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
              <AnimatePresence>
                {trades.map((tr, idx) => {
                  const isLong = tr.direction === 'Long';

                  return (
                    <motion.tr
                      key={tr.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2, delay: idx * 0.03 }}
                      className="hover:bg-slate-900/60 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-slate-400 text-xs font-mono">
                        {new Date(tr.createdAt).toLocaleDateString()} {new Date(tr.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-100 font-mono text-sm">{tr.symbol}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-black tracking-wide ${isLong ? 'text-emerald-400 bg-emerald-500/15 border border-emerald-500/30' : 'text-rose-400 bg-rose-500/15 border border-rose-500/30'}`}>
                          {tr.direction ? tr.direction.toUpperCase() : 'LONG'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-black font-mono text-slate-200 text-xs sm:text-sm">${formatPrice(tr.entryPrice)}</td>
                      <td className="py-3.5 px-4 text-xs font-mono">
                        <span className="text-rose-400 font-bold">${formatPrice(tr.stopLoss)}</span> /{' '}
                        <span className="text-emerald-400 font-bold">${formatPrice(tr.takeProfit)}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        {tr.latestScore != null ? (
                          <span className={`font-black font-mono text-xs sm:text-sm ${tr.latestScore >= 75 ? 'text-emerald-400' : tr.latestScore >= 60 ? 'text-cyan-400' : 'text-amber-400'}`}>
                            {typeof tr.latestScore === 'number' ? tr.latestScore.toFixed(1) : Number(tr.latestScore).toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs font-medium">Unrated</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold ${tr.status === 'Closed' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : tr.status === 'Cancelled' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'}`}>
                          {tr.status === 'Closed' ? <CheckCircle size={13} /> : tr.status === 'Cancelled' ? <XCircle size={13} /> : <Clock size={13} />}
                          {tr.status === 'Closed' ? t.journal.statusClosed : tr.status === 'Open' ? t.journal.statusOpen : tr.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={() => onSelectTrade(tr.id)}
                            className="bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 px-2.5 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <RefreshCw size={12} />
                            <span>{t.journal.evaluateBtn}</span>
                          </motion.button>

                          {tr.status !== 'Closed' && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              type="button"
                              onClick={() => handleOpenCloseModal(tr)}
                              className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer"
                            >
                              {t.journal.closeBtn}
                            </motion.button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}

      {/* Close Trade Modal */}
      <AnimatePresence>
        {selectedTradeForClose && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-panel p-6 rounded-2xl w-full max-w-md shadow-2xl border border-slate-800 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-heading font-black text-lg text-slate-100 flex items-center gap-2">
                  <CheckCircle size={20} className="text-emerald-400" />
                  {t.journal.closeModalTitle} ({selectedTradeForClose.symbol})
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedTradeForClose(null)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleConfirmClose} className="space-y-4">
                <div>
                  <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 block">
                    {t.journal.closePrice} ($)
                  </label>
                  <input
                    type="number"
                    step="any"
                    className="w-full bg-slate-950/90 border border-slate-800 focus:border-cyan-500 text-slate-100 font-extrabold font-mono text-sm py-2.5 px-3 rounded-xl outline-none transition-all"
                    value={exitPrice}
                    onChange={(e) => setExitPrice(Number(e.target.value))}
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 block">
                    Reason
                  </label>
                  <select
                    className="w-full bg-slate-950/90 border border-slate-800 focus:border-cyan-500 text-slate-100 font-extrabold text-sm py-2.5 px-3 rounded-xl outline-none transition-all cursor-pointer"
                    value={exitReason}
                    onChange={(e) => setExitReason(e.target.value)}
                  >
                    <option value="Take Profit">Take Profit</option>
                    <option value="Stop Loss">Stop Loss</option>
                    <option value="Manual Exit">Manual Exit</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 block">
                    Notes
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-950/90 border border-slate-800 focus:border-cyan-500 text-slate-100 font-medium text-sm py-2.5 px-3 rounded-xl outline-none transition-all placeholder:text-slate-600"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional exit rationale..."
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTradeForClose(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold transition-all cursor-pointer"
                  >
                    {t.journal.closeCancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingClose}
                    className="bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-black py-2.5 px-5 rounded-xl shadow-lg shadow-emerald-500/25 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingClose ? 'Closing...' : t.journal.closeConfirm}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
