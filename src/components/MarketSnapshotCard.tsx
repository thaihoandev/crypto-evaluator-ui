import React from 'react';
import type { MarketSnapshotDto } from '../types/trade';
import { LineChart } from 'lucide-react';

interface MarketSnapshotCardProps {
  snapshot: MarketSnapshotDto;
  symbol: string;
}

export const MarketSnapshotCard: React.FC<MarketSnapshotCardProps> = ({ snapshot, symbol }) => {
  const formatPrice = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });

  const getRsiColor = (rsi: number) => {
    if (rsi > 70) return '#f43f5e'; // overbought
    if (rsi < 30) return '#10b981'; // oversold
    return '#06b6d4'; // neutral
  };

  return (
    <div className="card">
      <div className="card-title">
        <LineChart size={18} color="#06b6d4" />
        Market Snapshot ({symbol})
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div style={{ background: '#0a0e16', border: '1px solid rgba(255,255,255,0.06)', padding: '0.75rem', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>CURRENT PRICE</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'JetBrains Mono, monospace' }}>${formatPrice(snapshot.currentPrice)}</div>
        </div>

        <div style={{ background: '#0a0e16', border: '1px solid rgba(255,255,255,0.06)', padding: '0.75rem', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>RSI (14)</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: getRsiColor(snapshot.rsi), fontFamily: 'JetBrains Mono, monospace' }}>
            {snapshot.rsi.toFixed(1)}
          </div>
        </div>

        <div style={{ background: '#0a0e16', border: '1px solid rgba(255,255,255,0.06)', padding: '0.75rem', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>ATR (14)</div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>{snapshot.atr.toFixed(2)}</div>
        </div>

        <div style={{ background: '#0a0e16', border: '1px solid rgba(255,255,255,0.06)', padding: '0.75rem', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>VOLUME RATIO</div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: snapshot.volumeRatio >= 1.2 ? '#10b981' : snapshot.volumeRatio < 0.8 ? '#f59e0b' : '#06b6d4', fontFamily: 'JetBrains Mono, monospace' }}>
            {snapshot.volumeRatio.toFixed(2)}x
          </div>
        </div>
      </div>

      {/* Moving Averages List */}
      <div style={{ marginTop: '1rem', background: '#0a0e16', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase' }}>
          Exponential Moving Averages
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.35rem', fontFamily: 'JetBrains Mono, monospace' }}>
          <span style={{ color: '#06b6d4', fontWeight: 700 }}>EMA 20</span>
          <span style={{ fontWeight: 700 }}>${formatPrice(snapshot.ema20)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.35rem', fontFamily: 'JetBrains Mono, monospace' }}>
          <span style={{ color: '#3b82f6', fontWeight: 700 }}>EMA 50</span>
          <span style={{ fontWeight: 700 }}>${formatPrice(snapshot.ema50)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', fontFamily: 'JetBrains Mono, monospace' }}>
          <span style={{ color: '#8b5cf6', fontWeight: 700 }}>EMA 200</span>
          <span style={{ fontWeight: 700 }}>${formatPrice(snapshot.ema200)}</span>
        </div>
      </div>
    </div>
  );
};
