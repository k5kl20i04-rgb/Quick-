import React, { useState } from 'react';
import {
  Truck,
  ShieldCheck,
  Wallet,
  MessageSquare,
  ArrowLeftRight,
  Globe,
  ChevronDown,
  LogOut,
  Shield,
  Bell,
  Sparkles,
  Menu,
  X,
  Sun,
  Moon,
  User as UserIcon,
  Settings,
  ArrowDownRight,
  ArrowUpLeft,
  Headset,
  Check,
  CheckCheck,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  TrendingUp,
  Newspaper,
  Receipt,
} from 'lucide-react';
import { Language, User, KYCStatus, AppNotification } from '../types';
import { translations } from '../i18n/translations';

interface NavbarProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  user: User | null;
  activeView: 'dashboard' | 'portfolio' | 'fleet' | 'transactions' | 'kyc' | 'admin' | 'chat';
  onNavigate: (view: 'dashboard' | 'portfolio' | 'fleet' | 'transactions' | 'kyc' | 'admin' | 'chat') => void;
  onOpenDeposit: () => void;
  onOpenWithdrawal?: () => void;
  onOpenTransferModal?: () => void;
  onOpenKYC: () => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  isAdminView: boolean;
  onToggleAdminView: () => void;
  onLogout: () => void;
  notifications?: AppNotification[];
  onMarkNotificationRead?: (id: string) => void;
  onMarkAllNotificationsRead?: () => void;
  onClearNotifications?: () => void;
  onNotificationClick?: (notif: AppNotification) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentLang,
  onLanguageChange,
  user,
  activeView,
  onNavigate,
  onOpenDeposit,
  onOpenWithdrawal,
  onOpenTransferModal,
  onOpenKYC,
  onOpenProfile,
  onOpenSettings,
  theme,
  onToggleTheme,
  isAdminView,
  onToggleAdminView,
  onLogout,
  notifications = [],
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onClearNotifications,
  onNotificationClick,
}) => {
  const t = translations[currentLang] || translations.ar;
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter((n) => !n.read).length;
  const displayedNotifications =
    notifFilter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  const getNotifTitle = (notif: AppNotification) => {
    if (typeof notif.title === 'string') return notif.title;
    return notif.title?.[currentLang] || notif.title?.ar || notif.title?.en || '';
  };

  const getNotifMessage = (notif: AppNotification) => {
    if (typeof notif.message === 'string') return notif.message;
    return notif.message?.[currentLang] || notif.message?.ar || notif.message?.en || '';
  };

  const formatNotifTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const diff = Math.floor((Date.now() - d.getTime()) / 1000);
      if (diff < 60) return t.justNow || (currentLang === 'ar' ? 'الآن' : 'Just now');
      if (diff < 3600) return `${Math.floor(diff / 60)} ${t.minutesAgo || 'm'}`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} ${t.hoursAgo || 'h'}`;
      return `${Math.floor(diff / 86400)} ${t.daysAgo || 'd'}`;
    } catch {
      return '';
    }
  };

  const getNotifIcon = (notif: AppNotification) => {
    switch (notif.type) {
      case 'deposit':
        return <ArrowDownRight className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'withdrawal':
        return <ArrowUpLeft className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'roi':
        return <TrendingUp className="w-4 h-4 text-cyan-400 shrink-0" />;
      case 'subscription':
        return <Truck className="w-4 h-4 text-indigo-400 shrink-0" />;
      case 'kyc':
        return <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />;
      case 'support':
        return <Headset className="w-4 h-4 text-sky-400 shrink-0" />;
      default:
        return <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />;
    }
  };

  const getKycBadgeClass = (status: KYCStatus) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'pending':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'rejected':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const getKycBadgeText = (status: KYCStatus) => {
    switch (status) {
      case 'approved':
        return t.kycVerified;
      case 'pending':
        return t.kycPending;
      case 'rejected':
        return t.kycRejected;
      default:
        return t.kycNotSubmitted;
    }
  };

  const isRtl = currentLang === 'ar' || currentLang === 'ckb';

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-2 sm:gap-4">
            
            {/* Left Header Area: Hamburger Toggle & Brand Logo */}
            <div className="flex items-center space-x-2 sm:space-x-3 rtl:space-x-reverse">
              
              {/* Hamburger Side Menu Button (☰) */}
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setSideMenuOpen(true); }}
                title={t.sideMenuTitle}
                className="p-2 sm:p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-amber-400 border border-slate-700 transition-all flex items-center justify-center shrink-0 shadow-sm"
              >
                <Menu className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
              </button>

              {/* Brand Logo & Name */}
              <div className="flex items-center space-x-2 sm:space-x-3 rtl:space-x-reverse cursor-pointer" onClick={() => onNavigate('dashboard')}>
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20 ring-2 ring-amber-500/40 shrink-0">
                  <Truck className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5 sm:space-x-2 rtl:space-x-reverse">
                    <span className="text-xl sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 bg-clip-text text-transparent">
                      {t.brandName}
                    </span>
                    <span className="hidden xs:inline-block text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/30">
                      5M Lockup
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 hidden md:block">
                    {t.brandSubtitle}
                  </p>
                </div>
              </div>
            </div>

            {/* Nav Links (Desktop) */}
            <nav className="hidden lg:flex items-center space-x-1 rtl:space-x-reverse bg-slate-950/60 p-1.5 rounded-xl border border-slate-800/80">
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}
                className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  activeView === 'dashboard'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {t.navDashboard}
              </button>

              <button
                type="button"
                onClick={(e) => { e.preventDefault(); onNavigate('portfolio'); }}
                className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  activeView === 'portfolio'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {t.navPortfolio}
              </button>

              <button
                type="button"
                onClick={(e) => { e.preventDefault(); onNavigate('fleet'); }}
                className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  activeView === 'fleet'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {t.navFleetView}
              </button>

              <button
                type="button"
                onClick={(e) => { e.preventDefault(); onNavigate('transactions'); }}
                className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center space-x-1.5 rtl:space-x-reverse ${
                  activeView === 'transactions'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Receipt className="w-4 h-4 text-amber-400" />
                <span>{t.navTransactions}</span>
              </button>

              <button
                type="button"
                onClick={(e) => { e.preventDefault(); onNavigate('chat'); }}
                className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center space-x-1.5 rtl:space-x-reverse ${
                  activeView === 'chat'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>{t.navLiveSupport}</span>
              </button>

              {/* Admin Desk Link */}
              {(user?.role === 'admin' || user?.email?.toLowerCase() === 'goog7029766@gmail.com') && (
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); onNavigate('admin'); }}
                  className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center space-x-1.5 rtl:space-x-reverse ${
                    activeView === 'admin'
                      ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20'
                      : 'text-rose-400 hover:text-white hover:bg-rose-500/20'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>{t.navAdminPortal}</span>
                </button>
              )}
            </nav>

            {/* Right Action Controls */}
            <div className="flex items-center space-x-1.5 sm:space-x-3 rtl:space-x-reverse">
              
              {/* Wallet Balance & Quick Actions */}
              <div className="hidden lg:flex items-center bg-slate-950/80 rounded-xl p-1.5 border border-slate-800/90 shadow-inner gap-2">
                <div className="px-2.5 py-1 flex items-center space-x-2 rtl:space-x-reverse border-r rtl:border-r-0 rtl:border-l border-slate-800">
                  <Wallet className="w-4 h-4 text-amber-400" />
                  <div className="text-left rtl:text-right">
                    <p className="text-[9px] text-slate-400 font-semibold">{currentLang === 'ar' ? 'محفظة الاستثمار' : 'Investment'}</p>
                    <p className="text-xs font-extrabold text-amber-400 font-mono">
                      ${(user?.investmentBalance ?? user?.usdtBalance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <div className="px-2.5 py-1 flex items-center space-x-2 rtl:space-x-reverse">
                  <Wallet className="w-4 h-4 text-blue-400" />
                  <div className="text-left rtl:text-right">
                    <p className="text-[9px] text-slate-400 font-semibold">{currentLang === 'ar' ? 'المحفظة الرئيسية' : 'Main Wallet'}</p>
                    <p className="text-xs font-extrabold text-blue-400 font-mono">
                      ${(user?.mainBalance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {onOpenTransferModal && (
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); onOpenTransferModal(); }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs transition-all border border-slate-700 flex items-center space-x-1 rtl:space-x-reverse"
                    title={currentLang === 'ar' ? 'تحويل بين المحافظ' : 'Transfer Between Wallets'}
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span>{currentLang === 'ar' ? 'تحويل' : 'Transfer'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); onOpenDeposit(); }}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center space-x-1 rtl:space-x-reverse"
                >
                  <span>+</span>
                  <span>{t.navDeposit}</span>
                </button>

                {onOpenWithdrawal && (
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); onOpenWithdrawal(); }}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20 flex items-center space-x-1 rtl:space-x-reverse"
                  >
                    <span>{currentLang === 'ar' ? 'سحب' : 'Withdraw'}</span>
                  </button>
                )}
              </div>

              {/* KYC Status Badge */}
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); onOpenKYC(); }}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold border flex items-center space-x-1 sm:space-x-1.5 rtl:space-x-reverse transition-all ${getKycBadgeClass(
                  user?.kycStatus || 'not_submitted'
                )}`}
              >
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{t.kycStatus}:</span>
                <span>{getKycBadgeText(user?.kycStatus || 'not_submitted')}</span>
              </button>

              {/* Notification Bell Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setNotifMenuOpen(!notifMenuOpen); }}
                  className="p-2 sm:p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 relative transition-all"
                >
                  <Bell className="w-4 h-4 text-amber-400" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notifMenuOpen && (
                  <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-3 z-50 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 px-1">
                      <span className="text-xs font-black text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>{t.notificationCenter || (currentLang === 'ar' ? 'مركز الإشعارات' : 'Notifications')}</span>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-mono text-[10px] font-bold">
                            {unreadCount}
                          </span>
                        )}
                      </span>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && onMarkAllNotificationsRead && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              onMarkAllNotificationsRead();
                            }}
                            className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                            title={t.markAllAsRead || 'Mark all as read'}
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>{t.markAllAsRead || 'تحديد الكل كمقروء'}</span>
                          </button>
                        )}
                        {notifications.length > 0 && onClearNotifications && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              onClearNotifications();
                            }}
                            className="text-[10px] text-slate-500 hover:text-rose-400 transition"
                            title={t.clearAllNotifications || 'Clear all'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setNotifFilter('all');
                        }}
                        className={`flex-1 py-1 rounded-lg text-center transition ${
                          notifFilter === 'all'
                            ? 'bg-slate-800 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {t.notificationsAll || 'الكل'} ({notifications.length})
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setNotifFilter('unread');
                        }}
                        className={`flex-1 py-1 rounded-lg text-center transition ${
                          notifFilter === 'unread'
                            ? 'bg-slate-800 text-amber-400 shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {t.notificationsUnread || 'غير المقروءة'} ({unreadCount})
                      </button>
                    </div>

                    {/* Notifications List */}
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {displayedNotifications.length === 0 ? (
                        <div className="text-center py-6 text-slate-500 text-xs space-y-1">
                          <Bell className="w-6 h-6 mx-auto opacity-40 text-slate-400" />
                          <p>{t.noNotifications || 'لا توجد إشعارات جديدة حالياً'}</p>
                        </div>
                      ) : (
                        displayedNotifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => {
                              if (!notif.read && onMarkNotificationRead) {
                                onMarkNotificationRead(notif.id);
                              }
                              if (onNotificationClick) {
                                onNotificationClick(notif);
                                setNotifMenuOpen(false);
                              }
                            }}
                            className={`p-2.5 rounded-xl border text-xs transition cursor-pointer relative group ${
                              !notif.read
                                ? 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/15'
                                : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <div className="mt-0.5 p-1.5 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                                {getNotifIcon(notif)}
                              </div>
                              <div className="flex-1 min-w-0 space-y-0.5">
                                <div className="flex items-center justify-between gap-1">
                                  <span className={`font-bold truncate ${!notif.read ? 'text-amber-200' : 'text-slate-200'}`}>
                                    {getNotifTitle(notif)}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono shrink-0">
                                    {formatNotifTime(notif.createdAt)}
                                  </span>
                                </div>
                                <p className="text-[11px] leading-relaxed text-slate-300 line-clamp-2">
                                  {getNotifMessage(notif)}
                                </p>
                                {notif.amount && (
                                  <div className="pt-0.5 font-mono text-[10px] text-emerald-400 font-bold">
                                    ${notif.amount.toLocaleString()} USDT
                                  </div>
                                )}
                              </div>
                            </div>
                            {!notif.read && (
                              <span className="absolute top-2.5 right-2 rtl:right-auto rtl:left-2 w-1.5 h-1.5 bg-amber-400 rounded-full" />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Language Switcher Dropdown (Desktop) */}
              <div className="relative hidden sm:block">
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setLangMenuOpen(!langMenuOpen); }}
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 flex items-center space-x-1.5 rtl:space-x-reverse text-xs font-medium transition-all"
                >
                  <Globe className="w-4 h-4 text-amber-400" />
                  <span className="uppercase">{currentLang}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {langMenuOpen && (
                  <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-44 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1 z-50">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        onLanguageChange('ar');
                        setLangMenuOpen(false);
                      }}
                      className={`w-full text-left rtl:text-right px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between ${
                        currentLang === 'ar' ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>{t.langArabic}</span>
                      <span className="text-[10px] text-slate-500">RTL</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        onLanguageChange('en');
                        setLangMenuOpen(false);
                      }}
                      className={`w-full text-left rtl:text-right px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between ${
                        currentLang === 'en' ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>{t.langEnglish}</span>
                      <span className="text-[10px] text-slate-500">LTR</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        onLanguageChange('ckb');
                        setLangMenuOpen(false);
                      }}
                      className={`w-full text-left rtl:text-right px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between ${
                        currentLang === 'ckb' ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>{t.langKurdish}</span>
                      <span className="text-[10px] text-slate-500">RTL</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Admin Switch Toggle Button (Only for admins) */}
              {(user?.role === 'admin' || user?.email?.toLowerCase() === 'goog7029766@gmail.com') && (
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); onToggleAdminView(); }}
                  className={`hidden sm:flex px-3 py-2 rounded-xl text-xs font-bold border transition-all items-center space-x-1.5 rtl:space-x-reverse shadow-md ${
                    isAdminView
                      ? 'bg-amber-500 text-slate-950 border-amber-400 hover:bg-amber-400'
                      : 'bg-slate-800 text-amber-400 border-amber-500/40 hover:bg-slate-700'
                  }`}
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>{isAdminView ? (currentLang === 'ar' ? 'العودة كمستثمر' : 'Return as Investor') : t.switchToAdmin}</span>
                </button>
              )}

              {/* User Avatar Menu Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setUserMenuOpen(!userMenuOpen); }}
                  className="p-1 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 hover:border-amber-500/50 flex items-center gap-1.5 sm:gap-2 transition-all"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs border border-amber-500/30">
                    {user?.name ? user.name.charAt(0) : 'U'}
                  </div>
                  <div className="hidden sm:block text-right rtl:text-right ltr:text-left">
                    <div className="text-xs font-bold text-slate-200 truncate max-w-[100px]">{user?.name}</div>
                    <div className="text-[10px] text-amber-400 font-mono uppercase">{user?.role}</div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-52 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50">
                    <div className="px-3 py-2 border-b border-slate-800 mb-1">
                      <p className="text-xs font-bold text-slate-100">{user?.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                      <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono uppercase">
                        {user?.role}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setUserMenuOpen(false);
                        onOpenProfile();
                      }}
                      className="w-full text-left rtl:text-right px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 flex items-center gap-2 mb-0.5 transition-all"
                    >
                      <UserIcon className="w-4 h-4 text-amber-400" />
                      <span>{t.menuProfile}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setUserMenuOpen(false);
                        onNavigate('transactions');
                      }}
                      className="w-full text-left rtl:text-right px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 flex items-center gap-2 mb-0.5 transition-all"
                    >
                      <Receipt className="w-4 h-4 text-amber-400" />
                      <span>{t.navTransactions}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setUserMenuOpen(false);
                        onOpenSettings();
                      }}
                      className="w-full text-left rtl:text-right px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 flex items-center gap-2 mb-1 transition-all"
                    >
                      <Settings className="w-4 h-4 text-amber-400" />
                      <span>{t.menuSettings}</span>
                    </button>

                    {(user?.role === 'admin' || user?.email?.toLowerCase() === 'goog7029766@gmail.com') && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          onNavigate('admin');
                          setUserMenuOpen(false);
                        }}
                        className="w-full text-left rtl:text-right px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 mb-1"
                      >
                        <Shield className="w-4 h-4" />
                        <span>{t.navAdminPortal}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setUserMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left rtl:text-right px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-rose-400 hover:bg-slate-800 flex items-center gap-2 transition-all border-t border-slate-800 pt-2"
                    >
                      <LogOut className="w-4 h-4 text-rose-400" />
                      <span>{t.logoutBtn}</span>
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </header>

      {/* FULL-HEIGHT SLIDING SIDE MENU DRAWER (Mobile & Tablet) */}
      {sideMenuOpen && (
        <div className="fixed inset-0 z-50 flex animate-fade-in">
          
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setSideMenuOpen(false)}
          />

          {/* Sliding Side Panel */}
          <div
            className={`fixed top-0 bottom-0 ${
              isRtl ? 'right-0 border-l' : 'left-0 border-r'
            } z-50 w-80 max-w-[85vw] bg-slate-900 border-slate-800 p-5 flex flex-col justify-between overflow-y-auto shadow-2xl transition-transform duration-300`}
          >
            <div className="space-y-6">
              
              {/* Drawer Top Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 font-extrabold shadow-md">
                    <Truck className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-white">{t.brandName}</h2>
                    <p className="text-[10px] text-amber-400 font-semibold">{t.sideMenuTitle}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setSideMenuOpen(false); }}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Quick Info & Dual Wallet Card */}
              <div
                onClick={(e) => {
                  e.preventDefault();
                  setSideMenuOpen(false);
                  onOpenProfile();
                }}
                className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 cursor-pointer hover:border-amber-500/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-sm border border-amber-500/30 shrink-0">
                    {user?.name ? user.name.charAt(0) : 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white truncate group-hover:text-amber-400 transition-colors">{user?.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{user?.email}</div>
                  </div>
                </div>

                {/* Dual Wallet Balances */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
                  <div className="bg-slate-900/90 p-2 rounded-xl border border-amber-500/20">
                    <span className="text-[9px] text-amber-400 font-bold block">{currentLang === 'ar' ? 'الاستثمار' : 'Investment'}</span>
                    <span className="text-xs font-black text-amber-400 font-mono">
                      ${(user?.investmentBalance ?? user?.usdtBalance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="bg-slate-900/90 p-2 rounded-xl border border-blue-500/20">
                    <span className="text-[9px] text-blue-400 font-bold block">{currentLang === 'ar' ? 'الرئيسية' : 'Main'}</span>
                    <span className="text-xs font-black text-blue-400 font-mono">
                      ${(user?.mainBalance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Requested Side Menu Options List */}
              <div className="space-y-1.5 text-xs">
                
                {/* 1. Profile */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setSideMenuOpen(false);
                    onOpenProfile();
                  }}
                  className="w-full p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-100 font-semibold flex items-center gap-3 border border-slate-800/80 hover:border-amber-500/40 transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <span className="flex-1 text-left rtl:text-right">{t.menuProfile}</span>
                </button>

                {/* 2. Transfer Between Wallets */}
                {onOpenTransferModal && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setSideMenuOpen(false);
                      onOpenTransferModal();
                    }}
                    className="w-full p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-amber-400 font-semibold flex items-center gap-3 border border-amber-500/30 transition-all"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                      <ArrowLeftRight className="w-4 h-4" />
                    </div>
                    <span className="flex-1 text-left rtl:text-right font-bold">
                      {currentLang === 'ar' ? 'تحويل بين المحافظ' : 'Transfer Between Wallets'}
                    </span>
                  </button>
                )}

                {/* 2. Verification (KYC) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setSideMenuOpen(false);
                    onOpenKYC();
                  }}
                  className="w-full p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-100 font-semibold flex items-center gap-3 border border-slate-800/80 hover:border-amber-500/40 transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="flex-1 text-left rtl:text-right">{t.menuKyc}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded border ${getKycBadgeClass(user?.kycStatus)}`}>
                    {getKycBadgeText(user?.kycStatus)}
                  </span>
                </button>

                {/* 3. Deposit Options */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setSideMenuOpen(false);
                    onNavigate('transactions');
                  }}
                  className="w-full p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-100 font-semibold flex items-center gap-3 border border-slate-800/80 hover:border-amber-500/40 transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <span className="flex-1 text-left rtl:text-right">{t.navTransactions}</span>
                </button>

                {/* 4. Deposit Options */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setSideMenuOpen(false);
                    onOpenDeposit();
                  }}
                  className="w-full p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-100 font-semibold flex items-center gap-3 border border-slate-800/80 hover:border-amber-500/40 transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                    <ArrowDownRight className="w-4 h-4" />
                  </div>
                  <span className="flex-1 text-left rtl:text-right">{t.menuDeposit}</span>
                </button>

                {/* 4. Withdraw Options */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setSideMenuOpen(false);
                    if (onOpenWithdrawal) onOpenWithdrawal();
                  }}
                  className="w-full p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-100 font-semibold flex items-center gap-3 border border-slate-800/80 hover:border-amber-500/40 transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                    <ArrowUpLeft className="w-4 h-4" />
                  </div>
                  <span className="flex-1 text-left rtl:text-right">{t.menuWithdraw}</span>
                </button>

                {/* 5. Technical Support */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setSideMenuOpen(false);
                    onNavigate('chat');
                  }}
                  className="w-full p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-100 font-semibold flex items-center gap-3 border border-slate-800/80 hover:border-amber-500/40 transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
                    <Headset className="w-4 h-4" />
                  </div>
                  <span className="flex-1 text-left rtl:text-right">{t.menuSupport}</span>
                </button>

                {/* 6. Account Settings */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setSideMenuOpen(false);
                    onOpenSettings();
                  }}
                  className="w-full p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-100 font-semibold flex items-center gap-3 border border-slate-800/80 hover:border-amber-500/40 transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                    <Settings className="w-4 h-4" />
                  </div>
                  <span className="flex-1 text-left rtl:text-right">{t.menuSettings}</span>
                </button>

                {/* 7. Admin Dashboard Link (Admin/Founder) */}
                {(user?.role === 'admin' || user?.email?.toLowerCase() === 'goog7029766@gmail.com') && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setSideMenuOpen(false);
                      onNavigate('admin');
                    }}
                    className="w-full p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold flex items-center gap-3 border border-rose-500/30 transition-all"
                  >
                    <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                      <Shield className="w-4 h-4" />
                    </div>
                    <span className="flex-1 text-left rtl:text-right">{t.navAdminPortal}</span>
                  </button>
                )}

              </div>

              {/* Theme Toggle Switcher (Light vs Dark Mode) */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>{t.themeToggle}</span>
                  <span className="text-[10px] text-amber-400 font-mono uppercase">{theme}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      if (theme !== 'light') onToggleTheme();
                    }}
                    className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                      theme === 'light'
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    <span>{t.lightMode}</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      if (theme !== 'dark') onToggleTheme();
                    }}
                    className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                      theme === 'dark'
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                    <span>{t.darkMode}</span>
                  </button>
                </div>
              </div>

              {/* Language Selector in Drawer */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{currentLang === 'ar' ? 'اللغة' : 'Language'}</p>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); onLanguageChange('ar'); }}
                    className={`flex-1 py-1.5 text-xs rounded-lg font-bold border transition-all ${
                      currentLang === 'ar'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    العربية
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); onLanguageChange('en'); }}
                    className={`flex-1 py-1.5 text-xs rounded-lg font-bold border transition-all ${
                      currentLang === 'en'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); onLanguageChange('ckb'); }}
                    className={`flex-1 py-1.5 text-xs rounded-lg font-bold border transition-all ${
                      currentLang === 'ckb'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    كوردى
                  </button>
                </div>
              </div>

            </div>

            {/* Logout Button */}
            <div className="pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setSideMenuOpen(false);
                  onLogout();
                }}
                className="w-full py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs border border-rose-500/30 flex items-center justify-center gap-2 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>{t.logoutBtn}</span>
              </button>
            </div>

          </div>

        </div>
      )}
    </>
  );
};
