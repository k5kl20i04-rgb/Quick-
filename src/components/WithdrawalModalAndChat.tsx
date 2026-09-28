import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  MessageSquare,
  Copy,
  Check,
  Send,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  DollarSign,
  ArrowRight,
  Wallet,
  Building2,
  Phone,
  Zap,
  AlertCircle,
  ExternalLink,
  RotateCcw,
  Headset,
  Upload,
  Sparkles,
  ChevronRight,
  Receipt,
  Info,
  CheckCheck,
  AlertTriangle,
} from 'lucide-react';
import { WithdrawalRequest, Language, User, PayoutMethod, ChatMessage, AdminSettings } from '../types';
import { translations } from '../i18n/translations';

interface WithdrawalModalAndChatProps {
  currentLang: Language;
  user: User;
  adminSettings?: AdminSettings;
  activeWithdrawal?: WithdrawalRequest | null;
  withdrawalList: WithdrawalRequest[];
  onClose: () => void;
  onConnectWithdrawal?: () => Promise<WithdrawalRequest>;
  onSubmitWithdrawalDetails?: (
    withdrawalId: string,
    amount: number,
    payoutMethod: PayoutMethod,
    payoutDetails: string,
    receiptUrl?: string,
    txHash?: string
  ) => Promise<WithdrawalRequest>;
  onStartWithdrawal: (
    amount: number,
    payoutMethod: PayoutMethod,
    payoutDetails: string,
    investmentId?: string
  ) => Promise<WithdrawalRequest>;
  onSendChatMessage?: (
    withdrawalId: string,
    text: string,
    receiptUrl?: string,
    txHash?: string
  ) => Promise<void>;
  onSendMessage?: (
    withdrawalId: string,
    text: string,
    receiptUrl?: string,
    txHash?: string
  ) => Promise<void>;
  onOpenKYC?: () => void;
  onOpenTransferModal?: () => void;
}

