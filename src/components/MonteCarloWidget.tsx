import React from 'react';
import { motion } from 'framer-motion';
import type { TradePredictionDto } from '../types/trade';
import { Dna, TrendingUp, Info, GitBranch, ShieldCheck, ShieldAlert, Database, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface MonteCarloWidgetProps {
  prediction: TradePredictionDto;
}

const SCENARIO_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  Bear: { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
  Base: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  Bull: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' }
};

const SCENARIO_ICONS: Record<string, string> = {
  Bear: '🐻',
  Base: '📊',
  Bull: '🐂'
};

const CONFIDENCE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  High:   { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' },
  Medium: { bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   text: 'text-amber-400' },
  Low:    { bg: 'bg-rose-500/10',    border: 'border-rose-500/30',    text: 'text-rose-400' }
};

export const MonteCarloWidget: React.FC<MonteCarloWidgetProps> = ({ prediction }) => {
  const { t } = useLanguage();

  const win    = prediction?.winProbability ?? 0;
  const loss   = prediction?.lossProbability ?? 0;
  const noHit  = prediction?.noHitProbability ?? 0;
  const expectedR = prediction?.expectedRMultiple ?? 0;
  const conf   = prediction?.confidence;
  const dq     = prediction?.dataQuality;

  const confStyle = conf ? CONFIDENCE_COLORS[conf.level] ?? CONFIDENCE_COLORS.Low : null;

  const [liveAgeSeconds, setLiveAgeSeconds] = React.useState<number>(dq?.dataAgeSeconds ?? 0);

  React.useEffect(() => {
    setLiveAgeSeconds(dq?.dataAgeSeconds ?? 0);
    const interval = setInterval(() => {
      setLiveAgeSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [dq]);

  const formatAge = (seconds: number) => {
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s ago`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="glass-panel p-5 rounded-2xl flex flex-col justify-between shadow-2xl space-y-4 border border-slate-800/80"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Dna size={18} />
          </div>
          <h3 className="font-heading font-black text-sm text-slate-100 uppercase tracking-wider">
            {t.monteCarlo.title}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {conf && confStyle && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-black uppercase ${confStyle.bg} ${confStyle.border} ${confStyle.text}`}
            >
              {conf.level === 'High' ? (
                <ShieldCheck size={13} />
              ) : conf.level === 'Medium' ? (
                <ShieldAlert size={13} />
              ) : (
                <AlertTriangle size={13} />
              )}
              <span>{conf.level} CONF ({conf.score?.toFixed(0)})</span>
            </motion.div>
          )}

          <div className="flex items-center gap-1.5 bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2.5 py-1 rounded-lg text-xs font-mono font-black">
            <TrendingUp size={13} />
            <span>E[R]: {expectedR >= 0 ? '+' : ''}{expectedR.toFixed(2)}R</span>
          </div>
        </div>
      </div>

      {/* Probability Numbers */}
      <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{t.monteCarlo.winRate}</div>
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="text-xl sm:text-2xl font-mono font-black text-emerald-400 mt-0.5"
            >
              {win.toFixed(1)}%
            </motion.div>
          </div>
          <div>
            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{t.monteCarlo.lossRate}</div>
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="text-xl sm:text-2xl font-mono font-black text-rose-400 mt-0.5"
            >
              {loss.toFixed(1)}%
            </motion.div>
          </div>
          <div>
            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{t.monteCarlo.noHitRate}</div>
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, type: 'spring' }}
              className="text-xl sm:text-2xl font-mono font-black text-slate-400 mt-0.5"
            >
              {noHit.toFixed(1)}%
            </motion.div>
          </div>
        </div>

        {/* Stacked Probability Bar */}
        <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden flex shadow-inner">
          <motion.div initial={{ width: 0 }} animate={{ width: `${win}%` }} transition={{ duration: 0.8 }} className="bg-emerald-500 h-full" />
          <motion.div initial={{ width: 0 }} animate={{ width: `${loss}%` }} transition={{ duration: 0.8, delay: 0.1 }} className="bg-rose-500 h-full" />
          <motion.div initial={{ width: 0 }} animate={{ width: `${noHit}%` }} transition={{ duration: 0.8, delay: 0.2 }} className="bg-slate-600 h-full" />
        </div>

        <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 pt-1">
          <span>Method: <strong className="text-slate-200">{prediction.method}</strong></span>
          <span>Paths: <strong className="text-slate-200">{(prediction.simulatedPaths || 10000).toLocaleString()}</strong></span>
        </div>
      </div>

      {/* Scenario Paths Cards (Bear / Base / Bull) */}
      {prediction.scenarioPaths && prediction.scenarioPaths.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
            <GitBranch size={13} className="text-cyan-400" />
            <span>{t.monteCarlo.percentilesTitle}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {prediction.scenarioPaths.map((scenario) => {
              const style = SCENARIO_COLORS[scenario.name] ?? { text: 'text-slate-300', bg: 'bg-slate-800/40', border: 'border-slate-700' };
              const icon  = SCENARIO_ICONS[scenario.name] ?? '●';
              const lastPt = scenario.points[scenario.points.length - 1];
              const endPrice = lastPt?.price ?? 0;
              return (
                <motion.div
                  key={scenario.name}
                  whileHover={{ scale: 1.02 }}
                  className={`p-2.5 rounded-xl border ${style.bg} ${style.border} text-center space-y-1`}
                >
                  <div className={`text-[11px] font-black uppercase ${style.text}`}>
                    {icon} {scenario.name}
                  </div>
                  <div className={`text-xs sm:text-sm font-mono font-black ${style.text}`}>
                    ${endPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Data Quality Overview */}
      {dq && (
        <div className={`p-3 rounded-xl border text-xs ${dq.isStale ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-slate-950/70 border-slate-800 text-slate-300'}`}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 font-extrabold">
              <Database size={14} className={dq.isStale ? 'text-rose-400' : 'text-cyan-400'} />
              <span>Data Quality Overview</span>
            </div>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${dq.isStale ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'}`}>
              {dq.isStale ? '⚠ STALE' : '✓ FRESH'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-medium">
            <div>Candles: <strong className="text-slate-100">{dq.closedCandleCount}</strong></div>
            <div>Data Age: <strong className="font-mono text-cyan-300">{formatAge(liveAgeSeconds)}</strong></div>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
        <Info size={13} className="shrink-0" />
        <span>{prediction.disclaimer || 'Geometric Brownian Motion quantitative simulation, not financial advice.'}</span>
      </div>
    </motion.div>
  );
};
