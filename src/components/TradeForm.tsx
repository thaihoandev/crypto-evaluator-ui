import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TradeDirection, Timeframe, CreateTradeRequest, CryptoSymbolDto } from '../types/trade';
import { getTicker, getSymbols } from '../api/tradeApi';
import { ArrowUpRight, ArrowDownRight, Play, Calculator, AlertCircle, Search, RefreshCw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface TradeFormProps {
  onSubmit: (request: CreateTradeRequest) => void;
  isLoading: boolean;
  activeSymbol?: string;
  activeDirection?: TradeDirection;
  activeTimeframe?: Timeframe;
  activeEntryPrice?: number;
  activeStopLoss?: number;
  activeTakeProfit?: number;
}

const FALLBACK_PAIRS: CryptoSymbolDto[] = [
  { symbol: 'BTCUSDT', name: 'Bitcoin' },
  { symbol: 'ETHUSDT', name: 'Ethereum' },
  { symbol: 'SOLUSDT', name: 'Solana' },
  { symbol: 'BNBUSDT', name: 'BNB' },
  { symbol: 'XRPUSDT', name: 'Ripple' },
  { symbol: 'DOGEUSDT', name: 'Dogecoin' },
  { symbol: 'ADAUSDT', name: 'Cardano' },
  { symbol: 'AVAXUSDT', name: 'Avalanche' },
  { symbol: 'LINKUSDT', name: 'Chainlink' },
  { symbol: 'NEARUSDT', name: 'Near Protocol' },
  { symbol: 'SUIUSDT', name: 'Sui' },
  { symbol: 'PEPEUSDT', name: 'Pepe' },
  { symbol: 'FETUSDT', name: 'Fetch.ai' },
  { symbol: 'TRXUSDT', name: 'TRON' },
  { symbol: 'SHIBUSDT', name: 'Shiba Inu' },
  { symbol: 'DOTUSDT', name: 'Polkadot' },
  { symbol: 'UNIUSDT', name: 'Uniswap' },
  { symbol: 'LTCUSDT', name: 'Litecoin' },
  { symbol: 'APTUSDT', name: 'Aptos' },
  { symbol: 'ARBUSDT', name: 'Arbitrum' },
  { symbol: 'OPUSDT', name: 'Optimism' },
  { symbol: 'RENDERUSDT', name: 'Render' },
  { symbol: 'INJUSDT', name: 'Injective' },
  { symbol: 'TIAUSDT', name: 'Celestia' },
  { symbol: 'WIFUSDT', name: 'dogwifhat' },
  { symbol: 'SEIUSDT', name: 'Sei' },
  { symbol: 'STXUSDT', name: 'Stacks' },
  { symbol: 'AAVEUSDT', name: 'Aave' }
];

export const TradeForm: React.FC<TradeFormProps> = ({
  onSubmit,
  isLoading,
  activeSymbol,
  activeDirection,
  activeTimeframe,
  activeEntryPrice,
  activeStopLoss,
  activeTakeProfit
}) => {
  const { t } = useLanguage();

  const [symbol, setSymbol] = useState(activeSymbol || 'BTCUSDT');
  const [searchQuery, setSearchQuery] = useState(activeSymbol || 'BTCUSDT');
  const [availableSymbols, setAvailableSymbols] = useState<CryptoSymbolDto[]>(FALLBACK_PAIRS);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [direction, setDirection] = useState<TradeDirection>(activeDirection || 'Long');
  const [timeframe, setTimeframe] = useState<Timeframe>(activeTimeframe || 'H1');
  const [entryPrice, setEntryPrice] = useState<number>(activeEntryPrice ?? 104500);
  const [stopLoss, setStopLoss] = useState<number>(activeStopLoss ?? 102500);
  const [takeProfit, setTakeProfit] = useState<number>(activeTakeProfit ?? 108500);
  const [accountBalance, setAccountBalance] = useState<number>(10000);
  const [riskPercent, setRiskPercent] = useState<number>(1.0);
  const [leverage, setLeverage] = useState<number>(5);

  // Sync active parameters whenever external props change (e.g. from AI Setup Finder)
  useEffect(() => {
    if (activeSymbol) {
      setSymbol(activeSymbol);
      setSearchQuery(activeSymbol);
    }
    if (activeDirection) setDirection(activeDirection);
    if (activeTimeframe) setTimeframe(activeTimeframe);
    if (activeEntryPrice !== undefined && activeEntryPrice > 0) setEntryPrice(activeEntryPrice);
    if (activeStopLoss !== undefined && activeStopLoss > 0) setStopLoss(activeStopLoss);
    if (activeTakeProfit !== undefined && activeTakeProfit > 0) setTakeProfit(activeTakeProfit);
  }, [activeSymbol, activeDirection, activeTimeframe, activeEntryPrice, activeStopLoss, activeTakeProfit]);

  // Load symbols list on mount
  useEffect(() => {
    loadSymbols();
  }, []);

  const loadSymbols = async () => {
    try {
      const data = await getSymbols();
      if (data && data.length > 0) {
        setAvailableSymbols(data);
      }
    } catch {
      // Fallback
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter pairs based on search
  const filteredPairs = useMemo(() => {
    const query = searchQuery.trim().toUpperCase();
    if (!query) return availableSymbols;
    return availableSymbols.filter(
      (p) => p.symbol.includes(query) || p.name.toUpperCase().includes(query)
    );
  }, [searchQuery, availableSymbols]);

  // Fetch Live Price from Backend API (server-side Binance lookup)
  const fetchLivePriceAndSetTargets = async (sym: string, currentDirection: TradeDirection, rr: number = 2.0) => {
    setIsFetchingPrice(true);
    try {
      const ticker = await getTicker(sym.toUpperCase());
      const livePrice = ticker.price;
      setEntryPrice(livePrice);
      applyTargetsByRR(livePrice, currentDirection, rr);
    } catch {
      // Keep current entry
    } finally {
      setIsFetchingPrice(false);
    }
  };

  const applyTargetsByRR = (entry: number, currentDir: TradeDirection, rr: number) => {
    const isLong = currentDir === 'Long';
    const defaultSlPct = 0.02; // 2% SL
    let sl = isLong ? entry * (1 - defaultSlPct) : entry * (1 + defaultSlPct);
    const slDist = Math.abs(entry - sl);
    let tp = isLong ? entry + slDist * rr : entry - slDist * rr;

    sl = Number(sl.toFixed(4));
    tp = Number(tp.toFixed(4));

    setStopLoss(sl);
    setTakeProfit(tp);
  };

  const handleSelectSymbol = (sym: string) => {
    setSymbol(sym);
    setSearchQuery(sym);
    setIsDropdownOpen(false);
    fetchLivePriceAndSetTargets(sym, direction, 2.0);
  };

  const handleDirectionChange = (newDir: TradeDirection) => {
    setDirection(newDir);
    applyTargetsByRR(entryPrice, newDir, 2.0);
  };

  // Calculate Real-Time Metrics
  const liveMetrics = useMemo(() => {
    const riskAmount = (accountBalance * riskPercent) / 100;
    const isLong = direction === 'Long';

    const slDistance = isLong ? entryPrice - stopLoss : stopLoss - entryPrice;
    const tpDistance = isLong ? takeProfit - entryPrice : entryPrice - takeProfit;

    const slPct = entryPrice > 0 ? (slDistance / entryPrice) * 100 : 0;

    let rrRatio = 0;
    if (slDistance > 0 && tpDistance > 0) {
      rrRatio = tpDistance / slDistance;
    }

    let positionSize = 0;
    if (slDistance > 0) {
      positionSize = riskAmount / slDistance;
    }

    const notionalValue = positionSize * entryPrice;
    const marginRequired = leverage > 0 ? notionalValue / leverage : notionalValue;
    const isMarginExceeded = marginRequired > accountBalance;
    const isValidSetup = slDistance > 0 && tpDistance > 0 && !isMarginExceeded;

    return {
      riskAmount,
      slDistance,
      tpDistance,
      slPct,
      rrRatio,
      positionSize,
      notionalValue,
      marginRequired,
      isMarginExceeded,
      isValidSetup
    };
  }, [accountBalance, riskPercent, direction, entryPrice, stopLoss, takeProfit, leverage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveMetrics.isValidSetup) return;

    onSubmit({
      symbol,
      direction,
      timeframe,
      entryPrice,
      stopLoss,
      takeProfit,
      accountBalance,
      riskPercent,
      leverage
    });
  };

  return (
    <div className="card">
      <div className="card-title" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calculator size={18} color="#06b6d4" />
          {t.tradeForm.title}
        </div>
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => fetchLivePriceAndSetTargets(symbol, direction, 2.0)}
          disabled={isFetchingPrice}
          style={{
            background: 'rgba(6,182,212,0.1)',
            border: '1px solid rgba(6,182,212,0.3)',
            color: '#06b6d4',
            padding: '0.25rem 0.6rem',
            borderRadius: '6px',
            fontSize: '0.72rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
        >
          <RefreshCw size={12} className={isFetchingPrice ? 'spinner' : ''} />
          {isFetchingPrice ? t.tradeForm.evaluating : t.tradeForm.fetchLivePrice}
        </motion.button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Direction Toggle */}
        <div className="form-group">
          <label className="form-label">{t.tradeForm.direction}</label>
          <div className="direction-toggle">
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              className={`btn-direction long ${direction === 'Long' ? 'active' : ''}`}
              onClick={() => handleDirectionChange('Long')}
            >
              <ArrowUpRight size={16} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
              {t.tradeForm.long}
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              className={`btn-direction short ${direction === 'Short' ? 'active' : ''}`}
              onClick={() => handleDirectionChange('Short')}
            >
              <ArrowDownRight size={16} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
              {t.tradeForm.short}
            </motion.button>
          </div>
        </div>

        {/* Searchable Dropdown for Symbol */}
        <div className="form-group" ref={dropdownRef} style={{ position: 'relative' }}>
          <label className="form-label">
            {t.tradeForm.searchCoinLabel}
            {isFetchingPrice && <span style={{ color: '#06b6d4', textTransform: 'none', marginLeft: '0.5rem' }}>...</span>}
          </label>
          <div className="search-dropdown-container">
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.25rem' }}
                value={searchQuery}
                onFocus={() => setIsDropdownOpen(true)}
                onClick={() => setIsDropdownOpen(true)}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setSearchQuery(val);
                  setSymbol(val);
                  setIsDropdownOpen(true);
                }}
                placeholder={t.tradeForm.searchPlaceholder}
                required
              />
              <Search size={16} color="#64748b" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="search-dropdown-menu"
                >
                  {filteredPairs.length === 0 ? (
                    <div style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#64748b', textAlign: 'center' }}>
                      Symbol: "{searchQuery.toUpperCase()}"
                    </div>
                  ) : (
                    filteredPairs.map((p) => (
                      <div
                        key={p.symbol}
                        className={`search-dropdown-item ${symbol === p.symbol ? 'selected' : ''}`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectSymbol(p.symbol);
                        }}
                      >
                        <span style={{ fontWeight: 800, color: '#f8fafc' }}>{p.symbol}</span>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{p.name}</span>
                      </div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Timeframe & Leverage */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="form-label">{t.tradeForm.timeframe}</label>
            <select
              className="form-select"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as Timeframe)}
            >
              <option value="M1">M1 (1 Min)</option>
              <option value="M5">M5 (5 Mins)</option>
              <option value="M15">M15 (15 Mins)</option>
              <option value="M30">M30 (30 Mins)</option>
              <option value="H1">H1 (1 Hour)</option>
              <option value="H4">H4 (4 Hours)</option>
              <option value="D1">D1 (1 Day)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">{t.tradeForm.leverage}</label>
            <input
              type="number"
              className="form-input"
              value={leverage}
              onChange={(e) => setLeverage(Number(e.target.value))}
              min={1}
              max={125}
              required
            />
          </div>
        </div>

        {/* Entry, Stop Loss, Take Profit */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="form-label">{t.tradeForm.entryPrice}</label>
            <input
              type="number"
              step="any"
              className="form-input"
              value={entryPrice}
              onChange={(e) => setEntryPrice(Number(e.target.value))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t.tradeForm.stopLoss}</label>
            <input
              type="number"
              step="any"
              className="form-input"
              style={{ borderColor: liveMetrics.slDistance <= 0 ? '#f43f5e' : undefined }}
              value={stopLoss}
              onChange={(e) => setStopLoss(Number(e.target.value))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t.tradeForm.takeProfit}</label>
            <input
              type="number"
              step="any"
              className="form-input"
              style={{ borderColor: liveMetrics.tpDistance <= 0 ? '#f43f5e' : undefined }}
              value={takeProfit}
              onChange={(e) => setTakeProfit(Number(e.target.value))}
              required
            />
          </div>
        </div>

        {/* Quick R:R Preset Buttons */}
        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>{t.tradeForm.quickPresets}</span>
          <div className="rr-presets">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="button" className="btn-rr" onClick={() => applyTargetsByRR(entryPrice, direction, 1.5)}>1:1.5 R:R</motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="button" className="btn-rr" onClick={() => applyTargetsByRR(entryPrice, direction, 2.0)}>1:2 R:R</motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="button" className="btn-rr" onClick={() => applyTargetsByRR(entryPrice, direction, 3.0)}>1:3 R:R</motion.button>
          </div>
        </div>

        {/* Account Balance & Risk Percent */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="form-label">{t.tradeForm.accountBalance}</label>
            <input
              type="number"
              step="any"
              className="form-input"
              value={accountBalance}
              onChange={(e) => setAccountBalance(Number(e.target.value))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t.tradeForm.riskPercent}</label>
            <input
              type="number"
              step="0.1"
              className="form-input"
              value={riskPercent}
              onChange={(e) => setRiskPercent(Number(e.target.value))}
              min={0.1}
              max={100}
              required
            />
          </div>
        </div>

        {/* Live Risk Metrics Bar */}
        <div className="metrics-live-bar">
          <div className="metric-item">
            <div className="metric-label">{t.tradeForm.riskAmount}</div>
            <div className="metric-value">${liveMetrics.riskAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
          </div>
          <div className="metric-item">
            <div className="metric-label">{t.tradeForm.rrRatio}</div>
            <div className="metric-value" style={{ color: liveMetrics.rrRatio < 1 ? '#f43f5e' : liveMetrics.rrRatio >= 2 ? '#10b981' : '#06b6d4' }}>
              1 : {liveMetrics.rrRatio.toFixed(2)}
            </div>
          </div>
          <div className="metric-item">
            <div className="metric-label">Position Size</div>
            <div className="metric-value">{liveMetrics.positionSize.toFixed(4)}</div>
          </div>
          <div className="metric-item">
            <div className="metric-label">Req Margin</div>
            <div className="metric-value" style={{ color: liveMetrics.isMarginExceeded ? '#f43f5e' : undefined }}>
              ${liveMetrics.marginRequired.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {liveMetrics.isMarginExceeded && (
          <div style={{ fontSize: '0.8rem', color: '#f43f5e', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <AlertCircle size={14} />
            Margin required (${liveMetrics.marginRequired.toFixed(2)}) exceeds account balance!
          </div>
        )}

        {/* Submit Button */}
        <motion.button
          type="submit"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="btn-submit"
          disabled={isLoading || !liveMetrics.isValidSetup}
        >
          {isLoading ? (
            <>
              <div className="spinner" />
              {t.tradeForm.evaluating}
            </>
          ) : (
            <>
              <Play size={18} fill="currentColor" />
              {t.tradeForm.submitBtn}
            </>
          )}
        </motion.button>
      </form>
    </div>
  );
};
