import React, { useState, useEffect } from 'react';
import { User, KYCStatus, Language, Investment, DepositRequest, WithdrawalRequest, KYCSubmission } from '../../types';
import {
  getSupabaseProfiles,
  upsertSupabaseProfile,
  deleteSupabaseProfile,
  subscribeToSupabaseRealtime,
} from '../../lib/supabaseClient';
import {
  Users,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  DollarSign,
  ShieldAlert,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Truck,
  Download,
  Trash2,
  Lock,
  Unlock,
  Edit,
  UserX,
  UserCheck,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Check,
  Plus,
  FileText,
  Wallet,
  KeyRound,
  UserPlus,
} from 'lucide-react';

interface InvestorSummary extends User {
  activePlansCount: number;
  totalPlansCount: number;
  totalApprovedDeposits: number;
  pendingDepositsCount: number;
  pendingWithdrawalsCount: number;
}

interface ClientDossier {
  client: User;
  plans: Investment[];
  deposits: DepositRequest[];
  withdrawals: WithdrawalRequest[];
  kyc: KYCSubmission | null;
}

interface InvestorManagementProps {
  currentLang: Language;
  onReviewKYC: (status: 'approved' | 'rejected', reason?: string) => Promise<void>;
  onRefreshState: () => void;
}

export const InvestorManagement: React.FC<InvestorManagementProps> = ({
  currentLang,
  onReviewKYC,
  onRefreshState,
}) => {
  const [investors, setInvestors] = useState<InvestorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [kycFilter, setKycFilter] = useState<'all' | KYCStatus | 'verified' | 'unverified'>('all');

  // Client Inspector Modal State
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [dossier, setDossier] = useState<ClientDossier | null>(null);
  const [dossierLoading, setDossierLoading] = useState(false);
  const [activeDossierTab, setActiveDossierTab] = useState<'profile' | 'plans' | 'ledger' | 'wallet'>('profile');

  // Quick Balance Modal State
  const [quickBalanceUser, setQuickBalanceUser] = useState<InvestorSummary | null>(null);
  const [quickBalanceVal, setQuickBalanceVal] = useState<string>('');
  const [quickBalanceMsg, setQuickBalanceMsg] = useState<string | null>(null);
  const [quickBalanceLoading, setQuickBalanceLoading] = useState(false);

  // Balance Adjustment state inside Dossier
  const [newBalanceInput, setNewBalanceInput] = useState<string>('');
  const [balanceAdjusting, setBalanceAdjusting] = useState(false);
  const [balanceMsg, setBalanceMsg] = useState<string | null>(null);

  // Delete Confirmation State
  const [deleteTargetUser, setDeleteTargetUser] = useState<InvestorSummary | null>(null);

  // User Password Reset Modal State
  const [resetPassUser, setResetPassUser] = useState<InvestorSummary | null>(null);
  const [resetPassVal, setResetPassVal] = useState<string>('');
  const [resetPassMsg, setResetPassMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [resetPassLoading, setResetPassLoading] = useState(false);

  // Update User Role (Investor <-> Admin)
  const handleUpdateUserRole = async (userId: string, newRole: 'admin' | 'investor') => {
    try {
      setInvestors((prev) =>
        prev.map((inv) => (inv.id === userId ? { ...inv, role: newRole } : inv))
      );

      await upsertSupabaseProfile({ id: userId, role: newRole } as any).catch(() => {});

      await fetch(`/api/admin/users/${userId}/role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (selectedUserId === userId && dossier) {
        setDossier({ ...dossier, client: { ...dossier.client, role: newRole } });
      }
      onRefreshState();
    } catch (err) {
      console.error('Failed to update user role', err);
    }
  };

  const handleResetUserPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassUser || !resetPassVal.trim()) return;
    setResetPassLoading(true);
    setResetPassMsg(null);
    try {
      const res = await fetch(`/api/admin/users/${resetPassUser.id}/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: resetPassVal.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResetPassMsg({
          type: 'success',
          text: 'تم تعيين كلمة المرور الجديدة للمستخدم واعتمادها بنجاح!',
        });
        setTimeout(() => {
          setResetPassUser(null);
          setResetPassVal('');
          setResetPassMsg(null);
        }, 1500);
      } else {
        setResetPassMsg({ type: 'error', text: data.error || 'حدث خطأ أثناء تغيير كلمة المرور' });
      }
    } catch (err: any) {
      setResetPassMsg({ type: 'error', text: err.message || 'تعذر الاتصال بالخادم' });
    } finally {
      setResetPassLoading(false);
    }
  };

  // Add Admin Employee Modal State
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [addAdminEmail, setAddAdminEmail] = useState('');
  const [addAdminName, setAddAdminName] = useState('');
  const [addAdminPassword, setAddAdminPassword] = useState('');
  const [addAdminLoading, setAddAdminLoading] = useState(false);
  const [addAdminMsg, setAddAdminMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleCreateAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addAdminEmail.trim() || !addAdminPassword.trim()) return;
    setAddAdminLoading(true);
    setAddAdminMsg(null);
    try {
      const res = await fetch('/api/admin/create-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: addAdminEmail.trim(),
          name: addAdminName.trim() || undefined,
          password: addAdminPassword.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAddAdminMsg({
          type: 'success',
          text: data.message || 'تم إنشاء حساب مدير النظام وتعيينه بنجاح!',
        });
        setTimeout(() => {
          setShowAddAdminModal(false);
          setAddAdminEmail('');
          setAddAdminName('');
          setAddAdminPassword('');
          setAddAdminMsg(null);
          fetchInvestors();
          onRefreshState();
        }, 1200);
      } else {
        setAddAdminMsg({ type: 'error', text: data.error || 'حدث خطأ أثناء إضافة مدير النظام' });
      }
    } catch (err: any) {
      setAddAdminMsg({ type: 'error', text: err.message || 'تعذر الاتصال بالخادم' });
    } finally {
      setAddAdminLoading(false);
    }
  };

  // Fetch investors list directly from Supabase & API
  const fetchInvestors = async () => {
    try {
      if (investors.length === 0) {
        setLoading(true);
      }
      const sbProfiles = await getSupabaseProfiles().catch(() => []);
      const res = await fetch('/api/admin/users').catch(() => null);
      let apiUsers: any[] = [];
      if (res && res.ok) {
        const data = await res.json();
        apiUsers = data.investors || [];
      }

      const mergedMap = new Map<string, InvestorSummary>();

      // 1. Populate Supabase profiles directly (authoritative user list & real wallet balances)
      (sbProfiles || []).forEach((p) => {
        const pEmail = (p.email || '').toLowerCase();
        const pKey = p.id || pEmail;
        if (!pKey) return;

        mergedMap.set(pKey, {
          ...p,
          name: p.name || p.email || 'مستثمر',
          email: p.email || '',
          phone: p.phone || '',
          governorate: p.governorate || '',
          role: pEmail === 'goog7029766@gmail.com' ? 'admin' : (p.role || 'investor'),
          usdtBalance: Number(p.usdtBalance ?? 0),
          kycStatus: pEmail === 'goog7029766@gmail.com' ? 'approved' : (p.kycStatus || 'not_submitted'),
          accountStatus: p.accountStatus || 'active',
          totalInvested: Number(p.totalInvested ?? 0),
          totalRoiEarned: Number(p.totalRoiEarned ?? 0),
          activePlansCount: 0,
          totalPlansCount: 0,
          totalApprovedDeposits: 0,
          pendingDepositsCount: 0,
          pendingWithdrawalsCount: 0,
        });
      });

      // 2. Merge API users metrics (plans counts, pending deposit/withdrawal requests)
      (apiUsers || []).forEach((a) => {
        const aEmail = (a.email || '').toLowerCase();
        const existingEntry = Array.from(mergedMap.values()).find(
          (m) => (a.id && m.id === a.id) || (aEmail && m.email.toLowerCase() === aEmail)
        );

        if (existingEntry) {
          const keyToUse = existingEntry.id || a.id || aEmail;
          mergedMap.set(keyToUse, {
            ...existingEntry,
            name: existingEntry.name || a.name || a.email,
            phone: existingEntry.phone || a.phone,
            governorate: existingEntry.governorate || a.governorate,
            activePlansCount: a.activePlansCount ?? existingEntry.activePlansCount ?? 0,
            totalPlansCount: a.totalPlansCount ?? existingEntry.totalPlansCount ?? 0,
            totalApprovedDeposits: a.totalApprovedDeposits ?? existingEntry.totalApprovedDeposits ?? 0,
            pendingDepositsCount: a.pendingDepositsCount ?? existingEntry.pendingDepositsCount ?? 0,
            pendingWithdrawalsCount: a.pendingWithdrawalsCount ?? existingEntry.pendingWithdrawalsCount ?? 0,
          });
        } else if (a.id || aEmail) {
          const keyToUse = a.id || aEmail;
          mergedMap.set(keyToUse, {
            ...a,
            name: a.name || a.email || 'مستثمر',
            email: a.email || '',
            role: aEmail === 'goog7029766@gmail.com' ? 'admin' : (a.role || 'investor'),
            usdtBalance: Number(a.usdtBalance ?? 0),
            activePlansCount: a.activePlansCount ?? 0,
            totalPlansCount: a.totalPlansCount ?? 0,
            totalApprovedDeposits: a.totalApprovedDeposits ?? 0,
            pendingDepositsCount: a.pendingDepositsCount ?? 0,
            pendingWithdrawalsCount: a.pendingWithdrawalsCount ?? 0,
          });
        }
      });

      const mergedList = Array.from(mergedMap.values());
      setInvestors(mergedList);
    } catch (err) {
      console.error('Failed to fetch investors list', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestors();

    // Live subscription for instant updates without page refresh
    const unsubscribe = subscribeToSupabaseRealtime({
      onProfileUpdate: (updatedUser) => {
        setInvestors((prev) =>
          prev.map((inv) =>
            inv.id === updatedUser.id ? { ...inv, ...updatedUser } : inv
          )
        );
      },
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Fetch full client dossier when selected
  const fetchDossier = async (userId: string) => {
    try {
      setDossierLoading(true);
      setSelectedUserId(userId);
      const res = await fetch(`/api/admin/users/${userId}/dossier`);
      if (res.ok) {
        const data = await res.json();
        setDossier(data);
        setNewBalanceInput(data.client.usdtBalance.toString());
      }
    } catch (err) {
      console.error('Failed to fetch dossier', err);
    } finally {
      setDossierLoading(false);
    }
  };

  // Adjust Balance from Dossier or Quick Modal
  const handleSaveBalance = async (userId: string, targetBalance: number) => {
    if (isNaN(targetBalance) || targetBalance < 0) return;

    try {
      setQuickBalanceLoading(true);
      setBalanceAdjusting(true);

      // Update Supabase directly
      await upsertSupabaseProfile({ id: userId, usdtBalance: targetBalance });

      // Update local state immediately (no page reload)
      setInvestors((prev) =>
        prev.map((inv) => (inv.id === userId ? { ...inv, usdtBalance: targetBalance } : inv))
      );

      // Call Express endpoint for server sync
      fetch(`/api/admin/users/${userId}/balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newBalance: targetBalance }),
      }).catch(() => {});

      setQuickBalanceMsg(currentLang === 'ar' ? 'تم تحديث رصيد المحفظة بنجاح!' : 'Wallet balance updated!');
      setBalanceMsg(currentLang === 'ar' ? 'تم تحديث رصيد المحفظة بنجاح!' : 'Wallet balance updated!');

      if (selectedUserId === userId) {
        await fetchDossier(userId);
      }
      onRefreshState();
      setTimeout(() => setQuickBalanceUser(null), 800);
    } catch (err) {
      console.error('Balance adjustment failed', err);
    } finally {
      setQuickBalanceLoading(false);
      setBalanceAdjusting(false);
    }
  };

  // Toggle Account Status (active vs suspended vs verified)
  const handleToggleAccountStatus = async (userId: string, accountStatus: 'active' | 'suspended' | 'verified') => {
    try {
      // Update Supabase directly
      await upsertSupabaseProfile({ id: userId, accountStatus });

      // Update local state immediately
      setInvestors((prev) =>
        prev.map((inv) => (inv.id === userId ? { ...inv, accountStatus } : inv))
      );

      fetch(`/api/admin/users/${userId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountStatus }),
      }).catch(() => {});

      if (selectedUserId === userId) {
        await fetchDossier(userId);
      }
      onRefreshState();
    } catch (err) {
      console.error('Failed to toggle user account status', err);
    }
  };

  // Direct KYC Status Update
  const handleUpdateUserKyc = async (userId: string, kycStatus: 'approved' | 'rejected' | 'pending' | 'not_submitted', reason?: string) => {
    try {
      // Update Supabase directly
      await upsertSupabaseProfile({ id: userId, kycStatus });

      // Update local state immediately
      setInvestors((prev) =>
        prev.map((inv) => (inv.id === userId ? { ...inv, kycStatus } : inv))
      );

      fetch(`/api/admin/users/${userId}/kyc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kycStatus, rejectionReason: reason }),
      }).catch(() => {});

      if (selectedUserId === userId) {
        await fetchDossier(userId);
      }
      onRefreshState();
    } catch (err) {
      console.error('Failed to update user KYC', err);
    }
  };

  // Delete Investor
  const handleDeleteInvestor = async (userId: string) => {
    try {
      // Delete from Supabase
      await deleteSupabaseProfile(userId);

      // Update local state immediately
      setInvestors((prev) => prev.filter((inv) => inv.id !== userId));

      fetch(`/api/admin/users/${userId}`, { method: 'DELETE' }).catch(() => {});

      if (selectedUserId === userId) {
        setSelectedUserId(null);
        setDossier(null);
      }
      setDeleteTargetUser(null);
      onRefreshState();
    } catch (err) {
      console.error('Failed to delete investor', err);
    }
  };

  // Summary Metrics
  const totalInvestorsCount = investors.length;
  const verifiedKycCount = investors.filter(
    (i) => i.kycStatus === 'approved' || i.role === 'admin' || i.accountStatus === 'verified'
  ).length;
  const pendingKycCount = investors.filter((i) => i.kycStatus === 'pending').length;
  const unverifiedKycCount = investors.filter(
    (i) =>
      i.role !== 'admin' &&
      (i.kycStatus === 'not_submitted' || (i.kycStatus as string) === 'unverified' || !i.kycStatus)
  ).length;
  const rejectedKycCount = investors.filter((i) => i.kycStatus === 'rejected').length;
  const totalCapitalManaged = investors.reduce((sum, i) => sum + i.totalInvested, 0);
  const totalWalletBalances = investors.reduce((sum, i) => sum + i.usdtBalance, 0);

  // Filter investors dynamically by search (name, email, phone) and filter buttons (kyc_status & role)
  const filteredInvestors = investors.filter((inv) => {
    const filterKey = kycFilter as string;
    // KYC status and Role filter matching
    if (filterKey === 'approved' || filterKey === 'verified') {
      const isVerified = inv.kycStatus === 'approved' || inv.role === 'admin' || inv.accountStatus === 'verified';
      if (!isVerified) return false;
    } else if (filterKey === 'pending') {
      if (inv.kycStatus !== 'pending') return false;
    } else if (filterKey === 'not_submitted' || filterKey === 'unverified') {
      const isUnverified =
        inv.role !== 'admin' &&
        (inv.kycStatus === 'not_submitted' || (inv.kycStatus as string) === 'unverified' || !inv.kycStatus);
      if (!isUnverified) return false;
    } else if (filterKey === 'rejected') {
      if (inv.kycStatus !== 'rejected') return false;
    } else if (filterKey !== 'all') {
      if ((inv.kycStatus as string) !== filterKey) return false;
    }

    // Dynamic Search bar matching name, email, phone number, governorate, or ID
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = (inv.name || '').toLowerCase().includes(q);
      const matchEmail = (inv.email || '').toLowerCase().includes(q);
      const matchPhone = (inv.phone || '').toLowerCase().includes(q);
      const matchGov = (inv.governorate || '').toLowerCase().includes(q);
      const matchId = (inv.id || '').toLowerCase().includes(q);

      return matchName || matchEmail || matchPhone || matchGov || matchId;
    }

    return true;
  });

  const handleExportCSV = () => {
    const headers = [
      'User ID',
      'Name',
      'Email',
      'Phone',
      'Governorate',
      'KYC Status',
      'Account Status',
      'USDT Balance',
      'Total Invested',
      'Active Plans',
    ];
    const rows = filteredInvestors.map((inv) => [
      inv.id,
      `"${(inv.name || '').replace(/"/g, '""')}"`,
      inv.email,
      inv.phone || '',
      `"${(inv.governorate || '').replace(/"/g, '""')}"`,
      inv.kycStatus,
      inv.accountStatus || 'active',
      inv.usdtBalance,
      inv.totalInvested,
      inv.activePlansCount,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `aseel_investors_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl shadow-xl">
          <div className="flex items-center gap-2.5 text-amber-400 mb-2">
            <Users className="w-5 h-5" />
            <span className="text-xs font-bold text-slate-400 uppercase">
              {currentLang === 'ar' ? 'المستثمرون المسجلون' : 'Total Investors'}
            </span>
          </div>
          <p className="text-2xl font-black text-white">
            {totalInvestorsCount}{' '}
            <span className="text-xs font-normal text-slate-400">{currentLang === 'ar' ? 'مستثمر' : 'clients'}</span>
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl shadow-xl">
          <div className="flex items-center gap-2.5 text-emerald-400 mb-2">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-xs font-bold text-slate-400 uppercase">
              {currentLang === 'ar' ? 'الهويات الموثقة' : 'Verified KYC'}
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-400">
            {verifiedKycCount}{' '}
            <span className="text-xs font-normal text-slate-400">
              ({totalInvestorsCount > 0 ? Math.round((verifiedKycCount / totalInvestorsCount) * 100) : 0}%)
            </span>
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl shadow-xl">
          <div className="flex items-center gap-2.5 text-sky-400 mb-2">
            <Truck className="w-5 h-5" />
            <span className="text-xs font-bold text-slate-400 uppercase">
              {currentLang === 'ar' ? 'إجمالي أصول الأسطول' : 'Total Capital Managed'}
            </span>
          </div>
          <p className="text-2xl font-black text-sky-400 font-mono">${totalCapitalManaged.toLocaleString()} USDT</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl shadow-xl">
          <div className="flex items-center gap-2.5 text-amber-400 mb-2">
            <DollarSign className="w-5 h-5" />
            <span className="text-xs font-bold text-slate-400 uppercase">
              {currentLang === 'ar' ? 'سيولة المحافظ المتاحة' : 'Total Client Balances'}
            </span>
          </div>
          <p className="text-2xl font-black text-amber-400 font-mono">${totalWalletBalances.toLocaleString()} USDT</p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 rtl:right-3.5 rtl:left-auto ltr:left-3.5 ltr:right-auto" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              currentLang === 'ar'
                ? 'البحث بالاسم، البريد الإلكتروني، رقم الهاتف، المحافظة، المعرف...'
                : 'Search name, email, phone, city, ID...'
            }
            className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-2xl pr-10 pl-4 rtl:pr-10 rtl:pl-4 ltr:pl-10 ltr:pr-4 py-3 focus:outline-none focus:border-amber-500 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer rtl:left-3 rtl:right-auto ltr:right-3 ltr:left-auto"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* KYC Status Filters & CSV Export */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1.5 shrink-0 bg-slate-950 p-1 rounded-2xl border border-slate-800">
            {[
              { id: 'all', labelAr: 'الكل', labelEn: 'All', count: totalInvestorsCount },
              { id: 'approved', labelAr: 'الموثقون', labelEn: 'Verified', count: verifiedKycCount },
              { id: 'pending', labelAr: 'قيد المراجعة', labelEn: 'Pending', count: pendingKycCount },
              { id: 'not_submitted', labelAr: 'غير موثق', labelEn: 'Unverified', count: unverifiedKycCount },
              { id: 'rejected', labelAr: 'مرفوض', labelEn: 'Rejected', count: rejectedKycCount },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setKycFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  kycFilter === tab.id
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <span>{currentLang === 'ar' ? tab.labelAr : tab.labelEn}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${kycFilter === tab.id ? 'bg-slate-950/30 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer shadow-md"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>{currentLang === 'ar' ? 'تصدير CSV' : 'Export CSV'}</span>
          </button>

          <button
            onClick={() => {
              setShowAddAdminModal(true);
              setAddAdminEmail('');
              setAddAdminName('');
              setAddAdminPassword('');
              setAddAdminMsg(null);
            }}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-sky-400 hover:from-sky-400 hover:to-sky-300 text-slate-950 text-xs font-black transition flex items-center gap-2 shrink-0 cursor-pointer shadow-lg shadow-sky-500/20"
          >
            <UserPlus className="w-4 h-4 text-slate-950 stroke-[2.2]" />
            <span>{currentLang === 'ar' ? 'تعيين مدير جديد' : 'Add Admin Employee'}</span>
          </button>
        </div>
      </div>

      {/* Centralized Active Investors Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Clock className="w-8 h-8 animate-spin mx-auto mb-3 text-amber-500" />
            جاري تحميل وقراءة بيانات المستثمرين المحدثة...
          </div>
        ) : filteredInvestors.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs space-y-2">
            <Users className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="font-bold text-slate-300">لا توجد سجلات مستثمرين تطابق معايير البحث والفلترة.</p>
            <p className="text-[11px] text-slate-500">جرّب تغيير كلمات البحث أو إعادة اختيار التصفية من الأعلى.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right rtl:text-right ltr:text-left text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 uppercase font-black border-b border-slate-800 text-[11px]">
                  <th className="p-4">{currentLang === 'ar' ? 'المستثمر والبريد' : 'Investor'}</th>
                  <th className="p-4">{currentLang === 'ar' ? 'بيانات الاتصال والموقع' : 'Contact & Location'}</th>
                  <th className="p-4">{currentLang === 'ar' ? 'دور وصلاحية الحساب' : 'Role'}</th>
                  <th className="p-4">{currentLang === 'ar' ? 'حالة الحساب' : 'Account Status'}</th>
                  <th className="p-4">{currentLang === 'ar' ? 'توثيق الهوية (KYC)' : 'KYC Verification'}</th>
                  <th className="p-4">{currentLang === 'ar' ? 'رصيد المحفظة (USDT)' : 'Wallet Balance'}</th>
                  <th className="p-4">{currentLang === 'ar' ? 'الخطط ورأس المال' : 'Active Plans & Capital'}</th>
                  <th className="p-4 text-center">{currentLang === 'ar' ? 'إجراءات التحكم والتحرير' : 'Controls & Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredInvestors.map((inv) => {
                  const currentAccountStatus = inv.accountStatus || (inv.kycStatus === 'approved' ? 'verified' : 'active');
                  const isBlocked = currentAccountStatus === 'suspended';

                  return (
                    <tr
                      key={inv.id}
                      className={`hover:bg-slate-800/50 transition-colors ${
                        isBlocked ? 'bg-rose-950/10' : ''
                      }`}
                    >
                      {/* Investor Info */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center font-black text-sm shrink-0 ${
                            inv.kycStatus === 'approved'
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                          }`}>
                            {inv.name.charAt(0)}
                          </div>
                          <div className="space-y-0.5">
                            <p className="font-extrabold text-white text-sm leading-tight flex items-center gap-1.5 flex-wrap">
                              <span>{inv.name}</span>
                              <span className="font-mono text-[9px] text-amber-400/90 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-bold" title={`Supabase UUID: ${inv.id}`}>
                                ID: {inv.id.length > 8 ? `${inv.id.substring(0, 8)}...` : inv.id}
                              </span>
                              {isBlocked && (
                                <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[9px] font-bold">
                                  محظور
                                </span>
                              )}
                            </p>
                            <span className="text-[10px] text-slate-500 font-mono block">UUID: {inv.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Contact & Location */}
                      <td className="p-4">
                        <div className="space-y-1 text-slate-300">
                          <div className="flex items-center gap-1.5 text-xs">
                            <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="truncate max-w-[160px] font-mono">{inv.email}</span>
                          </div>
                          {inv.phone && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                              <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span>{inv.phone}</span>
                            </div>
                          )}
                          {inv.governorate && (
                            <div className="flex items-center gap-1.5 text-[11px] text-amber-400/90 font-bold">
                              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>{inv.governorate}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* User Role Selector (Investor <-> Admin) */}
                      <td className="p-4">
                        <select
                          value={inv.role || 'investor'}
                          onChange={(e) => handleUpdateUserRole(inv.id, e.target.value as 'admin' | 'investor')}
                          className={`text-xs font-black rounded-xl px-2.5 py-1.5 border focus:outline-none cursor-pointer transition-all ${
                            inv.role === 'admin'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                              : 'bg-slate-800/80 text-sky-400 border-slate-700'
                          }`}
                        >
                          <option value="investor" className="bg-slate-900 text-sky-400">
                            {currentLang === 'ar' ? 'مستثمر (Investor)' : 'Investor'}
                          </option>
                          <option value="admin" className="bg-slate-900 text-amber-300 font-bold">
                            {currentLang === 'ar' ? 'مدير نظام (Admin)' : 'Admin'}
                          </option>
                        </select>
                      </td>

                      {/* Account Status Selector */}
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <select
                            value={currentAccountStatus}
                            onChange={(e) => handleToggleAccountStatus(inv.id, e.target.value as 'active' | 'suspended' | 'verified')}
                            className={`text-xs font-black rounded-xl px-2.5 py-1.5 border focus:outline-none cursor-pointer transition-all ${
                              currentAccountStatus === 'verified'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/20'
                                : currentAccountStatus === 'suspended'
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                                : 'bg-blue-500/10 text-blue-400 border-blue-500/40 hover:bg-blue-500/20'
                            }`}
                          >
                            <option value="active" className="bg-slate-900 text-blue-400">
                              {currentLang === 'ar' ? 'نشط (Active)' : 'Active'}
                            </option>
                            <option value="verified" className="bg-slate-900 text-emerald-400">
                              {currentLang === 'ar' ? 'موثق (Verified)' : 'Verified'}
                            </option>
                            <option value="suspended" className="bg-slate-900 text-rose-400">
                              {currentLang === 'ar' ? 'موقوف / محظور' : 'Suspended'}
                            </option>
                          </select>
                        </div>
                      </td>

                      {/* KYC Status Dropdown Selector */}
                      <td className="p-4">
                        <select
                          value={inv.kycStatus}
                          onChange={(e) => handleUpdateUserKyc(inv.id, e.target.value as any)}
                          className={`text-xs font-black rounded-xl px-2.5 py-1.5 border focus:outline-none cursor-pointer transition-all ${
                            inv.kycStatus === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40'
                              : inv.kycStatus === 'pending'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                              : inv.kycStatus === 'rejected'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          <option value="approved" className="bg-slate-900 text-emerald-400">
                            {currentLang === 'ar' ? '✓ موثق ومعتمد (Approved)' : 'Approved'}
                          </option>
                          <option value="pending" className="bg-slate-900 text-amber-400">
                            {currentLang === 'ar' ? '⏳ قيد التدقيق (Pending)' : 'Pending'}
                          </option>
                          <option value="rejected" className="bg-slate-900 text-rose-400">
                            {currentLang === 'ar' ? '✕ مرفوض (Rejected)' : 'Rejected'}
                          </option>
                          <option value="not_submitted" className="bg-slate-900 text-slate-400">
                            {currentLang === 'ar' ? 'غير موثق (Unverified)' : 'Unverified'}
                          </option>
                        </select>
                      </td>

                      {/* Wallet Balance with Quick Edit Button */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-amber-400 text-sm">
                            ${inv.usdtBalance.toLocaleString()} USDT
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setQuickBalanceUser(inv);
                              setQuickBalanceVal(inv.usdtBalance.toString());
                              setQuickBalanceMsg(null);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 cursor-pointer transition-all"
                            title="تعديل الرصيد المالي فورا"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Active Plans & Invested Capital */}
                      <td className="p-4 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-lg bg-sky-500/10 text-sky-400 font-bold border border-sky-500/20 text-[11px] flex items-center gap-1">
                            <Truck className="w-3 h-3" />
                            {inv.activePlansCount} خطط نشطة
                          </span>
                        </div>
                        <p className="font-mono font-black text-emerald-400 text-xs">
                          ${inv.totalInvested.toLocaleString()} USDT
                        </p>
                      </td>

                      {/* Actions Column */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* Inspect Full Dossier */}
                          <button
                            type="button"
                            onClick={() => fetchDossier(inv.id)}
                            className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                            title="عرض الملف الكامل والعقود"
                          >
                            <Eye className="w-3.5 h-3.5 text-amber-400" />
                            <span>الملف الكامل</span>
                          </button>

                          {/* Block/Unblock toggle button */}
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleAccountStatus(
                                inv.id,
                                isBlocked ? 'active' : 'suspended'
                              )
                            }
                            className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              isBlocked
                                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                            }`}
                            title={isBlocked ? 'إلغاء حظر الحساب' : 'حظر الحساب'}
                          >
                            {isBlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          </button>

                          {/* Reset Password button */}
                          <button
                            type="button"
                            onClick={() => {
                              setResetPassUser(inv);
                              setResetPassVal('');
                              setResetPassMsg(null);
                            }}
                            className="p-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 cursor-pointer transition-all"
                            title="تغيير كلمة مرور الحساب"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => setDeleteTargetUser(inv)}
                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 cursor-pointer transition-all"
                            title="حذف الحساب نهائياً"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Balance Adjustment Modal */}
      {quickBalanceUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">تعديل رصيد محفظة المستثمر المباشر</h3>
              </div>
              <button
                type="button"
                onClick={() => setQuickBalanceUser(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs space-y-1">
              <p className="text-slate-400">اسم المستثمر: <span className="text-white font-bold">{quickBalanceUser.name}</span></p>
              <p className="text-slate-400">الرصيد الحالي: <span className="text-amber-400 font-mono font-bold">${quickBalanceUser.usdtBalance.toLocaleString()} USDT</span></p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">أدخل الرصيد الجديد المباشر (USDT):</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400 font-bold">$</span>
                <input
                  type="number"
                  min="0"
                  value={quickBalanceVal}
                  onChange={(e) => setQuickBalanceVal(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 font-mono font-black text-lg text-emerald-400 rounded-xl pl-8 pr-4 py-2.5 outline-none focus:border-amber-500"
                />
              </div>

              {/* Quick Preset Credit Buttons */}
              <div className="flex gap-2 pt-1">
                {[100, 500, 1000, 5000].map((addAmt) => (
                  <button
                    key={addAmt}
                    type="button"
                    onClick={() => setQuickBalanceVal((Number(quickBalanceVal || 0) + addAmt).toString())}
                    className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs font-bold border border-slate-700 cursor-pointer"
                  >
                    +${addAmt}
                  </button>
                ))}
              </div>
            </div>

            {quickBalanceMsg && (
              <p className="text-xs font-bold text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 text-center">
                {quickBalanceMsg}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setQuickBalanceUser(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={quickBalanceLoading}
                onClick={() => handleSaveBalance(quickBalanceUser.id, Number(quickBalanceVal))}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-md shadow-amber-500/20 hover:scale-[1.01] transition-transform"
              >
                حفظ الرصيد الجديد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <h3 className="text-base font-black text-white">تأكيد حذف المستثمر نهائياً</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              هل أنت تأكد من إزالة سجل المستثمر <strong className="text-white">({deleteTargetUser.name})</strong> نهائياً من قاعدة البيانات؟
              سيتم حذف حسابه وتنزيل كافة ارتباطات محفظته.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetUser(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                إلغاء الأمر
              </button>
              <button
                type="button"
                onClick={() => handleDeleteInvestor(deleteTargetUser.id)}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black text-xs cursor-pointer shadow-lg shadow-rose-500/20"
              >
                تأكيد الحذف النهائي
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client Dossier Full Inspector Modal */}
      {selectedUserId && dossier && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative my-8">
            <button
              type="button"
              onClick={() => {
                setSelectedUserId(null);
                setDossier(null);
              }}
              className="absolute top-5 left-5 rtl:right-5 rtl:left-auto text-slate-400 hover:text-white text-xl font-bold bg-slate-800 hover:bg-slate-700 w-9 h-9 rounded-full flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Dossier Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xl">
                  {dossier.client.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    {dossier.client.name}
                  </h2>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    {dossier.client.email} • ID: {dossier.client.id}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs">
                  <span className="text-slate-400 block text-[10px] font-bold">رصيد المحفظة المتاح</span>
                  <span className="font-mono font-black text-amber-400 text-sm">${dossier.client.usdtBalance.toLocaleString()} USDT</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs">
                  <span className="text-slate-400 block text-[10px] font-bold">إجمالي رأس المال المباشر</span>
                  <span className="font-mono font-black text-emerald-400 text-sm">${dossier.client.totalInvested.toLocaleString()} USDT</span>
                </div>
              </div>
            </div>

            {/* Dossier Tabs */}
            <div className="flex border-b border-slate-800 gap-2 overflow-x-auto">
              {[
                { id: 'profile', labelAr: '1. البيانات الشخصية ووثائق KYC' },
                { id: 'plans', labelAr: `2. العقود والاستثمارات النشطة (${dossier.plans.length})` },
                { id: 'ledger', labelAr: `3. المعاملات والإيداعات والسحوبات (${dossier.deposits.length + dossier.withdrawals.length})` },
                { id: 'wallet', labelAr: '4. تعديل الرصيد وتخصيص الأرباح' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveDossierTab(t.id as any)}
                  className={`pb-3 px-4 text-xs font-bold transition border-b-2 whitespace-nowrap cursor-pointer ${
                    activeDossierTab === t.id
                      ? 'border-amber-500 text-amber-400 font-black'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.labelAr}
                </button>
              ))}
            </div>

            {/* Tab 1: Profile & Uploaded KYC Documents */}
            {activeDossierTab === 'profile' && (
              <div className="space-y-6 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div>
                    <span className="text-slate-500 block mb-1 font-bold">رقم الهاتف:</span>
                    <span className="text-slate-100 font-mono font-bold text-sm">{dossier.client.phone || 'غير مسجل'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1 font-bold">المحافظة / المدينة:</span>
                    <span className="text-amber-400 font-bold text-sm">{dossier.client.governorate || 'العراق'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1 font-bold">تاريخ الانضمام:</span>
                    <span className="text-slate-100 font-mono">{dossier.client.joinedDate || '2025-01-15'}</span>
                  </div>
                </div>

                {/* KYC Documents */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-slate-200 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span>مستندات وتفاصيل التوثيق المرفوعة (KYC):</span>
                    </h3>
                  </div>

                  {dossier.kyc ? (
                    <div className="space-y-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-slate-500 block font-bold">الاسم الرباعي الكامل:</span>
                          <span className="text-slate-100 font-extrabold text-sm">{dossier.kyc.fullName}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block font-bold">رقم الهوية الوطنية / الموحدة:</span>
                          <span className="text-amber-400 font-mono font-bold text-sm">{dossier.kyc.idNumber}</span>
                        </div>
                      </div>

                      {/* Images preview */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        <div>
                          <span className="text-[11px] text-slate-400 block mb-1 font-bold">وجه الهوية الوطنية</span>
                          <img
                            src={dossier.kyc.nationalIdFront}
                            alt="Front ID"
                            className="w-full h-32 object-cover rounded-xl border border-slate-800 hover:scale-105 transition cursor-pointer"
                            onClick={() => window.open(dossier.kyc?.nationalIdFront, '_blank')}
                          />
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-400 block mb-1 font-bold">ظهر الهوية الوطنية</span>
                          <img
                            src={dossier.kyc.nationalIdBack}
                            alt="Back ID"
                            className="w-full h-32 object-cover rounded-xl border border-slate-800 hover:scale-105 transition cursor-pointer"
                            onClick={() => window.open(dossier.kyc?.nationalIdBack, '_blank')}
                          />
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-400 block mb-1 font-bold">بطاقة السكن / الإقامة</span>
                          <img
                            src={dossier.kyc.housingCard}
                            alt="Housing Card"
                            className="w-full h-32 object-cover rounded-xl border border-slate-800 hover:scale-105 transition cursor-pointer"
                            onClick={() => window.open(dossier.kyc?.housingCard, '_blank')}
                          />
                        </div>
                      </div>

                      {/* Admin KYC Actions */}
                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={async () => {
                            await handleUpdateUserKyc(dossier.client.id, 'approved');
                          }}
                          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black transition flex items-center gap-1.5 cursor-pointer shadow-md"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          اعتماد التوثيق فوراً (Approve KYC)
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await handleUpdateUserKyc(dossier.client.id, 'rejected', 'عدم وضوح صور المستمسكات');
                          }}
                          className="px-5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-black transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                          رفض التوثيق (Reject KYC)
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-500 bg-slate-950 rounded-2xl border border-slate-800 font-bold">
                      لم يقم هذا المستثمر برفع مستندات توثيق الهوية (KYC) بعد.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Subscribed Fleet Plans Portfolio */}
            {activeDossierTab === 'plans' && (
              <div className="space-y-4 text-xs">
                {dossier.plans.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 bg-slate-950 rounded-2xl border border-slate-800 font-bold">
                    لا توجد عقود استثمارية نشطة لهذا المستثمر حتى الآن.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dossier.plans.map((inv) => (
                      <div key={inv.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between items-center gap-4">
                        <div>
                          <p className="font-black text-white text-sm">{inv.projectTitle}</p>
                          <p className="text-slate-400 text-[11px] font-mono mt-0.5">
                            بدء: {new Date(inv.startDate).toLocaleDateString()} • استحقاق القفل 5 أشهر: {new Date(inv.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-black text-amber-400 text-sm block">${inv.amount.toLocaleString()} USDT</span>
                          <span className="text-emerald-400 font-bold text-[11px]">{inv.monthlyRoiPercent}% شهرياً</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Complete Financial Ledger (Deposits & Withdrawals) */}
            {activeDossierTab === 'ledger' && (
              <div className="space-y-4 text-xs">
                <div className="space-y-2">
                  <h4 className="font-black text-slate-300">سجل عمليات الإيداع ({dossier.deposits.length}):</h4>
                  {dossier.deposits.length === 0 ? (
                    <p className="text-slate-500 text-center py-4 bg-slate-950 rounded-xl border border-slate-800">لا توجد عمليات إيداع مسجلة.</p>
                  ) : (
                    dossier.deposits.map((d) => (
                      <div key={d.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex justify-between items-center text-slate-300">
                        <div>
                          <span className="font-mono text-amber-400 font-bold">{d.id}</span>
                          <span className="text-[11px] text-slate-500 block">{d.network} • {new Date(d.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-black text-emerald-400">+${d.amount.toLocaleString()} USDT</span>
                          <span className="block text-[10px] text-slate-400 font-bold capitalize">{d.status}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-2 border-t border-slate-800 pt-3">
                  <h4 className="font-black text-slate-300">سجل طلبات السحب ({dossier.withdrawals.length}):</h4>
                  {dossier.withdrawals.length === 0 ? (
                    <p className="text-slate-500 text-center py-4 bg-slate-950 rounded-xl border border-slate-800">لا توجد طلبات سحب مسجلة.</p>
                  ) : (
                    dossier.withdrawals.map((w) => (
                      <div key={w.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex justify-between items-center text-slate-300">
                        <div>
                          <span className="font-mono text-amber-400 font-bold">{w.id}</span>
                          <span className="text-[11px] text-slate-500 block">{w.payoutMethod} • {new Date(w.requestedAt).toLocaleString()}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-black text-rose-400">-${w.amount.toLocaleString()} USDT</span>
                          <span className="block text-[10px] text-slate-400 font-bold capitalize">{w.status}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Tab 4: Wallet Operations & Balance Edit */}
            {activeDossierTab === 'wallet' && (
              <div className="space-y-4 bg-slate-950 p-5 rounded-2xl border border-slate-800 text-xs">
                <h3 className="font-black text-slate-200">تعديل وإعادة ضبط رصيد محفظة المستثمر المباشر:</h3>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400 font-bold">$</span>
                    <input
                      type="number"
                      value={newBalanceInput}
                      onChange={(e) => setNewBalanceInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 font-mono font-black text-white rounded-xl pl-8 pr-4 py-3 text-base focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveBalance(dossier.client.id, Number(newBalanceInput))}
                    disabled={balanceAdjusting}
                    className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black transition cursor-pointer shadow-md shadow-amber-500/20"
                  >
                    تعديل الرصيد
                  </button>
                </div>
                {balanceMsg && <p className="text-emerald-400 font-bold text-xs">{balanceMsg}</p>}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setSelectedUserId(null);
                  setDossier(null);
                }}
                className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Reset User Password Modal */}
      {resetPassUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">تغيير كلمة مرور حساب المستخدم</h3>
                  <p className="text-[11px] text-slate-400">{resetPassUser.name} ({resetPassUser.email})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setResetPassUser(null);
                  setResetPassVal('');
                  setResetPassMsg(null);
                }}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {resetPassMsg && (
              <div
                className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                  resetPassMsg.type === 'success'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                }`}
              >
                {resetPassMsg.type === 'success' ? (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{resetPassMsg.text}</span>
              </div>
            )}

            <form noValidate onSubmit={handleResetUserPassword} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">كلمة المرور الجديدة للحساب:</label>
                <input
                  type="text"
                  required
                  value={resetPassVal}
                  onChange={(e) => setResetPassVal(e.target.value)}
                  placeholder="أدخل كلمة المرور الجديدة لـ "
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setResetPassUser(null);
                    setResetPassVal('');
                    setResetPassMsg(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={resetPassLoading || !resetPassVal.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-purple-400 text-white font-black shadow-lg shadow-purple-500/20 cursor-pointer disabled:opacity-50"
                >
                  {resetPassLoading ? 'جاري الحفظ...' : 'اعتماد كلمة المرور'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Admin Employee Modal */}
      {showAddAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <UserPlus className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">إضافة موظف / مدير نظام جديد</h3>
                  <p className="text-[11px] text-slate-400">إنشاء حساب إداري بخصائص الصلاحية الكاملة</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddAdminModal(false);
                  setAddAdminEmail('');
                  setAddAdminName('');
                  setAddAdminPassword('');
                  setAddAdminMsg(null);
                }}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addAdminMsg && (
              <div
                className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                  addAdminMsg.type === 'success'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                }`}
              >
                {addAdminMsg.type === 'success' ? (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{addAdminMsg.text}</span>
              </div>
            )}

            <form noValidate onSubmit={handleCreateAdminSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">البريد الإلكتروني للمدير الجديد *</label>
                <input
                  type="email"
                  required
                  value={addAdminEmail}
                  onChange={(e) => setAddAdminEmail(e.target.value)}
                  placeholder="admin.employee@aseel.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sky-300 font-mono outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">الاسم الظاهر للموظف (اختياري)</label>
                <input
                  type="text"
                  value={addAdminName}
                  onChange={(e) => setAddAdminName(e.target.value)}
                  placeholder="مثال: أحمد محمود - مشرف النظام"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">كلمة المرور الابتدائية *</label>
                <input
                  type="password"
                  required
                  value={addAdminPassword}
                  onChange={(e) => setAddAdminPassword(e.target.value)}
                  placeholder="كلمة مرور من 6 خانات على الأقل..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddAdminModal(false);
                    setAddAdminEmail('');
                    setAddAdminName('');
                    setAddAdminPassword('');
                    setAddAdminMsg(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={addAdminLoading || !addAdminEmail.trim() || !addAdminPassword.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-400 text-slate-950 font-black shadow-lg shadow-sky-500/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {addAdminLoading ? 'جاري التعين...' : 'إنشاء وتعيين المدير'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
