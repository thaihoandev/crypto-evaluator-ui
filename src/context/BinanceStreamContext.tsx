/**
 * BinanceStreamContext
 *
 * Global React context that manages a single shared Binance WebSocket
 * mini-ticker connection for all TOP_TICKERS, distributing real-time
 * price data throughout the app without creating multiple WS connections.
 *
 * NOTE: STREAM_SYMBOLS is intentionally kept in a separate constants file
 * (src/constants/binanceStreams.ts) so that this file only exports React
 * components/hooks — required for Vite React Fast Refresh (HMR) to work
 * without triggering a full page reload that would kill the WS connection.
 *
 * Usage:
 *   const { tickers, wsStatus, getPrice } = useBinanceStream();
 */

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import {
  useTickerStream,
  type BinanceMiniTicker,
  type WsConnectionStatus,
} from '../hooks/useBinanceWebSocket';
import { STREAM_SYMBOLS } from '../constants/binanceStreams';

// ─── Context type ─────────────────────────────────────────────────────────────

interface BinanceStreamContextValue {
  /** Real-time mini-ticker data keyed by symbol */
  tickers: Record<string, BinanceMiniTicker>;
  /** Current WebSocket connection status */
  wsStatus: WsConnectionStatus;
  /** Convenience helper to get latest price for a symbol */
  getPrice: (symbol: string) => number | null;
  /** 24h price change % for a symbol */
  getPriceChangePct: (symbol: string) => number | null;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const BinanceStreamContext = createContext<BinanceStreamContextValue>({
  tickers: {},
  wsStatus: 'disconnected',
  getPrice: () => null,
  getPriceChangePct: () => null,
});

// ─── Provider ─────────────────────────────────────────────────────────────────

interface BinanceStreamProviderProps {
  children: ReactNode;
  /** Override symbols to stream (defaults to STREAM_SYMBOLS) */
  symbols?: string[];
  /** Disable streaming (e.g. in test environments) */
  disabled?: boolean;
}

export function BinanceStreamProvider({
  children,
  symbols = STREAM_SYMBOLS,
  disabled = false,
}: BinanceStreamProviderProps) {
  const { tickers, status: wsStatus } = useTickerStream({
    symbols,
    enabled: !disabled,
  });

  const value = useMemo<BinanceStreamContextValue>(
    () => ({
      tickers,
      wsStatus,
      getPrice: (symbol: string) => tickers[symbol]?.price ?? null,
      getPriceChangePct: (symbol: string) =>
        tickers[symbol]?.priceChangePct ?? null,
    }),
    [tickers, wsStatus]
  );

  return (
    <BinanceStreamContext.Provider value={value}>
      {children}
    </BinanceStreamContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBinanceStream(): BinanceStreamContextValue {
  return useContext(BinanceStreamContext);
}
