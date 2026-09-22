import React from 'react';
import type { ScoreComponent } from '../types/trade';
import { BarChart3 } from 'lucide-react';

interface ScoreBreakdownProps {
  components: ScoreComponent[];
}

export const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({ components }) => {
  const getCategoryColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#06b6d4';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const formatCategoryName = (cat: string) => {
    switch (cat) {
      case 'SupportResistance': return 'Support / Resistance';
      case 'RiskReward': return 'Risk / Reward';
      case 'MarketContext': return 'Market Context';
      default: return cat;
    }
  };

  return (
    <div className="card">
      <div className="card-title">
        <BarChart3 size={18} color="#06b6d4" />
        Weighted Score Breakdown (100%)
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {components.map((c) => {
          const color = getCategoryColor(c.score);
          const weightPercent = Math.round(c.weight * 100);

          return (
            <div key={c.category} className="category-item">
              <div className="category-header">
                <span>
                  {formatCategoryName(c.category)}{' '}
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>
                    ({weightPercent}%)
                  </span>
                </span>
                <span style={{ color, fontWeight: 700 }}>
                  {c.score} / 100
                </span>
              </div>

              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${c.score}%`,
                    backgroundColor: color,
                    boxShadow: `0 0 8px ${color}44`
                  }}
                />
              </div>

              <div className="category-exp">{c.explanation}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
