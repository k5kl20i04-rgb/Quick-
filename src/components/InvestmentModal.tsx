import React, { useState } from 'react';
import { X, Lock, Calculator, ShieldCheck, AlertCircle, CheckCircle2, Wallet, ArrowRight, FileText, ArrowLeftRight, TrendingUp } from 'lucide-react';
import { Project, Language, User } from '../types';
import { translations } from '../i18n/translations';
import { InvestmentAgreementModal } from './InvestmentAgreementModal';

interface InvestmentModalProps {
  project: Project;
  currentLang: Language;
  user: User;
  onClose: () => void;
  onConfirmInvest: (amount: number) => Promise<void>;
  onOpenDeposit: () => void;
  onOpenKYC: () => void;
  onOpenTransferModal?: () => void;
}

export const InvestmentModal: React.FC<InvestmentModalProps> = ({
  project,
  currentLang,
  user,
  onClose,
  onConfirmInvest,
  onOpenDeposit,
  onOpenKYC,
  onOpenTransferModal,
}) => {
  const t = translations[currentLang] || translations.ar;

  const [amount, setAmount] = useState<number>(project.minInvestment);
  const [agreedToLockup, setAgreedToLockup] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showAgreementModal, setShowAgreementModal] = useState<boolean>(false);

  const titleText = project.title[currentLang] || project.title.ar;

  // Monthly return = amount * ROI / 100
  const monthlyProfit = (amount * project.monthlyRoiPercent) / 100;
  // 5 Months total return = monthlyProfit * 5
  const total5MonthProfit = monthlyProfit * 5;
  const totalCapitalExit = amount + total5MonthProfit;

  const investmentBalance = user?.investmentBalance ?? user?.usdtBalance ?? 0;
  const mainBalance = user?.mainBalance ?? 0;

  const isBalanceSufficient = investmentBalance >= amount;
  const isKycApproved = user?.kycStatus === 'approved';

  const handleInvest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isKycApproved) {
      setErrorMsg(t.kycRequiredNotice);
      return;
    }

    if (!isBalanceSufficient) {
      setErrorMsg(t.insufficientBalance);
      return;
    }

    if (amount < project.minInvestment) {
      setErrorMsg(`${t.minInvestment}: $${project.minInvestment}`);
      return;
    }

    if (!agreedToLockup) {
      setErrorMsg(t.lockupAgreementCheckbox);
      return;
    }

    try {
      setLoading(true);
      await onConfirmInvest(amount);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Investment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl max-w-xl w-full p-4 sm:p-6 lg:p-8 shadow-2xl space-y-4 sm:space-y-6 relative my-auto max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 sm:pb-4 gap-2">
            <div className="flex items-center space-x-2.5 sm:space-x-3 rtl:space-x-reverse min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Calculator className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-lg font-black text-white truncate">{t.investModalTitle}</h2>
                <p className="text-[10px] sm:text-xs text-slate-400 truncate">{titleText}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); onClose(); }}
              className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all shrink-0"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form noValidate onSubmit={handleInvest} className="space-y-4 sm:space-y-6">
            
            {/* User Dual Balance Overview Bar */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-300">
                <div className="flex items-center space-x-2 rtl:space-x-reverse min-w-0">
                  <Wallet className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="truncate">{currentLang === 'ar' ? 'رصيد محفظة الاستثمار:' : 'Investment Wallet:'}</span>
                  <span className="font-extrabold text-amber-400 font-mono text-sm">
                    ${investmentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT
                  </span>
                </div>
                {!isBalanceSufficient && (
                  <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                    {currentLang === 'ar' ? 'غير كافٍ' : 'Insufficient'}
                  </span>
                )}
              </div>

              {!isBalanceSufficient && (
                <div className="pt-2 border-t border-slate-900 flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-slate-400">
                    {currentLang === 'ar'
                      ? `رصيدك في المحفظة الرئيسية: $${mainBalance.toLocaleString()} USDT`
                      : `Main Wallet Balance: $${mainBalance.toLocaleString()} USDT`}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {mainBalance > 0 && onOpenTransferModal && (
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); onClose(); onOpenTransferModal(); }}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 font-bold border border-amber-500/30 flex items-center gap-1"
                      >
                        <ArrowLeftRight className="w-3 h-3" />
                        <span>{currentLang === 'ar' ? 'تحويل' : 'Transfer'}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); onClose(); onOpenDeposit(); }}
                      className="text-emerald-400 hover:underline font-bold"
                    >
                      + {t.navDeposit}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Amount Input & Preset Buttons */}
            <div className="space-y-2 sm:space-y-3">
              <label className="block text-xs font-bold text-slate-300">
                {t.enterAmountUsdt}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 pl-3.5 rtl:pl-0 rtl:pr-3.5 flex items-center text-slate-500 font-extrabold text-base sm:text-lg">
                  $
                </span>
                <input
                  type="number"
                  min={project.minInvestment}
                  step="50"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl sm:rounded-2xl py-2.5 sm:py-3.5 pl-8 sm:pl-10 rtl:pl-4 rtl:pr-8 sm:rtl:pr-10 text-white font-mono text-base sm:text-lg font-bold outline-none transition-all"
                />
              </div>

              {/* Quick Amount Presets */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1">
                {Array.from(new Set([project.minInvestment || 500, 500, 1000, 2500, 5000]))
                  .sort((a, b) => a - b)
                  .map((preset) => (
                  <button
                    key={`preset-${preset}`}
                    type="button"
                    onClick={(e) => { e.preventDefault(); setAmount(preset); }}
                    className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold font-mono transition-all ${
                      amount === preset
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    ${preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Return Calculator Breakdown */}
            <div className="bg-slate-950/80 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-800 space-y-2 sm:space-y-3">
              {project.expectedProfit && (
                <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="block text-[9px] text-amber-400 font-bold uppercase">
                      {currentLang === 'ar' ? 'الأرباح التشغيلية المتوقعة للخطة:' : 'Expected Operational Return:'}
                    </span>
                    <span className="text-xs font-black text-white truncate block">
                      {typeof project.expectedProfit === 'string'
                        ? project.expectedProfit
                        : project.expectedProfit[currentLang] || project.expectedProfit.ar}
                    </span>
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">{currentLang === 'ar' ? 'العائد القائم على الرحلات:' : 'Trip-Based Return:'}</span>
                <span className="font-extrabold text-amber-400 text-xs truncate max-w-[200px]">
                  {typeof project.expectedProfit === 'string'
                    ? project.expectedProfit
                    : project.expectedProfit?.[currentLang] || project.expectedProfit?.ar || 'تقديري حسب رحلات الشحن'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">{t.calculatedMonthlyProfit}:</span>
                <span className="font-extrabold text-emerald-400 font-mono">+${monthlyProfit.toFixed(2)} USDT</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">{t.calculatedTotal5MoProfit}:</span>
                <span className="font-extrabold text-emerald-400 font-mono">+${total5MonthProfit.toFixed(2)} USDT</span>
              </div>
              <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-xs font-bold">
                <span className="text-slate-200">{t.totalReturnAtExit}:</span>
                <span className="text-xs sm:text-sm font-black text-amber-400 font-mono">${totalCapitalExit.toFixed(2)} USDT</span>
              </div>
            </div>

            {/* Legal Agreement Button */}
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); setShowAgreementModal(true); }}
              className="w-full py-2.5 sm:py-3 px-3.5 sm:px-4 rounded-xl sm:rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-amber-400 font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <FileText className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">
                {currentLang === 'ar'
                  ? 'معاينة / تحميل عقد الاستثمار والمضاربة (PDF)'
                  : 'View / Download Investment Agreement (PDF)'}
              </span>
            </button>

            {/* 5-Month Capital Lockup Policy Checkbox */}
            <div className="bg-amber-500/10 border border-amber-500/30 p-3 sm:p-4 rounded-xl sm:rounded-2xl space-y-2">
              <label className="flex items-start space-x-2.5 sm:space-x-3 rtl:space-x-reverse cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToLockup}
                  onChange={(e) => setAgreedToLockup(e.target.checked)}
                  className="mt-0.5 sm:mt-1 w-4 h-4 rounded border-amber-500 text-amber-500 focus:ring-amber-500 bg-slate-950 shrink-0"
                />
                <div className="text-[11px] sm:text-xs text-amber-200 leading-relaxed font-medium min-w-0">
                  <span className="font-bold block text-amber-400 mb-0.5">{t.lockupNoticeTitle}</span>
                  {t.lockupAgreementCheckbox}
                </div>
              </label>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl sm:rounded-2xl text-rose-400 text-xs flex items-center space-x-2 rtl:space-x-reverse">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* KYC Gate warning */}
            {!isKycApproved && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl sm:rounded-2xl text-amber-300 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center space-x-2 rtl:space-x-reverse min-w-0">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="truncate">{t.kycRequiredNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onClose();
                    onOpenKYC();
                  }}
                  className="text-amber-400 font-bold underline text-xs shrink-0"
                >
                  {t.navKYC}
                </button>
              </div>
            )}

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={loading || !agreedToLockup || !isBalanceSufficient || !isKycApproved}
              className={`w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center justify-center space-x-2 rtl:space-x-reverse shadow-lg ${
                agreedToLockup && isBalanceSufficient && isKycApproved && !loading
                  ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 text-slate-950 shadow-amber-500/25 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <span>Processing...</span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>{t.confirmInvestmentBtn}</span>
                </>
              )}
            </button>

          </form>
        </div>
      </div>

      {/* Contract Preview Modal */}
      <InvestmentAgreementModal
        isOpen={showAgreementModal}
        onClose={() => setShowAgreementModal(false)}
        project={project}
        user={user}
        amount={amount}
        currentLang={currentLang}
      />
    </>
  );
};
