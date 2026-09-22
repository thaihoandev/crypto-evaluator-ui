import React from 'react';
import type { TradeDirection, MarketSnapshotDto } from '../types/trade';
import { Layers } from 'lucide-react';

interface ChartPreviewProps {
  symbol: string;
  direction: TradeDirection;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  snapshot?: MarketSnapshotDto;
}

export const ChartPreview: React.FC<ChartPreviewProps> = ({
  symbol,
  direction,
  entryPrice,
  stopLoss,
  takeProfit,
  snapshot
}) => {
  const isLong = direction === 'Long';
  const prices = [entryPrice, stopLoss, takeProfit];
  if (snapshot) {
    prices.push(snapshot.currentPrice, snapshot.ema20, snapshot.ema50, snapshot.ema200);
  }

  const maxPrice = Math.max(...prices) * 1.01;
  const minPrice = Math.min(...prices) * 0.99;
  const priceRange = maxPrice - minPrice || 1;

  const getPositionY = (price: number) => {
    // Convert price to Y percentage (0 = top = maxPrice, 100 = bottom = minPrice)
    const pct = ((maxPrice - price) / priceRange) * 100;
    return Math.max(5, Math.min(95, pct));
  };

  const entryY = getPositionY(entryPrice);
  const slY = getPositionY(stopLoss);
  const tpY = getPositionY(takeProfit);

  const slPct = (((stopLoss - entryPrice) / entryPrice) * 100).toFixed(2);
  const tpPct = (((takeProfit - entryPrice) / entryPrice) * 100).toFixed(2);

  return (
    <div className="card">
      <div className="card-title" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Layers size={18} color="#06b6d4" />
          Price Level & Indicator Mapping ({symbol})
        </div>
        <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600 }}>
          Visual Setup Map
        </span>
      </div>

      <div style={{
        position: 'relative',
        height: '240px',
        background: '#090d14',
        border: '1px solid #1a2234',
        borderRadius: '12px',
        padding: '1rem',
        overflow: 'hidden'
      }}>
        {/* Background Grid Lines */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.15, backgroundImage: 'linear-gradient(#1e2638 1px, transparent 1px), linear-gradient(90deg, #1e2638 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        {/* Take Profit Line */}
        <div style={{
          position: 'absolute',
          left: '1rem',
          right: '1rem',
          top: `${tpY}%`,
          borderTop: '2px dashed #10b981',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transform: 'translateY(-50%)',
          zIndex: 10
        }}>
          <span style={{ background: '#0e1c18', color: '#10b981', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid #10b981' }}>
            TP: ${takeProfit.toLocaleString()} ({isLong ? `+${tpPct}%` : `${tpPct}%`})
          </span>
          <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>TARGET PROFIT ZONE</span>
        </div>

        {/* Entry Price Line */}
        <div style={{
          position: 'absolute',
          left: '1rem',
          right: '1rem',
          top: `${entryY}%`,
          borderTop: '2px solid #06b6d4',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transform: 'translateY(-50%)',
          zIndex: 10
        }}>
          <span style={{ background: '#091d24', color: '#06b6d4', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800, border: '1px solid #06b6d4' }}>
            ENTRY: ${entryPrice.toLocaleString()}
          </span>
          <span style={{ fontSize: '0.7rem', color: '#06b6d4', fontWeight: 600 }}>ORDER ENTRY</span>
        </div>

        {/* Stop Loss Line */}
        <div style={{
          position: 'absolute',
          left: '1rem',
          right: '1rem',
          top: `${slY}%`,
          borderTop: '2px dashed #ef4444',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transform: 'translateY(-50%)',
          zIndex: 10
        }}>
          <span style={{ background: '#241014', color: '#ef4444', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid #ef4444' }}>
            SL: ${stopLoss.toLocaleString()} ({isLong ? `${slPct}%` : `+${Math.abs(Number(slPct))}%`})
          </span>
          <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 600 }}>STOP LOSS INVALIDATION</span>
        </div>

        {/* Dynamic Moving Average Lines if Snapshot present */}
        {snapshot && (
          <>
            <div style={{
              position: 'absolute', left: '35%', right: '1rem', top: `${getPositionY(snapshot.ema20)}%`,
              borderTop: '1px dotted #06b6d4', opacity: 0.75, transform: 'translateY(-50%)'
            }}>
              <span style={{ fontSize: '0.65rem', color: '#06b6d4', position: 'absolute', right: 0, top: '-0.9rem' }}>EMA20 (${snapshot.ema20.toLocaleString()})</span>
            </div>
            <div style={{
              position: 'absolute', left: '35%', right: '1rem', top: `${getPositionY(snapshot.ema50)}%`,
              borderTop: '1px dotted #3b82f6', opacity: 0.75, transform: 'translateY(-50%)'
            }}>
              <span style={{ fontSize: '0.65rem', color: '#3b82f6', position: 'absolute', right: '80px', top: '-0.9rem' }}>EMA50 (${snapshot.ema50.toLocaleString()})</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
