import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TradeResponse, CloseTradeRequest } from '../types/trade';
import { BookOpen, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
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

  const formatPrice = (p: number) => p.toLocaleString(undefined, { maximumFractionDigits: 4 });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="card"
      style={{ marginTop: '1.25rem' }}
    >
      <div className="card-title">
        <BookOpen size={18} color="#06b6d4" />
        {t.journal.title} ({trades.length})
      </div>

      {trades.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', fontSize: '0.9rem' }}>
          No trade setups evaluated yet. Evaluate your first crypto trade parameters on the Trading Desk!
        </div>
      ) : (
        <div className="table-container">
          <table className="journal-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>{t.journal.symbolCol}</th>
                <th>{t.journal.directionCol}</th>
                <th>{t.journal.entryCol}</th>
                <th>{t.journal.slCol} / {t.journal.tpCol}</th>
                <th>{t.journal.scoreCol}</th>
                <th>{t.journal.statusCol}</th>
                <th>{t.journal.actionsCol}</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {trades.map((tr, idx) => {
                  const isLong = tr.direction === 'Long';

                  return (
                    <motion.tr
                      key={tr.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.25, delay: idx * 0.04 }}
                    >
                      <td style={{ color: '#94a3b8', fontSize: '0.8rem', fontFamily: 'JetBrains Mono, monospace' }}>
                        {new Date(tr.createdAt).toLocaleDateString()} {new Date(tr.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ fontWeight: 800, color: '#f8fafc' }}>{tr.symbol}</td>
                      <td>
                        <span style={{
                          color: isLong ? '#10b981' : '#f43f5e',
                          background: isLong ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '4px',
                          fontWeight: 800,
                          fontSize: '0.78rem'
                        }}>
                          {tr.direction.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>${formatPrice(tr.entryPrice)}</td>
                      <td style={{ fontSize: '0.8rem', color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>
                        <span style={{ color: '#f43f5e' }}>${formatPrice(tr.stopLoss)}</span> /{' '}
                        <span style={{ color: '#10b981' }}>${formatPrice(tr.takeProfit)}</span>
                      </td>
                      <td>
                        {tr.latestScore !== undefined ? (
                          <span style={{
                            fontWeight: 800,
                            fontFamily: 'JetBrains Mono, monospace',
                            color: tr.latestScore >= 75 ? '#10b981' : tr.latestScore >= 60 ? '#06b6d4' : '#f59e0b'
                          }}>
                            {tr.latestScore.toFixed(1)}
                          </span>
                        ) : (
                          <span style={{ color: '#64748b' }}>Unrated</span>
                        )}
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: tr.status === 'Closed' ? '#10b981' : tr.status === 'Cancelled' ? '#f43f5e' : '#06b6d4'
                        }}>
                          {tr.status === 'Closed' ? <CheckCircle size={14} /> : tr.status === 'Cancelled' ? <XCircle size={14} /> : <Clock size={14} />}
                          {tr.status === 'Closed' ? t.journal.statusClosed : tr.status === 'Open' ? t.journal.statusOpen : tr.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={() => onSelectTrade(tr.id)}
                            style={{
                              background: 'rgba(6, 182, 212, 0.1)',
                              border: '1px solid rgba(6, 182, 212, 0.3)',
                              color: '#06b6d4',
                              padding: '0.3rem 0.65rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem'
                            }}
                          >
                            <RefreshCw size={12} />
                            {t.journal.evaluateBtn}
                          </motion.button>

                          {tr.status !== 'Closed' && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              type="button"
                              onClick={() => handleOpenCloseModal(tr)}
                              style={{
                                background: 'rgba(16, 185, 129, 0.1)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                color: '#10b981',
                                padding: '0.3rem 0.65rem',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
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
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="card"
              style={{ width: '420px', maxWidth: '90%' }}
            >
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem' }}>
                {t.journal.closeModalTitle} ({selectedTradeForClose.symbol})
              </h3>
              <form onSubmit={handleConfirmClose}>
                <div className="form-group">
                  <label className="form-label">{t.journal.closePrice}</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    value={exitPrice}
                    onChange={(e) => setExitPrice(Number(e.target.value))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Reason</label>
                  <select
                    className="form-select"
                    value={exitReason}
                    onChange={(e) => setExitReason(e.target.value)}
                  >
                    <option value="Take Profit">Take Profit</option>
                    <option value="Stop Loss">Stop Loss</option>
                    <option value="Manual Exit">Manual Exit</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <input
                    type="text"
                    className="form-input"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional exit notes..."
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedTradeForClose(null)}
                    style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#94a3b8', padding: '0.45rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 700 }}
                  >
                    {t.journal.closeCancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingClose}
                    className="btn-submit"
                    style={{ padding: '0.45rem 1.25rem' }}
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
