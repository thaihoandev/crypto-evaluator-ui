import React from 'react';
import type { TradeWarning } from '../types/trade';
import { ShieldAlert, AlertTriangle, AlertOctagon, Info } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface RiskWarningsPanelProps {
  warnings: TradeWarning[];
}

export const RiskWarningsPanel: React.FC<RiskWarningsPanelProps> = ({ warnings }) => {
  const { t } = useLanguage();

  if (!warnings || warnings.length === 0) {
    return (
      <div className="card">
        <div className="card-title">
          <ShieldAlert size={18} color="#10b981" />
          {t.riskWarnings.title}
        </div>
        <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', color: '#6ee7b7', fontSize: '0.85rem' }}>
          ✓ {t.riskWarnings.noWarnings}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-title">
        <ShieldAlert size={18} color="#f59e0b" />
        {t.riskWarnings.title} ({warnings.length})
      </div>

      <div>
        {warnings.map((w, index) => {
          const isCritical = w.severity === 'Critical';
          const isWarning = w.severity === 'Warning';

          return (
            <div
              key={index}
              className={`warning-item ${isCritical ? 'critical' : isWarning ? 'warning' : 'info'}`}
            >
              <div style={{ marginTop: '2px' }}>
                {isCritical ? (
                  <AlertOctagon size={18} color="#f43f5e" />
                ) : isWarning ? (
                  <AlertTriangle size={18} color="#f59e0b" />
                ) : (
                  <Info size={18} color="#3b82f6" />
                )}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase', marginBottom: '0.1rem' }}>
                  [{w.code}] {w.severity}
                </div>
                <div>{w.message}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
