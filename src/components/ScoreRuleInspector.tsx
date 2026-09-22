import React, { useState } from 'react';
import type { ScoreComponent } from '../types/trade';
import {
  ChevronDown, ChevronUp, CheckCircle2, AlertTriangle,
  ShieldCheck, Zap, ArrowRight
} from 'lucide-react';

interface ScoreRuleInspectorProps {
  components: ScoreComponent[];
  totalScore: number;
}

interface BadgeStyle {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

function getBadgeStyle(score: number): BadgeStyle {
  if (score >= 75) return {
    label: 'Confirm & Proceed',
    color: '#10b981',
    bgColor: 'rgba(16,185,129,0.08)',
    borderColor: 'rgba(16,185,129,0.25)'
  };
  if (score >= 50) return {
    label: 'Monitor Closely',
    color: '#f59e0b',
    bgColor: 'rgba(245,158,11,0.08)',
    borderColor: 'rgba(245,158,11,0.25)'
  };
  return {
    label: 'Action Required',
    color: '#f43f5e',
    bgColor: 'rgba(244,63,94,0.08)',
    borderColor: 'rgba(244,63,94,0.25)'
  };
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#06b6d4';
  if (score >= 40) return '#f59e0b';
  return '#f43f5e';
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
    <div className="card">
      <div className="card-title" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={20} color="#06b6d4" />
          Evaluation Criteria & Rule Rationale Inspector
        </div>
        <span style={{
          fontSize: '0.8rem', color: '#10b981', fontWeight: 800,
          background: 'rgba(16,185,129,0.12)', padding: '0.25rem 0.75rem',
          borderRadius: '9999px', border: '1px solid rgba(16,185,129,0.3)',
          fontFamily: 'JetBrains Mono, monospace'
        }}>
          Score: {totalScore.toFixed(1)} / 100
        </span>
      </div>

      <p style={{ fontSize: '0.825rem', color: '#94a3b8', marginBottom: '1.15rem' }}>
        Click any scoring rule below to inspect the weight contribution, rationale, and <strong style={{ color: '#06b6d4' }}>suggested next action</strong>:
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {components.map((c) => {
          const isExpanded  = expandedCat === c.category;
          const scoreColor  = getScoreColor(c.score);
          const badge       = getBadgeStyle(c.score);
          const weightedPts = (c.score * c.weight).toFixed(2);
          const weightPct   = Math.round(c.weight * 100);

          return (
            <div
              key={c.category}
              style={{
                background: isExpanded ? '#0a0e16' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isExpanded ? 'rgba(6, 182, 212, 0.3)' : 'rgba(255, 255, 255, 0.06)'}`,
                borderRadius: '10px',
                overflow: 'hidden',
                transition: 'all 0.15s ease'
              }}
            >
              {/* Accordion Header */}
              <button
                type="button"
                onClick={() => setExpandedCat(isExpanded ? null : c.category)}
                style={{
                  width: '100%', display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', padding: '0.85rem 1rem',
                  background: 'transparent', border: 'none',
                  color: '#f8fafc', cursor: 'pointer', textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  {c.score >= 60
                    ? <CheckCircle2 size={16} color={scoreColor} />
                    : <AlertTriangle size={16} color={scoreColor} />
                  }
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                    {formatCategoryTitle(c.category)}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '80px', height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${c.score}%`, height: '100%', background: scoreColor }} />
                  </div>
                  <span style={{
                    color: scoreColor, fontWeight: 800, fontSize: '0.9rem',
                    fontFamily: 'JetBrains Mono, monospace',
                    background: `${scoreColor}15`, padding: '0.15rem 0.5rem',
                    borderRadius: '6px', border: `1px solid ${scoreColor}33`
                  }}>
                    {c.score}/100
                  </span>
                  {isExpanded
                    ? <ChevronUp size={16} color="#94a3b8" />
                    : <ChevronDown size={16} color="#94a3b8" />
                  }
                </div>
              </button>

              {/* Accordion Body */}
              {isExpanded && (
                <div style={{
                  padding: '0.9rem 1rem 1.1rem 1rem',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  background: '#070a12', fontSize: '0.85rem'
                }}>
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr',
                    gap: '0.75rem', marginBottom: '0.85rem'
                  }}>
                    <div style={{ background: '#0e131f', padding: '0.65rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>CATEGORY WEIGHT</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#06b6d4', marginTop: '0.1rem' }}>{weightPct}% Weight</div>
                    </div>
                    <div style={{ background: '#0e131f', padding: '0.65rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>WEIGHTED POINTS</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#10b981', marginTop: '0.1rem' }}>+{weightedPts} Points</div>
                    </div>
                  </div>

                  <div style={{ color: '#cbd5e1', lineHeight: 1.55, marginBottom: '0.85rem' }}>
                    <strong>Evaluation Reason: </strong>{c.explanation}
                  </div>

                  <div style={{
                    background: badge.bgColor,
                    border: `1px solid ${badge.borderColor}`,
                    borderRadius: '8px', padding: '0.75rem 0.9rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                      <Zap size={14} color={badge.color} />
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: badge.color }}>
                        Suggested Action
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: '#f8fafc', fontSize: '0.825rem', lineHeight: 1.5 }}>
                      <ArrowRight size={14} color={badge.color} style={{ marginTop: '0.15rem', flexShrink: 0 }} />
                      <span>{c.suggestedAction}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
