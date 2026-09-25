import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, Sparkles, TrendingUp, TrendingDown, Radio } from 'lucide-react';
import { useBinanceStream } from '../context/BinanceStreamContext';
import { formatDynamicPrice } from '../utils/formatters';
import { getSymbols } from '../api/tradeApi';
import type { CryptoSymbolDto } from '../types/trade';

const FALLBACK_COINS: CryptoSymbolDto[] = [
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
  { symbol: 'LINKUSDT', name: 'Chainlink' },
];

interface CoinSelectorBarProps {
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}

export const CoinSelectorBar: React.FC<CoinSelectorBarProps> = ({
  selectedSymbol,
  onSelectSymbol,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableSymbols, setAvailableSymbols] = useState<CryptoSymbolDto[]>(FALLBACK_COINS);
  const [isLoadingSymbols, setIsLoadingSymbols] = useState(false);
  // dropdownPos: position of the dropdown in viewport coordinates (fixed)
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { tickers, getPrice } = useBinanceStream();

  // Fetch dynamic symbols list from API on mount (same as MarketAnalyzerWidget)
  useEffect(() => {
    const loadSymbols = async () => {
      setIsLoadingSymbols(true);
      try {
        const data = await getSymbols();
        if (data && data.length > 0) {
          setAvailableSymbols(data);
        } else {
          setAvailableSymbols(FALLBACK_COINS);
        }
      } catch {
        setAvailableSymbols(FALLBACK_COINS);
      } finally {
        setIsLoadingSymbols(false);
      }
    };
    loadSymbols();
  }, []);

  // Calculate and update dropdown position whenever it opens or window resizes/scrolls
  const updateDropdownPos = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
    });
  };

  useEffect(() => {
    if (isOpen) {
      updateDropdownPos();
      window.addEventListener('scroll', updateDropdownPos, true);
      window.addEventListener('resize', updateDropdownPos);
    }
    return () => {
      window.removeEventListener('scroll', updateDropdownPos, true);
      window.removeEventListener('resize', updateDropdownPos);
    };
  }, [isOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCoins = useMemo(() => {
    const query = searchQuery.trim().toUpperCase();
    if (!query) return availableSymbols;
    return availableSymbols.filter(
      (c) => c.symbol.includes(query) || c.name.toUpperCase().includes(query)
    );
  }, [searchQuery, availableSymbols]);

  const activeTicker = tickers[selectedSymbol];
  const currentPrice = activeTicker?.price ?? getPrice(selectedSymbol);
  const changePct = activeTicker?.priceChangePct ?? null;
  const isPositive = changePct !== null && changePct >= 0;

  const handleSelect = (symbol: string) => {
    onSelectSymbol(symbol);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Portal dropdown rendered directly to document.body to escape all stacking contexts
  const dropdownPortal =
    isOpen && dropdownPos
      ? createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: dropdownPos.width,
              zIndex: 99999,
            }}
            className="bg-slate-950/95 border border-slate-800 rounded-xl shadow-2xl backdrop-blur-xl p-2 space-y-2 max-h-72 overflow-y-auto"
          >
            {/* Search Input */}
            <div className="relative flex items-center px-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search coin (e.g. BTC, PEPE, SOL)..."
                className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 text-xs font-mono py-2 pl-8 pr-3 rounded-lg text-white outline-none placeholder:text-slate-500 uppercase"
              />
            </div>

            {/* Coin List */}
            {isLoadingSymbols && (
              <div className="flex items-center justify-center gap-2 py-3 text-xs text-slate-400 font-mono">
                <span className="animate-spin inline-block w-3 h-3 border border-cyan-400 border-t-transparent rounded-full" />
                Loading symbols...
              </div>
            )}
            <div className="space-y-0.5">
              {filteredCoins.map((coin) => {
                const ticker = tickers[coin.symbol];
                const price = ticker?.price;
                const pct = ticker?.priceChangePct;
                const isPos = pct !== undefined && pct >= 0;

                return (
                  <button
                    key={coin.symbol}
                    type="button"
                    onClick={() => handleSelect(coin.symbol)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                      selectedSymbol === coin.symbol
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'hover:bg-slate-900 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white">{coin.symbol}</span>
                      <span className="text-[10px] text-slate-400">{coin.name}</span>
                    </div>
                    {price ? (
                      <div className="text-right">
                        <span className="font-bold text-white block">${formatDynamicPrice(price)}</span>
                        {pct !== undefined && (
                          <span className={`text-[10px] font-bold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isPos ? '+' : ''}{pct.toFixed(2)}%
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-semibold">Select</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-2xl backdrop-blur-md text-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* ── Left: Searchable Coin Dropdown & Active Price ── */}
      <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
        <div className="relative min-w-[200px] sm:w-64">
          <button
            ref={buttonRef}
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="w-full bg-slate-950/90 hover:bg-slate-950 border border-slate-800 hover:border-cyan-500/50 py-2.5 px-3.5 rounded-xl flex items-center justify-between transition-all cursor-pointer shadow-inner"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="font-mono font-black text-sm text-white block uppercase tracking-wide">
                  {selectedSymbol}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {availableSymbols.find((c) => c.symbol === selectedSymbol)?.name || 'Crypto Pair'}
                </span>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown rendered via Portal → escapes all stacking contexts */}
          {dropdownPortal}
        </div>

        {/* Realtime Live Price Display Header */}
        <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-800/80 px-4 py-2 rounded-xl font-mono">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-xs text-slate-400 font-bold uppercase">Price:</span>
          </div>
          <span className="text-base font-extrabold text-white">
            {currentPrice ? `$${formatDynamicPrice(currentPrice)}` : '---'}
          </span>
          {changePct !== null && (
            <span
              className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-md ${
                isPositive
                  ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                  : 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
              }`}
            >
              {isPositive ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
              {isPositive ? '+' : ''}{changePct.toFixed(2)}%
            </span>
          )}
        </div>
      </div>

      {/* ── Right: Quick Pair Pills (always show fallback popular set) ── */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] font-mono font-bold text-slate-400 uppercase mr-1">Quick Pairs:</span>
        {FALLBACK_COINS.map((c) => {
          const isSelected = selectedSymbol === c.symbol;
          return (
            <button
              key={c.symbol}
              type="button"
              onClick={() => onSelectSymbol(c.symbol)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-extrabold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-950/60 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              {c.symbol.replace('USDT', '')}
            </button>
          );
        })}
      </div>
    </div>
  );
};
