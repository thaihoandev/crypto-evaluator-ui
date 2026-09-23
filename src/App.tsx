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
import type {
  CreateTradeRequest,
  EvaluateTradeResponse,
  TradeResponse,
  CloseTradeRequest,
  TradeDirection,
  Timeframe,
  ProposedTradeSetupDto
} from './types/trade';

import { createTrade, evaluateTrade, getTrades, closeTrade, getTicker } from './api/tradeApi';
import { Zap, AlertCircle, BarChart2 } from 'lucide-react';

const TOP_TICKERS = [
  { symbol: 'BTCUSDT', name: 'BTC/USDT' },
  { symbol: 'ETHUSDT', name: 'ETH/USDT' },
  { symbol: 'SOLUSDT', name: 'SOL/USDT' },
  { symbol: 'BNBUSDT', name: 'BNB/USDT' },
  { symbol: 'XRPUSDT', name: 'XRP/USDT' },
  { symbol: 'NEARUSDT', name: 'NEAR/USDT' }
];

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

  const [tickerPrices, setTickerPrices] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load trade journal on mount and poll top tickers every 4s
  useEffect(() => {
    loadTradeJournal();
    pollTickers();

    const tickerInterval = setInterval(() => {
      pollTickers();
    }, 4000);

    return () => clearInterval(tickerInterval);
  }, []);

  const pollTickers = async () => {
    for (const t of TOP_TICKERS) {
      try {
        const data = await getTicker(t.symbol);
        if (data && data.price > 0) {
          setTickerPrices((prev) => ({ ...prev, [t.symbol]: data.price }));
        }
      } catch {
        // Silent catch for background ticker refresh
      }
    }
  };

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

    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar with Workspace Tabs */}
      <Navbar
        apiStatus={apiStatus}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        journalCount={tradeJournal.length}
      />

      {/* Top Ticker Marquee */}
      <div className="ticker-bar">
        <span style={{ color: '#64748b', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase' }}>
          LIVE FUTURES TICKERS:
        </span>
        {TOP_TICKERS.map((t) => {
          const livePrice = tickerPrices[t.symbol];
          return (
            <motion.div
              key={t.symbol}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="ticker-item"
              onClick={() => {
                setActiveSymbol(t.symbol);
                if (livePrice && livePrice > 0) {
                  setActiveEntryPrice(livePrice);
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <span style={{ fontWeight: 800, color: '#f8fafc' }}>{t.name}</span>
              {livePrice ? (
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#06b6d4', fontFamily: 'JetBrains Mono, monospace' }}>
                  ${livePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </span>
              ) : (
                <span style={{ fontSize: '0.7rem', color: '#06b6d4' }}>● Live</span>
              )}
            </motion.div>
          );
        })}
      </div>

      <main className="container" style={{ flex: 1, paddingTop: '1.25rem' }}>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#fca5a5',
              padding: '1rem',
              borderRadius: '10px',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '0.875rem'
            }}
          >
            <AlertCircle size={20} color="#f43f5e" />
            <div>
              <strong>Evaluation Error:</strong> {errorMessage}
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
              style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '1.25rem' }}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Candlestick Chart with Future Trajectory Corridor */}
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
                  <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.25rem' }}>
                    <TradeScoreCard score={evaluation.score} explanation={evaluation.explanation} />
                    <MonteCarloWidget prediction={evaluation.prediction} />
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="card"
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '220px', textAlign: 'center' }}
                  >
                    <div style={{ background: 'rgba(6, 182, 212, 0.1)', padding: '1rem', borderRadius: '50%', marginBottom: '0.85rem' }}>
                      <Zap size={32} color="#06b6d4" />
                    </div>
                    <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.35rem' }}>
                      Ready to Evaluate Trade Setup
                    </h3>
                    <p style={{ color: '#94a3b8', maxWidth: '440px', fontSize: '0.85rem', lineHeight: 1.5 }}>
                      Select a Crypto pair using the Search Dropdown on the left or fetch live market price. Click <strong>EVALUATE TRADE SETUP</strong> to trigger quantitative score engine and draw future trajectory corridors.
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Top Summary Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <MarketSnapshotCard snapshot={evaluation.snapshot} symbol={activeSymbol} />
                    <RiskWarningsPanel warnings={evaluation.warnings} />
                  </div>

                  {/* Score Rule Inspector Accordion */}
                  <ScoreRuleInspector components={evaluation.components} totalScore={evaluation.score} />

                  {/* Score Breakdown Progress Bars */}
                  <ScoreBreakdown components={evaluation.components} />
                </div>
              ) : (
                <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                  <BarChart2 size={40} color="#06b6d4" style={{ marginBottom: '1rem' }} />
                  <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                    No Evaluation Selected
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
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

      <footer style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', padding: '1.25rem', textAlign: 'center', fontSize: '0.78rem', color: '#64748b', marginTop: '2rem' }}>
        Crypto Trade Evaluator &copy; 2026. ASP.NET Core Clean Architecture & Vite React Trading Terminal.
      </footer>
    </div>
  );
}

export default App;
