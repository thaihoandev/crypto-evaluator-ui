export type TradeDirection = 'Long' | 'Short';
export type Timeframe = 'M1' | 'M5' | 'M15' | 'M30' | 'H1' | 'H4' | 'D1';
export type TradeStatus = 'Planned' | 'Open' | 'Closed' | 'Cancelled';
export type ScoreCategory =
  | 'Trend'
  | 'Entry'
  | 'Momentum'
  | 'Volume'
  | 'SupportResistance'
  | 'RiskReward'
  | 'Volatility'
  | 'MarketContext';

export type WarningSeverity = 'Info' | 'Warning' | 'Critical';

export interface CreateTradeRequest {
  userId?: string;
  symbol: string;
  direction: TradeDirection;
  timeframe: Timeframe;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  accountBalance: number;
  riskPercent: number;
  leverage: number;
}

export interface TradeResponse {
  id: string;
  userId: string;
  symbol: string;
  direction: TradeDirection;
  timeframe: Timeframe;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  accountBalance: number;
  riskPercent: number;
  leverage: number;
  status: TradeStatus;
  createdAt: string;
  closedAt?: string;
  latestScore?: number;
}

export interface ScoreComponent {
  category: ScoreCategory;
  score: number;
  weight: number;
  explanation: string;
  suggestedAction: string;
}

export interface MarketSnapshotDto {
  currentPrice: number;
  ema20: number;
  ema50: number;
  ema200: number;
  rsi: number;
  atr: number;
  volumeRatio: number;
}

export interface CandleDto {
  openTime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TrajectoryPointDto {
  step: number;
  price: number;
  upperBound: number;
  lowerBound: number;
  timestamp: string;
  expectedOpen?: number;
  expectedHigh?: number;
  expectedLow?: number;
  expectedClose?: number;
  cumulativeTpHitProb?: number;
  cumulativeSlHitProb?: number;
}

export interface ScenarioPathDto {
  name: string; // "Bear" | "Base" | "Bull"
  points: TrajectoryPointDto[];
}

export interface PredictionDataQualityDto {
  isSufficient: boolean;
  closedCandleCount: number;
  lastClosedCandleTime: string;
  dataAgeSeconds: number;
  isStale: boolean;
  source: string;
}

export interface PredictionConfidenceDto {
  score: number;          // 0-100
  level: 'High' | 'Medium' | 'Low';
  factors: string[];
}

export interface TradePredictionDto {
  winProbability: number;
  lossProbability: number;
  noHitProbability: number;
  expectedRMultiple: number;
  method: string;
  simulatedPaths?: number;
  sampleSize?: number;
  randomSeed?: number;
  disclaimer: string;
  trajectoryPoints?: TrajectoryPointDto[];
  scenarioPaths?: ScenarioPathDto[];
  dataQuality?: PredictionDataQualityDto;
  confidence?: PredictionConfidenceDto;
}

export interface TradeWarning {
  code: string;
  message: string;
  severity: WarningSeverity;
}

export interface EvaluateTradeResponse {
  tradeId: string;
  evaluationId: string;
  version: number;
  score: number;
  riskRewardRatio: number;
  riskAmount: number;
  positionSize: number;
  marginRequired: number;
  components: ScoreComponent[];
  snapshot: MarketSnapshotDto;
  prediction: TradePredictionDto;
  warnings: TradeWarning[];
  explanation: string;
  candles?: CandleDto[];
}

export interface CloseTradeRequest {
  exitPrice: number;
  exitReason?: string;
  notes?: string;
}

export interface MarketTickerDto {
  symbol: string;
  price: number;
  timestamp: string;
}

export interface CryptoSymbolDto {
  symbol: string;
  name: string;
}

// ── Prediction Backtest Report ────────────────────────────────────────────────
export interface CalibrationBucketDto {
  range: string;                      // e.g. "0-20%"
  sampleSize: number;
  averagePredictedWinProbability: number;
  actualWinRate: number;
}

export interface PredictionBacktestReportDto {
  resolvedPredictions: number;
  averagePredictedWinProbability: number;
  actualWinRate: number;
  brierScore: number;                 // lower = better calibrated (0 = perfect)
  meanAbsoluteProbabilityError: number;
  averageExpectedRMultiple: number;
  averageRealizedRMultiple: number;
  calibration: CalibrationBucketDto[];
}
