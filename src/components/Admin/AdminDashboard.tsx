import React, { useState } from 'react';
import {
  Truck,
  Users,
  Plus,
  Edit,
  Trash2,
  Pause,
  Play,
  CheckCircle2,
  XCircle,
  MessageSquare,
  ShieldCheck,
  CreditCard,
  Settings,
  DollarSign,
  Send,
  Eye,
  RotateCcw,
  AlertCircle,
  FileText,
  Lock,
  Unlock,
  Headset,
  KeyRound,
  UserPlus,
  User as UserIcon,
  Phone,
  Mail,
  Clock,
  Sparkles,
  TrendingUp,
  Copy,
  Check,
  Search,
  Filter,
  Wallet,
  Upload,
  Image as ImageIcon,
  X,
  BarChart3,
  ShieldAlert,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertTriangle,
  Newspaper,
  Gift,
  Layers,
} from 'lucide-react';
import {
  Project,
  Investment,
  Language,
  User,
  DepositRequest,
  KYCSubmission,
  WithdrawalRequest,
  AdminSettings,
  VehicleCategory,
  ProjectStatus,
  SupportTicket,
} from '../../types';
import { translations } from '../../i18n/translations';

import { InvestorManagement } from './InvestorManagement';
import { DepositManagement } from './DepositManagement';
import { PasswordResetManagement } from './PasswordResetManagement';
import { PlanProfitDistributionModal } from './PlanProfitDistributionModal';
import { BonusGiftModal } from './BonusGiftModal';
import { NewsManagement } from './NewsManagement';
import { ReferralManagement } from './ReferralManagement';
import { LogTripModal } from './LogTripModal';
import { AdminActivityLogsView } from './AdminActivityLogsView';
import { uploadFleetImageToSupabase } from '../../lib/supabaseClient';
import { OnlineMembersWidget } from '../OnlineMembersWidget';

