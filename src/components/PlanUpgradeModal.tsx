import React, { useState } from 'react';
import { Project, Investment, User, Language } from '../types';
import { translations } from '../i18n/translations';
import {
  Sparkles,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Truck,
  DollarSign,
  AlertCircle,
  Zap,
} from 'lucide-react';

interface PlanUpgradeModalProps {
  currentLang: Language;
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  investments: Investment[];
  user: User | null;
  onUpgradeConfirm: (projectId: string, investmentId: string | null, additionalAmount: number) => Promise<void>;
  onOpenDepositModal: () => void;
}

export const PlanUpgradeModal: React.FC<PlanUpgradeModalProps> = ({
  currentLang,
  isOpen,
  onClose,
  projects,
  investments,
  user,
  onUpgradeConfirm,
  onOpenDepositModal,
}) => {
  const t = translations[currentLang] || translations.ar;

  // Selected project for upgrade / reinvest
  const activeProjects = projects.filter((p) => p.status === 'active');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    activeProjects[0]?.id || projects[0]?.id || ''
  );

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  // Optional: check if user already has an active investment in this project to upgrade
  const existingInvestment = investments.find(
    (i) => i.projectId === selectedProjectId && i.status === 'active'
  );

  const minAmt = selectedProject?.minInvestment || 500;
  const [additionalAmount, setAdditionalAmount] = useState<number>(minAmt);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculations
  const monthlyProfit = (additionalAmount * (selectedProject?.monthlyRoiPercent || 4.5)) / 100;
  const total5MonthYield = monthlyProfit * 5;
  const userBalance = user?.usdtBalance || 0;
  const hasSufficientBalance = userBalance >= additionalAmount;

  const handleConfirm = async () => {
    setErrorMsg(null);
    if (!user) {
      setErrorMsg(currentLang === 'ar' ? 'يرجى تسجيل الدخول أولاً' : 'Please login first');
      return;
    }

    if (user?.kycStatus !== 'approved') {
      setErrorMsg(
        currentLang === 'ar'
          ? 'تنبيه: يتطلب الترقية وإعادة الاستثمار توثيق الهوية (KYC) المعتمد.'
          : 'KYC identity verification is required before upgrading plans.'
      );
      return;
    }

    if (additionalAmount < minAmt) {
      setErrorMsg(
        currentLang === 'ar'
          ? `الحد الأدنى للترقية أو الاستثمار هو $${minAmt} USDT`
          : `Minimum amount is $${minAmt} USDT`
      );
      return;
    }

    if (!hasSufficientBalance) {
      setErrorMsg(
        currentLang === 'ar'
          ? 'رصيد محفظتك غير كافٍ. يرجى إيداع USDT أولاً.'
          : 'Insufficient USDT balance. Please deposit funds first.'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await onUpgradeConfirm(
        selectedProjectId,
        existingInvestment ? existingInvestment.id : null,
        additionalAmount
      );
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Upgrade failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl max-w-3xl w-full p-4 sm:p-6 lg:p-8 shadow-2xl space-y-4 sm:space-y-6 relative animate-fadeIn my-auto max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onClose();
          }}
          className="absolute top-3.5 left-3.5 sm:top-5 sm:left-5 rtl:right-3.5 sm:rtl:right-5 rtl:left-auto text-slate-400 hover:text-white text-lg sm:text-xl font-bold bg-slate-800 hover:bg-slate-700 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition shrink-0 z-10 cursor-pointer"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 sm:gap-3 border-b border-slate-800 pb-4 pr-8 rtl:pr-0 rtl:pl-8">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] sm:text-[11px] font-bold">
              <Sparkles className="w-3 h-3" />
              <span>{currentLang === 'ar' ? 'ترقية الأسطول وإعادة الاستثمار' : 'Plan Upgrade & Re-investment'}</span>
            </div>
            <h2 className="text-base sm:text-xl lg:text-2xl font-extrabold text-white mt-0.5 sm:mt-1 truncate">
              {currentLang === 'ar' ? 'اختر خطة النقل الأعلى وترقية العوائد' : 'Select Transport Tier & Boost Yield'}
            </h2>
          </div>
        </div>

        {/* Tier Selector Options */}
        <div className="space-y-2.5 sm:space-y-3">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            {currentLang === 'ar' ? '1. اختر فئة أسطول النقل المراد الترقية إليها:' : '1. Select Transport Fleet Tier:'}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            {projects.map((proj) => {
              const titleText = proj.title[currentLang] || proj.title.ar;
              const isSelected = proj.id === selectedProjectId;

              return (
                <div
                  key={proj.id}
                  onClick={() => {
                    setSelectedProjectId(proj.id);
                    if (additionalAmount < proj.minInvestment) {
                      setAdditionalAmount(proj.minInvestment);
                    }
                  }}
                  className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border cursor-pointer transition relative ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-extrabold text-white line-clamp-1">{titleText}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                      {proj.monthlyRoiPercent}% {currentLang === 'ar' ? 'شهرياً' : '/mo'}
                    </span>
                  </div>

                  <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1.5 sm:mt-2 line-clamp-1">
                    {proj.vehicleType} • {proj.capacitySpecs}
                  </p>

                  <div className="mt-2.5 sm:mt-3 flex items-center justify-between text-[10px] sm:text-[11px] border-t border-slate-800/80 pt-2 text-slate-400">
                    <span>{currentLang === 'ar' ? 'الحد الأدنى:' : 'Min:'} ${proj.minInvestment}</span>
                    <span className="text-amber-400 font-bold">5 {currentLang === 'ar' ? 'أشهر تجميد' : 'Mos Lockup'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Amount Allocation Slider & Input */}
        {selectedProject && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-2">
              <label className="text-xs font-bold text-slate-200">
                {currentLang === 'ar' ? '2. حدد مبلغ الترقية / رأس المال الإضافي (USDT):' : '2. Enter Upgrade Capital Amount (USDT):'}
              </label>
              <div className="text-[11px] sm:text-xs text-slate-400">
                {currentLang === 'ar' ? 'رصيد محفظتك المتاح:' : 'Available Wallet Balance:'}{' '}
                <span className="text-amber-400 font-bold font-mono">${userBalance.toLocaleString()} USDT</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400 font-bold text-sm">$</span>
                <input
                  type="number"
                  min={minAmt}
                  step={100}
                  value={additionalAmount}
                  onChange={(e) => setAdditionalAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-900 border border-slate-700 text-white font-mono font-bold text-base sm:text-lg rounded-xl pl-8 pr-16 py-2.5 sm:py-3 focus:outline-none focus:border-amber-500"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">USDT</span>
              </div>

              {/* Quick Select Buttons */}
              <div className="grid grid-cols-4 gap-1 sm:flex sm:gap-1.5 shrink-0">
                {[500, 1000, 2500, 5000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setAdditionalAmount(preset);
                    }}
                    className="px-2 sm:px-2.5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition text-center cursor-pointer"
                  >
                    +${preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Projected Yield Summary Box */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 bg-slate-900/90 p-3 sm:p-4 rounded-xl border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] sm:text-[11px] block">{currentLang === 'ar' ? 'العائد الشهري المتوقع:' : 'Est. Monthly Return:'}</span>
                <span className="text-emerald-400 font-bold font-mono text-xs sm:text-sm">+${monthlyProfit.toFixed(2)} USDT / {currentLang === 'ar' ? 'شهر' : 'mo'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] sm:text-[11px] block">{currentLang === 'ar' ? 'إجمالي أرباح 5 أشهر:' : '5-Month Total Yield:'}</span>
                <span className="text-amber-400 font-bold font-mono text-xs sm:text-sm">+${total5MonthYield.toFixed(2)} USDT</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] sm:text-[11px] block">{currentLang === 'ar' ? 'مدة التجميد الإجبارية:' : 'Lockup Period:'}</span>
                <span className="text-slate-200 font-bold text-xs sm:text-sm">5 {currentLang === 'ar' ? 'أشهر ثابتة' : 'Months Fixed'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Deposit Warning if insufficient balance */}
        {!hasSufficientBalance && (
          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs text-amber-300">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-amber-400" />
              <span className="text-[11px] sm:text-xs">
                {currentLang === 'ar'
                  ? 'رصيدك الحالي غير كافٍ لتغطية هذه الترقية. يمكنك إجراء إيداع سريع الآن.'
                  : 'Your balance is below the requested upgrade amount. You can deposit USDT now.'}
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onClose();
                onOpenDepositModal();
              }}
              className="px-3 py-1.5 rounded-lg sm:rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 transition self-end sm:self-auto cursor-pointer"
            >
              {currentLang === 'ar' ? 'إيداع USDT الآن' : 'Deposit Now'}
            </button>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Modal Action Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 border-t border-slate-800 pt-4 sm:pt-5">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onClose();
            }}
            className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
          >
            {currentLang === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>

          <button
            type="button"
            disabled={isSubmitting || !hasSufficientBalance}
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <Clock className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            {existingInvestment
              ? currentLang === 'ar'
                ? `تأكيد زيادة رأس المال (+$${additionalAmount})`
                : `Confirm Capital Addition (+$${additionalAmount})`
              : currentLang === 'ar'
              ? `تأكيد الاشتراك وترقية الأسطول ($${additionalAmount})`
              : `Confirm Plan Upgrade ($${additionalAmount})`}
          </button>
        </div>
      </div>
    </div>
  );
};
