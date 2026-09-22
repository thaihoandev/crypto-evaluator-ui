import React, { useState, useMemo } from 'react';
import type { TradeDirection, Timeframe, MarketSnapshotDto, CandleDto, TradePredictionDto, TrajectoryPointDto, ScenarioPathDto } from '../types/trade';
import { CandlestickChart as ChartIcon, Layers, Navigation, Clock, GitBranch } from 'lucide-react';

interface CandlestickChartProps {
  symbol: string;
  direction: TradeDirection;
  timeframe?: Timeframe;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  snapshot?: MarketSnapshotDto;
  candles?: CandleDto[];
  prediction?: TradePredictionDto;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({
  symbol,
  direction,
  timeframe = 'H1',
  entryPrice,
  stopLoss,
  takeProfit,
  snapshot,
  candles = [],
  prediction
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredTrajectoryPt, setHoveredTrajectoryPt] = useState<TrajectoryPointDto | null>(null);
  const [showProjection, setShowProjection] = useState(true);
  const [visibleScenarios, setVisibleScenarios] = useState<Record<string, boolean>>({
    Bear: true,
    Base: true,
    Bull: true
  });

  const SCENARIO_STYLES: Record<string, { stroke: string; label: string }> = {
    Bear: { stroke: '#f43f5e', label: '🐻 Bear' },
    Base: { stroke: '#f59e0b', label: '📊 Base' },
    Bull: { stroke: '#10b981', label: '🐂 Bull' }
  };

  const toggleScenario = (name: string) =>
    setVisibleScenarios((prev) => ({ ...prev, [name]: !prev[name] }));

  const isLong = direction === 'Long';

  // ─── Price Bounds ───────────────────────────────────────────────
  const { maxPrice, priceRange } = useMemo(() => {
    const allPrices: number[] = [entryPrice, stopLoss, takeProfit];
    if (snapshot) {
      allPrices.push(snapshot.currentPrice, snapshot.ema20, snapshot.ema50, snapshot.ema200);
    }
    if (candles && candles.length > 0) {
      candles.forEach((c) => { allPrices.push(c.high, c.low); });
    }
    if (prediction?.trajectoryPoints) {
      prediction.trajectoryPoints.forEach((tp) => {
        allPrices.push(tp.price, tp.upperBound, tp.lowerBound);
      });
    }

    const minP = Math.min(...allPrices);
    const maxP = Math.max(...allPrices);
    const padding = (maxP - minP) * 0.08 || maxP * 0.03;

    return {
      maxPrice: maxP + padding,
      priceRange: (maxP + padding) - Math.max(0, minP - padding) || 1
    };
  }, [entryPrice, stopLoss, takeProfit, snapshot, candles, prediction]);

  // ─── SVG Constants ──────────────────────────────────────────────
  const SVG_WIDTH = 1000;
  const SVG_HEIGHT = 400;
  const PRICE_TOP = 25;
  const PRICE_BOTTOM = 280;
  const PRICE_HEIGHT = PRICE_BOTTOM - PRICE_TOP; // 255px
  const VOL_BOTTOM = 345;
  const VOL_MAX_HEIGHT = 45;
  const TIME_AXIS_Y = 355;
  const LABEL_AREA_WIDTH = 90;
  const CANDLE_AREA_RIGHT = SVG_WIDTH - LABEL_AREA_WIDTH; // 910
  const PROJECTION_CANDLE_COUNT = 50; // Monte Carlo engine projects 50 candles into the future

  const getY = (price: number) => {
    const pct = (maxPrice - price) / priceRange;
    return PRICE_TOP + Math.max(0, Math.min(PRICE_HEIGHT, pct * PRICE_HEIGHT));
  };

  const entryY = getY(entryPrice);
  const slY    = getY(stopLoss);
  const tpY    = getY(takeProfit);

  const slPct = (((stopLoss   - entryPrice) / entryPrice) * 100).toFixed(2);
  const tpPct = (((takeProfit - entryPrice) / entryPrice) * 100).toFixed(2);

  // ─── Volume ─────────────────────────────────────────────────────
  const maxVolume = useMemo(() => {
    if (!candles || candles.length === 0) return 1;
    return Math.max(...candles.map((c) => c.volume)) || 1;
  }, [candles]);

  const formatPrice = (p: number) =>
    p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });

  const hoveredCandle = hoveredIndex !== null && candles ? candles[hoveredIndex] : null;

  // ─── Price Ticks ────────────────────────────────────────────────
  const priceTicks = useMemo(() => {
    const ticks = [];
    for (let i = 0; i <= 4; i++) {
      const p = maxPrice - (priceRange * i) / 4;
      ticks.push({ price: p, y: getY(p) });
    }
    return ticks;
  }, [maxPrice, priceRange]);

  // ─── Proportional Candle Scaling (1 Candle = Equal Physical Width) ─
  const totalCandles = candles ? candles.length : 0;
  const totalSlots   = (totalCandles > 0 ? totalCandles : 60) + PROJECTION_CANDLE_COUNT;
  const slotWidth    = CANDLE_AREA_RIGHT / totalSlots;
  const startX       = totalCandles * slotWidth;

  // ─── Backend Calculated Trajectory Points Mapping ───────────────
  const backendTrajectory = useMemo(() => {
    const endX = startX + PROJECTION_CANDLE_COUNT * slotWidth;

    const points = prediction?.trajectoryPoints;
    if (!points || points.length === 0) {
      // Fallback geometric projection curve if not yet evaluated
      const currentPrice = snapshot ? snapshot.currentPrice : entryPrice;
      const startY = getY(currentPrice);
      const targetY = startY;

      return {
        startX,
        endX,
        startY,
        targetY,
        pathD: `M ${startX} ${startY} L ${endX} ${targetY}`,
        corridorD: `M ${startX} ${startY} L ${endX} ${targetY - 15} L ${endX} ${targetY + 15} Z`,
        endPrice: currentPrice,
        isBackendCalculated: false,
        mainPoints: [],
        points: []
      };
    }

    const mainPoints: { x: number; y: number; pt: TrajectoryPointDto }[] = [];
    const upperPoints: { x: number; y: number }[] = [];
    const lowerPoints: { x: number; y: number }[] = [];

    points.forEach((pt) => {
      // Each step maps to pt.step * 2 future candles
      const x = startX + (pt.step * 2) * slotWidth;
      const y = getY(pt.price);
      mainPoints.push({ x, y, pt });
      upperPoints.push({ x, y: getY(pt.upperBound) });
      lowerPoints.push({ x, y: getY(pt.lowerBound) });
    });

    // Build SVG Path string for Main Trajectory Line
    const pathD = mainPoints.reduce((acc, p, idx) => {
      return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    const upperD = upperPoints.reduce((acc, p, idx) => {
      return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    const lowerLineD = lowerPoints.reduce((acc, p, idx) => {
      return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    const lowerD = [...lowerPoints].reverse().reduce((acc, p) => {
      return `${acc} L ${p.x} ${p.y}`;
    }, '');

    const corridorD = `${upperD} ${lowerD} Z`;
    const lastPt = points[points.length - 1];

    return {
      startX,
      endX,
      startY: mainPoints[0].y,
      targetY: mainPoints[mainPoints.length - 1].y,
      pathD,
      upperPathD: upperD,
      lowerPathD: lowerLineD,
      corridorD,
      endPrice: lastPt.price,
      isBackendCalculated: true,
      mainPoints,
      points
    };
  }, [startX, slotWidth, snapshot, entryPrice, takeProfit, tpY, getY, prediction]);

  // ─── Time Axis Labels Generation (Real-world Timestamps) ─────────
  const timeTicks = useMemo(() => {
    const ticks: { x: number; label: string; isProjection: boolean }[] = [];

    const formatTimeLabel = (dtStr?: string, tf?: Timeframe) => {
      if (!dtStr) return '';
      const d = new Date(dtStr);
      if (isNaN(d.getTime())) return '';
      const h = d.getHours().toString().padStart(2, '0');
      const m = d.getMinutes().toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      const mo = (d.getMonth() + 1).toString().padStart(2, '0');

      if (tf === 'D1') return `${day}/${mo}`;
      if (tf === 'H4') return `${day}/${mo} ${h}:${m}`;
      return `${h}:${m}`;
    };

    // 1. History Candle Ticks (~4 ticks)
    if (candles && candles.length > 0) {
      const step = Math.max(1, Math.floor(candles.length / 4));
      for (let i = 0; i < candles.length - 1; i += step) {
        const x = (i + 0.5) * slotWidth;
        ticks.push({
          x,
          label: formatTimeLabel(candles[i].openTime, timeframe),
          isProjection: false
        });
      }
    }

    // 2. NOW / Transition boundary tick
    if (candles && candles.length > 0) {
      const lastCandle = candles[candles.length - 1];
      ticks.push({
        x: startX,
        label: formatTimeLabel(lastCandle.openTime, timeframe),
        isProjection: false
      });
    }

    // 3. Trajectory Projection Ticks (~3 ticks)
    const points = prediction?.trajectoryPoints;
    if (points && points.length > 0) {
      const selectSteps = [8, 16, 25].filter((s) => s < points.length);
      selectSteps.forEach((sIdx) => {
        const pt = points[sIdx];
        const x = startX + (pt.step * 2) * slotWidth;
        ticks.push({
          x,
          label: pt.timestamp ? formatTimeLabel(pt.timestamp, timeframe) : `+${pt.step * 2}c`,
          isProjection: true
        });
      });
    }

    return ticks;
  }, [candles, slotWidth, startX, prediction, timeframe]);

  return (
    <div className="card" style={{ width: '100%' }}>
      {/* ── Header ── */}
      <div className="card-title" style={{ justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ChartIcon size={20} color="#06b6d4" />
          Live Candlestick & Monte Carlo Trajectory ({symbol} • {timeframe})
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', fontWeight: 600, flexWrap: 'wrap' }}>
          <span style={{ color: '#06b6d4' }}>● EMA 20 (${snapshot ? formatPrice(snapshot.ema20) : '---'})</span>
          <span style={{ color: '#3b82f6' }}>● EMA 50 (${snapshot ? formatPrice(snapshot.ema50) : '---'})</span>
          <span style={{ color: '#8b5cf6' }}>● EMA 200 (${snapshot ? formatPrice(snapshot.ema200) : '---'})</span>

          {/* Scenario toggle buttons */}
          {prediction?.scenarioPaths && prediction.scenarioPaths.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <GitBranch size={12} color="#64748b" />
              {Object.entries(SCENARIO_STYLES).map(([name, s]) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggleScenario(name)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.2rem',
                    background: visibleScenarios[name] ? `${s.stroke}22` : 'rgba(100,116,139,0.08)',
                    border: `1px solid ${visibleScenarios[name] ? s.stroke + '88' : 'rgba(100,116,139,0.2)'}`,
                    borderRadius: '5px', padding: '0.15rem 0.5rem',
                    color: visibleScenarios[name] ? s.stroke : '#64748b',
                    cursor: 'pointer', fontWeight: 700, fontSize: '0.68rem'
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowProjection((p) => !p)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: showProjection ? 'rgba(6, 182, 212, 0.15)' : 'rgba(100, 116, 139, 0.1)',
              border: `1px solid ${showProjection ? 'rgba(6, 182, 212, 0.4)' : 'rgba(100, 116, 139, 0.25)'}`,
              borderRadius: '6px',
              padding: '0.2rem 0.6rem',
              color: showProjection ? '#06b6d4' : '#64748b',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.72rem'
            }}
          >
            <Navigation size={12} />
            {showProjection ? 'Corridor ON' : 'Corridor OFF'}
          </button>
        </div>
      </div>

      {/* ── Hover Banner (Candle OHLCV or Trajectory Step Info) ── */}
      <div style={{ height: '36px', minHeight: '36px', marginBottom: '0.75rem', display: 'flex', alignItems: 'center' }}>
        {hoveredCandle ? (
          <div style={{
            width: '100%', display: 'flex', gap: '1.5rem',
            background: '#0a0e16', border: '1px solid rgba(255,255,255,0.08)',
            padding: '0.35rem 0.85rem', borderRadius: '6px',
            fontSize: '0.8rem', alignItems: 'center', flexWrap: 'wrap', fontFamily: 'JetBrains Mono, monospace'
          }}>
            <div>Time: <strong style={{ color: '#f8fafc' }}>{new Date(hoveredCandle.openTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></div>
            <div>O: <strong style={{ color: '#f8fafc' }}>${formatPrice(hoveredCandle.open)}</strong></div>
            <div>H: <strong style={{ color: '#10b981' }}>${formatPrice(hoveredCandle.high)}</strong></div>
            <div>L: <strong style={{ color: '#f43f5e' }}>${formatPrice(hoveredCandle.low)}</strong></div>
            <div>C: <strong style={{ color: hoveredCandle.close >= hoveredCandle.open ? '#10b981' : '#f43f5e' }}>${formatPrice(hoveredCandle.close)}</strong></div>
            <div>Vol: <strong style={{ color: '#06b6d4' }}>{hoveredCandle.volume.toFixed(2)}</strong></div>
          </div>
        ) : hoveredTrajectoryPt ? (
          <div style={{
            width: '100%', display: 'flex', gap: '1rem',
            background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.3)',
            padding: '0.35rem 0.85rem', borderRadius: '6px',
            fontSize: '0.78rem', alignItems: 'center', flexWrap: 'wrap', fontFamily: 'JetBrains Mono, monospace'
          }}>
            <div style={{ color: '#06b6d4', fontWeight: 800 }}>
              STEP {hoveredTrajectoryPt.step} (+{hoveredTrajectoryPt.step * 2}c)
            </div>
            {hoveredTrajectoryPt.timestamp && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Clock size={12} color="#06b6d4" />
                <strong style={{ color: '#f8fafc' }}>
                  {new Date(hoveredTrajectoryPt.timestamp).toLocaleString([], { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </strong>
              </div>
            )}
            <div>Exp. O: <strong style={{ color: '#f8fafc' }}>${formatPrice(hoveredTrajectoryPt.expectedOpen ?? hoveredTrajectoryPt.price)}</strong></div>
            <div>H: <strong style={{ color: '#10b981' }}>${formatPrice(hoveredTrajectoryPt.expectedHigh ?? hoveredTrajectoryPt.upperBound)}</strong></div>
            <div>L: <strong style={{ color: '#f43f5e' }}>${formatPrice(hoveredTrajectoryPt.expectedLow ?? hoveredTrajectoryPt.lowerBound)}</strong></div>
            <div>C: <strong style={{ color: '#06b6d4' }}>${formatPrice(hoveredTrajectoryPt.expectedClose ?? hoveredTrajectoryPt.price)}</strong></div>
            <div style={{ paddingLeft: '0.5rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
              TP Hit So Far: <strong style={{ color: '#10b981' }}>{hoveredTrajectoryPt.cumulativeTpHitProb ?? 0}%</strong>
            </div>
            <div>
              SL Hit So Far: <strong style={{ color: '#f43f5e' }}>{hoveredTrajectoryPt.cumulativeSlHitProb ?? 0}%</strong>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Layers size={14} color="#06b6d4" />
            {backendTrajectory.isBackendCalculated
              ? `Hover over future trajectory candles to inspect step-by-step OHLC forecasts and cumulative TP/SL hit probabilities.`
              : `Hover over candles to inspect OHLCV data. Trajectory shows expected price path corridor.`}
          </div>
        )}
      </div>

      {/* ── SVG Canvas ── */}
      <div style={{
        position: 'relative', width: '100%',
        background: '#070a12', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px', overflow: 'hidden'
      }}>
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          preserveAspectRatio="none"
          style={{ width: '100%', height: '400px', display: 'block' }}
          onMouseLeave={() => {
            setHoveredIndex(null);
            setHoveredTrajectoryPt(null);
          }}
        >
          {/* Gradient Definitions */}
          <defs>
            <linearGradient id="longTrajectoryGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="shortTrajectoryGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="corridorFill" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={isLong ? '#10b981' : '#f43f5e'} stopOpacity="0.04" />
              <stop offset="100%" stopColor={isLong ? '#10b981' : '#f43f5e'} stopOpacity="0.18" />
            </linearGradient>
          </defs>

          {/* Grid Lines */}
          <g style={{ pointerEvents: 'none' }}>
            {priceTicks.map((tick, i) => (
              <g key={i}>
                <line x1="0" y1={tick.y} x2={CANDLE_AREA_RIGHT} y2={tick.y}
                  stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="4 4" />
                <text x={SVG_WIDTH - 82} y={tick.y + 4}
                  fill="#64748b" fontSize="10.5" fontFamily="JetBrains Mono, monospace" fontWeight="600">
                  ${formatPrice(tick.price)}
                </text>
              </g>
            ))}
          </g>

          {/* ── X-AXIS TIME LABELS & GUIDELINES ── */}
          <g style={{ pointerEvents: 'none' }}>
            <line x1="0" y1={TIME_AXIS_Y} x2={CANDLE_AREA_RIGHT} y2={TIME_AXIS_Y}
              stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

            {timeTicks.map((tick, i) => (
              <g key={i}>
                <line
                  x1={tick.x} y1={TIME_AXIS_Y - 5}
                  x2={tick.x} y2={TIME_AXIS_Y + 5}
                  stroke={tick.isProjection ? 'rgba(6, 182, 212, 0.6)' : 'rgba(255,255,255,0.2)'}
                  strokeWidth="1.5"
                />
                <text
                  x={tick.x} y={TIME_AXIS_Y + 22}
                  textAnchor="middle"
                  fill={tick.isProjection ? '#06b6d4' : '#94a3b8'}
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight={tick.isProjection ? '700' : '500'}
                >
                  {tick.label}
                </text>
              </g>
            ))}
          </g>

          {/* ── Backend Calculated Trajectory Corridor & Path ── */}
          {showProjection && backendTrajectory && (
            <g style={{ pointerEvents: 'none' }}>
              {/* Vertical separator: History vs Projection */}
              <line
                x1={backendTrajectory.startX}
                y1={PRICE_TOP}
                x2={backendTrajectory.startX}
                y2={PRICE_BOTTOM}
                stroke="rgba(6, 182, 212, 0.4)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <rect
                x={backendTrajectory.startX + 4}
                y={PRICE_TOP + 4}
                width="140"
                height="18"
                fill="rgba(6, 182, 212, 0.15)"
                rx="4"
              />
              <text
                x={backendTrajectory.startX + 8}
                y={PRICE_TOP + 17}
                fill="#06b6d4"
                fontSize="9"
                fontWeight="800"
                fontFamily="Inter, sans-serif"
              >
                {backendTrajectory.isBackendCalculated ? '▶ QUANT MONTE CARLO' : '▶ PREDICTED PATH'}
              </text>

              {/* Confidence Corridor Shading Area (Backend Percentile Envelope) */}
              <path
                d={backendTrajectory.corridorD}
                fill="url(#corridorFill)"
                stroke="none"
              />

              {/* Peak High Boundary Line (Upper Wick Envelope) */}
              {backendTrajectory.upperPathD && (
                <path
                  d={backendTrajectory.upperPathD}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  opacity="0.5"
                />
              )}

              {/* Trough Low Boundary Line (Lower Wick Envelope) */}
              {backendTrajectory.lowerPathD && (
                <path
                  d={backendTrajectory.lowerPathD}
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  opacity="0.5"
                />
              )}

              {/* ── Scenario Paths (Bear / Base / Bull coherent real paths) ── */}
              {prediction?.scenarioPaths?.map((scenario: ScenarioPathDto) => {
                if (!visibleScenarios[scenario.name]) return null;
                const style = SCENARIO_STYLES[scenario.name];
                if (!style) return null;

                // Map each scenario point to SVG coords using the same x-mapping
                // as the trajectory envelope: x = startX + step*2*slotWidth
                const pts = scenario.points.map((pt) => ({
                  x: startX + (pt.step * 2) * slotWidth,
                  y: getY(pt.price)
                }));

                const pathD = pts.reduce((acc, p, idx) =>
                  idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '');

                const endPt = pts[pts.length - 1];
                const lastPtData = scenario.points[scenario.points.length - 1];

                return (
                  <g key={scenario.name} style={{ pointerEvents: 'none' }}>
                    {/* Scenario Path Line */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={style.stroke}
                      strokeWidth={scenario.name === 'Base' ? 2.5 : 1.75}
                      strokeDasharray={scenario.name === 'Bear' ? '4 3' : scenario.name === 'Bull' ? '4 3' : 'none'}
                      opacity={scenario.name === 'Base' ? 0.9 : 0.65}
                    />
                    {/* Scenario endpoint label */}
                    {endPt && (
                      <>
                        <circle cx={endPt.x} cy={endPt.y} r="4" fill={style.stroke} opacity="0.9" />
                        <g transform={`translate(${Math.min(SVG_WIDTH - 110, endPt.x + 6)}, ${endPt.y - 10})`}>
                          <rect
                            width="100"
                            height="18"
                            rx="3"
                            fill="#090d16"
                            stroke={style.stroke}
                            strokeWidth="0.8"
                            opacity="0.9"
                          />
                          <text
                            x="5" y="13"
                            fill={style.stroke}
                            fontSize="8.5"
                            fontWeight="800"
                            fontFamily="JetBrains Mono, monospace"
                          >
                            {scenario.name.toUpperCase()}: ${formatPrice(lastPtData?.price ?? 0)}
                          </text>
                        </g>
                      </>
                    )}
                  </g>
                );
              })}

              {/* Main Trajectory Path (Median Percentile Envelope) */}
              <path
                d={backendTrajectory.pathD}
                fill="none"
                stroke={isLong ? 'url(#longTrajectoryGrad)' : 'url(#shortTrajectoryGrad)'}
                strokeWidth="3.5"
                strokeDasharray="6 3"
                opacity="0.45"
              />

              {/* Trajectory Key Step Node Markers */}
              {backendTrajectory.mainPoints?.map((p, idx) => {
                const isHovered = hoveredTrajectoryPt?.step === p.pt.step;
                const isKeyStep = p.pt.step % 5 === 0;

                return (
                  <circle
                    key={idx}
                    cx={p.x}
                    cy={p.y}
                    r={isHovered ? 6 : isKeyStep ? 4 : 2.5}
                    fill={isHovered ? '#06b6d4' : (isLong ? '#10b981' : '#f43f5e')}
                    opacity={isHovered ? 1 : isKeyStep ? 0.9 : 0.6}
                  />
                );
              })}

              {/* Interactive Hover Crosshair Focus Line & Peak/Trough Badges */}
              {hoveredTrajectoryPt && backendTrajectory.mainPoints && (() => {
                const p = backendTrajectory.mainPoints.find((mp) => mp.pt.step === hoveredTrajectoryPt.step);
                if (!p) return null;

                const highY = getY(p.pt.expectedHigh ?? p.pt.upperBound);
                const lowY = getY(p.pt.expectedLow ?? p.pt.lowerBound);

                return (
                  <g style={{ pointerEvents: 'none' }}>
                    {/* Vertical Step Guide Line */}
                    <line x1={p.x} y1={highY} x2={p.x} y2={lowY} stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="3 3" />

                    {/* Peak High Marker Dot & Badge */}
                    <circle cx={p.x} cy={highY} r="4" fill="#10b981" />
                    <g transform={`translate(${Math.min(SVG_WIDTH - 200, p.x + 8)}, ${highY - 12})`}>
                      <rect width="90" height="18" rx="4" fill="#061a12" stroke="#10b981" strokeWidth="1" />
                      <text x="6" y="13" fill="#10b981" fontSize="9" fontWeight="800" fontFamily="JetBrains Mono, monospace">
                        PEAK: ${formatPrice(p.pt.expectedHigh ?? p.pt.upperBound)}
                      </text>
                    </g>

                    {/* Trough Low Marker Dot & Badge */}
                    <circle cx={p.x} cy={lowY} r="4" fill="#f43f5e" />
                    <g transform={`translate(${Math.min(SVG_WIDTH - 200, p.x + 8)}, ${lowY - 6})`}>
                      <rect width="90" height="18" rx="4" fill="#22070e" stroke="#f43f5e" strokeWidth="1" />
                      <text x="6" y="13" fill="#f43f5e" fontSize="9" fontWeight="800" fontFamily="JetBrains Mono, monospace">
                        LOW: ${formatPrice(p.pt.expectedLow ?? p.pt.lowerBound)}
                      </text>
                    </g>
                  </g>
                );
              })()}

              {/* Start Dot */}
              <circle
                cx={backendTrajectory.startX}
                cy={backendTrajectory.startY}
                r="5"
                fill={isLong ? '#10b981' : '#f43f5e'}
              />

              {/* Target Endpoint Glowing Marker */}
              <circle
                cx={backendTrajectory.endX}
                cy={backendTrajectory.targetY}
                r="7"
                fill={isLong ? '#10b981' : '#f43f5e'}
                opacity="0.9"
              />
              <circle
                cx={backendTrajectory.endX}
                cy={backendTrajectory.targetY}
                r="12"
                fill={isLong ? '#10b981' : '#f43f5e'}
                opacity="0.3"
              />

              {/* Trajectory Milestone Target Badge */}
              <g transform={`translate(${backendTrajectory.endX - 165}, ${backendTrajectory.targetY - 14})`}>
                <rect width="160" height="28" rx="6" fill="#090d16" stroke={isLong ? '#10b981' : '#f43f5e'} strokeWidth="1" />
                <text x="8" y="18" fill={isLong ? '#10b981' : '#f43f5e'} fontSize="10.5" fontWeight="800" fontFamily="Inter, sans-serif">
                  TARGET: ${formatPrice(takeProfit)}
                </text>
              </g>
            </g>
          )}

          {/* ── Candlesticks & Volume ── */}
          {candles && totalCandles > 0 && (
            <g style={{ pointerEvents: 'none' }}>
              {candles.map((c, i) => {
                const cx = (i + 0.5) * slotWidth;
                const candleWidth = Math.max(3, slotWidth * 0.65);

                const isBull = c.close >= c.open;
                const color = isBull ? '#10b981' : '#f43f5e';

                const highY  = getY(c.high);
                const lowY   = getY(c.low);
                const openY  = getY(c.open);
                const closeY = getY(c.close);

                const topY       = Math.min(openY, closeY);
                const bodyHeight = Math.max(2, Math.abs(closeY - openY));

                const volHeight = (c.volume / maxVolume) * VOL_MAX_HEIGHT;
                const volY     = VOL_BOTTOM - volHeight;
                const isHovered = hoveredIndex === i;

                return (
                  <g key={i}>
                    {isHovered && (
                      <rect
                        x={cx - slotWidth / 2} y={0}
                        width={slotWidth} height={SVG_HEIGHT}
                        fill="#ffffff" opacity={0.05}
                      />
                    )}
                    {/* Volume Bar */}
                    <rect
                      x={cx - candleWidth / 2} y={volY}
                      width={candleWidth} height={volHeight}
                      fill={color} opacity={isHovered ? 0.6 : 0.25} rx="1"
                    />
                    {/* Wick */}
                    <line x1={cx} y1={highY} x2={cx} y2={lowY}
                      stroke={color} strokeWidth={isHovered ? 2.5 : 1.5} />
                    {/* Body */}
                    <rect
                      x={cx - candleWidth / 2} y={topY}
                      width={candleWidth} height={bodyHeight}
                      fill={color} rx="1"
                    />
                  </g>
                );
              })}
            </g>
          )}

          {/* ── Take Profit Level Line ── */}
          <g style={{ pointerEvents: 'none' }}>
            <line x1="0" y1={tpY} x2={CANDLE_AREA_RIGHT} y2={tpY}
              stroke="#10b981" strokeWidth="2" strokeDasharray="6 4" />
            <rect x="10" y={tpY - 12} width="180" height="24"
              fill="#061a12" stroke="#10b981" strokeWidth="1" rx="4" />
            <text x="20" y={tpY + 4} fill="#10b981" fontSize="11" fontWeight="800" fontFamily="JetBrains Mono, monospace">
              TP: ${formatPrice(takeProfit)} ({isLong ? `+${tpPct}%` : `${tpPct}%`})
            </text>
          </g>

          {/* ── Entry Price Line ── */}
          <g style={{ pointerEvents: 'none' }}>
            <line x1="0" y1={entryY} x2={CANDLE_AREA_RIGHT} y2={entryY}
              stroke="#06b6d4" strokeWidth="2" />
            <rect x="10" y={entryY - 12} width="150" height="24"
              fill="#051922" stroke="#06b6d4" strokeWidth="1" rx="4" />
            <text x="20" y={entryY + 4} fill="#06b6d4" fontSize="11" fontWeight="800" fontFamily="JetBrains Mono, monospace">
              ENTRY: ${formatPrice(entryPrice)}
            </text>
          </g>

          {/* ── Stop Loss Line ── */}
          <g style={{ pointerEvents: 'none' }}>
            <line x1="0" y1={slY} x2={CANDLE_AREA_RIGHT} y2={slY}
              stroke="#f43f5e" strokeWidth="2" strokeDasharray="6 4" />
            <rect x="10" y={slY - 12} width="180" height="24"
              fill="#22070e" stroke="#f43f5e" strokeWidth="1" rx="4" />
            <text x="20" y={slY + 4} fill="#f43f5e" fontSize="11" fontWeight="800" fontFamily="JetBrains Mono, monospace">
              SL: ${formatPrice(stopLoss)} ({isLong ? `${slPct}%` : `+${Math.abs(Number(slPct))}%`})
            </text>
          </g>

          {/* Interactive Mouse Listener Layer for Historical Candles */}
          {candles && totalCandles > 0 && (
            <g>
              {candles.map((_, i) => {
                const cx = (i + 0.5) * slotWidth;
                return (
                  <rect
                    key={i}
                    x={cx - slotWidth / 2} y={0}
                    width={slotWidth} height={SVG_HEIGHT}
                    fill="transparent"
                    style={{ cursor: 'pointer', pointerEvents: 'all' }}
                    onMouseEnter={() => {
                      setHoveredIndex(i);
                      setHoveredTrajectoryPt(null);
                    }}
                  />
                );
              })}
            </g>
          )}

          {/* Interactive Mouse Listener Layer for Trajectory Points */}
          {showProjection && backendTrajectory.mainPoints && (
            <g>
              {backendTrajectory.mainPoints.map((p, i) => {
                const stepXWidth = 2 * slotWidth;
                return (
                  <rect
                    key={`traj-${i}`}
                    x={p.x - stepXWidth / 2} y={0}
                    width={stepXWidth} height={SVG_HEIGHT}
                    fill="transparent"
                    style={{ cursor: 'pointer', pointerEvents: 'all' }}
                    onMouseEnter={() => {
                      setHoveredIndex(null);
                      setHoveredTrajectoryPt(p.pt);
                    }}
                  />
                );
              })}
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
