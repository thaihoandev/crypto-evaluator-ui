import type {
  CreateTradeRequest,
  TradeResponse,
  EvaluateTradeResponse,
  TradePredictionDto,
  CloseTradeRequest,
  TradeDirection,
  TradeStatus,
  MarketTickerDto,
  CryptoSymbolDto,
  PredictionBacktestReportDto,
  MarketAnalysisResponseDto,
  Timeframe
} from '../types/trade';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/v1/trades`;


export async function createTrade(request: CreateTradeRequest): Promise<TradeResponse> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create trade setup.');
  }
  return res.json();
}

export async function getTrade(id: string): Promise<TradeResponse> {
  const res = await fetch(`${API_BASE}/${id}`);
  if (!res.ok) {
    throw new Error(`Trade with ID '${id}' not found.`);
  }
  return res.json();
}

export async function getTrades(params?: {
  userId?: string;
  symbol?: string;
  direction?: TradeDirection;
  status?: TradeStatus;
  minScore?: number;
  maxScore?: number;
}): Promise<TradeResponse[]> {
  const url = new URL(window.location.origin + API_BASE);
  if (params) {
    if (params.userId) url.searchParams.set('userId', params.userId);
    if (params.symbol) url.searchParams.set('symbol', params.symbol);
    if (params.direction) url.searchParams.set('direction', params.direction);
    if (params.status) url.searchParams.set('status', params.status);
    if (params.minScore !== undefined) url.searchParams.set('minScore', params.minScore.toString());
    if (params.maxScore !== undefined) url.searchParams.set('maxScore', params.maxScore.toString());
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error('Failed to fetch trades journal.');
  }
  return res.json();
}

export async function evaluateTrade(id: string, randomSeed?: number): Promise<EvaluateTradeResponse> {
  const res = await fetch(`${API_BASE}/${id}/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ randomSeed })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to evaluate trade setup.');
  }
  return res.json();
}

export async function closeTrade(id: string, request: CloseTradeRequest): Promise<TradeResponse> {
  const res = await fetch(`${API_BASE}/${id}/close`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to close trade.');
  }
  return res.json();
}

export async function getPrediction(id: string): Promise<TradePredictionDto> {
  const res = await fetch(`${API_BASE}/${id}/prediction`);
  if (!res.ok) {
    throw new Error('No prediction recorded for this trade.');
  }
  return res.json();
}

export async function getTicker(symbol: string): Promise<MarketTickerDto> {
  const res = await fetch(`${API_BASE}/ticker/${symbol}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch ticker for ${symbol}`);
  }
  return res.json();
}

export async function getSymbols(): Promise<CryptoSymbolDto[]> {
  const res = await fetch(`${API_BASE}/symbols`);
  if (!res.ok) {
    throw new Error('Failed to fetch crypto symbols');
  }
  return res.json();
}

export async function getPredictionBacktest(from?: string, to?: string): Promise<PredictionBacktestReportDto> {
  const url = new URL(window.location.origin + `${API_BASE}/predictions/backtest`);
  if (from) url.searchParams.set('from', from);
  if (to) url.searchParams.set('to', to);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch prediction backtest report.');
  }
  return res.json();
}

export async function analyzeMarket(symbol: string, timeframe: Timeframe = 'H1'): Promise<MarketAnalysisResponseDto> {
  const url = new URL(window.location.origin + `${API_BASE}/analyze/${encodeURIComponent(symbol)}`);
  url.searchParams.set('timeframe', timeframe);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to analyze market for ${symbol}`);
  }
  return res.json();
}

