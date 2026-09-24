import React from 'react';
import type { TradeWarning } from '../types/trade';
import { ShieldAlert, AlertTriangle, AlertOctagon, Info, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface RiskWarningsPanelProps {
  warnings: TradeWarning[];
}

export const RiskWarningsPanel: React.FC<RiskWarningsPanelProps> = ({ warnings }) => {
  const { t } = useLanguage();

  if (!warnings || warnings.length === 0) {
    return (
      <div className="glass-panel p-5 rounded-2xl shadow-2xl border border-slate-800/80 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800/80">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <ShieldAlert size={18} />
          </div>
          <h3 className="font-heading font-black text-sm text-slate-100 uppercase tracking-wider">
            {t.riskWarnings.title}
          </h3>
        </div>
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-extrabold flex items-center gap-2">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span>✓ {t.riskWarnings.noWarnings}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-5 rounded-2xl shadow-2xl border border-slate-800/80 space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-800/80">
        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
          <ShieldAlert size={18} />
        </div>
        <h3 className="font-heading font-black text-sm text-slate-100 uppercase tracking-wider">
          {t.riskWarnings.title} ({warnings.length})
        </h3>
      </div>

      <div className="space-y-2.5">
        {warnings.map((w, index) => {
          const isCritical = w.severity === 'Critical';
          const isWarning = w.severity === 'Warning';

          const bgClass = isCritical
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            : isWarning
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            : 'bg-blue-500/10 border-blue-500/30 text-blue-300';

          return (
            <div
              key={index}
              className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs font-medium ${bgClass}`}
            >
              <div className="mt-0.5 shrink-0">
                {isCritical ? (
                  <AlertOctagon size={18} className="text-rose-400" />
                ) : isWarning ? (
                  <AlertTriangle size={18} className="text-amber-400" />
                ) : (
                  <Info size={18} className="text-blue-400" />
                )}
              </div>
              <div className="space-y-0.5">
                <div className="font-black uppercase tracking-wide text-[10px]">
                  [{w.code}] {w.severity}
                </div>
                <div className="leading-relaxed">{w.message}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
