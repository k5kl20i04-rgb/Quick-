import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { ProjectCard } from './components/ProjectCard';
import { InvestmentModal } from './components/InvestmentModal';
import { DepositModalAndChat } from './components/DepositModalAndChat';
import { WithdrawalModalAndChat } from './components/WithdrawalModalAndChat';
import { SupportModalAndChat } from './components/SupportModalAndChat';
import { KYCModal } from './components/KYCModal';
import { PortfolioView } from './components/PortfolioView';
import { FleetGallery } from './components/FleetGallery';
import { ROIAnalytics } from './components/ROIAnalytics';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { AuthPage } from './components/AuthPage';
import { AccessDenied } from './components/AccessDenied';
import { ProfileModal } from './components/ProfileModal';
import { SettingsModal } from './components/SettingsModal';
import { DashboardView } from './components/DashboardView';
import { PlanUpgradeModal } from './components/PlanUpgradeModal';
import { ReferralModal } from './components/ReferralModal';
import { WalletTransferModal } from './components/WalletTransferModal';
import { TransactionLedger } from './components/TransactionLedger';

import {
  Language,
  Project,
  User,
  AdminSettings,
  Investment,
  DepositRequest,
  KYCSubmission,
  WithdrawalRequest,
  VehicleCategory,
  NetworkType,
  ProjectStatus,
  PayoutMethod,
  SupportTicket,
  AppNotification,
  FreightTrip,
} from './types';
import {
  supabase,
  isSupabaseClientConfigured,
  getSupabaseProfile,
  upsertSupabaseProfile,
  getSupabaseFleets,
  upsertSupabaseFleet,
  updateSupabaseFleetStatus,
  deleteSupabaseFleet,
  getSupabaseInvestments,
  insertSupabaseInvestment,
  getSupabaseTransactions,
  getSupabaseDeposits,
  insertSupabaseDeposit,
  updateSupabaseDeposit,
  getSupabaseWithdrawals,
  insertSupabaseWithdrawal,
  updateSupabaseWithdrawal,
  getSupabaseNotifications,
  insertSupabaseNotification,
  markSupabaseNotificationRead,
  markAllSupabaseNotificationsRead,
  clearSupabaseNotifications,
  subscribeToSupabaseRealtime,
  getSupabaseAdminSettings,
  upsertSupabaseAdminSettings,
  getSupabaseTrips,
  getSupabaseSupportTickets,
  insertSupabaseSupportTicket,
  insertSupabaseSupportMessage,
  updateSupabaseSupportTicketStatus,
} from './lib/supabaseClient';
import { translations } from './i18n/translations';
import { Truck, Users, LayoutGrid } from 'lucide-react';

