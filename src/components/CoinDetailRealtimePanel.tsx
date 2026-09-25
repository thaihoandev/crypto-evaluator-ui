import React from 'react';
import {
  Activity,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Zap,
  TrendingUp
} from 'lucide-react';
import { useCoinDetailStream } from '../hooks/useCoinDetailStream';
import { timeframeToKlineInterval } from '../hooks/useBinanceWebSocket';

interface CoinDetailRealtimePanelProps {
  symbol: string;
  timeframe?: string;
}

export const CoinDetailRealtimePanel: React.FC<CoinDetailRealtimePanelProps> = ({
  symbol,
  timeframe = 'H1'
}) => {
  const klineInterval = timeframeToKlineInterval(timeframe);

  const {
    ticker,
    markPrice,
    bookTicker,
    orderBook,
    status
  } = useCoinDetailStream({
    symbol,
    interval: klineInterval,
    enabled: true
  });

  // Calculate next funding countdown
  const getFundingTimeRemaining = (nextFundingMs: number) => {
    if (!nextFundingMs) return '--:--:--';
    const diff = Math.max(0, nextFundingMs - Date.now());
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isPositiveChange = (ticker?.priceChangePct ?? 0) >= 0;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md text-slate-100 font-sans">
      {/* ── Top Bar: Symbol & Live Connection Status ── */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold tracking-tight text-white">{symbol}</h3>
              <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Binance Futures
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span>Timeframe: {timeframe}</span>
              <span>•</span>
              <span>Stream: Dynamic WebSocket</span>
            </p>
          </div>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              status === 'connected'
                ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse'
                : status === 'connecting' || status === 'reconnecting'
                ? 'bg-amber-500 animate-ping'
                : 'bg-rose-500'
            }`}
          />
          <span className="text-xs font-medium uppercase tracking-wider font-mono text-slate-300">
            {status}
          </span>
        </div>
      </div>

      {/* ── Realtime Main Price Header ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
        {/* Realtime Price & 24h Change */}
        <div className="md:col-span-2 bg-slate-850/60 p-4 rounded-xl border border-slate-800/80">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Realtime Mark Price / Index
          </span>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-extrabold font-mono tracking-tight text-white">
              {markPrice ? `$${markPrice.markPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : ticker ? `$${ticker.price.toLocaleString()}` : '---'}
            </span>
            {ticker && (
              <span
                className={`flex items-center text-sm font-semibold px-2 py-0.5 rounded-md ${
                  isPositiveChange
                    ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                    : 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
                }`}
              >
                {isPositiveChange ? <ArrowUpRight className="w-4 h-4 mr-0.5" /> : <ArrowDownRight className="w-4 h-4 mr-0.5" />}
                {ticker.priceChangePct >= 0 ? '+' : ''}
                {ticker.priceChangePct.toFixed(2)}%
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-400 mt-2">
            <span>Index: {markPrice ? `$${markPrice.indexPrice.toLocaleString()}` : '--'}</span>
            <span>Last WS: {ticker ? `$${ticker.price.toLocaleString()}` : '--'}</span>
          </div>
        </div>

        {/* Funding Rate & Countdown */}
        <div className="bg-slate-850/60 p-4 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Funding Rate (8h)
            </span>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-300">
            {markPrice ? `${(markPrice.fundingRate * 100).toFixed(4)}%` : '0.0100%'}
          </div>
          <div className="text-xs font-mono text-slate-400 mt-2 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Next: {markPrice ? getFundingTimeRemaining(markPrice.nextFundingTime) : '--:--:--'}</span>
          </div>
        </div>

        {/* 24h High / Low / Volume */}
        <div className="bg-slate-850/60 p-4 rounded-xl border border-slate-800/80">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            24h Volume (USDT)
          </span>
          <div className="text-xl font-bold font-mono text-cyan-300">
            {ticker ? `$${(ticker.quoteVolume24h / 1_000_000).toFixed(2)}M` : '--'}
          </div>
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mt-2">
            <span className="text-emerald-400">H: {ticker ? `$${ticker.high24h.toLocaleString()}` : '--'}</span>
            <span className="text-rose-400">L: {ticker ? `$${ticker.low24h.toLocaleString()}` : '--'}</span>
          </div>
        </div>
      </div>

      {/* ── Bottom Grid: Best Bid/Ask & Orderbook Preview ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Book Ticker Best Bid / Ask */}
        <div className="bg-slate-850/40 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Best Bid / Best Ask (Book Ticker)
            </h4>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg text-emerald-300">
              <span className="text-[10px] uppercase font-semibold text-emerald-400 block">Best Bid</span>
              <div className="text-sm font-bold font-mono">
                {bookTicker ? `$${bookTicker.bestBidPrice.toLocaleString()}` : '--'}
              </div>
              <div className="text-[11px] font-mono text-emerald-400/80 mt-0.5">
                Qty: {bookTicker ? bookTicker.bestBidQty.toFixed(3) : '--'}
              </div>
            </div>

            <div className="bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg text-rose-300">
              <span className="text-[10px] uppercase font-semibold text-rose-400 block">Best Ask</span>
              <div className="text-sm font-bold font-mono">
                {bookTicker ? `$${bookTicker.bestAskPrice.toLocaleString()}` : '--'}
              </div>
              <div className="text-[11px] font-mono text-rose-400/80 mt-0.5">
                Qty: {bookTicker ? bookTicker.bestAskQty.toFixed(3) : '--'}
              </div>
            </div>
          </div>
        </div>

        {/* Order Book Top Depth Preview */}
        <div className="bg-slate-850/40 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Order Book Depth (Top 5)
              </h4>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Binance @depth10</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {/* Top Bids (Buyers) */}
            <div>
              <div className="flex justify-between text-[10px] font-semibold text-emerald-400 border-b border-slate-800 pb-1 mb-1">
                <span>BUY PRICE</span>
                <span>QTY</span>
              </div>
              {orderBook?.bids?.slice(0, 5).map((bid, i) => (
                <div key={i} className="flex justify-between text-emerald-300/90 py-0.5">
                  <span>${bid.price.toLocaleString()}</span>
                  <span className="text-slate-400">{bid.qty.toFixed(2)}</span>
                </div>
              )) || <div className="text-slate-500 text-[11px]">Waiting depth...</div>}
            </div>

            {/* Top Asks (Sellers) */}
            <div>
              <div className="flex justify-between text-[10px] font-semibold text-rose-400 border-b border-slate-800 pb-1 mb-1">
                <span>SELL PRICE</span>
                <span>QTY</span>
              </div>
              {orderBook?.asks?.slice(0, 5).map((ask, i) => (
                <div key={i} className="flex justify-between text-rose-300/90 py-0.5">
                  <span>${ask.price.toLocaleString()}</span>
                  <span className="text-slate-400">{ask.qty.toFixed(2)}</span>
                </div>
              )) || <div className="text-slate-500 text-[11px]">Waiting depth...</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
