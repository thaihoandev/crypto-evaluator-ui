/**
 * useBinanceWebSocket
 *
 * Custom hook that connects directly to Binance Futures WebSocket streams
 * for real-time ticker prices and kline (candlestick) data.
 *
 * Design: all connection state lives INSIDE useEffect via local variables.
 * This makes the hook React StrictMode-safe and network-resilient:
 *   - Safe cleanup guards against closing connecting WebSockets prematurely
 *   - Automatic backend REST fallback when Binance WebSocket is blocked by ISPs
 *
 * Streams:
 *   - Combined mini-ticker: wss://fstream.binance.com/stream?streams=btcusdt@miniTicker/...
 *   - Kline:                wss://fstream.binance.com/ws/<symbol>@kline_<interval>
 */

import { useEffect, useRef, useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BinanceMiniTicker {
  symbol: string;
  price: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  quoteVolume: number;
  priceChange: number;
  priceChangePct: number;
  eventTime: number;
}

export interface BinanceKline {
  symbol: string;
  interval: string;
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
  quoteVolume: number;
  isClosed: boolean;
}

export type WsConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

// ─── Constants ───────────────────────────────────────────────────────────────

const BINANCE_FUTURES_WS: string =
  (import.meta.env.VITE_BINANCE_WS_URL as string | undefined) || 'wss://fstream.binance.com';

const API_ORIGIN: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) || window.location.origin;

const MAX_RECONNECT_DELAY_MS = 30_000;
const RECONNECT_BASE_MS = 1_000;
const MAX_SESSION_MS = 23 * 60 * 60 * 1_000; // 23 hours
const WS_CONNECT_TIMEOUT_MS = 4_000;

/**
 * Safely closes a WebSocket connection without raising browser console warnings
 * when closing during the CONNECTING state (e.g. React StrictMode unmount).
 */
function safeCloseSocket(ws: WebSocket | null, reason = 'unmount') {
  if (!ws) return;
  const socket = ws;
  if (socket.readyState === WebSocket.CONNECTING) {
    socket.onopen = () => {
      try {
        socket.close(1000, reason);
      } catch {
        // ignore close errors
      }
    };
    socket.onerror = null;
    socket.onclose = null;
  } else if (socket.readyState === WebSocket.OPEN) {
    try {
      socket.close(1000, reason);
    } catch {
      // ignore close errors
    }
  }
}

// ─── Hook: Multi-symbol mini-ticker stream ────────────────────────────────────

interface UseTickerStreamOptions {
  symbols: string[];
  enabled?: boolean;
}

interface UseTickerStreamResult {
  tickers: Record<string, BinanceMiniTicker>;
  status: WsConnectionStatus;
}

