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
  const [symbol, setSymbol] = useState<string>(initialSymbol);
  const [searchQuery, setSearchQuery] = useState<string>(initialSymbol);
  const [timeframe, setTimeframe] = useState<Timeframe>(initialTimeframe);

  // Dynamic API symbols list fetched from GET /api/v1/trades/symbols
  const [availableSymbols, setAvailableSymbols] = useState<CryptoSymbolDto[]>([]);
  const [isSymbolsLoading, setIsSymbolsLoading] = useState<boolean>(true);

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
    setIsSymbolsLoading(true);
    try {
      // Direct API call to backend GET /api/v1/trades/symbols
      const data = await getSymbols();
      if (data && data.length > 0) {
        setAvailableSymbols(data);
      } else {
        setAvailableSymbols(FALLBACK_SYMBOLS);
      }
    } catch {
      setAvailableSymbols(FALLBACK_SYMBOLS);
    } finally {
      setIsSymbolsLoading(false);
    }
  };

  // Dynamic search filtering across hundreds of symbols returned by API
  const filteredSymbols = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const sourceList = availableSymbols.length > 0 ? availableSymbols : FALLBACK_SYMBOLS;

    if (!query) return sourceList.slice(0, 40);
    return sourceList
      .filter(
        (s) =>
          s.symbol.toLowerCase().includes(query) ||
          s.name.toLowerCase().includes(query)
      )
      .slice(0, 40);
  }, [availableSymbols, searchQuery]);

  // Dynamic Quick Coin Tags derived from top API symbols
  const quickCoinTags = useMemo(() => {
    const sourceList = availableSymbols.length > 0 ? availableSymbols : FALLBACK_SYMBOLS;
    return sourceList.slice(0, 8).map((s) => s.symbol);
  }, [availableSymbols]);

  const selectSymbol = (sym: string) => {
    const formatted = sym.trim().toUpperCase();
    setSymbol(formatted);
    setSearchQuery(formatted);
    setIsDropdownOpen(false);
  };

  const runAnalysis = async (targetSymbol: string, targetTimeframe: Timeframe) => {
    const cleanSym = targetSymbol.trim().toUpperCase();
    if (!cleanSym) return;

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await analyzeMarket(cleanSym, targetTimeframe);
      setAnalysis(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể thực hiện phân tích thị trường.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSym = searchQuery.trim().toUpperCase() || symbol;
    setSymbol(finalSym);
    runAnalysis(finalSym, timeframe);
  };

  return (
    <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
      {/* ── Top Header & Input Controls ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.2))',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            padding: '0.6rem',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sparkles size={22} color="#06b6d4" />
          </div>
          <div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
              AI Market Analyzer & Setup Finder
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0 }}>
              Tìm kiếm bất kỳ Cặp Coin nào từ Binance API — Nhấn Nút Phân Tích khi bạn cần
            </p>
          </div>
        </div>

        {/* Form Search & Timeframe Controls */}
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', alignItems: 'flex-end', gap: '0.65rem', flexWrap: 'wrap' }}>
          {/* Dynamic Searchable Symbol Input with Dropdown */}
          <div ref={dropdownRef} style={{ position: 'relative', width: '240px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
              <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Tìm Kiếm Coin (API Live)
              </label>
              {isSymbolsLoading ? (
                <span style={{ fontSize: '0.65rem', color: '#06b6d4', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <RefreshCw size={10} className="spin" /> Đang tải API...
                </span>
              ) : (
                <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 700 }}>
                  ⚡ {availableSymbols.length} pairs
                </span>
              )}
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="input-field"
                placeholder="Gõ mã Coin (e.g. PEPE, SOL, SUI...)"
                value={searchQuery}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value.toUpperCase());
                  setIsDropdownOpen(true);
                }}
                style={{
                  width: '100%',
                  paddingLeft: '2.2rem',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  textTransform: 'uppercase'
                }}
              />
              <Search
                size={14}
                color="#64748b"
                style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
            </div>

            {/* Dropdown Suggestions List (Rendered dynamically from API symbols) */}
            {isDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '0.35rem',
                background: '#090d16',
                border: '1px solid rgba(6, 182, 212, 0.35)',
                borderRadius: '10px',
                maxHeight: '240px',
                overflowY: 'auto',
                zIndex: 100,
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8)'
              }}>
                <div style={{
                  padding: '0.4rem 0.75rem',
                  background: 'rgba(6, 182, 212, 0.1)',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  color: '#06b6d4',
                  borderBottom: '1px solid rgba(6, 182, 212, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}>
                  <Globe size={12} /> BINANCE FUTURES API ({availableSymbols.length} COINS)
                </div>

                {filteredSymbols.length > 0 ? (
                  filteredSymbols.map((item) => (
                    <div
                      key={item.symbol}
                      onClick={() => selectSymbol(item.symbol)}
                      style={{
                        padding: '0.55rem 0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        background: item.symbol === symbol ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                        color: item.symbol === symbol ? '#06b6d4' : '#e2e8f0'
                      }}
                      onMouseEnter={(e) => {
                        if (item.symbol !== symbol) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                      }}
                      onMouseLeave={(e) => {
                        if (item.symbol !== symbol) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <span>{item.symbol}</span>
                      <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>{item.name}</span>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '0.75rem', fontSize: '0.78rem', color: '#94a3b8', textAlign: 'center' }}>
                    Nhấn Enter để gửi phân tích mã <strong>"{searchQuery}"</strong>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Timeframe Select */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Khung Thời Gian</label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as Timeframe)}
              className="input-field"
              style={{ width: '90px', padding: '0.45rem 0.65rem', fontSize: '0.85rem', fontWeight: 700 }}
            >
              {TIMEFRAMES.map((tf) => (
                <option key={tf} value={tf}>{tf}</option>
              ))}
            </select>
          </div>

          {/* Analyze Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{
              padding: '0.52rem 1.2rem',
              fontSize: '0.85rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              height: '38px'
            }}
          >
            {isLoading ? (
              <>
                <RefreshCw size={16} className="spin" />
                Đang Phân Tích...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Phân Tích & Gợi Ý Setup
              </>
            )}
          </button>
        </form>
      </div>

      {/* ── Quick Coin Tags Row (Dynamic from API) ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginRight: '0.2rem' }}>
          Gợi Ý Nhanh từ API:
        </span>
        {quickCoinTags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => selectSymbol(tag)}
            style={{
              background: symbol === tag ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${symbol === tag ? 'rgba(6, 182, 212, 0.5)' : 'rgba(255, 255, 255, 0.08)'}`,
              color: symbol === tag ? '#06b6d4' : '#94a3b8',
              borderRadius: '6px',
              padding: '0.2rem 0.55rem',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {tag.replace('USDT', '')}
          </button>
        ))}
      </div>

      {/* Error State */}
      {errorMessage && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.1)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          borderRadius: '10px',
          padding: '0.85rem 1rem',
          color: '#f43f5e',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1rem'
        }}>
          <AlertTriangle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ── Empty Initial State (Manual Trigger Required) ── */}
      {!analysis && !isLoading && (
        <div style={{
          background: 'rgba(15, 23, 42, 0.4)',
          border: '1px dashed rgba(255, 255, 255, 0.12)',
          borderRadius: '14px',
          padding: '3rem 2rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(59, 130, 246, 0.15))',
            padding: '1.1rem',
            borderRadius: '50%',
            marginBottom: '1rem'
          }}>
            <Bot size={36} color="#06b6d4" />
          </div>
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.4rem 0', color: '#f8fafc' }}>
            Sẵn Sàng Phân Tích Kèo {symbol} ({timeframe})
          </h3>
          <p style={{ color: '#94a3b8', maxWidth: '480px', fontSize: '0.85rem', lineHeight: 1.5, margin: '0 0 1.5rem 0' }}>
            Hãy chọn Cặp Coin bất kỳ từ Binance API ở ô tìm kiếm phía trên và nhấn nút <strong>PHÂN TÍCH & GỢI Ý SETUP</strong> để hệ thống quét nến Binance, xác định cản Hỗ trợ / Kháng cự và đưa ra kịch bản tối ưu.
          </p>
          <button
            type="button"
            onClick={() => runAnalysis(symbol, timeframe)}
            className="btn btn-primary"
            style={{
              padding: '0.65rem 1.6rem',
              fontSize: '0.9rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 0 20px rgba(6, 182, 212, 0.35)'
            }}
          >
            <Zap size={18} />
            Bắt Đầu Phân Tích {symbol} Bây Giờ
          </button>
        </div>
      )}

      {/* Skeleton Loading State */}
      {isLoading && (
        <div style={{ padding: '3rem 2rem', textAlign: 'center', color: '#64748b' }}>
          <RefreshCw size={32} className="spin" style={{ marginBottom: '1rem', color: '#06b6d4' }} />
          <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 0.3rem 0' }}>
            Đang quét nến Binance & xác định cản Hỗ trợ/Kháng cự cho {symbol}...
          </p>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Đang thực hiện 10,000 lượt mô phỏng đường đi giá ngẫu nhiên bằng Monte Carlo GBM với Fat-Tailed Noise
          </p>
        </div>
      )}

      {/* ── Main Analysis Content (Rendered only after user triggers analysis) ── */}
      {analysis && !isLoading && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${analysis.symbol}-${analysis.timeframe}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* ── Top Recommendation Banner ── */}
            <RecommendationBanner analysis={analysis} />

            {/* ── Technical Snapshot Bar ── */}
            <SnapshotSummaryBar snapshot={analysis.snapshot} />

            {/* ── Dual Setups Comparison Grid (Long vs Short) ── */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.25rem',
              marginTop: '1.25rem'
            }}>
              <SetupCard
                setup={analysis.longSetup}
                symbol={analysis.symbol}
                timeframe={analysis.timeframe}
                isRecommended={analysis.recommendation === 'Long'}
                onApply={() => onApplySetup(analysis.longSetup, analysis.symbol, analysis.timeframe)}
              />

              <SetupCard
                setup={analysis.shortSetup}
                symbol={analysis.symbol}
                timeframe={analysis.timeframe}
                isRecommended={analysis.recommendation === 'Short'}
                onApply={() => onApplySetup(analysis.shortSetup, analysis.symbol, analysis.timeframe)}
              />
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

