import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getPredictionBacktest } from '../api/tradeApi';
import type { PredictionBacktestReportDto } from '../types/trade';
import {
  FlaskConical,
  Calendar,
  RefreshCw,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  Award,
  BarChart3,
  Layers,
  ShieldCheck,
  Target
} from 'lucide-react';

export const PredictionBacktestView: React.FC = () => {
  // Default range: 2026-01-01 to 2026-12-31 (or blank for all time)
  const [fromDate, setFromDate] = useState<string>('2026-01-01');
  const [toDate, setToDate] = useState<string>('2026-12-31');
  const [report, setReport] = useState<PredictionBacktestReportDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBacktest = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPredictionBacktest(
        fromDate ? fromDate : undefined,
        toDate ? toDate : undefined
      );
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch backtest report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBacktest();
  }, []);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBacktest();
  };

  const setPreset = (from: string, to: string) => {
    setFromDate(from);
    setToDate(to);
    setTimeout(() => {
      fetchBacktest();
    }, 50);
  };

  // Helper for Brier score rating text
  const getBrierQuality = (score: number) => {
    if (score === 0) return { text: 'Perfect Calibration', color: '#10b981' };
    if (score <= 0.15) return { text: 'Excellent Calibration', color: '#10b981' };
    if (score <= 0.25) return { text: 'Good Calibration', color: '#06b6d4' };
    if (score <= 0.35) return { text: 'Moderate Calibration', color: '#f59e0b' };
    return { text: 'Poor Calibration', color: '#f43f5e' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* ── Top Header & Filter Controls ── */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '0.5rem', borderRadius: '10px' }}>
                <FlaskConical size={22} color="#06b6d4" />
              </div>
              <div>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.35rem', fontWeight: 800 }}>
                  Prediction Backtest & Calibration Report
                </h2>
                <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Evaluate quantitative model reliability by comparing historical predictions vs actual trade outcomes.
                </p>
              </div>
            </div>
          </div>

          {/* Date Filter Form */}
          <form onSubmit={handleApplyFilter} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#090d16', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '0.35rem 0.65rem' }}>
              <Calendar size={14} color="#64748b" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: '#f8fafc', fontSize: '0.8rem', fontFamily: 'inherit', outline: 'none' }}
              />
              <span style={{ color: '#64748b', fontSize: '0.75rem' }}>to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: '#f8fafc', fontSize: '0.8rem', fontFamily: 'inherit', outline: 'none' }}
              />
            </div>

            <button type="submit" className="btn-primary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              {loading ? 'Running...' : 'Run Backtest'}
            </button>
          </form>
        </div>

        {/* Quick Date Presets */}
        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '0.2rem 0.55rem', fontSize: '0.7rem' }}
            onClick={() => setPreset('2026-01-01', '2026-12-31')}
          >
            Year 2026
          </button>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '0.2rem 0.55rem', fontSize: '0.7rem' }}
            onClick={() => setPreset('', '')}
          >
            All Time
          </button>
        </div>

        {/* Look-Ahead Bias Prevention Banner */}
        <div style={{
          marginTop: '0.85rem',
          padding: '0.6rem 0.85rem',
          background: 'rgba(6, 182, 212, 0.08)',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontSize: '0.78rem',
          color: '#94a3b8'
        }}>
          <ShieldCheck size={16} color="#06b6d4" style={{ flexShrink: 0 }} />
          <span>
            <strong style={{ color: '#f8fafc' }}>Look-Ahead Bias Prevention:</strong> Backtest chỉ lấy prediction mới nhất được tạo <em>trước thời điểm lệnh đóng</em>, đảm bảo kết quả đánh giá hoàn toàn khách quan.
          </span>
        </div>
      </div>

      {error && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.12)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          color: '#fca5a5',
          padding: '1rem',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.875rem'
        }}>
          <AlertTriangle size={20} color="#f43f5e" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Metric Cards Grid ── */}
      {report && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            {/* Card 1: Resolved Predictions */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
                <span>Resolved Sample Size</span>
                <Layers size={15} color="#06b6d4" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.3rem', fontFamily: 'JetBrains Mono, monospace' }}>
                {report.resolvedPredictions}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                Trades closed with actual outcomes
              </div>
            </motion.div>

            {/* Card 2: Predicted vs Actual Win Rate */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
                <span>Win Rate Calibration</span>
                <Target size={15} color="#10b981" />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.3rem' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981', fontFamily: 'JetBrains Mono, monospace' }}>
                  {report.actualWinRate.toFixed(1)}%
                </span>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>actual</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                Predicted Avg: <strong>{report.averagePredictedWinProbability.toFixed(1)}%</strong>
              </div>
            </motion.div>

            {/* Card 3: Brier Score */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
                <span>Brier Score (0 = Perfect)</span>
                <Award size={15} color={getBrierQuality(report.brierScore).color} />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: getBrierQuality(report.brierScore).color, marginTop: '0.3rem', fontFamily: 'JetBrains Mono, monospace' }}>
                {report.brierScore.toFixed(4)}
              </div>
              <div style={{ fontSize: '0.7rem', color: getBrierQuality(report.brierScore).color, fontWeight: 700, marginTop: '0.2rem' }}>
                {getBrierQuality(report.brierScore).text}
              </div>
            </motion.div>

            {/* Card 4: Expected R vs Realized R */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
                <span>Expectancy R Comparison</span>
                <TrendingUp size={15} color="#f59e0b" />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.3rem' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: report.averageRealizedRMultiple >= 0 ? '#10b981' : '#f43f5e', fontFamily: 'JetBrains Mono, monospace' }}>
                  {report.averageRealizedRMultiple >= 0 ? '+' : ''}{report.averageRealizedRMultiple.toFixed(2)}R
                </span>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>realized</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                Expected: <strong>{report.averageExpectedRMultiple >= 0 ? '+' : ''}{report.averageExpectedRMultiple.toFixed(2)}R</strong>
              </div>
            </motion.div>
          </div>

          {/* ── Supplementary Error Metric Card ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.25rem' }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                Mean Absolute Probability Error (MAPE)
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#06b6d4', fontFamily: 'JetBrains Mono, monospace' }}>
                {report.meanAbsoluteProbabilityError.toFixed(2)}%
              </div>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.4rem', lineHeight: 1.4 }}>
                Sai số xác suất tuyệt đối trung bình giữa mức win rate dự báo và kết quả thực tế (0% = sai số không đáng kể).
              </p>
            </div>

            {/* Calibration Explanation Card */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.4rem' }}>
                <BarChart3 size={16} color="#06b6d4" />
                Hướng dẫn Đọc Calibration Curve Buckets
              </div>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.5 }}>
                Mô hình dự báo Monte Carlo được gọi là <strong>Calibrated chuẩn</strong> nếu các lệnh nằm trong nhóm dự báo <code>60–80% Win Probability</code> thực sự đạt được Win Rate khoảng <code>70%</code> ngoài thực tế.
                Nếu Actual Win Rate thấp hơn nhiều so với Predicted Win Rate, mô hình đang bị <em>Quá tự tin (Overconfident)</em>.
              </p>
            </div>
          </div>

          {/* ── Calibration Buckets Table & Visualization ── */}
          <div className="card">
            <div className="card-title" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart3 size={18} color="#06b6d4" />
                Calibration Buckets breakdown (0–20%, 20–40%, 40–60%, 60–80%, 80–100%)
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                5 equal probability bins
              </div>
            </div>

            {report.calibration.length === 0 || report.resolvedPredictions === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                <HelpCircle size={32} style={{ marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '0.875rem' }}>Chưa có dữ liệu prediction đã đóng trong khoảng thời gian được chọn.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                {report.calibration.map((bucket) => {
                  const predWin = bucket.averagePredictedWinProbability;
                  const actualWin = bucket.actualWinRate;

                  return (
                    <div
                      key={bucket.range}
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '8px',
                        padding: '0.85rem 1rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{
                            fontWeight: 800, fontSize: '0.85rem', color: '#06b6d4',
                            background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.3)',
                            padding: '0.15rem 0.55rem', borderRadius: '5px'
                          }}>
                            {bucket.range}
                          </span>
                          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                            Mẫu: <strong>{bucket.sampleSize}</strong> trades
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.78rem' }}>
                          <div>
                            <span style={{ color: '#64748b' }}>Dự báo TB: </span>
                            <strong style={{ color: '#f59e0b', fontFamily: 'JetBrains Mono, monospace' }}>
                              {predWin.toFixed(1)}%
                            </strong>
                          </div>
                          <div>
                            <span style={{ color: '#64748b' }}>Thực tế: </span>
                            <strong style={{ color: actualWin >= predWin ? '#10b981' : '#f43f5e', fontFamily: 'JetBrains Mono, monospace' }}>
                              {actualWin.toFixed(1)}%
                            </strong>
                          </div>
                        </div>
                      </div>

                      {/* Visual Bar Comparisons */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        {/* Bar 1: Predicted */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.68rem', color: '#64748b', width: '65px', flexShrink: 0 }}>Predicted</span>
                          <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '99px', overflow: 'hidden' }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${predWin}%` }}
                              transition={{ duration: 0.6 }}
                              style={{ height: '100%', background: '#f59e0b', borderRadius: '99px' }}
                            />
                          </div>
                        </div>
                        {/* Bar 2: Actual */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.68rem', color: '#64748b', width: '65px', flexShrink: 0 }}>Actual</span>
                          <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '99px', overflow: 'hidden' }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${actualWin}%` }}
                              transition={{ duration: 0.6, delay: 0.1 }}
                              style={{ height: '100%', background: actualWin >= predWin ? '#10b981' : '#f43f5e', borderRadius: '99px' }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