export function useTickerStream({
  symbols,
  enabled = true,
}: UseTickerStreamOptions): UseTickerStreamResult {
  const [tickers, setTickers] = useState<Record<string, BinanceMiniTicker>>({});
  const [status, setStatus] = useState<WsConnectionStatus>('disconnected');

  // Stable refs so async closures always reference latest state setters
  const setTickersRef = useRef(setTickers);
  const setStatusRef  = useRef(setStatus);
  setTickersRef.current = setTickers;
  setStatusRef.current  = setStatus;

  const symbolKey = enabled ? symbols.join(',') : '';

  useEffect(() => {
    if (!enabled || symbols.length === 0) {
      setStatusRef.current('disconnected');
      return;
    }

    let destroyed = false;
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let sessionTimer: ReturnType<typeof setTimeout> | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let timeoutTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectAttempt = 0;

    const clearTimers = () => {
      if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
      if (sessionTimer)   { clearTimeout(sessionTimer);   sessionTimer = null;   }
      if (timeoutTimer)   { clearTimeout(timeoutTimer);   timeoutTimer = null;   }
      if (pollTimer)      { clearInterval(pollTimer);      pollTimer = null;      }
    };

    // ── Fallback Polling (when direct Binance WS is blocked) ─────────────────
    const fetchFallbackTickers = async () => {
      if (destroyed) return;
      try {
        const url = `${API_ORIGIN}/api/v1/market/tickers?symbols=${encodeURIComponent(symbols.join(','))}`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = (await res.json()) as BinanceMiniTicker[];
        if (destroyed || !Array.isArray(data)) return;

        const map: Record<string, BinanceMiniTicker> = {};
        for (const item of data) {
          if (item?.symbol) {
            map[item.symbol] = item;
          }
        }

        if (Object.keys(map).length > 0) {
          setTickersRef.current((prev) => ({ ...prev, ...map }));
          setStatusRef.current('connected');
        }
      } catch {
        // Fallback fetch fail silently
      }
    };

    const startFallbackPolling = () => {
      if (pollTimer || destroyed) return;
      fetchFallbackTickers();
      pollTimer = setInterval(fetchFallbackTickers, 3_000);
    };

    const stopFallbackPolling = () => {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    };

    // ── WebSocket Connection Logic ───────────────────────────────────────────
    const connect = () => {
      if (destroyed) return;

      const streamNames = symbols
        .map((s) => `${s.toLowerCase()}@miniTicker`)
        .join('/');
      const url = `${BINANCE_FUTURES_WS}/stream?streams=${streamNames}`;

      setStatusRef.current(reconnectAttempt === 0 ? 'connecting' : 'reconnecting');

      // Set connection timeout guard
      timeoutTimer = setTimeout(() => {
        if (!destroyed && ws?.readyState !== WebSocket.OPEN) {
          startFallbackPolling();
        }
      }, WS_CONNECT_TIMEOUT_MS);

      let socket: WebSocket;
      try {
        socket = new WebSocket(url);
        ws = socket;
      } catch {
        startFallbackPolling();
        return;
      }

      socket.onopen = () => {
        if (destroyed || socket !== ws) return;
        if (timeoutTimer) { clearTimeout(timeoutTimer); timeoutTimer = null; }
        reconnectAttempt = 0;
        stopFallbackPolling();
        setStatusRef.current('connected');

        sessionTimer = setTimeout(() => {
          safeCloseSocket(socket, 'session-renew');
        }, MAX_SESSION_MS);
      };

      socket.onmessage = (event: MessageEvent) => {
        if (destroyed || socket !== ws) return;
        try {
          const msg = JSON.parse(event.data as string) as Record<string, unknown>;

          if (msg?.e === 'ping' || msg?.ping) {
            socket.send(JSON.stringify({ pong: (msg.ping as number | undefined) ?? Date.now() }));
            return;
          }

          const data = (msg.data ?? msg) as Record<string, unknown>;

          if (data?.e === '24hrMiniTicker') {
            const symbol  = data.s as string;
            const price   = parseFloat(data.c as string);
            const open    = parseFloat(data.o as string);
            const high    = parseFloat(data.h as string);
            const low     = parseFloat(data.l as string);
            const volume  = parseFloat(data.v as string);
            const qVol    = parseFloat(data.q as string);
            const change  = price - open;
            const changePct = open !== 0 ? (change / open) * 100 : 0;

            setTickersRef.current((prev) => ({
              ...prev,
              [symbol]: {
                symbol,
                price,
                open,
                high,
                low,
                volume,
                quoteVolume: qVol,
                priceChange: change,
                priceChangePct: changePct,
                eventTime: data.E as number,
              },
            }));
          }
        } catch {
          // Ignore parse errors
        }
      };

      socket.onclose = (event) => {
        if (destroyed || socket !== ws) return;
        clearTimers();

        if (event.code === 1000 && event.reason === 'unmount') return;

        // WebSocket failed/closed → trigger backend fallback polling
        startFallbackPolling();

        setStatusRef.current('reconnecting');
        const delay = Math.min(RECONNECT_BASE_MS * Math.pow(2, reconnectAttempt), MAX_RECONNECT_DELAY_MS);
        reconnectAttempt += 1;
        reconnectTimer = setTimeout(connect, delay);
      };

      socket.onerror = () => {
        if (destroyed || socket !== ws) return;
        startFallbackPolling();
        safeCloseSocket(socket, 'error');
      };
    };

    connect();

    // ── Cleanup ────────────────────────────────────────────────────────────
    return () => {
      destroyed = true;
      clearTimers();
      if (ws) {
        safeCloseSocket(ws, 'unmount');
        ws = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolKey]);

  return { tickers, status };
}

// ─── Hook: Single-symbol kline stream ────────────────────────────────────────

export type KlineInterval =
  | '1m' | '3m' | '5m' | '15m' | '30m'
  | '1h' | '2h' | '4h' | '6h' | '8h' | '12h'
  | '1d' | '3d' | '1w' | '1M';

interface UseKlineStreamOptions {
  symbol: string;
  interval: KlineInterval;
  enabled?: boolean;
  onKline?: (kline: BinanceKline) => void;
  onClosedKline?: (kline: BinanceKline) => void;
}

interface UseKlineStreamResult {
  latestKline: BinanceKline | null;
  status: WsConnectionStatus;
}

export function useKlineStream({
  symbol,
  interval,
  enabled = true,
  onKline,
  onClosedKline,
}: UseKlineStreamOptions): UseKlineStreamResult {
  const [latestKline, setLatestKline] = useState<BinanceKline | null>(null);
  const [status, setStatus] = useState<WsConnectionStatus>('disconnected');

  const setLatestKlineRef = useRef(setLatestKline);
  const setStatusRef      = useRef(setStatus);
  const onKlineRef        = useRef(onKline);
  const onClosedKlineRef  = useRef(onClosedKline);

  setLatestKlineRef.current = setLatestKline;
  setStatusRef.current      = setStatus;
  onKlineRef.current        = onKline;
  onClosedKlineRef.current  = onClosedKline;

  useEffect(() => {
    if (!enabled || !symbol) {
      setStatusRef.current('disconnected');
      return;
    }

    let destroyed = false;
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let sessionTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectAttempt = 0;

    const clearTimers = () => {
      if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
      if (sessionTimer)   { clearTimeout(sessionTimer);   sessionTimer = null;   }
    };

    const connect = () => {
      if (destroyed) return;

      const url = `${BINANCE_FUTURES_WS}/ws/${symbol.toLowerCase()}@kline_${interval}`;
      setStatusRef.current(reconnectAttempt === 0 ? 'connecting' : 'reconnecting');

      let socket: WebSocket;
      try {
        socket = new WebSocket(url);
        ws = socket;
      } catch {
        return;
      }

      socket.onopen = () => {
        if (destroyed || socket !== ws) return;
        reconnectAttempt = 0;
        setStatusRef.current('connected');
        sessionTimer = setTimeout(() => {
          safeCloseSocket(socket, 'session-renew');
        }, MAX_SESSION_MS);
      };

      socket.onmessage = (event: MessageEvent) => {
        if (destroyed || socket !== ws) return;
        try {
          const msg = JSON.parse(event.data as string) as Record<string, unknown>;

          if (msg?.e === 'ping' || msg?.ping) {
            socket.send(JSON.stringify({ pong: (msg.ping as number | undefined) ?? Date.now() }));
            return;
          }

          if (msg?.e === 'kline') {
            const k = msg.k as Record<string, unknown>;
            const kline: BinanceKline = {
              symbol: msg.s as string,
              interval: k.i as string,
              openTime: k.t as number,
              open: parseFloat(k.o as string),
              high: parseFloat(k.h as string),
              low: parseFloat(k.l as string),
              close: parseFloat(k.c as string),
              volume: parseFloat(k.v as string),
              closeTime: k.T as number,
              quoteVolume: parseFloat(k.q as string),
              isClosed: k.x as boolean,
            };
            setLatestKlineRef.current(kline);
            onKlineRef.current?.(kline);
            if (kline.isClosed) {
              onClosedKlineRef.current?.(kline);
            }
          }
        } catch {
          // Ignore parse errors
        }
      };

      socket.onclose = (event) => {
        if (destroyed || socket !== ws) return;
        clearTimers();
        if (event.code === 1000 && event.reason === 'unmount') return;
        setStatusRef.current('reconnecting');
        const delay = Math.min(RECONNECT_BASE_MS * Math.pow(2, reconnectAttempt), MAX_RECONNECT_DELAY_MS);
        reconnectAttempt += 1;
        reconnectTimer = setTimeout(connect, delay);
      };

      socket.onerror = () => {
        if (destroyed || socket !== ws) return;
        safeCloseSocket(socket, 'error');
      };
    };

    connect();

    return () => {
      destroyed = true;
      clearTimers();
      if (ws) {
        safeCloseSocket(ws, 'unmount');
        ws = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, symbol, interval]);

  return { latestKline, status };
}

// ─── Utility ─────────────────────────────────────────────────────────────────

export function timeframeToKlineInterval(timeframe: string): KlineInterval {
  const map: Record<string, KlineInterval> = {
    M1: '1m', M5: '5m', M15: '15m', M30: '30m',
    H1: '1h', H4: '4h', D1: '1d',
  };
  return map[timeframe] ?? '1h';
}
