import React from 'react';
import { motion } from 'framer-motion';
import { Activity, ShieldCheck, Cpu, LayoutDashboard, Target, BookOpen, FlaskConical, Sparkles, Languages } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export type WorkspaceTab = 'terminal' | 'analyzer' | 'inspector' | 'backtest' | 'journal';

interface NavbarProps {
  apiStatus: 'online' | 'offline' | 'checking';
  activeTab: WorkspaceTab;
  setActiveTab: (tab: WorkspaceTab) => void;
  journalCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  apiStatus,
  activeTab,
  setActiveTab,
  journalCount
}) => {
  const { language, setLanguage, t } = useLanguage();

  const tabs: { id: WorkspaceTab; label: string; icon: any; badge?: string; count?: number }[] = [
    { id: 'terminal', label: t.nav.tabTerminal, icon: LayoutDashboard },
    { id: 'analyzer', label: t.nav.tabAnalyzer, icon: Sparkles, badge: 'AI' },
    { id: 'inspector', label: t.nav.tabInspector, icon: Target },
    { id: 'backtest', label: t.nav.tabBacktest, icon: FlaskConical },
    { id: 'journal', label: t.nav.tabJournal, count: journalCount, icon: BookOpen }
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#06080e]/90 backdrop-blur-2xl shadow-xl">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-2.5 flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Brand Logo & Mobile Language Controls */}
        <div className="flex items-center justify-between w-full lg:w-auto">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setActiveTab('terminal')}
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                className="bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-cyan-500/25 group-hover:shadow-cyan-500/40 transition-shadow"
              >
                <Cpu size={22} className="text-white" />
              </motion.div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                  Crypto Trade <span className="gradient-text-cyan">Evaluator</span>
                </h1>
                <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                  v2.5
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-semibold tracking-wide hidden sm:block">
                {t.nav.brandSub}
              </p>
            </div>
          </motion.div>

          {/* Mobile Language Switcher */}
          <div className="flex lg:hidden items-center bg-slate-900/90 border border-slate-800 p-0.5 rounded-full text-xs font-mono">
            <button
              type="button"
              onClick={() => setLanguage('vi')}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-black transition-all ${language === 'vi' ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30' : 'text-slate-400 hover:text-slate-200'}`}
            >
              VI
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-black transition-all ${language === 'en' ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30' : 'text-slate-400 hover:text-slate-200'}`}
            >
              EN
            </button>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800/80 p-1 rounded-xl max-w-full overflow-x-auto scrollbar-none w-full lg:w-auto justify-start lg:justify-center shadow-inner">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`relative px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap outline-none flex items-center gap-2 cursor-pointer ${isActive ? 'text-cyan-300 font-black' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}
                onClick={() => setActiveTab(tab.id as WorkspaceTab)}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabPill"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    className="absolute inset-0 bg-cyan-500/15 border border-cyan-500/40 rounded-lg shadow-sm shadow-cyan-500/20 z-0"
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon size={16} className={isActive ? 'text-cyan-400' : 'text-slate-400'} />
                  {tab.label}
                  {tab.badge && (
                    <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full">
                      {tab.badge}
                    </span>
                  )}
                  {tab.count !== undefined && (
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full border ${isActive ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                      {tab.count}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Status Indicators & Desktop Language Selector */}
        <div className="hidden lg:flex items-center gap-2.5">
          {/* Language Switcher */}
          <div className="flex items-center bg-slate-900/90 border border-slate-800/80 p-0.5 rounded-full font-mono">
            <div className="px-2 text-slate-500">
              <Languages size={14} />
            </div>
            <button
              type="button"
              onClick={() => setLanguage('vi')}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-black transition-all cursor-pointer ${language === 'vi' ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30' : 'text-slate-400 hover:text-slate-200'}`}
            >
              VI
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-black transition-all cursor-pointer ${language === 'en' ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30' : 'text-slate-400 hover:text-slate-200'}`}
            >
              EN
            </button>
          </div>

          {/* Engine Status Badge */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800/80 px-3 py-1.5 rounded-full text-xs font-bold text-slate-300">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span className="text-[11px] text-slate-400">{t.nav.engineReady}</span>
          </div>

          {/* API Status Indicator */}
          <motion.div
            animate={apiStatus === 'online' ? { opacity: [0.8, 1, 0.8] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800/80 px-3 py-1.5 rounded-full text-xs font-bold"
          >
            <Activity
              size={14}
              className={
                apiStatus === 'online'
                  ? 'text-emerald-400'
                  : apiStatus === 'offline'
                  ? 'text-rose-400'
                  : 'text-amber-400 animate-spin'
              }
            />
            <span
              className={`text-[11px] font-bold ${
                apiStatus === 'online'
                  ? 'text-emerald-400'
                  : apiStatus === 'offline'
                  ? 'text-rose-400'
                  : 'text-amber-400'
              }`}
            >
              {apiStatus === 'online'
                ? t.nav.apiOnline
                : apiStatus === 'offline'
                ? t.nav.apiOffline
                : t.nav.apiChecking}
            </span>
          </motion.div>
        </div>
      </div>
    </header>
  );
};
