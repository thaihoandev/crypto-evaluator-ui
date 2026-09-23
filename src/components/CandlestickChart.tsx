import React, { useState, useMemo, useRef } from 'react';
import type { TradeDirection, Timeframe, MarketSnapshotDto, CandleDto, TradePredictionDto, TrajectoryPointDto, ScenarioPathDto } from '../types/trade';
import { CandlestickChart as ChartIcon, Clock, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

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
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredTrajectoryPt, setHoveredTrajectoryPt] = useState<TrajectoryPointDto | null>(null);
  const [hoveredScenarioName, setHoveredScenarioName] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const [showProjection, setShowProjection] = useState(true); // Controls corridor shading
  const [visibleScenarios, setVisibleScenarios] = useState<Record<string, boolean>>({
    Bear: true,
    Base: true,
    Bull: true
  });

  const SCENARIO_STYLES: Record<string, { stroke: string; label: string; nameVi: string; emoji: string; desc: string }> = {
    Bull: { stroke: '#10b981', label: '🐂 Bull P90', nameVi: 'Kịch Bản Tăng (Bull P90)', emoji: '🐂', desc: 'Phân vị 90% tích cực khi tăng' },
    Base: { stroke: '#f59e0b', label: '📊 Base P50', nameVi: 'Kịch Bản Cơ Sở (Base P50)', emoji: '📊', desc: 'Trung vị 50% kỳ vọng nhất' },
    Bear: { stroke: '#f43f5e', label: '🐻 Bear P10', nameVi: 'Kịch Bản Giảm (Bear P10)', emoji: '🐻', desc: 'Phân vị 10% kịch bản xấu nhất' }
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
  const SVG_HEIGHT = 420;
  const PRICE_TOP = 25;
  const PRICE_BOTTOM = 300;
  const PRICE_HEIGHT = PRICE_BOTTOM - PRICE_TOP; // 275px
  const VOL_BOTTOM = 365;
  const VOL_MAX_HEIGHT = 45;
  const TIME_AXIS_Y = 375;
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

  // ─── Proportional Candle Scaling ────────────────────────────────
  const totalCandles = candles ? candles.length : 0;
  const totalSlots   = (totalCandles > 0 ? totalCandles : 60) + PROJECTION_CANDLE_COUNT;
  const slotWidth    = CANDLE_AREA_RIGHT / totalSlots;
  const startX       = totalCandles * slotWidth;

  // ─── Backend Calculated Trajectory Points Mapping ───────────────
  const backendTrajectory = useMemo(() => {
    const endX = startX + PROJECTION_CANDLE_COUNT * slotWidth;

    const points = prediction?.trajectoryPoints;
    if (!points || points.length === 0) {
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
      const x = startX + (pt.step * 2) * slotWidth;
      const y = getY(pt.price);
      mainPoints.push({ x, y, pt });
      upperPoints.push({ x, y: getY(pt.upperBound) });
      lowerPoints.push({ x, y: getY(pt.lowerBound) });
    });

    const pathD = mainPoints.reduce((acc, p, idx) =>
      idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '');

    const upperD = upperPoints.reduce((acc, p, idx) =>
      idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '');

    const lowerLineD = lowerPoints.reduce((acc, p, idx) =>
      idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '');

    const lowerD = [...lowerPoints].reverse().reduce((acc, p) => `${acc} L ${p.x} ${p.y}`, '');

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

  // ─── Scenario Summary Calculation for Cards Below Chart ─────────
  const scenarioSummaryData = useMemo(() => {
    if (!prediction?.scenarioPaths) return null;
    const map: Record<string, { price: number; diffPct: number; diffText: string }> = {};

    prediction.scenarioPaths.forEach((sc) => {
      const lastPt = sc.points[sc.points.length - 1];
      if (lastPt) {
        const price = lastPt.price;
        const diffPct = entryPrice > 0 ? ((price - entryPrice) / entryPrice) * 100 : 0;
        const diffText = diffPct >= 0 ? `+${diffPct.toFixed(1)}%` : `${diffPct.toFixed(1)}%`;
        map[sc.name] = { price, diffPct, diffText };
      }
    });

    return map;
  }, [prediction, entryPrice]);

  // ─── Calculate Staggered SVG Label Y Coords to Prevent Overlap ──
  const scenarioLabelsList = useMemo(() => {
    if (!prediction?.scenarioPaths) return [];
    const list: { name: string; rawY: number; labelY: number; endPt: { x: number; y: number }; lastPtData: TrajectoryPointDto; diffText: string }[] = [];

    prediction.scenarioPaths.forEach((scenario) => {
      if (!visibleScenarios[scenario.name]) return;
      const pts = scenario.points.map((pt) => ({
        x: startX + (pt.step * 2) * slotWidth,
        y: getY(pt.price)
      }));
      const endPt = pts[pts.length - 1];
      const lastPtData = scenario.points[scenario.points.length - 1];
      if (!endPt || !lastPtData) return;

      const diffPct = entryPrice > 0 ? ((lastPtData.price - entryPrice) / entryPrice) * 100 : 0;
      const diffText = diffPct >= 0 ? `+${diffPct.toFixed(1)}%` : `${diffPct.toFixed(1)}%`;

      list.push({
        name: scenario.name,
        rawY: endPt.y,
        labelY: endPt.y,
        endPt,
        lastPtData,
        diffText
      });
    });

    // Sort by Y position ascending (top of chart to bottom)
    list.sort((a, b) => a.rawY - b.rawY);

    // Apply anti-collision spacing (min 28px vertical gap)
    for (let i = 1; i < list.length; i++) {
      if (list[i].labelY - list[i - 1].labelY < 28) {
        list[i].labelY = list[i - 1].labelY + 28;
      }
    }

    return list;
  }, [prediction, visibleScenarios, startX, slotWidth, getY, entryPrice]);

  // ─── Extract Scenario Values for Hovered Trajectory Step ─────────
  const stepScenarioPrices = useMemo(() => {
    if (!hoveredTrajectoryPt || !prediction?.scenarioPaths) return null;
    const step = hoveredTrajectoryPt.step;
    const result: Record<string, { price: number; diffText: string }> = {};

    prediction.scenarioPaths.forEach((sc) => {
      const pt = sc.points.find((p) => p.step === step);
      if (pt) {
        const diffPct = entryPrice > 0 ? ((pt.price - entryPrice) / entryPrice) * 100 : 0;
        const diffText = diffPct >= 0 ? `+${diffPct.toFixed(1)}%` : `${diffPct.toFixed(1)}%`;
        result[sc.name] = { price: pt.price, diffText };
      }
    });

    return result;
  }, [hoveredTrajectoryPt, prediction, entryPrice]);

  // ─── Time Axis Labels ───────────────────────────────────────────
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

      const lastCandle = candles[candles.length - 1];
      ticks.push({
        x: startX,
        label: formatTimeLabel(lastCandle.openTime, timeframe),
        isProjection: false
      });
    }

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

  // Handle Mouse Move over Chart container to position floating Tooltip
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });
  };

  return (
    <div className="card" style={{ width: '100%' }}>
      {/* ── Header Controls Bar ── */}
      <div className="card-title" style={{ justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ChartIcon size={20} color="#06b6d4" />
          {t.candlestickChart.chartTitle} ({symbol} • {timeframe})
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.75rem', fontWeight: 600, flexWrap: 'wrap' }}>
          <span style={{ color: '#06b6d4' }}>● EMA 20 (${snapshot ? formatPrice(snapshot.ema20) : '---'})</span>
          <span style={{ color: '#3b82f6' }}>● EMA 50 (${snapshot ? formatPrice(snapshot.ema50) : '---'})</span>
          <span style={{ color: '#8b5cf6' }}>● EMA 200 (${snapshot ? formatPrice(snapshot.ema200) : '---'})</span>

          {/* Scenario Toggle Buttons */}
          {prediction?.scenarioPaths && prediction.scenarioPaths.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              {Object.entries(SCENARIO_STYLES).map(([name, s]) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggleScenario(name)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                    background: visibleScenarios[name] ? `${s.stroke}22` : 'rgba(100,116,139,0.08)',
                    border: `1px solid ${visibleScenarios[name] ? s.stroke + '99' : 'rgba(100,116,139,0.25)'}`,
                    borderRadius: '6px', padding: '0.2rem 0.55rem',
                    color: visibleScenarios[name] ? s.stroke : '#64748b',
                    cursor: 'pointer', fontWeight: 800, fontSize: '0.72rem'
                  }}
                  title={s.desc}
                >
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Independent Corridor Shading Toggle */}
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
            {showProjection ? <Eye size={12} /> : <EyeOff size={12} />}
            {t.candlestickChart.toggleProjection}: {showProjection ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* ── SVG Canvas Container ── */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          background: '#070a12',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px',
          overflow: 'hidden'
        }}
      >
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          preserveAspectRatio="none"
          style={{ width: '100%', height: '420px', display: 'block' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => {
            setHoveredIndex(null);
            setHoveredTrajectoryPt(null);
            setHoveredScenarioName(null);
            setMousePos(null);
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

          {/* ── Projection Divider Line ── */}
          {backendTrajectory && (
            <g style={{ pointerEvents: 'none' }}>
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
                width="160"
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
                {backendTrajectory.isBackendCalculated ? '▶ MÔ PHỎNG MONTE CARLO' : '▶ DỰ BÁO XU HƯỚNG'}
              </text>
            </g>
          )}

          {/* ── Monte Carlo Corridor Background Shading (Independent toggle showProjection) ── */}
          {showProjection && backendTrajectory && (
            <g style={{ pointerEvents: 'none' }}>
              <path
                d={backendTrajectory.corridorD}
                fill="url(#corridorFill)"
                stroke="none"
              />
              {backendTrajectory.upperPathD && (
                <path
                  d={backendTrajectory.upperPathD}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  opacity="0.4"
                />
              )}
              {backendTrajectory.lowerPathD && (
                <path
                  d={backendTrajectory.lowerPathD}
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  opacity="0.4"
                />
              )}
            </g>
          )}

          {/* ── Scenario Lines (Bull / Base / Bear) - Rendered independently ── */}
          {backendTrajectory && prediction?.scenarioPaths?.map((scenario: ScenarioPathDto) => {
            if (!visibleScenarios[scenario.name]) return null;
            const style = SCENARIO_STYLES[scenario.name];
            if (!style) return null;

            const isHovered = hoveredScenarioName === scenario.name;

            const pts = scenario.points.map((pt) => ({
              x: startX + (pt.step * 2) * slotWidth,
              y: getY(pt.price)
            }));

            const pathD = pts.reduce((acc, p, idx) =>
              idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '');

            return (
              <g key={scenario.name}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={style.stroke}
                  strokeWidth={isHovered ? 3.5 : scenario.name === 'Base' ? 2.5 : 1.8}
                  strokeDasharray={scenario.name === 'Bear' ? '4 3' : scenario.name === 'Bull' ? '4 3' : 'none'}
                  opacity={isHovered ? 1 : scenario.name === 'Base' ? 0.95 : 0.75}
                  style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredScenarioName(scenario.name)}
                  onMouseLeave={() => setHoveredScenarioName(null)}
                />
              </g>
            );
          })}

          {/* ── PROMINENT SCENARIO NOTE BADGES AT CANDLE ENDPOINT ── */}
          {backendTrajectory && scenarioLabelsList.map((item) => {
            const style = SCENARIO_STYLES[item.name];
            if (!style) return null;

            const labelX = Math.min(SVG_WIDTH - 180, item.endPt.x + 8);
            const labelY = item.labelY - 13;
            const isHovered = hoveredScenarioName === item.name;

            return (
              <g
                key={`note-${item.name}`}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredScenarioName(item.name)}
                onMouseLeave={() => setHoveredScenarioName(null)}
              >
                {/* Circle marker at scenario candle endpoint */}
                <circle cx={item.endPt.x} cy={item.endPt.y} r={isHovered ? 7 : 5} fill={style.stroke} />
                <circle cx={item.endPt.x} cy={item.endPt.y} r={isHovered ? 12 : 8} fill={style.stroke} opacity="0.3" />

                {/* Connecting guide line from candle endpoint to note badge */}
                <line
                  x1={item.endPt.x}
                  y1={item.endPt.y}
                  x2={labelX}
                  y2={labelY + 13}
                  stroke={style.stroke}
                  strokeWidth={isHovered ? "1.5" : "1"}
                  strokeDasharray="2 2"
                  opacity="0.8"
                />

                {/* Note Card Badge directly anchored on chart candle column */}
                <g transform={`translate(${labelX}, ${labelY})`}>
                  <rect
                    width="170"
                    height="26"
                    rx="6"
                    fill="#090d16"
                    stroke={style.stroke}
                    strokeWidth={isHovered ? "2.5" : "1.5"}
                  />
                  <text
                    x="8"
                    y="17"
                    fill={style.stroke}
                    fontSize="10"
                    fontWeight="900"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {style.emoji} {item.name.toUpperCase()}: ${formatPrice(item.lastPtData.price)}
                  </text>
                  <text
                    x="162"
                    y="17"
                    textAnchor="end"
                    fill={Number(item.diffText.replace('%', '')) >= 0 ? '#10b981' : '#f43f5e'}
                    fontSize="9.5"
                    fontWeight="800"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {item.diffText}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Main Trajectory Path (Median) */}
          {backendTrajectory && (
            <g style={{ pointerEvents: 'none' }}>
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
          {backendTrajectory && backendTrajectory.mainPoints && (
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

        {/* ── DYNAMIC FLOATING TOOLTIP CARD AT CURSOR LOCATION ── */}
        {(hoveredCandle || hoveredTrajectoryPt) && mousePos && (
          <div
            style={{
              position: 'absolute',
              left: Math.min(Math.max(10, mousePos.x + 15), SVG_WIDTH - 240),
              top: Math.min(Math.max(10, mousePos.y - 10), 220),
              width: '220px',
              background: '#090d16',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              borderRadius: '10px',
              padding: '0.75rem',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.85)',
              pointerEvents: 'none',
              zIndex: 50,
              fontFamily: 'JetBrains Mono, monospace',
              backdropFilter: 'blur(8px)'
            }}
          >
            {/* Historical Candle Tooltip */}
            {hoveredCandle && (
              <div>
                <div style={{ fontSize: '0.72rem', color: '#06b6d4', fontWeight: 800, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Clock size={12} />
                  NẾN LỊCH SỬ • {new Date(hoveredCandle.openTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem', fontSize: '0.75rem' }}>
                  <div>Mở: <strong style={{ color: '#f8fafc' }}>${formatPrice(hoveredCandle.open)}</strong></div>
                  <div>Đóng: <strong style={{ color: hoveredCandle.close >= hoveredCandle.open ? '#10b981' : '#f43f5e' }}>${formatPrice(hoveredCandle.close)}</strong></div>
                  <div>Cao: <strong style={{ color: '#10b981' }}>${formatPrice(hoveredCandle.high)}</strong></div>
                  <div>Thấp: <strong style={{ color: '#f43f5e' }}>${formatPrice(hoveredCandle.low)}</strong></div>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.3rem' }}>
                  Khối Lượng: <strong style={{ color: '#06b6d4' }}>{hoveredCandle.volume.toFixed(2)}</strong>
                </div>
              </div>
            )}

            {/* Future Trajectory / Scenario Tooltip */}
            {hoveredTrajectoryPt && (
              <div>
                <div style={{ fontSize: '0.72rem', color: '#06b6d4', fontWeight: 800, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Clock size={12} />
                  BƯỚC {hoveredTrajectoryPt.step} (+{hoveredTrajectoryPt.step * 2} nến)
                </div>

                {/* Scenario breakdown prices at this step */}
                {stepScenarioPrices ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.4rem', fontSize: '0.75rem' }}>
                    {stepScenarioPrices['Bull'] && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
                        <span>🐂 Bull (P90):</span>
                        <strong>${formatPrice(stepScenarioPrices['Bull'].price)} ({stepScenarioPrices['Bull'].diffText})</strong>
                      </div>
                    )}
                    {stepScenarioPrices['Base'] && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f59e0b' }}>
                        <span>📊 Base (P50):</span>
                        <strong>${formatPrice(stepScenarioPrices['Base'].price)} ({stepScenarioPrices['Base'].diffText})</strong>
                      </div>
                    )}
                    {stepScenarioPrices['Bear'] && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f43f5e' }}>
                        <span>🐻 Bear (P10):</span>
                        <strong>${formatPrice(stepScenarioPrices['Bear'].price)} ({stepScenarioPrices['Bear'].diffText})</strong>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#06b6d4', marginBottom: '0.3rem' }}>
                    Giá Dự Báo: ${formatPrice(hoveredTrajectoryPt.price)}
                  </div>
                )}

                {/* Cumulative Hit Probabilities */}
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.35rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Xác Suất Chạm TP: <strong style={{ color: '#10b981' }}>{hoveredTrajectoryPt.cumulativeTpHitProb ?? 0}%</strong></span>
                  <span>SL: <strong style={{ color: '#f43f5e' }}>{hoveredTrajectoryPt.cumulativeSlHitProb ?? 0}%</strong></span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── SCENARIO SUMMARY NOTE CARDS BELOW CHART ── */}
      {scenarioSummaryData && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '0.75rem',
          marginTop: '0.85rem'
        }}>
          {/* Bull Scenario Note Card */}
          {scenarioSummaryData['Bull'] && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '10px',
              padding: '0.75rem 1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#10b981', fontWeight: 800, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  🐂 Kịch Bản Tăng (Bull P90)
                </span>
                <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 800, background: 'rgba(16, 185, 129, 0.15)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                  {scenarioSummaryData['Bull'].diffText}
                </span>
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#f8fafc', margin: '0.25rem 0', fontFamily: 'JetBrains Mono, monospace' }}>
                ${formatPrice(scenarioSummaryData['Bull'].price)}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                Mức giá kỳ vọng ở phân vị 90% khi thị trường tăng tích cực
              </div>
            </div>
          )}

          {/* Base Scenario Note Card */}
          {scenarioSummaryData['Base'] && (
            <div style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '10px',
              padding: '0.75rem 1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#f59e0b', fontWeight: 800, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  📊 Kịch Bản Cơ Sở (Base P50)
                </span>
                <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 800, background: 'rgba(245, 158, 11, 0.15)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                  {scenarioSummaryData['Base'].diffText}
                </span>
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#f8fafc', margin: '0.25rem 0', fontFamily: 'JetBrains Mono, monospace' }}>
                ${formatPrice(scenarioSummaryData['Base'].price)}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                Mức giá trung vị 50% kỳ vọng nhất theo mô phỏng Monte Carlo
              </div>
            </div>
          )}

          {/* Bear Scenario Note Card */}
          {scenarioSummaryData['Bear'] && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.08)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: '10px',
              padding: '0.75rem 1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#f43f5e', fontWeight: 800, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  🐻 Kịch Bản Giảm (Bear P10)
                </span>
                <span style={{ fontSize: '0.72rem', color: '#f43f5e', fontWeight: 800, background: 'rgba(244, 63, 94, 0.15)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                  {scenarioSummaryData['Bear'].diffText}
                </span>
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#f8fafc', margin: '0.25rem 0', fontFamily: 'JetBrains Mono, monospace' }}>
                ${formatPrice(scenarioSummaryData['Bear'].price)}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                Mức giá kịch bản xấu nhất ở phân vị 10% khi xuất hiện biến động giảm
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
