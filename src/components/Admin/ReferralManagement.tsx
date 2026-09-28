import React, { useState, useEffect } from 'react';
import {
  Users,
  Gift,
  Award,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
  Settings,
  Save,
  UserPlus,
  Copy,
  Check,
  Search,
  Filter,
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import { Language, ReferralRecord, ReferralTierConfig } from '../../types';

interface TopInviter {
  inviterId: string;
  inviterName: string;
  inviterEmail: string;
  inviterCode: string;
  totalInvited: number;
  qualifiedCount: number;
  totalEarned: number;
}

interface ReferralManagementProps {
  currentLang: Language;
}

export const ReferralManagement: React.FC<ReferralManagementProps> = ({ currentLang }) => {
  const isAr = currentLang === 'ar';
  const isCkb = currentLang === 'ckb';

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalInvited: 0,
    totalQualified: 0,
    totalBonusesPaid: 0,
    activeInvitersCount: 0,
  });
  const [topInviters, setTopInviters] = useState<TopInviter[]>([]);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [tiers, setTiers] = useState<ReferralTierConfig>({
    tier1Min: 1,
    tier1Max: 5,
    tier1Amount: 10,
    tier2Min: 6,
    tier2Max: 15,
    tier2Amount: 20,
    tier3Min: 16,
    tier3Amount: 35,
  });

  const [savingTiers, setSavingTiers] = useState(false);
  const [tierForm, setTierForm] = useState({
    tier1Amount: 10,
    tier1Max: 5,
    tier2Amount: 20,
    tier2Max: 15,
    tier3Amount: 35,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'registered' | 'eligible' | 'qualified'>('all');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchReferralData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/referrals');
      if (res.ok) {
        const data = await res.json();
        if (data.stats) setStats(data.stats);
        if (data.topInviters) setTopInviters(data.topInviters);
        if (data.referrals) setReferrals(data.referrals);
        if (data.tiers) {
          setTiers(data.tiers);
          setTierForm({
            tier1Amount: data.tiers.tier1Amount || 10,
            tier1Max: data.tiers.tier1Max || 5,
            tier2Amount: data.tiers.tier2Amount || 20,
            tier2Max: data.tiers.tier2Max || 15,
            tier3Amount: data.tiers.tier3Amount || 35,
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch admin referral data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferralData();
  }, []);

  const handleSaveTiers = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingTiers(true);
      const res = await fetch('/api/admin/referrals/tiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tierForm),
      });
      if (res.ok) {
        const data = await res.json();
        setTiers(data.tiers);
        setActionNotice(
          isAr
            ? '✅ تم تحديث مستويات ومكافآت برنامج الإحالة بنجاح'
            : '✅ Referral tiers updated successfully'
        );
        setTimeout(() => setActionNotice(null), 4000);
      }
    } catch (err) {
      console.error('Failed to update tiers:', err);
    } finally {
      setSavingTiers(false);
    }
  };

  const handleQualifyManually = async (referralId: string) => {
    try {
      const res = await fetch('/api/admin/referrals/qualify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralId }),
      });
      if (res.ok) {
        setActionNotice(
          isAr
            ? '🎁 تم اعتماد الإحالة وإيداع المكافأة في محفظة الداعي بنجاح!'
            : '🎁 Referral manually qualified & bonus credited!'
        );
        setTimeout(() => setActionNotice(null), 4000);
        fetchReferralData();
      }
    } catch (err) {
      console.error('Failed to qualify referral:', err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredReferrals = referrals.filter((r) => {
    const matchesSearch =
      r.inviterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.inviterCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.invitedUserName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.invitedUserEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/20 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
              <Gift className="w-4 h-4 text-amber-400" />
              <span>{isAr ? 'برنامج الإحالات والمكافآت التصاعدية' : 'Tiered Referral Engine'}</span>
            </div>
            <h2 className="text-2xl font-black text-slate-100">
              {isAr ? 'إدارة نظام الدعوات والأكواد المخصصة' : 'Referral System & Custom Codes'}
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              {isAr
                ? 'مراقبة نظام كود الدعوة المخصص، تتبع التسجيلات التلقائية، وإدارة مستويات البونص المتدرجة عند قيام المدعوين بأول عملية إيداع.'
                : 'Manage custom referral code tracking, automatic payouts on first deposit, and dynamic tier rewards scaling.'}
            </p>
          </div>
          <button
            onClick={fetchReferralData}
            className="self-start md:self-auto bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{isAr ? 'تحديث البيانات' : 'Refresh Data'}</span>
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 block mb-1">
              {isAr ? 'إجمالي تسجيلات الإحالة' : 'Total Referral Signups'}
            </span>
            <span className="text-2xl font-black text-slate-100 font-mono">
              {stats.totalInvited.toLocaleString()}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <UserPlus className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 block mb-1">
              {isAr ? 'المستثمرون المؤهلون (قاموا بالإيداع)' : 'Qualified Deposited Referrals'}
            </span>
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {stats.totalQualified.toLocaleString()}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 block mb-1">
              {isAr ? 'إجمالي البونص المدفوع' : 'Total Bonuses Paid'}
            </span>
            <span className="text-2xl font-black text-amber-400 font-mono">
              ${stats.totalBonusesPaid.toLocaleString()} USDT
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 block mb-1">
              {isAr ? 'أعضاء الداعين النشطين' : 'Active Inviters'}
            </span>
            <span className="text-2xl font-black text-indigo-400 font-mono">
              {stats.activeInvitersCount.toLocaleString()}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tier Management & Settings Form */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2.5 mb-4 border-b border-slate-800/80 pb-3">
          <Settings className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-slate-100 text-sm">
            {isAr ? 'إعداد شرائح ومكافآت الإحالة (Tiered Milestone Rewards)' : 'Referral Tiers Configuration'}
          </h3>
        </div>

        <form onSubmit={handleSaveTiers} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tier 1 */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
              <div className="absolute top-2 left-2 rtl:left-2 ltr:right-2 text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                Tier 1 (المستوى الأول)
              </div>
              <div className="text-xs font-bold text-slate-300 mb-3 mt-1">
                {isAr ? '1 إلى 5 إحالات ناجحة' : '1 to 5 Qualified Referrals'}
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  {isAr ? 'مكافأة الإحالة الواحدة ($ USDT)' : 'Bonus per qualified invite ($)'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={tierForm.tier1Amount}
                  onChange={(e) => setTierForm({ ...tierForm, tier1Amount: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-sm text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Tier 2 */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
              <div className="absolute top-2 left-2 rtl:left-2 ltr:right-2 text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                Tier 2 (المستوى الثاني)
              </div>
              <div className="text-xs font-bold text-slate-300 mb-3 mt-1">
                {isAr ? '6 إلى 15 إحالة ناجحة' : '6 to 15 Qualified Referrals'}
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  {isAr ? 'مكافأة الإحالة الواحدة ($ USDT)' : 'Bonus per qualified invite ($)'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={tierForm.tier2Amount}
                  onChange={(e) => setTierForm({ ...tierForm, tier2Amount: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-sm text-indigo-300 font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Tier 3 */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
              <div className="absolute top-2 left-2 rtl:left-2 ltr:right-2 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                Tier 3 (المستوى الماسي)
              </div>
              <div className="text-xs font-bold text-slate-300 mb-3 mt-1">
                {isAr ? '16+ إحالة ناجحة فأكثر' : '16+ Qualified Referrals'}
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  {isAr ? 'مكافأة الإحالة الواحدة ($ USDT)' : 'Bonus per qualified invite ($)'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={tierForm.tier3Amount}
                  onChange={(e) => setTierForm({ ...tierForm, tier3Amount: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-sm text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingTiers}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{savingTiers ? (isAr ? 'جاري الحفظ...' : 'Saving...') : isAr ? 'حفظ الشروط والتعديلات' : 'Save Tier Settings'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Top Inviters Leaderboard */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-slate-100 text-sm">
              {isAr ? 'لوحة كبار الداعين والأكواد الأكثر نشاطاً' : 'Top Inviters & Referral Leaders'}
            </h3>
          </div>
        </div>

        {topInviters.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            {isAr ? 'لا يوجد دُعاة نشطون حالياً' : 'No active inviters found'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right rtl:text-right ltr:text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400">
                  <th className="py-2.5 px-3">{isAr ? 'الداعي' : 'Inviter'}</th>
                  <th className="py-2.5 px-3">{isAr ? 'كود الدعوة' : 'Referral Code'}</th>
                  <th className="py-2.5 px-3 text-center">{isAr ? 'المسجلون' : 'Invited'}</th>
                  <th className="py-2.5 px-3 text-center">{isAr ? 'المؤهلون' : 'Qualified'}</th>
                  <th className="py-2.5 px-3 text-left rtl:text-left ltr:text-right">{isAr ? 'إجمالي البونص المحقق' : 'Total Earned'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {topInviters.map((inv) => (
                  <tr key={inv.inviterId} className="hover:bg-slate-800/30">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-100">{inv.inviterName}</div>
                      <div className="text-[10px] text-slate-500">{inv.inviterEmail}</div>
                    </td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => copyToClipboard(inv.inviterCode)}
                        className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono font-bold px-2.5 py-1 rounded-lg text-xs hover:bg-amber-500/20 transition-all cursor-pointer"
                      >
                        <span>{inv.inviterCode}</span>
                        {copiedCode === inv.inviterCode ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-amber-400" />
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-300 font-mono">
                      {inv.totalInvited}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-emerald-400 font-mono">
                      {inv.qualifiedCount}
                    </td>
                    <td className="py-3 px-3 text-left rtl:text-left ltr:text-right font-black text-amber-400 font-mono">
                      ${inv.totalEarned} USDT
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* All Platform Referrals Log Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-slate-100 text-sm">
              {isAr ? 'جميع عمليات الإحالة المسجلة منصاتياً' : 'All Platform Referral Logs'}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute top-2.5 right-2.5 rtl:right-2.5 ltr:left-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={isAr ? 'بحث بالاسم أو الكود...' : 'Search by name or code...'}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 pr-8 pl-3 rtl:pr-8 rtl:pl-3 ltr:pl-8 ltr:pr-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 appearance-none cursor-pointer"
            >
              <option value="all">{isAr ? 'جميع الحالات' : 'All Statuses'}</option>
              <option value="registered">{isAr ? '⏳ بانتظار الإيداع' : 'Pending Deposit'}</option>
              <option value="eligible">{isAr ? '✨ مؤهل بانتظار الاعتماد اليدوي' : 'Eligible (Pending Credit)'}</option>
              <option value="qualified">{isAr ? '✅ تم اعتماد وصرف المكافأة' : 'Qualified & Paid'}</option>
            </select>
          </div>
        </div>

        {filteredReferrals.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            {isAr ? 'لا توجد سجلات إحالة تتطابق مع خيارات البحث' : 'No referral records found'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right rtl:text-right ltr:text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400">
                  <th className="py-2.5 px-3">{isAr ? 'الداعي (المرسِل)' : 'Inviter'}</th>
                  <th className="py-2.5 px-3">{isAr ? 'المدعو (العضو الجديد)' : 'Invited Member'}</th>
                  <th className="py-2.5 px-3">{isAr ? 'حالة الإحالة' : 'Status'}</th>
                  <th className="py-2.5 px-3 text-center">{isAr ? 'مبلغ الإيداع' : 'Deposit'}</th>
                  <th className="py-2.5 px-3 text-center">{isAr ? 'المكافأة' : 'Bonus'}</th>
                  <th className="py-2.5 px-3 text-left rtl:text-left ltr:text-right">{isAr ? 'الإجراء' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredReferrals.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-100">{r.inviterName}</div>
                      <div className="text-[10px] text-amber-400/90 font-mono font-semibold">
                        {r.inviterCode}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-200">{r.invitedUserName}</div>
                      <div className="text-[10px] text-slate-500">{r.invitedUserEmail}</div>
                    </td>
                    <td className="py-3 px-3">
                      {r.status === 'qualified' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          {isAr ? 'تم اعتماد وصرف المكافأة' : 'Qualified & Paid'}
                        </span>
                      ) : r.status === 'eligible' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded-full animate-pulse">
                          <Sparkles className="w-3 h-3 text-cyan-400" />
                          {isAr ? 'مؤهل (بانتظار الاعتماد اليدوي)' : 'Eligible (Pending Manual Credit)'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3" />
                          {isAr ? 'مسجل (بانتظار الإيداع)' : 'Registered'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-300">
                      {r.depositAmount ? `$${r.depositAmount.toLocaleString()}` : '-'}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-amber-400">
                      {r.rewardAmount ? `+$${r.rewardAmount}` : '-'}
                    </td>
                    <td className="py-3 px-3 text-left rtl:text-left ltr:text-right">
                      {r.status !== 'qualified' && (
                        <button
                          onClick={() => handleQualifyManually(r.id)}
                          className={`text-[11px] font-bold px-3 py-1 rounded-lg transition-all cursor-pointer shadow-md ${
                            r.status === 'eligible'
                              ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20 font-black'
                              : 'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300'
                          }`}
                        >
                          {isAr ? 'إيداع المكافأة يدويًا' : 'Credit Bonus Manually'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
