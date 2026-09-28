import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Copy,
  Check,
  Clock,
  FileCheck,
  RefreshCw,
  Mail,
  Phone,
  CreditCard,
  Lock,
  X,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  User,
  Image as ImageIcon,
} from 'lucide-react';
import { Language } from '../../types';

export interface PasswordResetRecord {
  id: string;
  email: string;
  phone: string;
  nationalIdNumber: string;
  newPassword: string;
  idFrontImage: string;
  idBackImage: string;
  residenceCardImage: string;
  selfieImage: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt?: string;
}

interface PasswordResetManagementProps {
  currentLang: Language;
}

export const PasswordResetManagement: React.FC<PasswordResetManagementProps> = ({
  currentLang,
}) => {
  const isRtl = currentLang === 'ar' || currentLang === 'ckb';

  const [requests, setRequests] = useState<PasswordResetRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  // UI States
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({});
  const [actionLoadingMap, setActionLoadingMap] = useState<Record<string, boolean>>({});
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Lightbox Modal for Document Inspection
  const [lightboxImage, setLightboxImage] = useState<{
    url: string;
    title: string;
  } | null>(null);

  const fetchRequests = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const res = await fetch('/api/admin/password-reset-requests');
      const data = await res.json();
      if (data.success && Array.isArray(data.requests)) {
        setRequests(data.requests);
      } else {
        setError('فشل في تحميل طلبات إعادة تعيين كلمة المرور');
      }
    } catch (err: any) {
      console.error('Error fetching password reset requests:', err);
      setError('حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMap((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedMap((prev) => ({ ...prev, [key]: false }));
    }, 2000);
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleApprove = async (record: PasswordResetRecord) => {
    if (
      !window.confirm(
        currentLang === 'ar'
          ? `هل أنت تأكد من اعتماد طلب (${record.email}) وتحديث كلمة المرور إلى (${record.newPassword})؟`
          : `Approve password reset for ${record.email} and set password to ${record.newPassword}?`
      )
    ) {
      return;
    }

    try {
      setActionLoadingMap((prev) => ({ ...prev, [record.id]: true }));
      const res = await fetch(`/api/admin/password-reset-requests/${record.id}/approve`, {
        method: 'POST',
      });
      const data = await res.json();

      if (data.success) {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === record.id
              ? { ...r, status: 'approved', updatedAt: new Date().toISOString() }
              : r
          )
        );
        setActionSuccessMsg(
          currentLang === 'ar'
            ? `✅ تم اعتماد الطلب وتحديث كلمة مرور (${record.email}) بنجاح!`
            : `✅ Request approved and password updated for (${record.email})!`
        );
        setTimeout(() => setActionSuccessMsg(null), 5000);
      } else {
        alert(data.error || 'فشل اعتماد الطلب');
      }
    } catch (err: any) {
      console.error('Error approving request:', err);
      alert('حدث خطأ أثناء تنفيذ عملية الاعتماد');
    } finally {
      setActionLoadingMap((prev) => ({ ...prev, [record.id]: false }));
    }
  };

  const handleReject = async (record: PasswordResetRecord) => {
    if (
      !window.confirm(
        currentLang === 'ar'
          ? `هل أنت متاكد من رفض طلب إعادة تعيين كلمة المرور للمستخدم (${record.email})؟`
          : `Are you sure you want to reject password reset request for (${record.email})?`
      )
    ) {
      return;
    }

    try {
      setActionLoadingMap((prev) => ({ ...prev, [record.id]: true }));
      const res = await fetch(`/api/admin/password-reset-requests/${record.id}/reject`, {
        method: 'POST',
      });
      const data = await res.json();

      if (data.success) {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === record.id
              ? { ...r, status: 'rejected', updatedAt: new Date().toISOString() }
              : r
          )
        );
        setActionSuccessMsg(
          currentLang === 'ar'
            ? `تم رفض طلب (${record.email})`
            : `Rejected password reset request for (${record.email})`
        );
        setTimeout(() => setActionSuccessMsg(null), 4000);
      } else {
        alert(data.error || 'فشل رفض الطلب');
      }
    } catch (err: any) {
      console.error('Error rejecting request:', err);
      alert('حدث خطأ أثناء تنفيذ العملية');
    } finally {
      setActionLoadingMap((prev) => ({ ...prev, [record.id]: false }));
    }
  };

  // Filtering
  const filteredRequests = requests.filter((req) => {
    if (statusFilter !== 'all' && req.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        req.email.toLowerCase().includes(q) ||
        req.phone.toLowerCase().includes(q) ||
        req.nationalIdNumber.toLowerCase().includes(q) ||
        req.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;
  const rejectedCount = requests.filter((r) => r.status === 'rejected').length;

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="space-y-6">
      {/* Top Banner / Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <KeyRound className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-black text-white">
              {currentLang === 'ar'
                ? 'قسم طلبات تغيير كلمة المرور'
                : currentLang === 'ckb'
                ? 'بەشی داواکارییەکانی گۆڕینی وشەی نهێنی'
                : 'Password Reset Requests Management'}
            </h2>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-extrabold text-xs animate-pulse">
                {pendingCount} {currentLang === 'ar' ? 'معلق' : 'Pending'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            {currentLang === 'ar'
              ? 'مراجعة المستمسكات والصورة الشخصية وتدقيق الهوية قبل الموافقة وتحديث كلمة مرور المستخدم آلياً في النظام'
              : 'Review KYC documents and selfies before approving and auto-updating user passwords'}
          </p>
        </div>

        <button
          type="button"
          onClick={fetchRequests}
          disabled={refreshing}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2 cursor-pointer border border-slate-700 shrink-0 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 text-amber-400 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{currentLang === 'ar' ? 'تحديث القائمة' : 'Refresh List'}</span>
        </button>
      </div>

      {/* Success Notification Alert */}
      {actionSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccessMsg(null)}
            className="text-emerald-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{currentLang === 'ar' ? 'قيد التدقيق' : 'Pending'}</span>
            <span className="px-1.5 py-0.5 rounded-md bg-slate-950/30 text-[10px] font-mono">
              {pendingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('approved')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              statusFilter === 'approved'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{currentLang === 'ar' ? 'المعتمدة' : 'Approved'}</span>
            <span className="px-1.5 py-0.5 rounded-md bg-slate-950/30 text-[10px] font-mono">
              {approvedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('rejected')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              statusFilter === 'rejected'
                ? 'bg-rose-500 text-slate-950 font-black shadow-md shadow-rose-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>{currentLang === 'ar' ? 'المرفوضة' : 'Rejected'}</span>
            <span className="px-1.5 py-0.5 rounded-md bg-slate-950/30 text-[10px] font-mono">
              {rejectedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-700 text-white font-black'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{currentLang === 'ar' ? 'الكل' : 'All'}</span>
            <span className="px-1.5 py-0.5 rounded-md bg-slate-950/30 text-[10px] font-mono">
              {requests.length}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute top-3 right-3.5 rtl:right-3.5 ltr:left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              currentLang === 'ar'
                ? 'بحث بالبريد، الهاتف، البطاقة...'
                : 'Search by Email, Phone, ID...'
            }
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-9 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
          />
        </div>
      </div>

      {/* Main Request Cards List */}
      {loading ? (
        <div className="py-12 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">
            {currentLang === 'ar' ? 'جاري تحميل الطلبات...' : 'Loading requests...'}
          </p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-3xl space-y-3">
          <KeyRound className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">
            {currentLang === 'ar'
              ? 'لا توجد طلبات تغيير كلمة مرور مطابقة'
              : 'No matching password reset requests found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {currentLang === 'ar'
              ? 'تظهر هنا جميع طلبات إعادة تعيين كلمة المرور المقدمة من قبل المستخدمين مع الصور والمستمسكات الرسمية'
              : 'All user password reset requests along with identity documents will appear here'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredRequests.map((record) => {
            const isPending = record.status === 'pending';
            const isApproved = record.status === 'approved';
            const isRejected = record.status === 'rejected';
            const isProcessing = Boolean(actionLoadingMap[record.id]);
            const isPassVisible = Boolean(visiblePasswords[record.id]);

            return (
              <div
                key={record.id}
                className={`bg-slate-900 border rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 transition relative overflow-hidden ${
                  isPending
                    ? 'border-amber-500/30 hover:border-amber-500/60'
                    : isApproved
                    ? 'border-emerald-500/30'
                    : 'border-slate-800 opacity-80'
                }`}
              >
                {/* Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                        isPending
                          ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                          : isApproved
                          ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                          : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                      }`}
                    >
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                          #{record.id}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          {new Date(record.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <h3 className="text-sm font-black text-white mt-0.5">
                        {record.email}
                      </h3>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    {isPending && (
                      <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold text-xs flex items-center gap-1.5 shadow-sm">
                        <Clock className="w-3.5 h-3.5 animate-spin" />
                        <span>
                          {currentLang === 'ar'
                            ? 'قيد مراجعة المستمسكات'
                            : 'Pending Identity Audit'}
                        </span>
                      </span>
                    )}

                    {isApproved && (
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-extrabold text-xs flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>
                          {currentLang === 'ar'
                            ? 'تم الاعتماد وتحديث كلمة المرور'
                            : 'Approved & Password Updated'}
                        </span>
                      </span>
                    )}

                    {isRejected && (
                      <span className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-extrabold text-xs flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                        <span>{currentLang === 'ar' ? 'مرفوض' : 'Rejected'}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  {/* Email */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-amber-400" />
                      <span>
                        {currentLang === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                      </span>
                    </span>
                    <div className="flex items-center justify-between bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800">
                      <span className="text-xs font-mono font-bold text-white truncate max-w-[140px]">
                        {record.email}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(`email-${record.id}`, record.email)}
                        className="text-slate-500 hover:text-amber-400 transition"
                      >
                        {copiedMap[`email-${record.id}`] ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-amber-400" />
                      <span>{currentLang === 'ar' ? 'رقم الهاتف' : 'Phone'}</span>
                    </span>
                    <div className="flex items-center justify-between bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800">
                      <span className="text-xs font-mono font-bold text-white">
                        {record.phone}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(`phone-${record.id}`, record.phone)}
                        className="text-slate-500 hover:text-amber-400 transition"
                      >
                        {copiedMap[`phone-${record.id}`] ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* National ID */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <CreditCard className="w-3 h-3 text-amber-400" />
                      <span>
                        {currentLang === 'ar'
                          ? 'رقم البطاقة الوطنية'
                          : 'National ID #'}
                      </span>
                    </span>
                    <div className="flex items-center justify-between bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800">
                      <span className="text-xs font-mono font-bold text-white">
                        {record.nationalIdNumber}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(`id-${record.id}`, record.nationalIdNumber)
                        }
                        className="text-slate-500 hover:text-amber-400 transition"
                      >
                        {copiedMap[`id-${record.id}`] ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Requested New Password */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-amber-400" />
                      <span>
                        {currentLang === 'ar'
                          ? 'كلمة المرور الجديدة المطلوبة'
                          : 'Requested New Password'}
                      </span>
                    </span>
                    <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 px-2.5 py-1.5 rounded-xl">
                      <span className="text-xs font-mono font-black text-amber-300">
                        {isPassVisible ? record.newPassword : '••••••••••••'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(record.id)}
                          className="text-slate-400 hover:text-white transition"
                        >
                          {isPassVisible ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(`pass-${record.id}`, record.newPassword)
                          }
                          className="text-slate-400 hover:text-amber-400 transition"
                        >
                          {copiedMap[`pass-${record.id}`] ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Uploaded Identity Documents & Selfie Grid */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-300 flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-amber-400" />
                    <span>
                      {currentLang === 'ar'
                        ? 'المستمسكات المرفقة واثبات الشخصية (انقر لتكبير الصورة):'
                        : 'Uploaded Identity Documents & Selfie (Click to Enlarge):'}
                    </span>
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* ID Front */}
                    <div
                      onClick={() =>
                        setLightboxImage({
                          url: record.idFrontImage,
                          title: 'البطاقة الوطنية - الوجه الأمامي',
                        })
                      }
                      className="group relative rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 p-2 cursor-pointer transition overflow-hidden h-32 flex flex-col justify-between"
                    >
                      <img
                        src={record.idFrontImage}
                        alt="ID Front"
                        className="w-full h-20 object-cover rounded-xl group-hover:scale-105 transition duration-300"
                      />
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 mt-1">
                        <span>
                          {currentLang === 'ar' ? 'هوية (أمامي)' : 'ID Front'}
                        </span>
                        <ExternalLink className="w-3 h-3 text-amber-400 opacity-0 group-hover:opacity-100 transition" />
                      </div>
                    </div>

                    {/* ID Back */}
                    <div
                      onClick={() =>
                        setLightboxImage({
                          url: record.idBackImage,
                          title: 'البطاقة الوطنية - الوجه الخلفي',
                        })
                      }
                      className="group relative rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 p-2 cursor-pointer transition overflow-hidden h-32 flex flex-col justify-between"
                    >
                      <img
                        src={record.idBackImage}
                        alt="ID Back"
                        className="w-full h-20 object-cover rounded-xl group-hover:scale-105 transition duration-300"
                      />
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 mt-1">
                        <span>
                          {currentLang === 'ar' ? 'هوية (خلفي)' : 'ID Back'}
                        </span>
                        <ExternalLink className="w-3 h-3 text-amber-400 opacity-0 group-hover:opacity-100 transition" />
                      </div>
                    </div>

                    {/* Residence Card */}
                    <div
                      onClick={() =>
                        setLightboxImage({
                          url: record.residenceCardImage,
                          title: 'بطاقة السكن الرسمية',
                        })
                      }
                      className="group relative rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 p-2 cursor-pointer transition overflow-hidden h-32 flex flex-col justify-between"
                    >
                      <img
                        src={record.residenceCardImage}
                        alt="Residence Card"
                        className="w-full h-20 object-cover rounded-xl group-hover:scale-105 transition duration-300"
                      />
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 mt-1">
                        <span>
                          {currentLang === 'ar'
                            ? 'بطاقة السكن'
                            : 'Residence Card'}
                        </span>
                        <ExternalLink className="w-3 h-3 text-amber-400 opacity-0 group-hover:opacity-100 transition" />
                      </div>
                    </div>

                    {/* Selfie Photo */}
                    <div
                      onClick={() =>
                        setLightboxImage({
                          url: record.selfieImage,
                          title: 'الصورة الشخصية (Selfie)',
                        })
                      }
                      className="group relative rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 p-2 cursor-pointer transition overflow-hidden h-32 flex flex-col justify-between"
                    >
                      <img
                        src={record.selfieImage}
                        alt="Selfie"
                        className="w-full h-20 object-cover rounded-xl group-hover:scale-105 transition duration-300"
                      />
                      <div className="flex items-center justify-between text-[10px] font-bold text-amber-300 mt-1">
                        <span>
                          {currentLang === 'ar' ? 'سيلفي (Selfie)' : 'Selfie'}
                        </span>
                        <ExternalLink className="w-3 h-3 text-amber-400 opacity-0 group-hover:opacity-100 transition" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Approve & Action Controls */}
                {isPending && (
                  <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-end gap-3">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleReject(record)}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-rose-400 border border-slate-700 hover:border-rose-500/40 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>{currentLang === 'ar' ? 'رفض الطلب' : 'Reject'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleApprove(record)}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 hover:scale-[1.02]"
                    >
                      {isProcessing ? (
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-4.5 h-4.5 text-slate-950" />
                          <span>
                            {currentLang === 'ar'
                              ? 'اعتماد وتحديث كلمة المرور تلقائياً'
                              : 'Approve & Auto-Update Password'}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal for Full Image Inspection */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
          <div className="relative max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl space-y-3 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>{lightboxImage.title}</span>
              </h3>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center rounded-2xl bg-slate-950 p-2">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.title}
                className="max-h-[70vh] object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
