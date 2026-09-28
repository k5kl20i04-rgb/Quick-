import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  User as UserIcon,
  Shield,
  Layers,
  Gift,
  Truck,
  Users,
  CreditCard,
  DollarSign,
  Clock,
  CheckCircle2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Code,
  ShieldAlert,
} from 'lucide-react';
import { AdminActivityLog, Language } from '../../types';

interface AdminActivityLogsViewProps {
  currentLang: Language;
}

export const AdminActivityLogsView: React.FC<AdminActivityLogsViewProps> = ({ currentLang }) => {
  const [logs, setLogs] = useState<AdminActivityLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/activity-logs');
      const data = await res.json();
      if (data.success && Array.isArray(data.logs)) {
        setLogs(data.logs);
      } else {
        setError(data.error || 'Failed to fetch admin activity logs');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionBadge = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('profit') || act.includes('distribute')) {
      return {
        label: currentLang === 'ar' ? 'توزيع أرباح' : 'Distributed Profit',
        bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        icon: Layers,
      };
    }
    if (act.includes('gift') || act.includes('bonus')) {
      return {
        label: currentLang === 'ar' ? 'صرف هدية / مكافأة' : 'Sent Gift',
        bg: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
        icon: Gift,
      };
    }
    if (act.includes('fleet') || act.includes('plan') || act.includes('project')) {
      return {
        label: currentLang === 'ar' ? 'خطة أسطول' : 'Added/Updated Fleet Plan',
        bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        icon: Truck,
      };
    }
    if (act.includes('user status') || act.includes('status')) {
      return {
        label: currentLang === 'ar' ? 'تعديل حالة حساب' : 'Updated User Status',
        bg: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
        icon: Users,
      };
    }
    if (act.includes('deposit') || act.includes('manual credit')) {
      return {
        label: currentLang === 'ar' ? 'شحن / إيداع' : 'Deposit / Credit',
        bg: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
        icon: DollarSign,
      };
    }
    if (act.includes('withdrawal')) {
      return {
        label: currentLang === 'ar' ? 'معالجة سحب' : 'Processed Withdrawal',
        bg: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
        icon: CreditCard,
      };
    }
    if (act.includes('kyc')) {
      return {
        label: currentLang === 'ar' ? 'مراجعة توثيق' : 'Reviewed KYC',
        bg: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
        icon: Shield,
      };
    }

    return {
      label: action,
      bg: 'bg-slate-800 text-slate-300 border-slate-700',
      icon: FileText,
    };
  };

  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== 'all') {
      const act = log.action.toLowerCase();
      if (actionFilter === 'profit' && !act.includes('profit') && !act.includes('distribute')) return false;
      if (actionFilter === 'gift' && !act.includes('gift') && !act.includes('bonus')) return false;
      if (actionFilter === 'fleet' && !act.includes('fleet') && !act.includes('plan')) return false;
      if (actionFilter === 'status' && !act.includes('status')) return false;
      if (actionFilter === 'finance' && !act.includes('deposit') && !act.includes('credit') && !act.includes('withdrawal')) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchAction = log.action.toLowerCase().includes(q);
      const matchAdmin = (log.admin_id || '').toLowerCase().includes(q) || (log.admin_email || '').toLowerCase().includes(q);
      const matchTarget = (log.target_user_id || '').toLowerCase().includes(q) || (log.target_user_name || '').toLowerCase().includes(q);
      const matchDetails = JSON.stringify(log.details || {}).toLowerCase().includes(q);
      if (!matchAction && !matchAdmin && !matchTarget && !matchDetails) return false;
    }

    return true;
  });

  const renderDetailsSummary = (details: Record<string, any>) => {
    if (!details || Object.keys(details).length === 0) {
      return <span className="text-slate-500 text-xs">-</span>;
    }

    const items: React.ReactNode[] = [];

    if (details.planTitle || details.planName) {
      items.push(
        <span key="plan" className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded border border-amber-500/20 text-[11px] font-bold">
          📌 {details.planTitle || details.planName}
        </span>
      );
    }

    if (typeof details.amount === 'number' || typeof details.totalDistributed === 'number' || typeof details.value === 'number') {
      const val = details.amount ?? details.totalDistributed ?? details.value;
      items.push(
        <span key="amt" className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 text-[11px] font-mono font-bold">
          💰 ${val.toLocaleString()} USDT
        </span>
      );
    }

    if (details.recipientsCount) {
      items.push(
        <span key="recipients" className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded border border-blue-500/20 text-[11px] font-bold">
          👥 {details.recipientsCount} مستثمر
        </span>
      );
    }

    if (details.accountStatus) {
      items.push(
        <span key="st" className="inline-flex items-center gap-1 bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded border border-purple-500/20 text-[11px] font-bold">
          ⚡ حالة: {details.accountStatus}
        </span>
      );
    }

    if (details.reason || details.note) {
      items.push(
        <span key="note" className="text-slate-300 text-xs italic block mt-1">
          &quot;{details.reason || details.note}&quot;
        </span>
      );
    }

    return (
      <div className="space-y-1">
        <div className="flex flex-wrap gap-1.5">{items}</div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
              <FileText className="w-4 h-4" />
              <span>{currentLang === 'ar' ? 'سجل الرقابة التدقيقي (Admin Audit Trail)' : 'Admin Activity Ledger'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {currentLang === 'ar' ? 'سجل نشاطات وعمليات الإدارة' : 'Administrative Activity Logs'}
            </h2>
            <p className="text-xs text-slate-400">
              {currentLang === 'ar'
                ? 'توثيق شامل وتلقائي لجميع الإجراءات والتغييرات الإدارية الحساسة المنجزة بواسطة أدمن المنشأة'
                : 'Comprehensive automated audit trail capturing every administrator function execution.'}
            </p>
          </div>

          <button
            type="button"
            onClick={fetchLogs}
            disabled={loading}
            className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-2 transition-all cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <RefreshCw className={`w-4 h-4 text-amber-400 ${loading ? 'animate-spin' : ''}`} />
            <span>{currentLang === 'ar' ? 'تحديث السجل' : 'Refresh Logs'}</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 rtl:right-3 ltr:left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              currentLang === 'ar'
                ? 'بحث بالإجراء، اسم المستثمر، أو التفاصيل...'
                : 'Search by action, user, details...'
            }
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-9 rtl:pr-9 ltr:pl-9 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <Filter className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs text-slate-400 shrink-0 font-bold">
            {currentLang === 'ar' ? 'تصفية الإجراء:' : 'Filter:'}
          </span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">{currentLang === 'ar' ? 'جميع الإجراءات' : 'All Actions'}</option>
            <option value="profit">{currentLang === 'ar' ? 'توزيع الأرباح (Profits)' : 'Profit Distributions'}</option>
            <option value="gift">{currentLang === 'ar' ? 'الهدايا والمكافآت (Gifts)' : 'Gifts & Bonuses'}</option>
            <option value="fleet">{currentLang === 'ar' ? 'خطط الأسطول (Fleet Plans)' : 'Fleet Plans'}</option>
            <option value="status">{currentLang === 'ar' ? 'تعديل الحسابات (Status)' : 'User Status'}</option>
            <option value="finance">{currentLang === 'ar' ? 'الإيداع والسحب (Finance)' : 'Financial Operations'}</option>
          </select>
        </div>
      </div>

      {/* Logs Table / Audit Trail List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-bold">جاري تحميل سجل النشاطات والعمليات...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-400 text-xs font-bold space-y-2">
            <ShieldAlert className="w-8 h-8 text-rose-400 mx-auto" />
            <p>{error}</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <FileText className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-bold">
              {currentLang === 'ar' ? 'لا توجد سجلات مطابقة للشروط' : 'No activity logs found'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right rtl:text-right ltr:text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4">الوقت والتاريخ</th>
                  <th className="p-4">الإجراء والعملية</th>
                  <th className="p-4">مدير النظام (Admin)</th>
                  <th className="p-4">المستثمر / العميل المستهدف</th>
                  <th className="p-4">تفاصيل العملية (Details)</th>
                  <th className="p-4 text-center">عرض JSON</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLogs.map((log) => {
                  const badge = getActionBadge(log.action);
                  const Icon = badge.icon;
                  const isExpanded = expandedLogId === log.id;

                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-slate-800/40 transition-colors">
                        {/* Timestamp */}
                        <td className="p-4 font-mono text-slate-300 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
                            <span>
                              {log.created_at
                                ? new Date(log.created_at).toLocaleString('en-US', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                    hour12: true,
                                  })
                                : 'الآن'}
                            </span>
                          </div>
                        </td>

                        {/* Action Badge */}
                        <td className="p-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border ${badge.bg}`}>
                            <Icon className="w-3.5 h-3.5 shrink-0" />
                            <span>{badge.label}</span>
                          </span>
                        </td>

                        {/* Admin ID */}
                        <td className="p-4 font-mono text-slate-300">
                          <div className="space-y-0.5">
                            <span className="font-bold text-amber-400 block text-[11px]">
                              {log.admin_email || 'goog7029766@gmail.com'}
                            </span>
                            <span className="text-[10px] text-slate-500 block">ID: {log.admin_id}</span>
                          </div>
                        </td>

                        {/* Target User */}
                        <td className="p-4">
                          {log.target_user_name || log.target_user_id ? (
                            <div className="space-y-0.5">
                              <span className="font-bold text-slate-200 block">
                                {log.target_user_name || 'مستثمر'}
                              </span>
                              {log.target_user_id && (
                                <span className="text-[10px] font-mono text-slate-500 block">
                                  ID: {log.target_user_id}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500 italic text-[11px]">عام / جميع النظام</span>
                          )}
                        </td>

                        {/* Formatted Details */}
                        <td className="p-4 max-w-xs">{renderDetailsSummary(log.details)}</td>

                        {/* Expand Details JSON Button */}
                        <td className="p-4 text-center">
                          <button
                            type="button"
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono flex items-center gap-1 mx-auto cursor-pointer"
                          >
                            <Code className="w-3.5 h-3.5 text-amber-400" />
                            <span>{isExpanded ? 'إخفاء' : 'JSON'}</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable JSONB Details Drawer */}
                      {isExpanded && (
                        <tr className="bg-slate-950/90 border-b border-slate-800">
                          <td colSpan={6} className="p-4">
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 font-mono text-[11px] text-emerald-400 overflow-x-auto space-y-1">
                              <div className="text-slate-400 font-bold border-b border-slate-800 pb-1 mb-2 flex items-center gap-2">
                                <Code className="w-4 h-4 text-amber-400" />
                                <span>البيانات الكاملة بترميز JSONB (admin_activity_logs.details)</span>
                              </div>
                              <pre className="whitespace-pre-wrap leading-relaxed">
                                {JSON.stringify(
                                  {
                                    id: log.id,
                                    admin_id: log.admin_id,
                                    target_user_id: log.target_user_id,
                                    action: log.action,
                                    details: log.details,
                                    created_at: log.created_at,
                                  },
                                  null,
                                  2
                                )}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
