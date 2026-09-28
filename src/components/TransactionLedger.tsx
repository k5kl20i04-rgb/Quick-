import React, { useState, useEffect } from 'react';
import {
  DepositRequest,
  WithdrawalRequest,
  Investment,
  Language,
  TransactionRecord,
  TransactionType,
  WalletType,
  TransactionStatus,
} from '../types';
import { translations } from '../i18n/translations';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Receipt,
  Search,
  Filter,
  DollarSign,
  Download,
  Calendar,
  ShieldCheck,
  ExternalLink,
  ArrowLeftRight,
  RefreshCw,
  Wallet,
  Sparkles,
  Info,
} from 'lucide-react';

interface TransactionLedgerProps {
  currentLang: Language;
  deposits?: DepositRequest[];
  withdrawals?: WithdrawalRequest[];
  investments?: Investment[];
  usdtBalance: number;
  mainBalance?: number;
  investmentBalance?: number;
}

export const TransactionLedger: React.FC<TransactionLedgerProps> = ({
  currentLang,
  deposits = [],
  withdrawals = [],
  investments = [],
  usdtBalance,
  mainBalance = 0,
  investmentBalance = 0,
}) => {
  const t = translations[currentLang] || translations.ar;

  const [liveTransactions, setLiveTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [walletFilter, setWalletFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState<TransactionRecord | null>(null);

  // Fetch transactions from backend
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/transactions');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.transactions)) {
          setLiveTransactions(data.transactions);
        }
      }
    } catch (e) {
      console.error('Failed to load transaction ledger:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Helpers to format localized strings
  const getLocalizedText = (textObj: string | { ar: string; en: string; ckb: string } | undefined): string => {
    if (!textObj) return '';
    if (typeof textObj === 'string') return textObj;
    return textObj[currentLang] || textObj.ar || textObj.en || '';
  };

  // Combine live transactions with fallbacks if empty
  const allTxList: TransactionRecord[] = liveTransactions.length > 0 ? liveTransactions : [
    ...deposits.map((d) => ({
      id: d.id,
      userId: d.userId,
      type: 'deposit' as TransactionType,
      title: { ar: 'إيداع USDT', en: 'USDT Deposit', ckb: 'دابەزاندنی USDT' },
      description: { ar: `إيداع عبر شبكة ${d.network}`, en: `Deposit via ${d.network}`, ckb: `دابەزاندن لە ڕێگەی ${d.network}` },
      amount: d.amount,
      wallet: 'main' as WalletType,
      status: (d.status === 'approved' ? 'completed' : d.status === 'rejected' ? 'rejected' : 'pending') as TransactionStatus,
      timestamp: d.createdAt,
      txHash: d.txHash,
      category: d.network,
    })),
    ...withdrawals.map((w) => ({
      id: w.id,
      userId: w.userId,
      type: 'withdrawal' as TransactionType,
      title: { ar: 'طلب سحب رصيد', en: 'Withdrawal Payout', ckb: 'داواکاری ڕاكێشان' },
      description: { ar: `طلب سحب إلى محفظة خارجيّة (${w.payoutMethod || 'TRC20'})`, en: `Payout to external wallet`, ckb: `ڕاكێشان بۆ جزدانی دەرەکی` },
      amount: w.amount,
      wallet: 'main' as WalletType,
      status: (w.status === 'approved' || w.status === 'completed' ? 'completed' : w.status === 'rejected' ? 'rejected' : 'pending') as TransactionStatus,
      timestamp: w.requestedAt,
      txHash: w.txHash,
      category: w.payoutMethod,
    })),
    ...investments.map((inv) => ({
      id: inv.id,
      userId: inv.userId,
      type: 'investment' as TransactionType,
      title: { ar: 'اشتراك في أسطول', en: 'Fleet Capital Subscription', ckb: 'وەبەرهێنان لە ئۆتۆمبێلەکان' },
      description: { ar: `تخصيص استثمار في: ${inv.projectTitle}`, en: `Allocated capital to: ${inv.projectTitle}`, ckb: `وەبەرهێنان لە: ${inv.projectTitle}` },
      amount: inv.amount,
      wallet: 'investment' as WalletType,
      status: 'completed' as TransactionStatus,
      timestamp: inv.startDate,
      referenceId: inv.id,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Filter logic
  const filteredList = allTxList.filter((tx) => {
    // Type Filter
    if (typeFilter !== 'all' && tx.type !== typeFilter) return false;

    // Wallet Filter
    if (walletFilter !== 'all') {
      if (walletFilter === 'main' && tx.wallet !== 'main' && tx.wallet !== 'both') return false;
      if (walletFilter === 'investment' && tx.wallet !== 'investment' && tx.wallet !== 'both') return false;
    }

    // Status Filter
    if (statusFilter !== 'all' && tx.status !== statusFilter) return false;

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleStr = getLocalizedText(tx.title).toLowerCase();
      const descStr = getLocalizedText(tx.description).toLowerCase();
      const txHashStr = (tx.txHash || '').toLowerCase();
      const refStr = (tx.referenceId || '').toLowerCase();
      const idStr = tx.id.toLowerCase();
      const amtStr = tx.amount.toString();

      return (
        titleStr.includes(q) ||
        descStr.includes(q) ||
        txHashStr.includes(q) ||
        refStr.includes(q) ||
        idStr.includes(q) ||
        amtStr.includes(q)
      );
    }

    return true;
  });

  // Calculate Summary Totals
  const totalDeposits = allTxList
    .filter((t) => t.type === 'deposit' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawals = allTxList
    .filter((t) => t.type === 'withdrawal' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalRoiEarnings = allTxList
    .filter((t) => t.type === 'roi' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalInvestedCapital = allTxList
    .filter((t) => t.type === 'investment' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  // Status Badge
  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {currentLang === 'ar' ? 'مكتمل / معتمد' : currentLang === 'ckb' ? 'پەسەندکراو' : 'Completed'}
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            {currentLang === 'ar' ? 'قيد المراجعة' : currentLang === 'ckb' ? 'لە چاوەڕوانیدا' : 'Pending'}
          </span>
        );
      case 'rejected':
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" />
            {currentLang === 'ar' ? 'مرفوض' : currentLang === 'ckb' ? 'ڕەتکراوە' : 'Rejected'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            {status}
          </span>
        );
    }
  };

  // Type Icon
  const getTypeIcon = (type: TransactionType) => {
    switch (type) {
      case 'deposit':
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        );
      case 'withdrawal':
        return (
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        );
      case 'transfer':
        return (
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
        );
      case 'roi':
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/10">
            <TrendingUp className="w-5 h-5" />
          </div>
        );
      case 'investment':
        return (
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
        );
      case 'refund':
        return (
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
            <RefreshCw className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
        );
    }
  };

  // Wallet Label Badge
  const getWalletBadge = (wallet: WalletType, sourceW?: WalletType, targetW?: WalletType) => {
    if (wallet === 'both' || (sourceW && targetW)) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <ArrowLeftRight className="w-3 h-3" />
          {currentLang === 'ar' ? 'بين المحافظ' : currentLang === 'ckb' ? 'نێوان جزدانەکان' : 'Inter-Wallet'}
        </span>
      );
    }
    if (wallet === 'main') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20">
          <Wallet className="w-3 h-3" />
          {currentLang === 'ar' ? 'المحفظة الرئيسية' : currentLang === 'ckb' ? 'جزدانی سەرەکی' : 'Main Wallet'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
        <TrendingUp className="w-3 h-3" />
        {currentLang === 'ar' ? 'محفظة الاستثمار' : currentLang === 'ckb' ? 'جزدانی وەبەرهێنان' : 'Investment Wallet'}
      </span>
    );
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Type', 'Title', 'Amount (USDT)', 'Wallet', 'Status', 'Date', 'TXID'];
    const rows = filteredList.map((tx) => [
      tx.id,
      tx.type,
      `"${getLocalizedText(tx.title).replace(/"/g, '""')}"`,
      tx.amount,
      tx.wallet,
      tx.status,
      new Date(tx.timestamp).toLocaleString(),
      `"${(tx.txHash || tx.referenceId || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `aseel_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 me-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-3">
              <Receipt className="w-3.5 h-3.5" />
              {currentLang === 'ar' ? 'السجل المالي الشفاف' : currentLang === 'ckb' ? 'تۆماری دارایی ڕوون' : 'Real-time Financial Ledger'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {currentLang === 'ar' ? 'سجل المعاملات والعمليات المالية' : currentLang === 'ckb' ? 'تۆماری گشتی مامەڵە داراییەکان' : 'Transaction History & Financial Ledger'}
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              {currentLang === 'ar'
                ? 'تدقيق مالي مباشر وتدفق زمني شفاف لجميع عمليات الإيداع، تحويلات المحافظ، استثمارات الأسطول، وسحوبات الأرباح.'
                : currentLang === 'ckb'
                ? 'بەدواداچوونی ڕاستەوخۆ بۆ هەموو کردەوە داراییەکان، دابەزاندن، گواستنەوە و قازانجەکان.'
                : 'Complete transparent live statement tracking deposits, wallet transfers, fleet capital allocations, and profit payouts.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={fetchTransactions}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition cursor-pointer"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-4 h-4 text-amber-400 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{currentLang === 'ar' ? 'تحديث' : 'Refresh'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              {currentLang === 'ar' ? 'تصدير كشف الحساب (CSV)' : 'Export CSV Statement'}
            </button>
          </div>
        </div>

        {/* Summary Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80">
            <p className="text-[11px] font-medium text-slate-400 mb-1">{t.usdtBalance}</p>
            <p className="text-xl font-extrabold text-amber-400 font-mono">${usdtBalance.toLocaleString()} USDT</p>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
              <span>رئيسية: ${mainBalance.toLocaleString()}</span>
              <span>•</span>
              <span>استثمار: ${investmentBalance.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80">
            <p className="text-[11px] font-medium text-slate-400 mb-1">{currentLang === 'ar' ? 'إجمالي الإيداعات' : 'Total Approved Deposits'}</p>
            <p className="text-xl font-extrabold text-emerald-400 font-mono">${totalDeposits.toLocaleString()} USDT</p>
            <p className="text-[10px] text-emerald-500/80 mt-1">مكتمل ومضاف للمحفظة</p>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80">
            <p className="text-[11px] font-medium text-slate-400 mb-1">{currentLang === 'ar' ? 'رأس المال المستثمر' : 'Invested Fleet Capital'}</p>
            <p className="text-xl font-extrabold text-blue-400 font-mono">${totalInvestedCapital.toLocaleString()} USDT</p>
            <p className="text-[10px] text-blue-400/80 mt-1">مخصص بأسطول الشحن</p>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80">
            <p className="text-[11px] font-medium text-slate-400 mb-1">{currentLang === 'ar' ? 'إجمالي الأرباح المكتسبة' : 'Total Earned ROI'}</p>
            <p className="text-xl font-extrabold text-emerald-300 font-mono">${totalRoiEarnings.toLocaleString()} USDT</p>
            <p className="text-[10px] text-emerald-400/80 mt-1">عائدات الخطة الشهرية</p>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 col-span-2 lg:col-span-1">
            <p className="text-[11px] font-medium text-slate-400 mb-1">{currentLang === 'ar' ? 'إجمالي المسحوبات' : 'Total Withdrawals'}</p>
            <p className="text-xl font-extrabold text-rose-400 font-mono">${totalWithdrawals.toLocaleString()} USDT</p>
            <p className="text-[10px] text-rose-400/80 mt-1">مسحوبة محولّة بالكامل</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-4">
        {/* Type Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: 'all', label: currentLang === 'ar' ? 'جميع المعاملات' : 'All Transactions', count: allTxList.length },
            { id: 'deposit', label: currentLang === 'ar' ? 'الإيداعات' : 'Deposits', count: allTxList.filter((t) => t.type === 'deposit').length },
            { id: 'withdrawal', label: currentLang === 'ar' ? 'السحوبات' : 'Withdrawals', count: allTxList.filter((t) => t.type === 'withdrawal').length },
            { id: 'transfer', label: currentLang === 'ar' ? 'التحويل الداخلي' : 'Wallet Transfers', count: allTxList.filter((t) => t.type === 'transfer').length },
            { id: 'roi', label: currentLang === 'ar' ? 'أرباح الأسطول' : 'Yield Profits', count: allTxList.filter((t) => t.type === 'roi').length },
            { id: 'investment', label: currentLang === 'ar' ? 'تخصيص استثمار' : 'Capital Allocations', count: allTxList.filter((t) => t.type === 'investment').length },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTypeFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                typeFilter === tab.id
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${typeFilter === tab.id ? 'bg-slate-950/30 text-slate-950 font-extrabold' : 'bg-slate-900 text-slate-400'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Filters Bar: Wallet, Status, Search */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/60">
          {/* Wallet Select */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
            <Wallet className="w-4 h-4 text-amber-400 shrink-0" />
            <select
              value={walletFilter}
              onChange={(e) => setWalletFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none w-full cursor-pointer"
            >
              <option value="all" className="bg-slate-900">{currentLang === 'ar' ? 'جميع المحافظ' : 'All Wallets'}</option>
              <option value="main" className="bg-slate-900">{currentLang === 'ar' ? 'المحفظة الرئيسية' : 'Main Wallet'}</option>
              <option value="investment" className="bg-slate-900">{currentLang === 'ar' ? 'محفظة الاستثمار' : 'Investment Wallet'}</option>
            </select>
          </div>

          {/* Status Select */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
            <Filter className="w-4 h-4 text-amber-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none w-full cursor-pointer"
            >
              <option value="all" className="bg-slate-900">{currentLang === 'ar' ? 'جميع الحالات' : 'All Statuses'}</option>
              <option value="completed" className="bg-slate-900">{currentLang === 'ar' ? 'مكتمل / معتمد' : 'Completed / Approved'}</option>
              <option value="pending" className="bg-slate-900">{currentLang === 'ar' ? 'قيد الانتظار' : 'Pending Review'}</option>
              <option value="rejected" className="bg-slate-900">{currentLang === 'ar' ? 'مرفوض' : 'Rejected'}</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 rtl:right-3 rtl:left-auto" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={currentLang === 'ar' ? 'بحث برقم المعاملة، العنوان، أو TXID...' : 'Search by ID, title or TXID...'}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-4 rtl:pr-9 rtl:pl-4 py-2 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="text-center py-16 px-4 space-y-3">
            <RefreshCw className="w-8 h-8 text-amber-400 mx-auto animate-spin" />
            <p className="text-slate-300 font-bold text-sm">جاري تحميل سجل العمليات المالية...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Receipt className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-300 font-bold text-base">
              {currentLang === 'ar' ? 'لا توجد معاملات مسجلة مطابقة' : 'No Matching Transactions Found'}
            </p>
            <p className="text-slate-500 text-xs mt-1">
              {currentLang === 'ar' ? 'جرّب تغيير خيارات البحث والتصفية لعرض السجل.' : 'Adjust your filter selections to view transaction history.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right rtl:text-right ltr:text-left text-xs">
              <thead>
                <tr className="bg-slate-950/90 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                  <th className="p-4">{currentLang === 'ar' ? 'نوع المعاملة' : 'Type'}</th>
                  <th className="p-4">{currentLang === 'ar' ? 'التفاصيل والوصف' : 'Title & Description'}</th>
                  <th className="p-4">{currentLang === 'ar' ? 'المحفظة' : 'Wallet'}</th>
                  <th className="p-4">{currentLang === 'ar' ? 'المبلغ (USDT)' : 'Amount'}</th>
                  <th className="p-4">{currentLang === 'ar' ? 'التاريخ والوقت' : 'Timestamp'}</th>
                  <th className="p-4">{currentLang === 'ar' ? 'المرجع / TXID' : 'Ref / Hash'}</th>
                  <th className="p-4">{currentLang === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th className="p-4 text-center">{currentLang === 'ar' ? 'معاينة' : 'Details'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredList.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(tx.type)}
                        <div>
                          <p className="font-extrabold text-slate-100 capitalize">
                            {tx.type === 'deposit'
                              ? 'إيداع USDT'
                              : tx.type === 'withdrawal'
                              ? 'سحب رصيد'
                              : tx.type === 'transfer'
                              ? 'تحويل بين المحافظ'
                              : tx.type === 'roi'
                              ? 'أرباح استثمار'
                              : tx.type === 'investment'
                              ? 'تخصيص استثمار'
                              : tx.type === 'refund'
                              ? 'استرجاع رأس المال'
                              : 'معاملة مالية'}
                          </p>
                          <span className="text-[10px] text-slate-500 font-mono">{tx.id}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 max-w-xs text-slate-200">
                      <p className="font-bold text-slate-200 truncate">{getLocalizedText(tx.title)}</p>
                      {tx.description && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{getLocalizedText(tx.description)}</p>
                      )}
                    </td>

                    <td className="p-4">
                      {getWalletBadge(tx.wallet, tx.sourceWallet, tx.targetWallet)}
                    </td>

                    <td className="p-4">
                      <span
                        className={`font-mono font-extrabold text-sm ${
                          tx.type === 'deposit' || tx.type === 'roi' || tx.type === 'refund'
                            ? 'text-emerald-400'
                            : tx.type === 'withdrawal'
                            ? 'text-rose-400'
                            : tx.type === 'transfer'
                            ? 'text-amber-400'
                            : 'text-blue-400'
                        }`}
                      >
                        {tx.type === 'deposit' || tx.type === 'roi' || tx.type === 'refund' ? '+' : tx.type === 'withdrawal' ? '-' : ''}
                        ${tx.amount.toLocaleString()} USDT
                      </span>
                    </td>

                    <td className="p-4 font-mono text-[11px] text-slate-300">
                      {new Date(tx.timestamp).toLocaleDateString()}
                      <span className="block text-[10px] text-slate-500">
                        {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>

                    <td className="p-4 font-mono text-[11px] text-slate-400">
                      <div className="max-w-[130px] truncate" title={tx.txHash || tx.referenceId || tx.id}>
                        {tx.txHash || tx.referenceId || tx.id}
                      </div>
                    </td>

                    <td className="p-4">{getStatusBadge(tx.status)}</td>

                    <td className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedTx(tx)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer border border-slate-700"
                      >
                        {currentLang === 'ar' ? 'تفاصيل' : 'Inspect'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspection Modal for Individual Transaction */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 relative animate-fadeIn">
            <button
              type="button"
              onClick={() => setSelectedTx(null)}
              className="absolute top-4 left-4 rtl:right-4 rtl:left-auto text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              {getTypeIcon(selectedTx.type)}
              <div>
                <h3 className="text-lg font-extrabold text-white">{getLocalizedText(selectedTx.title)}</h3>
                <p className="text-xs text-slate-400 font-mono">ID: {selectedTx.id}</p>
              </div>
            </div>

            <div className="space-y-3 bg-slate-950/90 p-4 rounded-2xl border border-slate-800 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">{currentLang === 'ar' ? 'نوع العملية' : 'Type'}</span>
                <span className="text-slate-200 font-bold capitalize">{selectedTx.type}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">{currentLang === 'ar' ? 'المبلغ' : 'Amount'}</span>
                <span className="text-emerald-400 font-mono font-extrabold text-sm">${selectedTx.amount.toLocaleString()} USDT</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">{currentLang === 'ar' ? 'المحفظة' : 'Wallet'}</span>
                <div>{getWalletBadge(selectedTx.wallet, selectedTx.sourceWallet, selectedTx.targetWallet)}</div>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">{currentLang === 'ar' ? 'الحالة' : 'Status'}</span>
                <div>{getStatusBadge(selectedTx.status)}</div>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">{currentLang === 'ar' ? 'الوقت والتاريخ' : 'Timestamp'}</span>
                <span className="text-slate-200 font-mono">{new Date(selectedTx.timestamp).toLocaleString()}</span>
              </div>

              {selectedTx.txHash && (
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">TXID / Hash</span>
                  <span className="text-amber-400 font-mono text-[11px] truncate max-w-[200px]" title={selectedTx.txHash}>
                    {selectedTx.txHash}
                  </span>
                </div>
              )}

              {selectedTx.description && (
                <div className="pt-2">
                  <p className="text-slate-400 mb-1">{currentLang === 'ar' ? 'الوصف والتفاصيل' : 'Description'}</p>
                  <p className="text-slate-200 bg-slate-900 p-2.5 rounded-xl border border-slate-800/80 font-medium">
                    {getLocalizedText(selectedTx.description)}
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedTx(null)}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
            >
              {currentLang === 'ar' ? 'إغلاق النافذة' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
