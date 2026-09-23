import React from 'react';
import { motion } from 'framer-motion';
import type { TradePredictionDto } from '../types/trade';
import { Dna, TrendingUp, Info, GitBranch, ShieldCheck, ShieldAlert, Database, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface MonteCarloWidgetProps {
  prediction: TradePredictionDto;
}

const SCENARIO_COLORS: Record<string, string> = {
  Bear: '#f43f5e',
  Base: '#f59e0b',
  Bull: '#10b981'
};

const SCENARIO_ICONS: Record<string, string> = {
  Bear: '🐻',
  Base: '📊',
  Bull: '🐂'
};

const CONFIDENCE_COLORS: Record<string, { bg: string; border: string; text: string; ring: string }> = {
  High:   { bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.35)',  text: '#10b981', ring: '#10b981' },
  Medium: { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.35)',  text: '#f59e0b', ring: '#f59e0b' },
  Low:    { bg: 'rgba(244,63,94,0.1)',   border: 'rgba(244,63,94,0.35)',   text: '#f43f5e', ring: '#f43f5e' }
};

export const MonteCarloWidget: React.FC<MonteCarloWidgetProps> = ({ prediction }) => {
  const { t } = useLanguage();

  const win    = prediction.winProbability;
  const loss   = prediction.lossProbability;
  const noHit  = prediction.noHitProbability;
  const conf   = prediction.confidence;
  const dq     = prediction.dataQuality;

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
      className="card"
    >
      {/* ── Header ── */}
      <div className="card-title" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Dna size={18} color="#10b981" />
          {t.monteCarlo.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {/* Confidence Badge */}
          {conf && confStyle && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.3rem',
                background: confStyle.bg, border: `1px solid ${confStyle.border}`,
                borderRadius: '6px', padding: '0.18rem 0.55rem',
                fontSize: '0.7rem', fontWeight: 800, color: confStyle.text
              }}
              title={`Confidence factors:\n${conf.factors.join('\n')}`}
            >
              {conf.level === 'High'
                ? <ShieldCheck size={12} />
                : conf.level === 'Medium'
                  ? <ShieldAlert size={12} />
                  : <AlertTriangle size={12} />}
              {conf.level.toUpperCase()} CONF · {conf.score.toFixed(0)}
            </motion.div>
          )}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="r-multiple-badge"
          >
            <TrendingUp size={14} />
            E[R]: {prediction.expectedRMultiple >= 0 ? '+' : ''}{prediction.expectedRMultiple.toFixed(2)}R
          </motion.div>
        </div>
      </div>

      {/* ── Probability Numbers ── */}
      <div className="prediction-box">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>{t.monteCarlo.winRate}</div>
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              style={{ fontSize: '1.45rem', fontWeight: 800, color: '#10b981', fontFamily: 'JetBrains Mono, monospace' }}
            >
              {win.toFixed(1)}%
            </motion.div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>{t.monteCarlo.lossRate}</div>
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f43f5e', fontFamily: 'JetBrains Mono, monospace' }}
            >
              {loss.toFixed(1)}%
            </motion.div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>{t.monteCarlo.noHitRate}</div>
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, type: 'spring' }}
              style={{ fontSize: '1.45rem', fontWeight: 800, color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}
            >
              {noHit.toFixed(1)}%
            </motion.div>
          </div>
        </div>

        {/* Stacked Probability Bar */}
        <div className="prob-bar-container">
          <motion.div initial={{ width: 0 }} animate={{ width: `${win}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }} className="prob-seg-win" title={`Win: ${win}%`} />
          <motion.div initial={{ width: 0 }} animate={{ width: `${loss}%` }}
            transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }} className="prob-seg-loss" title={`Loss: ${loss}%`} />
          <motion.div initial={{ width: 0 }} animate={{ width: `${noHit}%` }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }} className="prob-seg-nohit" title={`No Hit: ${noHit}%`} />
        </div>

        {/* Details Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
          <span>Method: <strong>{prediction.method}</strong></span>
          <span>Paths: <strong>{(prediction.simulatedPaths || 10000).toLocaleString()}</strong></span>
        </div>
      </div>

      {/* ── Confidence Factors Panel ── */}
      {conf && confStyle && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.3 }}
          style={{
            marginTop: '0.85rem',
            background: confStyle.bg,
            border: `1px solid ${confStyle.border}`,
            borderRadius: '8px',
            padding: '0.7rem 0.85rem'
          }}
        >
          {/* Score gauge header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', flexShrink: 0 }}>
              Confidence Score ({conf.level})
            </div>
            {/* Progress bar */}
            <div style={{ flex: 1, height: '7px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${conf.score}%` }}
                transition={{ duration: 0.9, delay: 0.5, ease: 'easeOut' }}
                style={{ height: '100%', background: confStyle.ring, borderRadius: '99px' }}
              />
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: confStyle.text, fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>
              {conf.score.toFixed(0)} / 100
            </div>
          </div>

          {/* Factor list breakdown */}
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, marginBottom: '0.35rem' }}>
            Assessment Factors:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {conf.factors.map((f, i) => {
              let categoryTag = 'Factor';
              if (f.toLowerCase().includes('candle')) categoryTag = 'Candle Count';
              else if (f.toLowerCase().includes('recent') || f.toLowerCase().includes('old')) categoryTag = 'Data Recency';
              else if (f.toLowerCase().includes('atr')) categoryTag = 'ATR Volatility';
              else if (f.toLowerCase().includes('ema')) categoryTag = 'EMA Alignment';

              return (
                <div
                  key={i}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    fontSize: '0.7rem', background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)', borderRadius: '5px',
                    padding: '0.25rem 0.5rem'
                  }}
                >
                  <span style={{ color: '#cbd5e1' }}>● {f}</span>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#06b6d4', background: 'rgba(6,182,212,0.1)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                    {categoryTag}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── Scenario Paths (Bear / Base / Bull) ── */}
      {prediction.scenarioPaths && prediction.scenarioPaths.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.3 }}
          style={{
            marginTop: '0.85rem',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '8px',
            padding: '0.65rem 0.85rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.55rem', fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
            <GitBranch size={12} />
            {t.monteCarlo.percentilesTitle}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            {prediction.scenarioPaths.map((scenario) => {
              const color = SCENARIO_COLORS[scenario.name] ?? '#94a3b8';
              const icon  = SCENARIO_ICONS[scenario.name] ?? '●';
              const lastPt    = scenario.points[scenario.points.length - 1];
              const endPrice  = lastPt?.price ?? 0;
              return (
                <motion.div
                  key={scenario.name}
                  whileHover={{ scale: 1.03 }}
                  style={{
                    background: `${color}11`, border: `1px solid ${color}44`,
                    borderRadius: '6px', padding: '0.4rem 0.6rem', textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '0.7rem', color, fontWeight: 700, marginBottom: '0.2rem' }}>
                    {icon} {scenario.name.toUpperCase()}
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color, fontFamily: 'JetBrains Mono, monospace' }}>
                    ${endPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#475569', marginTop: '0.1rem' }}>
                    at step {lastPt?.step ?? '—'}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── Data Quality Detailed Panel ── */}
      {dq && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
          style={{
            marginTop: '0.75rem',
            padding: '0.6rem 0.8rem',
            background: dq.isStale ? 'rgba(244,63,94,0.06)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${dq.isStale ? 'rgba(244,63,94,0.3)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: '8px', fontSize: '0.72rem', color: '#94a3b8'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: dq.isStale ? '#f43f5e' : '#f8fafc' }}>
              <Database size={14} color={dq.isStale ? '#f43f5e' : '#06b6d4'} />
              Data Quality Overview
            </div>
            {/* IsStale Badge */}
            <span
              style={{
                fontSize: '0.65rem', fontWeight: 800,
                padding: '0.15rem 0.45rem', borderRadius: '4px',
                background: dq.isStale ? 'rgba(244,63,94,0.2)' : 'rgba(16,185,129,0.15)',
                color: dq.isStale ? '#f43f5e' : '#10b981',
                border: `1px solid ${dq.isStale ? 'rgba(244,63,94,0.4)' : 'rgba(16,185,129,0.3)'}`
              }}
            >
              {dq.isStale ? '⚠ DATA STALE' : '✓ FRESH DATA'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem 0.8rem', fontSize: '0.7rem' }}>
            <div>
              <span style={{ color: '#64748b' }}>Candles: </span>
              <strong style={{ color: dq.isSufficient ? '#f8fafc' : '#f43f5e' }}>{dq.closedCandleCount}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Data Age: </span>
              <strong style={{ color: dq.isStale ? '#f43f5e' : '#10b981', fontFamily: 'JetBrains Mono, monospace' }}>
                {formatAge(liveAgeSeconds)}
              </strong>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Disclaimer ── */}
      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <Info size={14} color="#64748b" />
        {prediction.disclaimer || 'Geometric Brownian Motion quantitative simulation, not financial advice.'}
      </div>
    </motion.div>
  );
};
