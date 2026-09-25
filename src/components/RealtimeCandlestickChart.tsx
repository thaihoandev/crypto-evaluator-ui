import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Activity,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart2,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';
import { useKlineStream, timeframeToKlineInterval, type KlineInterval } from '../hooks/useBinanceWebSocket';
import { useBinanceStream } from '../context/BinanceStreamContext';
import type { Timeframe, CandleDto } from '../types/trade';
import { formatDynamicPrice } from '../utils/formatters';

// ── Module-level kline cache (shared with CandlestickChart) ──
// Stores fetched candle arrays keyed by "SYMBOL:interval" with a TTL of ~80%
// of the candle timeframe. Prevents repeated Binance REST calls when the user
// switches symbols and comes back, or when React strict-mode double-mounts.
interface RtKlineCacheEntry { candles: CandleDto[]; expiresAt: number; }
const rtKlineCache = new Map<string, RtKlineCacheEntry>();
const RT_KLINE_CACHE_TTL: Record<string, number> = {
  '1m': 48_000, '3m': 144_000, '5m': 240_000, '15m': 720_000,
  '30m': 1_440_000, '1h': 2_880_000, '2h': 5_760_000,
  '4h': 11_520_000, '1d': 69_120_000,
};
const RT_DEFAULT_TTL_MS = 120_000;


interface RealtimeCandlestickChartProps {
  symbol: string;
  timeframe?: Timeframe;
  initialTimeframe?: Timeframe;
  height?: number;
}

const TIMEFRAME_OPTIONS: { label: Timeframe; interval: KlineInterval }[] = [
  { label: 'M1', interval: '1m' },
  { label: 'M5', interval: '5m' },
  { label: 'M15', interval: '15m' },
  { label: 'M30', interval: '30m' },
  { label: 'H1', interval: '1h' },
  { label: 'H4', interval: '4h' },
  { label: 'D1', interval: '1d' }
];

const DEFAULT_VISIBLE_CANDLES = 50;

