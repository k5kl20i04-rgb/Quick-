import React, { useState, useMemo, memo } from 'react';
import {
  Wallet,
  DollarSign,
  TrendingUp,
  Truck,
  ArrowUpRight,
  ShieldCheck,
  PlusCircle,
  Calendar,
  Zap,
  CheckCircle2,
  Clock,
  Users,
  LayoutGrid,
  AlertCircle,
  Sparkles,
  Unlock,
  ChevronRight,
  Info,
  Building2,
  RefreshCw,
  Gift,
} from 'lucide-react';
import {
  Project,
  User,
  Investment,
  DepositRequest,
  AdminSettings,
  Language,
  VehicleCategory,
} from '../types';
import { translations } from '../i18n/translations';
import { ProjectCard } from './ProjectCard';
import { ROIAnalytics } from './ROIAnalytics';
import { NewsSection } from './NewsSection';

interface DashboardViewProps {
  currentLang: Language;
  user: User;
  projects: Project[];
  investments: Investment[];
  deposits: DepositRequest[];
  adminSettings: AdminSettings | null;
  onOpenDeposit: () => void;
  onOpenWithdrawal: () => void;
  onSelectInvest: (project: Project) => void;
  onRequestWithdrawal: (investmentId: string, destinationWallet: string) => Promise<void>;
  onOpenUpgradeModal: () => void;
  onNavigateToPortfolio: () => void;
  onOpenReferralModal?: () => void;
}