export const WithdrawalModalAndChat: React.FC<WithdrawalModalAndChatProps> = ({
  currentLang,
  user,
  adminSettings,
  activeWithdrawal,
  withdrawalList = [],
  onClose,
  onConnectWithdrawal,
  onSubmitWithdrawalDetails,
  onStartWithdrawal,
  onSendChatMessage,
  onSendMessage,
  onOpenKYC,
  onOpenTransferModal,
}) => {
  const handleSend = onSendChatMessage || onSendMessage;
  const t = translations[currentLang] || translations.ar;
  const isRtl = currentLang === 'ar' || currentLang === 'ckb';

  const investmentBalance = user?.investmentBalance ?? user?.usdtBalance ?? 0;
  const mainBalance = user?.mainBalance ?? 0;
  // Withdrawals are deducted exclusively from the Main Wallet (المحفظة الرئيسية)
  const availableBalance = mainBalance;

  // View state: 'form' (submit new request) vs 'tracking' (view active/past request details & chat)
  const userWithdrawals = withdrawalList.filter((w) => Boolean(user) && w.userId === user?.id);
  const latestActive = userWithdrawals.find(
    (w) => w.status === 'pending' || w.status === 'approved' || w.status === 'submitted'
  ) || userWithdrawals[0] || null;

  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(() => {
    const savedId = sessionStorage.getItem('aseel_wd_modal_selected_id');
    if (savedId) {
      const found = userWithdrawals.find((w) => w.id === savedId);
      if (found) return found;
    }
    return activeWithdrawal || latestActive;
  });

  // If user has an active withdrawal, start in tracking view; otherwise show the 1-click form
  const [activeTab, setActiveTab] = useState<'form' | 'tracking'>(() => {
    const saved = sessionStorage.getItem('aseel_wd_modal_tab');
    if (saved === 'form' || saved === 'tracking') return saved;
    return latestActive ? 'tracking' : 'form';
  });

  useEffect(() => {
    sessionStorage.setItem('aseel_wd_modal_tab', activeTab);
    if (selectedWithdrawal) {
      sessionStorage.setItem('aseel_wd_modal_selected_id', selectedWithdrawal.id);
    }
  }, [activeTab, selectedWithdrawal]);

  // Form State
  const [amount, setAmount] = useState<number>(availableBalance > 0 ? Math.min(availableBalance, 1000) : 500);
  const [withdrawalCategory, setWithdrawalCategory] = useState<'profits_only' | 'capital_exit' | 'reinvest'>('profits_only');
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>('USDT_TRC20');
  const [payoutDetails, setPayoutDetails] = useState<string>('');
  const [userNote, setUserNote] = useState<string>('');
  const [txHashInput, setTxHashInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Chat message state
  const [messageText, setMessageText] = useState<string>('');
  const [isSendingChat, setIsSendingChat] = useState<boolean>(false);
  const [copiedTxid, setCopiedTxid] = useState<boolean>(false);
  const [copiedWallet, setCopiedWallet] = useState<boolean>(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Synchronize selected withdrawal with external list updates
  useEffect(() => {
    if (selectedWithdrawal) {
      const updated = withdrawalList.find((w) => w.id === selectedWithdrawal.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedWithdrawal)) {
        setSelectedWithdrawal(updated);
      }
    } else if (latestActive) {
      setSelectedWithdrawal(latestActive);
    }
  }, [withdrawalList, latestActive]);

  // Scroll chat strictly inside container
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [selectedWithdrawal?.chatMessages]);

  const methodOptions: {
    id: PayoutMethod;
    labelAr: string;
    labelEn: string;
    badge: string;
    icon: React.ComponentType<{ className?: string }>;
    placeholderAr: string;
    placeholderEn: string;
  }[] = [
    {
      id: 'USDT_TRC20',
      labelAr: 'USDT (شبكة TRON TRC20)',
      labelEn: 'USDT (TRON TRC20)',
      badge: 'TRC-20',
      icon: Wallet,
      placeholderAr: 'أدخل عنوان محفظة TRC20 (مثال: TWrL1xK9PzQq8v7sJmNp2bX4yZaR3cT5uV)',
      placeholderEn: 'Enter TRC20 Wallet Address (e.g., TWrL1xK9...)',
    },
    {
      id: 'USDT_BEP20',
      labelAr: 'USDT (شبكة BSC BEP20)',
      labelEn: 'USDT (BSC BEP20)',
      badge: 'BEP-20',
      icon: Wallet,
      placeholderAr: 'أدخل عنوان محفظة BEP20 (مثال: 0x71C7656EC7ab88b098defB751B7401B5f6d8976F)',
      placeholderEn: 'Enter BEP20 Wallet Address (e.g., 0x71C...)',
    },
  ];

  const currentMethodObj = methodOptions.find((m) => m.id === payoutMethod) || methodOptions[0];

  // Quick percentage presets
  const handleSetPercent = (pct: number) => {
    if (availableBalance <= 0) return;
    const calc = Math.floor((availableBalance * pct) / 100);
    setAmount(Math.max(10, calc));
  };

  // 1-Click Instant Withdrawal Request Submission
  const handleDirectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (amount <= 0) {
      setFormError(
        currentLang === 'ar'
          ? 'يرجى إدخال مبلغ سحب صحيح أكبر من صفر'
          : 'Please enter a valid withdrawal amount greater than zero'
      );
      return;
    }

    if (amount > availableBalance && availableBalance > 0) {
      setFormError(
        currentLang === 'ar'
          ? `المبلغ المطلوب ($${amount.toLocaleString()}) يتجاوز رصيدك المتاح ($${availableBalance.toLocaleString()} USDT)`
          : `Requested amount ($${amount.toLocaleString()}) exceeds available balance ($${availableBalance.toLocaleString()} USDT)`
      );
      return;
    }

    if (!payoutDetails.trim()) {
      setFormError(
        currentLang === 'ar'
          ? 'يرجى إدخال عنوان المحفظة أو بيانات الحساب المستهدف لاستلام الدفعة'
          : 'Please enter the payout destination address or account details'
      );
      return;
    }

    try {
      setLoading(true);

      const res = await fetch('/api/withdrawals/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          sourceWallet: 'main',
          payoutMethod,
          payoutDetails: payoutDetails.trim(),
          destinationWallet: payoutDetails.trim(),
          withdrawalCategory,
          userNote: userNote.trim() || undefined,
          txHash: txHashInput.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create withdrawal request');
      }

      const data = await res.json();
      const createdWithdrawal = data.withdrawal;

      setSelectedWithdrawal(createdWithdrawal);
      setActiveTab('tracking');
      setFormSuccess(
        currentLang === 'ar'
          ? `تم تقديم طلب السحب بقيمة $${amount.toLocaleString()} USDT بنجاح! جاري تحويل الدفعة.`
          : `Withdrawal request for $${amount.toLocaleString()} USDT submitted successfully! Processing payout.`
      );
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit withdrawal request');
    } finally {
      setLoading(false);
    }
  };

  // Send message in P2P chat
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWithdrawal || !messageText.trim()) return;

    const text = messageText.trim();
    setMessageText('');

    try {
      setIsSendingChat(true);
      if (handleSend) {
        await handleSend(selectedWithdrawal.id, text);
      } else {
        await fetch(`/api/withdrawals/${selectedWithdrawal.id}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, sender: 'user' }),
        });
      }
    } catch (err) {
      console.error('Error sending chat:', err);
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleCopy = (text: string, isHash = false) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (isHash) {
      setCopiedTxid(true);
      setTimeout(() => setCopiedTxid(false), 2000);
    } else {
      setCopiedWallet(true);
      setTimeout(() => setCopiedWallet(false), 2000);
    }
  };

  return (
    <div
      id="withdrawal-modal-container"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full h-[92vh] max-h-[840px] shadow-2xl flex flex-col overflow-hidden relative text-slate-100">
        
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between shrink-0 gap-3">
          <div className="flex items-center space-x-3 rtl:space-x-reverse min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <DollarSign className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <h2 className="text-sm sm:text-base font-black text-white truncate">
                  {currentLang === 'ar'
                    ? 'بوابة سحب الأرباح P2P والتسويات المالية'
                    : currentLang === 'ckb'
                    ? 'دەروازەی ڕاکێشانی قازانج P2P'
                    : 'P2P Earnings Withdrawal & Settlement Desk'}
                </h2>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              </div>
              <p className="text-[11px] text-amber-400 font-medium truncate">
                {currentLang === 'ar'
                  ? 'سحب فوري ومباشر إلى محفظتك الرقمية (USDT TRC20 / BEP20) بدون تعقيد'
                  : 'Fast 1-click withdrawal to USDT wallet (TRC20 / BEP20)'}
              </p>
            </div>
          </div>

          {/* Navigation Controls in Header */}
          <div className="flex items-center gap-2 shrink-0">
            {/* View Switcher Tabs */}
            <div className="hidden sm:flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('form');
                  setFormError(null);
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'form'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{currentLang === 'ar' ? 'طلب جديد' : 'New Request'}</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('tracking');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'tracking'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>
                  {currentLang === 'ar' ? 'سجل وحالة الطلبات' : 'Status & Chat'}
                  {userWithdrawals.length > 0 && ` (${userWithdrawals.length})`}
                </span>
              </button>
            </div>

            <button
              id="withdrawal-modal-close-btn"
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all shrink-0 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="flex sm:hidden items-center border-b border-slate-800 bg-slate-950 px-3 py-2 gap-2 text-xs">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('form');
            }}
            className={`flex-1 py-2 rounded-xl font-bold transition text-center ${
              activeTab === 'form'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            {currentLang === 'ar' ? 'طلب سحب جديد' : 'New Request'}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('tracking');
            }}
            className={`flex-1 py-2 rounded-xl font-bold transition text-center ${
              activeTab === 'tracking'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            {currentLang === 'ar' ? 'حالة الطلبات والشات' : 'Status & Chat'}
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 custom-scrollbar">
          
          {/* ======================================================== */}
          {/* TAB 1: STREAMLINED 1-CLICK WITHDRAWAL FORM               */}
          {/* ======================================================== */}
          {activeTab === 'form' && (
            <div className="max-w-2xl mx-auto space-y-6 animate-fade-in py-1">
              
              {/* System Suspended / Pause Withdrawals Banner */}
              {adminSettings?.pauseWithdrawals && (
                <div className="p-4 rounded-2xl bg-rose-500/15 border-2 border-rose-500/50 text-rose-300 text-xs font-bold flex items-center gap-3 animate-fade-in shadow-lg shadow-rose-500/10">
                  <AlertTriangle className="w-6 h-6 shrink-0 text-rose-400" />
                  <div>
                    <p className="text-sm font-black text-rose-200">
                      {currentLang === 'ar' ? 'تم إيقاف السحوبات مؤقتاً.' : 'Withdrawals are temporarily suspended.'}
                    </p>
                    <p className="text-[11px] text-rose-300/80 font-normal mt-0.5">
                      {currentLang === 'ar'
                        ? 'قام مسؤول النظام بتعليمات تعليق عمليات السحب مؤقتاً لجميع المستخدمين. يرجى المحاولة لاحقاً.'
                        : 'System administration has temporarily suspended withdrawal operations. Please try again later.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Wallet Available Balance Card with Source Wallet Selector */}
              <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                      <Wallet className="w-6 h-6 stroke-[2.2]" />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 font-bold block uppercase tracking-wider">
                        {currentLang === 'ar' ? 'رصيد المحفظة المتاح للسحب' : 'Available Wallet Balance'}
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
                          ${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-xs font-black text-slate-300">USDT</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {user?.kycStatus === 'approved' ? (
                      <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" />
                        <span>
                          {currentLang === 'ar'
                            ? 'حساب موثق وجاهز للسحب'
                            : currentLang === 'ckb'
                            ? 'هەژماری پشتڕاستکراوە'
                            : 'Verified & Ready for Payout'}
                        </span>
                      </div>
                    ) : user?.kycStatus === 'pending' ? (
                      <button
                        type="button"
                        onClick={onOpenKYC}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-1.5 hover:bg-amber-500/20 transition cursor-pointer"
                      >
                        <Clock className="w-4 h-4" />
                        <span>
                          {currentLang === 'ar'
                            ? 'التوثيق قيد المراجعة'
                            : currentLang === 'ckb'
                            ? 'پشتڕاستکردنەوە لە چاوەڕوانیدایە'
                            : 'KYC Verification Pending'}
                        </span>
                      </button>
                    ) : user?.kycStatus === 'rejected' ? (
                      <button
                        type="button"
                        onClick={onOpenKYC}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-1.5 hover:bg-rose-500/20 transition cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>
                          {currentLang === 'ar'
                            ? 'التوثيق مرفوض - إضغط لإعادة التوثيق'
                            : currentLang === 'ckb'
                            ? 'پشتڕاستکردنەوە ڕەتکرایەوە'
                            : 'KYC Rejected - Click to Re-verify'}
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={onOpenKYC}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-1.5 hover:bg-rose-500/20 transition cursor-pointer"
                      >
                        <AlertCircle className="w-4 h-4" />
                        <span>
                          {currentLang === 'ar'
                            ? 'حساب غير موثق'
                            : currentLang === 'ckb'
                            ? 'هەژماری پشتڕاستنەکراوە'
                            : 'Unverified Account'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Main Wallet Requirement Notice & Fast Transfer */}
                <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1.5 text-blue-400">
                      <Wallet className="w-3.5 h-3.5" />
                      {currentLang === 'ar' ? 'مصدر السحب: المحفظة الرئيسية' : 'Withdrawal Source: Main Wallet'}
                    </span>
                    <span className="font-mono text-slate-400">
                      ${mainBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {currentLang === 'ar'
                      ? 'تُسحب جميع المبالغ حصرياً من المحفظة الرئيسية. إذا كانت أرباحك أو أموالك متوفرة في محفظة الاستثمار، يمكنك تحويلها فورياً وبدون رسوم إلى المحفظة الرئيسية.'
                      : 'All withdrawal requests are deducted exclusively from your Main Wallet. If your funds are in the Investment Wallet, transfer them instantly with zero fees.'}
                  </p>

                  {investmentBalance > 0 && onOpenTransferModal && (
                    <button
                      type="button"
                      onClick={onOpenTransferModal}
                      className="w-full py-2 px-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold flex items-center justify-between transition cursor-pointer"
                    >
                      <span>
                        {currentLang === 'ar'
                          ? '🔄 تحويل الأموال من محفظة الاستثمار إلى الرئيسية'
                          : '🔄 Transfer from Investment Wallet to Main Wallet'}
                      </span>
                      <span className="font-mono font-bold text-emerald-400">
                        ${investmentBalance.toLocaleString()} USDT
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Form Success/Error Banners */}
              {formSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {formError && (
                <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
                  <span>{formError}</span>
                </div>
              )}

              <form noValidate onSubmit={handleDirectSubmit} className="space-y-5">
                
                {/* 1. Category / Balance Source Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-extrabold text-slate-300">
                    {currentLang === 'ar' ? '1. مصدر السحب / نوع العملية:' : '1. Withdrawal Source & Type:'}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setWithdrawalCategory('profits_only');
                      }}
                      className={`p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer text-center ${
                        withdrawalCategory === 'profits_only'
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/40'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <DollarSign className="w-4 h-4 text-amber-400" />
                      <span>{currentLang === 'ar' ? 'سحب الأرباح والعوائد' : 'Profits & Yield'}</span>
                      <span className="text-[10px] text-emerald-400 font-normal">
                        {currentLang === 'ar' ? 'فوري ومباشر' : 'Immediate Payout'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setWithdrawalCategory('capital_exit');
                      }}
                      className={`p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer text-center ${
                        withdrawalCategory === 'capital_exit'
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/40'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <RotateCcw className="w-4 h-4 text-amber-400" />
                      <span>{currentLang === 'ar' ? 'تخارج رأس المال' : 'Capital Principal Exit'}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {currentLang === 'ar' ? 'عند اكتمال الدورة' : 'Matured Capital'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setWithdrawalCategory('reinvest');
                      }}
                      className={`p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer text-center ${
                        withdrawalCategory === 'reinvest'
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/40'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <Zap className="w-4 h-4 text-blue-400" />
                      <span>{currentLang === 'ar' ? 'إعادة استثمار في الأسطول' : 'Reinvest in Fleet'}</span>
                      <span className="text-[10px] text-blue-300/80 font-normal">
                        {currentLang === 'ar' ? 'تجديد العوائد' : 'Compound Returns'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* 2. Payout Method Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-extrabold text-slate-300">
                    {currentLang === 'ar' ? '2. وسيلة الاستلام وشبكة التحويل:' : '2. Select Payout Method & Network:'}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {methodOptions.map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = payoutMethod === opt.id;

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setPayoutMethod(opt.id);
                          }}
                          className={`p-3 rounded-2xl border text-xs font-bold transition flex items-center justify-between gap-2.5 text-right rtl:text-right ltr:text-left cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20 ring-1 ring-amber-400'
                              : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-slate-950' : 'text-amber-400'}`} />
                            <span className="truncate">{currentLang === 'ar' ? opt.labelAr : opt.labelEn}</span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-black shrink-0 ${
                              isSelected
                                ? 'bg-slate-950 text-amber-400'
                                : 'bg-slate-900 text-slate-400 border border-slate-800'
                            }`}
                          >
                            {opt.badge}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Amount Input & Quick Percentage Pills */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-extrabold text-slate-300">
                      {currentLang === 'ar' ? '3. مبلغ السحب المطلوب (USDT):' : '3. Withdrawal Amount (USDT):'}
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {currentLang === 'ar' ? 'رسوم الصرف: 0.00% (مجاناً)' : 'Fee: 0.00% (Zero Fees)'}
                    </span>
                  </div>

                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-amber-400 font-extrabold text-sm">$</span>
                    <input
                      type="number"
                      required
                      min={10}
                      max={availableBalance || 100000}
                      value={amount || ''}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      placeholder="1000"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 text-white font-mono font-bold text-base rounded-2xl pl-8 pr-20 py-3.5 outline-none transition-all"
                    />
                    <span className="absolute right-4 rtl:right-auto rtl:left-4 top-3.5 text-xs font-black text-amber-400">
                      USDT
                    </span>
                  </div>

                  {/* Percentage Quick Pills */}
                  <div className="flex items-center gap-2 pt-1">
                    {[25, 50, 75, 100].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handleSetPercent(pct);
                        }}
                        className="flex-1 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-amber-300 text-xs font-bold font-mono transition cursor-pointer"
                      >
                        {pct === 100 ? (currentLang === 'ar' ? 'كامل الرصيد (MAX)' : 'MAX (100%)') : `${pct}%`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Destination Account / Wallet Input */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-extrabold text-slate-300">
                      {currentLang === 'ar' ? '4. عنوان المحفظة / حساب الاستلام:' : '4. Destination Account / Wallet:'}{' '}
                      <span className="text-rose-400">*</span>
                    </label>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={payoutDetails}
                      onChange={(e) => setPayoutDetails(e.target.value)}
                      placeholder={currentLang === 'ar' ? currentMethodObj.placeholderAr : currentMethodObj.placeholderEn}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 text-amber-300 font-mono text-xs sm:text-sm rounded-2xl px-4 py-3.5 outline-none transition-all pr-24 rtl:pr-4 rtl:pl-24"
                    />

                    {/* Paste Helper Button */}
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.preventDefault();
                        try {
                          const clipboardText = await navigator.clipboard.readText();
                          if (clipboardText) setPayoutDetails(clipboardText.trim());
                        } catch {
                          // Fallback if clipboard API restricted
                        }
                      }}
                      className="absolute right-2.5 rtl:right-auto rtl:left-2.5 top-2.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-amber-400 transition cursor-pointer border border-slate-700"
                    >
                      {currentLang === 'ar' ? 'لصق' : 'Paste'}
                    </button>
                  </div>
                </div>

                {/* 5. Optional Note */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400">
                    {currentLang === 'ar' ? 'ملاحظة إضافية أو مرجع تحويل (اختياري):' : 'Optional Transfer Note / Reference:'}
                  </label>
                  <input
                    type="text"
                    value={userNote}
                    onChange={(e) => setUserNote(e.target.value)}
                    placeholder={currentLang === 'ar' ? 'مثال: يرجى التحويل في الفترة الصباحية' : 'e.g., Morning payout preferred'}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 text-slate-200 text-xs rounded-xl px-4 py-2.5 outline-none"
                  />
                </div>

                {/* 1-Click Submit Action Button */}
                <button
                  id="submit-withdrawal-btn"
                  type="submit"
                  disabled={loading || amount <= 0 || !payoutDetails.trim() || Boolean(adminSettings?.pauseWithdrawals)}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4 disabled:cursor-not-allowed"
                >
                  {adminSettings?.pauseWithdrawals ? (
                    <span>{currentLang === 'ar' ? 'السحوبات معطلة مؤقتاً' : 'Withdrawals Temporarily Suspended'}</span>
                  ) : loading ? (
                    <>
                      <Clock className="w-5 h-5 animate-spin" />
                      <span>{currentLang === 'ar' ? 'جاري إرسال الطلب...' : 'Submitting Request...'}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 stroke-[2.5]" />
                      <span>
                        {currentLang === 'ar'
                          ? `تأكيد وإرسال طلب سحب $${amount.toLocaleString()} USDT بنقرة واحدة`
                          : `Confirm & Submit $${amount.toLocaleString()} USDT Withdrawal`}
                      </span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: LIVE TRACKING & P2P SUPPORT CHAT                  */}
          {/* ======================================================== */}
          {activeTab === 'tracking' && (
            <div className="space-y-6 animate-fade-in py-1">
              
              {userWithdrawals.length === 0 ? (
                <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                  <Receipt className="w-10 h-10 text-slate-500 mx-auto" />
                  <h4 className="text-white font-bold text-sm">
                    {currentLang === 'ar' ? 'لا توجد طلبات سحب سابقة' : 'No withdrawal requests yet'}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {currentLang === 'ar'
                      ? 'يمكنك تقديم طلب سحب جديد الآن بنقرة واحدة وتتبع الصرف مباشرة.'
                      : 'You can submit a new 1-click withdrawal request right now.'}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab('form');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-md"
                  >
                    {currentLang === 'ar' ? 'تقديم طلب سحب جديد' : 'Create Withdrawal Request'}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left Column: Request List */}
                  <div className="lg:col-span-5 space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                    <div className="flex justify-between items-center pb-2">
                      <span className="text-xs font-bold text-slate-300">
                        {currentLang === 'ar' ? 'طلبات السحب المسجلة' : 'Your Withdrawal Requests'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveTab('form');
                        }}
                        className="text-amber-400 text-xs font-bold hover:underline flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{currentLang === 'ar' ? '+ طلب جديد' : '+ New'}</span>
                      </button>
                    </div>

                    {userWithdrawals.map((wd) => {
                      const isSelected = selectedWithdrawal?.id === wd.id;
                      const isCompleted = wd.status === 'completed' || wd.status === 'approved';
                      const isRejected = wd.status === 'rejected';

                      return (
                        <div
                          key={wd.id}
                          onClick={() => setSelectedWithdrawal(wd)}
                          className={`p-3.5 rounded-2xl border transition cursor-pointer flex justify-between items-center gap-3 ${
                            isSelected
                              ? 'bg-amber-500/10 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                              : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-white text-xs font-mono">
                                ${wd.amount.toLocaleString()} USDT
                              </span>
                              <span className="text-[10px] text-amber-400 font-bold">
                                ({wd.payoutMethod || 'TRC20'})
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block truncate max-w-[180px] font-mono">
                              {wd.payoutDetails || wd.destinationWallet}
                            </span>
                          </div>

                          <div className="text-right rtl:text-left shrink-0">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                                isCompleted
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : isRejected
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                              }`}
                            >
                              {isCompleted
                                ? (currentLang === 'ar' ? 'تم الصرف بنجاح' : 'Completed')
                                : isRejected
                                ? (currentLang === 'ar' ? 'مرفوض' : 'Rejected')
                                : (currentLang === 'ar' ? 'قيد المعالجة' : 'Processing')}
                            </span>
                            <span className="text-[9px] text-slate-500 block mt-1 font-mono">
                              {new Date(wd.requestedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right Column: Selected Request Inspection & Live P2P Chat */}
                  <div className="lg:col-span-7 bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 shadow-xl">
                    {selectedWithdrawal ? (
                      <>
                        {/* Request Header Card */}
                        <div className="space-y-3 pb-3 border-b border-slate-800">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] text-slate-400 font-mono block">
                                ID: {selectedWithdrawal.id}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-white text-base">
                                  ${selectedWithdrawal.amount.toLocaleString()} USDT
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    selectedWithdrawal.status === 'completed' || selectedWithdrawal.status === 'approved'
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                      : selectedWithdrawal.status === 'rejected'
                                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  }`}
                                >
                                  {selectedWithdrawal.status}
                                </span>
                              </div>
                            </div>

                            <div className="text-right rtl:text-left text-xs font-mono text-slate-400">
                              <span>{new Date(selectedWithdrawal.requestedAt).toLocaleString()}</span>
                            </div>
                          </div>

                          {/* Details Table */}
                          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                            <div className="flex justify-between text-slate-300">
                              <span className="text-slate-400">
                                {currentLang === 'ar' ? 'طريقة الاستلام والشبكة:' : 'Payout Method:'}
                              </span>
                              <span className="font-bold text-amber-400 font-mono">
                                {selectedWithdrawal.payoutMethod}
                              </span>
                            </div>

                            <div className="space-y-0.5">
                              <span className="text-slate-400 text-[10px] block">
                                {currentLang === 'ar' ? 'عنوان الحساب المستهدف:' : 'Destination Account:'}
                              </span>
                              <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800/80 gap-2">
                                <span className="text-amber-300 font-mono text-[11px] break-all">
                                  {selectedWithdrawal.payoutDetails || selectedWithdrawal.destinationWallet}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleCopy(selectedWithdrawal.payoutDetails || selectedWithdrawal.destinationWallet || '');
                                  }}
                                  className="p-1 text-slate-400 hover:text-amber-400 cursor-pointer shrink-0"
                                  title="Copy"
                                >
                                  {copiedWallet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>

                            {selectedWithdrawal.txHash && (
                              <div className="space-y-0.5 pt-1 border-t border-slate-800">
                                <span className="text-emerald-400 text-[10px] font-bold block">
                                  {currentLang === 'ar' ? 'هاش المعاملة والتحويل (TXID):' : 'Transaction Hash (TXID):'}
                                </span>
                                <div className="flex items-center justify-between bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 gap-2">
                                  <span className="text-emerald-300 font-mono text-[11px] break-all">
                                    {selectedWithdrawal.txHash}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleCopy(selectedWithdrawal.txHash || '', true);
                                    }}
                                    className="p-1 text-emerald-400 hover:text-emerald-300 cursor-pointer shrink-0"
                                  >
                                    {copiedTxid ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Live P2P Chat Thread */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                            <div className="flex items-center gap-1.5">
                              <Headset className="w-4 h-4 text-amber-400" />
                              <span>{currentLang === 'ar' ? 'محادثة تأكيد التسوية مع قسم المالية' : 'Finance Support Chat'}</span>
                            </div>
                            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                              Live Desk
                            </span>
                          </div>

                          <div
                            ref={chatContainerRef}
                            className="max-h-48 overflow-y-auto bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-2 custom-scrollbar"
                          >
                            {(selectedWithdrawal.chatMessages || []).map((msg) => {
                              const isUser = msg.sender === 'user';
                              const isSystem = msg.sender === 'system';

                              if (isSystem) {
                                return (
                                  <div key={msg.id} className="text-center my-1">
                                    <span className="text-[10px] bg-slate-950 text-slate-400 px-3 py-1 rounded-lg border border-slate-800 inline-block font-mono">
                                      {msg.text}
                                    </span>
                                  </div>
                                );
                              }

                              return (
                                <div
                                  key={msg.id}
                                  className={`p-2.5 rounded-xl text-xs space-y-1 ${
                                    isUser
                                      ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                                      : 'bg-slate-800 text-slate-200'
                                  }`}
                                >
                                  <div className="flex justify-between items-center opacity-75 text-[10px] font-bold">
                                    <span>{isUser ? 'You (Investor)' : 'Finance Desk (Admin)'}</span>
                                    <span>
                                      {new Date(msg.timestamp).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  </div>
                                  <p className="whitespace-pre-wrap">{msg.text}</p>
                                  {msg.txHash && (
                                    <p className="text-[10px] font-mono text-emerald-300">TXID: {msg.txHash}</p>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Chat Input */}
                          <form noValidate onSubmit={handleSendChat} className="flex gap-2 pt-1">
                            <input
                              type="text"
                              value={messageText}
                              onChange={(e) => setMessageText(e.target.value)}
                              placeholder={
                                currentLang === 'ar'
                                  ? 'اكتب رسالتك لمسؤول التحويلات المالية...'
                                  : 'Type your message to Finance Admin...'
                              }
                              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500 shadow-inner"
                            />
                            <button
                              type="submit"
                              disabled={isSendingChat || !messageText.trim()}
                              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-md cursor-pointer transition flex items-center gap-1 shrink-0"
                            >
                              <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>{currentLang === 'ar' ? 'إرسال' : 'Send'}</span>
                            </button>
                          </form>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-slate-500 text-center py-12">
                        {currentLang === 'ar' ? 'اختر طلباً من القائمة لعرض تفاصيله' : 'Select a withdrawal request to view details'}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
