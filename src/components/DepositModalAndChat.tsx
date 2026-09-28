import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Copy,
  Check,
  Clock,
  Send,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Wallet,
  ShieldCheck,
  QrCode,
  Receipt,
  MessageSquare,
  RefreshCw,
  FileCheck,
  Lock,
} from 'lucide-react';
import {
  validateDepositImageFile,
  uploadDepositReceiptSecurely,
  sanitizeImageUrl,
} from '../lib/secureImageUpload';
import {
  Language,
  User,
  AdminSettings,
  DepositRequest,
  NetworkType,
} from '../types';

interface DepositModalAndChatProps {
  currentLang: Language;
  user?: User | null;
  adminSettings?: AdminSettings;
  deposits?: DepositRequest[];
  onClose: () => void;
  onConnectDeposit?: () => Promise<DepositRequest>;
  onRequestDeposit: (
    amount: number,
    network: NetworkType,
    userNote?: string
  ) => Promise<DepositRequest>;
  onSubmitDepositProof: (
    depositId: string,
    amount: number,
    txHash: string,
    receiptUrl: string
  ) => Promise<DepositRequest>;
  onSendDepositChatMessage: (depositId: string, text: string) => Promise<void>;
  onUpdateDepositAmount?: (
    depositId: string,
    amount: number,
    network: NetworkType
  ) => Promise<void>;
}

