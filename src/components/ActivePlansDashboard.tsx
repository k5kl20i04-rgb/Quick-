import React, { useState } from 'react';
import { Investment, Project, Language, User, FreightTrip } from '../types';
import { FreightTripFeed } from './FreightTripFeed';
import { translations } from '../i18n/translations';
import {
  Truck,
  TrendingUp,
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  DollarSign,
  Info,
  Lock,
  Unlock,
} from 'lucide-react';

interface ActivePlansDashboardProps {
  currentLang: Language;
  investments: Investment[];
  projects: Project[];
  trips?: FreightTrip[];
  user: User | null;
  onOpenUpgradeModal: () => void;
  onRequestWithdrawal: (investmentId: string, destinationWallet: string) => Promise<void>;
  onRefreshState?: () => void;
}

export const ActivePlansDashboard: React.FC<ActivePlansDashboardProps> = ({
  currentLang,
  investments,
  projects,
  trips = [],
  user,
  onOpenUpgradeModal,
  onRequestWithdrawal,
  onRefreshState,
}) => {
  const t = translations[currentLang] || translations.ar;

  const [selectedInvestmentForExit, setSelectedInvestmentForExit] = useState<Investment | null>(null);
  const [walletAddr, setWalletAddr] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exitError, setExitError] = useState<string | null>(null);
  const [exitSuccess, setExitSuccess] = useState<string | null>(null);

  // Helper to calculate days remaining and percentage of 5-month maturity
  const calculateMaturity = (startDateIso: string, endDateIso: string) => {
    const start = new Date(startDateIso).getTime();
    const end = new Date(endDateIso).getTime();
    const now = new Date().getTime();

    const totalDuration = end - start;
    const elapsed = Math.max(0, now - start);
    const progressPercent = Math.min(100, Math.round((elapsed / totalDuration) * 100));

    const msRemaining = Math.max(0, end - now);
    const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
    const isMatured = now >= end;

    return { progressPercent, daysRemaining, isMatured };
  };

  // Active plans filtering
  const activePlans = investments.filter((i) => i.status === 'active');
  const completedPlans = investments.filter((i) => i.status === 'completed' || i.status === 'withdrawn');

  const totalAllocatedCapital = activePlans.reduce((sum, i) => sum + i.amount, 0);
  const totalAccruedRoi = activePlans.reduce((sum, i) => sum + i.accruedRoi, 0);

  const handleCancelAndReturnToInvestmentWallet = async (investmentId: string) => {
    setExitError(null);
    setExitSuccess(null);
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/cancel-investment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({ investmentId }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to cancel investment');
      }

      setExitSuccess(
        currentLang === 'ar'
          ? 'تم إلغاء الاشتراك بنجاح واستعادة رأس المال المخصص ($' + data.investment?.amount?.toLocaleString() + ' USDT) فوراً إلى محفظة الاستثمار.'
          : 'Subscription cancelled and capital returned to Investment Wallet.'
      );

      if (onRefreshState) onRefreshState();

      setTimeout(() => {
        setSelectedInvestmentForExit(null);
        setExitSuccess(null);
      }, 2000);
    } catch (err: any) {
      setExitError(err.message || 'Failed to cancel investment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExitCapital = async () => {
    if (!selectedInvestmentForExit) return;
    setExitError(null);
    setExitSuccess(null);

    if (!walletAddr.trim()) {
      setExitError(currentLang === 'ar' ? 'يرجى إدخال عنوان محفظة USDT لاستلام رأس المال' : 'Please enter destination USDT wallet address');
      return;
    }

    try {
      setIsSubmitting(true);
      await onRequestWithdrawal(selectedInvestmentForExit.id, walletAddr);
      setExitSuccess(
        currentLang === 'ar'
          ? 'تم إرسال طلب تصفية الخطة واسترداد رأس المال مع الأرباح بنجاح للمراجعة.'
          : 'Capital exit request submitted successfully to admin.'
      );
      setTimeout(() => setSelectedInvestmentForExit(null), 2000);
    } catch (err: any) {
      setExitError(err.message || 'Exit request failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Policy Notice Box - Lock-in Policy & Flexible Subscription */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-5 sm:p-6 text-xs space-y-3">
        <div className="flex items-center gap-2 text-amber-400 font-extrabold text-sm sm:text-base">
          <Info className="w-5 h-5 shrink-0" />
          <span>
            {currentLang === 'ar'
              ? 'سياسة تجميد أموال الاستثمار والاشتراك المرن (Fleet Investment Lock-in Policy)'
              : 'Fleet Investment Lock-in & Flexible Subscription Policy'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300 leading-relaxed">
          <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 space-y-1">
            <span className="font-bold text-amber-300 block flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-amber-400" />
              {currentLang === 'ar' ? '1. فترة تجميد الأموال (5 أشهر):' : '1. 5-Month Capital Lock-in:'}
            </span>
            <p className="text-[11px] text-slate-400">
              {currentLang === 'ar'
                ? 'تُحجز أموال الاستثمار المخصصة لتمويل عمليات تشغيل أسطول الشاحنات لمدة 5 أشهر كاملة لضمان استقرار عقود التوريد والسفرات.'
                : 'Investment funds for Fleet Operations Financing are locked for 5 months to guarantee haulage operations and trip contracts.'}
            </p>
          </div>

          <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 space-y-1">
            <span className="font-bold text-emerald-300 block flex items-center gap-1.5">
              <Unlock className="w-4 h-4 text-emerald-400" />
              {currentLang === 'ar' ? '2. الاشتراك المرن وخيار الخروج:' : '2. Flexible Subscription & Capital Exit:'}
            </span>
            <p className="text-[11px] text-slate-400">
              {currentLang === 'ar'
                ? 'بعد انقضاء فترة الـ 5 أشهر، يصبح الاشتراك مرناً تلقائياً. يمكنك الخروج وسحب رأس المال، ويترتب على الخروج إلغاء اشتراك الخطة فوراً ونقل الأموال لمحفظة الاستثمار.'
                : 'After 5 months, subscription becomes flexible. Withdrawing capital immediately cancels the active investment subscription and returns funds to your Investment Wallet.'}
            </p>
          </div>
        </div>
      </div>

      {/* Dashboard Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-3">
              <Truck className="w-3.5 h-3.5" />
              {currentLang === 'ar' ? 'لوحة الخطط النشطة واستثمارات الأسطول' : 'Active Plans & Investment Dashboard'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {currentLang === 'ar' ? 'خططك اللوجستية النشطة وجدول العد التنازلي' : 'Your Subscribed Transport Plans & Countdown'}
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              {currentLang === 'ar'
                ? 'متابعة حية ودقيقة لرأس المال المخصص، نسب العائد الشهري، العد التنازلي للتجميد (5 أشهر)، وخيارات الترقية والمخارج.'
                : 'Real-time overview of your allocated capital, monthly ROI yields, 5-month lockup progress countdown, and plan upgrade options.'}
            </p>
          </div>

          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onOpenUpgradeModal(); }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs shadow-xl shadow-amber-500/20 transition shrink-0"
          >
            <Zap className="w-4 h-4" />
            {currentLang === 'ar' ? 'ترقية / إضافة رأس مال خطة' : 'Upgrade Plan / Re-invest'}
          </button>
        </div>

        {/* Aggregate Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
            <span className="text-xs text-slate-400 block mb-1">{currentLang === 'ar' ? 'إجمالي رؤوس الأموال المخصصة' : 'Total Allocated Capital'}</span>
            <span className="text-2xl font-black text-amber-400 font-mono">${totalAllocatedCapital.toLocaleString()} USDT</span>
          </div>
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
            <span className="text-xs text-slate-400 block mb-1">{currentLang === 'ar' ? 'إجمالي الأرباح المتراكمة' : 'Total Accrued Yield'}</span>
            <span className="text-2xl font-black text-emerald-400 font-mono">+${totalAccruedRoi.toLocaleString()} USDT</span>
          </div>
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
            <span className="text-xs text-slate-400 block mb-1">{currentLang === 'ar' ? 'عدد الخطط النشطة' : 'Subscribed Active Plans'}</span>
            <span className="text-2xl font-black text-blue-400">{activePlans.length} {currentLang === 'ar' ? 'خطط تشغيلية' : 'Active Plans'}</span>
          </div>
        </div>
      </div>

      {/* Subscribed Active Plans List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-amber-400" />
          {currentLang === 'ar' ? 'تفاصيل الخطط والاشتراكات الحالية:' : 'Subscribed Active Transport Plans:'}
        </h2>

        {activePlans.length === 0 ? (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
            <Truck className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-lg font-bold text-slate-200">
              {currentLang === 'ar' ? 'لا توجد خطط استثمارية نشطة حالياً' : 'No Subscribed Active Investment Plans'}
            </h3>
            <p className="text-slate-400 text-xs max-w-md mx-auto">
              {currentLang === 'ar'
                ? 'استثمر في أساطيل الشاحنات والحافلات للبدء بتحصيل العوائد الشهرية بنسبة تصل إلى 5.0%.'
                : 'Explore our heavy freight and passenger fleet projects to launch your first logistics investment plan.'}
            </p>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); onOpenUpgradeModal(); }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition"
            >
              <Zap className="w-4 h-4" />
              {currentLang === 'ar' ? 'استكشاف الأساطيل والترقية' : 'Explore Fleet Plans'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activePlans.map((inv) => {
              const proj = projects.find((p) => p.id === inv.projectId);
              const { progressPercent, daysRemaining, isMatured } = calculateMaturity(
                inv.startDate,
                inv.endDate
              );
              const monthlyYieldUsdt = (inv.amount * inv.monthlyRoiPercent) / 100;

              return (
                <div
                  key={inv.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 shadow-xl space-y-5 transition relative overflow-hidden"
                >
                  {/* Status Badge */}
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold mb-2">
                        <CheckCircle2 className="w-3 h-3" />
                        {currentLang === 'ar' ? 'خطة نشطة وتعمل' : 'Active Plan'}
                      </div>
                      <h3 className="text-base font-extrabold text-white line-clamp-1">
                        {inv.projectTitle}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {inv.id}</p>
                    </div>

                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                      {proj?.expectedProfitRange || (typeof proj?.expectedProfit === 'string' ? proj.expectedProfit : proj?.expectedProfit?.ar) || 'أرباح الرحلات 🚚'}
                    </span>
                  </div>

                  {/* Allocated Capital & Yield Highlights */}
                  <div className="grid grid-cols-2 gap-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px] block">{currentLang === 'ar' ? 'رأس المال المخصص:' : 'Allocated Capital:'}</span>
                      <span className="text-amber-400 font-extrabold font-mono text-base">${inv.amount.toLocaleString()} USDT</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">{currentLang === 'ar' ? 'أرباح قابلة للسحب:' : 'Available Profits:'}</span>
                      <span className="text-emerald-400 font-extrabold font-mono text-base">+${inv.accruedRoi > 0 ? inv.accruedRoi.toLocaleString() : monthlyYieldUsdt.toFixed(2)} USDT</span>
                    </div>
                  </div>

                  {/* Trip & Logistic Freight Breakdown Box (عدد السفرات والشحن اللوجستي) */}
                  <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-300 font-semibold border-b border-slate-800 pb-2">
                      <span className="flex items-center gap-1.5 text-blue-400">
                        <Truck className="w-4 h-4" />
                        {currentLang === 'ar' ? 'تشغيل السفرات والشحن اللوجستي:' : 'Trips & Freight Logistics:'}
                      </span>
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        {currentLang === 'ar' ? 'عقود موثقة' : 'Verified Contracts'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <div>
                        <span className="text-slate-400 block">{currentLang === 'ar' ? 'عدد السفرات المكتملة:' : 'Completed Trips:'}</span>
                        <span className="text-white font-bold font-mono">
                          {inv.tripsCompleted || proj?.tripsPerMonth || 14} {currentLang === 'ar' ? 'سفرة شحن' : 'Trips'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">{currentLang === 'ar' ? 'عائد الشحن اللوجستي/سفرة:' : 'Freight Rate/Trip:'}</span>
                        <span className="text-emerald-400 font-bold font-mono">
                          ${(inv.freightRatePerTrip || proj?.freightRatePerTrip || 1250).toLocaleString()} USDT
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 5-Month Maturity Countdown Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        {currentLang === 'ar' ? 'مدة التجميد (5 أشهر):' : '5-Month Lockup Maturity:'}
                      </span>
                      <span className="font-mono text-slate-400 text-[11px]">
                        {isMatured
                          ? currentLang === 'ar' ? '✅ اكتملت المدة' : 'Matured'
                          : `${daysRemaining} ${currentLang === 'ar' ? 'يوم متبقي' : 'Days left'}`}
                      </span>
                    </div>

                    {/* Progress Track */}
                    <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800 p-0.5">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-slate-500 font-mono pt-1">
                      <span>{currentLang === 'ar' ? 'تاريخ البدء:' : 'Start:'} {new Date(inv.startDate).toLocaleDateString()}</span>
                      <span>{currentLang === 'ar' ? 'تاريخ الاستحقاق:' : 'Maturity:'} {new Date(inv.endDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Options: Profits Withdrawal & Capital Management */}
                  <div className="flex flex-col sm:flex-row items-center gap-2 border-t border-slate-800/80 pt-4">
                    {/* Withdraw Profits Only (Always Available) */}
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setSelectedInvestmentForExit(inv); }}
                      className="w-full sm:flex-1 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      {currentLang === 'ar' ? 'سحب الأرباح فقط (قابلة للسحب)' : 'Withdraw Profits Only'}
                    </button>

                    {/* Capital Management Options Button */}
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setSelectedInvestmentForExit(inv); }}
                      className="w-full sm:flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      {isMatured ? <Unlock className="w-3.5 h-3.5 text-emerald-400" /> : <Lock className="w-3.5 h-3.5 text-amber-400" />}
                      {currentLang === 'ar' ? 'خيارات رأس المال (سحب / استمرارية)' : 'Capital Options (Exit / Re-invest)'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Live Freight Trips Feed for Active Investor Fleet */}
        {activePlans.length > 0 && (
          <div className="pt-4">
            <FreightTripFeed currentLang={currentLang} trips={trips} />
          </div>
        )}
      </div>

      {/* Capital Exit & Profit Payout Request Modal */}
      {selectedInvestmentForExit && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative animate-fadeIn">
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); setSelectedInvestmentForExit(null); }}
              className="absolute top-4 left-4 rtl:right-4 rtl:left-auto text-slate-400 hover:text-white text-lg font-bold"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">
                  {currentLang === 'ar' ? 'خيارات الأرباح ورأس المال المستثمر' : 'Profit Payout & Capital Options'}
                </h3>
                <p className="text-xs text-slate-400">{selectedInvestmentForExit.projectTitle}</p>
              </div>
            </div>

            {/* Mode selection: Withdraw Profits vs Withdraw Capital vs Re-invest */}
            <div className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-300 block">
                {currentLang === 'ar' ? 'اختر العملية المطلوبة:' : 'Select Operation:'}
              </span>

              <div className="space-y-2">
                {/* Option 1: Withdraw Profits Only */}
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-emerald-400">
                      {currentLang === 'ar' ? '1. سحب الأرباح فقط (قابلة للسحب)' : '1. Withdraw Generated Profits'}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {currentLang === 'ar'
                        ? 'سحب عوائد السفرات المكتملة وشحن اللوجستي مع إبقاء رأس المال يعمل.'
                        : 'Withdraw trip & freight earnings while keeping principal active.'}
                    </div>
                  </div>
                  <span className="text-sm font-extrabold font-mono text-emerald-400 shrink-0">
                    +${(selectedInvestmentForExit.accruedRoi || (selectedInvestmentForExit.amount * selectedInvestmentForExit.monthlyRoiPercent / 100)).toLocaleString()} USDT
                  </span>
                </div>

                {/* Option 2: Withdraw Capital */}
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Unlock className="w-3.5 h-3.5" />
                      {currentLang === 'ar' ? '2. سحب رأس المال المخصص' : '2. Withdraw Principal Capital'}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {currentLang === 'ar'
                        ? 'طلب تصفية واسترداد رأس المال بالكامل بعد انقضاء فترة التجميد.'
                        : 'Request full principal return upon maturity.'}
                    </div>
                  </div>
                  <span className="text-sm font-extrabold font-mono text-white shrink-0">
                    ${selectedInvestmentForExit.amount.toLocaleString()} USDT
                  </span>
                </div>

                {/* Option 3: Re-invest / Continue Investment */}
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      {currentLang === 'ar' ? '3. الاستمرارية في الاستثمار (إعادة التشغيل)' : '3. Re-invest / Continue Investment'}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {currentLang === 'ar'
                        ? 'تجديد العقد تلقائياً لاستمرار تشغيل الأسطول بالسفرات اللوجستية القادمة.'
                        : 'Rollover principal to execute ongoing trip cycles.'}
                    </div>
                  </div>
                  <span className="text-xs font-bold text-blue-400 shrink-0">
                    {currentLang === 'ar' ? 'استمرار الأرباح ⚡' : 'Ongoing ROI ⚡'}
                  </span>
                </div>
              </div>
            </div>

            {/* Instant Cancel & Capital Exit Action Card */}
            <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl space-y-3">
              <div className="flex items-start gap-2 text-amber-300">
                <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
                <div className="text-xs space-y-1">
                  <span className="font-extrabold block text-amber-200">
                    {currentLang === 'ar' ? 'تنبيه إلغاء الاشتراك وسحب رأس المال:' : 'Subscription Cancellation Notice:'}
                  </span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {currentLang === 'ar'
                      ? 'إن سحب رأس المال المخصص من الخطة سيترتب عليه إلغاء الاشتراك الاستثماري فوراً وبشكل دائم، وسيتم تحويل المبالغ تلقائياً إلى محفظة الاستثمار الخاصة بك.'
                      : 'Withdrawing principal capital immediately and permanently cancels your active investment subscription. Funds are returned to your Investment Wallet.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={(e) => {
                  e.preventDefault();
                  handleCancelAndReturnToInvestmentWallet(selectedInvestmentForExit.id);
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-amber-600 hover:from-rose-600 hover:to-amber-500 text-white font-extrabold text-xs shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Unlock className="w-4 h-4" />
                <span>
                  {currentLang === 'ar'
                    ? `إلغاء الاشتراك وإعادة $${selectedInvestmentForExit.amount.toLocaleString()} USDT لمحفظة الاستثمار`
                    : `Cancel Subscription & Return $${selectedInvestmentForExit.amount.toLocaleString()} USDT to Investment Wallet`}
                </span>
              </button>
            </div>

            <div className="border-t border-slate-800 pt-4 space-y-3">
              <span className="text-xs font-bold text-slate-300 block">
                {currentLang === 'ar' ? 'أو طلب سحب الأرباح / رأس المال إلى محفظة خارجية:' : 'Or Request Payout to External USDT Wallet:'}
              </span>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  {currentLang === 'ar' ? 'عنوان محفظة USDT (TRC20 / BEP20) الخارجي:' : 'External USDT Wallet Address:'}
                </label>
                <input
                  type="text"
                  value={walletAddr}
                  onChange={(e) => setWalletAddr(e.target.value)}
                  placeholder="TWrL1xK9PzQq8v7sJmNp2bX4yZaR3cT5uV"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500"
                />
              </div>

              {exitError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                  {exitError}
                </div>
              )}

              {exitSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  {exitSuccess}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setSelectedInvestmentForExit(null); }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  {currentLang === 'ar' ? 'إغلاق' : 'Close'}
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={(e) => { e.preventDefault(); handleExitCapital(); }}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-extrabold transition shadow-lg shadow-amber-500/20"
                >
                  {isSubmitting ? (
                    <Clock className="w-4 h-4 animate-spin mx-auto" />
                  ) : currentLang === 'ar' ? (
                    'إرسال طلب السحب الخارجي'
                  ) : (
                    'Submit External Payout Request'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
