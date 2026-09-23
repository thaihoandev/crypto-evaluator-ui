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

  const tabs = [
    { id: 'terminal', label: t.nav.tabTerminal, icon: LayoutDashboard },
    { id: 'analyzer', label: t.nav.tabAnalyzer, icon: Sparkles },
    { id: 'inspector', label: t.nav.tabInspector, icon: Target },
    { id: 'backtest', label: t.nav.tabBacktest, icon: FlaskConical },
    { id: 'journal', label: `${t.nav.tabJournal} (${journalCount})`, icon: BookOpen }
  ] as const;

  return (
    <header className="header-glass">
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1.25rem' }}>
        {/* Brand Logo */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: 'pointer' }}
          onClick={() => setActiveTab('terminal')}
        >
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
              padding: '0.55rem',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(6, 182, 212, 0.45)'
            }}
          >
            <Cpu size={24} color="#ffffff" />
          </motion.div>
          <div>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.35rem', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              Crypto Trade <span style={{ color: '#06b6d4' }}>Evaluator</span>
            </h1>
            <p style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.02em' }}>
              {t.nav.brandSub}
            </p>
          </div>
        </motion.div>

        {/* Center Workspace Tabs with Animated Active Pill */}
        <div className="nav-tabs" style={{ position: 'relative' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                style={{ position: 'relative', outline: 'none' }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabPill"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(6, 182, 212, 0.15)',
                      border: '1px solid rgba(6, 182, 212, 0.4)',
                      borderRadius: '8px',
                      zIndex: 0
                    }}
                  />
                )}
                <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Icon size={16} />
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Status & Language Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Language Selector Toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#090d16',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            padding: '0.2rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 700
          }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 0.4rem', color: '#64748b' }}>
              <Languages size={14} />
            </div>
            <button
              type="button"
              onClick={() => setLanguage('vi')}
              style={{
                background: language === 'vi' ? '#06b6d4' : 'transparent',
                color: language === 'vi' ? '#ffffff' : '#94a3b8',
                border: 'none',
                padding: '0.25rem 0.6rem',
                borderRadius: '9999px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.72rem',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              🇻🇳 VI
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              style={{
                background: language === 'en' ? '#06b6d4' : 'transparent',
                color: language === 'en' ? '#ffffff' : '#94a3b8',
                border: 'none',
                padding: '0.25rem 0.6rem',
                borderRadius: '9999px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.72rem',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              🇺🇸 EN
            </button>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: '#090d16',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '0.35rem 0.75rem',
            borderRadius: '9999px',
            fontSize: '0.72rem',
            fontWeight: 700
          }}>
            <ShieldCheck size={14} color="#10b981" />
            <span style={{ color: '#94a3b8' }}>{t.nav.engineReady}</span>
          </div>

          <motion.div
            animate={apiStatus === 'online' ? { opacity: [0.8, 1, 0.8] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: '#090d16',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '0.35rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.72rem',
              fontWeight: 700
            }}
          >
            <Activity size={14} color={apiStatus === 'online' ? '#10b981' : apiStatus === 'offline' ? '#f43f5e' : '#f59e0b'} />
            <span style={{ textTransform: 'capitalize', color: apiStatus === 'online' ? '#10b981' : apiStatus === 'offline' ? '#f43f5e' : '#f59e0b' }}>
              {apiStatus === 'online' ? t.nav.apiOnline : apiStatus === 'offline' ? t.nav.apiOffline : t.nav.apiChecking}
            </span>
          </motion.div>
        </div>
      </div>
    </header>
  );
};
