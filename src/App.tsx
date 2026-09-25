import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Navbar, type WorkspaceTab } from './components/Navbar';
import { TradeForm } from './components/TradeForm';
import { TradeScoreCard } from './components/TradeScoreCard';
import { ScoreBreakdown } from './components/ScoreBreakdown';
import { ScoreRuleInspector } from './components/ScoreRuleInspector';
import { CandlestickChart } from './components/CandlestickChart';
import { MonteCarloWidget } from './components/MonteCarloWidget';
import { MarketSnapshotCard } from './components/MarketSnapshotCard';
import { RiskWarningsPanel } from './components/RiskWarningsPanel';
import { TradeJournalTable } from './components/TradeJournalTable';
import { PredictionBacktestView } from './components/PredictionBacktestView';
import { MarketAnalyzerWidget } from './components/MarketAnalyzerWidget';
import { CryptoRealtimeMarketHub } from './components/CryptoRealtimeMarketHub';
import type {
  CreateTradeRequest,
  EvaluateTradeResponse,
  TradeResponse,
  CloseTradeRequest,
  TradeDirection,
  Timeframe,
  ProposedTradeSetupDto
} from './types/trade';
import { useBinanceStream } from './context/BinanceStreamContext';
import { formatDynamicPrice } from './utils/formatters';

import { createTrade, evaluateTrade, getTrades, closeTrade } from './api/tradeApi';
import { Zap, AlertCircle, BarChart2, Wifi, WifiOff, Radio } from 'lucide-react';

const TOP_TICKERS = [
  { symbol: 'BTCUSDT', name: 'BTC/USDT' },
  { symbol: 'ETHUSDT', name: 'ETH/USDT' },
  { symbol: 'SOLUSDT', name: 'SOL/USDT' },
  { symbol: 'BNBUSDT', name: 'BNB/USDT' },
  { symbol: 'XRPUSDT', name: 'XRP/USDT' },
  { symbol: 'NEARUSDT', name: 'NEAR/USDT' }
];

/** Map WS status → color + label for the status dot in the ticker bar */
const WS_STATUS_UI = {
  connected:    { color: '#10b981', pulse: true,  label: 'LIVE',         icon: Radio },
  connecting:   { color: '#f59e0b', pulse: true,  label: 'CONNECTING',   icon: Wifi },
  reconnecting: { color: '#f59e0b', pulse: true,  label: 'RECONNECTING', icon: Wifi },
  disconnected: { color: '#f43f5e', pulse: false, label: 'DISCONNECTED', icon: WifiOff },
} as const;