// ── Sub-component: Recommendation Banner ─────────────────────────────────────
const RecommendationBanner: React.FC<{ analysis: MarketAnalysisResponseDto }> = ({ analysis }) => {
  const rec = analysis.recommendation;

  const recConfig = {
    Long: {
      bg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
      border: 'rgba(16, 185, 129, 0.4)',
      text: '#10b981',
      icon: TrendingUp,
      title: 'KHUYẾN NGHỊ: NÊN ĐẶT LỆNH LONG (BUY)'
    },
    Short: {
      bg: 'linear-gradient(135deg, rgba(244, 63, 94, 0.15) 0%, rgba(225, 29, 72, 0.1) 100%)',
      border: 'rgba(244, 63, 94, 0.4)',
      text: '#f43f5e',
      icon: TrendingDown,
      title: 'KHUYẾN NGHỊ: NÊN ĐẶT LỆNH SHORT (SELL)'
    },
    Wait: {
      bg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%)',
      border: 'rgba(245, 158, 11, 0.4)',
      text: '#f59e0b',
      icon: ShieldAlert,
      title: 'KHUYẾN NGHỊ: ĐỨNG NGOÀI (STAND ASIDE / WAIT)'
    }
  }[rec];

  const Icon = recConfig.icon;

  return (
    <div style={{
      background: recConfig.bg,
      border: `1px solid ${recConfig.border}`,
      borderRadius: '12px',
      padding: '1.1rem 1.25rem',
      marginBottom: '1.25rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Icon size={22} color={recConfig.text} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: recConfig.text, margin: 0 }}>
            {recConfig.title}
          </h3>
        </div>
        <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>
          {analysis.symbol} • Khung {analysis.timeframe}
        </div>
      </div>

      <p style={{ fontSize: '0.85rem', color: '#e2e8f0', marginTop: '0.5rem', marginBottom: rec.toLowerCase() === 'wait' && analysis.blockingReasons.length > 0 ? '0.6rem' : 0, lineHeight: 1.4 }}>
        <strong>Phân tích cơ sở:</strong> {analysis.rationale}
      </p>

      {/* Blocking Reasons if Wait */}
      {rec === 'Wait' && analysis.blockingReasons.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
          {analysis.blockingReasons.map((reason) => (
            <span
              key={reason}
              style={{
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#fbbf24',
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 700
              }}
            >
              ⚠️ {formatBlockerReason(reason)}
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
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
      gap: '0.6rem',
      background: 'rgba(15, 23, 42, 0.6)',
      border: '1px solid rgba(255, 255, 255, 0.06)',
      borderRadius: '10px',
      padding: '0.75rem 1rem'
    }}>
      <div>
        <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>GIÁ HIỆN TẠI</div>
        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#06b6d4' }}>
          ${snapshot.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
        </div>
      </div>

      <div>
        <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>EMA 20</div>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
          ${snapshot.ema20.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
        </div>
      </div>

      <div>
        <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>EMA 50</div>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#cbd5e1' }}>
          ${snapshot.ema50.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
        </div>
      </div>

      <div>
        <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>RSI (14)</div>
        <div style={{
          fontSize: '0.85rem',
          fontWeight: 800,
          color: snapshot.rsi >= 65 ? '#f43f5e' : snapshot.rsi <= 35 ? '#10b981' : '#f59e0b'
        }}>
          {snapshot.rsi.toFixed(1)}
        </div>
      </div>

      <div>
        <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>ATR (14)</div>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
          ${snapshot.atr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
        </div>
      </div>

      <div>
        <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>VOLUME RATIO</div>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: snapshot.volumeRatio >= 1.2 ? '#10b981' : '#94a3b8' }}>
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
}

const SetupCard: React.FC<SetupCardProps> = ({ setup, isRecommended, onApply }) => {
  const isLong = setup.direction === 'Long';
  const themeColor = isLong ? '#10b981' : '#f43f5e';
  const pred = setup.prediction;

  return (
    <div style={{
      background: isRecommended
        ? isLong
          ? 'linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.8) 100%)'
          : 'linear-gradient(180deg, rgba(244, 63, 94, 0.08) 0%, rgba(15, 23, 42, 0.8) 100%)'
        : 'rgba(15, 23, 42, 0.5)',
      border: `1px solid ${isRecommended ? themeColor : 'rgba(255, 255, 255, 0.08)'}`,
      borderRadius: '14px',
      padding: '1.25rem',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative'
    }}>
      {/* Recommended Ribbon */}
      {isRecommended && (
        <div style={{
          position: 'absolute',
          top: '-10px',
          right: '15px',
          background: themeColor,
          color: '#ffffff',
          fontSize: '0.65rem',
          fontWeight: 900,
          letterSpacing: '0.05em',
          padding: '0.15rem 0.65rem',
          borderRadius: '9999px',
          boxShadow: `0 0 10px ${themeColor}66`
        }}>
          RECOMMENDED SETUP
        </div>
      )}

      <div>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              background: isLong ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
              color: themeColor,
              fontWeight: 900,
              padding: '0.2rem 0.6rem',
              borderRadius: '6px',
              fontSize: '0.8rem'
            }}>
              {isLong ? '📈 LONG SETUP' : '📉 SHORT SETUP'}
            </span>
            {setup.isTradable ? (
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <CheckCircle2 size={12} /> TRADABLE
              </span>
            ) : (
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <AlertTriangle size={12} /> HIGH RISK
              </span>
            )}
          </div>

          <div style={{ fontSize: '1.1rem', fontWeight: 900, color: themeColor }}>
            Score: {setup.setupScore.toFixed(0)}<span style={{ fontSize: '0.75rem', color: '#64748b' }}>/100</span>
          </div>
        </div>

        {/* Entry / Zone */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.25)',
          padding: '0.75rem',
          borderRadius: '8px',
          marginBottom: '0.85rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.35rem' }}>
            <span style={{ color: '#94a3b8' }}>Entry Price:</span>
            <strong style={{ color: '#f8fafc', fontSize: '0.9rem' }}>
              ${setup.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
            </strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b' }}>
            <span>Vùng Entry Zone:</span>
            <span>
              ${setup.entryZoneLow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} - ${setup.entryZoneHigh.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </span>
          </div>
        </div>

        {/* Levels Grid: SL & TP */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '0.85rem' }}>
          {/* Stop Loss */}
          <div style={{ background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.2)', padding: '0.65rem', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#f43f5e' }}>STOP LOSS (SL)</div>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#f8fafc', margin: '0.15rem 0' }}>
              ${setup.stopLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
            </div>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
              Nguồn: {setup.stopLossSource === 'MarketStructure' ? 'Cấu trúc cản' : 'Biên độ ATR'}
            </div>
          </div>

          {/* Take Profit */}
          <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.65rem', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#10b981' }}>TAKE PROFIT (TP)</div>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#f8fafc', margin: '0.15rem 0' }}>
              ${setup.takeProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
            </div>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
              Nguồn: {setup.takeProfitSource === 'MarketStructure' ? 'Cấu trúc cản' : 'Biên độ ATR'}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.4rem',
          textAlign: 'center',
          marginBottom: '0.85rem',
          fontSize: '0.72rem'
        }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.4rem', borderRadius: '6px' }}>
            <div style={{ color: '#64748b' }}>TỶ LỆ R:R</div>
            <strong style={{ color: '#06b6d4', fontSize: '0.85rem' }}>{setup.riskRewardRatio.toFixed(2)}R</strong>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.4rem', borderRadius: '6px' }}>
            <div style={{ color: '#64748b' }}>WIN RATE</div>
            <strong style={{ color: pred.winProbability >= 50 ? '#10b981' : '#f59e0b', fontSize: '0.85rem' }}>
              {pred.winProbability.toFixed(1)}%
            </strong>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.4rem', borderRadius: '6px' }}>
            <div style={{ color: '#64748b' }}>EXPECTANCY</div>
            <strong style={{ color: pred.expectedRMultiple >= 0 ? '#10b981' : '#f43f5e', fontSize: '0.85rem' }}>
              {pred.expectedRMultiple >= 0 ? '+' : ''}{pred.expectedRMultiple.toFixed(2)}R
            </strong>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        type="button"
        onClick={onApply}
        className="btn"
        style={{
          width: '100%',
          padding: '0.6rem',
          fontSize: '0.85rem',
          fontWeight: 800,
          background: isRecommended
            ? `linear-gradient(135deg, ${themeColor} 0%, #06b6d4 100%)`
            : 'rgba(255, 255, 255, 0.08)',
          color: '#ffffff',
          border: 'none',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.4rem',
          cursor: 'pointer',
          marginTop: '0.5rem'
        }}
      >
        <span>Áp Dụng Setup {isLong ? 'Long' : 'Short'} Này</span>
        <ArrowRight size={16} />
      </button>
    </div>
  );
};

// Helper translation function for blocker reasons
function formatBlockerReason(reason: string): string {
  const map: Record<string, string> = {
    InsufficientClosedCandles: 'Dữ liệu nến quá ít',
    StaleMarketData: 'Dữ liệu giá cũ / mất kết nối',
    LowConfidence: 'Độ tin cậy dự đoán thấp',
    LowSetupScore: 'Điểm kỹ thuật setup thấp (< 60/100)',
    LowWinProbability: 'Xác suất thắng Monte Carlo quá thấp',
    LowExpectedRMultiple: 'Tỷ lệ lợi nhuận kỳ vọng âm',
    HighNoHitProbability: 'Xác suất không chạm TP/SL quá cao',
    OutsideEntryZone: 'Giá hiện tại nằm ngoài vùng Entry Zone',
    PoorMarketStructureRiskReward: 'Tỷ lệ Risk:Reward cản hỗ trợ/kháng cự quá thấp'
  };
  return map[reason] || reason;
}
