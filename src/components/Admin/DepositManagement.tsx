import React, { useState, useMemo, useEffect, useRef } from 'react';
import { sanitizeImageUrl } from '../../lib/secureImageUpload';
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  Send,
  ShieldCheck,
  AlertCircle,
  DollarSign,
  User as UserIcon,
  Mail,
  FileText,
  Sparkles,
  RefreshCw,
  X,
  PlusCircle,
  Zap,
  Wallet,
  ArrowUpRight,
  Edit3,
  Unlock,
  Lock,
  ArrowRight,
  Info,
  Maximize2,
  Download,
  CheckCheck,
} from 'lucide-react';
import { DepositRequest, DepositStatus, Language, NetworkType, User } from '../../types';
import { translations } from '../../i18n/translations';
import { ManualCreditModal } from './ManualCreditModal';

export interface DepositManagementProps {
  currentLang: Language;
  deposits: DepositRequest[];
  users?: User[];
  onReviewDeposit: (
    id: string,
    status: 'approved' | 'rejected' | 'unlocked',
    note?: string,
    txHash?: string,
    receiptUrl?: string,
    amount?: number
  ) => Promise<void>;
  onSendAdminChatMessage: (depositId: string, text: string) => Promise<void>;
  onRefreshState?: () => void;
  onCreditSuccess?: (updatedUser: User, message: string) => void;
}

