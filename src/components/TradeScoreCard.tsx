import React from 'react';
import { motion } from 'framer-motion';
import { Award } from 'lucide-react';

interface TradeScoreCardProps {
  score: number;
  explanation: string;
}

export const TradeScoreCard: React.FC<TradeScoreCardProps> = ({ score, explanation }) => {
  const getBadgeClass = (s: number) => {
    if (s >= 85) return { label: 'Very Strong Setup', className: 'very-strong', color: '#10b981' };
    if (s >= 70) return { label: 'Strong Setup', className: 'strong', color: '#06b6d4' };
    if (s >= 55) return { label: 'Moderate Setup', className: 'moderate', color: '#3b82f6' };
    if (s >= 40) return { label: 'Weak Setup', className: 'weak', color: '#f59e0b' };
    return { label: 'High Risk Setup', className: 'high-risk', color: '#f43f5e' };
  };

  const badge = getBadgeClass(score);
  const strokeDashoffset = 440 - (440 * score) / 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="card"
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}
    >
      <div className="card-title" style={{ width: '100%', justifyContent: 'center' }}>
        <Award size={20} color={badge.color} />
        Trade Setup Score
      </div>

      <div className="score-gauge-container">
        <div className="radial-progress">
          <svg width="150" height="150" viewBox="0 0 160 160">
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
              style={{ filter: `drop-shadow(0 0 8px ${badge.color}66)` }}
            />
          </svg>
          <div className="radial-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="score-num"
              style={{ color: badge.color }}
            >
              {score.toFixed(1)}
            </motion.div>
            <div className="score-max">/ 100</div>
          </div>
        </div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
          className={`badge-setup ${badge.className}`}
        >
          {badge.label}
        </motion.div>
      </div>

      <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.65rem', lineHeight: 1.5 }}>
        {explanation}
      </p>
    </motion.div>
  );
};
