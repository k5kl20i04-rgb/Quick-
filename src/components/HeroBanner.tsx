import React from 'react';
import {
  ShieldCheck,
  Lock,
  TrendingUp,
  Truck,
  AlertCircle,
  ArrowUpRight,
  DollarSign,
  Clock,
  Unlock,
  Sparkles,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';
import { Language, User, AdminSettings, DepositRequest } from '../types';
import { translations } from '../i18n/translations';

interface HeroBannerProps {
  currentLang: Language;
  user: User;
  adminSettings: AdminSettings;
  deposits?: DepositRequest[];
  onOpenDeposit: () => void;
  onNavigateToPortfolio: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  currentLang,
  user,
  adminSettings,
  deposits = [],
  onOpenDeposit,
  onNavigateToPortfolio,
}) => {
  const t = translations[currentLang];
  const isRtl = currentLang === 'ar' || currentLang === 'ckb';

  // Find user's active in-progress deposit
  const userDeposits = deposits.filter((d) => d.userId === user?.id);
  const activeDeposit = userDeposits.find(
    (d) =>
      d.status === 'pending_approval' ||
      d.status === 'pending' ||
      d.status === 'unlocked' ||
      d.status === 'in_discussion' ||
      d.status === 'submitted'
  );

  return (
    <div className="space-y-4">
      
      {/* Active Deposit Notification Banner if in Progress */}
      {activeDeposit && (
        <div
          onClick={onOpenDeposit}
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            activeDeposit.status === 'unlocked' || activeDeposit.status === 'in_discussion'
              ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200 hover:bg-emerald-500/20 shadow-emerald-500/10'
              : activeDeposit.status === 'submitted'
              ? 'bg-blue-500/15 border-blue-500/50 text-blue-200 hover:bg-blue-500/20 shadow-blue-500/10'
              : 'bg-amber-500/15 border-amber-500/50 text-amber-200 hover:bg-amber-500/20 shadow-amber-500/10'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-950/70 border border-current/30 flex items-center justify-center shrink-0">
              {activeDeposit.status === 'unlocked' || activeDeposit.status === 'in_discussion' ? (
                <Unlock className="w-5 h-5 text-emerald-400 animate-pulse" />
              ) : activeDeposit.status === 'submitted' ? (
                <Sparkles className="w-5 h-5 text-blue-400 animate-pulse" />
              ) : (
                <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xs sm:text-sm text-white">
                  {activeDeposit.status === 'unlocked' || activeDeposit.status === 'in_discussion'
                    ? currentLang === 'ar'
                      ? 'تم قبول طلب الإيداع! بوابة الدفع والمحادثة مفتوحة الآن'
                      : 'Deposit Request Approved! Gateway & Chat Unlocked'
                    : activeDeposit.status === 'submitted'
                    ? currentLang === 'ar'
                      ? 'تم تقديم إثبات التحويل — قيد المراجعة المالية والاعتماد'
                      : 'Proof Submitted — Under Financial Review'
                    : currentLang === 'ar'
                    ? 'طلب إيداع يدوي في انتظار مراجعة الأدمن'
                    : 'Manual Deposit Request — Pending Admin Review'}
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900/80 text-white">
                  #{activeDeposit.id}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 line-clamp-1">
                {activeDeposit.status === 'unlocked'
                  ? currentLang === 'ar'
                    ? 'انقر لنسخ عنوان المحفظة الرسمي وتقديم رقم الـ TXID وصورة الإيصال'
                    : 'Click to copy official USDT wallet address and submit TXID receipt'
                  : currentLang === 'ar'
                  ? 'انقر لفتح شاشة المتابعة والمحادثة المباشرة مع مسؤول التسويات'
                  : 'Click to view real-time status and live chat desk'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <span className="text-xs font-black px-3 py-1.5 rounded-xl bg-slate-950/80 border border-current/30 text-white">
              {activeDeposit.amount && activeDeposit.amount > 0
                ? `$${activeDeposit.amount.toLocaleString()} USDT`
                : currentLang === 'ar'
                ? 'مبلغ مفتوح'
                : 'Open Amount'}
            </span>
            <span className="p-1.5 rounded-xl bg-slate-950/70 text-white">
              <ChevronRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
            </span>
          </div>
        </div>
      )}

      {/* Ticker / Announcement Bar */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 px-5 flex items-center space-x-3 rtl:space-x-reverse text-amber-200 text-xs sm:text-sm font-medium shadow-sm">
        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
        <p className="flex-1 line-clamp-1">
          {adminSettings.announcementMessage[currentLang]}
        </p>
      </div>

      {/* Main Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 lg:p-10 shadow-2xl">
        {/* Background Decorative Blur & Gradient */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center space-x-2 rtl:space-x-reverse px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>{t.lockupNoticeTitle}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              {t.tagline}
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
              {t.lockupNoticeText}
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); onOpenDeposit(); }}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm transition-all shadow-lg shadow-amber-500/25 flex items-center space-x-2 rtl:space-x-reverse cursor-pointer"
              >
                <DollarSign className="w-5 h-5" />
                <span>{t.navDeposit}</span>
              </button>

              <button
                type="button"
                onClick={(e) => { e.preventDefault(); onNavigateToPortfolio(); }}
                className="px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-sm border border-slate-700 transition-all flex items-center space-x-2 rtl:space-x-reverse cursor-pointer"
              >
                <span>{t.navPortfolio}</span>
                <ArrowUpRight className="w-4 h-4 text-amber-400" />
              </button>
            </div>
          </div>

          {/* Right Stats Grid */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3.5">
            
            {/* Stat 1: Total Invested */}
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-1 shadow-inner">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>{t.statActiveInvestments}</span>
                <TrendingUp className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-white font-mono">
                ${(user?.totalInvested || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </p>
              <p className="text-[10px] text-amber-400 font-semibold">+ Monthly Returns</p>
            </div>

            {/* Stat 2: Accrued Profit */}
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-1 shadow-inner">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>{t.accruedProfit}</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                ${(user?.totalRoiEarned || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-emerald-400 font-semibold">Ready to payout</p>
            </div>

            {/* Stat 3: Fixed Lockup Period */}
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-1 shadow-inner">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>{t.statLockupPeriod}</span>
                <Lock className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                5 {t.months}
              </p>
              <p className="text-[10px] text-slate-400">Fixed Min. Lockup</p>
            </div>

            {/* Stat 4: Fleet Vehicles Count */}
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-1 shadow-inner">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>{t.statTotalFleetCapital}</span>
                <Truck className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-white font-mono">
                $1,150,000
              </p>
              <p className="text-[10px] text-slate-400">Active Freight Units</p>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
};
