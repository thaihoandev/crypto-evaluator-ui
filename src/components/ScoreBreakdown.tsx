import React from 'react';
import type { ScoreComponent } from '../types/trade';
import { BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

interface ScoreBreakdownProps {
  components: ScoreComponent[];
}

export const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({ components }) => {
  const getCategoryColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 bg-emerald-500';
    if (score >= 60) return 'text-cyan-400 bg-cyan-500';
    if (score >= 40) return 'text-amber-400 bg-amber-500';
    return 'text-rose-400 bg-rose-500';
  };

  const formatCategoryName = (cat: string) => {
    switch (cat) {
      case 'SupportResistance': return 'Support / Resistance';
      case 'RiskReward': return 'Risk / Reward Ratio';
      case 'MarketContext': return 'Market Context & Trend';
      case 'Trend': return 'Trend Alignment';
      case 'Momentum': return 'Momentum Indicators';
      case 'Volatility': return 'Volatility & ATR';
      default: return cat;
    }
  };

  return (
    <div className="glass-panel p-5 rounded-2xl shadow-2xl border border-slate-800/80 space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-800/80">
        <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
          <BarChart3 size={18} />
        </div>
        <h3 className="font-heading font-black text-sm text-slate-100 uppercase tracking-wider">
          Weighted Score Breakdown (100%)
        </h3>
      </div>

      <div className="space-y-3">
        {components.map((c) => {
          const colorClasses = getCategoryColor(c.score);
          const weightPercent = Math.round(c.weight * 100);

          return (
            <div key={c.category} className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-200">
                  {formatCategoryName(c.category)}{' '}
                  <span className="text-[11px] text-slate-500 font-mono font-normal">
                    (Weight: {weightPercent}%)
                  </span>
                </span>
                <span className={`font-mono font-black ${colorClasses.split(' ')[0]}`}>
                  {c.score} / 100
                </span>
              </div>

              <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${c.score}%` }}
                  transition={{ duration: 0.8 }}
                  className={`h-full rounded-full ${colorClasses.split(' ')[1]}`}
                />
              </div>

              <div className="text-xs text-slate-400 font-medium leading-relaxed">
                {c.explanation}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
