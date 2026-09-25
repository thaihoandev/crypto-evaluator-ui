/**
 * useCoinDetailStream
 *
 * Custom React hook for streaming comprehensive real-time market data for a single selected coin:
 *   - 24h Ticker (Price, High, Low, Volume, 24h Change %)
 *   - Mark Price, Index Price, Funding Rate & Next Funding Time
 *   - Book Ticker (Best Bid / Best Ask prices & quantities)
 *   - Order Book / Depth (Top 10 Bids and Asks)
 *   - Candlestick / Kline updates
 *
 * Features:
 *   - Single persistent WebSocket connection to Binance Futures (`wss://fstream.binance.com/ws`)
 *   - Dynamic SUBSCRIBE / UNSUBSCRIBE messages sent over WS on symbol or interval changes
 *   - React StrictMode safe with zero memory leaks
 */

import { useEffect, useRef, useState } from 'react';
import {
  type BinanceKline,
  type KlineInterval,
  type WsConnectionStatus,
} from './useBinanceWebSocket';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CoinDetailTicker {
  symbol: string;
  price: number;
  priceChange: number;
  priceChangePct: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  quoteVolume24h: number;
  eventTime: number;
}

export interface CoinMarkPriceInfo {
  symbol: string;
  markPrice: number;
  indexPrice: number;
  fundingRate: number; // e.g. 0.0001 (0.01%)
  nextFundingTime: number;
}

export interface CoinBookTicker {
  symbol: string;
  bestBidPrice: number;
  bestBidQty: number;
  bestAskPrice: number;
  bestAskQty: number;
}

export interface OrderBookLevel {
  price: number;
  qty: number;
}

export interface CoinOrderBook {
  symbol: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
}

export interface UseCoinDetailStreamOptions {
  symbol: string;
  interval?: KlineInterval;
  enabled?: boolean;
}

