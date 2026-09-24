import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Search,
  Zap,
  Bot,
  Globe
} from 'lucide-react';
import type {
  MarketAnalysisResponseDto,
  ProposedTradeSetupDto,
  Timeframe,
  CryptoSymbolDto
} from '../types/trade';
import { analyzeMarket, getSymbols } from '../api/tradeApi';
import { useLanguage } from '../context/LanguageContext';

const FALLBACK_SYMBOLS: CryptoSymbolDto[] = [
  { symbol: 'BTCUSDT', name: 'Bitcoin' },
  { symbol: 'ETHUSDT', name: 'Ethereum' },
  { symbol: 'SOLUSDT', name: 'Solana' },
  { symbol: 'BNBUSDT', name: 'BNB' },
  { symbol: 'XRPUSDT', name: 'Ripple' },
  { symbol: 'NEARUSDT', name: 'Near Protocol' },
  { symbol: 'DOGEUSDT', name: 'Dogecoin' },
  { symbol: 'PEPEUSDT', name: 'Pepe' },
  { symbol: 'SUIUSDT', name: 'Sui' },
  { symbol: 'ADAUSDT', name: 'Cardano' },
  { symbol: 'AVAXUSDT', name: 'Avalanche' },
  { symbol: 'LINKUSDT', name: 'Chainlink' }
];

const TIMEFRAMES: Timeframe[] = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1'];

interface MarketAnalyzerWidgetProps {
  onApplySetup: (
    setup: ProposedTradeSetupDto,
    symbol: string,
    timeframe: Timeframe
  ) => void;
  initialSymbol?: string;
  initialTimeframe?: Timeframe;
}

