export type Language = 'vi' | 'en';

export interface TranslationDictionary {
  nav: {
    brandSub: string;
    tabTerminal: string;
    tabAnalyzer: string;
    tabInspector: string;
    tabBacktest: string;
    tabJournal: string;
    engineReady: string;
    apiOnline: string;
    apiOffline: string;
    apiChecking: string;
    langLabel: string;
    vi: string;
    en: string;
  };
  tickerBar: {
    liveTickers: string;
  };
  tradeForm: {
    title: string;
    subtitle: string;
    searchCoinLabel: string;
    searchPlaceholder: string;
    fetchLivePrice: string;
    direction: string;
    long: string;
    short: string;
    timeframe: string;
    entryPrice: string;
    stopLoss: string;
    takeProfit: string;
    accountBalance: string;
    riskPercent: string;
    leverage: string;
    submitBtn: string;
    evaluating: string;
    quickPresets: string;
    presetLong: string;
    presetShort: string;
    rrRatio: string;
    riskAmount: string;
  };
  marketAnalyzer: {
    title: string;
    subtitle: string;
    searchCoinLabel: string;
    searchPlaceholder: string;
    selectTimeframe: string;
    analyzeBtn: string;
    analyzing: string;
    recommendationTitle: string;
    statusLong: string;
    statusShort: string;
    statusWait: string;
    applySetupBtn: string;
    rationale: string;
    marketBlockers: string;
    proposedEntry: string;
    proposedSL: string;
    proposedTP: string;
    proposedRR: string;
    keyLevels: string;
    levelSupport: string;
    levelResistance: string;
    structureDetails: string;
    recentSwingHigh: string;
    recentSwingLow: string;
    currentAtr: string;
    trendState: string;
  };
  candlestickChart: {
    chartTitle: string;
    toggleMA: string;
    toggleBB: string;
    toggleProjection: string;
    candleCount: string;
    scenarioBull: string;
    scenarioBase: string;
    scenarioBear: string;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
    hoverInfo: string;
    scenarioSummary: string;
    p90Title: string;
    p50Title: string;
    p10Title: string;
  };
  monteCarlo: {
    title: string;
    winRate: string;
    lossRate: string;
    noHitRate: string;
    expectedR: string;
    expectedRDesc: string;
    percentilesTitle: string;
    p90: string;
    p50: string;
    p10: string;
  };
  tradeScore: {
    scoreTitle: string;
    ratingExcellent: string;
    ratingGood: string;
    ratingFair: string;
    ratingPoor: string;
    explanationTitle: string;
  };
  inspector: {
    title: string;
    subtitle: string;
    weight: string;
    score: string;
    rationale: string;
    recommendation: string;
  };
  scoreBreakdown: {
    title: string;
    totalScore: string;
  };
  riskWarnings: {
    title: string;
    noWarnings: string;
  };
  snapshot: {
    title: string;
    rsi: string;
    atr: string;
    ema20: string;
    ema50: string;
    ema200: string;
    volSma: string;
  };
  journal: {
    title: string;
    searchPlaceholder: string;
    symbolCol: string;
    directionCol: string;
    timeframeCol: string;
    entryCol: string;
    slCol: string;
    tpCol: string;
    scoreCol: string;
    statusCol: string;
    actionsCol: string;
    statusOpen: string;
    statusClosed: string;
    evaluateBtn: string;
    closeBtn: string;
    closeModalTitle: string;
    closePrice: string;
    closeConfirm: string;
    closeCancel: string;
  };
  backtest: {
    title: string;
    subtitle: string;
    selectCoin: string;
    runBtn: string;
    running: string;
    totalTrades: string;
    winRate: string;
    profitFactor: string;
  };
  app: {
    readyTitle: string;
    readyDesc: string;
    evalErrorTitle: string;
    footer: string;
  };
}

