import React, { useState, useEffect } from 'react';
import {
  Clock,
  ShieldCheck,
  X,
  Lock,
  MessageSquare,
  Wallet,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { Language, DepositRequest, WithdrawalRequest } from '../types';

interface PendingApprovalModalProps {
  isOpen: boolean;
  currentLang: Language;
  pendingDeposit?: DepositRequest | null;
  pendingWithdrawal?: WithdrawalRequest | null;
  onClose: () => void;
  onViewChat?: () => void;
}

export const PendingApprovalModal: React.FC<PendingApprovalModalProps> = ({
  isOpen,
  currentLang,
  pendingDeposit,
  pendingWithdrawal,
  onClose,
  onViewChat,
}) => {
  const isRtl = currentLang === 'ar' || currentLang === 'ckb';
  const request = pendingDeposit || pendingWithdrawal;
  const isDeposit = Boolean(pendingDeposit);

  // SLA Duration: 5 minutes (300 seconds)
  const createdTimestamp = request
    ? new Date(
        (request as DepositRequest).createdAt ||
          (request as WithdrawalRequest).requestedAt ||
          Date.now()
      ).getTime()
    : Date.now();

  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(() => {
    const elapsed = Math.floor((Date.now() - createdTimestamp) / 1000);
    return Math.max(0, 300 - elapsed);
  });

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - createdTimestamp) / 1000);
      setTimeLeftSeconds(Math.max(0, 300 - elapsed));
    }, 1000);
    return () => clearInterval(interval);
  }, [createdTimestamp, isOpen]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const amount = request ? request.amount || 0 : 0;
  const reqId = request ? request.id : '';
  const networkOrMethod = isDeposit
    ? (request as DepositRequest)?.network || 'TRC20'
    : (request as WithdrawalRequest)?.payoutMethod || 'USDT_TRC20';

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500/40 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl shadow-amber-500/10 relative text-white">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rtl:right-auto rtl:left-4 w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition border border-slate-700"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header Badge & Countdown */}
        <div className="text-center space-y-3 pt-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-inner relative">
            <Clock className="w-8 h-8 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
            </span>
          </div>

          <div>
            <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-block mb-2">
              {currentLang === 'ar'
                ? 'طلب قيد مراجعة واعتماد المسؤول'
                : 'Pending Admin Review & Approval'}
            </span>
            
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {isDeposit
                ? currentLang === 'ar'
                  ? 'طلب الإيداع قيد المعالجة'
                  : 'Deposit Request Under Review'
                : currentLang === 'ar'
                ? 'طلب السحب قيد المعالجة'
                : 'Withdrawal Request Under Review'}
            </h2>
          </div>

          {/* Countdown Clock Box */}
          <div className="bg-slate-950/90 border border-amber-500/30 rounded-2xl p-4 shadow-inner">
            <span className="text-[11px] text-slate-400 font-bold block mb-1">
              {currentLang === 'ar'
                ? 'الوقت المتبقي المقدر للتدقيق والاعتماد:'
                : 'Estimated Admin Verification Time Frame:'}
            </span>
            <div className="font-mono font-black text-3xl sm:text-4xl text-amber-400 tracking-wider flex items-center justify-center gap-2">
              <span>{formattedTime}</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">
              {currentLang === 'ar'
                ? 'سيتم تحديث الرصيد تلقائياً بمجرد الاعتماد من مسؤول النظام'
                : 'Account balance will automatically reflect updates upon admin approval'}
            </span>
          </div>
        </div>

        {/* Status Message / Notification */}
        {isDeposit && (pendingDeposit?.status === 'unlocked' || pendingDeposit?.status === 'approved') ? (
          <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm font-bold leading-relaxed text-center space-y-2 shadow-lg animate-pulse">
            <div className="flex items-center justify-center gap-2 text-emerald-400 font-black text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>
                {currentLang === 'ar'
                  ? 'تمت موافقة مسؤول التحويلات على الطلب!'
                  : 'Transfer Officer Approved Deposit Request!'}
              </span>
            </div>
            <p className="text-slate-200 text-[11px] font-medium">
              {currentLang === 'ar'
                ? 'تم فتح شباك تنفيذ الإيداع النهائي. يرجى الانتقال لإكمال التحويل، إدخال رقم المعاملة (TXID) وإرفاق صورة الإشعار.'
                : 'Final deposit execution window unlocked. Please proceed to copy the wallet address, enter the TXID and attach transfer receipt.'}
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-sm font-bold leading-relaxed text-center space-y-1.5 shadow-sm">
            <p className="text-amber-300 font-black text-sm">
              {currentLang === 'ar'
                ? 'الطلب بانتظار المراجعة والموافقة اليدوية من مسؤول التحويلات بشركة أصيل'
                : currentLang === 'ckb'
                ? 'داواکارییەکە لەژێر پێداچوونەوە و پەسەندکردنی بەرپرسی گواستنەوەکانی کۆمپانیای ئەسیلە'
                : 'The deposit is pending manual review and approval by the company\'s transfer officer'}
            </p>
            <p className="text-slate-300 text-[11px] font-medium">
              {currentLang === 'ar'
                ? 'تم حفظ حالة الطلب كـ "قيد الانتظار" (Pending) في قاعدة البيانات. يقوم مسؤول التحويلات بمطابقة المعاملة يدوياً واعتماد الرصيد.'
                : currentLang === 'ckb'
                ? 'داواکارییەکە وەک "چاوەڕوانکراو" (Pending) تۆمارکراوە. بەرپرسی گواستنەوەکان بەدەستی وردبینی دەکات.'
                : 'The request is saved as "Pending" in the database. The transfer officer will manually verify the transaction and credit your balance.'}
            </p>
          </div>
        )}

        {/* Transaction Specifics Card */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-2.5 text-xs">
          <div className="flex justify-between items-center text-slate-400 border-b border-slate-800/80 pb-2">
            <span>{currentLang === 'ar' ? 'رقم الطلب:' : 'Request ID:'}</span>
            <span className="font-mono text-amber-400 font-bold">#{reqId.slice(-8)}</span>
          </div>

          <div className="flex justify-between items-center text-slate-400 border-b border-slate-800/80 pb-2">
            <span>{currentLang === 'ar' ? 'نوع المعاملة:' : 'Transaction Type:'}</span>
            <span className="font-bold text-white flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-amber-400" />
              {isDeposit
                ? currentLang === 'ar'
                  ? 'إيداع وحساب محفظة (Deposit)'
                  : 'Deposit'
                : currentLang === 'ar'
                ? 'سحب وصرف رصيد (Withdrawal)'
                : 'Withdrawal'}
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-400 border-b border-slate-800/80 pb-2">
            <span>{currentLang === 'ar' ? 'المبلغ المطلوب:' : 'Amount:'}</span>
            <span className="font-mono font-black text-amber-300 text-base">
              ${amount.toLocaleString()} USDT
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-400">
            <span>{currentLang === 'ar' ? 'الشبكة / وسيلة التحويل:' : 'Network / Payout Method:'}</span>
            <span className="font-mono text-slate-200 font-bold">{networkOrMethod}</span>
          </div>
        </div>

        {/* Lock Warning Notice */}
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-rose-200 text-xs">
              {currentLang === 'ar' ? 'قفل المعاملات المتتابعة:' : 'Account Lock Active:'}
            </span>
            <p className="mt-0.5 text-rose-300/90 leading-tight">
              {currentLang === 'ar'
                ? 'لا يمكن تقديم طلبات إيداع أو سحب جديدة حتى يتم القبول أو الرفض الصريح للطلب الحالي من مسؤول النظام.'
                : 'Subsequent deposit or withdrawal requests are locked until this pending request is explicitly Approved or Rejected by an admin.'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {onViewChat && (
            <button
              type="button"
              onClick={onViewChat}
              className="flex-1 py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs border border-amber-500/30 hover:border-amber-500/60 cursor-pointer transition flex items-center justify-center gap-2 shadow-md"
            >
              <MessageSquare className="w-4 h-4" />
              <span>
                {currentLang === 'ar'
                  ? 'عرض التفاصيل والمحادثة المباشرة'
                  : 'View Request & Chat Desk'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs cursor-pointer transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {currentLang === 'ar'
                ? 'متابعة استخدام المنصة'
                : 'Continue Using Platform'}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