export function App() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('terminal');
  const [apiStatus, setApiStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [evaluation, setEvaluation] = useState<EvaluateTradeResponse | null>(null);
  const [tradeJournal, setTradeJournal] = useState<TradeResponse[]>([]);

  // Current active trade parameters for CandlestickChart mapping
  const [activeSymbol, setActiveSymbol] = useState<string>('BTCUSDT');
  const [activeDirection, setActiveDirection] = useState<TradeDirection>('Long');
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>('H1');
  const [activeEntryPrice, setActiveEntryPrice] = useState<number>(104500);
  const [activeStopLoss, setActiveStopLoss] = useState<number>(102500);
  const [activeTakeProfit, setActiveTakeProfit] = useState<number>(108500);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ── Real-time Binance WebSocket ticker data ──────────────────────────────
  // Replaces polling: data now streams directly from Binance Futures WS
  const { tickers: wsTickers, wsStatus, getPrice } = useBinanceStream();

  // Load trade journal on mount (no more ticker polling needed)
  useEffect(() => {
    loadTradeJournal();
  }, []);

  const loadTradeJournal = async () => {
    try {
      setApiStatus('checking');
      const data = await getTrades();
      setTradeJournal(data);
      setApiStatus('online');
    } catch {
      setApiStatus('offline');
    }
  };

  const triggerCelebration = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleEvaluateSetup = async (request: CreateTradeRequest) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      setActiveSymbol(request.symbol);
      setActiveDirection(request.direction);
      setActiveTimeframe(request.timeframe);
      setActiveEntryPrice(request.entryPrice);
      setActiveStopLoss(request.stopLoss);
      setActiveTakeProfit(request.takeProfit);

      // 1. Create Trade
      const createdTrade = await createTrade(request);

      // 2. Evaluate Trade (Fetches candles, computes indicators, risk, score & Monte Carlo prediction)
      const evalResult = await evaluateTrade(createdTrade.id);
      setEvaluation(evalResult);

      // Trigger celebration confetti if score is high (>= 75)
      if (evalResult.score >= 75) {
        triggerCelebration();
      }

      // 3. Refresh Journal
      await loadTradeJournal();
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during evaluation.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseTrade = async (id: string, request: CloseTradeRequest) => {
    await closeTrade(id, request);
    await loadTradeJournal();
  };

  const handleReEvaluateTrade = async (id: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const selected = tradeJournal.find((t) => t.id === id);
      if (selected) {
        setActiveSymbol(selected.symbol);
        setActiveDirection(selected.direction);
        setActiveTimeframe(selected.timeframe);
        setActiveEntryPrice(selected.entryPrice);
        setActiveStopLoss(selected.stopLoss);
        setActiveTakeProfit(selected.takeProfit);
      }

      const evalResult = await evaluateTrade(id);
      setEvaluation(evalResult);
      if (evalResult.score >= 75) {
        triggerCelebration();
      }
      setActiveTab('terminal');
      await loadTradeJournal();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to re-evaluate trade.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyProposedSetup = async (
    setup: ProposedTradeSetupDto,
    symbol: string,
    timeframe: Timeframe
  ) => {
    setActiveSymbol(symbol);
    setActiveDirection(setup.direction);
    setActiveTimeframe(timeframe);
    setActiveEntryPrice(setup.entryPrice);
    setActiveStopLoss(setup.stopLoss);
    setActiveTakeProfit(setup.takeProfit);

    setActiveTab('terminal');

    // Automatically evaluate the setup on the trading desk
    handleEvaluateSetup({
      symbol,
      direction: setup.direction,
      timeframe,
      entryPrice: setup.entryPrice,
      stopLoss: setup.stopLoss,
      takeProfit: setup.takeProfit,
      accountBalance: 10000,
      riskPercent: 1.0,
      leverage: 10
    });
  };

  return (

    <div className="min-h-screen flex flex-col bg-[#07090e] text-slate-100 font-sans">
      {/* Top Navbar with Workspace Tabs */}
      <Navbar
        apiStatus={apiStatus}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        journalCount={tradeJournal.length}
      />

      {/* Top Ticker Marquee — powered by Binance WS stream */}
      <div className="flex items-center gap-3 bg-slate-950/90 border-b border-slate-800/80 px-4 py-2 text-xs overflow-x-auto shrink-0 shadow-inner">
        {/* WS Status indicator */}
        {(() => {
          const ui = WS_STATUS_UI[wsStatus];
          const StatusIcon = ui.icon;
          return (
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full ${ui.pulse ? 'animate-pulse' : ''}`}
                style={{ backgroundColor: ui.color }}
              />
              <StatusIcon size={11} style={{ color: ui.color }} />
              <span className="font-extrabold text-slate-400 uppercase tracking-wider text-[10px]">
                {ui.label} FUTURES:
              </span>
            </div>
          );
        })()}

        {TOP_TICKERS.map((t) => {
          const ticker = wsTickers[t.symbol];
          const livePrice = ticker?.price ?? getPrice(t.symbol);
          const changePct = ticker?.priceChangePct ?? null;
          const isPositive = changePct !== null && changePct >= 0;
          return (
            <motion.div
              key={t.symbol}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-2 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/50 px-2.5 py-1 rounded-full whitespace-nowrap cursor-pointer transition-all shrink-0"
              onClick={() => {
                setActiveSymbol(t.symbol);
                if (livePrice && livePrice > 0) {
                  setActiveEntryPrice(livePrice);
                }
              }}
            >
              <span className="font-extrabold text-slate-200 text-xs">{t.name}</span>
              {livePrice ? (
                <>
                  <span className="text-xs font-bold text-cyan-400 font-mono">
                    ${formatDynamicPrice(livePrice)}
                  </span>
                  {changePct !== null && (
                    <span
                      className="text-[10px] font-bold font-mono"
                      style={{ color: isPositive ? '#10b981' : '#f43f5e' }}
                    >
                      {isPositive ? '+' : ''}{changePct.toFixed(2)}%
                    </span>
                  )}
                </>
              ) : (
                <span className="text-[11px] font-semibold text-cyan-400 animate-pulse">● Connecting</span>
              )}
            </motion.div>
          );
        })}
      </div>

      <main className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 space-y-6">
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-xl mb-5 flex items-center gap-3 text-xs sm:text-sm font-semibold"
          >
            <AlertCircle size={20} className="text-rose-400 shrink-0" />
            <div>
              <strong className="text-rose-200 font-bold">Evaluation Error:</strong> {errorMessage}
            </div>
          </motion.div>
        )}

        {/* Tab Page Transition Container */}
        <AnimatePresence mode="wait">
          {/* ── TAB 1: TRADING DESK & CANDLESTICK CHART ── */}
          {activeTab === 'terminal' && (
            <motion.div
              key="terminal-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 lg:grid-cols-[380px_1fr] xl:grid-cols-[400px_1fr] gap-5"
            >
              {/* Left Column: Trade Setup Form */}
              <div>
                <TradeForm
                  onSubmit={handleEvaluateSetup}
                  isLoading={isLoading}
                  activeSymbol={activeSymbol}
                  activeDirection={activeDirection}
                  activeTimeframe={activeTimeframe}
                  activeEntryPrice={activeEntryPrice}
                  activeStopLoss={activeStopLoss}
                  activeTakeProfit={activeTakeProfit}
                />
              </div>

              {/* Right Column: Chart & Score Overview */}
              <div className="flex flex-col gap-5 min-w-0">
                {/* Unified Real-Time Market Hub (Coin Selector + Standalone WS Candlestick Chart + Depth & Order Book Details) */}
                <CryptoRealtimeMarketHub
                  initialSymbol={activeSymbol}
                  initialTimeframe={activeTimeframe}
                  onSymbolChange={(sym) => setActiveSymbol(sym)}
                />

                {/* Quantitative Trade Setup Trajectory Corridor (if evaluated) */}
                <CandlestickChart
                  symbol={activeSymbol}
                  direction={activeDirection}
                  timeframe={activeTimeframe}
                  entryPrice={activeEntryPrice}
                  stopLoss={activeStopLoss}
                  takeProfit={activeTakeProfit}
                  snapshot={evaluation?.snapshot}
                  candles={evaluation?.candles}
                  prediction={evaluation?.prediction}
                />

                {/* Evaluation Quick Summary Row (if evaluated) */}
                {evaluation ? (
                  <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
                    <TradeScoreCard score={evaluation.score} explanation={evaluation.explanation} />
                    <MonteCarloWidget prediction={evaluation.prediction} />
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 shadow-2xl rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center min-h-[220px] text-center space-y-3"
                  >
                    <div className="bg-cyan-500/10 p-4 rounded-full border border-cyan-500/30">
                      <Zap size={32} className="text-cyan-400" />
                    </div>
                    <h3 className="font-extrabold text-lg sm:text-xl text-slate-100">
                      Ready to Evaluate Trade Setup
                    </h3>
                    <p className="text-slate-400 max-w-md text-xs sm:text-sm leading-relaxed">
                      Select a Crypto pair using the Search Dropdown on the left or fetch live market price. Click <strong className="text-slate-200">EVALUATE TRADE SETUP</strong> to trigger quantitative score engine and draw future trajectory corridors.
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── TAB: AI MARKET ANALYZER & SETUP FINDER ── */}
          {activeTab === 'analyzer' && (
            <motion.div
              key="analyzer-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <MarketAnalyzerWidget
                onApplySetup={handleApplyProposedSetup}
                initialSymbol={activeSymbol}
                initialTimeframe={activeTimeframe}
              />
            </motion.div>
          )}

          {/* ── TAB 2: SCORE & RULE INSPECTOR ── */}
          {activeTab === 'inspector' && (
            <motion.div
              key="inspector-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              {evaluation ? (
                <div className="flex flex-col gap-5">
                  {/* Top Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <MarketSnapshotCard snapshot={evaluation.snapshot} symbol={activeSymbol} />
                    <RiskWarningsPanel warnings={evaluation.warnings} />
                  </div>

                  {/* Score Rule Inspector Accordion */}
                  <ScoreRuleInspector components={evaluation.components} totalScore={evaluation.score} />

                  {/* Score Breakdown Progress Bars */}
                  <ScoreBreakdown components={evaluation.components} />
                </div>
              ) : (
                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3">
                  <BarChart2 size={40} className="text-cyan-400 mb-2" />
                  <h3 className="font-extrabold text-lg sm:text-xl text-slate-100">
                    No Evaluation Selected
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm max-w-md leading-relaxed">
                    Evaluate a trade setup on the Trading Desk tab first to inspect rule rationales and score breakdown.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* ── TAB 3: PREDICTION BACKTEST ── */}
          {activeTab === 'backtest' && (
            <motion.div
              key="backtest-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <PredictionBacktestView />
            </motion.div>
          )}

          {/* ── TAB 4: TRADE JOURNAL & HISTORY ── */}
          {activeTab === 'journal' && (
            <motion.div
              key="journal-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <TradeJournalTable
                trades={tradeJournal}
                onCloseTrade={handleCloseTrade}
                onSelectTrade={handleReEvaluateTrade}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-400 mt-8 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-[1600px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-2 font-medium">
          <span>Crypto Trade Evaluator &copy; 2026. Developed by</span>
          <a
            href="https://github.com/thaihoandev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 font-extrabold transition-colors inline-flex items-center gap-1.5 hover:underline"
          >
            <span className="bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[11px] font-mono px-2 py-0.5 rounded-full">
              @thaihoandev
            </span>
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;