export const MarketAnalyzerWidget: React.FC<MarketAnalyzerWidgetProps> = ({
  onApplySetup,
  initialSymbol = 'BTCUSDT',
  initialTimeframe = 'H1'
}) => {
  const { t } = useLanguage();

  const [symbol, setSymbol] = useState<string>(initialSymbol);
  const [searchQuery, setSearchQuery] = useState<string>(initialSymbol);
  const [timeframe, setTimeframe] = useState<Timeframe>(initialTimeframe);

  // Dynamic API symbols list fetched from GET /api/v1/trades/symbols
  const [availableSymbols, setAvailableSymbols] = useState<CryptoSymbolDto[]>([]);

  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<MarketAnalysisResponseDto | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch dynamic symbols list from API on mount
  useEffect(() => {
    loadSymbolsFromApi();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadSymbolsFromApi = async () => {
    try {
      const data = await getSymbols();
      if (data && data.length > 0) {
        setAvailableSymbols(data);
      } else {
        setAvailableSymbols(FALLBACK_SYMBOLS);
      }
    } catch {
      setAvailableSymbols(FALLBACK_SYMBOLS);
    }
  };

  const runAnalysis = async (targetSymbol: string, targetTimeframe: Timeframe) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await analyzeMarket(targetSymbol, targetTimeframe);
      setAnalysis(result);
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể thực hiện phân tích thị trường.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSymbol = searchQuery.trim().toUpperCase() || symbol;
    setSymbol(finalSymbol);
    setIsDropdownOpen(false);
    runAnalysis(finalSymbol, timeframe);
  };

  const selectSymbol = (sym: string) => {
    setSymbol(sym);
    setSearchQuery(sym);
    setIsDropdownOpen(false);
    runAnalysis(sym, timeframe);
  };

  // Filter pairs for dropdown
  const filteredSymbols = useMemo(() => {
    const query = searchQuery.trim().toUpperCase();
    if (!query) return availableSymbols;
    return availableSymbols.filter(
      (s) => s.symbol.includes(query) || s.name.toUpperCase().includes(query)
    );
  }, [searchQuery, availableSymbols]);

  const quickCoinTags = useMemo(() => {
    const defaultList = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'NEARUSDT', 'PEPEUSDT', 'SUIUSDT'];
    if (availableSymbols.length === 0) return defaultList;
    const fromApi = availableSymbols.slice(0, 8).map((s) => s.symbol);
    return Array.from(new Set([...fromApi, ...defaultList])).slice(0, 8);
  }, [availableSymbols]);

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xl border border-slate-800/80">
      {/* ── Widget Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <Sparkles size={24} />
          </div>
          <div>
            <h2 className="font-heading font-black text-lg sm:text-xl text-slate-100 flex items-center gap-2">
              {t.marketAnalyzer.title}
              <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                QUANT AI
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {t.marketAnalyzer.subtitle}
            </p>
          </div>
        </div>

        {/* Form Controls Header */}
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full lg:w-auto">
          {/* Symbol Searchable Input & Dropdown */}
          <div ref={dropdownRef} className="relative flex-1 min-w-[150px] sm:w-60">
            <div className="relative flex items-center">
              <input
                type="text"
                className="w-full bg-slate-950/90 border border-slate-800 focus:border-cyan-500 text-slate-100 font-extrabold text-xs sm:text-sm py-2.5 pl-9 pr-3 rounded-xl outline-none transition-all uppercase placeholder:normal-case placeholder:font-normal placeholder:text-slate-500"
                placeholder={t.marketAnalyzer.searchPlaceholder}
                value={searchQuery}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value.toUpperCase());
                  setIsDropdownOpen(true);
                }}
              />
              <Search
                size={16}
                className="text-slate-400 absolute left-3 pointer-events-none shrink-0"
              />
            </div>

            {/* Dropdown Suggestions List */}
            {isDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-slate-950/95 backdrop-blur-2xl border border-cyan-500/50 shadow-2xl shadow-cyan-950/80 rounded-xl max-h-64 overflow-y-auto z-50 divide-y divide-slate-800/60">
                <div className="px-3 py-2 bg-cyan-500/10 text-[11px] font-extrabold text-cyan-400 border-b border-cyan-500/20 flex items-center gap-1.5">
                  <Globe size={13} /> BINANCE FUTURES ({availableSymbols.length})
                </div>

                {filteredSymbols.length > 0 ? (
                  filteredSymbols.map((item) => (
                    <div
                      key={item.symbol}
                      onClick={() => selectSymbol(item.symbol)}
                      className={`px-3.5 py-2.5 flex items-center justify-between cursor-pointer text-xs font-bold transition-all ${
                        item.symbol === symbol
                          ? 'bg-cyan-500/20 border-l-4 border-l-cyan-400 text-white font-black'
                          : 'hover:bg-slate-900 text-slate-200'
                      }`}
                    >
                      <span className="font-mono">{item.symbol}</span>
                      <span className="text-[11px] text-slate-400 font-normal">{item.name}</span>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-xs text-slate-400 text-center font-mono">
                    Symbol: <strong className="text-cyan-400">"{searchQuery}"</strong>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Timeframe Select */}
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as Timeframe)}
            className="bg-slate-950/90 border border-slate-800 focus:border-cyan-500 text-slate-100 font-extrabold font-mono text-xs sm:text-sm py-2.5 px-3 rounded-xl outline-none transition-all cursor-pointer"
          >
            {TIMEFRAMES.map((tf) => (
              <option key={tf} value={tf} className="bg-slate-900 text-slate-100 font-bold">
                {tf}
              </option>
            ))}
          </select>

          {/* Analyze Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-cyber-primary text-white font-black text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <RefreshCw size={16} className="animate-spin text-white" />
                <span>{t.marketAnalyzer.analyzing}</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span className="whitespace-nowrap">{t.marketAnalyzer.analyzeBtn}</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Quick Coin Tags Row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mr-1">
          Pairs:
        </span>
        {quickCoinTags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => selectSymbol(tag)}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-extrabold transition-all cursor-pointer ${
              symbol === tag
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-sm shadow-purple-500/20'
                : 'bg-slate-950/60 text-slate-400 border border-slate-800 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            {tag.replace('USDT', '')}
          </button>
        ))}
      </div>

      {/* Error State */}
      {errorMessage && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl p-4 flex items-center gap-2.5 text-xs font-bold">
          <AlertTriangle size={18} className="shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Empty Initial State */}
      {!analysis && !isLoading && (
        <div className="bg-slate-950/50 border border-dashed border-slate-800 rounded-2xl p-10 text-center flex flex-col items-center justify-center space-y-4">
          <div className="p-4 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Bot size={40} />
          </div>
          <div>
            <h3 className="font-heading font-black text-lg text-slate-100">
              {symbol} ({timeframe}) Market Setup Finder
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
              {t.marketAnalyzer.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={() => runAnalysis(symbol, timeframe)}
            className="btn-cyber-primary text-white font-black text-xs sm:text-sm py-3 px-6 rounded-xl shadow-xl shadow-cyan-500/30 flex items-center gap-2 cursor-pointer transition-all"
          >
            <Zap size={18} fill="currentColor" />
            {t.marketAnalyzer.analyzeBtn} ({symbol})
          </button>
        </div>
      )}

      {/* Skeleton Loading State */}
      {isLoading && (
        <div className="p-12 text-center text-slate-400 space-y-3">
          <RefreshCw size={36} className="animate-spin text-cyan-400 mx-auto" />
          <p className="text-sm font-bold text-slate-200">
            {t.marketAnalyzer.analyzing} ({symbol})...
          </p>
        </div>
      )}

      {/* Main Analysis Content */}
      {analysis && !isLoading && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${analysis.symbol}-${analysis.timeframe}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Recommendation Banner */}
            <RecommendationBanner analysis={analysis} t={t} />

            {/* Technical Snapshot Bar */}
            <SnapshotSummaryBar snapshot={analysis.snapshot} />

            {/* Dual Setups Comparison Grid (Long vs Short) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <SetupCard
                setup={analysis.longSetup}
                symbol={analysis.symbol}
                timeframe={analysis.timeframe}
                isRecommended={analysis.recommendation === 'Long'}
                onApply={() => onApplySetup(analysis.longSetup, analysis.symbol, analysis.timeframe)}
                t={t}
              />

              <SetupCard
                setup={analysis.shortSetup}
                symbol={analysis.symbol}
                timeframe={analysis.timeframe}
                isRecommended={analysis.recommendation === 'Short'}
                onApply={() => onApplySetup(analysis.shortSetup, analysis.symbol, analysis.timeframe)}
                t={t}
              />
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

// ── Sub-component: Recommendation Banner ─────────────────────────────────────
const RecommendationBanner: React.FC<{ analysis: MarketAnalysisResponseDto; t: any }> = ({ analysis, t }) => {
  const rec = analysis.recommendation;
  const isLong = rec === 'Long';
  const isShort = rec === 'Short';

  const title = isLong ? t.marketAnalyzer.statusLong : isShort ? t.marketAnalyzer.statusShort : t.marketAnalyzer.statusWait;
  const Icon = isLong ? TrendingUp : isShort ? TrendingDown : ShieldAlert;

  const colorClass = isLong
    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
    : isShort
    ? 'bg-rose-500/10 border-rose-500/40 text-rose-400'
    : 'bg-amber-500/10 border-amber-500/40 text-amber-400';

  return (
    <div className={`rounded-xl border p-4 sm:p-5 space-y-2.5 transition-all shadow-lg ${colorClass}`}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <Icon size={22} className="shrink-0" />
          <h3 className="text-base font-heading font-black tracking-tight">
            {title}
          </h3>
        </div>
        <div className="text-xs font-mono font-bold text-slate-300 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800">
          {analysis.symbol} • {analysis.timeframe}
        </div>
      </div>

      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
        <strong className="text-white font-extrabold">{t.marketAnalyzer.rationale}</strong> {analysis.rationale}
      </p>

      {/* Blocking Reasons if Wait */}
      {rec === 'Wait' && analysis.blockingReasons.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {analysis.blockingReasons.map((reason) => (
            <span
              key={reason}
              className="bg-amber-500/20 border border-amber-500/40 text-amber-300 px-2.5 py-1 rounded-lg text-xs font-bold"
            >
              ⚠️ {reason}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Sub-component: Snapshot Summary Bar ───────────────────────────────────────
const SnapshotSummaryBar: React.FC<{ snapshot: any }> = ({ snapshot }) => {
  if (!snapshot) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 bg-slate-950/80 border border-slate-800 rounded-xl p-3 sm:p-4 text-center">
      <div>
        <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">PRICE</div>
        <div className="text-xs sm:text-sm font-mono font-black text-cyan-400 mt-0.5">
          ${snapshot.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
        </div>
      </div>

      <div>
        <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">EMA 20</div>
        <div className="text-xs sm:text-sm font-mono font-bold text-slate-200 mt-0.5">
          ${snapshot.ema20.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
        </div>
      </div>

      <div>
        <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">EMA 50</div>
        <div className="text-xs sm:text-sm font-mono font-bold text-slate-300 mt-0.5">
          ${snapshot.ema50.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
        </div>
      </div>

      <div>
        <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">RSI (14)</div>
        <div className={`text-xs sm:text-sm font-mono font-black mt-0.5 ${snapshot.rsi >= 65 ? 'text-rose-400' : snapshot.rsi <= 35 ? 'text-emerald-400' : 'text-amber-400'}`}>
          {snapshot.rsi.toFixed(1)}
        </div>
      </div>

      <div>
        <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">ATR (14)</div>
        <div className="text-xs sm:text-sm font-mono font-bold text-slate-200 mt-0.5">
          ${snapshot.atr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
        </div>
      </div>

      <div>
        <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">VOL RATIO</div>
        <div className={`text-xs sm:text-sm font-mono font-black mt-0.5 ${snapshot.volumeRatio >= 1.2 ? 'text-emerald-400' : 'text-slate-400'}`}>
          {snapshot.volumeRatio.toFixed(2)}x
        </div>
      </div>
    </div>
  );
};

// ── Sub-component: Proposed Setup Card ────────────────────────────────────────
interface SetupCardProps {
  setup: ProposedTradeSetupDto;
  symbol: string;
  timeframe: Timeframe;
  isRecommended: boolean;
  onApply: () => void;
  t: any;
}

const SetupCard: React.FC<SetupCardProps> = ({ setup, isRecommended, onApply, t }) => {
  const isLong = setup.direction === 'Long';
  const pred = setup.prediction;

  const cardBorder = isRecommended
    ? isLong
      ? 'border-emerald-500/60 bg-gradient-to-b from-emerald-500/10 to-slate-950/90 shadow-xl shadow-emerald-950/40'
      : 'border-rose-500/60 bg-gradient-to-b from-rose-500/10 to-slate-950/90 shadow-xl shadow-rose-950/40'
    : 'border-slate-800 bg-slate-950/60';

  return (
    <div className={`rounded-xl border p-4 sm:p-5 flex flex-col justify-between relative transition-all ${cardBorder}`}>
      {/* Recommended Ribbon */}
      {isRecommended && (
        <div className={`absolute -top-3 right-4 ${isLong ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-rose-500 shadow-rose-500/50'} text-white text-[10px] font-black tracking-widest px-3 py-0.5 rounded-full shadow-md uppercase`}>
          RECOMMENDED
        </div>
      )}

      <div className="space-y-3.5">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-black tracking-wide ${isLong ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
              {isLong ? '📈 LONG SETUP' : '📉 SHORT SETUP'}
            </span>
            {setup.isTradable ? (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={13} /> TRADABLE
              </span>
            ) : (
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                <AlertTriangle size={13} /> HIGH RISK
              </span>
            )}
          </div>
        </div>

        {/* Parameters Grid */}
        <div className="grid grid-cols-3 gap-2 bg-slate-950/90 border border-slate-800 p-3 rounded-xl">
          <div>
            <div className="text-[10px] font-extrabold text-slate-500 uppercase">{t.marketAnalyzer.proposedEntry}</div>
            <div className="text-xs sm:text-sm font-mono font-black text-slate-100 mt-0.5">
              ${setup.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-extrabold text-slate-500 uppercase">{t.marketAnalyzer.proposedSL}</div>
            <div className="text-xs sm:text-sm font-mono font-black text-rose-400 mt-0.5">
              ${setup.stopLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-extrabold text-slate-500 uppercase">{t.marketAnalyzer.proposedTP}</div>
            <div className="text-xs sm:text-sm font-mono font-black text-emerald-400 mt-0.5">
              ${setup.takeProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </div>
          </div>
        </div>

        {/* Prediction Metrics Overview */}
        {pred && (
          <div className="flex items-center justify-between bg-cyan-500/10 border border-cyan-500/30 p-2.5 rounded-xl text-xs font-semibold">
            <div>
              <span className="text-slate-400">{t.monteCarlo.winRate}: </span>
              <strong className={`font-mono font-black ${pred.winProbability >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {pred.winProbability.toFixed(1)}%
              </strong>
            </div>
            <div>
              <span className="text-slate-400">R:R: </span>
              <strong className="font-mono font-black text-cyan-400">
                1:{setup.riskRewardRatio.toFixed(2)}
              </strong>
            </div>
            <div>
              <span className="text-slate-400">E[R]: </span>
              <strong className={`font-mono font-black ${pred.expectedRMultiple > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {pred.expectedRMultiple.toFixed(2)}R
              </strong>
            </div>
          </div>
        )}

        {/* Setup Score & Tradable Tag */}
        <div className="text-xs text-slate-300 flex justify-between items-center pt-1 font-semibold">
          <span>Score: <strong className="text-cyan-400 font-mono font-black">{setup.setupScore.toFixed(0)}/100</strong></span>
          <span className="text-[11px] text-slate-400 font-mono">SL Method: {setup.stopLossSource}</span>
        </div>
      </div>

      {/* Action Button: Apply Setup */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        type="button"
        onClick={onApply}
        className={`w-full mt-4 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md ${
          isRecommended
            ? isLong
              ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/30'
              : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/30'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
        }`}
      >
        <span>{t.marketAnalyzer.applySetupBtn}</span>
        <ArrowRight size={15} />
      </motion.button>
    </div>
  );
};