const DashboardViewComponent: React.FC<DashboardViewProps> = ({
  currentLang,
  user,
  projects,
  investments,
  deposits,
  adminSettings,
  onOpenDeposit,
  onOpenWithdrawal,
  onSelectInvest,
  onRequestWithdrawal,
  onOpenUpgradeModal,
  onNavigateToPortfolio,
  onOpenReferralModal,
}) => {
  const t = translations[currentLang] || translations.ar;
  const isRtl = currentLang === 'ar' || currentLang === 'ckb';

  // State for Main Tabs: 'opportunities' (الاستثمارات المتاحة) vs 'my_investments' (استثماراتي المشترِك بها)
  const [activeTab, setActiveTab] = useState<'opportunities' | 'my_investments'>('opportunities');

  // Category filter for Opportunities tab
  const [categoryFilter, setCategoryFilter] = useState<'all' | VehicleCategory>('all');

  // User's active investments
  const userInvestments = useMemo(
    () => investments.filter((i) => Boolean(user) && i.userId === user?.id),
    [investments, user?.id]
  );
  
  const activeSubscribedInvestments = useMemo(
    () => userInvestments.filter((i) => i.status === 'active' || i.status === 'completed'),
    [userInvestments]
  );

  // Filtered available projects (memoized)
  const availableProjects = useMemo(
    () =>
      projects.filter((p) => {
        if (categoryFilter === 'all') return true;
        return p.category === categoryFilter;
      }),
    [projects, categoryFilter]
  );


  // Calculate user total metrics
  const totalAllocatedCapital = userInvestments
    .filter((i) => i.status === 'active')
    .reduce((sum, i) => sum + i.amount, 0);

  const estimatedMonthlyYield = userInvestments
    .filter((i) => i.status === 'active')
    .reduce((sum, i) => sum + (i.amount * i.monthlyRoiPercent) / 100, 0);

  // Find user's active in-progress deposit request for top notification banner
  const userDeposits = deposits.filter((d) => Boolean(user) && d.userId === user?.id);
  const activeDeposit = userDeposits.find(
    (d) =>
      d.status === 'pending_approval' ||
      d.status === 'pending' ||
      d.status === 'unlocked' ||
      d.status === 'in_discussion' ||
      d.status === 'submitted'
  );

  // Helper for 5-month lockup maturity progress
  const calculateMaturity = (startDateIso: string, endDateIso: string) => {
    const start = new Date(startDateIso).getTime();
    const end = new Date(endDateIso).getTime();
    const now = new Date().getTime();

    const totalDuration = end - start || 1;
    const elapsed = Math.max(0, now - start);
    const progressPercent = Math.min(100, Math.round((elapsed / totalDuration) * 100));

    const msRemaining = Math.max(0, end - now);
    const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
    const isMatured = now >= end;

    return { progressPercent, daysRemaining, isMatured };
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* 1. Active Deposit Notification Banner (If Pending / In Progress) */}
      {activeDeposit && (
        <div
          onClick={onOpenDeposit}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
            activeDeposit.status === 'unlocked' || activeDeposit.status === 'in_discussion'
              ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200 hover:bg-emerald-500/20 shadow-emerald-500/10'
              : activeDeposit.status === 'submitted'
              ? 'bg-blue-500/15 border-blue-500/50 text-blue-200 hover:bg-blue-500/20 shadow-blue-500/10'
              : 'bg-amber-500/15 border-amber-500/50 text-amber-200 hover:bg-amber-500/20 shadow-amber-500/10'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-950/80 border border-current/30 flex items-center justify-center shrink-0">
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
                <span className="font-black text-sm text-white">
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
              <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">
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
            <span className="text-xs font-black px-3 py-1.5 rounded-xl bg-slate-950/80 border border-current/30 text-white font-mono">
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

      {/* Announcement Bar */}
      {adminSettings?.announcementMessage?.[currentLang] && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 px-5 flex items-center space-x-3 rtl:space-x-reverse text-amber-200 text-xs sm:text-sm font-medium shadow-sm">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="flex-1 line-clamp-1">
            {adminSettings.announcementMessage[currentLang]}
          </p>
        </div>
      )}

      {/* 2. PROMINENT AVAILABLE BALANCE CARD (رصيد متاح للسحب) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-8 lg:p-10 shadow-2xl space-y-8">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
          
          {/* Dual Wallets Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full lg:w-auto">
            {/* Main Wallet Box */}
            <div className="bg-slate-950/80 border border-blue-500/30 p-4 rounded-2xl space-y-1.5 shadow-inner min-w-[200px]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5" />
                  {currentLang === 'ar' ? 'المحفظة الرئيسية' : 'Main Wallet'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold">
                  {currentLang === 'ar' ? 'حفظ المبالغ' : 'Storage'}
                </span>
              </div>
              <p className="text-2xl font-black text-white font-mono tracking-tight">
                ${((user?.mainBalance !== undefined ? user.mainBalance : user?.usdtBalance) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-slate-400">
                {currentLang === 'ar' ? 'مخصصة لحفظ وتخزين المبالغ العامة' : 'For storing general funds'}
              </p>
            </div>

            {/* Investment Wallet Box */}
            <div className="bg-slate-950/80 border border-emerald-500/30 p-4 rounded-2xl space-y-1.5 shadow-inner min-w-[200px]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  {currentLang === 'ar' ? 'محفظة الاستثمار' : 'Investment Wallet'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                  {currentLang === 'ar' ? 'جاهز للاستثمار/السحب' : 'Invest / Withdraw'}
                </span>
              </div>
              <p className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
                ${((user?.investmentBalance !== undefined ? user.investmentBalance : user?.usdtBalance) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-slate-400">
                {currentLang === 'ar' ? 'مخصصة للخطط والاستثمارات والسحب' : 'Used for plans, ROI & payouts'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Primary Action Button: Withdraw */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onOpenWithdrawal();
              }}
              className="flex-1 sm:flex-none px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowUpRight className="w-5 h-5" />
              <span>{currentLang === 'ar' ? 'طلب سحب' : 'Withdraw'}</span>
            </button>

            {/* Deposit Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onOpenDeposit();
              }}
              className="flex-1 sm:flex-none px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-5 h-5" />
              <span>{currentLang === 'ar' ? 'إيداع USDT' : 'Deposit USDT'}</span>
            </button>

            {/* Referral Rewards Button */}
            {onOpenReferralModal && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onOpenReferralModal();
                }}
                className="flex-1 sm:flex-none px-5 py-3.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Gift className="w-5 h-5 text-amber-400" />
                <span>{currentLang === 'ar' ? 'دعوة أصدقاء لكسب مكافآت 🎁' : 'Referral Rewards 🎁'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub-metrics Row */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Sub-metric 1: Total Profits (إجمالي الأرباح) */}
          <div className="bg-slate-950/70 border border-slate-800/90 p-4 rounded-2xl space-y-1.5 shadow-inner">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>{currentLang === 'ar' ? 'إجمالي الأرباح' : 'Total Profits'}</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
              +${(user?.totalRoiEarned || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT
            </p>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400/80 font-semibold">
              <Sparkles className="w-3 h-3" />
              <span>{currentLang === 'ar' ? 'عائدات شهرية متراكمة' : 'Accumulated Yield'}</span>
            </div>
          </div>

          {/* Sub-metric 2: Invested Capital (رأس المال المستثمر) */}
          <div className="bg-slate-950/70 border border-slate-800/90 p-4 rounded-2xl space-y-1.5 shadow-inner">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>{currentLang === 'ar' ? 'رأس المال المستثمر' : 'Invested Capital'}</span>
              <Truck className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
              ${(user?.totalInvested || totalAllocatedCapital).toLocaleString('en-US', { minimumFractionDigits: 0 })} USDT
            </p>
            <div className="flex items-center gap-1 text-[11px] text-amber-400/80 font-semibold">
              <ShieldCheck className="w-3 h-3" />
              <span>{currentLang === 'ar' ? 'مخصص بعقود 5 أشهر' : 'Allocated in 5-Mo Locks'}</span>
            </div>
          </div>

          {/* Sub-metric 3: Estimated Monthly Yield (العائد الشهري التقديري) */}
          <div className="bg-slate-950/70 border border-slate-800/90 p-4 rounded-2xl space-y-1.5 shadow-inner">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>{currentLang === 'ar' ? 'العائد الشهري التقديري' : 'Est. Monthly Yield'}</span>
              <Zap className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-blue-400 font-mono">
              +${estimatedMonthlyYield.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT
            </p>
            <div className="flex items-center gap-1 text-[11px] text-blue-400/80 font-semibold">
              <Calendar className="w-3 h-3" />
              <span>{currentLang === 'ar' ? 'صرف تلقائي منتظم' : 'Regular Monthly Payouts'}</span>
            </div>
          </div>

        </div>
      </div>

      {/* 3. TABBED NAVIGATION STRUCTURE */}
      <div className="space-y-6">
        
        {/* Navigation Tabs Header Bar */}
        <div className="bg-slate-900 border border-slate-800 p-2 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xl">
          <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-xl">
            
            {/* Tab 1: Available Opportunities (الاستثمارات المتاحة) */}
            <button
              type="button"
              onClick={() => setActiveTab('opportunities')}
              className={`flex-1 sm:flex-none px-5 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'opportunities'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>{currentLang === 'ar' ? 'الاستثمارات المتاحة' : 'Available Opportunities'}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  activeTab === 'opportunities' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {availableProjects.length}
              </span>
            </button>

            {/* Tab 2: My Active Investments (استثماراتي المشترِك بها) */}
            <button
              type="button"
              onClick={() => setActiveTab('my_investments')}
              className={`flex-1 sm:flex-none px-5 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'my_investments'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{currentLang === 'ar' ? 'استثماراتي المشترِك بها' : 'My Active Investments'}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  activeTab === 'my_investments' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {activeSubscribedInvestments.length}
              </span>
            </button>

          </div>

          <div className="text-xs text-slate-400 font-medium px-3 flex items-center gap-1.5 self-center">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{currentLang === 'ar' ? 'سياسة حجز 5 أشهر مع عائد شهري ثابت' : '5-Month Capital Lockup Policy'}</span>
          </div>
        </div>

        {/* TAB 1 CONTENT: AVAILABLE OPPORTUNITIES (الاستثمارات المتاحة) */}
        {activeTab === 'opportunities' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Logistics Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  categoryFilter === 'all'
                    ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{t.filterAll} ({projects.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setCategoryFilter('cargo_freight')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  categoryFilter === 'cargo_freight'
                    ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>{t.filterCargo}</span>
              </button>

              <button
                type="button"
                onClick={() => setCategoryFilter('passenger_transport')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  categoryFilter === 'passenger_transport'
                    ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>{t.filterPassenger}</span>
              </button>
            </div>

            {/* Opportunities Cards Grid */}
            {availableProjects.length === 0 ? (
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
                <Truck className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-slate-200">
                  {currentLang === 'ar' ? 'لا توجد أساطيل متبقية في هذا التصنيف حالياً' : 'No available fleets in this category'}
                </h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    currentLang={currentLang}
                    onSelectInvest={onSelectInvest}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2 CONTENT: MY ACTIVE INVESTMENTS (استثماراتي المشترِك بها) */}
        {activeTab === 'my_investments' && (
          <div className="space-y-6 animate-fadeIn">
            {activeSubscribedInvestments.length === 0 ? (
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-10 sm:p-14 text-center space-y-5 shadow-xl">
                <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
                  <Truck className="w-8 h-8" />
                </div>

                <div className="space-y-2 max-w-md mx-auto">
                  <h3 className="text-xl font-extrabold text-white">
                    {currentLang === 'ar' ? 'لا توجد لديك استثمارات نشطة حتى الآن' : 'No Active Subscribed Investments Yet'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {currentLang === 'ar'
                      ? 'اختر من بين أساطيل الشاحنات وحافلات نقل الركاب المتاحة للاكتتاب للبدء بتلقي عوائد شهرية موثوقة بنسبة تصل إلى 5.0%.'
                      : 'Choose from our available truck and passenger fleet pools to launch your first investment plan.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('opportunities')}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-xl shadow-amber-500/20 transition cursor-pointer"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span>{currentLang === 'ar' ? 'استكشف الفرص المتاحة الآن' : 'Explore Available Opportunities'}</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeSubscribedInvestments.map((inv) => {
                  const proj = projects.find((p) => p.id === inv.projectId);
                  const { progressPercent, daysRemaining, isMatured } = calculateMaturity(
                    inv.startDate,
                    inv.endDate
                  );
                  const monthlyYieldUsdt = (inv.amount * inv.monthlyRoiPercent) / 100;

                  return (
                    <div
                      key={inv.id}
                      className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 shadow-xl space-y-5 transition relative overflow-hidden flex flex-col justify-between"
                    >
                      <div className="space-y-4">
                        {/* Status Badge & Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold mb-1.5">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{currentLang === 'ar' ? 'نشط وتعمل' : 'Active & Operational'}</span>
                            </div>
                            <h3 className="text-base font-extrabold text-white line-clamp-1">
                              {inv.projectTitle}
                            </h3>
                            <p className="text-[11px] text-slate-400 font-mono">ID: {inv.id}</p>
                          </div>

                          <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0 font-mono">
                            +{inv.monthlyRoiPercent}% {currentLang === 'ar' ? 'شهرياً' : '/mo'}
                          </span>
                        </div>

                        {/* Invested Amount & Monthly Payout */}
                        <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 font-mono">
                          <div>
                            <span className="text-[10px] text-slate-400 block mb-0.5">
                              {currentLang === 'ar' ? 'رأس المال المستثمر' : 'Invested Amount'}
                            </span>
                            <span className="text-lg font-black text-white">
                              ${inv.amount.toLocaleString()} USDT
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 block mb-0.5">
                              {currentLang === 'ar' ? 'العائد الشهري' : 'Monthly Payout'}
                            </span>
                            <span className="text-lg font-black text-emerald-400">
                              +${monthlyYieldUsdt.toFixed(2)} USDT
                            </span>
                          </div>
                        </div>

                        {/* Lockup Countdown Progress Bar */}
                        <div className="space-y-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-400 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                              <span>{currentLang === 'ar' ? 'اكتمال فترة الحجز (5 أشهر):' : 'Lockup Progress (5 Months):'}</span>
                            </span>
                            <span className="text-amber-400 font-mono">{progressPercent}%</span>
                          </div>

                          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-700"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>

                          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                            <span>{new Date(inv.startDate).toLocaleDateString()}</span>
                            <span className="text-amber-300 font-bold">
                              {isMatured
                                ? currentLang === 'ar'
                                  ? 'مكتملة الحجز — جاهز للتصفية'
                                  : 'Matured — Ready to exit'
                                : `${daysRemaining} ${currentLang === 'ar' ? 'يوم متبقي' : 'days left'}`}
                            </span>
                            <span>{new Date(inv.endDate).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* Accumulated Profit */}
                        <div className="flex items-center justify-between px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs">
                          <span className="text-emerald-300 font-semibold">
                            {currentLang === 'ar' ? 'الأرباح المتراكمة الخطة:' : 'Accumulated Plan Profit:'}
                          </span>
                          <span className="text-emerald-400 font-black font-mono">
                            +${(inv.accruedRoi || 0).toLocaleString()} USDT
                          </span>
                        </div>
                      </div>

                      {/* Card Action Footer */}
                      <div className="pt-2 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            onOpenWithdrawal();
                          }}
                          className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{currentLang === 'ar' ? 'طلب سحب الأرباح' : 'Withdraw Profits'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            onOpenUpgradeModal();
                          }}
                          className="py-2.5 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-amber-500/30"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>{currentLang === 'ar' ? 'ترقية / إضافة' : 'Upgrade'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* 4. Official News & Platform Announcements */}
      <NewsSection currentLang={currentLang} />

      {/* 5. ROI Telemetry & Yield Analytics */}
      <ROIAnalytics currentLang={currentLang} user={user} />

    </div>
  );
};

export const DashboardView = memo(DashboardViewComponent);