export const DepositManagement: React.FC<DepositManagementProps> = ({
  currentLang,
  deposits,
  users = [],
  onReviewDeposit,
  onSendAdminChatMessage,
  onRefreshState,
  onCreditSuccess,
}) => {
  const t = translations[currentLang] || translations.ar;
  const isRtl = currentLang === 'ar' || currentLang === 'ckb';

  // Internal users state for manual credit modal
  const [internalUsers, setInternalUsers] = useState<User[]>(users);

  useEffect(() => {
    if (users && users.length > 0) {
      setInternalUsers(users);
    } else {
      fetch('/api/admin/users')
        .then((res) => res.json())
        .then((data) => {
          if (data.investors) setInternalUsers(data.investors);
        })
        .catch(() => {});
    }
  }, [users]);

  // Filter & Search States
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Active Deposit
  const [selectedDepositId, setSelectedDepositId] = useState<string | null>(() => {
    return sessionStorage.getItem('aseel_admin_selected_deposit_id') || deposits[0]?.id || null;
  });

  useEffect(() => {
    if (selectedDepositId) {
      sessionStorage.setItem('aseel_admin_selected_deposit_id', selectedDepositId);
    }
  }, [selectedDepositId]);

  useEffect(() => {
    if (!selectedDepositId && deposits.length > 0) {
      setSelectedDepositId(deposits[0].id);
    }
  }, [deposits, selectedDepositId]);

  // Admin Chat & Action Form States
  const [adminReplyText, setAdminReplyText] = useState<string>('');
  const [isSendingChat, setIsSendingChat] = useState<boolean>(false);
  const [adminTxHash, setAdminTxHash] = useState<string>('');
  const [adminNote, setAdminNote] = useState<string>('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Modals
  const [receiptModalUrl, setReceiptModalUrl] = useState<string | null>(null);
  const [rejectModalDeposit, setRejectModalDeposit] = useState<DepositRequest | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('تعذر التحقق من إشعار التحويل أو رقم المعاملة');
  const [isManualCreditOpen, setIsManualCreditOpen] = useState<boolean>(false);

  // Copy Feedback state
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({});

  // Toast Notification state
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Chat container ref for auto-scrolling
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 1. Top Metric Cards Calculations
  const stats = useMemo(() => {
    const isPending = (s: DepositStatus) =>
      s === 'pending' ||
      s === 'pending_approval' ||
      s === 'submitted' ||
      s === 'unlocked' ||
      s === 'in_discussion';

    const isCompleted = (s: DepositStatus) => s === 'approved';
    const isRejected = (s: DepositStatus) => s === 'rejected';

    const pendingRequests = deposits.filter((d) => isPending(d.status));
    const completedRequests = deposits.filter((d) => isCompleted(d.status));
    const rejectedRequests = deposits.filter((d) => isRejected(d.status));

    const pendingVolume = pendingRequests.reduce((acc, c) => acc + (c.amount || 0), 0);
    const completedVolume = completedRequests.reduce((acc, c) => acc + (c.amount || 0), 0);

    const totalProcessed = completedRequests.length + rejectedRequests.length;
    const fulfillmentRate =
      totalProcessed > 0
        ? Math.round((completedRequests.length / totalProcessed) * 100)
        : deposits.length > 0
        ? Math.round((completedRequests.length / deposits.length) * 100)
        : 100;

    return {
      pendingCount: pendingRequests.length,
      pendingVolume,
      completedVolume,
      completedCount: completedRequests.length,
      rejectedCount: rejectedRequests.length,
      fulfillmentRate,
    };
  }, [deposits]);

  // 2. Filter & Search Logic
  const filteredDeposits = useMemo(() => {
    return deposits.filter((item) => {
      // Status Filter
      if (statusFilter === 'pending') {
        const isPending =
          item.status === 'pending' ||
          item.status === 'pending_approval' ||
          item.status === 'submitted' ||
          item.status === 'unlocked' ||
          item.status === 'in_discussion';
        if (!isPending) return false;
      } else if (statusFilter === 'completed') {
        if (item.status !== 'approved') return false;
      } else if (statusFilter === 'rejected') {
        if (item.status !== 'rejected') return false;
      }

      // Live Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.userName?.toLowerCase().includes(q);
        const matchEmail = item.userEmail?.toLowerCase().includes(q);
        const matchTx = item.txHash?.toLowerCase().includes(q);
        const matchId = item.id.toLowerCase().includes(q);
        const matchNetwork = item.network?.toLowerCase().includes(q);
        const matchAmount = item.amount?.toString().includes(q);

        if (!matchName && !matchEmail && !matchTx && !matchId && !matchNetwork && !matchAmount) {
          return false;
        }
      }

      return true;
    });
  }, [deposits, statusFilter, searchQuery]);

  // Active Deposit Object
  const activeDepositObj = useMemo(() => {
    if (!selectedDepositId) return filteredDeposits[0] || deposits[0] || null;
    return deposits.find((d) => d.id === selectedDepositId) || filteredDeposits[0] || deposits[0] || null;
  }, [deposits, selectedDepositId, filteredDeposits]);

  // Sync active deposit default txHash
  useEffect(() => {
    if (activeDepositObj) {
      setAdminTxHash(activeDepositObj.txHash || '');
      setAdminNote(activeDepositObj.adminNote || '');
    }
  }, [activeDepositObj?.id]);

  // Auto-scroll chat container
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [activeDepositObj?.chatMessages]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedMap((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedMap((prev) => ({ ...prev, [key]: false }));
    }, 2000);
  };

  // Handle Chat Send
  const handleAdminSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDepositObj || !adminReplyText.trim()) return;

    try {
      setIsSendingChat(true);
      await onSendAdminChatMessage(activeDepositObj.id, adminReplyText.trim());
      setAdminReplyText('');
      if (onRefreshState) onRefreshState();
    } catch (err) {
      console.error('Failed to send admin chat message', err);
    } finally {
      setIsSendingChat(false);
    }
  };

  // Handle Unlock / Approve Deposit Request for Client Payment Execution
  const handleUnlockDeposit = async (dep: DepositRequest) => {
    try {
      setActionLoadingId(dep.id);
      await onReviewDeposit(
        dep.id,
        'unlocked',
        adminNote.trim() || 'تمت موافقة مسؤول التحويلات بشركة أصيل. تم فتح نافذة الدفع وتأكيد الإيداع للعميل.',
        adminTxHash.trim() || dep.txHash,
        dep.receiptUrl,
        dep.amount
      );

      showToast(
        isRtl
          ? `✅ تمت الموافقة على طلب الإيداع وفتح شباك تنفيذ الدفع للعميل (${dep.userName})!`
          : `✅ Deposit request approved & execution window unlocked for ${dep.userName}!`
      );

      if (onRefreshState) onRefreshState();
    } catch (err: any) {
      showToast(err.message || 'Unlock failed', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Approve & Top-Up
  const handleApproveDeposit = async (dep: DepositRequest) => {
    try {
      setActionLoadingId(dep.id);
      await onReviewDeposit(
        dep.id,
        'approved',
        adminNote.trim() || 'تم اعتماد وتأكيد إيداع المبلغ في المحفظة بنجاح',
        adminTxHash.trim() || dep.txHash,
        dep.receiptUrl,
        dep.amount
      );

      showToast(
        isRtl
          ? `✅ تم اعتماد وشحن $${dep.amount.toLocaleString()} USDT بنجاح في رصيد (${dep.userName})!`
          : `✅ Deposit approved & $${dep.amount.toLocaleString()} USDT credited to ${dep.userName}!`
      );

      if (onRefreshState) onRefreshState();
    } catch (err: any) {
      showToast(err.message || 'Approval failed', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Reject
  const handleConfirmReject = async () => {
    if (!rejectModalDeposit) return;
    try {
      setActionLoadingId(rejectModalDeposit.id);
      await onReviewDeposit(
        rejectModalDeposit.id,
        'rejected',
        rejectReason.trim() || 'تعذر التحقق من الإيداع',
        rejectModalDeposit.txHash,
        rejectModalDeposit.receiptUrl
      );

      showToast(
        isRtl ? '❌ تم رفض طلب الإيداع وإشعار المستثمر في المحادثة' : 'Deposit request rejected and investor notified',
        'error'
      );

      setRejectModalDeposit(null);
      if (onRefreshState) onRefreshState();
    } catch (err: any) {
      showToast(err.message || 'Reject failed', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Check if active deposit has receipt
  const getReceiptUrl = (dep: DepositRequest) => {
    if (dep.receiptUrl) return dep.receiptUrl;
    const msgWithReceipt = dep.chatMessages?.find((m) => m.receiptUrl);
    return msgWithReceipt?.receiptUrl || null;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 left-6 rtl:left-auto rtl:right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold transition-all animate-bounce border ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50 shadow-emerald-950/50'
              : 'bg-rose-950/90 text-rose-300 border-rose-500/50 shadow-rose-950/50'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* 1. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Pending Requests */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3 rtl:space-x-reverse shadow-md">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-bold">
              {currentLang === 'ar' ? 'طلبات الإيداع المعلقة' : 'Pending Deposit Requests'}
            </p>
            <p className="text-xl font-black text-amber-400">{stats.pendingCount}</p>
          </div>
        </div>

        {/* Metric 2: Pending Volume */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3 rtl:space-x-reverse shadow-md">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-bold">
              {currentLang === 'ar' ? 'حجم الإيداعات المعلقة' : 'Pending Deposit Volume'}
            </p>
            <p className="text-xl font-black text-white font-mono">
              ${stats.pendingVolume.toLocaleString()} <span className="text-xs text-amber-400">USDT</span>
            </p>
          </div>
        </div>

        {/* Metric 3: Approved Volume */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3 rtl:space-x-reverse shadow-md">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-bold">
              {currentLang === 'ar' ? 'إجمالي الإيداعات المعتمدة' : 'Total Approved Deposits'}
            </p>
            <p className="text-xl font-black text-emerald-400 font-mono">
              ${stats.completedVolume.toLocaleString()} <span className="text-xs text-emerald-300">USDT</span>
            </p>
          </div>
        </div>

        {/* Metric 4: Success Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3 rtl:space-x-reverse shadow-md">
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-bold">
              {currentLang === 'ar' ? 'معدل القبول والاعتماد' : 'Approval Success Rate'}
            </p>
            <p className="text-xl font-black text-blue-400">{stats.fulfillmentRate}%</p>
          </div>
        </div>
      </div>

      {/* 2. Main Deposit Management Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        {/* Header with Title, Actions and Filter Tabs */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-black text-white">
              {currentLang === 'ar' ? 'إدارة واعتماد طلبات الإيداع وشحن الأرصدة P2P' : 'P2P Deposit Requests & Credit Desk'}
            </h2>
            <p className="text-xs text-slate-400">
              {currentLang === 'ar'
                ? 'مراجعة إيداعات المستثمرين بنقرة واحدة، شحن الرصيد تلقائياً، تدقيق الإيصالات والمحادثة المباشرة.'
                : 'Streamlined 1-click deposit verification, automated balance top-up & real-time chat.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Manual Credit Action Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setIsManualCreditOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/30 transition cursor-pointer flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>{currentLang === 'ar' ? 'إضافة رصيد يدوي' : 'Manual Credit'}</span>
            </button>

            {/* Status Filter Tabs */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              {(['all', 'pending', 'completed', 'rejected'] as const).map((filterVal) => (
                <button
                  key={filterVal}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setStatusFilter(filterVal);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                    statusFilter === filterVal
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {filterVal === 'all'
                    ? currentLang === 'ar'
                      ? 'الكل'
                      : 'All'
                    : filterVal === 'pending'
                    ? currentLang === 'ar'
                      ? 'المعلقة'
                      : 'Pending'
                    : filterVal === 'completed'
                    ? currentLang === 'ar'
                      ? 'المكتملة'
                      : 'Completed'
                    : currentLang === 'ar'
                    ? 'المرفوضة'
                    : 'Rejected'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              currentLang === 'ar'
                ? 'بحث باسم المستثمر، البريد، المحفظة، أو رقم الطلب أو الهاش (TXID)...'
                : 'Search by investor, email, wallet address, TXID, or request ID...'
            }
            className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-2xl pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-3 text-xs text-white outline-none"
          />
        </div>

        {/* 3. Main Deposit Split Layout (Left: Queue, Right: Active Card) */}
        {filteredDeposits.length === 0 ? (
          <div className="p-12 text-center bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <Wallet className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-300">
              {currentLang === 'ar' ? 'لا توجد طلبات إيداع تطابق البحث' : 'No deposit requests found'}
            </p>
            <p className="text-xs text-slate-500">
              {currentLang === 'ar'
                ? 'جميع طلبات الإيداع معالجة أو لا توجد نتائج مطابقة.'
                : 'All requests have been processed or no matching results.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Deposit Queue List */}
            <div className="lg:col-span-5 space-y-2.5 max-h-[620px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredDeposits.map((dep) => {
                const isSelected = activeDepositObj?.id === dep.id;
                const isCompleted = dep.status === 'approved';
                const isRejected = dep.status === 'rejected';
                const hasReceipt = Boolean(getReceiptUrl(dep));

                return (
                  <div
                    key={dep.id}
                    onClick={() => setSelectedDepositId(dep.id)}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex justify-between items-center gap-3 ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/60 shadow-lg ring-1 ring-amber-500/40'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white text-xs truncate">{dep.userName}</span>
                        <span className="text-[10px] text-amber-400 font-mono">#{dep.id.slice(-6)}</span>
                        {hasReceipt && (
                          <span
                            title="Receipt Attached"
                            className="px-1 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[9px] font-bold"
                          >
                            إيصال
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-amber-300 font-mono font-black">
                          ${(dep.amount || 0).toLocaleString()} USDT
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-300">
                          {dep.network || 'USDT_TRC20'}
                        </span>
                      </div>

                      <span className="text-[10px] text-slate-400 block truncate max-w-[200px] font-mono">
                        {dep.txHash || dep.userNote || 'إيداع مباشر P2P'}
                      </span>
                    </div>

                    <div className="text-right rtl:text-left shrink-0">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border inline-block ${
                          isCompleted
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : isRejected
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse'
                        }`}
                      >
                        {isCompleted
                          ? currentLang === 'ar'
                            ? 'تم الشحن'
                            : 'Approved'
                          : isRejected
                          ? currentLang === 'ar'
                            ? 'مرفوض'
                            : 'Rejected'
                          : currentLang === 'ar'
                          ? 'بانتظار الاعتماد'
                          : 'Pending'}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-1 font-mono">
                        {new Date(dep.createdAt || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Column: Active Deposit Inspection, 1-Click Payout & Chat */}
            <div className="lg:col-span-7 bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 shadow-xl">
              {activeDepositObj ? (
                <>
                  {/* Header Details */}
                  <div className="space-y-3 pb-3 border-b border-slate-800">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-mono">
                          Request ID: #{activeDepositObj.id}
                        </span>
                        <span className="font-bold text-white text-base">{activeDepositObj.userName}</span>
                        <span className="text-xs text-slate-400 block font-mono">
                          {activeDepositObj.userEmail || 'investor@aseel.iq'}
                        </span>
                      </div>

                      <div className="text-right rtl:text-left font-mono">
                        <span className="text-slate-400 block text-[10px]">
                          {currentLang === 'ar' ? 'المبلغ المراد شحنه' : 'Deposit Amount'}
                        </span>
                        <span className="font-extrabold text-amber-400 text-lg sm:text-xl">
                          ${(activeDepositObj.amount || 0).toLocaleString()}{' '}
                          <span className="text-xs text-slate-300">USDT</span>
                        </span>
                      </div>
                    </div>

                    {/* Deposit Details Box (Method, Hash, Receipt Preview) */}
                    <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
                      <div className="flex justify-between items-center text-slate-300">
                        <span className="font-bold text-slate-400">
                          {currentLang === 'ar' ? 'طريقة وشبكة الدفع:' : 'Payment Method / Network:'}
                        </span>
                        <span className="text-amber-400 font-mono font-bold px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                          {activeDepositObj.network || 'USDT_TRC20'}
                        </span>
                      </div>

                      {/* TXID / Reference Hash with Copy Button */}
                      <div className="space-y-1">
                        <span className="font-bold text-slate-400 block text-[10px]">
                          {currentLang === 'ar'
                            ? 'رقم المعاملة / هاش التحويل (TXID/Ref):'
                            : 'Transaction Hash / Reference (TXID):'}
                        </span>
                        <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800 gap-2">
                          <span className="text-slate-200 font-mono text-xs break-all">
                            {activeDepositObj.txHash || activeDepositObj.userNote || 'Direct P2P Transfer (Unspecified TXID)'}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              handleCopy(activeDepositObj.txHash || activeDepositObj.id, activeDepositObj.id);
                            }}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 text-[11px] font-bold rounded-lg transition cursor-pointer flex items-center gap-1 shrink-0"
                          >
                            {copiedMap[activeDepositObj.id] ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">{currentLang === 'ar' ? 'تم النسخ' : 'Copied'}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>{currentLang === 'ar' ? 'نسخ' : 'Copy'}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Attached Transfer Receipt Preview Button */}
                      {getReceiptUrl(activeDepositObj) && (
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-emerald-400" />
                            <span className="text-slate-300 text-xs font-bold">
                              {currentLang === 'ar' ? 'إشعار التحويل المالي مرفق:' : 'Transfer Receipt Attached:'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setReceiptModalUrl(getReceiptUrl(activeDepositObj));
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/30 transition cursor-pointer flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{currentLang === 'ar' ? 'عرض إشعار التحويل' : 'View Transfer Receipt'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Chat Messages Log */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                        <span>{currentLang === 'ar' ? 'محادثة وتأكيد الإيداع' : 'Deposit Chat & Confirmation Log'}</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {activeDepositObj.chatMessages?.length || 0} messages
                      </span>
                    </div>

                    <div
                      ref={chatContainerRef}
                      className="max-h-44 overflow-y-auto bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 space-y-2 custom-scrollbar"
                    >
                      {(activeDepositObj.chatMessages || []).length === 0 ? (
                        <p className="text-center text-slate-500 text-xs py-4">
                          {currentLang === 'ar'
                            ? 'لا توجد رسائل محادثة سابقة. يمكنك إرسال تحديث للمستثمر مباشرة أدناه.'
                            : 'No prior messages. You can send updates directly to the investor below.'}
                        </p>
                      ) : (
                        (activeDepositObj.chatMessages || []).map((msg) => (
                          <div
                            key={msg.id}
                            className={`p-2.5 rounded-xl text-xs ${
                              msg.sender === 'admin'
                                ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                                : msg.sender === 'system'
                                ? 'bg-slate-800/50 text-slate-400 text-center text-[10px]'
                                : 'bg-slate-800 text-slate-100'
                            }`}
                          >
                            <span className="font-bold text-[10px] block opacity-70">
                              {msg.sender === 'admin'
                                ? 'Finance Desk (Admin)'
                                : msg.sender === 'system'
                                ? 'System'
                                : activeDepositObj.userName || 'Investor'}
                              :
                            </span>
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                            {msg.receiptUrl && (
                              <button
                                type="button"
                                onClick={() => setReceiptModalUrl(msg.receiptUrl || null)}
                                className="mt-2 text-emerald-400 hover:underline flex items-center gap-1 text-[10px] font-bold"
                              >
                                <Eye className="w-3 h-3" />
                                <span>{currentLang === 'ar' ? 'عرض الإيصال المرفق' : 'View Attached Receipt'}</span>
                              </button>
                            )}
                            {msg.txHash && (
                              <span className="block font-mono text-[10px] text-amber-300 mt-1">
                                TXID: {msg.txHash}
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Admin Message Reply Form */}
                    <form noValidate onSubmit={handleAdminSendChat} className="flex gap-2 pt-1">
                      <input
                        type="text"
                        placeholder={
                          currentLang === 'ar'
                            ? 'اكتب رسالة للمستثمر بخصوص هذا الإيداع...'
                            : 'Type reply message to investor regarding this deposit...'
                        }
                        value={adminReplyText}
                        onChange={(e) => setAdminReplyText(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500 shadow-inner"
                      />
                      <button
                        type="submit"
                        disabled={!adminReplyText.trim() || isSendingChat}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-md cursor-pointer transition flex items-center gap-1 shrink-0"
                      >
                        {isSendingChat ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                        )}
                        <span>{currentLang === 'ar' ? 'إرسال' : 'Send'}</span>
                      </button>
                    </form>
                  </div>

                  {/* 1-Click Streamlined Approval & Rejection Controls */}
                  <div className="pt-3 border-t border-slate-800 space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold block">
                        {currentLang === 'ar'
                          ? 'رقم إشعار / هاش المعاملة المحولة (اختياري للتوثيق):'
                          : 'Optional Transfer TXID / Reference Proof:'}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 7f8a9b0c1d2e3f4a5b6c... or ZainCash Ref# 998234"
                        value={adminTxHash}
                        onChange={(e) => setAdminTxHash(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono outline-none"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Unlock / Approve Request for Client Execution */}
                      {(activeDepositObj.status === 'pending' || activeDepositObj.status === 'pending_approval') && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            handleUnlockDeposit(activeDepositObj);
                          }}
                          disabled={actionLoadingId === activeDepositObj.id}
                          className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                        >
                          {actionLoadingId === activeDepositObj.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Unlock className="w-4 h-4 stroke-[2.5]" />
                          )}
                          <span>
                            {currentLang === 'ar'
                              ? 'موافقة وفتح شباك التنفيذ للعميل'
                              : 'Approve & Unlock Execution Window'}
                          </span>
                        </button>
                      )}

                      {/* Approve & Add Balance Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handleApproveDeposit(activeDepositObj);
                        }}
                        disabled={
                          activeDepositObj.status === 'approved' ||
                          actionLoadingId === activeDepositObj.id
                        }
                        className={`flex-1 py-3.5 rounded-2xl font-black text-xs transition flex items-center justify-center gap-2 shadow-lg ${
                          activeDepositObj.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-400 cursor-default border border-emerald-500/30'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 cursor-pointer'
                        }`}
                      >
                        {actionLoadingId === activeDepositObj.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                        )}
                        <span>
                          {activeDepositObj.status === 'approved'
                            ? currentLang === 'ar'
                              ? 'تم اعتماد وشحن المبلغ بنجاح'
                              : 'Deposit Approved & Balance Credited'
                            : currentLang === 'ar'
                            ? `اعتماد نهائي وشحن $${(activeDepositObj.amount || 0).toLocaleString()} USDT`
                            : `Approve & Credit $${(activeDepositObj.amount || 0).toLocaleString()} USDT`}
                        </span>
                      </button>

                      {/* Reject Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setRejectModalDeposit(activeDepositObj);
                        }}
                        disabled={
                          activeDepositObj.status === 'rejected' ||
                          activeDepositObj.status === 'approved' ||
                          actionLoadingId === activeDepositObj.id
                        }
                        className="py-3.5 px-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs border border-rose-500/30 cursor-pointer transition flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>{currentLang === 'ar' ? 'رفض الطلب' : 'Reject'}</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  {currentLang === 'ar' ? 'اختر طلباً من القائمة لعرض تفاصيله' : 'Select a request to inspect'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Receipt Image Full Preview */}
      {receiptModalUrl && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl relative animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-sm">
                  {currentLang === 'ar' ? 'إشعار تحويل الإيداع المرفق' : 'Attached Transfer Receipt'}
                </h3>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setReceiptModalUrl(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center max-h-[70vh]">
              <img
                src={sanitizeImageUrl(receiptModalUrl)}
                alt="Deposit Receipt"
                className="w-full h-auto max-h-[70vh] object-contain"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <a
                href={receiptModalUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{currentLang === 'ar' ? 'فتح في نافذة جديدة' : 'Open in New Tab'}</span>
              </a>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setReceiptModalUrl(null);
                }}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer transition"
              >
                {currentLang === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reject Confirmation */}
      {rejectModalDeposit && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative animate-fadeIn">
            <div className="flex items-center gap-3 text-rose-400">
              <XCircle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-white text-base">
                {currentLang === 'ar' ? 'تأكيد رفض طلب الإيداع' : 'Confirm Deposit Rejection'}
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {currentLang === 'ar'
                ? `أنت على وشك رفض طلب الإيداع بقيمة ($${(rejectModalDeposit.amount || 0).toLocaleString()} USDT) للمستثمر (${rejectModalDeposit.userName}). يرجى تحديد سبب الرفض:`
                : `You are rejecting the deposit of $${(rejectModalDeposit.amount || 0).toLocaleString()} USDT for ${rejectModalDeposit.userName}. Please state the reason:`}
            </p>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold block">
                {currentLang === 'ar' ? 'سبب الرفض الموجه للعميل:' : 'Rejection Reason:'}
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setRejectModalDeposit(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
              >
                {currentLang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  handleConfirmReject();
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-rose-500/20"
              >
                <XCircle className="w-4 h-4" />
                <span>{currentLang === 'ar' ? 'تأكيد الرفض الآن' : 'Confirm Rejection'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Manual Credit Modal */}
      {isManualCreditOpen && (
        <ManualCreditModal
          currentLang={currentLang}
          users={internalUsers}
          onClose={() => setIsManualCreditOpen(false)}
          onSuccess={(updatedUser, message) => {
            setIsManualCreditOpen(false);
            showToast(message || 'Balance updated successfully', 'success');
            if (onCreditSuccess) onCreditSuccess(updatedUser, message);
            if (onRefreshState) onRefreshState();
          }}
        />
      )}
    </div>
  );
};

// Export alias AdminDepositDesk for seamless compatibility
export const AdminDepositDesk = DepositManagement;