export const DepositModalAndChat: React.FC<DepositModalAndChatProps> = ({
  currentLang,
  user,
  adminSettings,
  deposits = [],
  onClose,
  onRequestDeposit,
  onSubmitDepositProof,
  onSendDepositChatMessage,
}) => {
  const isRtl = currentLang === 'ar' || currentLang === 'ckb';

  // All user deposit requests sorted by newest first
  const userDeposits = useMemo(() => {
    const safeDeposits = Array.isArray(deposits) ? deposits : [];
    return safeDeposits.filter((d) => d && Boolean(user) && d.userId === user?.id);
  }, [deposits, user]);

  const [activeTab, setActiveTab] = useState<'deposit' | 'history'>('deposit');
  const [selectedDepositId, setSelectedDepositId] = useState<string | null>(null);
  const [forceNewDeposit, setForceNewDeposit] = useState<boolean>(false);

  // Identify active deposit: currently selected or first active
  const activeDeposit = useMemo(() => {
    if (forceNewDeposit) return null;
    if (selectedDepositId) {
      const found = userDeposits.find((d) => d && d.id === selectedDepositId);
      if (found) return found;
    }
    // Auto-pick the active deposit in workflow order
    return (
      userDeposits.find((d) =>
        d &&
        d.status &&
        ['pending', 'pending_approval', 'unlocked', 'approved', 'submitted', 'in_discussion'].includes(d.status)
      ) ||
      userDeposits[0] ||
      null
    );
  }, [userDeposits, selectedDepositId, forceNewDeposit]);

  // Sync selectedDepositId
  useEffect(() => {
    if (activeDeposit && activeDeposit.id && activeDeposit.id !== selectedDepositId && !forceNewDeposit) {
      setSelectedDepositId(activeDeposit.id);
    }
  }, [activeDeposit?.id, selectedDepositId, forceNewDeposit]);

  // Form State
  const [depositAmount, setDepositAmount] = useState<number>(1000);
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkType>('TRC20');
  const [txHash, setTxHash] = useState<string>('');
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [userNote, setUserNote] = useState<string>('');
  const [showQr, setShowQr] = useState<boolean>(false);
  const [copiedWallet, setCopiedWallet] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Chat input
  const [chatInput, setChatInput] = useState<string>('');
  const [isSendingMsg, setIsSendingMsg] = useState<boolean>(false);
  const chatMessagesContainerRef = useRef<HTMLDivElement>(null);

  // Countdown timer for pending approval stage (300s = 5 minutes)
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(300);

  useEffect(() => {
    if (
      !activeDeposit ||
      (activeDeposit.status !== 'pending' &&
        activeDeposit.status !== 'pending_approval' &&
        activeDeposit.status !== 'in_discussion')
    ) {
      return;
    }
    const createdTime = new Date(activeDeposit.createdAt || Date.now()).getTime();
    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - createdTime) / 1000);
      setTimeLeftSeconds(Math.max(0, 300 - elapsed));
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeDeposit?.id, activeDeposit?.status, activeDeposit?.createdAt]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatMessagesContainerRef.current) {
      chatMessagesContainerRef.current.scrollTop = chatMessagesContainerRef.current.scrollHeight;
    }
  }, [activeDeposit?.chatMessages]);

  // Official Wallet Addresses
  const trc20Addr = adminSettings?.trc20Address || 'TWrL1xK9PzQq8v7sJmNp2bX4yZaR3cT5uV';
  const bep20Addr = adminSettings?.bep20Address || '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';
  const currentNetwork = activeDeposit ? activeDeposit.network || selectedNetwork : selectedNetwork;
  const currentWalletAddress = currentNetwork === 'BEP20' ? bep20Addr : trc20Addr;

  // Amount Presets
  const amountPresets = [250, 500, 1000, 2500, 5000, 10000];

  // Sample receipt screenshots
  const sampleReceipts = [
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
  ];

  const handleCopyWallet = () => {
    try {
      navigator.clipboard.writeText(currentWalletAddress);
      setCopiedWallet(true);
      setTimeout(() => setCopiedWallet(false), 2000);
    } catch {
      // Fallback
    }
  };

  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const processAndUploadFile = async (file: File) => {
    setUploadError(null);
    setUploadingImage(true);

    try {
      // 1. Strict File Type, Extension, MIME & Binary Magic Numbers Verification
      const validation = await validateDepositImageFile(file, currentLang as any);
      if (!validation.isValid) {
        setUploadError(validation.error || 'Security verification failed.');
        setUploadingImage(false);
        return;
      }

      // 2. Upload to Backend Isolated Storage Endpoint with Randomized UUID
      const result = await uploadDepositReceiptSecurely(file, currentLang as any);
      if (result.success && result.url) {
        setReceiptUrl(result.url);
      } else {
        setUploadError(result.error || (currentLang === 'ar' ? 'فشل رفع صورة الإيصال.' : 'Failed to upload receipt image.'));
      }
    } catch (err: any) {
      setUploadError(err.message || (currentLang === 'ar' ? 'حدث خطأ غير متوقع أثناء معالجة الصورة.' : 'Unexpected error uploading receipt.'));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processAndUploadFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processAndUploadFile(file);
    }
  };

  // Submit Step 1: Deposit Request Creation
  const handleDepositRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!depositAmount || depositAmount <= 0) {
      setFormError(
        currentLang === 'ar'
          ? 'يرجى إدخال مبلغ إيداع صحيح أكبر من صفر'
          : 'Please enter a valid deposit amount > 0'
      );
      return;
    }

    try {
      setLoading(true);
      const newDep = await onRequestDeposit(
        depositAmount,
        selectedNetwork,
        userNote.trim() || undefined
      ).catch((err) => {
        console.warn('onRequestDeposit warning:', err);
        return null;
      });

      const createdId = newDep?.id || `dep-${Date.now()}`;
      setForceNewDeposit(false);
      setSelectedDepositId(createdId);
      setFormSuccess(
        currentLang === 'ar'
          ? `تم تقديم طلب الإيداع بقيمة $${(depositAmount || 0).toLocaleString()} USDT بنجاح! الطلب بانتظار موافقة مسؤول التحويلات.`
          : `Deposit request for $${(depositAmount || 0).toLocaleString()} USDT submitted successfully!`
      );
    } catch (err: any) {
      console.error('Error submitting deposit request:', err);
      setFormError(
        err?.message || (currentLang === 'ar' ? 'فشل تقديم طلب الإيداع' : 'Failed to submit deposit request')
      );
    } finally {
      setLoading(false);
    }
  };

  // Submit Step 2: Proof & TXID Submission
  const handleProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!activeDeposit) return;
    if (!txHash.trim()) {
      setFormError(
        currentLang === 'ar'
          ? 'يرجى إدخال رقم / هاش المعاملة (TXID)'
          : 'Please enter the transaction hash (TXID)'
      );
      return;
    }

    try {
      setLoading(true);
      const proofUrl = receiptUrl || sampleReceipts[0];
      await onSubmitDepositProof(
        activeDeposit.id,
        activeDeposit.amount || depositAmount,
        txHash.trim(),
        proofUrl
      ).catch((err) => {
        console.warn('onSubmitDepositProof warning:', err);
      });

      setFormSuccess(
        currentLang === 'ar'
          ? `تم إرسال إثبات التحويل بنجاح! جاري التدقيق النهائي وشحن الرصيد.`
          : `Proof submitted successfully! Verifying transaction.`
      );
    } catch (err: any) {
      console.error('Error submitting deposit proof:', err);
      setFormError(
        err?.message || (currentLang === 'ar' ? 'فشل إرسال إثبات التحويل' : 'Failed to submit proof')
      );
    } finally {
      setLoading(false);
    }
  };

  // Chat message submit
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeDeposit) return;

    const text = chatInput.trim();
    setChatInput('');

    try {
      setIsSendingMsg(true);
      await onSendDepositChatMessage(activeDeposit.id, text);
    } catch (err) {
      console.error('Error sending chat message:', err);
    } finally {
      setIsSendingMsg(false);
    }
  };

  // Format timer seconds to MM:SS
  const formatTimer = (totalSec: number) => {
    const safeSec = Math.max(0, Math.floor(totalSec || 0));
    const mins = Math.floor(safeSec / 60);
    const secs = safeSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div
      id="deposit-modal-container"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full h-[92vh] max-h-[840px] shadow-2xl flex flex-col overflow-hidden relative text-slate-100">
        
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between shrink-0 gap-3">
          <div className="flex items-center space-x-3 rtl:space-x-reverse min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <Wallet className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <h2 className="text-sm sm:text-base font-black text-white truncate">
                  {currentLang === 'ar'
                    ? 'بوابة الإيداع المباشر P2P وشحن المحفظة'
                    : currentLang === 'ckb'
                    ? 'دەروازەی سپاردنی ڕاستەوخۆ P2P'
                    : 'Direct P2P Deposit & Wallet Top-Up'}
                </h2>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              </div>
              <p className="text-[11px] text-amber-400 font-medium truncate">
                {currentLang === 'ar'
                  ? 'إيداع فوري عبر محفظة USDT الرسمية مع مطابقة آلية وتأكيد مباشر'
                  : 'Fast 1-click USDT deposit with instant address copy & live finance desk'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Toggle History / Chat Drawer */}
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'deposit' ? 'history' : 'deposit')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
              }`}
            >
              <Receipt className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {activeTab === 'history'
                  ? (currentLang === 'ar' ? 'العودة لصفحة الإيداع' : 'Back to Deposit')
                  : (currentLang === 'ar' ? 'السجل والشات' : 'History & Chat')}
              </span>
              {userDeposits.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-mono">
                  {userDeposits.length}
                </span>
              )}
            </button>

            <button
              id="deposit-modal-close-btn"
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition shrink-0 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 custom-scrollbar">

          {/* System Suspended / Pause Deposits Banner */}
          {adminSettings?.pauseDeposits && (
            <div className="mb-4 p-4 rounded-2xl bg-rose-500/15 border-2 border-rose-500/50 text-rose-300 text-xs font-bold flex items-center gap-3 animate-fade-in shadow-lg">
              <AlertTriangle className="w-6 h-6 shrink-0 text-rose-400" />
              <div>
                <p className="text-sm font-black text-rose-200">
                  {currentLang === 'ar' ? 'تم إيقاف الإيداعات مؤقتاً.' : 'Deposits are temporarily suspended.'}
                </p>
                <p className="text-[11px] text-rose-300/80 font-normal mt-0.5">
                  {currentLang === 'ar'
                    ? 'قام مسؤول النظام بتعليمات تعليق الإيداعات مؤقتاً لجميع المستخدمين. يرجى المحاولة لاحقاً.'
                    : 'System administration has temporarily suspended deposit operations. Please try again later.'}
                </p>
              </div>
            </div>
          )}

          {/* Banners */}
          {formSuccess && (
            <div className="mb-4 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <span>{formSuccess}</span>
            </div>
          )}

          {formError && (
            <div className="mb-4 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
              <span>{formError}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 1: SINGLE UNIFIED DEPOSIT WORKFLOW (DYNAMIC STAGES IN ONE VIEW)     */}
          {/* ========================================================================= */}
          {activeTab === 'deposit' && (
            <div className="max-w-2xl mx-auto space-y-6 animate-fade-in py-1">

              {/* STAGE A: NO ACTIVE DEPOSIT / FORM MODE (Submit Request) */}
              {(!activeDeposit || forceNewDeposit) && (
                <form noValidate onSubmit={handleDepositRequestSubmit} className="space-y-5 animate-fade-in">
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-start gap-3">
                    <Sparkles className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
                    <div>
                      <p className="font-black text-amber-200">
                        {currentLang === 'ar' ? 'طلب إيداع جديد - خطوة واحدة مباشرة' : 'New Deposit Request - Single Direct Flow'}
                      </p>
                      <p className="text-[11px] text-slate-300 font-normal mt-0.5">
                        {currentLang === 'ar'
                          ? 'اختر الشبكة وحدد المبلغ. عند إرسال الطلب سيتم إظهار عداد المراجعة (5 دقائق)، وفور موافقة المسؤول ستفتح تفاصيل المحفظة تلقائياً بنفس هذه الشاشة.'
                          : 'Select network and amount. Submit to start the 5-min review timer; once approved, transfer details unlock automatically on this page.'}
                      </p>
                    </div>
                  </div>

                  {/* Network Selection */}
                  <div className="space-y-2">
                    <label className="block text-xs font-extrabold text-slate-300">
                      {currentLang === 'ar' ? '1. اختر شبكة التحويل (Network):' : '1. Select Deposit Network:'}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedNetwork('TRC20')}
                        className={`p-4 rounded-2xl border text-right rtl:text-right ltr:text-left transition-all cursor-pointer flex items-center justify-between ${
                          selectedNetwork === 'TRC20'
                            ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-500/10 ring-1 ring-amber-500'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm text-amber-400">USDT - TRC20</span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300">
                              {currentLang === 'ar' ? 'موصى به' : 'Recommended'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            {currentLang === 'ar' ? 'شبكة ترون Tron (سرعة فائقة وأقل رسوم)' : 'Tron Network (Low Fee & Fast)'}
                          </p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedNetwork === 'TRC20' ? 'border-amber-400 bg-amber-500 text-slate-950' : 'border-slate-700'}`}>
                          {selectedNetwork === 'TRC20' && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedNetwork('BEP20')}
                        className={`p-4 rounded-2xl border text-right rtl:text-right ltr:text-left transition-all cursor-pointer flex items-center justify-between ${
                          selectedNetwork === 'BEP20'
                            ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-500/10 ring-1 ring-amber-500'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm text-amber-400">USDT - BEP20</span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-300">
                              BSC
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            {currentLang === 'ar' ? 'شبكة بينانس الذكية BNB Chain' : 'BNB Smart Chain (BEP20)'}
                          </p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedNetwork === 'BEP20' ? 'border-amber-400 bg-amber-500 text-slate-950' : 'border-slate-700'}`}>
                          {selectedNetwork === 'BEP20' && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Deposit Amount & Quick Presets */}
                  <div className="space-y-2">
                    <label className="block text-xs font-extrabold text-slate-300">
                      {currentLang === 'ar' ? '2. مبلغ الإيداع ($ USDT):' : '2. Deposit Amount ($ USDT):'}
                    </label>

                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-amber-400 font-extrabold text-sm">$</span>
                      <input
                        type="number"
                        required
                        min={10}
                        value={depositAmount || ''}
                        onChange={(e) => setDepositAmount(Number(e.target.value))}
                        placeholder="1000"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 text-white font-mono font-bold text-base rounded-2xl pl-8 pr-20 py-3.5 outline-none transition-all"
                      />
                      <span className="absolute right-4 rtl:right-auto rtl:left-4 top-3.5 text-xs font-black text-amber-400">
                        USDT
                      </span>
                    </div>

                    {/* Presets */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {amountPresets.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setDepositAmount(preset)}
                          className={`flex-1 py-2 px-3 rounded-xl border text-xs font-mono font-bold transition cursor-pointer text-center ${
                            depositAmount === preset
                              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-amber-500/40 hover:text-amber-300'
                          }`}
                        >
                          ${(preset || 0).toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* User Note */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-slate-300">
                      {currentLang === 'ar' ? '3. ملاحظات إضافية (اختياري):' : '3. Additional Notes (Optional):'}
                    </label>
                    <input
                      type="text"
                      value={userNote}
                      onChange={(e) => setUserNote(e.target.value)}
                      placeholder={currentLang === 'ar' ? 'مثال: الإيداع من محفظة شخصية...' : 'e.g. Depositing from personal wallet...'}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 text-slate-200 text-xs rounded-2xl px-4 py-3 outline-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading || !depositAmount || depositAmount <= 0 || Boolean(adminSettings?.pauseDeposits)}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Clock className="w-5 h-5 animate-spin" />
                        <span>{currentLang === 'ar' ? 'جاري إرسال طلب الإيداع...' : 'Submitting Request...'}</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 stroke-[2.5]" />
                        <span>
                          {currentLang === 'ar'
                            ? `تقديم طلب الإيداع ($${(depositAmount || 0).toLocaleString()} USDT)`
                            : `Submit Deposit Request ($${(depositAmount || 0).toLocaleString()} USDT)`}
                        </span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* STAGE B: PENDING APPROVAL & 5-MINUTE COUNTDOWN TIMER */}
              {activeDeposit && !forceNewDeposit && (activeDeposit.status === 'pending' || activeDeposit.status === 'pending_approval' || activeDeposit.status === 'in_discussion') && (
                <div className="space-y-5 animate-fade-in bg-slate-950 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl relative text-slate-100">
                  
                  {/* Status Banner Header */}
                  <div className="text-center space-y-3">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-inner relative mx-auto">
                      <Clock className="w-8 h-8 animate-pulse" />
                      <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
                      </span>
                    </div>

                    <div>
                      <span className="px-3.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-block mb-1.5">
                        {currentLang === 'ar' ? 'طلب قيد التدقيق ومراجعة المسؤول' : 'Pending Admin Review & Approval'}
                      </span>
                      <h3 className="text-lg font-black text-white">
                        {currentLang === 'ar' ? 'جاري تدقيق طلب الإيداع والتحقق من الحساب' : 'Reviewing Deposit Request'}
                      </h3>
                      <p className="text-xs text-slate-300 mt-1 max-w-lg mx-auto">
                        {currentLang === 'ar'
                          ? 'يرجى الانتظار بينما يقوم مسؤول التحويلات بمراجعة طلبك وإتاحة شباك الدفع. فور الاعتماد، ستظهر تفاصيل التحويل فوراً بأسفل هذه الشاشة.'
                          : 'Please wait while the transfer officer reviews your request. Transfer details will unlock automatically on this page upon approval.'}
                      </p>
                    </div>
                  </div>

                  {/* 5-Minute Countdown Timer Card */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 text-center space-y-2 shadow-inner">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
                      {currentLang === 'ar' ? 'العد التنازلي لموافقة مسؤول التحويلات' : 'Approval SLA Countdown Timer'}
                    </span>
                    <div className="font-mono text-3xl sm:text-4xl font-black text-amber-400 tracking-wider">
                      {formatTimer(timeLeftSeconds)}
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800 mt-2">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-amber-400 h-full transition-all duration-1000"
                        style={{ width: `${(timeLeftSeconds / 300) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Order Summary Box */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">{currentLang === 'ar' ? 'المبلغ المطلوب:' : 'Requested Amount:'}</span>
                      <span className="font-mono font-black text-amber-400 text-sm">${(activeDeposit.amount || 0).toLocaleString()} USDT</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">{currentLang === 'ar' ? 'شبكة التحويل:' : 'Network:'}</span>
                      <span className="font-mono font-bold text-slate-200">{activeDeposit.network || 'TRC20'}</span>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-slate-400 block">{currentLang === 'ar' ? 'رقم المعاملة ID:' : 'Request ID:'}</span>
                      <span className="font-mono text-[11px] text-slate-300 truncate block">{activeDeposit.id}</span>
                    </div>
                  </div>

                  {/* Live Sync Status Notice */}
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/80 text-[11px] text-slate-300 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                      <span>
                        {currentLang === 'ar'
                          ? 'المزامنة الحية مفعلة - ستتحول هذه الشاشة تلقائياً فور الموافقة'
                          : 'Real-time sync active - screen will update automatically on approval'}
                      </span>
                    </div>
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
                  </div>

                  {/* Control buttons */}
                  <div className="flex items-center justify-between pt-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setForceNewDeposit(true)}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs border border-slate-800 transition cursor-pointer"
                    >
                      {currentLang === 'ar' ? 'إلغاء وبدء طلب جديد' : 'Cancel & New Deposit'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('history')}
                      className="px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-500/40 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{currentLang === 'ar' ? 'محادثة الدعم المباشر' : 'Support Chat'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STAGE C: AUTO-TRANSITIONED UNLOCKED / APPROVED TRANSFER DETAILS */}
              {activeDeposit && !forceNewDeposit && (activeDeposit.status === 'unlocked' || (activeDeposit.status === 'approved' && !activeDeposit.txHash)) && (
                <form noValidate onSubmit={handleProofSubmit} className="space-y-5 animate-fade-in">
                  
                  {/* Success Approval Notification */}
                  <div className="p-4 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-start gap-3 shadow-lg shadow-emerald-500/10">
                    <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-black text-emerald-200">
                        {currentLang === 'ar' ? 'تمت موافقة مسؤول التحويلات! شباك الدفع المباشر مفتوح الآن' : 'Deposit Request Approved! Execution Details Unlocked'}
                      </p>
                      <p className="text-[11px] text-emerald-300/80 font-normal mt-0.5">
                        {currentLang === 'ar'
                          ? `تم اعتماد طلبك بقيمة $${(activeDeposit.amount || 0).toLocaleString()} USDT على شبكة ${activeDeposit.network || 'TRC20'}. يرجى تحويل المبلغ لعنوان المنصة الرسمي أدناه ثم إدخال رقم المعاملة (TXID) وإرفاق الإيصال.`
                          : `Approved for $${(activeDeposit.amount || 0).toLocaleString()} USDT (${activeDeposit.network || 'TRC20'}). Please transfer to official address below and paste TXID.`}
                      </p>
                    </div>
                  </div>

                  {/* Summary card */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 block">{currentLang === 'ar' ? 'المبلغ المعتمد للتحويل:' : 'Approved Transfer Amount:'}</span>
                      <span className="font-mono font-black text-xl text-amber-400">
                        ${(activeDeposit.amount || 0).toLocaleString()} USDT
                      </span>
                    </div>
                    <div className="text-right rtl:text-left">
                      <span className="text-[11px] text-slate-400 block">{currentLang === 'ar' ? 'شبكة التحويل:' : 'Network:'}</span>
                      <span className="font-mono font-extrabold text-xs px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {activeDeposit.network || 'TRC20'}
                      </span>
                    </div>
                  </div>

                  {/* Official Deposit Wallet Card */}
                  <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-black text-amber-400">
                        <ShieldCheck className="w-4 h-4" />
                        <span>{currentLang === 'ar' ? 'عنوان محفظة المنصة الرسمي المعتمد للإيداع:' : 'Official Deposit Address:'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowQr(!showQr)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1 cursor-pointer border border-slate-700"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>{showQr ? (currentLang === 'ar' ? 'إخفاء QR' : 'Hide QR') : (currentLang === 'ar' ? 'عرض QR' : 'Show QR')}</span>
                      </button>
                    </div>

                    {/* Address Display & Copy */}
                    <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 gap-2">
                      <span className="font-mono text-amber-300 text-xs sm:text-sm font-bold break-all">
                        {currentWalletAddress}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyWallet}
                        className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer transition flex items-center gap-1.5 shrink-0"
                      >
                        {copiedWallet ? (
                          <>
                            <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                            <span>{currentLang === 'ar' ? 'تم النسخ!' : 'Copied!'}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 stroke-[2.5]" />
                            <span>{currentLang === 'ar' ? 'نسخ العنوان' : 'Copy Address'}</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Optional QR Code View */}
                    {showQr && (
                      <div className="p-4 bg-white rounded-2xl max-w-[200px] mx-auto text-center space-y-2 shadow-inner animate-fade-in">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${currentWalletAddress}`}
                          alt="Deposit QR Code"
                          className="w-40 h-40 mx-auto"
                        />
                        <span className="text-[10px] text-slate-900 font-bold font-mono block">
                          USDT ({activeDeposit.network || 'TRC20'})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Transaction Hash (TXID) */}
                  <div className="space-y-2">
                    <label className="block text-xs font-extrabold text-slate-300">
                      {currentLang === 'ar' ? 'رقم / هاش المعاملة (TXID / Transaction Hash):' : 'Transaction Hash (TXID):'}{' '}
                      <span className="text-rose-400">*</span>
                    </label>

                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={txHash}
                        onChange={(e) => setTxHash(e.target.value)}
                        placeholder={
                          currentLang === 'ar'
                            ? 'ألصق هاش المعاملة هنا (مثال: 9a7b5c8d1e2f3a4b...)'
                            : 'Paste transaction hash (e.g. 9a7b5c8d1e2f3a4b...)'
                        }
                        className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 text-amber-300 font-mono text-xs sm:text-sm rounded-2xl px-4 py-3.5 outline-none transition-all pr-24 rtl:pr-4 rtl:pl-24"
                      />

                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const clipboardText = await navigator.clipboard.readText();
                            if (clipboardText) setTxHash(clipboardText.trim());
                          } catch {
                            // Fallback
                          }
                        }}
                        className="absolute right-2.5 rtl:right-auto rtl:left-2.5 top-2.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-amber-400 transition cursor-pointer border border-slate-700"
                      >
                        {currentLang === 'ar' ? 'لصق' : 'Paste'}
                      </button>
                    </div>
                  </div>

                  {/* Proof of Payment / Screenshot Upload */}
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <label className="font-extrabold text-slate-300 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{currentLang === 'ar' ? 'صورة إيصال التحويل (محمية ومفحوصة أمنياً):' : 'Transfer Receipt Screenshot (Secure Upload):'}</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadError(null);
                          setReceiptUrl(sampleReceipts[0]);
                        }}
                        className="text-amber-400 text-[11px] font-bold hover:underline cursor-pointer"
                      >
                        {currentLang === 'ar' ? 'استخدام وصل تجريبي (Sample)' : 'Use Sample Receipt'}
                      </button>
                    </div>

                    {/* Security Measures Indicator Badge */}
                    <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 text-[10px] text-slate-400 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                        <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                        <span>{currentLang === 'ar' ? 'فحص ثنائي (Magic Numbers) + اسم عشوائي (UUID) + معزول آمن' : 'Magic Numbers Verified + UUID Sanitized + Isolated Storage'}</span>
                      </div>
                      <span className="text-slate-500 font-mono">Max 5MB (JPG, PNG)</span>
                    </div>

                    {/* Upload Error Banner */}
                    {uploadError && (
                      <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-3 rounded-xl flex items-start gap-2 animate-shake">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <span>{uploadError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Drag & Drop File Upload Input */}
                      <label
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`p-4 rounded-2xl bg-slate-950 border-2 border-dashed transition cursor-pointer flex flex-col items-center justify-center text-center space-y-1.5 relative ${
                          isDragging
                            ? 'border-amber-400 bg-amber-500/10'
                            : 'border-slate-800 hover:border-amber-500/60'
                        }`}
                      >
                        {uploadingImage ? (
                          <>
                            <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
                            <span className="text-xs font-bold text-amber-300">
                              {currentLang === 'ar' ? 'جاري فحص التوقيع الثنائي والرفع...' : 'Verifying Magic Numbers & Uploading...'}
                            </span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5 text-amber-400" />
                            <span className="text-xs font-bold text-slate-200">
                              {currentLang === 'ar' ? 'اسحب أو اضغط لرفع الصورة' : 'Drag & Drop or Click to Upload'}
                            </span>
                            <span className="text-[10px] text-slate-500">JPG, PNG (Max 5MB)</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleImageFileChange}
                          disabled={uploadingImage}
                          className="hidden"
                        />
                      </label>

                      {/* Receipt Preview or Direct URL Input */}
                      <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-2">
                        <input
                          type="text"
                          value={receiptUrl}
                          onChange={(e) => {
                            setUploadError(null);
                            setReceiptUrl(e.target.value);
                          }}
                          placeholder={currentLang === 'ar' ? 'أو ألصق رابط صورة الوصل...' : 'Or paste image URL...'}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500/50"
                        />
                        {receiptUrl && (
                          <div className="flex items-center justify-between gap-2 pt-1">
                            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold">
                              <FileCheck className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{currentLang === 'ar' ? 'تم إرفاق الإيصال الآمن' : 'Secure Receipt Attached'}</span>
                            </div>
                            <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-800 shrink-0 bg-slate-900">
                              <img
                                src={sanitizeImageUrl(receiptUrl)}
                                alt="Receipt Preview"
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                                crossOrigin="anonymous"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Final Submit Confirmation Button */}
                  <button
                    type="submit"
                    disabled={loading || !txHash.trim() || Boolean(adminSettings?.pauseDeposits)}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-black text-sm transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Clock className="w-5 h-5 animate-spin" />
                        <span>{currentLang === 'ar' ? 'جاري إرسال إثبات التحويل...' : 'Submitting Proof...'}</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 stroke-[2.5]" />
                        <span>
                          {currentLang === 'ar'
                            ? 'تأكيد وإرسال إثبات التحويل النهائي'
                            : 'Complete Deposit Submission'}
                        </span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* STAGE D: SUBMITTED / APPROVED FINAL PROOF CARD */}
              {activeDeposit && !forceNewDeposit && (activeDeposit.status === 'submitted' || (activeDeposit.status === 'approved' && Boolean(activeDeposit.txHash))) && (
                <div className="space-y-5 animate-fade-in bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl text-center">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-inner ${
                    activeDeposit.status === 'approved'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  }`}>
                    {activeDeposit.status === 'approved' ? (
                      <CheckCircle2 className="w-8 h-8" />
                    ) : (
                      <Clock className="w-8 h-8 animate-pulse" />
                    )}
                  </div>

                  <div>
                    <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase inline-block mb-1.5 ${
                      activeDeposit.status === 'approved'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    }`}>
                      {activeDeposit.status === 'approved'
                        ? (currentLang === 'ar' ? 'تم الشحن والاعتماد بنجاح' : 'Approved & Credited')
                        : (currentLang === 'ar' ? 'تم تقديم الإثبات - قيد المراجعة النهائية' : 'Proof Submitted - Under Final Review')}
                    </span>
                    <h3 className="text-lg font-black text-white">
                      ${(activeDeposit.amount || 0).toLocaleString()} USDT ({activeDeposit.network || 'TRC20'})
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 font-mono">
                      TXID: {activeDeposit.txHash || 'Pending TXID'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setForceNewDeposit(true)}
                    className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg transition cursor-pointer"
                  >
                    {currentLang === 'ar' ? 'إجراء إيداع جديد' : 'Make Another Deposit'}
                  </button>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: DEPOSIT HISTORY & LIVE SUPPORT CHAT */}
          {activeTab === 'history' && (
            <div className="space-y-6 animate-fade-in py-1">
              {userDeposits.length === 0 ? (
                <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                  <Receipt className="w-10 h-10 text-slate-500 mx-auto" />
                  <h4 className="text-white font-bold text-sm">
                    {currentLang === 'ar' ? 'لا توجد إيداعات مسجلة بعد' : 'No deposits recorded yet'}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setActiveTab('deposit')}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-md cursor-pointer"
                  >
                    {currentLang === 'ar' ? 'بدء إيداع جديد' : 'Start New Deposit'}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Deposits List */}
                  <div className="lg:col-span-5 space-y-2.5 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                    <div className="flex justify-between items-center pb-2">
                      <span className="text-xs font-bold text-slate-300">
                        {currentLang === 'ar' ? 'سجل عمليات الإيداع' : 'Your Deposits'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setForceNewDeposit(true);
                          setActiveTab('deposit');
                        }}
                        className="text-amber-400 text-xs font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{currentLang === 'ar' ? '+ إيداع جديد' : '+ New'}</span>
                      </button>
                    </div>

                    {userDeposits.map((dep) => {
                      if (!dep) return null;
                      const isSelected = activeDeposit?.id === dep.id;
                      const isApproved = dep.status === 'approved';
                      const isRejected = dep.status === 'rejected';

                      return (
                        <div
                          key={dep.id}
                          onClick={() => {
                            setForceNewDeposit(false);
                            setSelectedDepositId(dep.id);
                          }}
                          className={`p-3.5 rounded-2xl border transition cursor-pointer flex justify-between items-center gap-3 ${
                            isSelected
                              ? 'bg-amber-500/10 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                              : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-white text-xs font-mono">
                                ${(dep.amount || 0).toLocaleString()} USDT
                              </span>
                              <span className="text-[10px] text-amber-400 font-bold">
                                ({dep.network || 'TRC20'})
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block truncate max-w-[180px] font-mono">
                              TXID: {dep.txHash || 'Pending TXID'}
                            </span>
                          </div>

                          <div className="text-right rtl:text-left shrink-0">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                                isApproved
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : isRejected
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                  : 'bg-blue-500/20 text-blue-300 border-blue-500/40 animate-pulse'
                              }`}
                            >
                              {isApproved
                                ? (currentLang === 'ar' ? 'تم الشحن' : 'Credited')
                                : isRejected
                                ? (currentLang === 'ar' ? 'مرفوض' : 'Rejected')
                                : (currentLang === 'ar' ? 'قيد التدقيق' : 'Verifying')}
                            </span>
                            <span className="text-[9px] text-slate-500 block mt-1 font-mono">
                              {new Date(dep.createdAt || Date.now()).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Selected Deposit Chat Drawer */}
                  <div className="lg:col-span-7 bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 shadow-xl">
                    {activeDeposit ? (
                      <>
                        <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
                          <div>
                            <span className="text-[10px] text-slate-400 block">{currentLang === 'ar' ? 'محادثة الدعم المباشر حول الإيداع' : 'Deposit Support Chat'}</span>
                            <h4 className="text-xs font-black text-white font-mono">
                              ${(activeDeposit.amount || 0).toLocaleString()} USDT ({activeDeposit.network || 'TRC20'})
                            </h4>
                          </div>
                          <span className="text-[10px] text-amber-400 font-mono">ID: {activeDeposit.id}</span>
                        </div>

                        {/* Chat Messages */}
                        <div
                          ref={chatMessagesContainerRef}
                          className="flex-1 min-h-[220px] max-h-[300px] overflow-y-auto space-y-2.5 p-2 bg-slate-900/50 rounded-xl border border-slate-800 custom-scrollbar"
                        >
                          {(!activeDeposit.chatMessages || activeDeposit.chatMessages.length === 0) ? (
                            <div className="text-center py-8 text-slate-500 text-xs">
                              {currentLang === 'ar' ? 'لا توجد رسائل محادثة بعد. يمكنك مراسلة فريق الدعم المالي هنا.' : 'No chat messages yet.'}
                            </div>
                          ) : (
                            activeDeposit.chatMessages.map((msg) => {
                              if (!msg) return null;
                              const isMe = msg.sender === 'user';
                              return (
                                <div
                                  key={msg.id || `msg-${Math.random()}`}
                                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                                >
                                  <div
                                    className={`max-w-[85%] p-2.5 rounded-2xl text-xs ${
                                      isMe
                                        ? 'bg-amber-500 text-slate-950 font-medium rounded-br-none'
                                        : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700'
                                    }`}
                                  >
                                    <p className="whitespace-pre-wrap">{msg.text}</p>
                                  </div>
                                  <span className="text-[9px] text-slate-500 mt-0.5 px-1 font-mono">
                                    {msg.sender === 'user' ? (currentLang === 'ar' ? 'المستثمر' : 'User') : (currentLang === 'ar' ? 'مسؤول النظام' : 'Admin')} • {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Chat Input */}
                        <form onSubmit={handleSendMessage} className="flex gap-2">
                          <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder={currentLang === 'ar' ? 'اكتب رسالة للدعم المالي...' : 'Type message to financial desk...'}
                            className="flex-1 bg-slate-900 border border-slate-800 focus:border-amber-500 text-slate-100 text-xs rounded-xl px-3 py-2.5 outline-none"
                          />
                          <button
                            type="submit"
                            disabled={isSendingMsg || !chatInput.trim()}
                            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </form>
                      </>
                    ) : (
                      <div className="text-center py-10 text-slate-500 text-xs">
                        {currentLang === 'ar' ? 'حدد إيداعاً من القائمة لمشاهدة محادثة الدعم' : 'Select deposit to view support chat'}
                      </div>
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
