/**
 * Binance WebSocket stream constants.
 * Kept in a separate file (non-component) so BinanceStreamContext.tsx
 * can satisfy React Fast Refresh rules (only component exports in component files).
 */

/**
 * Symbols to stream via Binance miniTicker WebSocket.
 * Read from VITE_BINANCE_STREAM_SYMBOLS env var (comma-separated, lowercase Binance format).
 * Converted to uppercase for internal use — the hook lowercases them when building stream URLs.
 *
 * Falls back to the full 12-symbol list if env var is not set.
 */
const ENV_SYMBOLS = import.meta.env.VITE_BINANCE_STREAM_SYMBOLS as string | undefined;

export const STREAM_SYMBOLS: string[] = ENV_SYMBOLS
  ? ENV_SYMBOLS.split(',')
      .map((s: string) => s.trim().toUpperCase())
      .filter(Boolean)
  : [
      'BTCUSDT',
      'ETHUSDT',
      'SOLUSDT',
      'BNBUSDT',
      'XRPUSDT',
      'NEARUSDT',
      'ADAUSDT',
      'AVAXUSDT',
      'DOGEUSDT',
      'LINKUSDT',
      'SUIUSDT',
      'PEPEUSDT',
    ];