export default function App() {
  const [currentLang, setCurrentLang] = useState<Language>('ar');

  // Helper to determine initial view & admin view from location & sessionStorage
  const getInitialRouteState = (): { view: 'dashboard' | 'portfolio' | 'fleet' | 'transactions' | 'kyc' | 'admin' | 'chat'; isAdmin: boolean } => {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const savedView = sessionStorage.getItem('aseel_active_view');
    const savedIsAdmin = sessionStorage.getItem('aseel_is_admin_view');

    if (path === '/admin' || hash.includes('admin') || savedIsAdmin === 'true' || savedView === 'admin') {
      return { view: 'admin', isAdmin: true };
    }
    if (path === '/portfolio' || hash.includes('portfolio') || savedView === 'portfolio') {
      return { view: 'portfolio', isAdmin: false };
    }
    if (path === '/fleet' || hash.includes('fleet') || savedView === 'fleet') {
      return { view: 'fleet', isAdmin: false };
    }
    if (path === '/transactions' || hash.includes('transactions') || savedView === 'transactions') {
      return { view: 'transactions', isAdmin: false };
    }
    if (path === '/kyc' || hash.includes('kyc') || savedView === 'kyc') {
      return { view: 'kyc', isAdmin: false };
    }
    if (savedView && ['dashboard', 'portfolio', 'fleet', 'transactions', 'kyc', 'admin', 'chat'].includes(savedView)) {
      return { view: savedView as any, isAdmin: savedView === 'admin' };
    }
    return { view: 'dashboard', isAdmin: false };
  };

  const initialRoute = getInitialRouteState();
  const [activeView, setActiveView] = useState<
    'dashboard' | 'portfolio' | 'fleet' | 'transactions' | 'kyc' | 'admin' | 'chat'
  >(initialRoute.view);
  const [isAdminView, setIsAdminView] = useState<boolean>(initialRoute.isAdmin);

  // App Data State
  const [user, setUserRaw] = useState<User | null>(() => {
    try {
      const savedSession = localStorage.getItem('aseel_user_session') || localStorage.getItem('aseel_user');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed && typeof parsed === 'object' && parsed.id) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('⚠️ [App] Error loading saved session from localStorage:', e);
    }
    return null;
  });

  const normalizeUser = (next: User | null, prev?: User | null): User | null => {
    if (!next) return null;

    const mainBal = next.mainBalance ?? prev?.mainBalance ?? 0;
    const invBal = next.investmentBalance ?? prev?.investmentBalance ?? next.usdtBalance ?? 0;
    const totalUsdt = mainBal + invBal;

    const normalized: User = {
      ...next,
      mainBalance: mainBal,
      investmentBalance: invBal,
      usdtBalance: totalUsdt,
    };

    if (next.email?.toLowerCase() === 'goog7029766@gmail.com') {
      return {
        ...normalized,
        role: 'admin',
        kycStatus: 'approved',
        accountStatus: 'active',
        name: 'مؤسس المنشأة والمالك الرئيسي (Founder & Main Owner)',
      };
    }
    return normalized;
  };

  const setUser = (u: User | null | ((prev: User | null) => User | null)) => {
    setUserRaw((prev) => {
      const next = typeof u === 'function' ? u(prev) : u;
      const normalized = normalizeUser(next, prev);
      if (normalized) {
        try {
          localStorage.setItem('aseel_user_session', JSON.stringify(normalized));
          localStorage.setItem('aseel_user', JSON.stringify(normalized));
        } catch (e) {
          console.warn('⚠️ Error saving user session:', e);
        }
      } else {
        localStorage.removeItem('aseel_user_session');
        localStorage.removeItem('aseel_user');
      }
      return normalized;
    });
  };

  const [projects, setProjects] = useState<Project[]>([]);
  const [adminSettings, setAdminSettings] = useState<AdminSettings | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [kycData, setKycData] = useState<KYCSubmission | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [trips, setTrips] = useState<FreightTrip[]>([]);
  
  // Track initial load vs background sync
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  // Modals & Theme
  const [theme, setTheme] = useState<'dark' | 'light'>(
    () => (localStorage.getItem('theme') as 'dark' | 'light') || 'dark'
  );
  const [selectedProjectForInvest, setSelectedProjectForInvest] = useState<Project | null>(null);
  
  // Persisted Modal States across updates/refreshes
  const [showDepositModal, setShowDepositModal] = useState<boolean>(
    () => sessionStorage.getItem('aseel_modal_deposit') === 'true'
  );
  const [showWithdrawalModal, setShowWithdrawalModal] = useState<boolean>(
    () => sessionStorage.getItem('aseel_modal_withdrawal') === 'true'
  );
  const [showSupportModal, setShowSupportModal] = useState<boolean>(
    () => sessionStorage.getItem('aseel_modal_support') === 'true'
  );
  const [showKycModal, setShowKycModal] = useState<boolean>(
    () => sessionStorage.getItem('aseel_modal_kyc') === 'true'
  );
  const [showProfileModal, setShowProfileModal] = useState<boolean>(
    () => sessionStorage.getItem('aseel_modal_profile') === 'true'
  );
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(
    () => sessionStorage.getItem('aseel_modal_settings') === 'true'
  );
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(
    () => sessionStorage.getItem('aseel_modal_upgrade') === 'true'
  );
  const [showReferralModal, setShowReferralModal] = useState<boolean>(false);
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);

  // Sync Modal State to SessionStorage
  useEffect(() => {
    sessionStorage.setItem('aseel_modal_deposit', String(showDepositModal));
    sessionStorage.setItem('aseel_modal_withdrawal', String(showWithdrawalModal));
    sessionStorage.setItem('aseel_modal_support', String(showSupportModal));
    sessionStorage.setItem('aseel_modal_kyc', String(showKycModal));
    sessionStorage.setItem('aseel_modal_profile', String(showProfileModal));
    sessionStorage.setItem('aseel_modal_settings', String(showSettingsModal));
    sessionStorage.setItem('aseel_modal_upgrade', String(showUpgradeModal));
  }, [
    showDepositModal,
    showWithdrawalModal,
    showSupportModal,
    showKycModal,
    showProfileModal,
    showSettingsModal,
    showUpgradeModal,
  ]);

  // Filter for dashboard listing
  const [categoryFilter, setCategoryFilter] = useState<'all' | VehicleCategory>('all');

  // Sync RTL / LTR document direction
  useEffect(() => {
    const isRtl = currentLang === 'ar' || currentLang === 'ckb';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;
  }, [currentLang]);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  // Sync activeView & isAdminView to sessionStorage and URL location history
  useEffect(() => {
    sessionStorage.setItem('aseel_active_view', activeView);
    sessionStorage.setItem('aseel_is_admin_view', String(isAdminView));

    const targetPath = isAdminView ? '/admin' : activeView === 'dashboard' ? '/' : `/${activeView}`;
    if (window.location.pathname !== targetPath) {
      window.history.replaceState({ activeView, isAdminView }, '', targetPath);
    }
  }, [activeView, isAdminView]);

  // Handle browser back/forward buttons (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const route = getInitialRouteState();
      setActiveView(route.view);
      setIsAdminView(route.isAdmin);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Listen to Supabase Auth state changes (handles email verification redirect & instant session recovery)
  useEffect(() => {
    if (!isSupabaseClientConfigured()) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('⚡ [Supabase Auth Event]:', event, session?.user?.id);
      if (session?.user && (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED')) {
        try {
          const profile = await getSupabaseProfile(session.user.id);
          if (profile) {
            console.log('✅ [Supabase Auth] Session recovered/verified for:', profile.email);
            setUser(profile);
          }
        } catch (err) {
          console.warn('⚠️ [Supabase Auth] Profile load notice:', err);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch initial full platform state from /api/state and sync with Supabase
  const fetchState = async (silent = true) => {
    try {
      if (!silent && initialLoading) {
        setLoading(true);
      }

      // Fetch server API state with user identity headers
      const headers: Record<string, string> = {};
      if (user?.id) headers['x-user-id'] = user.id;
      if (user?.email) headers['x-user-email'] = user.email;

      let apiData: any = null;
      const res = await fetch('/api/state', { headers }).catch(() => null);
      if (res && res.ok) {
        apiData = await res.json().catch(() => null);
      }

      // Sync directly from Supabase tables for real-time consistency safely
      let sbFleets: Project[] = [];
      let sbInvestments: Investment[] = [];
      let sbTxs: { deposits: DepositRequest[]; withdrawals: WithdrawalRequest[] } = { deposits: [], withdrawals: [] };
      let sbNotifs: AppNotification[] = [];
      let sbSettings: AdminSettings | null = null;
      let sbTrips: FreightTrip[] = [];

      let sbSupportTickets: SupportTicket[] = [];

      if (isSupabaseClientConfigured()) {
        try {
          const session = (await supabase.auth.getSession().catch(() => null))?.data?.session;
          if (session?.user?.id) {
            const profile = await getSupabaseProfile(session.user.id).catch(() => null);
            if (profile) {
              setUser((prev) => {
                if (!prev || prev.id !== profile.id || prev.usdtBalance !== profile.usdtBalance) {
                  return profile;
                }
                return prev;
              });
            }
          }

          const [f, inv, tx, notif, sett, tr, sup] = await Promise.all([
            getSupabaseFleets().catch(() => []),
            getSupabaseInvestments().catch(() => []),
            getSupabaseTransactions().catch(() => ({ deposits: [], withdrawals: [] })),
            getSupabaseNotifications().catch(() => []),
            getSupabaseAdminSettings().catch(() => null),
            getSupabaseTrips().catch(() => []),
            getSupabaseSupportTickets().catch(() => []),
          ]);
          sbFleets = f || [];
          sbInvestments = inv || [];
          if (tx) sbTxs = tx;
          sbNotifs = notif || [];
          sbSettings = sett;
          sbTrips = tr || [];
          sbSupportTickets = sup || [];
        } catch (sbErr) {
          console.warn('Supabase state sync notice:', sbErr);
        }
      }

      // 1. User Update
      if (apiData?.user) {
        setUser((prev) => {
          if (!prev || JSON.stringify(prev) !== JSON.stringify(apiData.user)) {
            return apiData.user;
          }
          return prev;
        });
      }

      // 2. Projects / Fleets Update (Prefer Supabase if populated, else API)
      const nextProjects = sbFleets && sbFleets.length > 0 ? sbFleets : (apiData?.projects || []);
      if (nextProjects.length > 0) {
        setProjects((prev) => {
          if (prev.length === nextProjects.length && JSON.stringify(prev) === JSON.stringify(nextProjects)) {
            return prev;
          }
          return nextProjects;
        });
      }

      // 3. Investments Update
      const nextInvestments = sbInvestments && sbInvestments.length > 0 ? sbInvestments : (apiData?.investments || []);
      if (nextInvestments.length > 0) {
        setInvestments((prev) => {
          if (prev.length === nextInvestments.length && JSON.stringify(prev) === JSON.stringify(nextInvestments)) {
            return prev;
          }
          return nextInvestments;
        });
      }

      // 3b. Freight Trips Update
      const nextTrips = sbTrips && sbTrips.length > 0 ? sbTrips : (apiData?.trips || []);
      if (nextTrips.length > 0) {
        setTrips((prev) => {
          if (prev.length === nextTrips.length && JSON.stringify(prev) === JSON.stringify(nextTrips)) {
            return prev;
          }
          return nextTrips;
        });
      }

      // 4. Admin Settings
      if (sbSettings) {
        setAdminSettings((prev) => {
          const merged = { ...prev, ...sbSettings };
          if (JSON.stringify(prev) === JSON.stringify(merged)) return prev;
          return merged;
        });
      } else if (apiData?.adminSettings) {
        setAdminSettings((prev) => {
          if (JSON.stringify(prev) === JSON.stringify(apiData.adminSettings)) return prev;
          return apiData.adminSettings;
        });
      }

      // 5. Deposits
      const nextDeposits = sbTxs.deposits && sbTxs.deposits.length > 0 ? sbTxs.deposits : (apiData?.deposits || []);
      if (nextDeposits.length > 0) {
        setDeposits((prev) => {
          const map = new Map(prev.map((d) => [d.id, d]));
          nextDeposits.forEach((d) => map.set(d.id, d));
          const arr = Array.from(map.values());
          if (prev.length === arr.length && JSON.stringify(prev) === JSON.stringify(arr)) {
            return prev;
          }
          return arr;
        });
      }

      // 6. Withdrawals
      const nextWithdrawals = sbTxs.withdrawals && sbTxs.withdrawals.length > 0 ? sbTxs.withdrawals : (apiData?.withdrawals || []);
      if (nextWithdrawals.length > 0) {
        setWithdrawals((prev) => {
          const map = new Map(prev.map((w) => [w.id, w]));
          nextWithdrawals.forEach((w) => map.set(w.id, w));
          const arr = Array.from(map.values());
          if (prev.length === arr.length && JSON.stringify(prev) === JSON.stringify(arr)) {
            return prev;
          }
          return arr;
        });
      }

      // 7. KYC
      if (apiData?.kyc) {
        setKycData((prev) => {
          if (JSON.stringify(prev) === JSON.stringify(apiData.kyc)) return prev;
          return apiData.kyc;
        });
      }

      // 8. Support Tickets (Prefer Supabase if present, else API)
      const nextTickets = sbSupportTickets && sbSupportTickets.length > 0 ? sbSupportTickets : (apiData?.supportTickets || []);
      if (nextTickets.length > 0) {
        setSupportTickets((prev) => {
          if (JSON.stringify(prev) === JSON.stringify(nextTickets)) return prev;
          return nextTickets;
        });
      }

      // 9. Notifications
      const nextNotifs = sbNotifs && sbNotifs.length > 0 ? sbNotifs : (apiData?.notifications || []);
      if (nextNotifs.length > 0) {
        setNotifications((prev) => {
          if (prev.length === nextNotifs.length && JSON.stringify(prev) === JSON.stringify(nextNotifs)) {
            return prev;
          }
          return nextNotifs;
        });
      }

    } catch (err) {
      console.warn('Platform state sync notice:', err);
    } finally {
      setInitialLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load: silent = false ONLY on initial mount if data not present
    fetchState(false);
    const interval = setInterval(() => {
      fetchState(true);
    }, 12000);

    // Supabase Real-Time Channel Subscription across all tables
    const unsubscribe = subscribeToSupabaseRealtime({
      onNotification: (newNotif) => {
        setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== newNotif.id)]);
      },
      onDepositUpdate: (depositUpdate) => {
        setDeposits((prev) =>
          prev.map((d) => (d.id === depositUpdate.id ? depositUpdate : d))
        );
      },
      onWithdrawalUpdate: (withdrawalUpdate) => {
        setWithdrawals((prev) =>
          prev.map((w) => (w.id === withdrawalUpdate.id ? withdrawalUpdate : w))
        );
      },
      onProfileUpdate: (userUpdate) => {
        setUser((prev) => (prev && prev.id === userUpdate.id ? { ...prev, ...userUpdate } : prev));
      },
      onFleetUpdate: (fleetUpdate) => {
        setProjects((prev) =>
          prev.map((p) => (p.id === fleetUpdate.id ? fleetUpdate : p))
        );
      },
      onInvestmentUpdate: (invUpdate) => {
        setInvestments((prev) => [invUpdate, ...prev.filter((i) => i.id !== invUpdate.id)]);
      },
      onSupportTicketUpdate: (ticketUpdate) => {
        setSupportTickets((prev) => {
          const idx = prev.findIndex((t) => t.id === ticketUpdate.id);
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], ...ticketUpdate, messages: updated[idx].messages };
            return updated;
          }
          return [ticketUpdate, ...prev];
        });
      },
      onSupportMessageInsert: (ticketId, message) => {
        setSupportTickets((prev) =>
          prev.map((t) => {
            if (t.id === ticketId) {
              if (t.messages.some((m) => m.id === message.id)) return t;
              return { ...t, messages: [...t.messages, message], updatedAt: new Date().toISOString() };
            }
            return t;
          })
        );
      },
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error', err);
    } finally {
      setUser(null);
      setIsAdminView(false);
      setActiveView('dashboard');
    }
  };

  const handleAuthSuccess = async (authUser: User) => {
    try {
      const normalized = normalizeUser(authUser);
      setUser(normalized);

      const isUserAdmin = normalized?.role === 'admin' || normalized?.email?.toLowerCase() === 'goog7029766@gmail.com';

      // Route Navigation
      if (isUserAdmin) {
        setIsAdminView(true);
        setActiveView('admin');
        if (window.location.pathname !== '/admin') {
          window.history.pushState({}, '', '/admin');
        }
      } else {
        const path = window.location.pathname.toLowerCase().replace('/', '');
        const savedView = sessionStorage.getItem('aseel_active_view');
        const allowedViews = ['dashboard', 'portfolio', 'fleet', 'transactions', 'kyc', 'chat'];
        const viewToUse = allowedViews.includes(path)
          ? (path as any)
          : allowedViews.includes(savedView || '')
          ? (savedView as any)
          : 'dashboard';

        setIsAdminView(false);
        setActiveView(viewToUse);
        const targetPath = viewToUse === 'dashboard' ? '/' : `/${viewToUse}`;
        if (window.location.pathname !== targetPath) {
          window.history.pushState({}, '', targetPath);
        }
      }

      // Sync profile directly to Supabase safely
      if (normalized) {
        try {
          await upsertSupabaseProfile(normalized);
        } catch (err) {
          console.warn('Supabase profile sync notice:', err);
        }
      }

      // Refresh platform state silently (silent=true) so loading screen does not block UI
      await fetchState(true);
    } catch (err) {
      console.error('Error in handleAuthSuccess:', err);
    }
  };

  // Notification actions
  const handleMarkNotificationRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch(() => {});
    markSupabaseNotificationRead(id).catch(() => {});
  };

  const handleMarkAllNotificationsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    fetch('/api/notifications/read-all', { method: 'POST' }).catch(() => {});
    markAllSupabaseNotificationsRead(user?.id).catch(() => {});
  };

  const handleClearNotifications = async () => {
    setNotifications([]);
    fetch('/api/notifications/clear', { method: 'POST' }).catch(() => {});
  };

  const handleNotificationClick = (notif: AppNotification) => {
    if (notif.linkAction === 'portfolio') {
      setIsAdminView(false);
      setActiveView('portfolio');
    } else if (notif.linkAction === 'deposit') {
      setShowDepositModal(true);
    } else if (notif.linkAction === 'withdrawal') {
      setShowWithdrawalModal(true);
    } else if (notif.linkAction === 'kyc') {
      setShowKycModal(true);
    } else if (notif.linkAction === 'chat') {
      setShowSupportModal(true);
    } else if (notif.linkAction === 'dashboard') {
      setIsAdminView(false);
      setActiveView('dashboard');
    }
  };

  // API Actions
  const handleConfirmInvest = async (amount: number) => {
    if (!selectedProjectForInvest) return;
    const res = await fetch('/api/invest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: selectedProjectForInvest.id,
        amount,
        agreeToLockup: true,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Investment failed');
    }
    const data = await res.json();
    if (data.investment) {
      insertSupabaseInvestment(data.investment).catch(() => {});
    }
    if (data.user) {
      upsertSupabaseProfile(data.user).catch(() => {});
      setUser(data.user);
    }
    await fetchState();
  };

  const handleConnectDeposit = async () => {
    const res = await fetch('/api/deposits/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    if (data.deposit) {
      insertSupabaseDeposit(data.deposit).catch(() => {});
    }
    await fetchState();
    return data.deposit;
  };

  const handleStartDeposit = async (amount: number, network: NetworkType, userNote?: string) => {
    try {
      const res = await fetch('/api/deposits/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, network, userNote }),
      });
      const data = await res.json().catch(() => ({}));
      
      let depositObj: DepositRequest = data.deposit;
      if (!depositObj || !depositObj.id) {
        const fallbackId = `dep-${Date.now()}`;
        depositObj = {
          id: fallbackId,
          userId: user?.id || 'investor',
          userName: user?.name || 'المستثمر',
          userEmail: user?.email || '',
          amount: Number(amount) || 0,
          network: network || 'TRC20',
          status: 'pending',
          createdAt: new Date().toISOString(),
          userNote: userNote || '',
          chatMessages: [],
        };
      } else {
        depositObj.status = 'pending';
      }

      insertSupabaseDeposit(depositObj).catch(() => {});
      setDeposits((prev) => [depositObj, ...prev.filter((d) => d.id !== depositObj.id)]);
      await fetchState().catch(() => {});
      return depositObj;
    } catch (err) {
      console.error('⚠️ [App] Error starting deposit:', err);
      const fallbackId = `dep-${Date.now()}`;
      const fallbackDep: DepositRequest = {
        id: fallbackId,
        userId: user?.id || 'investor',
        userName: user?.name || 'المستثمر',
        userEmail: user?.email || '',
        amount: Number(amount) || 0,
        network: network || 'TRC20',
        status: 'pending',
        createdAt: new Date().toISOString(),
        userNote: userNote || '',
        chatMessages: [],
      };
      insertSupabaseDeposit(fallbackDep).catch(() => {});
      setDeposits((prev) => [fallbackDep, ...prev.filter((d) => d.id !== fallbackDep.id)]);
      return fallbackDep;
    }
  };

  const handleSendMessage = async (
    depositId: string,
    text: string,
    receiptUrl?: string,
    txHash?: string
  ) => {
    await fetch('/api/deposits/' + depositId + '/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, receiptUrl, txHash, sender: 'user' }),
    });
    await fetchState();
  };

  const handleAdminSendChatMessage = async (depositId: string, text: string) => {
    await fetch('/api/deposits/' + depositId + '/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, sender: 'admin' }),
    });
    await fetchState();
  };

  const handleSubmitKYC = async (payload: {
    fullName: string;
    idNumber: string;
    nationalIdFront: string;
    nationalIdBack: string;
    housingCard: string;
  }) => {
    await fetch('/api/kyc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    await fetchState();
  };

  const handleRequestWithdrawal = async (investmentId: string, destinationWallet: string) => {
    const res = await fetch('/api/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ investmentId, destinationWallet }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Withdrawal failed');
    }
    await fetchState();
  };

  const handleConnectWithdrawal = async () => {
    const res = await fetch('/api/withdrawals/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    await fetchState();
    return data.withdrawal;
  };

  const handleAcceptWithdrawalConnection = async (withdrawalId: string) => {
    await fetch(`/api/withdrawals/${withdrawalId}/accept-connection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    await fetchState();
  };

  const handleSubmitWithdrawalDetails = async (
    withdrawalId: string,
    amount: number,
    payoutMethod: PayoutMethod,
    payoutDetails: string,
    receiptUrl?: string,
    txHash?: string
  ) => {
    const res = await fetch(`/api/withdrawals/${withdrawalId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, payoutMethod, payoutDetails, receiptUrl, txHash }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit withdrawal details');
    }
    const data = await res.json();
    await fetchState();
    return data.withdrawal;
  };

  const handleStartWithdrawal = async (
    amount: number,
    payoutMethod: PayoutMethod,
    payoutDetails: string,
    investmentId?: string
  ) => {
    const res = await fetch('/api/withdrawals/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, payoutMethod, payoutDetails, investmentId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Withdrawal request failed');
    }
    const data = await res.json();
    if (data.withdrawal) {
      insertSupabaseWithdrawal(data.withdrawal).catch(() => {});
      setWithdrawals((prev) => [data.withdrawal, ...prev.filter((w) => w.id !== data.withdrawal.id)]);
    }
    await fetchState();
    return data.withdrawal;
  };

  const handleSendWithdrawalChatMessage = async (
    withdrawalId: string,
    text: string,
    receiptUrl?: string,
    txHash?: string
  ) => {
    await fetch(`/api/withdrawals/${withdrawalId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, receiptUrl, txHash, sender: 'user' }),
    });
    await fetchState();
  };

  const handleAdminSendWithdrawalChatMessage = async (withdrawalId: string, text: string) => {
    await fetch(`/api/withdrawals/${withdrawalId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, sender: 'admin' }),
    });
    await fetchState();
  };

  const handleReviewWithdrawal = async (
    id: string,
    status: 'approved' | 'rejected',
    note?: string,
    txHash?: string
  ) => {
    const res = await fetch(`/api/withdrawals/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, adminNote: note, txHash }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.withdrawal) {
        updateSupabaseWithdrawal(data.withdrawal).catch(() => {});
        setWithdrawals((prev) => prev.map((w) => (w.id === id ? data.withdrawal : w)));
      }
      if (data.user) {
        upsertSupabaseProfile(data.user).catch(() => {});
        setUser((prev) => (prev && prev.id === data.user.id ? data.user : prev));
      }
    }
    await fetchState();
  };

  // Support Ticket Actions
  const handleCreateSupportTicket = async (
    info:
      | { fullName: string; phone: string; email: string; initialMessage?: string; subject?: string }
      | string,
    phoneArg?: string,
    emailArg?: string,
    initialMessageArg?: string,
    subjectArg?: string
  ) => {
    let fullNameStr = '';
    let phoneStr = '';
    let emailStr = '';
    let initialMessageStr = '';
    let subjectStr = '';

    if (typeof info === 'object' && info !== null) {
      fullNameStr = info.fullName;
      phoneStr = info.phone;
      emailStr = info.email;
      initialMessageStr = info.initialMessage || '';
      subjectStr = info.subject || '';
    } else {
      fullNameStr = typeof info === 'string' ? info : '';
      phoneStr = phoneArg || '';
      emailStr = emailArg || '';
      initialMessageStr = initialMessageArg || '';
      subjectStr = subjectArg || '';
    }

    const res = await fetch('/api/support/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: fullNameStr,
        phone: phoneStr,
        email: emailStr,
        initialMessage: initialMessageStr,
        subject: subjectStr,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create support ticket');
    }
    const data = await res.json();
    await fetchState();
    return data.ticket as SupportTicket;
  };

  const handleSendSupportMessage = async (ticketId: string, text: string) => {
    await fetch(`/api/support/${ticketId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, sender: 'user' }),
    });
    await fetchState();
  };

  const handleAdminSendSupportMessage = async (ticketId: string, text: string) => {
    await fetch(`/api/support/${ticketId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, sender: 'admin' }),
    });
    await fetchState();
  };

  const handleCloseSupportTicket = async (ticketId: string) => {
    await fetch(`/api/support/${ticketId}/close`, { method: 'POST' });
    await fetchState();
  };

  // Admin Fleet Actions
  const handleSaveProject = async (proj: Partial<Project>) => {
    const fullProj = {
      id: proj.id || `proj-${Date.now()}`,
      title: proj.title || { ar: 'مشروع أسطول جديد', en: 'New Fleet Project', ckb: 'پڕۆژەی نوێی کاروان' },
      category: proj.category || 'cargo_freight',
      description: proj.description || { ar: '', en: '', ckb: '' },
      imageUrl: proj.imageUrl || 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=80',
      route: proj.route || { ar: '', en: '', ckb: '' },
      vehicleType: proj.vehicleType || 'Heavy Freight Transporter',
      targetAmount: Number(proj.targetAmount || 100000),
      raisedAmount: Number(proj.raisedAmount || 0),
      minInvestment: Number(proj.minInvestment || 500),
      monthlyRoiPercent: Number(proj.monthlyRoiPercent || 4.5),
      lockupMonths: Number(proj.lockupMonths || 5),
      status: proj.status || 'active',
      totalVehicles: Number(proj.totalVehicles || 5),
      capacitySpecs: proj.capacitySpecs || '40 Tons Freight Capacity',
      createdDate: proj.createdDate || new Date().toISOString().split('T')[0],
    };

    // Upsert into Supabase
    await upsertSupabaseFleet(fullProj);

    // Update local state directly
    setProjects((prev) => {
      const exists = prev.some((p) => p.id === fullProj.id);
      if (exists) {
        return prev.map((p) => (p.id === fullProj.id ? fullProj : p));
      } else {
        return [fullProj, ...prev];
      }
    });

    fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proj),
    }).catch(() => {});
  };

  const handleToggleProjectStatus = async (id: string, status: ProjectStatus) => {
    await updateSupabaseFleetStatus(id, status);
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));

    fetch(`/api/projects/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).catch(() => {});
  };

  const handleDeleteProject = async (id: string) => {
    await deleteSupabaseFleet(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));

    fetch(`/api/projects/${id}`, { method: 'DELETE' }).catch(() => {});
  };

  const handleSubmitDepositProof = async (
    depositId: string,
    amount: number,
    txHash: string,
    receiptUrl: string
  ) => {
    const validId = depositId || `dep-${Date.now()}`;
    try {
      const res = await fetch(`/api/deposits/${validId}/submit-proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, txHash, receiptUrl }),
      });
      const data = await res.json().catch(() => ({}));
      
      let depositObj: DepositRequest = data.deposit;
      if (!depositObj || !depositObj.id) {
        depositObj = deposits.find((d) => d.id === validId) || {
          id: validId,
          userId: user?.id || 'investor',
          userName: user?.name || 'المستثمر',
          userEmail: user?.email || '',
          amount: Number(amount) || 0,
          network: 'TRC20',
          status: 'submitted',
          txHash,
          receiptUrl,
          createdAt: new Date().toISOString(),
          chatMessages: [],
        };
        depositObj.txHash = txHash;
        depositObj.receiptUrl = receiptUrl;
        depositObj.amount = Number(amount) || depositObj.amount;
        depositObj.status = 'submitted';
      } else {
        depositObj.status = 'submitted';
      }

      updateSupabaseDeposit(depositObj).catch(() => {});
      setDeposits((prev) => [depositObj, ...prev.filter((d) => d.id !== depositObj.id)]);
      await fetchState().catch(() => {});
      return depositObj;
    } catch (err) {
      console.error('⚠️ [App] Error submitting deposit proof:', err);
      const fallbackDep: DepositRequest = {
        id: validId,
        userId: user?.id || 'investor',
        userName: user?.name || 'المستثمر',
        userEmail: user?.email || '',
        amount: Number(amount) || 0,
        network: 'TRC20',
        status: 'submitted',
        txHash,
        receiptUrl,
        createdAt: new Date().toISOString(),
        chatMessages: [],
      };
      updateSupabaseDeposit(fallbackDep).catch(() => {});
      return fallbackDep;
    }
  };

  const handleReviewDeposit = async (
    id: string,
    status: 'approved' | 'rejected' | 'unlocked',
    note?: string,
    txHash?: string,
    receiptUrl?: string,
    amount?: number
  ) => {
    const endpoint = status === 'unlocked' ? `/api/deposits/${id}/unlock` : `/api/deposits/${id}/verify`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, amount, adminNote: note, txHash, receiptUrl }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.deposit) {
        updateSupabaseDeposit(data.deposit).catch(() => {});
        setDeposits((prev) => prev.map((d) => (d.id === id ? data.deposit : d)));
      }
      if (data.user) {
        upsertSupabaseProfile(data.user).catch(() => {});
        setUser((prev) => (prev && prev.id === data.user.id ? data.user : prev));
      }
    }
    await fetchState();
  };

  const handleReviewKYC = async (status: 'approved' | 'rejected', reason?: string) => {
    await fetch('/api/kyc/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, rejectionReason: reason }),
    });
    await fetchState();
  };

  const handleApproveWithdrawal = async (id: string) => {
    await fetch(`/api/withdrawals/${id}/approve`, { method: 'POST' });
    await fetchState();
  };

  const handleConnectSupport = async (): Promise<SupportTicket> => {
    const res = await fetch('/api/support/connect', { method: 'POST' });
    const data = await res.json();
    if (data.ticket) {
      insertSupabaseSupportTicket(data.ticket).catch(() => {});
    }
    if (data.supportTickets) setSupportTickets(data.supportTickets);
    return data.ticket;
  };

  const handleAcceptSupportConnection = async (ticketId: string) => {
    const res = await fetch(`/api/support/${ticketId}/accept`, { method: 'POST' });
    const data = await res.json();
    updateSupabaseSupportTicketStatus(ticketId, 'open').catch(() => {});
    if (data.supportTickets) setSupportTickets(data.supportTickets);
  };

  const handleSendSupportChatMessage = async (ticketId: string, text: string) => {
    const res = await fetch(`/api/support/${ticketId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, sender: 'user' }),
    });
    const data = await res.json();
    if (data.message) {
      insertSupabaseSupportMessage(ticketId, data.message).catch(() => {});
    }
    await fetchState();
  };

  const handleSaveSettings = async (settings: Partial<AdminSettings>) => {
    await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    upsertSupabaseAdminSettings(settings).catch(() => {});
    await fetchState();
  };

  const handleResetDemoData = async () => {
    await fetch('/api/reset', { method: 'POST' });
    await fetchState();
  };

  const t = translations[currentLang] || translations.ar;

  const filteredProjects = projects.filter((p) => {
    if (categoryFilter === 'all') return true;
    return p.category === categoryFilter;
  });

  // 1. Initial State Loading Screen (ONLY shown on initial boot before any data is loaded)
  if (initialLoading && !user && projects.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 space-y-4 font-sans">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold tracking-wider text-amber-400">Loading Aseel Platform...</p>
      </div>
    );
  }

  // 2. Unauthenticated User -> Show Login / Signup Screen
  if (!user) {
    return (
      <AuthPage
        lang={currentLang}
        onLanguageChange={setCurrentLang}
        onAuthSuccess={handleAuthSuccess}
        adminSettings={adminSettings}
      />
    );
  }

  // 3. Admin Isolation & RBAC Protection: User attempting to view /admin without admin role
  const isUserAdmin = user?.role === 'admin' || user?.email?.toLowerCase() === 'goog7029766@gmail.com';

  if ((isAdminView || activeView === 'admin') && !isUserAdmin) {
    return (
      <AccessDenied
        lang={currentLang}
        user={user}
        onReturnToClient={() => {
          setIsAdminView(false);
          setActiveView('dashboard');
          if (window.location.pathname === '/admin') {
            window.history.pushState({}, '', '/');
          }
        }}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-200 font-sans antialiased selection:bg-amber-500 selection:text-slate-950 ${
        theme === 'light' ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
      }`}
    >
      
      {/* Top Navbar */}
      <Navbar
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        user={user}
        activeView={activeView}
        onNavigate={(view) => {
          if (view === 'chat') {
            setShowSupportModal(true);
          } else if (view === 'admin') {
            setIsAdminView(true);
            setActiveView('admin');
            window.history.pushState({}, '', '/admin');
          } else {
            setIsAdminView(false);
            setActiveView(view);
            if (window.location.pathname === '/admin') {
              window.history.pushState({}, '', '/');
            }
          }
        }}
        onOpenDeposit={() => setShowDepositModal(true)}
        onOpenWithdrawal={() => setShowWithdrawalModal(true)}
        onOpenTransferModal={() => setShowTransferModal(true)}
        onOpenKYC={() => setShowKycModal(true)}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        isAdminView={isAdminView}
        onToggleAdminView={() => {
          const nextState = !isAdminView;
          setIsAdminView(nextState);
          setActiveView(nextState ? 'admin' : 'dashboard');
          window.history.pushState({}, '', nextState ? '/admin' : '/');
        }}
        onLogout={handleLogout}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        onClearNotifications={handleClearNotifications}
        onNotificationClick={handleNotificationClick}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        
        {isAdminView && isUserAdmin ? (
          /* ADMIN VIEW PORTAL */
          <AdminDashboard
            currentLang={currentLang}
            user={user}
            projects={projects}
            investments={investments}
            deposits={deposits}
            kyc={kycData || {
              userId: user?.id || '',
              userName: user?.name || '',
              userEmail: user?.email || '',
              fullName: '',
              idNumber: '',
              nationalIdFront: '',
              nationalIdBack: '',
              housingCard: '',
              status: 'not_submitted',
              submittedAt: new Date().toISOString(),
            }}
            withdrawals={withdrawals}
            adminSettings={adminSettings || {
              trc20Address: '',
              bep20Address: '',
              p2pBankInstructions: { ar: '', en: '', ckb: '' },
              announcementMessage: { ar: '', en: '', ckb: '' },
              defaultMonthlyRoi: 4.5,
              minDepositUsdt: 100,
            }}
            supportTickets={supportTickets}
            onSaveProject={handleSaveProject}
            onToggleProjectStatus={handleToggleProjectStatus}
            onDeleteProject={handleDeleteProject}
            onReviewDeposit={handleReviewDeposit}
            onSendAdminChatMessage={handleAdminSendChatMessage}
            onReviewKYC={handleReviewKYC}
            onApproveWithdrawal={handleApproveWithdrawal}
            onAcceptWithdrawalConnection={handleAcceptWithdrawalConnection}
            onReviewWithdrawal={handleReviewWithdrawal}
            onSendAdminWithdrawalChat={handleAdminSendWithdrawalChatMessage}
            onSendAdminSupportMessage={handleAdminSendSupportMessage}
            onCloseSupportTicket={handleCloseSupportTicket}
            onAcceptSupportConnection={handleAcceptSupportConnection}
            onSaveSettings={handleSaveSettings}
            onResetDemoData={handleResetDemoData}
            onRefreshState={fetchState}
          />
        ) : (
          /* INVESTOR VIEW PORTAL */
          <>
            {activeView === 'dashboard' && (
              <DashboardView
                currentLang={currentLang}
                user={user}
                projects={projects}
                investments={investments}
                deposits={deposits}
                adminSettings={adminSettings}
                onOpenDeposit={() => setShowDepositModal(true)}
                onOpenWithdrawal={() => setShowWithdrawalModal(true)}
                onSelectInvest={(p) => setSelectedProjectForInvest(p)}
                onRequestWithdrawal={handleRequestWithdrawal}
                onOpenUpgradeModal={() => setShowUpgradeModal(true)}
                onNavigateToPortfolio={() => setActiveView('portfolio')}
                onOpenReferralModal={() => setShowReferralModal(true)}
              />
            )}

            {activeView === 'portfolio' && (
              <PortfolioView
                currentLang={currentLang}
                user={user}
                investments={investments}
                withdrawals={withdrawals}
                deposits={deposits}
                projects={projects}
                trips={trips}
                onRequestWithdrawal={handleRequestWithdrawal}
                onOpenDeposit={() => setShowDepositModal(true)}
                onOpenWithdrawal={() => setShowWithdrawalModal(true)}
                onRefreshState={fetchState}
              />
            )}

            {activeView === 'fleet' && (
              <FleetGallery currentLang={currentLang} projects={projects} />
            )}

            {activeView === 'transactions' && (
              <TransactionLedger
                currentLang={currentLang}
                deposits={deposits}
                withdrawals={withdrawals}
                investments={investments}
                usdtBalance={user?.usdtBalance || 0}
                mainBalance={user?.mainBalance || 0}
                investmentBalance={user?.investmentBalance || 0}
              />
            )}
          </>
        )}

      </main>

      {/* OVERLAY MODALS */}

      {/* Investment Modal */}
      {selectedProjectForInvest && (
        <InvestmentModal
          project={selectedProjectForInvest}
          currentLang={currentLang}
          user={user}
          onClose={() => setSelectedProjectForInvest(null)}
          onConfirmInvest={handleConfirmInvest}
          onOpenDeposit={() => {
            setSelectedProjectForInvest(null);
            setShowDepositModal(true);
          }}
          onOpenKYC={() => {
            setSelectedProjectForInvest(null);
            setShowKycModal(true);
          }}
          onOpenTransferModal={() => {
            setSelectedProjectForInvest(null);
            setShowTransferModal(true);
          }}
        />
      )}

      {/* Deposit & Interactive P2P Request Modal */}
      {showDepositModal && (
        <DepositModalAndChat
          currentLang={currentLang}
          user={user}
          adminSettings={adminSettings || undefined}
          deposits={deposits || []}
          onClose={() => setShowDepositModal(false)}
          onConnectDeposit={handleConnectDeposit}
          onRequestDeposit={handleStartDeposit}
          onSubmitDepositProof={handleSubmitDepositProof}
          onSendDepositChatMessage={handleSendMessage}
        />
      )}

      {/* KYC Verification Modal */}
      {showKycModal && (
        <KYCModal
          currentLang={currentLang}
          user={user}
          kycData={kycData}
          onClose={() => setShowKycModal(false)}
          onSubmitKYC={handleSubmitKYC}
        />
      )}

      {/* Withdrawal & P2P Settlement Chat Modal */}
      {showWithdrawalModal && (
        <WithdrawalModalAndChat
          currentLang={currentLang}
          user={user}
          adminSettings={adminSettings || undefined}
          withdrawalList={withdrawals}
          onClose={() => setShowWithdrawalModal(false)}
          onConnectWithdrawal={handleConnectWithdrawal}
          onSubmitWithdrawalDetails={handleSubmitWithdrawalDetails}
          onStartWithdrawal={handleStartWithdrawal}
          onSendMessage={handleSendWithdrawalChatMessage}
          onOpenKYC={() => {
            setShowWithdrawalModal(false);
            setShowKycModal(true);
          }}
          onOpenTransferModal={() => {
            setShowWithdrawalModal(false);
            setShowTransferModal(true);
          }}
        />
      )}

      {/* Support Options & Live Chat Modal */}
      {showSupportModal && user && (
        <SupportModalAndChat
          currentLang={currentLang}
          user={user}
          supportTickets={supportTickets}
          onClose={() => setShowSupportModal(false)}
          onConnectSupport={handleConnectSupport}
          onSendSupportChatMessage={handleSendSupportChatMessage}
        />
      )}

      {/* Profile Modal */}
      {showProfileModal && user && (
        <ProfileModal
          currentLang={currentLang}
          user={user}
          onClose={() => setShowProfileModal(false)}
          onOpenKYC={() => {
            setShowProfileModal(false);
            setShowKycModal(true);
          }}
          onOpenDeposit={() => {
            setShowProfileModal(false);
            setShowDepositModal(true);
          }}
          onOpenTransferModal={() => {
            setShowProfileModal(false);
            setShowTransferModal(true);
          }}
          onUserUpdate={(updatedUser) => setUser(updatedUser)}
        />
      )}

      {/* Account Settings Modal */}
      {showSettingsModal && user && (
        <SettingsModal
          currentLang={currentLang}
          user={user}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {/* Plan Upgrade Modal */}
      {showUpgradeModal && (
        <PlanUpgradeModal
          currentLang={currentLang}
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          projects={projects}
          investments={investments}
          user={user}
          onUpgradeConfirm={async (projectId, investmentId, additionalAmount) => {
            const proj = projects.find((p) => p.id === projectId);
            if (proj) {
              setSelectedProjectForInvest(proj);
            }
            setShowUpgradeModal(false);
          }}
          onOpenDepositModal={() => {
            setShowUpgradeModal(false);
            setShowDepositModal(true);
          }}
        />
      )}

      {/* Referral Program Modal */}
      {showReferralModal && (
        <ReferralModal
          isOpen={showReferralModal}
          onClose={() => setShowReferralModal(false)}
          currentLang={currentLang}
          userReferralCode={user?.referralCode}
        />
      )}

      {/* Wallet Transfer Modal */}
      {showTransferModal && (
        <WalletTransferModal
          isOpen={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          currentLang={currentLang}
          user={user}
          onTransferSuccess={(updatedUser) => {
            setUser(updatedUser);
            fetchState();
          }}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-10 mt-20 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-bold text-slate-400">
            {t.brandName} ({t.brandSubtitle}) — Secure Logistics & Land Transportation Assets
          </p>
          <p className="text-[11px] text-slate-600">
            All freight truck & inter-province passenger vehicle investments operate under a mandatory 5-month capital lockup agreement.
          </p>
        </div>
      </footer>

    </div>
  );
}