export const translations: Record<Language, TranslationDictionary> = {
  vi: {
    nav: {
      brandSub: 'Phân tích định lượng • Đánh giá rủi ro • Mô phỏng Monte Carlo',
      tabTerminal: 'Bàn Giao Dịch & Biểu Đồ',
      tabAnalyzer: 'AI Tìm Setup Tự Động',
      tabInspector: 'Kiểm Tra Quy Tắc & Điểm',
      tabBacktest: 'Backtest Dự Đoán',
      tabJournal: 'Nhật Ký Giao Dịch',
      engineReady: 'Hệ Thống Sẵn Sàng',
      apiOnline: 'API Hoạt Động',
      apiOffline: 'API Mất Kết Nối',
      apiChecking: 'Đang Kiểm Tra API',
      langLabel: 'Ngôn ngữ',
      vi: 'Tiếng Việt',
      en: 'English'
    },
    tickerBar: {
      liveTickers: 'GIÁ FUTURES THỜI GIAN THỰC:'
    },
    tradeForm: {
      title: 'Cấu Hình Setup Giao Dịch',
      subtitle: 'Nhập các tham số lệnh để kích hoạt Engine đánh giá định lượng',
      searchCoinLabel: 'Tìm Cặp Giao Dịch (Futures)',
      searchPlaceholder: 'Nhập mã coin (ví dụ: BTC, ETH, SOL...)',
      fetchLivePrice: 'Lấy giá hiện tại',
      direction: 'Hướng Lệnh',
      long: 'LONG (Mua)',
      short: 'SHORT (Bán)',
      timeframe: 'Khung Thời Gian',
      entryPrice: 'Giá Vào Lệnh (Entry Price)',
      stopLoss: 'Giá Dừng Lỗ (Stop Loss)',
      takeProfit: 'Giá Chốt Lời (Take Profit)',
      accountBalance: 'Số Dư Tài Khoản ($)',
      riskPercent: 'Tỷ Lệ Rủi Ro (%)',
      leverage: 'Đòn Bẩy (x)',
      submitBtn: 'ĐÁNH GIÁ SETUP GIAO DỊCH',
      evaluating: 'ĐANG PHÂN TÍCH & MÔ PHỎNG...',
      quickPresets: 'Mẫu Setup Nhanh:',
      presetLong: 'Long Mẫu (R:R 2.0)',
      presetShort: 'Short Mẫu (R:R 2.0)',
      rrRatio: 'Tỷ lệ R:R:',
      riskAmount: 'Rủi ro chấp nhận:'
    },
    marketAnalyzer: {
      title: 'AI Tìm Setup & Phân Tích Thị Trường',
      subtitle: 'AI tự động quét cấu trúc nến Binance, tìm cản Hỗ trợ/Kháng cự và đề xuất điểm vào lệnh tối ưu',
      searchCoinLabel: 'Chọn Cặp Giao Dịch Canh Setup',
      searchPlaceholder: 'Tìm cặp coin (BTC, ETH, SOL, NEAR...)',
      selectTimeframe: 'Khung Thời Gian',
      analyzeBtn: 'QUÉT CẤU TRÚC THỊ TRƯỜNG',
      analyzing: 'ĐANG QUÉT NẾN BINANCE...',
      recommendationTitle: 'Đề Xuất Setup Từ AI Analyst',
      statusLong: 'KHUYẾN NGHỊ LONG',
      statusShort: 'KHUYẾN NGHỊ SHORT',
      statusWait: 'THỊ TRƯỜNG ĐI NGANG - NÊN CHỜ',
      applySetupBtn: 'NẠP SETUP VÀO BÀN GIAO DỊCH',
      rationale: 'Lý Do Đề Xuất:',
      marketBlockers: 'Lưu Ý Rủi Ro Thị Trường:',
      proposedEntry: 'Entry Đề Xuất',
      proposedSL: 'Stop Loss Đề Xuất',
      proposedTP: 'Take Profit Đề Xuất',
      proposedRR: 'R:R Lợi Nhuận',
      keyLevels: 'Các Mốc Cản Kỹ Thuật (Support / Resistance)',
      levelSupport: 'Vùng Hỗ Trợ',
      levelResistance: 'Vùng Kháng Cự',
      structureDetails: 'Thông Số Cấu Trúc Nến',
      recentSwingHigh: 'Đỉnh Swing Gần Nhất',
      recentSwingLow: 'Đáy Swing Gần Nhất',
      currentAtr: 'Chỉ Báo ATR (20 nến)',
      trendState: 'Trạng Thái Xu Hướng'
    },
    candlestickChart: {
      chartTitle: 'Biểu Đồ Nến & Dự Phóng Monte Carlo',
      toggleMA: 'Đường MA',
      toggleBB: 'Dải Bollinger',
      toggleProjection: 'Hành Lang Monte Carlo',
      candleCount: 'Số Nến:',
      scenarioBull: 'P90 (Lạc Quan)',
      scenarioBase: 'P50 (Trung Vị)',
      scenarioBear: 'P10 (Bi Quan)',
      open: 'Mở:',
      high: 'Cao:',
      low: 'Thấp:',
      close: 'Đóng:',
      volume: 'Khối lượng:',
      hoverInfo: 'Rê chuột lên nến để xem thông số chi tiết & dự phóng',
      scenarioSummary: 'Kịch Bản Giá Tương Lai (Monte Carlo)',
      p90Title: 'P90 (Bull Scenario)',
      p50Title: 'P50 (Base Scenario)',
      p10Title: 'P10 (Bear Scenario)'
    },
    monteCarlo: {
      title: 'Kết Quả Mô Phỏng Monte Carlo (10,000 Path)',
      winRate: 'Xác Suất Chạm TP (Win)',
      lossRate: 'Xác Suất Chạm SL (Loss)',
      noHitRate: 'Chưa Chạm TP/SL (No Hit)',
      expectedR: 'Tỷ Lệ Kỳ Vọng E[R]',
      expectedRDesc: 'Lợi thế toán học trung bình trên 1R rủi ro',
      percentilesTitle: 'Dự Phóng Phân Vị Giá (Tử nến 50):',
      p90: 'P90 (Lạc quan):',
      p50: 'P50 (Trung vị):',
      p10: 'P10 (Bi quan):'
    },
    tradeScore: {
      scoreTitle: 'Điểm Đánh Giá Setup (Trade Score)',
      ratingExcellent: 'RẤT TỐT',
      ratingGood: 'TỐT',
      ratingFair: 'TRUNG BÌNH',
      ratingPoor: 'KÉM',
      explanationTitle: 'Đánh Giá Chi Tiết Engine:'
    },
    inspector: {
      title: 'Phân Tích Chi Tiết 8 Quy Tắc Đánh Giá',
      subtitle: 'Xem cách Engine chấm điểm từng tiêu chí kỹ thuật độc lập',
      weight: 'Trọng số:',
      score: 'Điểm:',
      rationale: 'Lý giải toán học:',
      recommendation: 'Khuyên nghị cải thiện:'
    },
    scoreBreakdown: {
      title: 'Tỷ Lệ Đóng Góp Điểm Thành Phần',
      totalScore: 'Tổng Điểm Setup'
    },
    riskWarnings: {
      title: 'Cảnh Báo Rủi Ro & An Toàn Vốn',
      noWarnings: 'Không có cảnh báo rủi ro nghiêm trọng nào được ghi nhận.'
    },
    snapshot: {
      title: 'Thông Số Chỉ Báo Kỹ Thuật (Snapshot)',
      rsi: 'RSI (14)',
      atr: 'ATR (20)',
      ema20: 'EMA 20',
      ema50: 'EMA 50',
      ema200: 'EMA 200',
      volSma: 'Vol SMA 20'
    },
    journal: {
      title: 'Nhật Ký & Lịch Sử Giao Dịch',
      searchPlaceholder: 'Tìm theo mã coin (BTC, ETH...)...',
      symbolCol: 'Cặp Giao Dịch',
      directionCol: 'Hướng Lệnh',
      timeframeCol: 'Khung',
      entryCol: 'Entry',
      slCol: 'Stop Loss',
      tpCol: 'Take Profit',
      scoreCol: 'Điểm Score',
      statusCol: 'Trạng Thái',
      actionsCol: 'Thao Tác',
      statusOpen: 'ĐANG MỞ',
      statusClosed: 'ĐÃ ĐÓNG',
      evaluateBtn: 'Xem Lại',
      closeBtn: 'Đóng Lệnh',
      closeModalTitle: 'Chốt Lệnh Giao Dịch',
      closePrice: 'Giá Chốt Lệnh ($):',
      closeConfirm: 'Xác Nhận Đóng',
      closeCancel: 'Hủy'
    },
    backtest: {
      title: 'Backtest Mô Phỏng Dự Đoán Lịch Sử',
      subtitle: 'Kiểm tra tỷ lệ chính xác của Engine trên dữ liệu nến lịch sử thực tế',
      selectCoin: 'Cặp Tiền Backtest:',
      runBtn: 'CHẠY BACKTEST',
      running: 'ĐANG BACKTEST...',
      totalTrades: 'Tổng Số Lệnh Backtest:',
      winRate: 'Tỷ Lệ Thắng Thực Tế:',
      profitFactor: 'Profit Factor:'
    },
    app: {
      readyTitle: 'Sẵn Sàng Đánh Giá Setup Giao Dịch',
      readyDesc: 'Chọn cặp Crypto từ danh sách tìm kiếm bên trái hoặc bấm lấy giá thời gian thực. Nhấn ĐÁNH GIÁ SETUP GIAO DỊCH để kích hoạt thuật toán phân tích định lượng.',
      evalErrorTitle: 'Lỗi Đánh Giá:',
      footer: 'Crypto Trade Evaluator © 2026. ASP.NET Core Clean Architecture & Vite React Trading Terminal.'
    }
  },

  en: {
    nav: {
      brandSub: 'Quant Analysis • Risk Engine • Monte Carlo Predictor',
      tabTerminal: 'Trading Desk & Chart',
      tabAnalyzer: 'AI Setup Finder',
      tabInspector: 'Score & Rule Inspector',
      tabBacktest: 'Prediction Backtest',
      tabJournal: 'Trade Journal',
      engineReady: 'Engine Ready',
      apiOnline: 'API Online',
      apiOffline: 'API Offline',
      apiChecking: 'Checking API',
      langLabel: 'Language',
      vi: 'Tiếng Việt',
      en: 'English'
    },
    tickerBar: {
      liveTickers: 'LIVE FUTURES TICKERS:'
    },
    tradeForm: {
      title: 'Trade Setup Configuration',
      subtitle: 'Enter trade parameters to trigger quantitative scoring engine',
      searchCoinLabel: 'Search Crypto Pair (Futures)',
      searchPlaceholder: 'Type coin symbol (e.g. BTC, ETH, SOL...)',
      fetchLivePrice: 'Fetch Live Price',
      direction: 'Trade Direction',
      long: 'LONG (Buy)',
      short: 'SHORT (Sell)',
      timeframe: 'Timeframe',
      entryPrice: 'Entry Price',
      stopLoss: 'Stop Loss',
      takeProfit: 'Take Profit',
      accountBalance: 'Account Balance ($)',
      riskPercent: 'Risk Percent (%)',
      leverage: 'Leverage (x)',
      submitBtn: 'EVALUATE TRADE SETUP',
      evaluating: 'ANALYZING & SIMULATING...',
      quickPresets: 'Quick Presets:',
      presetLong: 'Sample Long (R:R 2.0)',
      presetShort: 'Sample Short (R:R 2.0)',
      rrRatio: 'R:R Ratio:',
      riskAmount: 'Risk Amount:'
    },
    marketAnalyzer: {
      title: 'AI Setup Finder & Market Analyzer',
      subtitle: 'AI scans Binance candle structure, detects Support/Resistance and proposes optimal setups',
      searchCoinLabel: 'Select Symbol to Analyze',
      searchPlaceholder: 'Search symbol (BTC, ETH, SOL, NEAR...)',
      selectTimeframe: 'Timeframe',
      analyzeBtn: 'SCAN MARKET STRUCTURE',
      analyzing: 'SCANNING BINANCE CANDLES...',
      recommendationTitle: 'AI Analyst Recommendation',
      statusLong: 'RECOMMENDED LONG',
      statusShort: 'RECOMMENDED SHORT',
      statusWait: 'MARKET SIDEWAY - WAIT',
      applySetupBtn: 'APPLY SETUP TO TRADING DESK',
      rationale: 'Recommendation Rationale:',
      marketBlockers: 'Market Blockers / Risks:',
      proposedEntry: 'Proposed Entry',
      proposedSL: 'Proposed Stop Loss',
      proposedTP: 'Proposed Take Profit',
      proposedRR: 'Proposed R:R',
      keyLevels: 'Key Technical Levels (Support / Resistance)',
      levelSupport: 'Support Zone',
      levelResistance: 'Resistance Zone',
      structureDetails: 'Candlestick Structure Metrics',
      recentSwingHigh: 'Recent Swing High',
      recentSwingLow: 'Recent Swing Low',
      currentAtr: 'ATR Indicator (20 candles)',
      trendState: 'Trend Alignment State'
    },
    candlestickChart: {
      chartTitle: 'Candlestick Chart & Monte Carlo Trajectory',
      toggleMA: 'MA Overlay',
      toggleBB: 'Bollinger Bands',
      toggleProjection: 'Monte Carlo Corridor',
      candleCount: 'Candles:',
      scenarioBull: 'P90 (Bull)',
      scenarioBase: 'P50 (Base)',
      scenarioBear: 'P10 (Bear)',
      open: 'Open:',
      high: 'High:',
      low: 'Low:',
      close: 'Close:',
      volume: 'Volume:',
      hoverInfo: 'Hover over candles to view detailed parameters & projections',
      scenarioSummary: 'Future Trajectory Scenarios (Monte Carlo)',
      p90Title: 'P90 (Bull Scenario)',
      p50Title: 'P50 (Base Scenario)',
      p10Title: 'P10 (Bear Scenario)'
    },
    monteCarlo: {
      title: 'Monte Carlo Simulation Results (10,000 Paths)',
      winRate: 'TP Hit Probability (Win)',
      lossRate: 'SL Hit Probability (Loss)',
      noHitRate: 'No Hit Rate',
      expectedR: 'Expected R-Multiple',
      expectedRDesc: 'Expected R return per 1R risk taken',
      percentilesTitle: 'Percentile Price Projection (at candle 50):',
      p90: 'P90 (Bull):',
      p50: 'P50 (Base):',
      p10: 'P10 (Bear):'
    },
    tradeScore: {
      scoreTitle: 'Trade Setup Score',
      ratingExcellent: 'EXCELLENT',
      ratingGood: 'GOOD',
      ratingFair: 'FAIR',
      ratingPoor: 'POOR',
      explanationTitle: 'Engine Rationales:'
    },
    inspector: {
      title: 'Detailed 8-Rule Score Inspection',
      subtitle: 'Inspect individual rule score breakdown and rationales',
      weight: 'Weight:',
      score: 'Score:',
      rationale: 'Mathematical Rationale:',
      recommendation: 'Improvement Recommendation:'
    },
    scoreBreakdown: {
      title: 'Component Score Weights',
      totalScore: 'Total Setup Score'
    },
    riskWarnings: {
      title: 'Risk & Capital Protection Warnings',
      noWarnings: 'No critical risk warnings detected.'
    },
    snapshot: {
      title: 'Technical Indicator Snapshot',
      rsi: 'RSI (14)',
      atr: 'ATR (20)',
      ema20: 'EMA 20',
      ema50: 'EMA 50',
      ema200: 'EMA 200',
      volSma: 'Vol SMA 20'
    },
    journal: {
      title: 'Trade Journal & History',
      searchPlaceholder: 'Search by symbol (BTC, ETH...)...',
      symbolCol: 'Symbol',
      directionCol: 'Direction',
      timeframeCol: 'Timeframe',
      entryCol: 'Entry',
      slCol: 'Stop Loss',
      tpCol: 'Take Profit',
      scoreCol: 'Score',
      statusCol: 'Status',
      actionsCol: 'Actions',
      statusOpen: 'OPEN',
      statusClosed: 'CLOSED',
      evaluateBtn: 'Re-Evaluate',
      closeBtn: 'Close Trade',
      closeModalTitle: 'Close Trade Position',
      closePrice: 'Exit Price ($):',
      closeConfirm: 'Confirm Close',
      closeCancel: 'Cancel'
    },
    backtest: {
      title: 'Historical Prediction Backtest',
      subtitle: 'Verify Engine accuracy against historical candle data',
      selectCoin: 'Backtest Pair:',
      runBtn: 'RUN BACKTEST',
      running: 'RUNNING BACKTEST...',
      totalTrades: 'Total Backtested Trades:',
      winRate: 'Actual Win Rate:',
      profitFactor: 'Profit Factor:'
    },
    app: {
      readyTitle: 'Ready to Evaluate Trade Setup',
      readyDesc: 'Select a Crypto pair using the Search Dropdown on the left or fetch live market price. Click EVALUATE TRADE SETUP to trigger quantitative score engine.',
      evalErrorTitle: 'Evaluation Error:',
      footer: 'Crypto Trade Evaluator © 2026. ASP.NET Core Clean Architecture & Vite React Trading Terminal.'
    }
  }
};
