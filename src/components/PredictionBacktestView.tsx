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
    <div className="flex flex-col gap-5">
      {/* Top Header & Filter Controls */}
      <div className="glass-panel p-5 rounded-2xl shadow-2xl border border-slate-800/80 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <FlaskConical size={22} />
            </div>
            <div>
              <h2 className="font-heading font-black text-lg sm:text-xl text-slate-100 tracking-tight">
                Prediction Backtest & Calibration Engine
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluate quantitative model reliability by comparing historical predictions vs actual trade outcomes.
              </p>
            </div>
          </div>

          {/* Date Filter Form */}
          <form onSubmit={handleApplyFilter} className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-2 text-xs">
              <Calendar size={14} className="text-slate-400 shrink-0" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-transparent text-slate-100 outline-none font-mono text-xs cursor-pointer"
              />
              <span className="text-slate-500">to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-transparent text-slate-100 outline-none font-mono text-xs cursor-pointer"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-cyber-primary text-white font-black text-xs py-2.5 px-4 rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Running...' : 'Run Backtest'}</span>
            </button>
          </form>
        </div>

        {/* Quick Date Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setPreset('2026-01-01', '2026-12-31')}
            className="px-3 py-1 text-xs font-mono font-bold bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 rounded-lg transition-all cursor-pointer"
          >
            Year 2026
          </button>
          <button
            type="button"
            onClick={() => setPreset('', '')}
            className="px-3 py-1 text-xs font-mono font-bold bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 rounded-lg transition-all cursor-pointer"
          >
            All Time
          </button>
        </div>

        {/* Look-Ahead Bias Prevention Banner */}
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-3 flex items-center gap-2.5 text-xs text-slate-300 font-medium">
          <ShieldCheck size={16} className="text-cyan-400 shrink-0" />
          <span>
            <strong className="text-slate-100 font-bold">Look-Ahead Bias Prevention:</strong> Backtest chỉ lấy prediction mới nhất được tạo <em>trước thời điểm lệnh đóng</em>, đảm bảo kết quả đánh giá hoàn toàn khách quan.
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-xl flex items-center gap-3 text-xs sm:text-sm font-semibold">
          <AlertTriangle size={20} className="text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metric Cards Grid */}
      {report && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Resolved Predictions */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel rounded-2xl p-5 border border-slate-800/80 shadow-xl">
              <div className="flex justify-between items-center text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
                <span>Resolved Sample Size</span>
                <Layers size={16} className="text-cyan-400" />
              </div>
              <div className="text-3xl font-black text-slate-100 mt-1 font-mono">
                {report.resolvedPredictions}
              </div>
              <div className="text-xs text-slate-400 mt-1 font-medium">
                Trades closed with actual outcomes
              </div>
            </motion.div>

            {/* Card 2: Predicted vs Actual Win Rate */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-panel rounded-2xl p-5 border border-slate-800/80 shadow-xl">
              <div className="flex justify-between items-center text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
                <span>Win Rate Calibration</span>
                <Target size={16} className="text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-3xl font-black text-emerald-400 font-mono">
                  {(report.actualWinRate ?? 0).toFixed(1)}%
                </span>
                <span className="text-xs font-bold text-slate-500">actual</span>
              </div>
              <div className="text-xs text-slate-400 mt-1 font-medium">
                Predicted Avg: <strong className="text-slate-200">{(report.averagePredictedWinProbability ?? 0).toFixed(1)}%</strong>
              </div>
            </motion.div>

            {/* Card 3: Brier Score */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel rounded-2xl p-5 border border-slate-800/80 shadow-xl">
              <div className="flex justify-between items-center text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
                <span>Brier Score (0 = Perfect)</span>
                <Award size={16} style={{ color: getBrierQuality(report.brierScore ?? 0).color }} />
              </div>
              <div className="text-3xl font-black mt-1 font-mono" style={{ color: getBrierQuality(report.brierScore ?? 0).color }}>
                {(report.brierScore ?? 0).toFixed(4)}
              </div>
              <div className="text-xs font-extrabold mt-1" style={{ color: getBrierQuality(report.brierScore ?? 0).color }}>
                {getBrierQuality(report.brierScore ?? 0).text}
              </div>
            </motion.div>

            {/* Card 4: Expected R vs Realized R */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-panel rounded-2xl p-5 border border-slate-800/80 shadow-xl">
              <div className="flex justify-between items-center text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
                <span>Expectancy R Comparison</span>
                <TrendingUp size={16} className="text-amber-400" />
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className={`text-3xl font-black font-mono ${(report.averageRealizedRMultiple ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {(report.averageRealizedRMultiple ?? 0) >= 0 ? '+' : ''}{(report.averageRealizedRMultiple ?? 0).toFixed(2)}R
                </span>
                <span className="text-xs font-bold text-slate-500">realized</span>
              </div>
              <div className="text-xs text-slate-400 mt-1 font-medium">
                Expected: <strong className="text-slate-200">{(report.averageExpectedRMultiple ?? 0) >= 0 ? '+' : ''}{(report.averageExpectedRMultiple ?? 0).toFixed(2)}R</strong>
              </div>
            </motion.div>
          </div>

          {/* Supplementary Error Metric Card */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4">
            <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 flex flex-col justify-center shadow-xl">
              <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                Mean Absolute Probability Error (MAPE)
              </div>
              <div className="text-3xl font-black text-cyan-400 font-mono">
                {(report.meanAbsoluteProbabilityError ?? 0).toFixed(2)}%
              </div>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Sai số xác suất tuyệt đối trung bình giữa mức win rate dự báo và kết quả thực tế (0% = sai số không đáng kể).
              </p>
            </div>

            {/* Calibration Explanation Card */}
            <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 flex flex-col justify-center shadow-xl">
              <div className="flex items-center gap-2 text-sm font-extrabold text-slate-100 mb-1.5">
                <BarChart3 size={16} className="text-cyan-400 shrink-0" />
                <span>Hướng dẫn Đọc Calibration Curve Buckets</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Mô hình dự báo Monte Carlo được gọi là <strong className="text-slate-200">Calibrated chuẩn</strong> nếu các lệnh nằm trong nhóm dự báo <code className="bg-slate-950 px-1.5 py-0.5 rounded text-cyan-300 font-mono">60–80% Win Probability</code> thực sự đạt được Win Rate khoảng <code className="bg-slate-950 px-1.5 py-0.5 rounded text-cyan-300 font-mono">70%</code> ngoài thực tế.
                Nếu Actual Win Rate thấp hơn nhiều so với Predicted Win Rate, mô hình đang bị <em className="text-amber-300">Quá tự tin (Overconfident)</em>.
              </p>
            </div>
          </div>

          {/* Calibration Buckets Table & Visualization */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2 font-extrabold text-sm sm:text-base text-slate-100">
                <BarChart3 size={18} className="text-cyan-400 shrink-0" />
                <span>Calibration Buckets breakdown (0–20%, 20–40%, 40–60%, 60–80%, 80–100%)</span>
              </div>
              <div className="text-xs text-slate-500 font-mono hidden sm:block">
                5 equal probability bins
              </div>
            </div>

            {report.calibration.length === 0 || report.resolvedPredictions === 0 ? (
              <div className="text-center py-10 text-slate-500">
                <HelpCircle size={32} className="mx-auto mb-2 opacity-60" />
                <p className="text-xs sm:text-sm">Chưa có dữ liệu prediction đã đóng trong khoảng thời gian được chọn.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {report.calibration.map((bucket) => {
                  const predWin = bucket.averagePredictedWinProbability;
                  const actualWin = bucket.actualWinRate;

                  return (
                    <div
                      key={bucket.range}
                      className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 space-y-2.5"
                    >
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xs text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-0.5 rounded-lg">
                            {bucket.range}
                          </span>
                          <span className="text-xs text-slate-400">
                            Mẫu: <strong className="text-slate-200 font-mono font-bold">{bucket.sampleSize}</strong> trades
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-semibold">
                          <div>
                            <span className="text-slate-500">Dự báo TB: </span>
                            <strong className="text-amber-400 font-mono font-black">
                              {predWin.toFixed(1)}%
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-500">Thực tế: </span>
                            <strong className={`font-mono font-black ${actualWin >= predWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {actualWin.toFixed(1)}%
                            </strong>
                          </div>
                        </div>
                      </div>

                      {/* Visual Bar Comparisons */}
                      <div className="space-y-1.5 pt-1">
                        {/* Bar 1: Predicted */}
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-[10px] font-black text-slate-500 w-16 shrink-0 uppercase">Predicted</span>
                          <div className="flex-1 h-2.5 bg-slate-900 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${predWin}%` }}
                              transition={{ duration: 0.6 }}
                              className="h-full bg-amber-400 rounded-full"
                            />
                          </div>
                        </div>
                        {/* Bar 2: Actual */}
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-[10px] font-black text-slate-500 w-16 shrink-0 uppercase">Actual</span>
                          <div className="flex-1 h-2.5 bg-slate-900 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${actualWin}%` }}
                              transition={{ duration: 0.6, delay: 0.1 }}
                              className={`h-full rounded-full ${actualWin >= predWin ? 'bg-emerald-400' : 'bg-rose-400'}`}
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
