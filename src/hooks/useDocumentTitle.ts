import { useEffect } from 'react';
import type { WorkspaceTab } from '../components/Navbar';
import { useLanguage } from '../context/LanguageContext';
import { formatDynamicPrice } from '../utils/formatters';

interface UseDocumentTitleProps {
  activeTab: WorkspaceTab;
  activeSymbol?: string;
  livePrice?: number | null;
  change24h?: number | null;
  journalCount?: number;
}

export function useDocumentTitle({
  activeTab,
  activeSymbol,
  livePrice,
  change24h,
  journalCount = 0
}: UseDocumentTitleProps) {
  const { t } = useLanguage();

  useEffect(() => {
    let title = 'HAWK Pulse';

    switch (activeTab) {
      case 'terminal': {
        const tabName = t.nav.tabTerminal;
        if (activeSymbol && livePrice && livePrice > 0) {
          const priceFormatted = formatDynamicPrice(livePrice);
          const changeStr =
            change24h !== undefined && change24h !== null
              ? ` (${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%)`
              : '';
          title = `${activeSymbol} $${priceFormatted}${changeStr} | ${tabName} - HAWK Pulse`;
        } else if (activeSymbol) {
          title = `${activeSymbol} | ${tabName} - HAWK Pulse`;
        } else {
          title = `${tabName} | HAWK Pulse`;
        }
        break;
      }

      case 'analyzer':
        title = `${t.nav.tabAnalyzer} AI | HAWK Pulse`;
        break;

      case 'inspector':
        title = `${t.nav.tabInspector} | HAWK Pulse`;
        break;

      case 'backtest':
        title = `${t.nav.tabBacktest} | HAWK Pulse`;
        break;

      case 'journal':
        title = `${t.nav.tabJournal} (${journalCount}) | HAWK Pulse`;
        break;

      default:
        title = 'HAWK Pulse';
    }

    document.title = title;
  }, [activeTab, activeSymbol, livePrice, change24h, journalCount, t]);
}
