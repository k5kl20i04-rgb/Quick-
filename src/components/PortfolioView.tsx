import React, { useState } from 'react';
import {
  Wallet,
  Clock,
  Lock,
  Unlock,
  TrendingUp,
  DollarSign,
  Receipt,
  Truck,
  Zap,
} from 'lucide-react';
import { Investment, Language, User, WithdrawalRequest, DepositRequest, Project, FreightTrip } from '../types';
import { translations } from '../i18n/translations';
import { ActivePlansDashboard } from './ActivePlansDashboard';
import { TransactionLedger } from './TransactionLedger';
import { PlanUpgradeModal } from './PlanUpgradeModal';

interface PortfolioViewProps {
  currentLang: Language;
  user: User;
  investments: Investment[];
  withdrawals: WithdrawalRequest[];
  deposits: DepositRequest[];
  projects: Project[];
  trips?: FreightTrip[];
  onRequestWithdrawal: (investmentId: string, destinationWallet: string) => Promise<void>;
  onOpenDeposit: () => void;
  onOpenWithdrawal?: () => void;
  onRefreshState: () => void;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({
  currentLang,
  user,
  investments,
  withdrawals,
  deposits,
  projects,
  trips = [],
  onRequestWithdrawal,
  onOpenDeposit,
  onOpenWithdrawal,
  onRefreshState,
}) => {
  const t = translations[currentLang] || translations.ar;

  const [activeSubTab, setActiveSubTab] = useState<'plans' | 'ledger'>(() => {
    const saved = sessionStorage.getItem('portfolio_active_subtab');
    return saved === 'plans' || saved === 'ledger' ? saved : 'plans';
  });

  React.useEffect(() => {
    sessionStorage.setItem('portfolio_active_subtab', activeSubTab);
  }, [activeSubTab]);
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);

  const handleUpgradeConfirm = async (
    projectId: string,
    investmentId: string | null,
    additionalAmount: number
  ) => {
    const res = await fetch('/api/invest/upgrade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, investmentId, additionalAmount }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Upgrade operation failed');
    }

    onRefreshState();
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Portfolio Header & Navigation Sub-Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">{t.portfolioTitle}</h1>
            <p className="text-xs text-slate-400 mt-1">
              {currentLang === 'ar'
                ? 'إدارة محفظتك اللوجستية، تتبع العوائد الشهرية، وسجل المعاملات والعمليات المالية'
                : 'Manage your transport fleet portfolio, track monthly yield ROI, and inspect transaction ledgers'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onOpenWithdrawal && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onOpenWithdrawal();
                }}
                className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-2 cursor-pointer"
              >
                <Wallet className="w-4 h-4" />
                <span>{currentLang === 'ar' ? 'سحب الأرباح P2P' : 'Withdrawal Request'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setShowUpgradeModal(true);
              }}
              className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-extrabold text-xs border border-amber-500/30 transition flex items-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>{currentLang === 'ar' ? 'ترقية الخطة' : 'Upgrade Plan'}</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onOpenDeposit();
              }}
              className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition flex items-center gap-2 cursor-pointer"
            >
              <DollarSign className="w-4 h-4" />
              <span>{t.navDeposit}</span>
            </button>
          </div>
        </div>

        {/* Sub-Tab Navigation Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setActiveSubTab('plans');
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
              activeSubTab === 'plans'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>{currentLang === 'ar' ? 'الخطط المشتركة والعد التنازلي' : 'Active Subscribed Plans'}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-900/80 font-mono">
              {investments.length}
            </span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setActiveSubTab('ledger');
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
              activeSubTab === 'ledger'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>{currentLang === 'ar' ? 'السجل المالي والمعاملات' : 'Client Financial Ledger'}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-900/80 font-mono">
              {deposits.length + withdrawals.length + investments.length}
            </span>
          </button>
        </div>
      </div>

      {/* Sub-Tab 1: Active Plans & Subscriptions Dashboard */}
      {activeSubTab === 'plans' && (
        <ActivePlansDashboard
          currentLang={currentLang}
          investments={investments}
          projects={projects}
          trips={trips}
          user={user}
          onOpenUpgradeModal={() => setShowUpgradeModal(true)}
          onRequestWithdrawal={onRequestWithdrawal}
        />
      )}

      {/* Sub-Tab 2: Financial Ledger & Transaction History */}
      {activeSubTab === 'ledger' && (
        <TransactionLedger
          currentLang={currentLang}
          deposits={deposits}
          withdrawals={withdrawals}
          investments={investments}
          usdtBalance={user?.usdtBalance || 0}
          mainBalance={user?.mainBalance || 0}
          investmentBalance={user?.investmentBalance || 0}
        />
      )}

      {/* Plan Upgrade Interactive Modal */}
      <PlanUpgradeModal
        currentLang={currentLang}
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        projects={projects}
        investments={investments}
        user={user}
        onUpgradeConfirm={handleUpgradeConfirm}
        onOpenDepositModal={onOpenDeposit}
      />
    </div>
  );
};
