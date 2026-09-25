import React, { useState, useEffect } from 'react';
import { CoinSelectorBar } from './CoinSelectorBar';
import { RealtimeCandlestickChart } from './RealtimeCandlestickChart';
import { CoinDetailRealtimePanel } from './CoinDetailRealtimePanel';
import type { Timeframe } from '../types/trade';

interface CryptoRealtimeMarketHubProps {
  initialSymbol?: string;
  initialTimeframe?: Timeframe;
  onSymbolChange?: (symbol: string) => void;
}

/**
 * CryptoRealtimeMarketHub
 *
 * A unified composite component that encapsulates the complete Real-Time Crypto Market Workspace:
 *   1. Dedicated Coin Selector (Search Dropdown + Quick Pair Pills)
 *   2. Real-Time Interactive Candlestick Chart (Binance WS + Hover Tooltip + Zoom/Pan)
 *   3. Real-Time Coin Market Metrics (Mark Price, Funding Rate, Order Book Depth, Best Bid/Ask)
 *
 * All sub-panels stay strictly grouped together as a single unified component.
 */
export const CryptoRealtimeMarketHub: React.FC<CryptoRealtimeMarketHubProps> = ({
  initialSymbol = 'BTCUSDT',
  initialTimeframe = 'H1',
  onSymbolChange
}) => {
  const [symbol, setSymbol] = useState<string>(initialSymbol);
  const [timeframe, setTimeframe] = useState<Timeframe>(initialTimeframe);

  // Sync state if parent props change
  useEffect(() => {
    if (initialSymbol) setSymbol(initialSymbol);
  }, [initialSymbol]);

  useEffect(() => {
    if (initialTimeframe) setTimeframe(initialTimeframe);
  }, [initialTimeframe]);

  const handleSymbolSelect = (newSymbol: string) => {
    setSymbol(newSymbol);
    onSymbolChange?.(newSymbol);
  };

  return (
    <div className="space-y-5 w-full">
      {/* ── 1. Dedicated Realtime Coin Selector Bar ── */}
      <CoinSelectorBar
        selectedSymbol={symbol}
        onSelectSymbol={handleSymbolSelect}
      />

      {/* ── 2. Realtime Standalone Candlestick Chart ── */}
      <RealtimeCandlestickChart
        symbol={symbol}
        timeframe={timeframe}
      />

      {/* ── 3. Realtime Coin Market Metrics (Mark Price, Funding, Order Book) ── */}
      <CoinDetailRealtimePanel
        symbol={symbol}
        timeframe={timeframe}
      />
    </div>
  );
};
