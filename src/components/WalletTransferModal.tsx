import React, { useState } from 'react';
import { ArrowLeftRight, Wallet, ShieldCheck, CheckCircle2, Clock, Info } from 'lucide-react';
import { Language, User } from '../types';
import { translations } from '../i18n/translations';

interface WalletTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: Language;
  user: User | null;
  onTransferSuccess?: (updatedUser: User) => void;
}

export const WalletTransferModal: React.FC<WalletTransferModalProps> = ({
  isOpen,
  onClose,
  currentLang,
  user,
  onTransferSuccess,
}) => {
  const t = translations[currentLang] || translations.ar;

  const [direction, setDirection] = useState<'main_to_investment' | 'investment_to_main'>('main_to_investment');
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const mainBal = user?.mainBalance ?? 0;
  const investBal = user?.investmentBalance ?? user?.usdtBalance ?? 0;

  const sourceBal = direction === 'main_to_investment' ? mainBal : investBal;
  const targetBal = direction === 'main_to_investment' ? investBal : mainBal;

  const handleQuickPercent = (percent: number) => {
    if (sourceBal <= 0) return;
    const calculated = (sourceBal * (percent / 100)).toFixed(2);
    setAmount(calculated);
    setError(null);
  };

  const handleSwapDirection = () => {
    setDirection((prev) => (prev === 'main_to_investment' ? 'investment_to_main' : 'main_to_investment'));
    setAmount('');
    setError(null);
    setSuccessMsg(null);
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setError(currentLang === 'ar' ? 'يرجى إدخال مبلغ تحويل صحيح أكبر من zero' : 'Please enter a valid transfer amount');
      return;
    }

    if (val > sourceBal) {
      setError(
        currentLang === 'ar'
          ? `المبلغ المطلوب ($${val.toLocaleString()} USDT) يتجاوز الرصيد المتاح في المحفظة المصدر ($${sourceBal.toLocaleString()} USDT).`
          : `Requested amount ($${val.toLocaleString()} USDT) exceeds source wallet balance ($${sourceBal.toLocaleString()} USDT).`
      );
      return;
    }

    try {
      setLoading(true);
      const fromWallet = direction === 'main_to_investment' ? 'main' : 'investment';
      const toWallet = direction === 'main_to_investment' ? 'investment' : 'main';

      const res = await fetch('/api/wallet/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
          'x-user-email': user?.email || '',
        },
        body: JSON.stringify({
          fromWallet,
          toWallet,
          amount: val,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to transfer funds');
      }

      setSuccessMsg(
        currentLang === 'ar'
          ? `تم تحويل $${val.toLocaleString()} USDT بنجاح وحسب الفئة المطلوبة.`
          : `Successfully transferred $${val.toLocaleString()} USDT.`
      );

      if (onTransferSuccess && data.user) {
        onTransferSuccess(data.user);
      }

      setTimeout(() => {
        setAmount('');
        setSuccessMsg(null);
        onClose();
      }, 1600);
    } catch (err: any) {
      setError(err.message || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 relative animate-fadeIn">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 rtl:right-4 rtl:left-auto text-slate-400 hover:text-white text-lg font-bold"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-white">
              {currentLang === 'ar' ? 'التحويل بين المحافظ' : 'Transfer Between Wallets'}
            </h3>
            <p className="text-xs text-slate-400">
              {currentLang === 'ar'
                ? 'تحويل فوري بدون رسوم بين المحفظة الرئيسية ومحفظة الاستثمار'
                : 'Instant zero-fee transfer between Main and Investment wallets'}
            </p>
          </div>
        </div>

        {/* Wallet Balances Overview */}
        <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs">
          <div className="space-y-1">
            <span className="text-slate-400 text-[11px] block font-semibold flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5 text-blue-400" />
              {currentLang === 'ar' ? 'المحفظة الرئيسية (ادخار):' : 'Main Wallet:'}
            </span>
            <span className="text-white font-extrabold font-mono text-base">
              ${mainBal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-slate-400 text-[11px] block font-semibold flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5 text-amber-400" />
              {currentLang === 'ar' ? 'محفظة الاستثمار:' : 'Investment Wallet:'}
            </span>
            <span className="text-amber-400 font-extrabold font-mono text-base">
              ${investBal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
            </span>
          </div>
        </div>

        {/* Transfer Form */}
        <form onSubmit={handleTransfer} className="space-y-4">
          {/* Direction Selector */}
          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-400">{currentLang === 'ar' ? 'مسار التحويل:' : 'Transfer Route:'}</span>
              <button
                type="button"
                onClick={handleSwapDirection}
                className="text-amber-400 hover:text-amber-300 text-[11px] font-bold flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 transition"
              >
                <ArrowLeftRight className="w-3 h-3" />
                <span>{currentLang === 'ar' ? 'عكس الاتجاه' : 'Swap Direction'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs">
              <div className="flex-1 text-center">
                <span className="text-[10px] text-slate-500 block">{currentLang === 'ar' ? 'من (المصدر)' : 'From'}</span>
                <span className="font-extrabold text-white text-xs">
                  {direction === 'main_to_investment'
                    ? currentLang === 'ar' ? 'المحفظة الرئيسية' : 'Main Wallet'
                    : currentLang === 'ar' ? 'محفظة الاستثمار' : 'Investment Wallet'}
                </span>
              </div>

              <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                ➔
              </div>

              <div className="flex-1 text-center">
                <span className="text-[10px] text-slate-500 block">{currentLang === 'ar' ? 'إلى (الوجهة)' : 'To'}</span>
                <span className="font-extrabold text-amber-400 text-xs">
                  {direction === 'main_to_investment'
                    ? currentLang === 'ar' ? 'محفظة الاستثمار' : 'Investment Wallet'
                    : currentLang === 'ar' ? 'المحفظة الرئيسية' : 'Main Wallet'}
                </span>
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold text-slate-300">
                {currentLang === 'ar' ? 'المبلغ المراد تحويله (USDT):' : 'Amount to Transfer (USDT):'}
              </label>
              <span className="text-slate-400 font-mono text-[11px]">
                {currentLang === 'ar' ? 'المتاح:' : 'Available:'} ${sourceBal.toLocaleString()} USDT
              </span>
            </div>

            <input
              type="number"
              step="any"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(null); }}
              placeholder="0.00"
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 font-mono text-base font-bold rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500"
            />

            {/* Quick Percentage Chips */}
            <div className="flex gap-2 pt-1">
              {[25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handleQuickPercent(pct)}
                  className="flex-1 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition font-mono border border-slate-700"
                >
                  {pct === 100 ? (currentLang === 'ar' ? 'الكل' : 'MAX') : `${pct}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Policy Notice */}
          <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl text-[11px] text-blue-300 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              {currentLang === 'ar'
                ? 'ملاحظة: التحويل فوري بين المحافظ بدون أية عمولات. رصيد محفظة الاستثمار مخصص للاشتراك في أساطيل النقل وتحصيل العوائد.'
                : 'Note: Instant transfer between wallets with zero fees. Investment wallet balance is dedicated for fleet plans.'}
            </div>
          </div>

          {/* Error & Success Messages */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition"
            >
              {currentLang === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>

            <button
              type="submit"
              disabled={loading || !amount}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
            >
              {loading ? (
                <Clock className="w-4 h-4 animate-spin mx-auto" />
              ) : currentLang === 'ar' ? (
                'تأكيد التحويل الفوري'
              ) : (
                'Confirm Instant Transfer'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