export const RealtimeCandlestickChart: React.FC<RealtimeCandlestickChartProps> = ({
  symbol,
  timeframe: propTimeframe,
  initialTimeframe = 'H1',
  height = 440
}) => {
  const [timeframe, setTimeframe] = useState<Timeframe>(propTimeframe || initialTimeframe);
  const [candles, setCandles] = useState<CandleDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTickFlashing, setIsTickFlashing] = useState<boolean>(false);

  // Zoom & Pan state
  const [visibleCount, setVisibleCount] = useState<number>(DEFAULT_VISIBLE_CANDLES);
  const [panOffset, setPanOffset] = useState<number>(0); // offset from latest candle
  const isDraggingRef = useRef<boolean>(false);
  const dragStartXRef = useRef<number>(0);
  const initialPanOffsetRef = useRef<number>(0);

  // Hover & Tooltip state
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const klineInterval = timeframeToKlineInterval(timeframe);

  // Real-time miniTicker stream for sub-second price ticks
  const { tickers } = useBinanceStream();
  const liveTicker = tickers[symbol.toUpperCase().trim()];

  // Real-time WebSocket kline stream
  const { latestKline, status: wsStatus } = useKlineStream({
    symbol,
    interval: klineInterval,
    enabled: true
  });

  // 1. Fetch initial 90 historical candles from Binance REST API on symbol/timeframe change
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setPanOffset(0);

    const cacheKey = `${symbol.toUpperCase().trim()}:${klineInterval}`;
    const cached = rtKlineCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      setCandles(cached.candles);
      setIsLoading(false);
      return;
    }

    const fetchHistory = async () => {
      try {
        const binanceSymbol = symbol.toUpperCase().trim();
        const url = `https://fapi.binance.com/fapi/v1/klines?symbol=${binanceSymbol}&interval=${klineInterval}&limit=90`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = (await res.json()) as (string | number)[][];
        if (isCancelled || !Array.isArray(data)) return;

        const mapped: CandleDto[] = data.map((elem) => ({
          openTime: new Date(elem[0] as number).toISOString(),
          open: parseFloat(elem[1] as string),
          high: parseFloat(elem[2] as string),
          low: parseFloat(elem[3] as string),
          close: parseFloat(elem[4] as string),
          volume: parseFloat(elem[5] as string),
        }));

        if (mapped.length > 0) {
          const ttl = RT_KLINE_CACHE_TTL[klineInterval] ?? RT_DEFAULT_TTL_MS;
          rtKlineCache.set(cacheKey, { candles: mapped, expiresAt: Date.now() + ttl });
          if (!isCancelled) setCandles(mapped);
        }
      } catch {
        // Fallback silent
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    fetchHistory();

    return () => {
      isCancelled = true;
    };
  }, [symbol, klineInterval]);


  // 2. Merge real-time WebSocket ticks into the latest open candle
  useEffect(() => {
    if (!latestKline || !latestKline.symbol) return;
    if (latestKline.symbol.toUpperCase() !== symbol.toUpperCase()) return;

    // Trigger visual tick flash animation
    setIsTickFlashing(true);
    const flashTimer = setTimeout(() => setIsTickFlashing(false), 300);

    setCandles((prev) => {
      if (!prev || prev.length === 0) {
        return [
          {
            openTime: new Date(latestKline.openTime).toISOString(),
            open: latestKline.open,
            high: latestKline.high,
            low: latestKline.low,
            close: latestKline.close,
            volume: latestKline.volume,
          }
        ];
      }

      const updated = [...prev];
      const lastIndex = updated.length - 1;
      const lastCandle = updated[lastIndex];

      const lastCandleTime = new Date(lastCandle.openTime).getTime();
      const isSameCandle =
        Math.abs(lastCandleTime - latestKline.openTime) < 60_000 ||
        new Date(lastCandle.openTime).toISOString() === new Date(latestKline.openTime).toISOString();

      if (isSameCandle) {
        updated[lastIndex] = {
          ...lastCandle,
          close: latestKline.close,
          high: Math.max(lastCandle.high, latestKline.high),
          low: Math.min(lastCandle.low, latestKline.low),
          volume: latestKline.volume,
        };
      } else if (latestKline.openTime > lastCandleTime) {
        updated.push({
          openTime: new Date(latestKline.openTime).toISOString(),
          open: latestKline.open,
          high: latestKline.high,
          low: latestKline.low,
          close: latestKline.close,
          volume: latestKline.volume,
        });
        if (updated.length > 150) updated.shift();
      }

      return updated;
    });

    return () => clearTimeout(flashTimer);
  }, [latestKline, symbol]);

  // 3. Sub-second live price tick updates from miniTicker stream
  useEffect(() => {
    if (!liveTicker || !liveTicker.price || liveTicker.price <= 0) return;

    setIsTickFlashing(true);
    const flashTimer = setTimeout(() => setIsTickFlashing(false), 200);

    setCandles((prev) => {
      if (!prev || prev.length === 0) return prev;
      const updated = [...prev];
      const lastIndex = updated.length - 1;
      const lastCandle = updated[lastIndex];

      if (lastCandle.close !== liveTicker.price) {
        updated[lastIndex] = {
          ...lastCandle,
          close: liveTicker.price,
          high: Math.max(lastCandle.high, liveTicker.price),
          low: Math.min(lastCandle.low, liveTicker.price),
        };
      }
      return updated;
    });

    return () => clearTimeout(flashTimer);
  }, [liveTicker]);

  // ─── Visible Window Slice for Zooming & Panning ───────────────────────────
  const visibleCandles = useMemo(() => {
    if (candles.length === 0) return [];
    const count = Math.min(candles.length, Math.max(15, visibleCount));
    const maxOffset = Math.max(0, candles.length - count);
    const currentOffset = Math.min(maxOffset, Math.max(0, panOffset));
    const startIdx = candles.length - count - currentOffset;
    const endIdx = candles.length - currentOffset;
    return candles.slice(Math.max(0, startIdx), Math.max(count, endIdx));
  }, [candles, visibleCount, panOffset]);

  // ─── SVG Layout Dimensions & Price Scale ──────────────────────────────────
  const SVG_WIDTH = 1000;
  const SVG_HEIGHT = height;
  const PRICE_TOP = 20;
  const PRICE_BOTTOM = height - 90;
  const PRICE_HEIGHT = PRICE_BOTTOM - PRICE_TOP;
  const VOL_BOTTOM = height - 35;
  const VOL_MAX_HEIGHT = 45;
  const TIME_AXIS_Y = height - 25;
  const LABEL_AREA_WIDTH = 95;
  const CANDLE_AREA_RIGHT = SVG_WIDTH - LABEL_AREA_WIDTH;

  const { maxPrice, priceRange } = useMemo(() => {
    if (!visibleCandles || visibleCandles.length === 0) {
      return { maxPrice: 100, priceRange: 100 };
    }
    const highs = visibleCandles.map((c) => c.high);
    const lows = visibleCandles.map((c) => c.low);
    const maxP = Math.max(...highs);
    const minP = Math.min(...lows);
    const padding = (maxP - minP) * 0.08 || maxP * 0.02;
    const maxVal = maxP + padding;
    const minVal = Math.max(0, minP - padding);
    return {
      maxPrice: maxVal,
      priceRange: maxVal - minVal || 1
    };
  }, [visibleCandles]);

  const maxVolume = useMemo(() => {
    if (!visibleCandles || visibleCandles.length === 0) return 1;
    return Math.max(...visibleCandles.map((c) => c.volume)) || 1;
  }, [visibleCandles]);

  const getY = (price: number) => {
    const pct = (maxPrice - price) / priceRange;
    return PRICE_TOP + Math.max(0, Math.min(PRICE_HEIGHT, pct * PRICE_HEIGHT));
  };

  const priceTicks = useMemo(() => {
    const ticks = [];
    for (let i = 0; i <= 5; i++) {
      const p = maxPrice - (priceRange * i) / 5;
      ticks.push({ price: p, y: getY(p) });
    }
    return ticks;
  }, [maxPrice, priceRange]);

  const totalCandles = visibleCandles.length;
  const slotWidth = totalCandles > 0 ? CANDLE_AREA_RIGHT / totalCandles : 1;

  // Time Axis Ticks
  const timeTicks = useMemo(() => {
    if (totalCandles === 0) return [];
    const step = Math.max(1, Math.floor(totalCandles / 6));
    const ticks = [];
    for (let i = 0; i < totalCandles; i += step) {
      const c = visibleCandles[i];
      if (c) {
        const dateStr = new Date(c.openTime).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        });
        ticks.push({ x: (i + 0.5) * slotWidth, label: dateStr });
      }
    }
    return ticks;
  }, [visibleCandles, totalCandles, slotWidth]);

  // Hovered candle (for tooltip on hover)
  const hoveredCandle = hoveredIndex !== null && visibleCandles[hoveredIndex]
    ? visibleCandles[hoveredIndex]
    : null;

  // Active candle (or latest candle in dataset)
  const activeCandle = hoveredCandle ?? (candles[candles.length - 1] ?? null);

  const activeCandleChange = activeCandle
    ? activeCandle.close - activeCandle.open
    : 0;

  const activeCandleChangePct = activeCandle && activeCandle.open > 0
    ? (activeCandleChange / activeCandle.open) * 100
    : 0;

  const formatVolume = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(2)}K`;
    return v.toFixed(2);
  };

  // ─── Zoom & Pan Event Handlers ────────────────────────────────────────────
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      // Zoom In
      setVisibleCount((prev) => Math.max(15, prev - 4));
    } else {
      // Zoom Out
      setVisibleCount((prev) => Math.min(candles.length, prev + 4));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    initialPanOffsetRef.current = panOffset;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current || totalCandles === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    // Handle Pan Dragging
    if (isDraggingRef.current) {
      const deltaX = e.clientX - dragStartXRef.current;
      const candleShift = Math.round(deltaX / (rect.width / totalCandles));
      const maxOffset = Math.max(0, candles.length - visibleCount);
      setPanOffset(Math.min(maxOffset, Math.max(0, initialPanOffsetRef.current + candleShift)));
      return;
    }

    const svgX = (x / rect.width) * SVG_WIDTH;
    const index = Math.floor(svgX / slotWidth);
    if (index >= 0 && index < totalCandles) {
      setHoveredIndex(index);
    } else {
      setHoveredIndex(null);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md text-slate-100 font-sans">
      {/* ── Top Header Toolbar ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
        {/* Symbol Name & Realtime Price */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold tracking-tight text-white">{symbol}</h3>
              <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 rounded-md">
                Binance Candlestick
              </span>
              <span
                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold transition-all ${isTickFlashing
                    ? 'bg-cyan-500/40 text-white border-cyan-400 scale-105 shadow-[0_0_12px_rgba(6,182,212,0.8)]'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  } border`}
              >
                <Activity className="w-3 h-3 animate-pulse text-emerald-400" />
                {wsStatus === 'connected' ? 'WS LIVE' : wsStatus.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Scroll Mouse Wheel to Zoom • Drag to Pan • Realtime Binance WebSocket Ticks
            </p>
          </div>
        </div>

        {/* Toolbar Controls: Timeframe & Zoom Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Zoom Control Buttons */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => Math.max(15, prev - 8))}
              title="Zoom In"
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 cursor-pointer transition-all"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => Math.min(candles.length, prev + 8))}
              title="Zoom Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 cursor-pointer transition-all"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setVisibleCount(DEFAULT_VISIBLE_CANDLES);
                setPanOffset(0);
              }}
              title="Reset Zoom & Pan"
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 cursor-pointer transition-all"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Timeframe Buttons */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            {TIMEFRAME_OPTIONS.map((tf) => (
              <button
                key={tf.label}
                type="button"
                onClick={() => setTimeframe(tf.label)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold transition-all cursor-pointer ${timeframe === tf.label
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Active Candle OHLC & Volume Bar (Top Stats Bar) ── */}
      {activeCandle && (
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 mb-4 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-300 font-semibold">
              {new Date(activeCandle.openTime).toLocaleString([], {
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </span>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <span className="text-slate-500 mr-1">O:</span>
              <span className="text-slate-200 font-bold">${formatDynamicPrice(activeCandle.open)}</span>
            </div>
            <div>
              <span className="text-slate-500 mr-1">H:</span>
              <span className="text-emerald-400 font-bold">${formatDynamicPrice(activeCandle.high)}</span>
            </div>
            <div>
              <span className="text-slate-500 mr-1">L:</span>
              <span className="text-rose-400 font-bold">${formatDynamicPrice(activeCandle.low)}</span>
            </div>
            <div>
              <span className="text-slate-500 mr-1">C:</span>
              <span className={`font-extrabold ${isTickFlashing ? 'text-cyan-300 scale-105' : 'text-white'}`}>
                ${formatDynamicPrice(activeCandle.close)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 mr-1">Vol:</span>
              <span className="text-cyan-300 font-bold">{formatVolume(activeCandle.volume)}</span>
            </div>
            <div className="flex items-center font-bold">
              <span className="text-slate-500 mr-1">Change:</span>
              <span className={`flex items-center ${activeCandleChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {activeCandleChange >= 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                {activeCandleChange >= 0 ? '+' : ''}${formatDynamicPrice(activeCandleChange)} ({activeCandleChangePct >= 0 ? '+' : ''}{activeCandleChangePct.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── SVG Candlestick Chart Area (Zoomable & Pannable) ── */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          isDraggingRef.current = false;
          setHoveredIndex(null);
          setMousePos(null);
        }}
        className="relative w-full bg-[#05070d] border border-slate-800 rounded-xl overflow-hidden shadow-inner cursor-crosshair select-none"
      >
        {isLoading && (
          <div className="absolute inset-0 z-20 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center gap-2 text-cyan-400 font-mono text-sm">
            <Activity className="w-5 h-5 animate-spin" />
            <span>Loading Binance Candlestick Data...</span>
          </div>
        )}

        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          preserveAspectRatio="none"
          style={{ width: '100%', height: `${height}px`, display: 'block' }}
          onMouseMove={handleMouseMove}
        >
          {/* Price Y-Axis Gridlines */}
          <g style={{ pointerEvents: 'none' }}>
            {priceTicks.map((tick, i) => (
              <g key={i}>
                <line
                  x1="0"
                  y1={tick.y}
                  x2={CANDLE_AREA_RIGHT}
                  y2={tick.y}
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={SVG_WIDTH - 90}
                  y={tick.y + 4}
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="600"
                >
                  ${formatDynamicPrice(tick.price)}
                </text>
              </g>
            ))}
          </g>

          {/* Time X-Axis Ticks */}
          <g style={{ pointerEvents: 'none' }}>
            <line
              x1="0"
              y1={TIME_AXIS_Y}
              x2={CANDLE_AREA_RIGHT}
              y2={TIME_AXIS_Y}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
            {timeTicks.map((tick, i) => (
              <g key={i}>
                <line
                  x1={tick.x}
                  y1={TIME_AXIS_Y - 4}
                  x2={tick.x}
                  y2={TIME_AXIS_Y + 4}
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="1"
                />
                <text
                  x={tick.x}
                  y={TIME_AXIS_Y + 18}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="500"
                >
                  {tick.label}
                </text>
              </g>
            ))}
          </g>

          {/* ── Candlesticks & Volume Bars Loop ── */}
          {visibleCandles.map((c, i) => {
            const cx = (i + 0.5) * slotWidth;
            const candleWidth = Math.max(3, slotWidth * 0.7);

            const isBull = c.close >= c.open;
            const color = isBull ? '#10b981' : '#f43f5e';

            const highY = getY(c.high);
            const lowY = getY(c.low);
            const openY = getY(c.open);
            const closeY = getY(c.close);

            const topY = Math.min(openY, closeY);
            const bodyHeight = Math.max(2, Math.abs(closeY - openY));

            const volHeight = (c.volume / maxVolume) * VOL_MAX_HEIGHT;
            const volY = VOL_BOTTOM - volHeight;

            const isHovered = hoveredIndex === i;

            return (
              <g key={i} style={{ pointerEvents: 'none' }}>
                {/* Column Highlight on Hover */}
                {isHovered && (
                  <rect
                    x={cx - slotWidth / 2}
                    y={0}
                    width={slotWidth}
                    height={height}
                    fill="rgba(255,255,255,0.05)"
                  />
                )}

                {/* Volume Bar */}
                <rect
                  x={cx - candleWidth / 2}
                  y={volY}
                  width={candleWidth}
                  height={volHeight}
                  fill={color}
                  opacity={isHovered ? 0.9 : 0.35}
                  rx="1"
                />

                {/* Wick High to Low Line */}
                <line
                  x1={cx}
                  y1={highY}
                  x2={cx}
                  y2={lowY}
                  stroke={color}
                  strokeWidth={isHovered ? 2 : 1.2}
                  opacity={isHovered ? 1 : 0.85}
                />

                {/* Candle Body */}
                <rect
                  x={cx - candleWidth / 2}
                  y={topY}
                  width={candleWidth}
                  height={bodyHeight}
                  fill={color}
                  stroke={color}
                  strokeWidth={isHovered ? 1.5 : 0.5}
                  rx="1.5"
                  opacity={isHovered ? 1 : 0.9}
                />
              </g>
            );
          })}

          {/* Latest Live Market Price Dashed Horizontal Line */}
          {candles.length > 0 && (
            <g style={{ pointerEvents: 'none' }}>
              {(() => {
                const latest = candles[candles.length - 1];
                const latestY = getY(latest.close);
                const isBull = latest.close >= latest.open;
                const strokeColor = isBull ? '#10b981' : '#f43f5e';
                return (
                  <>
                    <line
                      x1="0"
                      y1={latestY}
                      x2={CANDLE_AREA_RIGHT}
                      y2={latestY}
                      stroke={strokeColor}
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                    <rect
                      x={SVG_WIDTH - 90}
                      y={latestY - 10}
                      width="88"
                      height="20"
                      rx="4"
                      fill={strokeColor}
                    />
                    <text
                      x={SVG_WIDTH - 46}
                      y={latestY + 4}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="9.5"
                      fontWeight="800"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      ${formatDynamicPrice(latest.close)}
                    </text>
                  </>
                );
              })()}
            </g>
          )}

          {/* Crosshair Cursor Lines */}
          {hoveredIndex !== null && mousePos && (
            <g style={{ pointerEvents: 'none' }}>
              {/* Vertical Crosshair */}
              <line
                x1={(hoveredIndex + 0.5) * slotWidth}
                y1="0"
                x2={(hoveredIndex + 0.5) * slotWidth}
                y2={TIME_AXIS_Y}
                stroke="#06b6d4"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
            </g>
          )}
        </svg>

        {/* ── Interactive Floating Tooltip (On Hover) ── */}
        {hoveredIndex !== null && hoveredCandle && mousePos && (
          <div
            className="absolute pointer-events-none z-30 bg-slate-950/95 border border-cyan-500/40 shadow-2xl rounded-xl p-3.5 text-xs font-mono text-slate-100 backdrop-blur-md space-y-1.5 transition-opacity duration-75"
            style={{
              left: `${Math.min(mousePos.x + 15, (containerRef.current?.offsetWidth ?? 800) - 240)}px`,
              top: `${Math.max(10, Math.min(mousePos.y - 40, (containerRef.current?.offsetHeight ?? 400) - 170))}px`,
              width: '225px'
            }}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 text-[11px]">
              <span className="font-extrabold text-cyan-300">{symbol} ({timeframe})</span>
              <span className="text-slate-400 font-medium">
                {new Date(hoveredCandle.openTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Open:</span>
                <span className="font-bold text-slate-200">${formatDynamicPrice(hoveredCandle.open)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">High:</span>
                <span className="font-bold text-emerald-400">${formatDynamicPrice(hoveredCandle.high)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Low:</span>
                <span className="font-bold text-rose-400">${formatDynamicPrice(hoveredCandle.low)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Close:</span>
                <span className="font-bold text-white">${formatDynamicPrice(hoveredCandle.close)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-800/80 pt-1">
                <span className="text-slate-400">Change:</span>
                {(() => {
                  const chg = hoveredCandle.close - hoveredCandle.open;
                  const chgPct = hoveredCandle.open > 0 ? (chg / hoveredCandle.open) * 100 : 0;
                  const isPos = chg >= 0;
                  return (
                    <span className={`font-extrabold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPos ? '+' : ''}${formatDynamicPrice(chg)} ({isPos ? '+' : ''}{chgPct.toFixed(2)}%)
                    </span>
                  );
                })()}
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Volume:</span>
                <span className="font-bold text-cyan-300">{formatVolume(hoveredCandle.volume)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
