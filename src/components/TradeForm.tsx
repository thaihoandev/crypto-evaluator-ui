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

const POPULAR_TAGS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'NEARUSDT', 'BNBUSDT'];

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

  // Sync active parameters whenever external props change
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

  // Fetch Live Price from Backend API
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
    <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl border border-slate-800/80">
      {/* Header */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-950/70 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Calculator size={18} />
          </div>
          <div>
            <h2 className="font-heading text-sm sm:text-base font-black text-slate-100 flex items-center gap-1.5">
              {t.tradeForm.title}
            </h2>
            <p className="text-[11px] text-slate-400 font-medium">Quantitative Setup Desk</p>
          </div>
        </div>

        <motion.button
          type="button"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => fetchLivePriceAndSetTargets(symbol, direction, 2.0)}
          disabled={isFetchingPrice}
          className="bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 px-3 py-1.5 rounded-xl text-xs font-extrabold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer shrink-0 disabled:opacity-50"
        >
          <RefreshCw size={13} className={isFetchingPrice ? 'animate-spin text-cyan-400' : ''} />
          <span>{isFetchingPrice ? t.tradeForm.evaluating : t.tradeForm.fetchLivePrice}</span>
        </motion.button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Direction Switcher (Long / Short) */}
        <div>
          <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 block">
            {t.tradeForm.direction}
          </label>
          <div className="grid grid-cols-2 gap-2 bg-slate-950/90 p-1 rounded-xl border border-slate-800">
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              className={`py-2.5 rounded-lg font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                direction === 'Long'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/30 border border-emerald-400/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
              onClick={() => handleDirectionChange('Long')}
            >
              <ArrowUpRight size={17} className={direction === 'Long' ? 'text-white' : 'text-emerald-400'} />
              <span>{t.tradeForm.long}</span>
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              className={`py-2.5 rounded-lg font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                direction === 'Short'
                  ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-lg shadow-rose-500/30 border border-rose-400/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
              onClick={() => handleDirectionChange('Short')}
            >
              <ArrowDownRight size={17} className={direction === 'Short' ? 'text-white' : 'text-rose-400'} />
              <span>{t.tradeForm.short}</span>
            </motion.button>
          </div>
        </div>

        {/* Searchable Dropdown for Symbol */}
        <div className="relative" ref={dropdownRef}>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              {t.tradeForm.searchCoinLabel}
            </label>
            {isFetchingPrice && (
              <span className="text-cyan-400 font-semibold normal-case animate-pulse text-[11px]">
                Updating market price...
              </span>
            )}
          </div>
          <div className="relative">
            <div className="relative flex items-center">
              <Search size={16} className="text-slate-400 absolute left-3.5 z-10 pointer-events-none shrink-0" />
              <input
                type="text"
                className="w-full bg-slate-950/90 border border-slate-800 focus:border-cyan-500 text-slate-100 font-extrabold font-mono text-sm py-2.5 pl-10 pr-3 rounded-xl outline-none shadow-inner transition-all uppercase placeholder:normal-case placeholder:font-normal placeholder:text-slate-500"
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
            </div>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 right-0 top-full mt-2 bg-slate-950/95 backdrop-blur-2xl border border-cyan-500/50 shadow-2xl shadow-cyan-950/80 rounded-xl max-h-64 overflow-y-auto z-50 divide-y divide-slate-800/60"
                >
                  {filteredPairs.length === 0 ? (
                    <div className="p-3 text-xs text-slate-400 text-center font-mono">
                      No exact match for "<span className="text-cyan-400 font-bold">{searchQuery.toUpperCase()}</span>". Custom symbol selected.
                    </div>
                  ) : (
                    filteredPairs.map((p) => {
                      const isSelected = symbol === p.symbol;
                      return (
                        <div
                          key={p.symbol}
                          className={`p-2.5 flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-cyan-500/20 border-l-4 border-l-cyan-400 text-white font-extrabold'
                              : 'hover:bg-slate-900 hover:text-cyan-300 text-slate-200'
                          }`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectSymbol(p.symbol);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded text-xs font-mono font-black">
                              {p.symbol}
                            </span>
                            <span className="text-xs font-semibold text-slate-300">{p.name}</span>
                          </div>
                          {isSelected && <span className="text-xs text-cyan-400 font-black">✓ Active</span>}
                        </div>
                      );
                    })
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Popular Coin Tags */}
          <div className="flex items-center gap-1.5 mt-2 overflow-x-auto scrollbar-none">
            <span className="text-[10px] font-bold text-slate-500 uppercase shrink-0">Popular:</span>
            {POPULAR_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleSelectSymbol(tag)}
                className={`text-[11px] font-mono font-extrabold px-2 py-0.5 rounded-lg border transition-all cursor-pointer shrink-0 ${
                  symbol === tag
                    ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {tag.replace('USDT', '')}
              </button>
            ))}
          </div>
        </div>

        {/* Timeframe & Leverage */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 block">
              {t.tradeForm.timeframe}
            </label>
            <select
              className="w-full bg-slate-950/90 border border-slate-800 focus:border-cyan-500 text-slate-100 font-extrabold font-mono text-xs sm:text-sm py-2 px-2.5 rounded-xl outline-none transition-all cursor-pointer"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as Timeframe)}
            >
              <option value="M1" className="bg-slate-900 text-slate-100 font-bold">M1 (1m)</option>
              <option value="M5" className="bg-slate-900 text-slate-100 font-bold">M5 (5m)</option>
              <option value="M15" className="bg-slate-900 text-slate-100 font-bold">M15 (15m)</option>
              <option value="M30" className="bg-slate-900 text-slate-100 font-bold">M30 (30m)</option>
              <option value="H1" className="bg-slate-900 text-slate-100 font-bold">H1 (1h)</option>
              <option value="H4" className="bg-slate-900 text-slate-100 font-bold">H4 (4h)</option>
              <option value="D1" className="bg-slate-900 text-slate-100 font-bold">D1 (1d)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 block">
              {t.tradeForm.leverage}
            </label>
            <div className="relative flex items-center">
              <input
                type="number"
                className="w-full bg-slate-950/90 border border-slate-800 focus:border-cyan-500 text-slate-100 font-extrabold font-mono text-xs sm:text-sm py-2 px-2.5 pr-8 rounded-xl outline-none transition-all"
                value={leverage}
                onChange={(e) => setLeverage(Number(e.target.value))}
                min={1}
                max={125}
                required
              />
              <span className="absolute right-3 text-xs font-black text-cyan-400 pointer-events-none">x</span>
            </div>
          </div>
        </div>

        {/* Entry, Stop Loss, Take Profit */}
        <div className="grid grid-cols-3 gap-2.5">
          <div>
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-tight mb-1 block truncate">
              ENTRY ($)
            </label>
            <input
              type="number"
              step="any"
              className="w-full bg-slate-950/90 border border-slate-800 focus:border-cyan-500 text-slate-100 font-extrabold font-mono text-xs py-2 px-2 rounded-xl outline-none transition-all"
              value={entryPrice}
              onChange={(e) => setEntryPrice(Number(e.target.value))}
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-rose-400/90 uppercase tracking-tight mb-1 block truncate">
              STOP LOSS ($)
            </label>
            <input
              type="number"
              step="any"
              className={`w-full bg-slate-950/90 border ${
                liveMetrics.slDistance <= 0 ? 'border-rose-500 text-rose-300' : 'border-slate-800 focus:border-cyan-500 text-slate-100'
              } font-extrabold font-mono text-xs py-2 px-2 rounded-xl outline-none transition-all`}
              value={stopLoss}
              onChange={(e) => setStopLoss(Number(e.target.value))}
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-emerald-400/90 uppercase tracking-tight mb-1 block truncate">
              TAKE PROFIT ($)
            </label>
            <input
              type="number"
              step="any"
              className={`w-full bg-slate-950/90 border ${
                liveMetrics.tpDistance <= 0 ? 'border-rose-500 text-rose-300' : 'border-slate-800 focus:border-cyan-500 text-slate-100'
              } font-extrabold font-mono text-xs py-2 px-2 rounded-xl outline-none transition-all`}
              value={takeProfit}
              onChange={(e) => setTakeProfit(Number(e.target.value))}
              required
            />
          </div>
        </div>

        {/* Quick R:R Preset Buttons */}
        <div className="flex items-center justify-between gap-1.5 py-1 bg-slate-950/40 px-2.5 rounded-xl border border-slate-800/40">
          <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap">{t.tradeForm.quickPresets}</span>
          <div className="flex items-center gap-1.5">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              className="px-2.5 py-0.5 text-[11px] font-mono font-black text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 rounded-lg transition-all cursor-pointer"
              onClick={() => applyTargetsByRR(entryPrice, direction, 1.5)}
            >
              1:1.5
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              className="px-2.5 py-0.5 text-[11px] font-mono font-black text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 rounded-lg transition-all cursor-pointer"
              onClick={() => applyTargetsByRR(entryPrice, direction, 2.0)}
            >
              1:2.0
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              className="px-2.5 py-0.5 text-[11px] font-mono font-black text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 rounded-lg transition-all cursor-pointer"
              onClick={() => applyTargetsByRR(entryPrice, direction, 3.0)}
            >
              1:3.0
            </motion.button>
          </div>
        </div>

        {/* Account Balance & Risk Percent */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 block">
              {t.tradeForm.accountBalance}
            </label>
            <input
              type="number"
              step="any"
              className="w-full bg-slate-950/90 border border-slate-800 focus:border-cyan-500 text-slate-100 font-extrabold font-mono text-xs sm:text-sm py-2 px-2.5 rounded-xl outline-none transition-all"
              value={accountBalance}
              onChange={(e) => setAccountBalance(Number(e.target.value))}
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 block">
              {t.tradeForm.riskPercent}
            </label>
            <input
              type="number"
              step="0.1"
              className="w-full bg-slate-950/90 border border-slate-800 focus:border-cyan-500 text-slate-100 font-extrabold font-mono text-xs sm:text-sm py-2 px-2.5 rounded-xl outline-none transition-all"
              value={riskPercent}
              onChange={(e) => setRiskPercent(Number(e.target.value))}
              min={0.1}
              max={100}
              required
            />
          </div>
        </div>

        {/* Live Risk Metrics Cards Grid */}
        <div className="grid grid-cols-4 gap-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-center shadow-inner">
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase truncate">RỦI RO</div>
            <div className="text-xs font-mono font-black text-cyan-400 mt-0.5">
              ${liveMetrics.riskAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase truncate">TỶ LỆ R:R</div>
            <div className={`text-xs font-mono font-black mt-0.5 ${liveMetrics.rrRatio < 1 ? 'text-rose-400' : liveMetrics.rrRatio >= 2 ? 'text-emerald-400' : 'text-amber-400'}`}>
              1:{liveMetrics.rrRatio.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase truncate">POSITION</div>
            <div className="text-xs font-mono font-black text-slate-200 mt-0.5">
              {liveMetrics.positionSize.toFixed(4)}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase truncate">MARGIN</div>
            <div className={`text-xs font-mono font-black mt-0.5 ${liveMetrics.isMarginExceeded ? 'text-rose-400' : 'text-slate-200'}`}>
              ${liveMetrics.marginRequired.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {liveMetrics.isMarginExceeded && (
          <div className="text-xs text-rose-400 font-bold bg-rose-500/10 border border-rose-500/30 p-2 rounded-lg flex items-center gap-1.5">
            <AlertCircle size={15} className="shrink-0 text-rose-400" />
            <span>Margin (${liveMetrics.marginRequired.toFixed(2)}) exceeds balance!</span>
          </div>
        )}

        {/* Submit Button */}
        <motion.button
          type="submit"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="w-full btn-cyber-primary text-white font-black text-xs sm:text-sm py-3.5 px-4 rounded-xl shadow-xl shadow-cyan-500/25 tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-2"
          disabled={isLoading || !liveMetrics.isValidSetup}
        >
          {isLoading ? (
            <>
              <RefreshCw size={17} className="animate-spin" />
              <span>{t.tradeForm.evaluating}</span>
            </>
          ) : (
            <>
              <Play size={17} fill="currentColor" />
              <span>{t.tradeForm.submitBtn}</span>
            </>
          )}
        </motion.button>
      </form>
    </div>
  );
};
