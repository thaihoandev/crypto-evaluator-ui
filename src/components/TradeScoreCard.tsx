import React from 'react';
import { motion } from 'framer-motion';
import { Award, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface TradeScoreCardProps {
  score: number;
  explanation: string;
}

export const TradeScoreCard: React.FC<TradeScoreCardProps> = ({ score: rawScore, explanation }) => {
  const { t } = useLanguage();
  const score = rawScore != null ? Number(rawScore) : 0;

  const getBadgeClass = (s: number) => {
    if (s >= 85) return { label: t.tradeScore.ratingExcellent, color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.4)', text: 'text-emerald-400' };
    if (s >= 70) return { label: t.tradeScore.ratingGood, color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)', border: 'rgba(6, 182, 212, 0.4)', text: 'text-cyan-400' };
    if (s >= 55) return { label: t.tradeScore.ratingFair, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.4)', text: 'text-blue-400' };
    if (s >= 40) return { label: t.tradeScore.ratingFair, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)', text: 'text-amber-400' };
    return { label: t.tradeScore.ratingPoor, color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)', border: 'rgba(244, 63, 94, 0.4)', text: 'text-rose-400' };
  };

  const badge = getBadgeClass(score);
  const strokeDashoffset = 440 - (440 * score) / 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-panel p-5 rounded-2xl flex flex-col items-center text-center justify-between shadow-2xl relative overflow-hidden"
    >
      <div className="flex items-center gap-2 w-full justify-between pb-3 border-b border-slate-800/80 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg" style={{ background: badge.bg }}>
            <Award size={18} style={{ color: badge.color }} />
          </div>
          <h3 className="font-heading font-black text-sm text-slate-100 uppercase tracking-wider">
            {t.tradeScore.scoreTitle}
          </h3>
        </div>
        <span className={`text-xs font-mono font-black px-2.5 py-1 rounded-full border border-slate-800 bg-slate-950/80 ${badge.text}`}>
          {score >= 70 ? 'HIGH CONVICTION' : score >= 50 ? 'MODERATE' : 'LOW CONVICTION'}
        </span>
      </div>

      <div className="relative my-2 flex items-center justify-center">
        <svg width="160" height="160" viewBox="0 0 160 160">
          <circle
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="12"
          />
          <motion.circle
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke={badge.color}
            strokeWidth="12"
            strokeDasharray="440"
            initial={{ strokeDashoffset: 440 }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            strokeLinecap="round"
            transform="rotate(-90 80 80)"
            style={{ filter: `drop-shadow(0 0 10px ${badge.color}88)` }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <motion.span
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className="font-mono text-3xl font-black tracking-tight"
            style={{ color: badge.color }}
          >
            {score.toFixed(1)}
          </motion.span>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">/ 100 SCORE</span>
        </div>
      </div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-3 px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-wider border shadow-md"
        style={{ background: badge.bg, borderColor: badge.border, color: badge.color }}
      >
        {badge.label}
      </motion.div>

      <div className="mt-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 font-medium leading-relaxed text-left w-full flex items-start gap-2">
        <CheckCircle2 size={16} className="text-cyan-400 shrink-0 mt-0.5" />
        <p className="line-clamp-4">{explanation}</p>
      </div>
    </motion.div>
  );
};
