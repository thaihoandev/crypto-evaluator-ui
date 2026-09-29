# HAWK Pulse — Crypto Trade Evaluator · Frontend UI

> A professional-grade, real-time crypto trading desk built with React 19, TypeScript, and Tailwind CSS v4.

---

## Overview

**HAWK Pulse** is the frontend interface for the Crypto Trade Evaluator platform. It connects directly to Binance Futures WebSocket streams for live market data and communicates with a .NET backend API to perform quantitative trade evaluation, Monte Carlo prediction, and AI-powered market analysis.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript 6 |
| Build Tool | Vite 8 |
| Styling | Tailwind CSS v4 (via `@tailwindcss/vite`) |
| Animation | Framer Motion 13 |
| Icons | Lucide React |
| Confetti | canvas-confetti |
| Linting | OxLint |

---

## Features

### 🖥️ Trading Desk (Terminal Tab)
- Input trade parameters: symbol, direction (Long/Short), timeframe, entry, stop loss, and take profit
- One-click **Evaluate Trade Setup** — calls the backend to score the trade using a quantitative rule engine
- Displays a **Candlestick Chart** overlaid with entry/SL/TP levels and a predicted trajectory corridor
- **Monte Carlo Simulation** widget showing outcome probability distribution
- 🎉 Confetti celebration when a trade scores ≥ 75

### 📡 Real-Time Market Hub
- Live Binance Futures WebSocket stream (mini-ticker + kline data)
- **Coin Selector Bar** — quickly switch between tracked pairs with live price display
- **Real-Time Candlestick Chart** — streaming OHLCV candles updated tick-by-tick
- **Coin Detail Panel** — depth, order book and stream metrics for the selected pair
- Automatic REST fallback when Binance WebSocket is blocked (ISP-level filtering)

### 🤖 AI Market Analyzer Tab
- AI-powered market setup finder for any symbol + timeframe combination
- Proposes long/short setups with pre-filled entry, SL, TP
- One-click **Apply Setup** — automatically populates the Trading Desk and evaluates

### 🔬 Score & Rule Inspector Tab
- Breakdown of individual scoring rule weights and pass/fail rationale
- Market snapshot card (trend, volume, volatility, indicators)
- Risk warnings panel

### 📈 Prediction Backtest Tab
- Historical backtest of Monte Carlo prediction accuracy
- Visualized hit-rate and corridor statistics

### 📒 Trade Journal Tab
- Full history of evaluated trades with status (Open / Closed)
- Re-evaluate any historical trade directly from the journal
- Close trades with exit price and P&L tracking

---

## Getting Started

### Prerequisites
- **Node.js** ≥ 20
- The **backend API** running locally (default: `https://localhost:7118`)

### Install Dependencies

```bash
npm install
```

### Environment Variables

Configure the development environment file (`.env.development`):

```bash
VITE_API_BASE_URL=             # Leave empty — Vite proxy routes /api → localhost:7118
VITE_BINANCE_WS_URL=wss://fstream.binance.com
VITE_BINANCE_STREAM_SYMBOLS=btcusdt,ethusdt,solusdt,bnbusdt,xrpusdt,nearusdt
```

### Run Development Server

```bash
npm run dev
```

The app will be served at **http://localhost:3000**. API requests to `/api/*` are proxied to `https://localhost:7118` (the local .NET backend) by Vite.

> **Note:** The Vite proxy uses `secure: false` to allow self-signed TLS certificates from the local backend. Binance WebSocket connects directly from the browser — it is **not** proxied.

### Build for Production

```bash
npm run build
```

Output is placed in the `dist/` folder, ready for deployment on Vercel, Nginx, or any static host.

### Preview Production Build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

---

## Deployment

The app is configured for **Vercel** deployment. The `vercel.json` file handles SPA routing rewrites so that deep links always serve `index.html`.

For production, set the following environment variables in your deployment platform:

| Variable | Value |
|---|---|
| `VITE_API_BASE_URL` | Your deployed backend URL (e.g. `https://crypto-evaluator-api.onrender.com`) |
| `VITE_BINANCE_WS_URL` | `wss://fstream.binance.com` |
| `VITE_BINANCE_STREAM_SYMBOLS` | Comma-separated lowercase symbol list |

---

## Dynamic Browser Tab Title

The `useDocumentTitle` hook updates the browser tab title based on the active workspace tab:

| Active Tab | Title Format |
|---|---|
| Trading Desk | `BTC/USDT $104,500 (+1.23%) · HAWK Pulse` |
| AI Analyzer | `🤖 AI Analyzer · HAWK Pulse` |
| Rule Inspector | `🔬 Rule Inspector · HAWK Pulse` |
| Backtest | `📈 Backtest · HAWK Pulse` |
| Trade Journal | `📒 Journal (12) · HAWK Pulse` |

---

## Author

Developed by [@thaihoandev](https://github.com/thaihoandev)
© 2026 HAWK Pulse