export interface UseCoinDetailStreamResult {
  ticker: CoinDetailTicker | null;
  markPrice: CoinMarkPriceInfo | null;
  bookTicker: CoinBookTicker | null;
  orderBook: CoinOrderBook | null;
  latestKline: BinanceKline | null;
  status: WsConnectionStatus;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const BINANCE_FUTURES_WS_BASE =
  (import.meta.env.VITE_BINANCE_WS_URL as string | undefined) || 'wss://fstream.binance.com';

const RECONNECT_BASE_MS = 1_000;
const MAX_RECONNECT_DELAY_MS = 30_000;

function safeCloseSocket(ws: WebSocket | null, reason = 'unmount') {
  if (!ws) return;
  const socket = ws;
  if (socket.readyState === WebSocket.CONNECTING) {
    socket.onopen = () => {
      try { socket.close(1000, reason); } catch {}
    };
    socket.onerror = null;
    socket.onclose = null;
  } else if (socket.readyState === WebSocket.OPEN) {
    try { socket.close(1000, reason); } catch {}
  }
}

// ─── Hook Definition ──────────────────────────────────────────────────────────

export function useCoinDetailStream({
  symbol,
  interval = '1h',
  enabled = true,
}: UseCoinDetailStreamOptions): UseCoinDetailStreamResult {
  const [ticker, setTicker] = useState<CoinDetailTicker | null>(null);
  const [markPrice, setMarkPrice] = useState<CoinMarkPriceInfo | null>(null);
  const [bookTicker, setBookTicker] = useState<CoinBookTicker | null>(null);
  const [orderBook, setOrderBook] = useState<CoinOrderBook | null>(null);
  const [latestKline, setLatestKline] = useState<BinanceKline | null>(null);
  const [status, setStatus] = useState<WsConnectionStatus>('disconnected');

  // Stable refs for state setters
  const setTickerRef = useRef(setTicker);
  const setMarkPriceRef = useRef(setMarkPrice);
  const setBookTickerRef = useRef(setBookTicker);
  const setOrderBookRef = useRef(setOrderBook);
  const setLatestKlineRef = useRef(setLatestKline);
  const setStatusRef = useRef(setStatus);

  setTickerRef.current = setTicker;
  setMarkPriceRef.current = setMarkPrice;
  setBookTickerRef.current = setBookTicker;
  setOrderBookRef.current = setOrderBook;
  setLatestKlineRef.current = setLatestKline;
  setStatusRef.current = setStatus;

  const currentSymbol = symbol.trim().toLowerCase();

  useEffect(() => {
    if (!enabled || !currentSymbol) {
      setStatusRef.current('disconnected');
      return;
    }

    // Reset previous coin state when switching symbols
    setTicker(null);
    setMarkPrice(null);
    setBookTicker(null);
    setOrderBook(null);
    setLatestKline(null);

    let destroyed = false;
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectAttempt = 0;
    let requestId = 1;

    const streams = [
      `${currentSymbol}@ticker`,
      `${currentSymbol}@markPrice@1s`,
      `${currentSymbol}@bookTicker`,
      `${currentSymbol}@depth10@100ms`,
      `${currentSymbol}@kline_${interval}`,
    ];

    const clearTimers = () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    const sendSubscription = (socket: WebSocket, method: 'SUBSCRIBE' | 'UNSUBSCRIBE') => {
      if (socket.readyState === WebSocket.OPEN) {
        try {
          socket.send(
            JSON.stringify({
              method,
              params: streams,
              id: requestId++,
            })
          );
        } catch {
          // ignore send error
        }
      }
    };

    const connect = () => {
      if (destroyed) return;

      const wsUrl = `${BINANCE_FUTURES_WS_BASE}/ws`;
      setStatusRef.current(reconnectAttempt === 0 ? 'connecting' : 'reconnecting');

      let socket: WebSocket;
      try {
        socket = new WebSocket(wsUrl);
        ws = socket;
      } catch {
        return;
      }

      socket.onopen = () => {
        if (destroyed || socket !== ws) return;
        reconnectAttempt = 0;
        setStatusRef.current('connected');

        // Dynamically subscribe to streams for active coin
        sendSubscription(socket, 'SUBSCRIBE');
      };

      socket.onmessage = (event: MessageEvent) => {
        if (destroyed || socket !== ws) return;
        try {
          const msg = JSON.parse(event.data as string) as Record<string, unknown>;

          // Handle ping frames
          if (msg?.e === 'ping' || msg?.ping) {
            socket.send(JSON.stringify({ pong: (msg.ping as number | undefined) ?? Date.now() }));
            return;
          }

          const eventType = msg.e as string | undefined;

          // 1. 24hr Ticker Update
          if (eventType === '24hrTicker') {
            const sym = (msg.s as string).toUpperCase();
            const price = parseFloat(msg.c as string);
            const priceChange = parseFloat(msg.p as string);
            const priceChangePct = parseFloat(msg.P as string);
            const high24h = parseFloat(msg.h as string);
            const low24h = parseFloat(msg.l as string);
            const volume24h = parseFloat(msg.v as string);
            const quoteVolume24h = parseFloat(msg.q as string);
            const eventTime = msg.E as number;

            setTickerRef.current({
              symbol: sym,
              price,
              priceChange,
              priceChangePct,
              high24h,
              low24h,
              volume24h,
              quoteVolume24h,
              eventTime,
            });
          }

          // 2. Mark Price & Funding Rate Update
          else if (eventType === 'markPriceUpdate') {
            const sym = (msg.s as string).toUpperCase();
            const markP = parseFloat(msg.p as string);
            const indexP = parseFloat(msg.i as string);
            const fundingR = parseFloat(msg.r as string);
            const nextFundingT = msg.T as number;

            setMarkPriceRef.current({
              symbol: sym,
              markPrice: markP,
              indexPrice: indexP,
              fundingRate: fundingR,
              nextFundingTime: nextFundingT,
            });
          }

          // 3. Book Ticker Update (Best Bid / Best Ask)
          else if (eventType === 'bookTicker') {
            const sym = (msg.s as string).toUpperCase();
            const bestBidPrice = parseFloat(msg.b as string);
            const bestBidQty = parseFloat(msg.B as string);
            const bestAskPrice = parseFloat(msg.a as string);
            const bestAskQty = parseFloat(msg.A as string);

            setBookTickerRef.current({
              symbol: sym,
              bestBidPrice,
              bestBidQty,
              bestAskPrice,
              bestAskQty,
            });
          }

          // 4. Order Book Depth Update (Partial Depth 10)
          else if (msg.bids || msg.asks || eventType === 'depthUpdate') {
            const rawBids = (msg.bids || msg.b) as string[][];
            const rawAsks = (msg.asks || msg.a) as string[][];

            if (Array.isArray(rawBids) && Array.isArray(rawAsks)) {
              const bids: OrderBookLevel[] = rawBids.map(([p, q]) => ({
                price: parseFloat(p),
                qty: parseFloat(q),
              }));

              const asks: OrderBookLevel[] = rawAsks.map(([p, q]) => ({
                price: parseFloat(p),
                qty: parseFloat(q),
              }));

              setOrderBookRef.current({
                symbol: currentSymbol.toUpperCase(),
                bids,
                asks,
              });
            }
          }

          // 5. Kline Update
          else if (eventType === 'kline') {
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
          }
        } catch {
          // Ignore JSON parse errors
        }
      };

      socket.onclose = (event) => {
        if (destroyed || socket !== ws) return;
        clearTimers();
        if (event.code === 1000 && event.reason === 'unmount') return;

        setStatusRef.current('reconnecting');
        const delay = Math.min(
          RECONNECT_BASE_MS * Math.pow(2, reconnectAttempt),
          MAX_RECONNECT_DELAY_MS
        );
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
        sendSubscription(ws, 'UNSUBSCRIBE');
        safeCloseSocket(ws, 'unmount');
        ws = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSymbol, interval, enabled]);

  return {
    ticker,
    markPrice,
    bookTicker,
    orderBook,
    latestKline,
    status,
  };
}
