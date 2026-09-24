import React, { useState } from 'react';
import type { ScoreComponent } from '../types/trade';
import {
  ChevronDown, ChevronUp, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ScoreRuleInspectorProps {
  components: ScoreComponent[];
  totalScore: number;
}

interface BadgeStyle {
  label: string;
  color: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
}

function getBadgeStyle(score: number): BadgeStyle {
  if (score >= 75) return {
    label: 'Confirm & Proceed',
    color: '#10b981',
    bgClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-500/30',
    textClass: 'text-emerald-400'
  };
  if (score >= 50) return {
    label: 'Monitor Closely',
    color: '#f59e0b',
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/30',
    textClass: 'text-amber-400'
  };
  return {
    label: 'Action Required',
    color: '#f43f5e',
    bgClass: 'bg-rose-500/10',
    borderClass: 'border-rose-500/30',
    textClass: 'text-rose-400'
  };
}

function getScoreColorClass(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-cyan-400';
  if (score >= 40) return 'text-amber-400';
  return 'text-rose-400';
}

function formatCategoryTitle(cat: string): string {
  switch (cat) {
    case 'Trend':              return '1. Trend Alignment (20%)';
    case 'Entry':              return '2. Entry Distance to EMA20 (15%)';
    case 'Momentum':           return '3. RSI Momentum (15%)';
    case 'Volume':             return '4. Volume Confirmation (10%)';
    case 'SupportResistance':  return '5. Support / Resistance (15%)';
    case 'RiskReward':         return '6. Risk : Reward Ratio (15%)';
    case 'Volatility':         return '7. Volatility / ATR Calibration (5%)';
    case 'MarketContext':      return '8. Macro Market Context (5%)';
    default:                   return cat;
  }
}

export const ScoreRuleInspector: React.FC<ScoreRuleInspectorProps> = ({
  components,
  totalScore
}) => {
  const [expandedCat, setExpandedCat] = useState<string | null>(
    components[0]?.category || null
  );

  return (
    <div className="glass-panel p-5 rounded-2xl shadow-2xl border border-slate-800/80 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <ShieldCheck size={18} />
          </div>
          <h3 className="font-heading font-black text-sm text-slate-100 uppercase tracking-wider">
            Rule Rationale Inspector
          </h3>
        </div>
        <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-full">
          Total Score: {totalScore.toFixed(1)} / 100
        </span>
      </div>

      <p className="text-xs text-slate-400">
        Click any quantitative rule below to inspect category weight contributions, empirical rationales, and <strong className="text-cyan-400">suggested actions</strong>:
      </p>

      <div className="space-y-2.5">
        {components.map((c) => {
          const isExpanded = expandedCat === c.category;
          const scoreClass = getScoreColorClass(c.score);
          const badge = getBadgeStyle(c.score);
          const weightedPts = (c.score * c.weight).toFixed(2);
          const weightPct = Math.round(c.weight * 100);

          return (
            <div
              key={c.category}
              className="bg-slate-950/80 border border-slate-800/80 rounded-xl overflow-hidden transition-all"
            >
              <button
                type="button"
                className="w-full p-3.5 flex items-center justify-between text-left cursor-pointer hover:bg-slate-900/60 transition-colors"
                onClick={() => setExpandedCat(isExpanded ? null : c.category)}
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-xs sm:text-sm text-slate-100">
                    {formatCategoryTitle(c.category)}
                  </span>
                  <span className={`text-xs font-mono font-black ${scoreClass}`}>
                    {c.score} pts
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${badge.bgClass} ${badge.borderClass} ${badge.textClass}`}>
                    {badge.label}
                  </span>
                  <span className="text-slate-400">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 border-t border-slate-800/60 bg-slate-900/40 space-y-3 text-xs"
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-center font-mono">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Weight</span>
                        <span className="font-black text-slate-200">{weightPct}%</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Category Score</span>
                        <span className={`font-black ${scoreClass}`}>{c.score} / 100</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Weighted Pts</span>
                        <span className="font-black text-cyan-400">+{weightedPts} pts</span>
                      </div>
                    </div>

                    <div className="text-slate-300 leading-relaxed font-medium">
                      <strong className="text-white font-bold block mb-1">Rationale:</strong>
                      {c.explanation}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};
