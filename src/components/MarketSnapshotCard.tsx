import React from 'react';
import type { MarketSnapshotDto } from '../types/trade';
import { LineChart } from 'lucide-react';

interface MarketSnapshotCardProps {
  snapshot: MarketSnapshotDto;
  symbol: string;
}

export const MarketSnapshotCard: React.FC<MarketSnapshotCardProps> = ({ snapshot, symbol }) => {
  const formatPrice = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });

  const getRsiColorClass = (rsi: number) => {
    if (rsi > 70) return 'text-rose-400'; // overbought
    if (rsi < 30) return 'text-emerald-400'; // oversold
    return 'text-cyan-400'; // neutral
  };

  return (
    <div className="glass-panel p-5 rounded-2xl shadow-2xl border border-slate-800/80 space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-800/80">
        <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
          <LineChart size={18} />
        </div>
        <h3 className="font-heading font-black text-sm text-slate-100 uppercase tracking-wider">
          Market Snapshot ({symbol})
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
          <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">CURRENT PRICE</div>
          <div className="text-base font-mono font-black text-slate-100 mt-0.5">${formatPrice(snapshot.currentPrice)}</div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
          <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">RSI (14)</div>
          <div className={`text-base font-mono font-black mt-0.5 ${getRsiColorClass(snapshot.rsi)}`}>
            {snapshot.rsi.toFixed(1)}
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
          <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">ATR (14)</div>
          <div className="text-base font-mono font-black text-slate-300 mt-0.5">${snapshot.atr.toFixed(2)}</div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
          <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">VOLUME RATIO</div>
          <div className={`text-base font-mono font-black mt-0.5 ${snapshot.volumeRatio >= 1.2 ? 'text-emerald-400' : snapshot.volumeRatio < 0.8 ? 'text-amber-400' : 'text-cyan-400'}`}>
            {snapshot.volumeRatio.toFixed(2)}x
          </div>
        </div>
      </div>

      {/* Moving Averages List */}
      <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl space-y-2">
        <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
          Exponential Moving Averages
        </div>
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="text-cyan-400 font-bold">EMA 20</span>
          <span className="font-black text-slate-100">${formatPrice(snapshot.ema20)}</span>
        </div>
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="text-blue-400 font-bold">EMA 50</span>
          <span className="font-black text-slate-100">${formatPrice(snapshot.ema50)}</span>
        </div>
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="text-purple-400 font-bold">EMA 200</span>
          <span className="font-black text-slate-100">${formatPrice(snapshot.ema200)}</span>
        </div>
      </div>
    </div>
  );
};