interface AdminDashboardProps {
  currentLang: Language;
  user: User;
  projects: Project[];
  investments?: Investment[];
  deposits: DepositRequest[];
  kyc: KYCSubmission;
  withdrawals: WithdrawalRequest[];
  adminSettings: AdminSettings;
  supportTickets?: SupportTicket[];
  onSaveProject: (project: Partial<Project>) => Promise<void>;
  onToggleProjectStatus: (id: string, status: ProjectStatus) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  onReviewDeposit: (id: string, status: 'approved' | 'rejected' | 'unlocked', note?: string) => Promise<void>;
  onSendAdminChatMessage: (depositId: string, text: string) => Promise<void>;
  onReviewKYC: (status: 'approved' | 'rejected', reason?: string) => Promise<void>;
  onApproveWithdrawal: (id: string) => Promise<void>;
  onAcceptWithdrawalConnection?: (id: string) => Promise<void>;
  onReviewWithdrawal?: (id: string, status: 'approved' | 'rejected' | 'completed', note?: string, txHash?: string) => Promise<void>;
  onSendAdminWithdrawalChat?: (withdrawalId: string, text: string) => Promise<void>;
  onSendAdminSupportMessage?: (ticketId: string, text: string) => Promise<void>;
  onCloseSupportTicket?: (ticketId: string) => Promise<void>;
  onAcceptSupportConnection?: (ticketId: string) => Promise<void>;
  onSaveSettings: (settings: Partial<AdminSettings>) => Promise<void>;
  onResetDemoData: () => Promise<void>;
  onRefreshState?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentLang,
  user,
  projects,
  investments = [],
  deposits,
  kyc,
  withdrawals,
  adminSettings,
  supportTickets = [],
  onSaveProject,
  onToggleProjectStatus,
  onDeleteProject,
  onReviewDeposit,
  onSendAdminChatMessage,
  onReviewKYC,
  onApproveWithdrawal,
  onAcceptWithdrawalConnection,
  onReviewWithdrawal,
  onSendAdminWithdrawalChat,
  onSendAdminSupportMessage,
  onCloseSupportTicket,
  onAcceptSupportConnection,
  onSaveSettings,
  onResetDemoData,
  onRefreshState,
}) => {
  const t = translations[currentLang];

  const [activeTab, setActiveTab] = useState<'investors' | 'projects' | 'deposits' | 'kyc' | 'withdrawals' | 'support' | 'password_resets' | 'news' | 'referrals' | 'activity_logs' | 'settings'>(() => {
    const saved = sessionStorage.getItem('aseel_admin_tab');
    if (saved && ['investors', 'projects', 'deposits', 'kyc', 'withdrawals', 'support', 'password_resets', 'news', 'referrals', 'activity_logs', 'settings'].includes(saved)) {
      return saved as any;
    }
    const searchParams = new URLSearchParams(window.location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam && ['investors', 'projects', 'deposits', 'kyc', 'withdrawals', 'support', 'password_resets', 'news', 'referrals', 'activity_logs', 'settings'].includes(tabParam)) {
      return tabParam as any;
    }
    return 'investors';
  });

  const [showPlanProfitModal, setShowPlanProfitModal] = useState(false);
  const [showBonusGiftModal, setShowBonusGiftModal] = useState(false);
  const [usersList, setUsersList] = useState<User[]>([]);

  React.useEffect(() => {
    fetch('/api/admin/profiles')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setUsersList(data);
        } else if (data && Array.isArray(data.profiles)) {
          setUsersList(data.profiles);
        }
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    sessionStorage.setItem('aseel_admin_tab', activeTab);
  }, [activeTab]);

  // Support Tab State
  const supportTicketsList = supportTickets || [];
  const [selectedSupportTicketId, setSelectedSupportTicketId] = useState<string | null>(() => {
    return sessionStorage.getItem('aseel_admin_selected_support_id') || supportTicketsList[0]?.id || null;
  });

  React.useEffect(() => {
    if (selectedSupportTicketId) {
      sessionStorage.setItem('aseel_admin_selected_support_id', selectedSupportTicketId);
    }
  }, [selectedSupportTicketId]);
  const [adminSupportReplyText, setAdminSupportReplyText] = useState<string>('');
  const [supportFilter, setSupportFilter] = useState<'all' | 'open' | 'closed'>('all');

  const filteredSupportTickets = supportTicketsList.filter((ticket) => {
    if (supportFilter === 'open') return ticket.status === 'open';
    if (supportFilter === 'closed') return ticket.status === 'closed';
    return true;
  });

  const activeSupportTicket =
    supportTicketsList.find((t) => t.id === selectedSupportTicketId) ||
    filteredSupportTickets[0] ||
    supportTicketsList[0] ||
    null;

  const handleSendSupportReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSupportTicket || !adminSupportReplyText.trim()) return;
    if (onSendAdminSupportMessage) {
      await onSendAdminSupportMessage(activeSupportTicket.id, adminSupportReplyText.trim());
    }
    setAdminSupportReplyText('');
  };

  // Subscribers Modal State
  const [selectedSubscribersProject, setSelectedSubscribersProject] = useState<Project | null>(null);
  const [subscriberSearchQuery, setSubscriberSearchQuery] = useState<string>('');

  // Trip Logging Modal State
  const [selectedProjectForTrip, setSelectedProjectForTrip] = useState<Project | null>(null);

  // Projects Modal/Form State
  const [showProjectModal, setShowProjectModal] = useState<boolean>(false);
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);

  const [projTitleAr, setProjTitleAr] = useState<string>('');
  const [projTitleEn, setProjTitleEn] = useState<string>('');
  const [projCategory, setProjCategory] = useState<VehicleCategory>('cargo_freight');
  const [projTarget, setProjTarget] = useState<number>(200000);
  const [projRoi, setProjRoi] = useState<number>(4.5);
  const [projMinInvest, setProjMinInvest] = useState<number>(100);
  const [projLockupMonths, setProjLockupMonths] = useState<number>(5);
  const [projRouteAr, setProjRouteAr] = useState<string>('بغداد ⇄ أربيل ⇄ البصرة');
  const [projSpecs, setProjSpecs] = useState<string>('شاحنة Scania R500 - حمولة 40 طن');
  const [projVehicles, setProjVehicles] = useState<number>(10);
  const [projDescriptionAr, setProjDescriptionAr] = useState<string>('');
  const [projExpectedProfit, setProjExpectedProfit] = useState<string>('');
  const [projImage, setProjImage] = useState<string>('https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=80');

  const FLEET_PRESET_IMAGES = [
    {
      name: 'شاحنة نقل ثقيل (Scania Cargo)',
      url: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=80',
    },
    {
      name: 'مقطورة حاويات (Container Hauler)',
      url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
    },
    {
      name: 'شاحنة مبردة ونقل أغذية (Refrigerated)',
      url: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=1200&q=80',
    },
    {
      name: 'حافلة مسافرين VIP (Passenger Bus)',
      url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
    },
    {
      name: 'أسطول النقل اللوجستي (Express Fleet)',
      url: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1200&q=80',
    },
    {
      name: 'ناقلة بضائع سريعة (Highway Hauler)',
      url: 'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=1200&q=80',
    },
  ];

  // Chat/Deposit State
  const [selectedDepositId, setSelectedDepositId] = useState<string | null>(deposits[0]?.id || null);
  const [adminReplyText, setAdminReplyText] = useState<string>('');

  // Withdrawal Chat & Verification State
  const [selectedWithdrawalId, setSelectedWithdrawalId] = useState<string | null>(withdrawals[0]?.id || null);
  const [adminWdReplyText, setAdminWdReplyText] = useState<string>('');
  const [adminWdTxHash, setAdminWdTxHash] = useState<string>('');
  const [wdSearchQuery, setWdSearchQuery] = useState<string>('');
  const [wdStatusFilter, setWdStatusFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');

  // Admin Credentials & Role Access State
  const [adminEmail, setAdminEmail] = useState(user?.email || 'admin@aseel.com');
  const [adminName, setAdminName] = useState(user?.name || 'مدير النظام - أسطول أصيل');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminCredsLoading, setAdminCredsLoading] = useState(false);
  const [adminCredsMsg, setAdminCredsMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleUpdateAdminCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminCredsLoading(true);
    setAdminCredsMsg(null);
    try {
      const res = await fetch('/api/admin/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminEmail,
          name: adminName,
          password: adminPassword || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminCredsMsg({
          type: 'success',
          text: data.message || 'تم تحديث واعتماد بيانات حساب مدير النظام في قاعدة البيانات بنجاح!',
        });
        setAdminPassword('');
      } else {
        setAdminCredsMsg({
          type: 'error',
          text: data.error || 'حدث خطأ أثناء تحديث بيانات مدير النظام',
        });
      }
    } catch (err: any) {
      setAdminCredsMsg({
        type: 'error',
        text: err.message || 'تعذر الاتصال بالخادم لتحديث البيانات',
      });
    } finally {
      setAdminCredsLoading(false);
    }
  };

  // Hire / Add New Admin Employee State
  const [hireAdminEmail, setHireAdminEmail] = useState('');
  const [hireAdminName, setHireAdminName] = useState('');
  const [hireAdminPassword, setHireAdminPassword] = useState('');
  const [hireAdminLoading, setHireAdminLoading] = useState(false);
  const [hireAdminMsg, setHireAdminMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleHireNewAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hireAdminEmail.trim() || !hireAdminPassword.trim()) {
      setHireAdminMsg({
        type: 'error',
        text: currentLang === 'ar' ? 'الرجاء إدخال البريد الإلكتروني وكلمة المرور الابتدائية للمدير الجديد' : 'Email and initial password are required.',
      });
      return;
    }
    setHireAdminLoading(true);
    setHireAdminMsg(null);
    try {
      const res = await fetch('/api/admin/create-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: hireAdminEmail.trim(),
          name: hireAdminName.trim() || undefined,
          password: hireAdminPassword.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setHireAdminMsg({
          type: 'success',
          text: data.message || (currentLang === 'ar' ? 'تم إنشاء حساب مدير النظام الجديد وتعيين كلمة المرور بنجاح!' : 'New admin created successfully!'),
        });
        setHireAdminEmail('');
        setHireAdminName('');
        setHireAdminPassword('');
        if (onRefreshState) onRefreshState();
      } else {
        setHireAdminMsg({
          type: 'error',
          text: data.error || (currentLang === 'ar' ? 'حدث خطأ أثناء إنشاء الحساب' : 'Failed to create admin'),
        });
      }
    } catch (err: any) {
      setHireAdminMsg({
        type: 'error',
        text: err.message || (currentLang === 'ar' ? 'تعذر الاتصال بالخادم لإنشاء الحساب' : 'Network error'),
      });
    } finally {
      setHireAdminLoading(false);
    }
  };
  const [copiedWdMap, setCopiedWdMap] = useState<Record<string, boolean>>({});

  // Settings Form State
  const [trc20Input, setTrc20Input] = useState<string>(adminSettings.trc20Address || '');
  const [bep20Input, setBep20Input] = useState<string>(adminSettings.bep20Address || '');
  const [announcementAr, setAnnouncementAr] = useState<string>(adminSettings.announcementMessage?.ar || '');
  const [pauseDeposits, setPauseDeposits] = useState<boolean>(Boolean(adminSettings.pauseDeposits));
  const [pauseWithdrawals, setPauseWithdrawals] = useState<boolean>(Boolean(adminSettings.pauseWithdrawals));
  const [registrationEnabled, setRegistrationEnabled] = useState<boolean>(
    adminSettings.registrationEnabled !== undefined ? Boolean(adminSettings.registrationEnabled) : true
  );

  React.useEffect(() => {
    if (adminSettings) {
      setTrc20Input(adminSettings.trc20Address || '');
      setBep20Input(adminSettings.bep20Address || '');
      setAnnouncementAr(adminSettings.announcementMessage?.ar || '');
      setPauseDeposits(Boolean(adminSettings.pauseDeposits));
      setPauseWithdrawals(Boolean(adminSettings.pauseWithdrawals));
      setRegistrationEnabled(
        adminSettings.registrationEnabled !== undefined ? Boolean(adminSettings.registrationEnabled) : true
      );
    }
  }, [adminSettings]);

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('حجم الصورة كبير جداً (الأقصى 5 ميغابايت)');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setProjImage(uploadEvent.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredWithdrawals = withdrawals.filter((w) => {
    if (wdStatusFilter !== 'all' && w.status !== wdStatusFilter) return false;
    if (wdSearchQuery.trim()) {
      const q = wdSearchQuery.toLowerCase().trim();
      const matchName = w.userName?.toLowerCase().includes(q);
      const matchEmail = w.userEmail?.toLowerCase().includes(q);
      const matchDetails = w.payoutDetails?.toLowerCase().includes(q) || w.destinationWallet?.toLowerCase().includes(q);
      const matchId = w.id.toLowerCase().includes(q);
      const matchAmount = w.amount.toString().includes(q);
      if (!matchName && !matchEmail && !matchDetails && !matchId && !matchAmount) return false;
    }
    return true;
  });

  const activeWdObj =
    withdrawals.find((w) => w.id === selectedWithdrawalId) ||
    filteredWithdrawals[0] ||
    withdrawals[0] ||
    null;

  const handleCopyWdAddress = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedWdMap((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopiedWdMap((prev) => ({ ...prev, [id]: false }));
    }, 2000);
  };

  const handleAdminSendWdChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWdObj || !adminWdReplyText.trim()) return;
    if (onSendAdminWithdrawalChat) {
      await onSendAdminWithdrawalChat(activeWdObj.id, adminWdReplyText);
    } else {
      await onSendAdminChatMessage(activeWdObj.id, adminWdReplyText);
    }
    setAdminWdReplyText('');
  };

  const handleOpenNewProject = () => {
    setEditingProject(null);
    setProjTitleAr('');
    setProjTitleEn('');
    setProjCategory('cargo_freight');
    setProjTarget(200000);
    setProjRoi(4.5);
    setProjMinInvest(100);
    setProjLockupMonths(5);
    setProjRouteAr('بغداد ⇄ أربيل ⇄ البصرة');
    setProjSpecs('شاحنة Scania R500 - حمولة 40 طن');
    setProjVehicles(10);
    setProjDescriptionAr('مشروع استثماري لتشغيل أسطول شاحنات النقل الثقيل ونقل البضائع والسلع التجارية عبر الخطوط اللوجستية الرئيسية.');
    setProjExpectedProfit('$30 إلى $45 لكل $1,000 استثمار (بناءً على 12 إلى 18 رحلة شحن)');
    setProjImage('https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=80');
    setShowProjectModal(true);
  };

  const handleOpenEditProject = (proj: Project) => {
    setEditingProject(proj);
    setProjTitleAr(proj.title.ar);
    setProjTitleEn(proj.title.en);
    setProjCategory(proj.category);
    setProjTarget(proj.targetAmount);
    setProjRoi(proj.monthlyRoiPercent);
    setProjMinInvest(proj.minInvestment || 100);
    setProjLockupMonths(proj.lockupMonths || 5);
    setProjRouteAr(proj.route.ar);
    setProjSpecs(proj.capacitySpecs);
    setProjVehicles(proj.totalVehicles);
    setProjDescriptionAr(proj.description?.ar || '');
    const expProf = typeof proj.expectedProfit === 'string'
      ? proj.expectedProfit
      : proj.expectedProfit?.ar || proj.expectedProfitRange || '';
    setProjExpectedProfit(expProf);
    setProjImage(proj.imageUrl);
    setShowProjectModal(true);
  };

  const handleSaveProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveProject({
      id: editingProject?.id,
      title: { ar: projTitleAr, en: projTitleEn || projTitleAr, ckb: projTitleAr },
      description: { ar: projDescriptionAr || projTitleAr, en: projTitleEn || projTitleAr, ckb: projDescriptionAr || projTitleAr },
      category: projCategory,
      targetAmount: Number(projTarget),
      monthlyRoiPercent: Number(projRoi),
      minInvestment: Number(projMinInvest),
      lockupMonths: Number(projLockupMonths),
      route: { ar: projRouteAr, en: projRouteAr, ckb: projRouteAr },
      capacitySpecs: projSpecs,
      totalVehicles: Number(projVehicles),
      expectedProfit: { ar: projExpectedProfit, en: projExpectedProfit, ckb: projExpectedProfit },
      expectedProfitRange: projExpectedProfit,
      imageUrl: projImage,
      status: editingProject?.status || 'active',
    });
    setShowProjectModal(false);
  };

  const activeDepositObj = deposits.find((d) => d.id === selectedDepositId) || deposits[0];

  const handleAdminSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDepositObj || !adminReplyText.trim()) return;
    await onSendAdminChatMessage(activeDepositObj.id, adminReplyText);
    setAdminReplyText('');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Admin Dashboard Banner */}
      <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 rtl:space-x-reverse px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-black mb-2 shadow-md">
              <ShieldCheck className="w-4 h-4" />
              <span>System Administrator Control Desk</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">{t.adminTitle}</h1>
            <p className="text-xs text-slate-400 mt-1">{t.adminSubtitle}</p>
          </div>

          {/* Quick Action Feature Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Online Members Counter Widget (Admin Only) */}
            <OnlineMembersWidget currentLang={currentLang} />

            <button
              type="button"
              onClick={() => setShowPlanProfitModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center space-x-2 rtl:space-x-reverse cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>{currentLang === 'ar' ? 'توزيع أرباح الخطة المحددة' : 'Distribute Plan Profits'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowBonusGiftModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-lg shadow-purple-500/25 transition-all flex items-center space-x-2 rtl:space-x-reverse cursor-pointer"
            >
              <Gift className="w-4 h-4" />
              <span>{currentLang === 'ar' ? 'صرف الهدايا والمكافآت' : 'Send Cash Bonus / Gift'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs - Fully Responsive & Overflow-Safe */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none w-full">
        {/* TAB 0: Investors */}
        <button
          type="button"
          onClick={() => setActiveTab('investors')}
          className={`px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === 'investors'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Users className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{currentLang === 'ar' ? 'سجل المستثمرين والعملاء' : currentLang === 'ckb' ? 'تۆماری وەبەرهێنەران' : 'Investors Directory'}</span>
        </button>

        {/* TAB 1: Projects */}
        <button
          type="button"
          onClick={() => setActiveTab('projects')}
          className={`px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === 'projects'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Truck className="w-4 h-4 shrink-0" />
          <span>{currentLang === 'ar' ? 'إدارة أصول الأسطول' : currentLang === 'ckb' ? 'بەڕێوەبردنی کەشتیگەل' : t.tabProjectsMgmt}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
            activeTab === 'projects' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-300'
          }`}>
            {projects.length}
          </span>
        </button>

        {/* TAB 2: Deposits */}
        <button
          type="button"
          onClick={() => setActiveTab('deposits')}
          className={`px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === 'deposits'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{currentLang === 'ar' ? 'طلبات الإيداع والتحويل' : currentLang === 'ckb' ? 'داواکارییەکانی دانان و گواستنەوە' : 'Deposits & P2P'}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
            activeTab === 'deposits'
              ? 'bg-slate-950/20 text-slate-950'
              : deposits.some(d => d.status === 'pending' || d.status === 'pending_approval' || d.status === 'submitted')
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
              : 'bg-slate-800 text-slate-300'
          }`}>
            {deposits.length}
          </span>
        </button>

        {/* TAB 3: KYC */}
        <button
          type="button"
          onClick={() => setActiveTab('kyc')}
          className={`px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === 'kyc'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{currentLang === 'ar' ? 'مراجعة طلبات التوثيق' : currentLang === 'ckb' ? 'پشتڕاستکردنەوەی هەژمار' : 'KYC Verification'}</span>
          {kyc && kyc.status === 'pending' && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          )}
        </button>

        {/* TAB 4: Withdrawals */}
        <button
          type="button"
          onClick={() => setActiveTab('withdrawals')}
          className={`px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === 'withdrawals'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Lock className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{currentLang === 'ar' ? 'طلبات السحب' : currentLang === 'ckb' ? 'داواکارییەکانی ڕاکێشان' : 'Withdrawals'}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
            activeTab === 'withdrawals' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-300'
          }`}>
            {withdrawals.length}
          </span>
        </button>

        {/* TAB 6: News & Announcements */}
        <button
          type="button"
          onClick={() => setActiveTab('news')}
          className={`px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === 'news'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Newspaper className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{currentLang === 'ar' ? 'المركز الإخباري والإعلانات' : 'News Publishing'}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('support')}
          className={`px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === 'support'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Headset className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{currentLang === 'ar' ? 'إدارة الدعم الفني' : currentLang === 'ckb' ? 'پشتیوانی تەکنیکی' : 'Support Tickets'}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
            activeTab === 'support' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-300'
          }`}>
            {supportTicketsList.filter(t => t.status === 'open' || t.status === 'pending_approval').length}
          </span>
        </button>

        {/* TAB 6: Password Reset Requests */}
        <button
          type="button"
          onClick={() => setActiveTab('password_resets')}
          className={`px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === 'password_resets'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{currentLang === 'ar' ? 'طلبات إعادة تعيين كلمة المرور' : currentLang === 'ckb' ? 'داواکارییەکانی وشەی نهێنی' : 'Password Reset Requests'}</span>
        </button>

        {/* TAB 7: Referral Management */}
        <button
          type="button"
          onClick={() => setActiveTab('referrals')}
          className={`px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === 'referrals'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Gift className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{currentLang === 'ar' ? 'برنامج الإحالات والمكافآت' : currentLang === 'ckb' ? 'پڕۆگرامی ڕاسپاردنەکان' : 'Referral Engine'}</span>
        </button>

        {/* TAB 8: Activity Logs / Audit Trail */}
        <button
          type="button"
          onClick={() => setActiveTab('activity_logs')}
          className={`px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === 'activity_logs'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <FileText className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{currentLang === 'ar' ? 'سجل الرقابة والنشاطات' : currentLang === 'ckb' ? 'تۆماری چالاکیەکان' : 'Activity Logs'}</span>
        </button>

        {/* TAB 9: Settings */}
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span>{currentLang === 'ar' ? 'إعدادات المنصة والمحافظ' : currentLang === 'ckb' ? 'ڕێکخستنەکان' : 'Settings'}</span>
        </button>
      </div>

      {/* TAB: Admin Activity Logs / Audit Trail */}
      {activeTab === 'activity_logs' && (
        <AdminActivityLogsView currentLang={currentLang} />
      )}

      {/* TAB: Password Reset Requests */}
      {activeTab === 'password_resets' && (
        <PasswordResetManagement currentLang={currentLang} />
      )}

      {/* TAB 0: Centralized Investors Management Overview */}
      {activeTab === 'investors' && (
        <InvestorManagement
          currentLang={currentLang}
          onReviewKYC={onReviewKYC}
          onRefreshState={onRefreshState || (() => {})}
        />
      )}

      {/* TAB 1: Projects & Fleet Assets Manager */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Truck className="w-6 h-6 text-amber-400" />
                <h2 className="text-xl font-black text-white">إدارة أصول الأسطول وخطط الاستثمار</h2>
              </div>
              <p className="text-xs text-slate-400">
                إدارة خطط الشاحنات وحافلات النقل، تعديل المواصفات والصور، ومتابعة قائمة المستثمرين والمشتركين لكل خطة.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenNewProject}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black text-xs shadow-xl shadow-amber-500/20 flex items-center justify-center space-x-2 rtl:space-x-reverse cursor-pointer hover:scale-[1.02] transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة أسطول / خطة جديدة</span>
            </button>
          </div>

          {/* Project Fleet Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {projects.map((proj) => {
              const projInvestments = (investments || []).filter((inv) => inv.projectId === proj.id);
              const uniqueSubscribersCount = new Set(projInvestments.map((inv) => inv.userId)).size;
              const totalInvestedSum = projInvestments.reduce((acc, inv) => acc + (inv.amount || 0), 0);
              const effectiveRaised = Math.max(proj.raisedAmount || 0, totalInvestedSum);
              const fundingPercentage = Math.min(100, Math.round((effectiveRaised / (proj.targetAmount || 1)) * 100));

              return (
                <div
                  key={proj.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col justify-between space-y-5 transition-all relative overflow-hidden group"
                >
                  {/* Top header badge & title */}
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="flex items-start space-x-4 rtl:space-x-reverse">
                      <div className="relative shrink-0">
                        <img
                          src={proj.imageUrl}
                          alt={proj.title.ar}
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-slate-700 shadow-md group-hover:scale-105 transition-all duration-300"
                        />
                        <span
                          className={`absolute -bottom-2 -right-1 px-2 py-0.5 rounded-full text-[9px] font-black border uppercase shadow-sm ${
                            proj.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                              : proj.status === 'fully_funded'
                              ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                              : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          }`}
                        >
                          {proj.status === 'active' ? 'نشط (Active)' : proj.status === 'fully_funded' ? 'مكتمـل' : 'موقوف'}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-400 font-extrabold">
                            {proj.category === 'cargo_freight' ? 'شحن ونقل بضائع' : 'نقل مسافرين'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {proj.totalVehicles} مركبة بالأسطول
                          </span>
                        </div>

                        <h3 className="text-base font-black text-white leading-tight">{proj.title.ar}</h3>
                        <p className="text-xs text-slate-400 line-clamp-1">{proj.route.ar}</p>
                        <p className="text-[11px] text-amber-300 font-mono">{proj.capacitySpecs}</p>
                      </div>
                    </div>
                  </div>

                  {/* Subscribed Investors & Investment Metrics Box */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5">
                        <span className="block text-[10px] font-semibold text-slate-400">عدد المشتركين</span>
                        <div className="flex items-center justify-center gap-1.5 mt-0.5">
                          <Users className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-sm font-black text-white">{uniqueSubscribersCount}</span>
                          <span className="text-[10px] text-slate-500">({projInvestments.length} عقد)</span>
                        </div>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5">
                        <span className="block text-[10px] font-semibold text-slate-400">إجمالي المبلغ المجمع</span>
                        <div className="flex items-center justify-center gap-1 mt-0.5">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-sm font-black text-emerald-400 font-mono">${effectiveRaised.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="col-span-2 sm:col-span-1 bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 flex flex-col justify-center">
                        <span className="block text-[10px] font-bold text-amber-400 uppercase">الأرباح المتوقعة (رحلات الشحن)</span>
                        <span className="text-xs font-black text-white mt-0.5 truncate block">
                          {typeof proj.expectedProfit === 'string'
                            ? proj.expectedProfit
                            : proj.expectedProfit?.[currentLang] || proj.expectedProfit?.ar || proj.expectedProfitRange || 'أرباح تقديرية حسب الرحلات'}
                        </span>
                      </div>
                    </div>

                    {/* Funding Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-slate-400">نسبة التمويل المجمع:</span>
                        <span className="text-amber-400 font-bold">{fundingPercentage}% (${effectiveRaised.toLocaleString()} / ${proj.targetAmount.toLocaleString()} USDT)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-500"
                          style={{ width: `${fundingPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-3 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Log New Freight Trip Button */}
                      <button
                        type="button"
                        onClick={() => setSelectedProjectForTrip(proj)}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-md shadow-blue-600/20"
                        title="تسجيل رحلة نقل شحن حية"
                      >
                        <Truck className="w-4 h-4 text-amber-300" />
                        <span>تسجيل رحلة نقل 🚚</span>
                      </button>

                      {/* Subscribers List Button */}
                      <button
                        type="button"
                        onClick={() => setSelectedSubscribersProject(proj)}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-slate-700 font-bold flex items-center gap-2 cursor-pointer transition-all"
                      >
                        <Users className="w-4 h-4 text-amber-400" />
                        <span>قائمة المشتركين</span>
                        <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold">
                          {uniqueSubscribersCount}
                        </span>
                      </button>
                    </div>

                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      {/* View/Edit Plan Details */}
                      <button
                        type="button"
                        onClick={() => handleOpenEditProject(proj)}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                        title="عرض وتعديل التفاصيل والصورة"
                      >
                        <Edit className="w-3.5 h-3.5 text-slate-300" />
                        <span>تعديل التفاصيل والصورة</span>
                      </button>

                      {/* Status Toggle */}
                      <button
                        type="button"
                        onClick={() =>
                          onToggleProjectStatus(
                            proj.id,
                            proj.status === 'active' ? 'paused' : 'active'
                          )
                        }
                        className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          proj.status === 'active'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                        }`}
                        title={proj.status === 'active' ? 'إيقاف الخطة مؤقتاً' : 'تفعيل الخطة'}
                      >
                        {proj.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => onDeleteProject(proj.id)}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 cursor-pointer transition-all"
                        title="حذف الخطة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Deposits & P2P Live Chat Desk */}
      {activeTab === 'deposits' && (
        <DepositManagement
          currentLang={currentLang}
          deposits={deposits}
          onReviewDeposit={onReviewDeposit}
          onSendAdminChatMessage={onSendAdminChatMessage}
          onRefreshState={onRefreshState}
        />
      )}

      {/* TAB 3: KYC & ID Verification Approvals */}
      {activeTab === 'kyc' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-black text-white">{t.tabKycMgmt} - قسم تدقيق مستندات هوية الحسابات</h2>
              </div>
              <p className="text-xs text-slate-400">
                مراجعة وتدقيق المستندات الرسمية المرفوقة (الهوية الوطنية، بطاقة السكن/الإقامة) قبل تفعيل حق الاستثمار والسحب.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-black border ${
                  kyc.status === 'approved'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : kyc.status === 'rejected'
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse'
                }`}
              >
                {kyc.status === 'approved' ? 'موثق ومقبول (Approved)' : kyc.status === 'rejected' ? 'مرفوض (Rejected)' : 'قيد التدقيق (Pending Review)'}
              </span>
              <button
                onClick={() => setActiveTab('investors')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition"
              >
                فتح السجل الكامل للمستثمر ←
              </button>
            </div>
          </div>

          {/* User Details Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800/80 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px]">اسم العميل / المستثمر</span>
              <span className="font-bold text-white text-sm">{kyc.userName || 'أحمد العبيدي'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">البريد الإلكتروني</span>
              <span className="font-mono text-slate-300">{kyc.userEmail || 'investor@aseel.iq'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">رقم الهوية الوطنية / الأحوال</span>
              <span className="font-mono font-bold text-amber-400">{kyc.idNumber || 'IQ-99823410'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">تاريخ تقديم التوثيق</span>
              <span className="font-mono text-slate-400">{kyc.submittedAt ? new Date(kyc.submittedAt).toLocaleDateString() : 'اليوم'}</span>
            </div>
          </div>

          {/* Documents Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 group hover:border-amber-500/50 transition">
              <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                <span>الهوية الوطنية (الوجه الأمامي)</span>
                <Eye className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400" />
              </div>
              <img
                src={kyc.nationalIdFront}
                alt="ID Front"
                className="w-full h-44 object-cover rounded-xl border border-slate-800 hover:opacity-90 transition cursor-pointer"
                onClick={() => window.open(kyc.nationalIdFront, '_blank')}
              />
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 group hover:border-amber-500/50 transition">
              <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                <span>الهوية الوطنية (الوجه الخلفي)</span>
                <Eye className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400" />
              </div>
              <img
                src={kyc.nationalIdBack}
                alt="ID Back"
                className="w-full h-44 object-cover rounded-xl border border-slate-800 hover:opacity-90 transition cursor-pointer"
                onClick={() => window.open(kyc.nationalIdBack, '_blank')}
              />
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 group hover:border-amber-500/50 transition">
              <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                <span>بطاقة السكن / الإقامة الرسمية</span>
                <Eye className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400" />
              </div>
              <img
                src={kyc.housingCard}
                alt="Housing Card"
                className="w-full h-44 object-cover rounded-xl border border-slate-800 hover:opacity-90 transition cursor-pointer"
                onClick={() => window.open(kyc.housingCard, '_blank')}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => onReviewKYC('approved')}
              className="flex-1 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{t.approveKycBtn} (Approve KYC & Activate Account)</span>
            </button>

            <button
              type="button"
              onClick={() => onReviewKYC('rejected', 'عدم وضوح المستندات أو اختلاف بيانات الهوية')}
              className="py-3.5 px-6 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs border border-rose-500/30 cursor-pointer flex items-center justify-center gap-2 transition"
            >
              <XCircle className="w-4 h-4" />
              <span>{t.rejectKycBtn} (Reject with Notification)</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: Capital Exit & Withdrawal Requests (P2P Settlement Queue) */}
      {activeTab === 'withdrawals' && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3 rtl:space-x-reverse shadow-md">
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-bold">
                  {currentLang === 'ar' ? 'طلبات السحب المعلقة' : 'Pending Requests'}
                </p>
                <p className="text-xl font-black text-amber-400">
                  {withdrawals.filter((w) => w.status === 'pending').length}
                </p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3 rtl:space-x-reverse shadow-md">
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-bold">
                  {currentLang === 'ar' ? 'حجم السحوبات المعلقة' : 'Pending Volume'}
                </p>
                <p className="text-xl font-black text-white font-mono">
                  $
                  {withdrawals
                    .filter((w) => w.status === 'pending')
                    .reduce((acc, c) => acc + (c.amount || 0), 0)
                    .toLocaleString()}{' '}
                  <span className="text-xs text-amber-400">USDT</span>
                </p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3 rtl:space-x-reverse shadow-md">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-bold">
                  {currentLang === 'ar' ? 'إجمالي السحوبات المعتمدة' : 'Completed Payouts'}
                </p>
                <p className="text-xl font-black text-emerald-400 font-mono">
                  $
                  {withdrawals
                    .filter((w) => w.status === 'completed' || w.status === 'approved')
                    .reduce((acc, c) => acc + (c.amount || 0), 0)
                    .toLocaleString()}{' '}
                  <span className="text-xs text-emerald-300">USDT</span>
                </p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3 rtl:space-x-reverse shadow-md">
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-bold">
                  {currentLang === 'ar' ? 'معدل التنفيذ الناجح' : 'Fulfillment Rate'}
                </p>
                <p className="text-xl font-black text-blue-400">
                  {withdrawals.length > 0
                    ? Math.round(
                        (withdrawals.filter((w) => w.status === 'completed' || w.status === 'approved').length /
                          withdrawals.length) *
                          100
                      )
                    : 100}
                  %
                </p>
              </div>
            </div>
          </div>

          {/* Main Withdrawal Management Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            
            {/* Header with Search and Status Filter */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-black text-white">
                  {currentLang === 'ar' ? 'إدارة واعتماد طلبات السحب P2P' : 'P2P Withdrawal Requests & Payout Desk'}
                </h2>
                <p className="text-xs text-slate-400">
                  {currentLang === 'ar'
                    ? 'مراجعة طلبات السحب بنقرة واحدة، وتأكيد التحويلات مع خصم الرصيد تلقائياً والمحادثة المباشرة.'
                    : 'Streamlined 1-click payout verification, instant balance deduction & real-time chat.'}
                </p>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                {(['all', 'pending', 'completed', 'rejected'] as const).map((filterVal) => (
                  <button
                    key={filterVal}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setWdStatusFilter(filterVal);
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      wdStatusFilter === filterVal
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

            {/* Search Input Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-3.5" />
              <input
                type="text"
                value={wdSearchQuery}
                onChange={(e) => setWdSearchQuery(e.target.value)}
                placeholder={
                  currentLang === 'ar'
                    ? 'بحث باسم المستثمر، البريد، الحساب، المحفظة، أو رقم الطلب...'
                    : 'Search by investor, email, wallet address, or request ID...'
                }
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-2xl pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-3 text-xs text-white outline-none"
              />
            </div>

            {filteredWithdrawals.length === 0 ? (
              <div className="p-12 text-center bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <Wallet className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm font-bold text-slate-300">
                  {currentLang === 'ar' ? 'لا توجد طلبات سحب تطابق البحث' : 'No withdrawal requests found'}
                </p>
                <p className="text-xs text-slate-500">
                  {currentLang === 'ar' ? 'جميع طلبات السحب معالجة أو لا توجد نتائج مطابقة.' : 'All requests have been processed.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Column: Withdrawal Queue List */}
                <div className="lg:col-span-5 space-y-2.5 max-h-[620px] overflow-y-auto pr-1 custom-scrollbar">
                  {filteredWithdrawals.map((wd) => {
                    const isSelected = activeWdObj?.id === wd.id;
                    const isCompleted = wd.status === 'completed' || wd.status === 'approved';
                    const isRejected = wd.status === 'rejected';

                    return (
                      <div
                        key={wd.id}
                        onClick={() => setSelectedWithdrawalId(wd.id)}
                        className={`p-4 rounded-2xl border transition cursor-pointer flex justify-between items-center gap-3 ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500/60 shadow-lg ring-1 ring-amber-500/40'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-white text-xs truncate">{wd.userName}</span>
                            <span className="text-[10px] text-amber-400 font-mono">#{wd.id.slice(-6)}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-amber-300 font-mono font-black">
                              ${wd.amount.toLocaleString()} USDT
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-300">
                              {wd.payoutMethod || 'USDT'}
                            </span>
                          </div>

                          <span className="text-[10px] text-slate-400 block truncate max-w-[200px] font-mono">
                            {wd.payoutDetails || wd.destinationWallet}
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
                                ? 'تم الصرف'
                                : 'Paid'
                              : isRejected
                              ? currentLang === 'ar'
                                ? 'مرفوض'
                                : 'Rejected'
                              : currentLang === 'ar'
                              ? 'بانتظار الصرف'
                              : 'Pending'}
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-1 font-mono">
                            {new Date(wd.requestedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right Column: Active Withdrawal Inspection, 1-Click Payout & Chat */}
                <div className="lg:col-span-7 bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 shadow-xl">
                  {activeWdObj ? (
                    <>
                      {/* Header Details */}
                      <div className="space-y-3 pb-3 border-b border-slate-800">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-slate-400 block text-[10px] font-mono">
                              Request ID: #{activeWdObj.id}
                            </span>
                            <span className="font-bold text-white text-base">
                              {activeWdObj.userName}
                            </span>
                            <span className="text-xs text-slate-400 block font-mono">
                              {activeWdObj.userEmail || 'investor@aseel.iq'}
                            </span>
                          </div>

                          <div className="text-right rtl:text-left font-mono">
                            <span className="text-slate-400 block text-[10px]">
                              {currentLang === 'ar' ? 'المبلغ المطلوب سحبه' : 'Requested Payout'}
                            </span>
                            <span className="font-extrabold text-amber-400 text-lg sm:text-xl">
                              ${activeWdObj.amount.toLocaleString()} <span className="text-xs text-slate-300">USDT</span>
                            </span>
                          </div>
                        </div>

                        {/* Destination & Account Details Box */}
                        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
                          <div className="flex justify-between items-center text-slate-300">
                            <span className="font-bold text-slate-400">
                              {currentLang === 'ar' ? 'طريقة الاستلام:' : 'Payout Method:'}
                            </span>
                            <span className="text-amber-400 font-mono font-bold px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                              {activeWdObj.payoutMethod || 'USDT_TRC20'}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <span className="font-bold text-slate-400 block text-[10px]">
                              {currentLang === 'ar' ? 'عنوان المحفظة / رقم الحساب المسجل:' : 'Destination Account / Address:'}
                            </span>
                            <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800 gap-2">
                              <span className="text-slate-200 font-mono text-xs break-all">
                                {activeWdObj.payoutDetails || activeWdObj.destinationWallet}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleCopyWdAddress(
                                    activeWdObj.payoutDetails || activeWdObj.destinationWallet,
                                    activeWdObj.id
                                  );
                                }}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 text-[11px] font-bold rounded-lg transition cursor-pointer flex items-center gap-1 shrink-0"
                              >
                                {copiedWdMap[activeWdObj.id] ? (
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
                        </div>
                      </div>

                      {/* Chat Messages Log */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                            <span>{currentLang === 'ar' ? 'محادثة وتأكيد السحب' : 'Withdrawal Chat Log'}</span>
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {activeWdObj.chatMessages?.length || 0} messages
                          </span>
                        </div>

                        <div className="max-h-44 overflow-y-auto bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 space-y-2 custom-scrollbar">
                          {(activeWdObj.chatMessages || []).map((msg) => (
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
                                {msg.sender === 'admin' ? 'Finance Desk (Admin)' : msg.sender}:
                              </span>
                              <p className="whitespace-pre-wrap">{msg.text}</p>
                              {msg.txHash && (
                                <span className="block font-mono text-[10px] text-amber-300 mt-1">
                                  TXID: {msg.txHash}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Admin Message Reply Input */}
                        <form noValidate onSubmit={handleAdminSendWdChat} className="flex gap-2 pt-1">
                          <input
                            type="text"
                            placeholder={
                              currentLang === 'ar'
                                ? 'اكتب رسالة للمستثمر بخصوص هذا السحب...'
                                : 'Type reply message to investor...'
                            }
                            value={adminWdReplyText}
                            onChange={(e) => setAdminWdReplyText(e.target.value)}
                            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500 shadow-inner"
                          />
                          <button
                            type="submit"
                            disabled={!adminWdReplyText.trim()}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-md cursor-pointer transition flex items-center gap-1 shrink-0"
                          >
                            <Send className="w-3.5 h-3.5 stroke-[2.5]" />
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
                            value={adminWdTxHash}
                            onChange={(e) => setAdminWdTxHash(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono outline-none"
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.preventDefault();
                              if (onReviewWithdrawal) {
                                await onReviewWithdrawal(
                                  activeWdObj.id,
                                  'completed',
                                  'P2P payout executed and approved',
                                  adminWdTxHash.trim() || undefined
                                );
                              } else {
                                await onApproveWithdrawal(activeWdObj.id);
                              }
                              setAdminWdTxHash('');
                              if (onRefreshState) onRefreshState();
                            }}
                            disabled={activeWdObj.status === 'completed' || activeWdObj.status === 'approved'}
                            className={`flex-1 py-3.5 rounded-2xl font-black text-xs transition flex items-center justify-center gap-2 shadow-lg ${
                              activeWdObj.status === 'completed' || activeWdObj.status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-400 cursor-default border border-emerald-500/30'
                                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 cursor-pointer'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                            <span>
                              {activeWdObj.status === 'completed' || activeWdObj.status === 'approved'
                                ? currentLang === 'ar'
                                  ? 'تم اعتماد وصرف هذا المبلغ بنجاح'
                                  : 'Payout Completed & Credited'
                                : currentLang === 'ar'
                                ? `اعتماد وصرف $${activeWdObj.amount.toLocaleString()} USDT وتحديث الرصيد فورا`
                                : `Approve & Payout $${activeWdObj.amount.toLocaleString()} USDT`}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={async (e) => {
                              e.preventDefault();
                              if (onReviewWithdrawal) {
                                await onReviewWithdrawal(activeWdObj.id, 'rejected', 'Failed payout verification');
                              }
                              if (onRefreshState) onRefreshState();
                            }}
                            disabled={activeWdObj.status === 'rejected'}
                            className="py-3.5 px-5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs border border-rose-500/30 cursor-pointer transition flex items-center justify-center gap-1.5"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>{currentLang === 'ar' ? 'رفض الطلب' : 'Reject'}</span>
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-12">
                      {currentLang === 'ar' ? 'اختر طلب سحب من القائمة لمراجعته' : 'Select a withdrawal request to review.'}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: Technical Support & Customer Service Tickets */}
      {activeTab === 'support' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header & Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Headset className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-bold">{currentLang === 'ar' ? 'إجمالي تذاكر الدعم' : 'Total Support Tickets'}</p>
                <p className="text-xl font-black text-white">{supportTicketsList.length}</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-bold">{currentLang === 'ar' ? 'التذاكر المفتوحة الحالية' : 'Active Open Tickets'}</p>
                <p className="text-xl font-black text-emerald-400">
                  {supportTicketsList.filter((t) => t.status === 'open').length}
                </p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-bold">{currentLang === 'ar' ? 'التذاكر المغلقة' : 'Closed Tickets'}</p>
                <p className="text-xl font-black text-slate-300">
                  {supportTicketsList.filter((t) => t.status === 'closed').length}
                </p>
              </div>
            </div>
          </div>

          {/* Main Workspace Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Panel: Support Ticket List & Filters */}
            <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Headset className="w-4 h-4 text-amber-400" />
                  <span>{currentLang === 'ar' ? 'طلبات الدعم المباشرة' : 'Live Support Requests'}</span>
                </h3>
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  {filteredSupportTickets.length}
                </span>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setSupportFilter('all')}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    supportFilter === 'all' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {currentLang === 'ar' ? 'الكل' : 'All'} ({supportTicketsList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSupportFilter('open')}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    supportFilter === 'open' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {currentLang === 'ar' ? 'مفتوحة' : 'Open'} ({supportTicketsList.filter((t) => t.status === 'open').length})
                </button>
                <button
                  type="button"
                  onClick={() => setSupportFilter('closed')}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    supportFilter === 'closed' ? 'bg-slate-800 text-slate-200' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {currentLang === 'ar' ? 'مغلقة' : 'Closed'}
                </button>
              </div>

              {/* Tickets Cards Feed */}
              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                {filteredSupportTickets.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8">
                    {currentLang === 'ar' ? 'لا توجد تذاكر دعم حتى الآن' : 'No support tickets found'}
                  </p>
                ) : (
                  filteredSupportTickets.map((ticket) => {
                    const isSelected = activeSupportTicket?.id === ticket.id;
                    const lastMsg = ticket.messages[ticket.messages.length - 1];

                    return (
                      <button
                        type="button"
                        key={ticket.id}
                        onClick={() => setSelectedSupportTicketId(ticket.id)}
                        className={`w-full text-left rtl:text-right p-3.5 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500/50 shadow-lg'
                            : 'bg-slate-950 hover:bg-slate-800/80 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-[10px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                            {ticket.id}
                          </span>
                          <span
                            className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                              ticket.status === 'open' || ticket.status === 'unlocked'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : ticket.status === 'pending_approval' || ticket.status === 'pending'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {ticket.status === 'pending_approval' || ticket.status === 'pending'
                              ? (currentLang === 'ar' ? 'بانتظار قبول الاتصال' : 'AWAITING CONNECTION')
                              : ticket.status.toUpperCase()}
                          </span>
                        </div>

                        <p className="text-xs font-black text-white truncate">{ticket.fullName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{ticket.phone}</p>
                        <p className="text-[10px] text-slate-500 truncate">{ticket.email}</p>

                        {lastMsg && (
                          <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                            <span className="truncate max-w-[170px]">
                              {lastMsg.sender === 'user' ? '👤 ' : '🎧 '}
                              {lastMsg.text}
                            </span>
                            <span className="text-[9px] text-slate-500 shrink-0">
                              {new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Panel: Live Support Chat Workspace */}
            <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[580px]">
              {activeSupportTicket ? (
                <>
                  {/* Selected Ticket Banner Header */}
                  <div className="bg-slate-950 p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            activeSupportTicket.status === 'open' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                          }`}
                        />
                        <h3 className="text-sm font-black text-white">{activeSupportTicket.fullName}</h3>
                        <span className="font-mono text-[11px] text-slate-400">({activeSupportTicket.phone})</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {activeSupportTicket.email} •{' '}
                        <span className="text-amber-400 font-semibold">{activeSupportTicket.subject || 'General'}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-xl">
                        {activeSupportTicket.id}
                      </span>

                      {(activeSupportTicket.status === 'pending_approval' || activeSupportTicket.status === 'pending') && onAcceptSupportConnection && (
                        <button
                          type="button"
                          onClick={async () => {
                            await onAcceptSupportConnection(activeSupportTicket.id);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer animate-pulse"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{currentLang === 'ar' ? 'قبول الاتصال وفتح المحادثة' : 'Accept Connection & Unlock Chat'}</span>
                        </button>
                      )}

                      {onCloseSupportTicket && (
                        <button
                          type="button"
                          onClick={async () => {
                            await onCloseSupportTicket(activeSupportTicket.id);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            activeSupportTicket.status === 'open'
                              ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {activeSupportTicket.status === 'open'
                            ? (currentLang === 'ar' ? 'إغلاق التذكرة' : 'Close Ticket')
                            : (currentLang === 'ar' ? 'إعادة فتح التذكرة' : 'Re-open Ticket')}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Messages Feed */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-950/40">
                    {activeSupportTicket.messages.map((msg) => {
                      const isAdmin = msg.sender === 'admin';
                      const isSystem = msg.sender === 'system';

                      if (isSystem) {
                        return (
                          <div key={msg.id} className="text-center my-2">
                            <span className="text-[10px] bg-slate-900 text-slate-400 px-3 py-1 rounded-full border border-slate-800 font-medium">
                              {msg.text}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className="flex items-start gap-2 max-w-[80%]">
                            {!isAdmin && (
                              <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-500/30 shrink-0 mt-1">
                                <UserIcon className="w-3.5 h-3.5" />
                              </div>
                            )}

                            <div
                              className={`rounded-2xl p-3 text-xs space-y-1 shadow-md ${
                                isAdmin
                                  ? 'bg-amber-500 text-slate-950 font-medium rounded-br-none'
                                  : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[9px] opacity-80 mb-0.5">
                                <span className="font-bold">
                                  {isAdmin ? '🎧 Admin Support Representative' : `👤 ${activeSupportTicket.fullName}`}
                                </span>
                              </div>
                              <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                              <p className={`text-[9px] ${isAdmin ? 'text-slate-900/70 text-right' : 'text-slate-400 text-left'}`}>
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>

                            {isAdmin && (
                              <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs border border-amber-500/30 shrink-0 mt-1">
                                <Headset className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Admin Reply Form */}
                  <form
                    noValidate
                    onSubmit={handleSendSupportReply}
                    className="p-3.5 bg-slate-950 border-t border-slate-800 shrink-0"
                  >
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <input
                        type="text"
                        placeholder={
                          currentLang === 'ar'
                            ? 'اكتب الرد الرسمي للمستثمر هنا...'
                            : 'Type official support response to investor...'
                        }
                        value={adminSupportReplyText}
                        onChange={(e) => setAdminSupportReplyText(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl px-4 py-3 text-slate-100 text-xs outline-none transition-all"
                      />
                      <button
                        type="submit"
                        disabled={!adminSupportReplyText.trim()}
                        className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20 flex items-center space-x-1.5 rtl:space-x-reverse cursor-pointer disabled:opacity-50"
                      >
                        <Send className="w-4 h-4 rtl:rotate-180 stroke-[2.5]" />
                        <span>{currentLang === 'ar' ? 'إرسال الرد' : 'Send Reply'}</span>
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
                  <Headset className="w-12 h-12 text-slate-600" />
                  <p className="text-xs text-slate-400 font-medium">
                    {currentLang === 'ar' ? 'حدد تذكرة دعم لمشاهدة التفاصيل والمحادثة المباشرة' : 'Select a support ticket to inspect and reply'}
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* TAB 7: Password Resets */}
      {activeTab === 'password_resets' && (
        <PasswordResetManagement currentLang={currentLang} />
      )}

      {/* TAB 8: News Management */}
      {activeTab === 'news' && (
        <NewsManagement currentLang={currentLang} />
      )}

      {/* TAB 9: Referral Management */}
      {activeTab === 'referrals' && (
        <ReferralManagement currentLang={currentLang} />
      )}
      {activeTab === 'settings' && (
        <div className="space-y-6 max-w-3xl">
          {/* System Status Controls Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <ShieldAlert className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">
                  {currentLang === 'ar' ? 'عناصر التحكم بحالة النظام (System Status Controls)' : 'System Status Controls'}
                </h2>
                <p className="text-xs text-slate-400">
                  {currentLang === 'ar'
                    ? 'إدارة خيارات تعليق أو تفعيل عمليات الإيداع والسحب لجميع مستخدمي المنصة'
                    : 'Manage platform-wide controls to temporarily pause or resume deposit and withdrawal operations.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Toggle 1: Pause Deposits */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ArrowDownCircle className={`w-5 h-5 ${pauseDeposits ? 'text-rose-400' : 'text-emerald-400'}`} />
                    <span className="text-xs font-black text-white">
                      {currentLang === 'ar' ? 'إيقاف الإيداعات (Pause Deposits)' : 'Pause Deposits'}
                    </span>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pauseDeposits}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setPauseDeposits(val);
                        onSaveSettings({
                          pauseDeposits: val,
                          pauseWithdrawals,
                          registrationEnabled,
                          trc20Address: trc20Input,
                          bep20Address: bep20Input,
                          announcementMessage: { ar: announcementAr, en: announcementAr, ckb: announcementAr },
                        });
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                  </label>
                </div>

                <p className="text-[11px] leading-relaxed">
                  {pauseDeposits ? (
                    <span className="text-rose-400 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      {currentLang === 'ar' ? 'ميزة الإيداع معطلة حالياً لجميع المستخدمين.' : 'Deposits are currently suspended for all users.'}
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-semibold">
                      {currentLang === 'ar' ? 'ميزة الإيداع مفعلة وتعمل بشكل طبيعي.' : 'Deposits are active and functioning normally.'}
                    </span>
                  )}
                </p>
                <div className="text-[10px] bg-slate-900 border border-slate-800/80 rounded-xl p-2.5 font-mono text-slate-300">
                  <span className="text-slate-500 font-sans block mb-0.5">رسالة التنبيه للمستخدمين:</span>
                  "Deposits are temporarily suspended." / "تم إيقاف الإيداعات مؤقتاً."
                </div>
              </div>

              {/* Toggle 2: Pause Withdrawals */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ArrowUpCircle className={`w-5 h-5 ${pauseWithdrawals ? 'text-rose-400' : 'text-emerald-400'}`} />
                    <span className="text-xs font-black text-white">
                      {currentLang === 'ar' ? 'إيقاف السحوبات (Pause Withdrawals)' : 'Pause Withdrawals'}
                    </span>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pauseWithdrawals}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setPauseWithdrawals(val);
                        onSaveSettings({
                          pauseDeposits,
                          pauseWithdrawals: val,
                          registrationEnabled,
                          trc20Address: trc20Input,
                          bep20Address: bep20Input,
                          announcementMessage: { ar: announcementAr, en: announcementAr, ckb: announcementAr },
                        });
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                  </label>
                </div>

                <p className="text-[11px] leading-relaxed">
                  {pauseWithdrawals ? (
                    <span className="text-rose-400 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      {currentLang === 'ar' ? 'ميزة السحب معطلة حالياً لجميع المستخدمين.' : 'Withdrawals are currently suspended for all users.'}
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-semibold">
                      {currentLang === 'ar' ? 'ميزة السحب مفعلة وتعمل بشكل طبيعي.' : 'Withdrawals are active and functioning normally.'}
                    </span>
                  )}
                </p>
                <div className="text-[10px] bg-slate-900 border border-slate-800/80 rounded-xl p-2.5 font-mono text-slate-300">
                  <span className="text-slate-500 font-sans block mb-0.5">رسالة التنبيه للمستخدمين:</span>
                  "Withdrawals are temporarily suspended." / "تم إيقاف السحوبات مؤقتاً."
                </div>
              </div>

              {/* Toggle 3: Registration Status */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <UserPlus className={`w-5 h-5 ${!registrationEnabled ? 'text-rose-400' : 'text-emerald-400'}`} />
                    <span className="text-xs font-black text-white">
                      {currentLang === 'ar' ? 'حالة تسجيل الحسابات (Registration Status)' : 'Registration Status'}
                    </span>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={registrationEnabled}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setRegistrationEnabled(val);
                        onSaveSettings({
                          pauseDeposits,
                          pauseWithdrawals,
                          registrationEnabled: val,
                          trc20Address: trc20Input,
                          bep20Address: bep20Input,
                          announcementMessage: { ar: announcementAr, en: announcementAr, ckb: announcementAr },
                        });
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                <p className="text-[11px] leading-relaxed">
                  {!registrationEnabled ? (
                    <span className="text-rose-400 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      {currentLang === 'ar' ? 'تسجيل الحسابات الجديدة معطل حالياً.' : 'New user registration is currently disabled.'}
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-semibold">
                      {currentLang === 'ar' ? 'تسجيل الحسابات الجديدة مفعل ومتاح.' : 'User registration is active and open.'}
                    </span>
                  )}
                </p>
                <div className="text-[10px] bg-slate-900 border border-slate-800/80 rounded-xl p-2.5 font-mono text-slate-300">
                  <span className="text-slate-500 font-sans block mb-0.5">سلوك النظام عند الإيقاف:</span>
                  {currentLang === 'ar' ? 'يمنع إنشاء حسابات جديدة ويسمح بالدخول للحسابات القديمة.' : 'Blocks new signups while keeping existing user login active.'}
                </div>
              </div>
            </div>
          </div>

          {/* Official Wallets & Announcement Settings */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <h2 className="text-lg font-black text-white">{t.updateWalletsTitle}</h2>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">{t.trc20AddressLabel}</label>
                <input
                  type="text"
                  value={trc20Input}
                  onChange={(e) => setTrc20Input(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-amber-300 font-mono outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">{t.bep20AddressLabel}</label>
                <input
                  type="text"
                  value={bep20Input}
                  onChange={(e) => setBep20Input(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-amber-300 font-mono outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">{t.announcementLabel}</label>
                <input
                  type="text"
                  value={announcementAr}
                  onChange={(e) => setAnnouncementAr(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() =>
                  onSaveSettings({
                    pauseDeposits,
                    pauseWithdrawals,
                    registrationEnabled,
                    trc20Address: trc20Input,
                    bep20Address: bep20Input,
                    announcementMessage: { ar: announcementAr, en: announcementAr, ckb: announcementAr },
                  })
                }
                className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 cursor-pointer transition-all"
              >
                {t.saveSettingsBtn}
              </button>
            </div>
          </div>

          {/* Admin Credentials & Database Role Management Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <KeyRound className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">
                  {currentLang === 'ar' ? 'اعتمادات حساب مدير النظام (Admin Credentials)' : 'Admin Credentials & Access'}
                </h2>
                <p className="text-xs text-slate-400">
                  {currentLang === 'ar'
                    ? 'تعديل البريد الإلكتروني/اسم المستخدم وكلمة المرور المربوطة بقاعدة بيانات Supabase مباشرة'
                    : 'Update administrative login email/username and password synced to Supabase database.'}
                </p>
              </div>
            </div>

            {adminCredsMsg && (
              <div
                className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                  adminCredsMsg.type === 'success'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                }`}
              >
                {adminCredsMsg.type === 'success' ? (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{adminCredsMsg.text}</span>
              </div>
            )}

            <form noValidate onSubmit={handleUpdateAdminCredentials} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    {currentLang === 'ar' ? 'البريد الإلكتروني / اسم مستخدم الإدارة' : 'Admin Email / Username'}
                  </label>
                  <input
                    type="text"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@aseel.com أو admin"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-amber-300 font-mono outline-none focus:border-amber-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    {currentLang === 'ar' ? 'يمكنك استخدام البريد الإلكتروني أو اسم المستخدم (admin) لتسجيل الدخول.' : 'You can log in using this email or username (admin).'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    {currentLang === 'ar' ? 'الاسم الظاهر للمدير' : 'Admin Display Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="مدير النظام"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {currentLang === 'ar' ? 'كلمة المرور الجديدة للإدارة (اختياري للتغيير)' : 'New Admin Password (Optional)'}
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="أدخل كلمة مرور جديدة أو اتركها فارغة للحفاظ على الحالية..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {currentLang === 'ar'
                    ? 'كلمة المرور الحالية الافتراضية للإدارة: Admin@2026!Secure (أو admin)'
                    : 'Current default admin password: Admin@2026!Secure (or admin)'}
                </span>
              </div>

              <button
                type="submit"
                disabled={adminCredsLoading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {adminCredsLoading ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>جاري حفظ واعتماد البيانات في Supabase...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-slate-950" />
                    <span>حفظ واعتماد بيانات الإدارة في قاعدة البيانات</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Hire New Admin Employee / Add Admin Account Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                <UserPlus className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">
                  {currentLang === 'ar' ? 'تعيين / إضافة موظف مدير نظام جديد (Hire New Admin)' : 'Hire New Admin Employee'}
                </h2>
                <p className="text-xs text-slate-400">
                  {currentLang === 'ar'
                    ? 'إمكانية إضافة حساب مدير جديد وتحديد بريده الإلكتروني وكلمة المرور الابتدائية ومزامنته بـ Supabase'
                    : 'Create a new admin account with email address and initial password synced to Supabase.'}
                </p>
              </div>
            </div>

            {hireAdminMsg && (
              <div
                className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                  hireAdminMsg.type === 'success'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                }`}
              >
                {hireAdminMsg.type === 'success' ? (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{hireAdminMsg.text}</span>
              </div>
            )}

            <form noValidate onSubmit={handleHireNewAdmin} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    {currentLang === 'ar' ? 'البريد الإلكتروني للمدير الجديد *' : 'New Admin Email *'}
                  </label>
                  <input
                    type="email"
                    required
                    value={hireAdminEmail}
                    onChange={(e) => setHireAdminEmail(e.target.value)}
                    placeholder="newadmin@aseel.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-sky-300 font-mono outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    {currentLang === 'ar' ? 'الاسم الظاهر للموظف' : 'Admin Display Name'}
                  </label>
                  <input
                    type="text"
                    value={hireAdminName}
                    onChange={(e) => setHireAdminName(e.target.value)}
                    placeholder="مثال: أحمد علي - إدارة الماليّة"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {currentLang === 'ar' ? 'كلمة المرور الابتدائية *' : 'Initial Password *'}
                </label>
                <input
                  type="password"
                  required
                  value={hireAdminPassword}
                  onChange={(e) => setHireAdminPassword(e.target.value)}
                  placeholder="أدخل كلمة مرور ابتدائية (6 خانات على الأقل)..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono outline-none focus:border-sky-500"
                />
              </div>

              <button
                type="submit"
                disabled={hireAdminLoading || !hireAdminEmail.trim() || !hireAdminPassword.trim()}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-sky-400 hover:from-sky-400 hover:to-sky-300 text-slate-950 font-black text-xs shadow-lg shadow-sky-500/20 cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {hireAdminLoading ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>جاري تعيين وإنشاء حساب الإدارة...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 text-slate-950" />
                    <span>إنشاء حساب مدير نظام جديد وتعيين الصلاحيات</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Subscribers List Modal */}
      {selectedSubscribersProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <img
                  src={selectedSubscribersProject.imageUrl}
                  alt={selectedSubscribersProject.title.ar}
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-800 shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-black">
                      {selectedSubscribersProject.category === 'cargo_freight' ? 'شحن وبضائع' : 'نقل مسافرين'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {selectedSubscribersProject.monthlyRoiPercent}% عائد شهري
                    </span>
                  </div>
                  <h3 className="text-base font-black text-white">{selectedSubscribersProject.title.ar}</h3>
                  <p className="text-xs text-slate-400">{selectedSubscribersProject.route.ar}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSubscribersProject(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Analytics Summary Header Box */}
            {(() => {
              const pInvestments = (investments || []).filter((inv) => inv.projectId === selectedSubscribersProject.id);
              const uniqueUsers = new Set(pInvestments.map((i) => i.userId)).size;
              const totalAmount = pInvestments.reduce((sum, i) => sum + (i.amount || 0), 0);
              const totalMonthlyPayout = pInvestments.reduce((sum, i) => sum + ((i.amount || 0) * (i.monthlyRoiPercent || 4.5) / 100), 0);

              const filteredInvestments = pInvestments.filter((inv) => {
                if (!subscriberSearchQuery.trim()) return true;
                const q = subscriberSearchQuery.toLowerCase().trim();
                return (
                  inv.id.toLowerCase().includes(q) ||
                  inv.userId.toLowerCase().includes(q) ||
                  inv.amount.toString().includes(q)
                );
              });

              return (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-center">
                    <div>
                      <span className="block text-[10px] text-slate-400 font-semibold">عدد المشتركين</span>
                      <span className="text-base font-black text-white">{uniqueUsers} مستثمر</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-semibold">إجمالي رأس المال المجمع</span>
                      <span className="text-base font-black text-emerald-400 font-mono">${totalAmount.toLocaleString()} USDT</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-semibold">عدد العقود النشطة</span>
                      <span className="text-base font-black text-amber-400">{pInvestments.length} عقد</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-semibold">التزام العائد الشهري</span>
                      <span className="text-base font-black text-amber-300 font-mono">${totalMonthlyPayout.toFixed(2)} USDT</span>
                    </div>
                  </div>

                  {/* Search Input */}
                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs">
                    <Search className="w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="البحث باسم المستثمر أو المعرف أو المبلغ..."
                      value={subscriberSearchQuery}
                      onChange={(e) => setSubscriberSearchQuery(e.target.value)}
                      className="w-full bg-transparent text-white outline-none"
                    />
                    {subscriberSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setSubscriberSearchQuery('')}
                        className="text-slate-500 hover:text-white cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Subscribers Table */}
                  <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                    <table className="w-full text-right text-xs text-slate-300">
                      <thead className="bg-slate-900 text-[11px] text-slate-400 font-bold border-b border-slate-800">
                        <tr>
                          <th className="p-3">#</th>
                          <th className="p-3">معرف المستثمر (User ID)</th>
                          <th className="p-3">مبلغ الاستثمار</th>
                          <th className="p-3">العائد الشهري</th>
                          <th className="p-3">تاريخ الاشتراك</th>
                          <th className="p-3">نهاية القفل</th>
                          <th className="p-3">الحالة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                        {filteredInvestments.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-slate-500 font-sans">
                              {pInvestments.length === 0
                                ? 'لا يوجد مشتركين في هذه الخطة الاستثمارية حتى الآن.'
                                : 'لا توجد نتائج مطابقة لقاموس البحث.'}
                            </td>
                          </tr>
                        ) : (
                          filteredInvestments.map((inv, idx) => {
                            const monthlyValue = ((inv.amount || 0) * (inv.monthlyRoiPercent || 4.5)) / 100;
                            return (
                              <tr key={inv.id} className="hover:bg-slate-900/60 transition-colors">
                                <td className="p-3 text-slate-500 font-bold">{idx + 1}</td>
                                <td className="p-3 font-semibold text-white">
                                  <span className="block truncate max-w-[150px]">{inv.userId}</span>
                                </td>
                                <td className="p-3 text-emerald-400 font-black">${inv.amount.toLocaleString()} USDT</td>
                                <td className="p-3 text-amber-300 font-bold">${monthlyValue.toFixed(2)} USDT</td>
                                <td className="p-3 text-slate-400">
                                  {inv.startDate ? new Date(inv.startDate).toLocaleDateString() : 'مستمر'}
                                </td>
                                <td className="p-3 text-slate-400">
                                  {inv.endDate ? new Date(inv.endDate).toLocaleDateString() : '5 أشهر'}
                                </td>
                                <td className="p-3">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      inv.status === 'active'
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        : 'bg-slate-800 text-slate-400'
                                    }`}
                                  >
                                    {inv.status === 'active' ? 'نشط (Active)' : inv.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              );
            })()}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedSubscribersProject(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Create Project Modal with Full Details & Image Manager */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">
                  {editingProject ? 'تعديل تفاصيل خطة الأسطول' : 'إضافة خطة وأسطول استثماري جديد'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowProjectModal(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form noValidate onSubmit={handleSaveProjectSubmit} className="space-y-5 text-xs">
              {/* Basic Details Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">التفاصيل الأساسية للأسطول</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">اسم المشروع/الأسطول (عربي)</label>
                    <input
                      type="text"
                      required
                      value={projTitleAr}
                      onChange={(e) => setProjTitleAr(e.target.value)}
                      placeholder="مثال: أسطول شاحنات النقل الثقيل - بغداد"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">اسم المشروع (إنجليزي - English)</label>
                    <input
                      type="text"
                      value={projTitleEn}
                      onChange={(e) => setProjTitleEn(e.target.value)}
                      placeholder="e.g. Heavy Cargo Haulage Fleet"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">تصنيف الأسطول</label>
                    <select
                      value={projCategory}
                      onChange={(e) => setProjCategory(e.target.value as VehicleCategory)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-amber-500"
                    >
                      <option value="cargo_freight">شحن ونقل بضائع (Cargo & Freight)</option>
                      <option value="passenger_transport">نقل مسافرين وركاب (Passenger Transport)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">خط السير والمسار الرئيسي</label>
                    <input
                      type="text"
                      value={projRouteAr}
                      onChange={(e) => setProjRouteAr(e.target.value)}
                      placeholder="مثال: بغداد ⇄ أربيل ⇄ البصرة"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">طراز ومواصفات المركبات</label>
                    <input
                      type="text"
                      value={projSpecs}
                      onChange={(e) => setProjSpecs(e.target.value)}
                      placeholder="مثال: شاحنة Scania R500 - حمولة 40 طن"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">عدد مركبات الأسطول</label>
                    <input
                      type="number"
                      min="1"
                      value={projVehicles}
                      onChange={(e) => setProjVehicles(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">وصف المشروع التشغيلي</label>
                  <textarea
                    rows={2}
                    value={projDescriptionAr}
                    onChange={(e) => setProjDescriptionAr(e.target.value)}
                    placeholder="وصف طبيعة عمل الأسطول والعقود التشغيلية..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Financial Specs Grid */}
              <div className="space-y-3 border-t border-slate-800 pt-3">
                <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider">المؤشرات المالية والشروط</h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">المبلغ المطلوب (USDT)</label>
                    <input
                      type="number"
                      value={projTarget}
                      onChange={(e) => setProjTarget(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-emerald-400 font-black font-mono outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">أدنى استثمار (USDT)</label>
                    <input
                      type="number"
                      value={projMinInvest}
                      onChange={(e) => setProjMinInvest(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold font-mono outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">مدة القفل (أشهر)</label>
                    <input
                      type="number"
                      value={projLockupMonths}
                      onChange={(e) => setProjLockupMonths(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold font-mono outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="sm:col-span-3 bg-amber-500/5 p-3.5 rounded-2xl border border-amber-500/30 space-y-1.5">
                    <label className="block font-extrabold text-amber-400 text-xs flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-amber-400" />
                      <span>الأرباح المتوقعة القائمة على الرحلات (Trip-Based Expected Profit)</span>
                    </label>
                    <input
                      type="text"
                      value={projExpectedProfit}
                      onChange={(e) => setProjExpectedProfit(e.target.value)}
                      placeholder="مثال: أرباح تقديرية $30 إلى $45 لكل $1,000 استثمار (بناءً على 12 إلى 18 رحلة شحن)"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-white text-xs font-bold outline-none transition-all shadow-inner"
                    />
                    <span className="text-[10px] text-slate-400 block leading-normal">
                      يدخل أدمن المنصة هنا تفاصيل ونطاق الأرباح القائمة على الرحلات بدلاً من النسبة المئوية الثابتة (مثل: أرباح تقديرية $30 إلى $45 بناءً على 12-18 رحلة شحن)، وتُعرض مباشرة في بطاقات الخطة للمستثمرين.
                    </span>
                  </div>
                </div>
              </div>

              {/* Image Management Section */}
              <div className="space-y-3 border-t border-slate-800 pt-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-sky-400 uppercase tracking-wider">إدارة صورة غلاف الأسطول</h4>
                  <span className="text-[10px] text-slate-400">يدعم الرفع المباشر، الرابط، أو الصور الجاهزة</span>
                </div>

                {/* Current Selected Image Preview */}
                {projImage && (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 h-36 flex items-center justify-center">
                    <img src={projImage} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-3 justify-between">
                      <span className="text-[10px] text-emerald-400 font-bold bg-slate-900/90 px-2 py-0.5 rounded border border-emerald-500/30">
                        صورة الغلاف الحالية المختارة
                      </span>
                      <button
                        type="button"
                        onClick={() => setProjImage('')}
                        className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[10px] font-bold border border-rose-500/40 cursor-pointer"
                      >
                        إزالة الصورة
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Direct Image URL input */}
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">رابط الصورة المباشر (URL)</label>
                    <input
                      type="text"
                      value={projImage}
                      onChange={(e) => setProjImage(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-300 font-mono text-[10px] outline-none focus:border-sky-500"
                    />
                  </div>

                  {/* Direct Device File Upload */}
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">رفع صورة من جهازك</label>
                    <label className="flex items-center justify-center gap-2 p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-dashed border-slate-700 rounded-xl cursor-pointer text-slate-300 hover:text-white transition-colors">
                      <Upload className="w-4 h-4 text-sky-400" />
                      <span className="text-[11px] font-bold">اختيار ملف صورة...</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Quick Preset Fleet Image Library */}
                <div>
                  <label className="block font-bold text-slate-300 mb-1.5">معرض صور الأسطول الجاهزة (تحديد بنقرة واحدة):</label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {FLEET_PRESET_IMAGES.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setProjImage(preset.url)}
                        className={`relative rounded-xl overflow-hidden border transition-all h-16 group cursor-pointer ${
                          projImage === preset.url
                            ? 'border-amber-400 ring-2 ring-amber-400/50 scale-95'
                            : 'border-slate-800 hover:border-slate-600'
                        }`}
                        title={preset.name}
                      >
                        <img src={preset.url} alt={preset.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                        {projImage === preset.url && (
                          <div className="absolute inset-0 bg-amber-500/30 flex items-center justify-center">
                            <Check className="w-5 h-5 text-slate-950 font-black bg-amber-400 rounded-full p-0.5" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20 cursor-pointer hover:scale-[1.01] transition-transform"
                >
                  حفظ ودمج بيانات الخطة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plan-Specific Profit Distribution Modal */}
      {showPlanProfitModal && (
        <PlanProfitDistributionModal
          currentLang={currentLang}
          projects={projects}
          investments={investments}
          onClose={() => setShowPlanProfitModal(false)}
          onSuccess={() => {
            if (onRefreshState) onRefreshState();
          }}
        />
      )}

      {/* Cash Bonus / Gift Payout Modal */}
      {showBonusGiftModal && (
        <BonusGiftModal
          currentLang={currentLang}
          users={usersList}
          onClose={() => setShowBonusGiftModal(false)}
          onSuccess={() => {
            if (onRefreshState) onRefreshState();
          }}
        />
      )}

      {/* Log New Freight Trip Modal */}
      {selectedProjectForTrip && (
        <LogTripModal
          currentLang={currentLang}
          project={selectedProjectForTrip}
          onClose={() => setSelectedProjectForTrip(null)}
          onTripLogged={() => {
            if (onRefreshState) onRefreshState();
          }}
        />
      )}

    </div>
  );
};
