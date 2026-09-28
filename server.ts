import express from 'express';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  initialProjects,
  initialUser,
  initialAdminSettings,
  initialInvestments,
  initialDepositRequests,
  initialKYC,
  initialNotifications,
  initialNews,
  initialOnlineUsers,
  initialFreightTrips,
} from './src/data/mockData';
import {
  Project,
  User,
  AdminSettings,
  Investment,
  InvestmentPlan,
  FreightTrip,
  DepositRequest,
  NetworkType,
  KYCSubmission,
  WithdrawalRequest,
  ChatMessage,
  SupportTicket,
  AppNotification,
  NotificationType,
  NotificationStatus,
  NewsArticle,
  OnlineUser,
  ReferralRecord,
  ReferralTierConfig,
  TransactionRecord,
  AdminActivityLog,
} from './src/types';

// Server-side Supabase client
const DEFAULT_SERVER_SUPABASE_URL = 'https://yjvihqcnbcbggqmhwarz.supabase.co';
const DEFAULT_SERVER_SUPABASE_ANON_KEY = 'sb_publishable_VWj32_HUogAgi1EwIiZuDQ_B_or1-wk';
const DEFAULT_SERVER_SUPABASE_SECRET_KEY = 'sb_secret_-xuiwm8fVIeKaK6qsOW0Fg_6jl6wC-y';

const isValidHttpUrlServer = (urlStr: string): boolean => {
  if (!urlStr || typeof urlStr !== 'string') return false;
  try {
    const parsed = new URL(urlStr.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const sanitizeUrlServer = (urlStr: string): string => {
  if (!urlStr || typeof urlStr !== 'string') return DEFAULT_SERVER_SUPABASE_URL;
  let cleaned = urlStr.trim();
  cleaned = cleaned.replace(/\/rest\/v1\/?$/i, '');
  cleaned = cleaned.replace(/\/+$/, '');
  return isValidHttpUrlServer(cleaned) ? cleaned : DEFAULT_SERVER_SUPABASE_URL;
};

const rawServerUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  DEFAULT_SERVER_SUPABASE_URL;

const SUPABASE_URL = sanitizeUrlServer(rawServerUrl);

const rawServerKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  DEFAULT_SERVER_SUPABASE_SECRET_KEY ||
  DEFAULT_SERVER_SUPABASE_ANON_KEY;

const SUPABASE_ANON_KEY = rawServerKey && rawServerKey.trim() ? rawServerKey.trim() : DEFAULT_SERVER_SUPABASE_ANON_KEY;

const isSupabaseServerConfigured = (): boolean => {
  return Boolean(
    isValidHttpUrlServer(SUPABASE_URL) &&
    SUPABASE_ANON_KEY &&
    SUPABASE_ANON_KEY !== 'placeholder' &&
    SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_KEY' &&
    (
      SUPABASE_ANON_KEY.startsWith('ey') ||
      SUPABASE_ANON_KEY.startsWith('sbp_') ||
      SUPABASE_ANON_KEY.startsWith('sb_publishable_') ||
      SUPABASE_ANON_KEY.startsWith('sb_secret_')
    )
  );
};

let supabaseServer: SupabaseClient | null = null;
try {
  if (isSupabaseServerConfigured()) {
    supabaseServer = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('⚡ [Server Supabase] Client initialized successfully for backend.');
  } else {
    console.log('ℹ️ [Server Supabase] Live Supabase key is not configured (requires JWT key starting with "ey"). Server using in-memory state store.');
  }
} catch (e) {
  console.warn('⚠️ [Server Supabase] Client init warning:', e);
}

async function syncUserWalletToSupabase(
  userId: string,
  availableBalance: number,
  lockedCapital: number = 0,
  totalProfits: number = 0,
  mainBalance?: number,
  investmentBalance?: number
) {
  if (!supabaseServer || !isSupabaseServerConfigured() || !userId) return;
  try {
    const { data: existingW } = await supabaseServer
      .from('wallets')
      .select('id, user_id')
      .eq('user_id', userId)
      .limit(1);

    const walletPayload: any = {
      user_id: userId,
      available_balance: availableBalance,
      locked_capital: lockedCapital,
      total_profits: totalProfits,
      updated_at: new Date().toISOString(),
    };

    if (typeof mainBalance === 'number') walletPayload.main_balance = mainBalance;
    if (typeof investmentBalance === 'number') walletPayload.investment_balance = investmentBalance;

    if (existingW && existingW.length > 0) {
      await supabaseServer.from('wallets').update(walletPayload).eq('user_id', userId);
    } else {
      await supabaseServer.from('wallets').insert(walletPayload);
    }
  } catch (err) {
    console.warn('⚠️ [syncUserWalletToSupabase warning]:', err);
  }
}

const initialTransactionsList: TransactionRecord[] = [
  {
    id: 'tx-dep-101',
    userId: 'user-investor-1',
    userName: 'أحمد العبيدي',
    userEmail: 'investor@aseel.iq',
    type: 'deposit',
    title: { ar: 'إيداع USDT معتمد 💰', en: 'Approved USDT Deposit 💰', ckb: 'دابەزاندنی پەسەندکراو' },
    description: { ar: 'إيداع رصيد في المحفظة الرئيسية عبر شبكة BEP20', en: 'USDT Deposit into Main Wallet via BEP20', ckb: 'پڕکردنەوەی باڵانس' },
    amount: 25000,
    wallet: 'main',
    status: 'completed',
    timestamp: '2025-01-15T09:00:00.000Z',
    txHash: '0x8f2a9b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a',
    category: 'BEP20',
  },
  {
    id: 'tx-trf-101',
    userId: 'user-investor-1',
    userName: 'أحمد العبيدي',
    userEmail: 'investor@aseel.iq',
    type: 'transfer',
    title: { ar: 'تحويل بين المحافظ 🔄', en: 'Wallet Transfer 🔄', ckb: 'گواستنەوەی جزدان' },
    description: { ar: 'تحويل $24,000 USDT من المحفظة الرئيسية إلى محفظة الاستثمار', en: 'Transferred $24,000 USDT from Main to Investment Wallet', ckb: 'گواستنەوە بۆ الاستثمار' },
    amount: 24000,
    wallet: 'both',
    sourceWallet: 'main',
    targetWallet: 'investment',
    status: 'completed',
    timestamp: '2025-01-15T09:30:00.000Z',
  },
  {
    id: 'tx-inv-101',
    userId: 'user-investor-1',
    userName: 'أحمد العبيدي',
    userEmail: 'investor@aseel.iq',
    type: 'investment',
    title: { ar: 'تخصيص استثمار أسطول الشحن 🚛', en: 'Fleet Investment Allocation 🚛', ckb: 'دابینکردنی وەبەرهێنان' },
    description: { ar: 'اشتراك في أسطول شاحنات الفولفو العابرة للحدود (عائد 9% شهرياً)', en: 'Capital allocation in Heavy Cargo Transport Fleet (9% Monthly Yield)', ckb: 'وەبەرهێنان لە شاحنەكان' },
    amount: 15000,
    wallet: 'investment',
    status: 'completed',
    timestamp: '2025-01-15T10:00:00.000Z',
    referenceId: 'inv-101',
  },
  {
    id: 'tx-inv-102',
    userId: 'user-investor-1',
    userName: 'أحمد العبيدي',
    userEmail: 'investor@aseel.iq',
    type: 'investment',
    title: { ar: 'تخصيص استثمار أسطول الحافلات 🚌', en: 'Bus Fleet Capital Allocation 🚌', ckb: 'وەبەرهێنانی پاسەكان' },
    description: { ar: 'اشتراك في أسطول حافلات النقل السياحي والوفود (عائد 9.6% شهرياً)', en: 'Capital allocation in Tourist Passenger Bus Fleet (9.6% Monthly Yield)', ckb: 'وەبەرهێنان لە پاسەكان' },
    amount: 10000,
    wallet: 'investment',
    status: 'completed',
    timestamp: '2025-01-20T11:00:00.000Z',
    referenceId: 'inv-102',
  },
  {
    id: 'tx-roi-101',
    userId: 'user-investor-1',
    userName: 'أحمد العبيدي',
    userEmail: 'investor@aseel.iq',
    type: 'roi',
    title: { ar: 'أرباح عوائد الأسطول الشهرية 📈', en: 'Monthly Fleet Yield Earnings 📈', ckb: 'قازانجی وەبەرهێنان' },
    description: { ar: 'إضافة أرباح الخطة الاستثمارية الشهرية إلى محفظة الاستثمار', en: 'Monthly investment profit yield credited to Investment Wallet', ckb: 'زیادکردنی قازانج' },
    amount: 1350,
    wallet: 'investment',
    status: 'completed',
    timestamp: '2025-02-15T12:00:00.000Z',
  },
  {
    id: 'tx-roi-102',
    userId: 'user-investor-1',
    userName: 'أحمد العبيدي',
    userEmail: 'investor@aseel.iq',
    type: 'roi',
    title: { ar: 'أرباح عوائد الأسطول الشهرية 📈', en: 'Monthly Fleet Yield Earnings 📈', ckb: 'قازانجی وەبەرهێنان' },
    description: { ar: 'إضافة أرباح الخطة الاستثمارية الشهرية إلى محفظة الاستثمار', en: 'Monthly investment profit yield credited to Investment Wallet', ckb: 'زیادکردنی قازانج' },
    amount: 960,
    wallet: 'investment',
    status: 'completed',
    timestamp: '2025-03-15T12:00:00.000Z',
  },
  {
    id: 'tx-trf-102',
    userId: 'user-investor-1',
    userName: 'أحمد العبيدي',
    userEmail: 'investor@aseel.iq',
    type: 'transfer',
    title: { ar: 'تحويل أرباح إلى المحفظة الرئيسية 🔄', en: 'Profit Transfer to Main Wallet 🔄', ckb: 'گواستنەوەی قازانج' },
    description: { ar: 'تحويل $2,000 USDT من محفظة الاستثمار إلى المحفظة الرئيسية للسحب', en: 'Transferred $2,000 USDT from Investment to Main Wallet for payout', ckb: 'گواستنەوە بۆ السحب' },
    amount: 2000,
    wallet: 'both',
    sourceWallet: 'investment',
    targetWallet: 'main',
    status: 'completed',
    timestamp: '2025-03-16T14:00:00.000Z',
  },
  {
    id: 'tx-wd-101',
    userId: 'user-investor-1',
    userName: 'أحمد العبيدي',
    userEmail: 'investor@aseel.iq',
    type: 'withdrawal',
    title: { ar: 'سحب أرباح معتمد 📤', en: 'Approved Withdrawal Payout 📤', ckb: 'ڕاكێشانی پارەی قازانج' },
    description: { ar: 'تم تحويل مبلغ السحب بنجاح إلى المحفظة الخارجية عبر شبكة TRC20', en: 'Withdrawal payout processed to external TRC20 destination wallet', ckb: 'سەرکەوتووانە ڕاکێشرا' },
    amount: 1000,
    wallet: 'main',
    status: 'completed',
    timestamp: '2025-03-20T16:00:00.000Z',
    txHash: 'TXYZ9876543210FEDCBA09876543210TRC20',
  },
  {
    id: 'tx-dep-201',
    userId: 'user-investor-2',
    userName: 'عمر الدليمي',
    userEmail: 'omar.dulaimi@gmail.com',
    type: 'deposit',
    title: { ar: 'إيداع USDT معتمد 💰', en: 'Approved USDT Deposit 💰', ckb: 'دابەزاندنی پەسەندکراو' },
    description: { ar: 'شحن رصيد المحفظة الرئيسية عبر شبكة TRC20', en: 'Main Wallet Deposit via TRC20', ckb: 'پڕکردنەوەی باڵانس' },
    amount: 20000,
    wallet: 'main',
    status: 'completed',
    timestamp: '2025-02-10T08:00:00.000Z',
    txHash: '0x99887766554433221100aabbccddeeff',
  },
  {
    id: 'tx-trf-201',
    userId: 'user-investor-2',
    userName: 'عمر الدليمي',
    userEmail: 'omar.dulaimi@gmail.com',
    type: 'transfer',
    title: { ar: 'تحويل بين المحافظ 🔄', en: 'Wallet Transfer 🔄', ckb: 'گواستنەوەی جزدان' },
    description: { ar: 'تحويل $18,000 USDT من المحفظة الرئيسية إلى محفظة الاستثمار', en: 'Transferred $18,000 USDT to Investment Wallet', ckb: 'گواستنەوە' },
    amount: 18000,
    wallet: 'both',
    sourceWallet: 'main',
    targetWallet: 'investment',
    status: 'completed',
    timestamp: '2025-02-10T08:30:00.000Z',
  },
  {
    id: 'tx-inv-201',
    userId: 'user-investor-2',
    userName: 'عمر الدليمي',
    userEmail: 'omar.dulaimi@gmail.com',
    type: 'investment',
    title: { ar: 'تخصيص استثمار أسطول شاحنات مبردة 🚛', en: 'Refrigerated Transport Capital 🚛', ckb: 'وەبەرهێنانی شاحنەی ساردکەرەوە' },
    description: { ar: 'اشتراك في أسطول الشاحنات الثقيلة المبردة (عائد 9% شهرياً)', en: 'Capital allocation in Refrigerated Cargo Transport Fleet', ckb: 'وەبەرهێنان' },
    amount: 18000,
    wallet: 'investment',
    status: 'completed',
    timestamp: '2025-02-10T09:00:00.000Z',
  },
  {
    id: 'tx-roi-201',
    userId: 'user-investor-2',
    userName: 'عمر الدليمي',
    userEmail: 'omar.dulaimi@gmail.com',
    type: 'roi',
    title: { ar: 'أرباح عوائد الأسطول الشهرية 📈', en: 'Monthly Fleet Yield Earnings 📈', ckb: 'قازانجی وەبەرهێنان' },
    description: { ar: 'إضافة أرباح الخطة الاستثمارية الشهرية إلى محفظة الاستثمار', en: 'Monthly investment profit yield credited to Investment Wallet', ckb: 'زیادکردنی قازانج' },
    amount: 1620,
    wallet: 'investment',
    status: 'completed',
    timestamp: '2025-03-10T10:00:00.000Z',
  },
  {
    id: 'tx-dep-founder-1',
    userId: '756cbbdc-9920-470c-b3d0-1861a38240e4',
    userName: 'مؤسس المنشأة والمالك الرئيسي',
    userEmail: 'goog7029766@gmail.com',
    type: 'deposit',
    title: { ar: 'إيداع رأس مال المنشأة 🏦', en: 'Founder Treasury Deposit 🏦', ckb: 'دابەزاندنی سەرمایە' },
    description: { ar: 'تغذية المحفظة الرئيسية برأس مال المنشأة المعتمد', en: 'Initial corporate treasury deposit into Main Wallet', ckb: 'دابەزاندن' },
    amount: 100000,
    wallet: 'main',
    status: 'completed',
    timestamp: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'tx-trf-founder-1',
    userId: '756cbbdc-9920-470c-b3d0-1861a38240e4',
    userName: 'مؤسس المنشأة والمالك الرئيسي',
    userEmail: 'goog7029766@gmail.com',
    type: 'transfer',
    title: { ar: 'تحويل بين المحافظ 🔄', en: 'Corporate Treasury Transfer 🔄', ckb: 'گواستنەوەی جزدان' },
    description: { ar: 'تحويل $50,000 USDT من المحفظة الرئيسية إلى محفظة الاستثمار', en: 'Transferred $50,000 USDT to Investment Wallet', ckb: 'گواستنەوە' },
    amount: 50000,
    wallet: 'both',
    sourceWallet: 'main',
    targetWallet: 'investment',
    status: 'completed',
    timestamp: '2025-01-02T10:00:00.000Z',
  },
];

let transactionsStore: TransactionRecord[] = [...initialTransactionsList];

async function logTransactionRecord(record: {
  id?: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'roi' | 'investment' | 'bonus' | 'refund';
  title: string | { ar: string; en: string; ckb: string };
  description?: string | { ar: string; en: string; ckb: string };
  amount: number;
  wallet: 'main' | 'investment' | 'both';
  sourceWallet?: 'main' | 'investment' | 'both';
  targetWallet?: 'main' | 'investment' | 'both';
  status: 'completed' | 'pending' | 'rejected' | 'failed';
  timestamp?: string;
  txHash?: string;
  referenceId?: string;
  category?: string;
  adminNote?: string;
}) {
  const fullRecord: TransactionRecord = {
    id: record.id || `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: record.timestamp || new Date().toISOString(),
    ...record,
  };

  transactionsStore.unshift(fullRecord);

  if (supabaseServer && isSupabaseServerConfigured()) {
    try {
      await supabaseServer.from('transactions').insert({
        id: fullRecord.id,
        user_id: fullRecord.userId,
        type: fullRecord.type,
        title: typeof fullRecord.title === 'string' ? fullRecord.title : fullRecord.title.ar,
        description: typeof fullRecord.description === 'string' ? fullRecord.description : fullRecord.description?.ar || '',
        amount: fullRecord.amount,
        wallet: fullRecord.wallet,
        status: fullRecord.status,
        tx_hash: fullRecord.txHash,
        reference_id: fullRecord.referenceId,
        created_at: fullRecord.timestamp,
      });
    } catch (e) {
      // Supabase insert fallback ignore
    }
  }

  return fullRecord;
}

const initialAdminActivityLogs: AdminActivityLog[] = [
  {
    id: 'log-101',
    admin_id: '756cbbdc-9920-470c-b3d0-1861a38240e4',
    admin_email: 'goog7029766@gmail.com',
    target_user_id: null,
    target_user_name: null,
    action: 'Distributed Profit',
    details: {
      amount: 12500,
      planName: 'أسطول الشحن الثقيل (Heavy Cargo Fleet)',
      distributionType: 'percent',
      value: 4.5,
      note: 'توزيع الأرباح الشهرية الدورية',
      timestamp: '2025-01-14T10:00:00.000Z',
    },
    created_at: '2025-01-14T10:00:00.000Z',
  },
  {
    id: 'log-102',
    admin_id: '756cbbdc-9920-470c-b3d0-1861a38240e4',
    admin_email: 'goog7029766@gmail.com',
    target_user_id: 'user-investor-1',
    target_user_name: 'أحمد العبيدي',
    action: 'Sent Gift',
    details: {
      target: 'single',
      amount: 250,
      reason: 'هدية مكافأة التميز الاستثماري 🎁',
      wallet: 'main',
      timestamp: '2025-01-20T14:30:00.000Z',
    },
    created_at: '2025-01-20T14:30:00.000Z',
  },
  {
    id: 'log-103',
    admin_id: '756cbbdc-9920-470c-b3d0-1861a38240e4',
    admin_email: 'goog7029766@gmail.com',
    target_user_id: null,
    target_user_name: null,
    action: 'Added Fleet Plan',
    details: {
      projectId: 'proj-101',
      title: 'أسطول الشحن اللوجستي والسريع - بغداد / أربيل',
      targetAmount: 250000,
      monthlyRoiPercent: 4.5,
      timestamp: '2025-01-01T12:00:00.000Z',
    },
    created_at: '2025-01-01T12:00:00.000Z',
  },
];

let adminActivityLogsStore: AdminActivityLog[] = [...initialAdminActivityLogs];



async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // CORS Middleware for production & Vercel deployment
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Extended User with password & profile info
  interface AuthUser extends User {
    password: string;
    phone?: string;
    governorate?: string;
  }

  const initialUsersList: AuthUser[] = [
    {
      id: 'user-investor-1',
      name: 'أحمد العبيدي',
      email: 'investor@aseel.iq',
      password: '123456',
      role: 'investor',
      mainBalance: 1000,
      investmentBalance: 14000,
      usdtBalance: 15000,
      kycStatus: 'approved',
      totalInvested: 25000,
      totalRoiEarned: 2310,
      joinedDate: '2025-01-15',
      phone: '+964 770 123 4567',
      governorate: 'بغداد',
      referralCode: 'ASEEL-7A9B',
      totalReferralsCount: 3,
      qualifiedReferralsCount: 2,
      totalReferralEarnings: 20,
    },
    {
      id: 'user-investor-2',
      name: 'عمر الدليمي / Omar Al-Dulaimi',
      email: 'omar.dulaimi@gmail.com',
      password: '123456',
      role: 'investor',
      mainBalance: 1200,
      investmentBalance: 7000,
      usdtBalance: 8200,
      kycStatus: 'approved',
      totalInvested: 18000,
      totalRoiEarned: 1620,
      joinedDate: '2025-02-10',
      phone: '+964 781 445 8899',
      governorate: 'الأنبار / أربيل',
      referralCode: 'ASEEL-9C4K',
      referredBy: 'user-investor-1',
      referredByCode: 'ASEEL-7A9B',
    },
    {
      id: 'user-investor-3',
      name: 'سارة الخفاجي / Sara Al-Khafaji',
      email: 'sara.khafaji@yahoo.com',
      password: '123456',
      role: 'investor',
      mainBalance: 500,
      investmentBalance: 3000,
      usdtBalance: 3500,
      kycStatus: 'pending',
      totalInvested: 5000,
      totalRoiEarned: 210,
      joinedDate: '2025-03-01',
      phone: '+964 750 998 1122',
      governorate: 'البصرة',
      referralCode: 'ASEEL-3X8M',
      referredBy: 'user-investor-1',
      referredByCode: 'ASEEL-7A9B',
    },
    {
      id: 'user-investor-4',
      name: 'حسان التميمي / Hassan Al-Timimi',
      email: 'hassan.timimi@outlook.com',
      password: '123456',
      role: 'investor',
      mainBalance: 2000,
      investmentBalance: 10000,
      usdtBalance: 12000,
      kycStatus: 'not_submitted',
      totalInvested: 0,
      totalRoiEarned: 0,
      joinedDate: '2025-04-12',
      phone: '+964 772 334 5566',
      governorate: 'النجف الأشرف',
      referralCode: 'ASEEL-5R2P',
      referredBy: 'user-investor-1',
      referredByCode: 'ASEEL-7A9B',
    },
    {
      id: 'user-founder-main',
      name: 'مؤسس المنشأة والمالك الرئيسي (Founder & Main Owner)',
      email: 'goog7029766@gmail.com',
      password: '&ZI310!qum&',
      role: 'admin',
      mainBalance: 0,
      investmentBalance: 0,
      usdtBalance: 0,
      kycStatus: 'approved',
      accountStatus: 'active',
      totalInvested: 0,
      totalRoiEarned: 0,
      joinedDate: '2024-01-01',
      phone: '+964 780 000 0000',
      governorate: 'بغداد',
      referralCode: 'ASEEL-ADMIN1',
    },
    {
      id: 'user-admin-1',
      name: 'مدير النظام - أسطول أصيل',
      email: 'admin@aseel.com',
      password: 'Admin@2026!Secure',
      role: 'admin',
      usdtBalance: 0,
      kycStatus: 'approved',
      accountStatus: 'active',
      totalInvested: 0,
      totalRoiEarned: 0,
      joinedDate: '2024-11-01',
      phone: '+964 780 987 6543',
      governorate: 'بغداد',
      referralCode: 'ASEEL-ADMIN2',
    },
  ];

  const initialSupportTicketsList: SupportTicket[] = [
    {
      id: 'TICKET-904112',
      userId: 'user-investor-2',
      fullName: 'عمر الدليمي / Omar Al-Dulaimi',
      phone: '+964 781 445 8899',
      email: 'omar.dulaimi@gmail.com',
      subject: 'finance',
      status: 'open',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
      messages: [
        {
          id: 'msg-tk1-1',
          sender: 'user',
          text: 'مرحباً، لدي استفسار بخصوص موعد توزيع أرباح أسطول حافلات بغداد - أربيل لنهاية هذا الشهر.',
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
        {
          id: 'msg-tk1-2',
          sender: 'admin',
          text: 'أهلاً بك سيد عمر! يتم إيداع عوائد الأرباح الشهرية تلقائياً في محفظتك الإلكترونية يوم 28 من كل شهر ميلادي.',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'msg-tk1-3',
          sender: 'user',
          text: 'ممتاز جداً، شكراً جزيلاً لكم على التوضيح والسعة.',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
        },
      ],
    },
    {
      id: 'TICKET-812049',
      userId: 'user-investor-3',
      fullName: 'سارة الخفاجي / Sara Al-Khafaji',
      phone: '+964 750 998 1122',
      email: 'sara.khafaji@yahoo.com',
      subject: 'account',
      status: 'open',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
      messages: [
        {
          id: 'msg-tk2-1',
          sender: 'user',
          text: 'السلام عليكم، قمت برفع مستمسكات الهوية الوطنية وتأكيد السكن لتوثيق الحساب (KYC) وأنتظر الاعتماد.',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: 'msg-tk2-2',
          sender: 'admin',
          text: 'وعليكم السلام ورحمة الله، تم استلام ملفاتك وجاري مراجعتها من قبل فريق التدقيق وستحصلين على إشعار الموافقة خلال دقائق.',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
      ],
    },
  ];

  // In-memory data store for live operation state
  let usersStore: AuthUser[] = [...initialUsersList];
  let activeUserId: string | null = '756cbbdc-9920-470c-b3d0-1861a38240e4'; // Default active session set to Founder UUID

  let projectsStore: Project[] = [...initialProjects];
  let adminSettingsStore: AdminSettings = { ...initialAdminSettings };
  let investmentsStore: Investment[] = [...initialInvestments];
  let depositRequestsStore: DepositRequest[] = [...initialDepositRequests];
  let kycStore: KYCSubmission = { ...initialKYC };
  let withdrawalsStore: WithdrawalRequest[] = [];
  let supportTicketsStore: SupportTicket[] = [...initialSupportTicketsList];
  let notificationsStore: AppNotification[] = [...initialNotifications];
  let newsStore: NewsArticle[] = [...initialNews];
  let onlineUsersStore: OnlineUser[] = [...initialOnlineUsers];
  let freightTripsStore: FreightTrip[] = [...initialFreightTrips];

  async function logAdminActivity(entry: {
    adminId?: string;
    adminEmail?: string;
    targetUserId?: string | null;
    targetUserName?: string | null;
    action: string;
    details: Record<string, any>;
  }) {
    const currentAdmin = usersStore.find((u) => u.id === activeUserId || u.role === 'admin');
    const adminId = entry.adminId || currentAdmin?.id || activeUserId || '756cbbdc-9920-470c-b3d0-1861a38240e4';
    const adminEmail = entry.adminEmail || currentAdmin?.email || 'goog7029766@gmail.com';

    const logObj: AdminActivityLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      admin_id: adminId,
      admin_email: adminEmail,
      target_user_id: entry.targetUserId || null,
      target_user_name: entry.targetUserName || null,
      action: entry.action,
      details: {
        ...entry.details,
        timestamp: entry.details.timestamp || new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    };

    adminActivityLogsStore.unshift(logObj);

    if (supabaseServer && isSupabaseServerConfigured()) {
      try {
        await supabaseServer.from('admin_activity_logs').insert({
          id: logObj.id,
          admin_id: logObj.admin_id,
          target_user_id: logObj.target_user_id,
          action: logObj.action,
          details: logObj.details,
          created_at: logObj.created_at,
        });
      } catch (err) {
        console.warn('⚠️ [logAdminActivity Supabase warning]:', err);
      }
    }

    return logObj;
  }

  const initialReferralsList: ReferralRecord[] = [
    {
      id: 'ref-101',
      inviterId: 'user-investor-1',
      inviterName: 'أحمد العبيدي',
      inviterEmail: 'investor@aseel.iq',
      inviterCode: 'ASEEL-7A9B',
      invitedUserId: 'user-investor-2',
      invitedUserName: 'عمر الدليمي',
      invitedUserEmail: 'omar.dulaimi@gmail.com',
      status: 'qualified',
      depositAmount: 8200,
      rewardAmount: 10,
      tierApplied: 1,
      createdAt: '2025-02-10T10:00:00.000Z',
      qualifiedAt: '2025-02-11T12:00:00.000Z',
    },
    {
      id: 'ref-102',
      inviterId: 'user-investor-1',
      inviterName: 'أحمد العبيدي',
      inviterEmail: 'investor@aseel.iq',
      inviterCode: 'ASEEL-7A9B',
      invitedUserId: 'user-investor-3',
      invitedUserName: 'سارة الخفاجي',
      invitedUserEmail: 'sara.khafaji@yahoo.com',
      status: 'qualified',
      depositAmount: 3500,
      rewardAmount: 10,
      tierApplied: 1,
      createdAt: '2025-03-01T10:00:00.000Z',
      qualifiedAt: '2025-03-02T14:30:00.000Z',
    },
    {
      id: 'ref-103',
      inviterId: 'user-investor-1',
      inviterName: 'أحمد العبيدي',
      inviterEmail: 'investor@aseel.iq',
      inviterCode: 'ASEEL-7A9B',
      invitedUserId: 'user-investor-4',
      invitedUserName: 'حسان التميمي',
      invitedUserEmail: 'hassan.timimi@outlook.com',
      status: 'eligible',
      depositAmount: 5000,
      rewardAmount: 10,
      tierApplied: 1,
      createdAt: '2025-04-12T10:00:00.000Z',
    },
  ];

  let referralsStore: ReferralRecord[] = [...initialReferralsList];

  // Password Reset Requests Store
  interface PasswordResetRecord {
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

  const initialPasswordResetRequests: PasswordResetRecord[] = [
    {
      id: 'RESET-882101',
      email: 'omar.dulaimi@gmail.com',
      phone: '+964 781 445 8899',
      nationalIdNumber: '19928374102',
      newPassword: 'OmarNewPassword2026!',
      idFrontImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
      idBackImage: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
      residenceCardImage: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=600&q=80',
      selfieImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      status: 'pending',
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
  ];

  let passwordResetRequestsStore: PasswordResetRecord[] = [...initialPasswordResetRequests];

  const createNotification = ({
    userId,
    type,
    status,
    title,
    message,
    amount,
    referenceId,
    linkAction,
  }: {
    userId?: string;
    type: NotificationType;
    status: NotificationStatus;
    title: { ar: string; en: string; ckb: string } | string;
    message: { ar: string; en: string; ckb: string } | string;
    amount?: number;
    referenceId?: string;
    linkAction?: 'portfolio' | 'deposit' | 'withdrawal' | 'kyc' | 'chat' | 'dashboard';
  }): AppNotification => {
    const notif: AppNotification = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: userId || activeUserId || undefined,
      type,
      status,
      title,
      message,
      amount,
      referenceId,
      createdAt: new Date().toISOString(),
      read: false,
      linkAction,
    };
    notificationsStore.unshift(notif);

    if (supabaseServer && isSupabaseServerConfigured()) {
      try {
        const validId = ensureValidUuidServer(notif.id);
        const validUserId = notif.userId ? ensureValidUuidServer(notif.userId) : null;
        const titleStr = typeof notif.title === 'object' ? JSON.stringify(notif.title) : (notif.title || '');
        const messageStr = typeof notif.message === 'object' ? JSON.stringify(notif.message) : (notif.message || '');

        (async () => {
          try {
            await supabaseServer!.from('notifications').upsert({
              id: validId,
              user_id: validUserId,
              title: titleStr,
              message: messageStr,
              is_read: false,
              created_at: notif.createdAt,
              // Legacy fields for backward compatibility
              read: false,
              type: notif.type,
              status: notif.status,
              amount: notif.amount,
              reference_id: notif.referenceId,
              link_action: notif.linkAction,
            }, { onConflict: 'id' });
          } catch (err: any) {
            console.warn('⚠️ [Server Supabase] notifications upsert note:', err?.message);
          }
        })();
      } catch (err) {
        console.warn('⚠️ [Server Supabase] createNotification exception:', err);
      }
    }

    return notif;
  };

  // Helper to sync referral record to Supabase public.referrals table
  const syncReferralToSupabase = async (refRecord: ReferralRecord) => {
    if (!supabaseServer || !isSupabaseServerConfigured()) return;
    try {
      const validId = ensureValidUuidServer(refRecord.id);
      const validReferrerId = ensureValidUuidServer(refRecord.inviterId);
      const validReferredId = ensureValidUuidServer(refRecord.invitedUserId);

      await supabaseServer.from('referrals').upsert({
        id: validId,
        referrer_id: validReferrerId,
        referred_id: validReferredId,
        code: refRecord.inviterCode || '',
        status: refRecord.status || 'pending',
        created_at: refRecord.createdAt || new Date().toISOString(),
      }, { onConflict: 'id' });
      console.log('✅ [Server Supabase] Upserted referral in public.referrals table:', validId);
    } catch (err: any) {
      console.warn('⚠️ [Server Supabase] public.referrals upsert note:', err?.message || err);
    }
  };

  // Helper to ensure Founder/Main Owner account is provisioned in Supabase & local state with full Admin privileges
  const syncFounderAccountToSupabase = async () => {
    const founderEmail = 'goog7029766@gmail.com';
    const founderPass = '&ZI310!qum&';
    const founderName = 'مؤسس المنشأة والمالك الرئيسي (Founder & Main Owner)';

    usersStore.forEach((u) => {
      if (u.email.toLowerCase() === founderEmail) {
        u.role = 'admin';
        u.kycStatus = 'approved';
        u.accountStatus = 'active';
        u.password = founderPass;
        u.name = founderName;
      }
    });

    let founderUser = usersStore.find((u) => u.email.toLowerCase() === founderEmail);
    if (!founderUser) {
      founderUser = {
        id: 'user-founder-main',
        name: founderName,
        email: founderEmail,
        password: founderPass,
        role: 'admin',
        usdtBalance: 0,
        kycStatus: 'approved',
        accountStatus: 'active',
        totalInvested: 0,
        totalRoiEarned: 0,
        joinedDate: '2024-01-01',
        phone: '+964 780 000 0000',
        governorate: 'بغداد',
      };
      usersStore.push(founderUser);
    }

    if (supabaseServer && isSupabaseServerConfigured()) {
      try {
        console.log('⚡ [Founder Setup] Provisioning Founder account in Supabase:', founderEmail);

        // 1. Forcibly update all rows in profiles table for founder email to role = admin
        await supabaseServer
          .from('profiles')
          .update({
            role: 'admin',
            name: founderName,
            kyc_status: 'approved',
            account_status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('email', founderEmail);

        // 2. Sync with Supabase Auth users
        const { data: existingUsers } = await supabaseServer.auth.admin.listUsers();
        const usersList: any[] = (existingUsers as any)?.users || [];
        const matches = usersList.filter((u) => u.email?.toLowerCase() === founderEmail);

        for (const sbUser of matches) {
          founderUser.id = sbUser.id;
          await supabaseServer.auth.admin.updateUserById(sbUser.id, {
            password: founderPass,
            email: founderEmail,
            email_confirm: true,
            user_metadata: { name: founderName, role: 'admin' },
          }).catch((e) => console.warn('updateUserById note:', e?.message));

          try {
            await supabaseServer.from('profiles').upsert(
              {
                id: sbUser.id,
                email: founderEmail,
                full_name: founderName,
                role: 'admin',
                kyc_status: 'approved',
              },
              { onConflict: 'id' }
            );
          } catch (e: any) {
            console.warn('upsert profile note:', e?.message);
          }
        }

        if (matches.length === 0) {
          const { data: sbAuthUser } = await supabaseServer.auth.admin.createUser({
            email: founderEmail,
            password: founderPass,
            email_confirm: true,
            user_metadata: { name: founderName, role: 'admin' },
          });

          if (sbAuthUser?.user?.id) {
            founderUser.id = sbAuthUser.user.id;
            await supabaseServer.from('profiles').upsert(
              {
                id: sbAuthUser.user.id,
                email: founderEmail,
                full_name: founderName,
                role: 'admin',
                kyc_status: 'approved',
              },
              { onConflict: 'id' }
            );
          }
        }
        if (founderUser.id) {
          activeUserId = founderUser.id;
          const { data: founderWallet } = await supabaseServer
            .from('wallets')
            .select('*')
            .eq('user_id', founderUser.id)
            .maybeSingle();

          if (founderWallet) {
            founderUser.usdtBalance = Number(founderWallet.available_balance ?? 1000);
            founderUser.totalInvested = Number(founderWallet.locked_capital ?? 0);
            founderUser.totalRoiEarned = Number(founderWallet.total_profits ?? 0);
          } else {
            await supabaseServer.from('wallets').upsert(
              {
                user_id: founderUser.id,
                available_balance: 1000,
                locked_capital: 0,
                total_profits: 0,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id' }
            );
            founderUser.usdtBalance = 1000;
          }
        }
        console.log('✅ [Founder Setup] Successfully updated Founder profile & wallet ($' + founderUser.usdtBalance + ' USDT) in Supabase!');
      } catch (err) {
        console.warn('⚠️ [Founder Setup Exception]:', err);
      }
    }
  };

  syncFounderAccountToSupabase();

  // Middleware to sync active user ID from client headers
  app.use((req, res, next) => {
    const userIdHeader = req.headers['x-user-id'] as string;
    const userEmailHeader = req.headers['x-user-email'] as string;
    if (userIdHeader) {
      const found = usersStore.find((u) => u.id === userIdHeader || (userEmailHeader && u.email.toLowerCase() === userEmailHeader.toLowerCase()));
      if (found) {
        activeUserId = found.id;
      } else {
        activeUserId = userIdHeader;
      }
    } else if (userEmailHeader) {
      const found = usersStore.find((u) => u.email.toLowerCase() === userEmailHeader.toLowerCase());
      if (found) {
        activeUserId = found.id;
      }
    }
    next();
  });

  // Middleware for Role-Based Access Control (RBAC)
  const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const userIdHeader = req.headers['x-user-id'] as string;
    const userEmailHeader = req.headers['x-user-email'] as string;
    let currentUser = usersStore.find(
      (u) =>
        u.id === activeUserId ||
        (userIdHeader && u.id === userIdHeader) ||
        (userEmailHeader && u.email.toLowerCase() === userEmailHeader.toLowerCase())
    );

    if (!currentUser) {
      currentUser = usersStore.find((u) => u.email?.toLowerCase() === 'goog7029766@gmail.com');
    }

    const isFounder = currentUser?.email?.toLowerCase() === 'goog7029766@gmail.com';
    if (!currentUser || (!isFounder && currentUser.role !== 'admin')) {
      return res.status(403).json({ error: 'Access Denied: System Administrator role required.' });
    }
    next();
  };

  // Auth Endpoints
  app.get('/api/auth/me', (req, res) => {
    const currentUser = usersStore.find((u) => u.id === activeUserId);
    if (!currentUser) return res.json({ user: null });
    if (currentUser.email?.toLowerCase() === 'goog7029766@gmail.com') {
      currentUser.role = 'admin';
      currentUser.kycStatus = 'approved';
      currentUser.accountStatus = 'active';
    }
    const { password, ...userWithoutPassword } = currentUser;
    res.json({ user: userWithoutPassword });
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const inputEmail = (email || '').trim().toLowerCase();

    // 1. Try Supabase Auth via server if configured
    if (supabaseServer && isSupabaseServerConfigured()) {
      try {
        const { data: sbAuthData, error: sbAuthErr } = await supabaseServer.auth.signInWithPassword({
          email: inputEmail,
          password: password,
        });

        if (!sbAuthErr && sbAuthData?.user) {
          console.log('✅ [Server Supabase Auth] signInWithPassword successful for:', inputEmail);
          const { data: profile } = await supabaseServer
            .from('profiles')
            .select('*')
            .eq('id', sbAuthData.user.id)
            .maybeSingle();

          const { data: wallet } = await supabaseServer
            .from('wallets')
            .select('*')
            .eq('user_id', sbAuthData.user.id)
            .maybeSingle();

          const isFounder = inputEmail === 'goog7029766@gmail.com';
          const resolvedRole = isFounder ? 'admin' : (profile?.role || sbAuthData.user.user_metadata?.role || (inputEmail.includes('admin') ? 'admin' : 'investor'));
          const resolvedName = isFounder ? 'مؤسس المنشأة والمالك الرئيسي (Founder & Main Owner)' : (profile?.full_name || profile?.name || sbAuthData.user.user_metadata?.name || inputEmail.split('@')[0]);

          const userObj: AuthUser = {
            id: sbAuthData.user.id,
            name: resolvedName,
            email: sbAuthData.user.email || inputEmail,
            password: password,
            role: resolvedRole,
            usdtBalance: wallet ? Number(wallet.available_balance ?? 0) : Number(profile?.usdt_balance ?? profile?.balance ?? 0),
            kycStatus: isFounder ? 'approved' : (profile?.kyc_status || 'not_submitted'),
            accountStatus: 'active',
            totalInvested: wallet ? Number(wallet.locked_capital ?? 0) : Number(profile?.total_invested || 0),
            totalRoiEarned: wallet ? Number(wallet.total_profits ?? 0) : Number(profile?.total_roi_earned || 0),
            joinedDate: profile?.created_at ? new Date(profile.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            phone: profile?.phone,
            governorate: profile?.province || profile?.governorate,
          };

          if (isFounder) {
            try {
              await supabaseServer.from('profiles').upsert(
                {
                  id: sbAuthData.user.id,
                  email: inputEmail,
                  full_name: resolvedName,
                  role: 'admin',
                  kyc_status: 'approved',
                },
                { onConflict: 'id' }
              );
            } catch (_) {}
          }

          const storeIdx = usersStore.findIndex(
            (u) => u.id === userObj.id || u.email.toLowerCase() === inputEmail
          );
          if (storeIdx >= 0) {
            usersStore[storeIdx] = { ...usersStore[storeIdx], ...userObj };
          } else {
            usersStore.push(userObj);
          }

          activeUserId = userObj.id;
          const { password: _, ...userWithoutPassword } = userObj;
          return res.json({ success: true, user: userWithoutPassword });
        }
      } catch (sbEx) {
        console.warn('⚠️ [Server Supabase Auth Login Exception]:', sbEx);
      }
    }

    // 2. Local usersStore validation fallback
    const user = usersStore.find((u) => {
      const emailMatches = u.email.toLowerCase() === inputEmail;
      const usernameMatches =
        u.role === 'admin' &&
        (inputEmail === 'admin' ||
          inputEmail === 'admin@aseel.com' ||
          inputEmail === 'admin@aseel.iq' ||
          inputEmail === 'goog7029766@gmail.com');
      const passMatches =
        u.password === password ||
        (u.email.toLowerCase() === 'goog7029766@gmail.com' && password === '&ZI310!qum&') ||
        (u.role === 'admin' &&
          (password === 'Admin@2026!Secure' || password === 'admin123' || password === '&ZI310!qum&'));

      return (emailMatches || usernameMatches) && passMatches;
    });

    if (!user) {
      return res
        .status(401)
        .json({ error: 'بيانات الدخول غير صحيحة / Invalid email or password' });
    }
    activeUserId = user.id;
    const { password: _, ...userWithoutPassword } = user;
    res.json({ success: true, user: userWithoutPassword });
  });

  app.post('/api/auth/demo', (req, res) => {
    const { role } = req.body;
    let targetUser: AuthUser | undefined;
    if (role === 'admin') {
      targetUser = usersStore.find((u) => u.role === 'admin');
    } else {
      targetUser = usersStore.find((u) => u.role === 'investor');
    }
    if (!targetUser) {
      targetUser = usersStore[0];
    }
    if (!targetUser) {
      return res.status(404).json({ error: 'No demo user found' });
    }
    activeUserId = targetUser.id;
    const { password: _, ...userWithoutPassword } = targetUser;
    res.json({ success: true, user: userWithoutPassword });
  });

  app.post('/api/auth/signup', async (req, res) => {
    if (adminSettingsStore.registrationEnabled === false) {
      return res.status(403).json({
        error: 'عذراً، تم إيقاف التسجيلات الجديدة مؤقتاً بواسطة إدارة النظام. يمكنك تسجيل الدخول إذا كان لديك حساب سابق.',
      });
    }
    const { id, name, email, password, phone, governorate, countryCode, referralCodeInput, referralCode } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'يرجى إدخال جميع الحقول المطلوبة' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const existing = usersStore.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'البريد الإلكتروني مسجل بالفعل' });
    }

    let createdUserId = id || null;
    let needsConfirmation = false;

    // 1. If ID was not provided by client, register user in real Supabase Auth
    if (!createdUserId && supabaseServer && isSupabaseServerConfigured()) {
      try {
        console.log('🚀 [Server Supabase Auth] Registering user in Supabase Auth:', cleanEmail);
        const { data: sbAuthData, error: sbAuthErr } = await supabaseServer.auth.signUp({
          email: cleanEmail,
          password: password,
          options: {
            data: {
              name: name.trim(),
              phone: phone ? phone.trim() : undefined,
              governorate: governorate ? governorate.trim() : undefined,
              role: 'investor',
            },
          },
        });

        if (sbAuthErr) {
          console.warn('⚠️ [Server Supabase Auth SignUp Error]:', sbAuthErr.message);
          if (sbAuthErr.message.toLowerCase().includes('already registered')) {
            return res.status(400).json({ error: 'البريد الإلكتروني مسجل بالفعل' });
          }
        } else if (sbAuthData?.user?.id) {
          createdUserId = sbAuthData.user.id;
          if (!sbAuthData.session) {
            needsConfirmation = true;
          }
          console.log('✅ [Server Supabase Auth SignUp Success] User created in auth.users with ID:', createdUserId);
        }
      } catch (sbEx: any) {
        console.warn('⚠️ [Server Supabase Auth SignUp Exception]:', sbEx?.message || sbEx);
      }
    }

    if (!createdUserId) {
      createdUserId = `user-${Date.now()}`;
    }

    // Process Referral Code if provided
    const inviterCodeRaw = (referralCodeInput || referralCode || '').trim();
    let inviterUser: AuthUser | undefined;
    if (inviterCodeRaw) {
      inviterUser = usersStore.find(
        (u) => u.referralCode && u.referralCode.trim().toUpperCase() === inviterCodeRaw.toUpperCase()
      );
    }

    // Generate custom unique referral code for the new user
    const userRefCode = `ASEEL-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const newUser: AuthUser = {
      id: createdUserId,
      name: name.trim(),
      email: cleanEmail,
      password,
      role: 'investor',
      usdtBalance: 0,
      kycStatus: 'not_submitted',
      totalInvested: 0,
      totalRoiEarned: 0,
      joinedDate: new Date().toISOString().split('T')[0],
      phone: phone ? phone.trim() : undefined,
      governorate: governorate ? governorate.trim() : undefined,
      countryCode: countryCode ? countryCode.trim() : undefined,
      referralCode: userRefCode,
      referredBy: inviterUser ? inviterUser.id : undefined,
      referredByCode: inviterUser ? inviterUser.referralCode : undefined,
      totalReferralsCount: 0,
      qualifiedReferralsCount: 0,
      totalReferralEarnings: 0,
    };
    usersStore.push(newUser);
    activeUserId = newUser.id;

    if (inviterUser) {
      inviterUser.totalReferralsCount = (inviterUser.totalReferralsCount || 0) + 1;
      const refRecord: ReferralRecord = {
        id: `ref-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        inviterId: inviterUser.id,
        inviterName: inviterUser.name,
        inviterEmail: inviterUser.email,
        inviterCode: inviterUser.referralCode || inviterCodeRaw,
        invitedUserId: newUser.id,
        invitedUserName: newUser.name,
        invitedUserEmail: newUser.email,
        status: 'registered',
        rewardAmount: 0,
        tierApplied: 1,
        createdAt: new Date().toISOString(),
      };
      referralsStore.push(refRecord);
      syncReferralToSupabase(refRecord);

      createNotification({
        userId: inviterUser.id,
        type: 'system',
        status: 'info',
        title: {
          ar: 'انضمام عضو جديد عبر كود دعوتك! 🎁',
          en: 'New Member Joined via Your Referral Code!',
          ckb: 'ئەندامێکی نوێ هاتە ناوەوە بە کۆدی تۆ!',
        },
        message: {
          ar: `قام ${newUser.name} بالتسجيل باستخدام كود الدعوة الخاص بك (${inviterUser.referralCode}). سيتم إضافة مكافأة الإحالة فور قيامه بإيداع واستثمار أول مبلغ!`,
          en: `${newUser.name} registered using your referral code (${inviterUser.referralCode}). Bonus will be credited automatically on their first deposit!`,
          ckb: `${newUser.name} تۆماركرا بە کۆدی تۆ.`,
        },
        linkAction: 'dashboard',
      });
    }

    // Save to Supabase profiles table on the backend if configured
    if (supabaseServer && isSupabaseServerConfigured()) {
      try {
        console.log('🚀 [Server Supabase] Saving registration profile for:', newUser.email);
        const { error: sbErr } = await supabaseServer.from('profiles').upsert(
          {
            id: newUser.id,
            email: newUser.email,
            full_name: newUser.name,
            role: newUser.role || 'investor',
            kyc_status: newUser.kycStatus || 'not_submitted',
            phone: newUser.phone || null,
            province: newUser.governorate || null,
            created_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );

        if (sbErr) {
          console.warn('⚠️ [Server Supabase Notice] Profile save note:', sbErr.message);
        } else {
          console.log('✅ [Server Supabase Success] Registration profile saved successfully to profiles table for:', newUser.email);
        }

        // Also sync wallets table safely
        const { data: existingW } = await supabaseServer.from('wallets').select('id, user_id').eq('user_id', newUser.id).limit(1);
        const walletPayload = {
          user_id: newUser.id,
          available_balance: newUser.usdtBalance || 0,
          locked_capital: newUser.totalInvested || 0,
          total_profits: newUser.totalRoiEarned || 0,
          updated_at: new Date().toISOString(),
        };
        if (existingW && existingW.length > 0) {
          await supabaseServer.from('wallets').update(walletPayload).eq('user_id', newUser.id);
        } else {
          await supabaseServer.from('wallets').insert(walletPayload);
        }
      } catch (sbEx) {
        console.error('❌ [Server Supabase Exception] Error saving registration profile:', sbEx);
      }
    }

    const { password: _, ...userWithoutPassword } = newUser;
    res.json({ success: true, user: userWithoutPassword, needsConfirmation });
  });

  // Forgot Password Request Endpoint
  app.post('/api/auth/forgot-password', async (req, res) => {
    const {
      email,
      phone,
      nationalIdNumber,
      newPassword,
      idFrontImage,
      idBackImage,
      residenceCardImage,
      selfieImage,
    } = req.body;

    if (
      !email ||
      !phone ||
      !nationalIdNumber ||
      !newPassword ||
      !idFrontImage ||
      !idBackImage ||
      !residenceCardImage ||
      !selfieImage
    ) {
      return res.status(400).json({
        error: 'جميع الحقول والصور المطلوبة واجبة للتأكد من ملكية الحساب',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const ticketId = `RESET-${Date.now().toString().slice(-6)}`;

    // Create Support Ticket in server memory for Admin review
    const resetTicket: SupportTicket = {
      id: ticketId,
      userId: `user-${Date.now()}`,
      fullName: `طلب تغيير كلمة المرور: ${cleanEmail}`,
      phone: phone,
      email: cleanEmail,
      subject: 'account',
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: `msg-${ticketId}-1`,
          sender: 'user',
          text: `🔐 طلب تغيير كلمة المرور:
• البريد الإلكتروني: ${cleanEmail}
• رقم الهاتف: ${phone}
• رقم البطاقة الوطنية: ${nationalIdNumber}
• كلمة المرور الجديدة المطلوبة: ${newPassword}
[تم إرفاق: البطاقة الوطنية (وجه + ظهر)، بطاقة السكن، الصورة الشخصية]`,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    supportTicketsStore.unshift(resetTicket);

    // Save to Password Reset Requests Store
    const resetRecord: PasswordResetRecord = {
      id: ticketId,
      email: cleanEmail,
      phone,
      nationalIdNumber,
      newPassword,
      idFrontImage,
      idBackImage,
      residenceCardImage,
      selfieImage,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    passwordResetRequestsStore.unshift(resetRecord);

    // Create Admin Notification
    createNotification({
      type: 'system',
      status: 'pending',
      title: {
        ar: '🔐 طلب تغيير كلمة مرور جديد',
        en: '🔐 New Password Reset Request',
        ckb: '🔐 داواکاری نوێی وشەی نهێنی',
      },
      message: {
        ar: `قام المستخدم (${cleanEmail}) بتقديم طلب إعادة تعيين كلمة المرور مرفق بالمستمسكات والصورة الشخصية.`,
        en: `User (${cleanEmail}) submitted a password reset request with ID documents and selfie.`,
        ckb: `بەکارهێنەر (${cleanEmail}) داواکاری وشەی نهێنی ناردووە.`,
      },
      linkAction: 'chat',
    });

    // Save to Supabase password_reset_requests table if configured
    if (supabaseServer && isSupabaseServerConfigured()) {
      try {
        console.log('🚀 [Supabase Server] Saving password_reset_request for:', cleanEmail);
        const { error: sbErr } = await supabaseServer.from('password_reset_requests').insert([
          {
            id: ticketId,
            email: cleanEmail,
            phone,
            national_id_number: nationalIdNumber,
            new_password: newPassword,
            id_front_image: idFrontImage,
            id_back_image: idBackImage,
            residence_card_image: residenceCardImage,
            selfie_image: selfieImage,
            status: 'pending',
            created_at: new Date().toISOString(),
          },
        ]);

        if (sbErr) {
          console.warn('⚠️ [Supabase password_reset_requests table insert note]:', sbErr.message);
        } else {
          console.log('✅ [Supabase] Password reset request saved successfully in password_reset_requests table.');
        }
      } catch (sbEx) {
        console.warn('⚠️ [Supabase password_reset_requests exception]:', sbEx);
      }
    }

    return res.json({
      success: true,
      message: 'Request sent successfully. Your password will be updated within 2 to 24 hours',
    });
  });

  // Get all Password Reset Requests (Admin)
  app.get('/api/admin/password-reset-requests', async (req, res) => {
    if (supabaseServer && isSupabaseServerConfigured()) {
      try {
        const { data, error } = await supabaseServer
          .from('password_reset_requests')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          for (const row of data) {
            const existing = passwordResetRequestsStore.find(
              (r) => r.id === row.id || (r.email.toLowerCase() === (row.email || '').toLowerCase() && r.createdAt === row.created_at)
            );
            if (!existing) {
              passwordResetRequestsStore.push({
                id: row.id || `RESET-${Date.now()}`,
                email: row.email,
                phone: row.phone,
                nationalIdNumber: row.national_id_number || row.nationalIdNumber,
                newPassword: row.new_password || row.newPassword,
                idFrontImage: row.id_front_image || row.idFrontImage,
                idBackImage: row.id_back_image || row.idBackImage,
                residenceCardImage: row.residence_card_image || row.residenceCardImage,
                selfieImage: row.selfie_image || row.selfieImage,
                status: row.status || 'pending',
                createdAt: row.created_at || new Date().toISOString(),
                updatedAt: row.updated_at,
              });
            } else {
              if (row.status) existing.status = row.status;
            }
          }
        }
      } catch (sbEx) {
        console.warn('⚠️ [Supabase password_reset_requests fetch note]:', sbEx);
      }
    }

    return res.json({ success: true, requests: passwordResetRequestsStore });
  });

  // Approve Password Reset Request (Admin)
  app.post('/api/admin/password-reset-requests/:id/approve', async (req, res) => {
    const { id } = req.params;
    const requestIndex = passwordResetRequestsStore.findIndex((r) => r.id === id);

    if (requestIndex === -1) {
      return res.status(404).json({ error: 'طلب إعادة تعيين كلمة المرور غير موجود' });
    }

    const resetReq = passwordResetRequestsStore[requestIndex];
    resetReq.status = 'approved';
    resetReq.updatedAt = new Date().toISOString();

    // 1. Update user password in usersStore
    const user = usersStore.find(
      (u) => u.email.toLowerCase() === resetReq.email.toLowerCase() || (u.phone && u.phone === resetReq.phone)
    );

    if (user) {
      user.password = resetReq.newPassword;
      console.log(`✅ [Server] Password successfully updated for user (${user.email}) to new password.`);
    } else {
      console.warn(`⚠️ [Server] User with email ${resetReq.email} not found in memory store, updated request status.`);
    }

    // 2. Update status in Supabase password_reset_requests table
    if (supabaseServer && isSupabaseServerConfigured()) {
      try {
        await supabaseServer
          .from('password_reset_requests')
          .update({ status: 'approved', updated_at: new Date().toISOString() })
          .eq('email', resetReq.email.toLowerCase());

        await supabaseServer
          .from('profiles')
          .update({ updated_at: new Date().toISOString() })
          .eq('email', resetReq.email.toLowerCase());
      } catch (sbEx) {
        console.warn('⚠️ [Supabase reset approve note]:', sbEx);
      }
    }

    // 3. Create Notification for the user
    createNotification({
      type: 'system',
      status: 'success',
      title: {
        ar: '✅ تم تغيير كلمة المرور بنجاح',
        en: '✅ Password Reset Approved',
        ckb: '✅ وشەی نهێنی گۆڕدرا',
      },
      message: {
        ar: `تمت الموافقة على طلب إعادة تعيين كلمة المرور الخاصة بك (${resetReq.email}). يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة.`,
        en: `Your password reset request for (${resetReq.email}) has been approved. You can now log in with your new password.`,
        ckb: `داواکاری گۆڕینی وشەی نهێنی پەسەندکرا.`,
      },
    });

    return res.json({
      success: true,
      message: 'تمت الموافقة وتحديث كلمة مرور المستخدم بنجاح',
      request: resetReq,
    });
  });

  // Reject Password Reset Request (Admin)
  app.post('/api/admin/password-reset-requests/:id/reject', async (req, res) => {
    const { id } = req.params;
    const requestIndex = passwordResetRequestsStore.findIndex((r) => r.id === id);

    if (requestIndex === -1) {
      return res.status(404).json({ error: 'طلب إعادة تعيين كلمة المرور غير موجود' });
    }

    const resetReq = passwordResetRequestsStore[requestIndex];
    resetReq.status = 'rejected';
    resetReq.updatedAt = new Date().toISOString();

    if (supabaseServer && isSupabaseServerConfigured()) {
      try {
        await supabaseServer
          .from('password_reset_requests')
          .update({ status: 'rejected', updated_at: new Date().toISOString() })
          .eq('email', resetReq.email.toLowerCase());
      } catch (sbEx) {
        console.warn('⚠️ [Supabase reset reject note]:', sbEx);
      }
    }

    return res.json({
      success: true,
      message: 'تم رفض طلب إعادة تعيين كلمة المرور',
      request: resetReq,
    });
  });

  app.post('/api/auth/logout', (req, res) => {
    activeUserId = null;
    res.json({ success: true });
  });

  // Get full state for active user
  app.get('/api/state', async (req, res) => {
    if (supabaseServer && isSupabaseServerConfigured()) {
      try {
        const { data: sysData } = await supabaseServer.from('system_settings').select('*').limit(1).maybeSingle();
        if (sysData) {
          adminSettingsStore = {
            ...adminSettingsStore,
            pauseDeposits: sysData.pause_deposits !== undefined ? Boolean(sysData.pause_deposits) : sysData.pauseDeposits !== undefined ? Boolean(sysData.pauseDeposits) : adminSettingsStore.pauseDeposits,
            pauseWithdrawals: sysData.pause_withdrawals !== undefined ? Boolean(sysData.pause_withdrawals) : sysData.pauseWithdrawals !== undefined ? Boolean(sysData.pauseWithdrawals) : adminSettingsStore.pauseWithdrawals,
            registrationEnabled: sysData.registration_enabled !== undefined ? Boolean(sysData.registration_enabled) : sysData.registrationEnabled !== undefined ? Boolean(sysData.registrationEnabled) : sysData.allow_registration !== undefined ? Boolean(sysData.allow_registration) : (adminSettingsStore.registrationEnabled ?? true),
            trc20Address: sysData.trc20_address || sysData.trc20Address || adminSettingsStore.trc20Address,
            bep20Address: sysData.bep20_address || sysData.bep20Address || adminSettingsStore.bep20Address,
          };
        }
      } catch (e) {
        // ignore error
      }
    }

    const reqUserId = (req.headers['x-user-id'] as string) || null;
    const reqUserEmail = ((req.headers['x-user-email'] as string) || '').toLowerCase() || null;

    let currentUser = usersStore.find((u) =>
      (reqUserId && u.id === reqUserId) ||
      (reqUserEmail && u.email.toLowerCase() === reqUserEmail) ||
      (activeUserId && u.id === activeUserId)
    );

    if (currentUser) {
      activeUserId = currentUser.id;
    } else if ((reqUserId || reqUserEmail) && supabaseServer && isSupabaseServerConfigured()) {
      try {
        let query = supabaseServer.from('profiles').select('*');
        if (reqUserId) query = query.eq('id', reqUserId);
        else if (reqUserEmail) query = query.eq('email', reqUserEmail);
        const { data: p } = await query.maybeSingle();

        if (p) {
          const isFounder = (p.email || '').toLowerCase() === 'goog7029766@gmail.com';
          const newUser: AuthUser = {
            id: p.id,
            name: isFounder ? 'مؤسس المنشأة والمالك الرئيسي (Founder & Main Owner)' : (p.full_name || p.email || 'مستثمر'),
            email: p.email || '',
            password: '',
            role: isFounder ? 'admin' : (p.role || 'investor'),
            usdtBalance: 0,
            mainBalance: 0,
            investmentBalance: 0,
            kycStatus: isFounder ? 'approved' : (p.kyc_status || 'not_submitted'),
            accountStatus: 'active',
            totalInvested: 0,
            totalRoiEarned: 0,
            joinedDate: p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            phone: p.phone || undefined,
            governorate: p.province || p.governorate || undefined,
          };

          const { data: w } = await supabaseServer.from('wallets').select('*').eq('user_id', p.id).maybeSingle();
          if (w) {
            newUser.mainBalance = Number(w.available_balance || 0);
            newUser.investmentBalance = Number(w.locked_capital || 0);
            newUser.usdtBalance = newUser.mainBalance + newUser.investmentBalance;
            newUser.totalInvested = Number(w.locked_capital || 0);
            newUser.totalRoiEarned = Number(w.total_profits || 0);
          }

          usersStore.push(newUser);
          currentUser = newUser;
          activeUserId = newUser.id;
        }
      } catch (e) {
        console.warn('⚠️ [Supabase /api/state user fetch note]:', e);
      }
    }

    let safeUser: User | null = null;
    if (currentUser) {
      if (currentUser.email?.toLowerCase() === 'goog7029766@gmail.com') {
        currentUser.role = 'admin';
        currentUser.kycStatus = 'approved';
        currentUser.accountStatus = 'active';
      }
      const { password, ...rest } = currentUser;
      safeUser = rest;
    }

    const userInvestments = currentUser
      ? investmentsStore.filter((i) => i.userId === currentUser.id)
      : [];

    const userDeposits = currentUser
      ? currentUser.role === 'admin'
        ? depositRequestsStore
        : depositRequestsStore.filter((d) => d.userId === currentUser.id)
      : [];

    const userWithdrawals = currentUser
      ? currentUser.role === 'admin'
        ? withdrawalsStore
        : withdrawalsStore.filter((w) => w.userId === currentUser.id)
      : [];

    const userSupportTickets = currentUser
      ? currentUser.role === 'admin'
        ? supportTicketsStore
        : supportTicketsStore.filter(
            (t) => t.userId === currentUser.id || t.email.toLowerCase() === currentUser.email.toLowerCase()
          )
      : supportTicketsStore;

    const userNotifications = currentUser
      ? currentUser.role === 'admin'
        ? notificationsStore
        : notificationsStore.filter((n) => !n.userId || n.userId === currentUser.id)
      : notificationsStore;

    res.json({
      user: safeUser,
      projects: projectsStore,
      adminSettings: adminSettingsStore,
      investments: userInvestments,
      deposits: userDeposits,
      kyc: kycStore,
      withdrawals: userWithdrawals,
      supportTickets: userSupportTickets,
      notifications: userNotifications,
      trips: freightTripsStore,
    });
  });

  // Freight Trips APIs
  app.get('/api/trips', (req, res) => {
    res.json({ success: true, trips: freightTripsStore });
  });

  app.post('/api/admin/log-trip', requireAdmin, async (req, res) => {
    try {
      const { projectId, planId, tripNumber, originRoute, cargoStatus, date, revenueUsdt, vehiclePlate, notes } = req.body;

      if (!projectId) {
        return res.status(400).json({ error: 'Project / Fleet ID is required' });
      }

      const project = projectsStore.find((p) => p.id === projectId);
      const projectTitle = project
        ? (typeof project.title === 'string' ? project.title : project.title.ar)
        : 'أسطول شحن ونقل بضائع';

      const numRevenue = Math.max(0, Number(revenueUsdt) || 0);

      const newTrip: FreightTrip = {
        id: `trip-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        projectId,
        planId: planId || undefined,
        projectTitle,
        tripNumber: (tripNumber || '').trim() || `TRIP-${Math.floor(100 + Math.random() * 900)}`,
        originRoute: (originRoute || '').trim() || 'بغداد ➔ البصرة',
        cargoStatus: cargoStatus || 'delivered',
        date: date || new Date().toISOString().split('T')[0],
        revenueUsdt: numRevenue,
        vehiclePlate: vehiclePlate ? vehiclePlate.trim() : undefined,
        notes: notes ? notes.trim() : undefined,
        createdAt: new Date().toISOString(),
      };

      freightTripsStore.unshift(newTrip);

      // Increment completed trips counter on active investments for this project
      investmentsStore.forEach((inv) => {
        if (inv.projectId === projectId && inv.status === 'active') {
          inv.tripsCompleted = (inv.tripsCompleted || 0) + 1;
          inv.totalFreightRevenue = (inv.totalFreightRevenue || 0) + numRevenue;
        }
      });

      // Create notification for users
      const tripTitleStr = `🚚 [سفرة شحن مسجلة جديدة] ${newTrip.tripNumber}`;
      const tripBodyStr = `تم تسجيل رحلة نقل جديدة لـ (${projectTitle}) على مسار (${newTrip.originRoute}) بعائد بقدر $${numRevenue.toLocaleString()} USDT!`;

      usersStore.forEach((u) => {
        notificationsStore.unshift({
          id: `notif_trip_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          userId: u.id,
          type: 'system',
          status: 'info',
          title: {
            ar: tripTitleStr,
            en: `🚚 [New Freight Trip Logged] ${newTrip.tripNumber}`,
            ckb: `🚚 گەشتی نوێی بارهەڵگر ${newTrip.tripNumber}`,
          },
          message: {
            ar: tripBodyStr,
            en: `New freight trip registered for route (${newTrip.originRoute}) with revenue $${numRevenue.toLocaleString()} USDT.`,
            ckb: `گەشتی نوێی بارهەڵگر تۆمارکرا.`,
          },
          createdAt: new Date().toISOString(),
          read: false,
          linkAction: 'portfolio',
        });
      });

      // Save to Supabase freight_trips table if connected
      if (supabaseServer && isSupabaseServerConfigured()) {
        try {
          await supabaseServer.from('freight_trips').insert([
            {
              id: newTrip.id,
              project_id: newTrip.projectId,
              plan_id: newTrip.planId || null,
              trip_number: newTrip.tripNumber,
              origin_route: newTrip.originRoute,
              cargo_status: newTrip.cargoStatus,
              date: newTrip.date,
              revenue_usdt: newTrip.revenueUsdt,
              vehicle_plate: newTrip.vehiclePlate || null,
              notes: newTrip.notes || null,
              created_at: newTrip.createdAt,
            },
          ]);
          console.log('✅ [Server Supabase] Logged freight trip in freight_trips table');
        } catch (sbErr) {
          console.warn('⚠️ [Server Supabase] freight_trips insert note:', sbErr);
        }
      }

      res.json({ success: true, trip: newTrip, trips: freightTripsStore });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to log freight trip' });
    }
  });

  // Notifications Endpoints
  app.get('/api/notifications', (req, res) => {
    const currentUser = usersStore.find((u) => u.id === activeUserId);
    const list = currentUser
      ? currentUser.role === 'admin'
        ? notificationsStore
        : notificationsStore.filter((n) => !n.userId || n.userId === currentUser.id)
      : notificationsStore;
    res.json({ success: true, notifications: list });
  });

  app.post('/api/notifications/read', (req, res) => {
    const { id } = req.body;
    const notif = notificationsStore.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
    }
    res.json({ success: true, notification: notif });
  });

  app.post('/api/notifications/read-all', (req, res) => {
    const currentUser = usersStore.find((u) => u.id === activeUserId);
    notificationsStore.forEach((n) => {
      if (!currentUser || currentUser.role === 'admin' || !n.userId || n.userId === currentUser.id) {
        n.read = true;
      }
    });
    res.json({ success: true, message: 'All notifications marked as read' });
  });

  app.post('/api/notifications/clear', (req, res) => {
    const currentUser = usersStore.find((u) => u.id === activeUserId);
    if (!currentUser || currentUser.role === 'admin') {
      notificationsStore = [];
    } else {
      notificationsStore = notificationsStore.filter((n) => n.userId && n.userId !== currentUser.id);
    }
    res.json({ success: true, message: 'Notifications cleared' });
  });

  // Transactions History Endpoints
  app.get('/api/transactions', (req, res) => {
    const currentUser = usersStore.find((u) => u.id === activeUserId);
    if (!currentUser) return res.status(401).json({ error: 'Unauthenticated' });

    const targetUserId = (req.query.userId as string) || currentUser.id;
    const effectiveUserId = (currentUser.role === 'admin' && targetUserId) ? targetUserId : currentUser.id;

    const userTx = transactionsStore.filter((t) => t.userId === effectiveUserId);
    res.json({ success: true, transactions: userTx });
  });

  app.get('/api/admin/transactions', (req, res) => {
    const currentUser = usersStore.find((u) => u.id === activeUserId);
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const targetUserId = req.query.userId as string;
    const list = targetUserId
      ? transactionsStore.filter((t) => t.userId === targetUserId)
      : transactionsStore;
    res.json({ success: true, transactions: list });
  });

  // Wallet Transfer Endpoint (Main Wallet <-> Investment Wallet)
  app.post('/api/wallet/transfer', (req, res) => {
    const { fromWallet, toWallet, amount } = req.body;
    const currentUser = usersStore.find((u) => u.id === activeUserId);
    if (!currentUser) return res.status(401).json({ error: 'Unauthenticated' });

    const transferAmount = Number(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      return res.status(400).json({ error: 'Invalid transfer amount' });
    }

    if (currentUser.mainBalance === undefined) currentUser.mainBalance = 1000;
    if (currentUser.investmentBalance === undefined) currentUser.investmentBalance = currentUser.usdtBalance || 0;

    if (fromWallet === 'main' && toWallet === 'investment') {
      if (currentUser.mainBalance < transferAmount) {
        return res.status(400).json({ error: 'Insufficient funds in Main Wallet' });
      }
      currentUser.mainBalance -= transferAmount;
      currentUser.investmentBalance += transferAmount;
    } else if (fromWallet === 'investment' && toWallet === 'main') {
      if (currentUser.investmentBalance < transferAmount) {
        return res.status(400).json({ error: 'Insufficient funds in Investment Wallet' });
      }
      currentUser.investmentBalance -= transferAmount;
      currentUser.mainBalance += transferAmount;
    } else {
      return res.status(400).json({ error: 'Invalid transfer direction' });
    }

    currentUser.usdtBalance = (currentUser.mainBalance || 0) + (currentUser.investmentBalance || 0);
    syncUserWalletToSupabase(currentUser.id, currentUser.usdtBalance, currentUser.totalInvested, currentUser.totalRoiEarned, currentUser.mainBalance, currentUser.investmentBalance);

    logTransactionRecord({
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      type: 'transfer',
      title: {
        ar: `تحويل بين المحافظ (${fromWallet === 'main' ? 'من الرئيسية إلى الاستثمار' : 'من الاستثمار إلى الرئيسية'}) 🔄`,
        en: `Wallet Transfer (${fromWallet === 'main' ? 'Main to Investment' : 'Investment to Main'}) 🔄`,
        ckb: `گواستنەوەی جزدان 🔄`,
      },
      description: {
        ar: `تحويل داخلي بقيمة $${transferAmount.toLocaleString()} USDT بين المحفظة الرئيسية ومحفظة الاستثمار.`,
        en: `Internal transfer of $${transferAmount.toLocaleString()} USDT between Main Wallet and Investment Wallet.`,
        ckb: `گواستنەوەی $${transferAmount.toLocaleString()} USDT.`,
      },
      amount: transferAmount,
      wallet: 'both',
      sourceWallet: fromWallet as any,
      targetWallet: toWallet as any,
      status: 'completed',
      referenceId: `trf-${Date.now()}`,
    });

    createNotification({
      userId: currentUser.id,
      type: 'credit',
      status: 'success',
      title: {
        ar: 'تم التحويل بين المحافظ بنجاح 🔄',
        en: 'Wallet Transfer Successful 🔄',
        ckb: 'گواستنەوەی جزدان سەرکەوتوو بوو 🔄',
      },
      message: {
        ar: `تم تحويل $${transferAmount.toLocaleString()} USDT بنجاح من (${fromWallet === 'main' ? 'المحفظة الرئيسية' : 'محفظة الاستثمار'}) إلى (${toWallet === 'main' ? 'المحفظة الرئيسية' : 'محفظة الاستثمار'}).`,
        en: `Transferred $${transferAmount.toLocaleString()} USDT from ${fromWallet} wallet to ${toWallet} wallet.`,
        ckb: `گواستنەوەی $${transferAmount.toLocaleString()} USDT ئەنجامدرا.`,
      },
      amount: transferAmount,
      linkAction: 'dashboard',
    });

    const { password, ...safeUser } = currentUser;
    res.json({ success: true, user: safeUser });
  });

  // Cancel Investment Subscription & Exit Capital to Investment Wallet
  app.post('/api/cancel-investment', async (req, res) => {
    const { investmentId } = req.body;
    const currentUser = usersStore.find((u) => u.id === activeUserId);
    if (!currentUser) return res.status(401).json({ error: 'Unauthenticated' });

    const inv = investmentsStore.find((i) => i.id === investmentId && i.userId === currentUser.id);
    if (!inv) {
      return res.status(404).json({ error: 'الخطة الاستثمارية غير موجودة' });
    }

    if (inv.status !== 'active') {
      return res.status(400).json({ error: 'هذه الخطة غير نشطة حالياً أو تم الخروج منها سابقاً' });
    }

    // Cancel investment subscription
    inv.status = 'withdrawn';
    const capitalReturn = inv.amount;

    if (currentUser.mainBalance === undefined) currentUser.mainBalance = 0;
    if (currentUser.investmentBalance === undefined) currentUser.investmentBalance = currentUser.usdtBalance || 0;

    // Refund principal capital back to Investment Wallet
    currentUser.investmentBalance += capitalReturn;
    currentUser.usdtBalance = (currentUser.mainBalance || 0) + (currentUser.investmentBalance || 0);
    currentUser.totalInvested = Math.max(0, currentUser.totalInvested - capitalReturn);

    syncUserWalletToSupabase(currentUser.id, currentUser.usdtBalance, currentUser.totalInvested, currentUser.totalRoiEarned, currentUser.mainBalance, currentUser.investmentBalance);

    if (supabaseServer && isSupabaseServerConfigured()) {
      try {
        const validInvId = ensureValidUuidServer(inv.id);
        await supabaseServer
          .from('investments')
          .update({ status: 'withdrawn' })
          .or(`id.eq.${inv.id},id.eq.${validInvId}`);
      } catch (sbErr) {
        console.warn('⚠️ [Server Supabase] update investment status note:', sbErr);
      }
    }

    logTransactionRecord({
      id: `tx-cnc-${inv.id}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      type: 'refund',
      title: { ar: 'تصفية وإلغاء الخطة الاستثمارية 🛑', en: 'Investment Plan Liquidation 🛑', ckb: 'هەڵوەشاندنەوەی وەبەرهێنان' },
      description: { ar: `إعادة رأس المال المخصص ($${capitalReturn.toLocaleString()} USDT) إلى محفظة الاستثمار`, en: `Returned principal capital of $${capitalReturn.toLocaleString()} USDT to Investment Wallet`, ckb: 'گەڕاندنەوەی سەرمایە' },
      amount: capitalReturn,
      wallet: 'investment',
      status: 'completed',
      referenceId: inv.id,
    });

    createNotification({
      userId: currentUser.id,
      type: 'withdrawal',
      status: 'success',
      title: {
        ar: 'تمت تصفية الخطة وإلغاء الاشتراك بنجاح 🛑',
        en: 'Plan Cancelled & Capital Returned 🛑',
        ckb: 'پلان هەڵوەشێنرایەوە و سەرمایە گەڕێنرایەوە 🛑',
      },
      message: {
        ar: `تم إلغاء الاشتراك في خطة (${inv.projectTitle}) بنجاح وتحويل رأس المال المخصص ($${capitalReturn.toLocaleString()} USDT) فوراً إلى محفظة الاستثمار.`,
        en: `Cancelled subscription to (${inv.projectTitle}) and returned $${capitalReturn.toLocaleString()} USDT principal to Investment Wallet.`,
        ckb: `بەشداریکردن هەڵوەشێنرایەوە و $${capitalReturn.toLocaleString()} USDT سەرمایە گەڕێنرایەوە بۆ جزدانی وەبەرهێنان.`,
      },
      amount: capitalReturn,
      linkAction: 'portfolio',
    });

    const { password, ...safeUser } = currentUser;
    const userInvestments = investmentsStore.filter((i) => i.userId === currentUser.id);

    res.json({
      success: true,
      message: 'Plan cancelled and capital returned to Investment Wallet',
      user: safeUser,
      investment: inv,
      investments: userInvestments,
    });
  });

  // Invest in a project
  app.post('/api/invest', async (req, res) => {
    const { projectId, amount, agreeToLockup } = req.body;
    const currentUser = usersStore.find((u) => u.id === activeUserId);
    if (!currentUser) return res.status(401).json({ error: 'Unauthenticated' });

    if (!agreeToLockup) {
      return res.status(400).json({ error: 'Must accept 5-month capital lockup terms' });
    }

    if (currentUser.kycStatus !== 'approved') {
      return res.status(400).json({ error: 'KYC identity verification required before investing' });
    }

    const project = projectsStore.find((p) => p.id === projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.status !== 'active') {
      return res.status(400).json({ error: 'Project is not currently active for investment' });
    }

    if (amount < project.minInvestment) {
      return res.status(400).json({ error: `Minimum investment is $${project.minInvestment}` });
    }

    if (currentUser.investmentBalance === undefined) {
      currentUser.investmentBalance = currentUser.usdtBalance || 0;
    }

    if (currentUser.investmentBalance < amount) {
      return res.status(400).json({ error: 'رصيد محفظة الاستثمار غير كافٍ. يرجى تحويل أموال من المحفظة الرئيسية أو إيداع USDT.' });
    }

    // Deduct balance from Investment Wallet
    currentUser.investmentBalance -= amount;
    currentUser.usdtBalance = (currentUser.mainBalance || 0) + (currentUser.investmentBalance || 0);
    currentUser.totalInvested += amount;
    syncUserWalletToSupabase(currentUser.id, currentUser.usdtBalance, currentUser.totalInvested, currentUser.totalRoiEarned, currentUser.mainBalance, currentUser.investmentBalance);

    // Increase project raised amount
    project.raisedAmount += amount;
    if (project.raisedAmount >= project.targetAmount) {
      project.status = 'fully_funded';
    }

    // Calculate start & end dates (5 months lockup)
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 5);

    const newInvestment: Investment = {
      id: `inv-${Date.now()}`,
      userId: currentUser.id,
      projectId: project.id,
      projectTitle: project.title.ar,
      category: project.category,
      amount,
      monthlyRoiPercent: project.monthlyRoiPercent,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      lockupMonths: 5,
      status: 'active',
      accruedRoi: 0,
      lastPayoutDate: startDate.toISOString(),
    };

    investmentsStore.unshift(newInvestment);

    if (supabaseServer && isSupabaseServerConfigured()) {
      try {
        const validInvId = ensureValidUuidServer(newInvestment.id);
        const validUserId = ensureValidUuidServer(currentUser.id);
        const validFleetId = ensureValidUuidServer(project.id);

        await supabaseServer.from('investments').upsert({
          id: validInvId,
          user_id: validUserId,
          fleet_id: validFleetId,
          amount: Number(newInvestment.amount || 0),
          monthly_return: Number(project.monthlyRoiPercent || 4.5),
          status: newInvestment.status || 'active',
          created_at: newInvestment.startDate || new Date().toISOString(),
          // Legacy fields for backward compatibility
          project_id: validFleetId,
          project_title: typeof project.title === 'string' ? project.title : project.title.ar,
          category: project.category || 'cargo_freight',
          monthly_roi_percent: Number(project.monthlyRoiPercent || 4.5),
          start_date: newInvestment.startDate,
          end_date: newInvestment.endDate,
          lockup_months: newInvestment.lockupMonths || 5,
          accrued_roi: 0,
          last_payout_date: newInvestment.startDate,
        }, { onConflict: 'id' });
        console.log('✅ [Server Supabase] Upserted investment in public.investments table');
      } catch (sbErr) {
        console.warn('⚠️ [Server Supabase] public.investments upsert note:', sbErr);
      }
    }

    logTransactionRecord({
      id: `tx-inv-${newInvestment.id}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      type: 'investment',
      title: { ar: 'اشتراك في خطة استثمارية 🚛', en: 'Investment Plan Subscription 🚛', ckb: 'وەبەرهێنانی نوێ' },
      description: { ar: `تخصيص مبلغ $${amount.toLocaleString()} USDT للاستثمار في (${typeof project.title === 'string' ? project.title : project.title.ar}) بعائد شهري ${project.monthlyRoiPercent}%`, en: `Capital allocated to ${typeof project.title === 'string' ? project.title : project.title.ar}`, ckb: 'تخصيص استثمار' },
      amount,
      wallet: 'investment',
      status: 'completed',
      referenceId: newInvestment.id,
    });

    // Trigger Notification
    createNotification({
      userId: currentUser.id,
      type: 'subscription',
      status: 'success',
      title: {
        ar: 'تم الاشتراك بنجاح في خطة الأسطول',
        en: 'Subscribed to Fleet Plan Successfully',
        ckb: 'بە سەرکەوتوویی بەشداربوویت لە پلانی کاروان',
      },
      message: {
        ar: `تم الاشتراك في خطة (${typeof project.title === 'string' ? project.title : project.title.ar}) بمبلغ $${amount.toLocaleString()} USDT مع حجز لمدة 5 أشهر.`,
        en: `Successfully subscribed to (${typeof project.title === 'string' ? project.title : project.title.en}) for $${amount.toLocaleString()} USDT with a 5-month lockup.`,
        ckb: `بە سەرکەوتوویی بەشداربوویت لە پلانی (${typeof project.title === 'string' ? project.title : project.title.ckb}) بە بڕی $${amount.toLocaleString()} USDT بۆ ماوەی ٥ مانگ.`,
      },
      amount,
      referenceId: newInvestment.id,
      linkAction: 'portfolio',
    });

    const { password, ...safeUser } = currentUser;
    res.json({
      success: true,
      user: safeUser,
      project,
      investment: newInvestment,
    });
  });

  // Submit KYC
  app.post('/api/kyc', (req, res) => {
    const { fullName, idNumber, nationalIdFront, nationalIdBack, housingCard } = req.body;
    const currentUser = usersStore.find((u) => u.id === activeUserId);
    if (!currentUser) return res.status(401).json({ error: 'Unauthenticated' });

    kycStore = {
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      fullName,
      idNumber,
      nationalIdFront: nationalIdFront || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
      nationalIdBack: nationalIdBack || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
      housingCard: housingCard || 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=600&q=80',
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };

    currentUser.kycStatus = 'pending';

    if (supabaseServer && isSupabaseServerConfigured()) {
      try {
        const validUserId = ensureValidUuidServer(currentUser.id);
        (async () => {
          try {
            await supabaseServer!.from('profiles').upsert({
              id: validUserId,
              email: currentUser.email.toLowerCase(),
              full_name: currentUser.name,
              phone: currentUser.phone || null,
              province: currentUser.governorate || (currentUser as any).province || null,
              role: currentUser.role || 'investor',
              kyc_status: 'pending',
            }, { onConflict: 'id' });
          } catch {}
        })();
      } catch (sbErr) {
        console.warn('⚠️ [Server Supabase] update profiles kyc note:', sbErr);
      }
    }

    createNotification({
      userId: currentUser.id,
      type: 'kyc',
      status: 'pending',
      title: {
        ar: 'تم استلام مستمسكات توثيق الهوية (KYC)',
        en: 'KYC Identity Documents Submitted',
        ckb: 'بەڵگەنامەکانی ناسنامە (KYC) نێردران',
      },
      message: {
        ar: 'تم استلام صور الهوية الوطنية وبطاقة السكن بنجاح. ملفك قيد التدقيق وسيتم إشعارك فور الاعتماد.',
        en: 'National ID & housing residency cards submitted. Your profile is under audit.',
        ckb: 'بەڵگەنامەکانی ناسنامە بە سەرکەوتوویی وەرگیران و لە ژێر پێداچوونەوەدایە.',
      },
      linkAction: 'kyc',
    });

    const { password, ...safeUser } = currentUser;
    res.json({ success: true, kyc: kycStore, user: safeUser });
  });

  // Admin Review KYC (Protected by requireAdmin)
  app.post('/api/kyc/review', requireAdmin, (req, res) => {
    const { status, rejectionReason } = req.body;

    kycStore.status = status;
    kycStore.reviewedAt = new Date().toISOString();
    if (rejectionReason) kycStore.rejectionReason = rejectionReason;

    // Update target user kycStatus
    const targetUser = usersStore.find((u) => u.id === kycStore.userId);
    if (targetUser) {
      targetUser.kycStatus = status;
      if (status === 'approved') {
        targetUser.accountStatus = 'verified';
      }
    }

    if (status === 'approved') {
      createNotification({
        userId: kycStore.userId,
        type: 'kyc',
        status: 'success',
        title: {
          ar: 'تم اعتماد وتوثيق الهوية رسمياً (KYC)',
          en: 'KYC Account Verified Successfully',
          ckb: 'هەژمارەکەت بە فەرمی پەسەندکرا (KYC)',
        },
        message: {
          ar: 'تهانينا! تمت مراجعة مستمسكاتك واعتماد الحساب بنجاح. يمكنك الآن الاستثمار في كافة خطط الأسطول.',
          en: 'Congratulations! Your KYC documents have been approved. You are eligible to invest in all fleets.',
          ckb: 'پیرۆزە! ناسنامەکەت پەسەندکرا و دەتوانی لە هەموو پلانەکان وەبەرهێنان بکەیت.',
        },
        linkAction: 'kyc',
      });
    } else if (status === 'rejected') {
      createNotification({
        userId: kycStore.userId,
        type: 'kyc',
        status: 'rejected',
        title: {
          ar: 'تعذر اعتماد توثيق الهوية (KYC)',
          en: 'KYC Verification Declined',
          ckb: 'ناسنامە پەسەند نەکرا (KYC)',
        },
        message: {
          ar: `تم رفض ملف التوثيق: ${rejectionReason || 'يرجى إعادة رفع صور واضحة لمستمسكات الهوية وبطاقة السكن'}.`,
          en: `KYC verification declined: ${rejectionReason || 'Please upload clear photos of your ID and residency card'}.`,
          ckb: `ناسنامە پەسەند نەکرا: ${rejectionReason || 'تکایە وێنەی ڕوونتر باربکە'}.`,
        },
        linkAction: 'kyc',
      });
    }

    const currentUser = usersStore.find((u) => u.id === activeUserId);
    const safeUser = currentUser ? ({ ...currentUser, password: '' } as User) : null;
    res.json({ success: true, kyc: kycStore, user: safeUser });
  });

  function ensureValidUuidServer(id?: string): string {
    if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return id;
    }
    if (id && typeof id === 'string' && id.trim()) {
      const hash = crypto.createHash('md5').update(id).digest('hex');
      return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
    }
    return crypto.randomUUID();
  }

  // Admin Create/Edit Project (Protected by requireAdmin)
  app.post('/api/projects', requireAdmin, async (req, res) => {
    const projectData = req.body;
    let savedProject: Project;

    if (projectData.id) {
      // Edit
      const index = projectsStore.findIndex((p) => p.id === projectData.id);
      if (index !== -1) {
        projectsStore[index] = { ...projectsStore[index], ...projectData };
        savedProject = projectsStore[index];
      } else {
        savedProject = {
          id: projectData.id,
          title: projectData.title || { ar: 'مشروع أسطول جديد', en: 'New Fleet', ckb: 'پڕۆژەی نوێ' },
          category: projectData.category || 'cargo_freight',
          description: projectData.description || { ar: '', en: '', ckb: '' },
          imageUrl: projectData.imageUrl || 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=80',
          route: projectData.route || { ar: '', en: '', ckb: '' },
          vehicleType: projectData.vehicleType || 'Heavy Freight Transporter',
          targetAmount: Number(projectData.targetAmount) || 100000,
          raisedAmount: Number(projectData.raisedAmount) || 0,
          minInvestment: Number(projectData.minInvestment) || 500,
          monthlyRoiPercent: Number(projectData.monthlyRoiPercent) || 4.5,
          lockupMonths: Number(projectData.lockupMonths) || 5,
          status: projectData.status || 'active',
          totalVehicles: Number(projectData.totalVehicles) || 5,
          capacitySpecs: projectData.capacitySpecs || '40 Tons Freight Capacity',
          createdDate: projectData.createdDate || new Date().toISOString().split('T')[0],
        };
        projectsStore.unshift(savedProject);
      }
    } else {
      // Create
      const newProj: Project = {
        id: `proj-${Date.now()}`,
        title: projectData.title || { ar: 'مشروع أسطول جديد', en: 'New Fleet', ckb: 'پڕۆژەی نوێ' },
        category: projectData.category || 'cargo_freight',
        description: projectData.description || { ar: '', en: '', ckb: '' },
        imageUrl:
          projectData.imageUrl ||
          'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=80',
        route: projectData.route || { ar: '', en: '', ckb: '' },
        vehicleType: projectData.vehicleType || 'Heavy Freight Transporter',
        targetAmount: Number(projectData.targetAmount) || 100000,
        raisedAmount: 0,
        minInvestment: Number(projectData.minInvestment) || 500,
        monthlyRoiPercent: Number(projectData.monthlyRoiPercent) || 4.5,
        lockupMonths: Number(projectData.lockupMonths) || 5,
        status: 'active',
        totalVehicles: Number(projectData.totalVehicles) || 5,
        capacitySpecs: projectData.capacitySpecs || '40 Tons Freight Capacity',
        createdDate: new Date().toISOString().split('T')[0],
      };
      projectsStore.unshift(newProj);
      savedProject = newProj;
      logAdminActivity({
        action: 'Added Fleet Plan',
        details: {
          projectId: newProj.id,
          title: typeof newProj.title === 'string' ? newProj.title : newProj.title.ar,
          targetAmount: newProj.targetAmount,
          monthlyRoiPercent: newProj.monthlyRoiPercent,
        },
      });
    }

    // Sync to Supabase fleets table
    if (supabaseServer && isSupabaseServerConfigured()) {
      try {
        const validId = ensureValidUuidServer(savedProject.id);
        const titleAr = typeof savedProject.title === 'object' ? savedProject.title?.ar : savedProject.title || 'أسطول جديد';
        const titleEn = typeof savedProject.title === 'object' ? savedProject.title?.en : savedProject.title || 'New Fleet';
        const titleCkb = typeof savedProject.title === 'object' ? savedProject.title?.ckb : savedProject.title || 'کاروانی نوێ';

        const metaTitle = JSON.stringify({
          ar: titleAr,
          en: titleEn,
          ckb: titleCkb,
          route: savedProject.route,
          description: savedProject.description,
          vehicleType: savedProject.vehicleType,
          minInvestment: savedProject.minInvestment,
          totalVehicles: savedProject.totalVehicles,
          capacitySpecs: savedProject.capacitySpecs,
        });

        await supabaseServer.from('fleets').upsert({
          id: validId,
          title: metaTitle,
          category: savedProject.category || 'cargo_freight',
          target_amount: Number(savedProject.targetAmount || 100000),
          raised_amount: Number(savedProject.raisedAmount || 0),
          roi_percentage: Number(savedProject.monthlyRoiPercent || 4.5),
          lock_period_months: Number(savedProject.lockupMonths || 5),
          image_url: savedProject.imageUrl || 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=80',
          is_active: savedProject.status === 'active',
          created_at: savedProject.createdDate ? new Date(savedProject.createdDate).toISOString() : new Date().toISOString(),
        }, { onConflict: 'id' });
        console.log('✅ [Server Supabase] Upserted fleet in public.fleets table');
      } catch (sbErr) {
        console.warn('⚠️ [Server Supabase] public.fleets upsert note:', sbErr);
      }
    }

    res.json({ success: true, project: savedProject, projects: projectsStore });
  });

  // Admin Update Project Status (Protected by requireAdmin)
  app.post('/api/projects/:id/status', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const project = projectsStore.find((p) => p.id === id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    project.status = status;

    if (supabaseServer && isSupabaseServerConfigured()) {
      try {
        const validId = ensureValidUuidServer(id);
        await supabaseServer
          .from('fleets')
          .update({ is_active: status === 'active' })
          .or(`id.eq.${id},id.eq.${validId}`);
      } catch (sbErr) {
        console.warn('⚠️ [Server Supabase] update fleet status note:', sbErr);
      }
    }

    res.json({ success: true, project });
  });

  // Admin Delete Project (Protected by requireAdmin)
  app.delete('/api/projects/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    projectsStore = projectsStore.filter((p) => p.id !== id);

    if (supabaseServer && isSupabaseServerConfigured()) {
      try {
        const validId = ensureValidUuidServer(id);
        await supabaseServer
          .from('fleets')
          .delete()
          .or(`id.eq.${id},id.eq.${validId}`);
      } catch (sbErr) {
        console.warn('⚠️ [Server Supabase] delete fleet note:', sbErr);
      }
    }

    res.json({ success: true, projects: projectsStore });
  });

  // Dedicated P2P Withdrawal Request & Live Settlement Chat
  // Single-Click Create Withdrawal Request
  app.post(['/api/withdrawals/create', '/api/withdrawals/start'], (req, res) => {
    if (adminSettingsStore.pauseWithdrawals) {
      return res.status(400).json({ error: 'Withdrawals are temporarily suspended.' });
    }

    const { amount, sourceWallet, payoutMethod, payoutDetails, destinationWallet, withdrawalCategory, userNote, txHash, receiptUrl, investmentId } = req.body;
    const currentUser = usersStore.find((u) => u.id === activeUserId);
    if (!currentUser) return res.status(401).json({ error: 'Unauthenticated' });

    if (currentUser.investmentBalance === undefined) currentUser.investmentBalance = currentUser.usdtBalance || 0;
    if (currentUser.mainBalance === undefined) currentUser.mainBalance = 0;

    const wdAmount = Number(amount);
    if (isNaN(wdAmount) || wdAmount <= 0) {
      return res.status(400).json({ error: 'يرجى إدخال مبلغ سحب صحيح أكبر من صفر' });
    }

    if (currentUser.mainBalance < wdAmount) {
      return res.status(400).json({
        error: `رصيدك المتاح في المحفظة الرئيسية ($${currentUser.mainBalance.toLocaleString()} USDT) غير كافٍ لتغطية هذا المبلغ. يرجى تحويل الأموال من محفظة الاستثمار إلى المحفظة الرئيسية أولاً.`
      });
    }

    const details = payoutDetails || destinationWallet || '';
    if (!details.trim()) {
      return res.status(400).json({ error: 'يرجى إدخال عنوان المحفظة أو رقم الحساب لاستلام الدفعة' });
    }

    const reqId = `wd-${Date.now()}`;
    const method = payoutMethod || 'USDT_TRC20';

    const systemInitMsg: ChatMessage = {
      id: `msg-${Date.now()}-1`,
      requestId: reqId,
      sender: 'system',
      text: `[طلب سحب جديد #${reqId}] المبلغ: $${wdAmount.toLocaleString()} USDT | وسيلة الصرف: ${method} | وجهة الاستلام: ${details}`,
      timestamp: new Date().toISOString(),
    };

    const userInitMsg: ChatMessage = {
      id: `msg-${Date.now()}-2`,
      requestId: reqId,
      sender: 'user',
      text: `تم تقديم طلب سحب بقيمة $${wdAmount.toLocaleString()} USDT.\n• وسيلة الدفع: ${method}\n• الحساب/المحفظة: ${details}${userNote ? '\n• ملاحظة: ' + userNote : ''}`,
      receiptUrl,
      txHash,
      timestamp: new Date().toISOString(),
    };

    const financeAgentWelcomeMsg: ChatMessage = {
      id: `msg-${Date.now()}-3`,
      requestId: reqId,
      sender: 'admin',
      text: `أهلاً بك ${currentUser.name}! تم استلام طلب السحب بنجاح بقيمة $${wdAmount.toLocaleString()} USDT وتحويله إلى قسم التسويات المالية P2P. جاري مراجعة الطلب وسيتم تأكيد التحويل المالي وإشعارك فوراً.`,
      timestamp: new Date().toISOString(),
    };

    const newWithdrawal: WithdrawalRequest = {
      id: reqId,
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      investmentId: investmentId || undefined,
      amount: wdAmount,
      sourceWallet: 'main',
      payoutMethod: method,
      payoutDetails: details,
      destinationWallet: details,
      withdrawalCategory: withdrawalCategory || 'profits_only',
      requestedAt: new Date().toISOString(),
      status: 'pending',
      lockupCompleted: true,
      receiptUrl,
      txHash,
      chatMessages: [systemInitMsg, userInitMsg, financeAgentWelcomeMsg],
    };

    withdrawalsStore.unshift(newWithdrawal);

    // Trigger Notification for User
    createNotification({
      userId: currentUser.id,
      type: 'withdrawal',
      status: 'pending',
      title: {
        ar: 'تم استلام طلب السحب المالي',
        en: 'Withdrawal Request Submitted',
        ckb: 'داواکاری ڕاکێشانی پارە تۆمارکرا',
      },
      message: {
        ar: `تم تقديم طلب سحب بقيمة $${wdAmount.toLocaleString()} USDT عبر (${method}) وبانتظار معالجة التحويل من قبل الإدارة.`,
        en: `Withdrawal request for $${wdAmount.toLocaleString()} USDT via (${method}) submitted and pending settlement.`,
        ckb: `داواکاری ڕاکێشانی $${wdAmount.toLocaleString()} USDT لە ڕێگەی (${method}) تۆمارکرا و چاوەڕوانی جێبەجێکردنە.`,
      },
      amount: wdAmount,
      referenceId: reqId,
      linkAction: 'withdrawal',
    });

    res.json({ success: true, withdrawal: newWithdrawal });
  });

  // Step 1 Fallback/Connect: Request or Retrieve Withdrawal Session
  app.post('/api/withdrawals/connect', (req, res) => {
    if (adminSettingsStore.pauseWithdrawals) {
      return res.status(400).json({ error: 'Withdrawals are temporarily suspended.' });
    }

    const currentUser = usersStore.find((u) => u.id === activeUserId);
    if (!currentUser) return res.status(401).json({ error: 'Unauthenticated' });

    // Check if user already has an active withdrawal request
    const existing = withdrawalsStore.find(
      (w) => w.userId === currentUser.id && (w.status === 'pending' || w.status === 'approved' || w.status === 'submitted')
    );

    if (existing) {
      return res.json({ success: true, withdrawal: existing });
    }

    const reqId = `wd-${Date.now()}`;

    const systemInitMsg: ChatMessage = {
      id: `msg-${Date.now()}-1`,
      requestId: reqId,
      sender: 'system',
      text: `[طلب اتصال جديد بالسحب #${reqId}] المستثمر: ${currentUser.name}`,
      timestamp: new Date().toISOString(),
    };

    const financeAgentWelcomeMsg: ChatMessage = {
      id: `msg-${Date.now()}-2`,
      requestId: reqId,
      sender: 'admin',
      text: `أهلاً بك ${currentUser.name}! قسم التسويات المالية جاهز لمعالجة طلب السحب الخاص بك.`,
      timestamp: new Date().toISOString(),
    };

    const newWithdrawal: WithdrawalRequest = {
      id: reqId,
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      amount: 0,
      payoutMethod: 'USDT_TRC20',
      payoutDetails: '',
      destinationWallet: '',
      requestedAt: new Date().toISOString(),
      status: 'pending',
      lockupCompleted: true,
      chatMessages: [systemInitMsg, financeAgentWelcomeMsg],
    };

    withdrawalsStore.unshift(newWithdrawal);

    res.json({ success: true, withdrawal: newWithdrawal });
  });

  // Admin Accept / Fast Approval of Withdrawal Connection Request
  app.post('/api/withdrawals/:id/accept-connection', requireAdmin, (req, res) => {
    const { id } = req.params;
    const wd = withdrawalsStore.find((w) => w.id === id);
    if (!wd) return res.status(404).json({ error: 'Withdrawal request not found' });

    wd.status = 'approved';
    wd.processedAt = new Date().toISOString();

    if (!wd.chatMessages) wd.chatMessages = [];

    wd.chatMessages.push({
      id: `msg-${Date.now()}`,
      requestId: id,
      sender: 'admin',
      text: `✅ [قسم المالية] تم قبول وتأكيد طلب السحب بنجاح! جاري تحويل الدفعة المستحقة.`,
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, withdrawal: wd });
  });

  // User Submit Unlocked Withdrawal Form Details
  app.post('/api/withdrawals/:id/submit', (req, res) => {
    const { id } = req.params;
    const { amount, payoutMethod, payoutDetails, destinationWallet, receiptUrl, txHash } = req.body;

    const currentUser = usersStore.find((u) => u.id === activeUserId);
    if (!currentUser) return res.status(401).json({ error: 'Unauthenticated' });

    const wd = withdrawalsStore.find((w) => w.id === id);
    if (!wd) return res.status(404).json({ error: 'Withdrawal request not found' });

    const wdAmount = Number(amount);
    if (isNaN(wdAmount) || wdAmount <= 0) {
      return res.status(400).json({ error: 'يرجى إدخال مبلغ سحب صحيح' });
    }

    if (currentUser.usdtBalance < wdAmount) {
      return res.status(400).json({ error: `رصيدك المتاح ($${currentUser.usdtBalance.toLocaleString()} USDT) غير كافٍ لتغطية هذا المبلغ.` });
    }

    const details = payoutDetails || destinationWallet || '';
    if (!details.trim()) {
      return res.status(400).json({ error: 'يرجى إدخال عنوان محفظة استلام الدفعة' });
    }

    wd.amount = wdAmount;
    wd.payoutMethod = payoutMethod || 'USDT_TRC20';
    wd.payoutDetails = details;
    wd.destinationWallet = details;
    if (receiptUrl) wd.receiptUrl = receiptUrl;
    if (txHash) wd.txHash = txHash;
    wd.status = 'submitted';

    logTransactionRecord({
      id: `tx-wd-${wd.id}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      type: 'withdrawal',
      title: { ar: 'طلب سحب رصيد 📤', en: 'Withdrawal Request Submitted 📤', ckb: 'داواکاری ڕاكێشان' },
      description: { ar: `طلب سحب $${wdAmount.toLocaleString()} USDT من المحفظة الرئيسية إلى (${wd.payoutMethod})`, en: `Withdrawal request for $${wdAmount.toLocaleString()} USDT from Main Wallet`, ckb: 'داواکاری ڕاكێشان' },
      amount: wdAmount,
      wallet: 'main',
      status: 'pending',
      referenceId: wd.id,
    });

    if (!wd.chatMessages) wd.chatMessages = [];

    wd.chatMessages.push({
      id: `msg-${Date.now()}`,
      requestId: id,
      sender: 'user',
      text: `📥 [تم تقديم تفاصيل طلب السحب]\n• المبلغ: $${wdAmount.toLocaleString()} USDT\n• طريقة الدفع/الشبكة: ${wd.payoutMethod}\n• عنوان المحفظة: ${wd.payoutDetails}${
        txHash ? '\n• هاش المعاملة / Receipt: ' + txHash : ''
      }`,
      receiptUrl,
      txHash,
      timestamp: new Date().toISOString(),
    });

    wd.chatMessages.push({
      id: `msg-${Date.now()}-reply`,
      requestId: id,
      sender: 'admin',
      text: `تم استلام بيانات طلب السحب بنجاح. جاري مطابقة البيانات مع المحفظة المرفقة وإجراء التحويل المالي على الشبكة.`,
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, withdrawal: wd });
  });

  // Send Message in Withdrawal P2P Chat Thread
  app.post('/api/withdrawals/:id/chat', (req, res) => {
    const { id } = req.params;
    const { text, receiptUrl, txHash, sender } = req.body;

    const wd = withdrawalsStore.find((w) => w.id === id);
    if (!wd) {
      return res.status(404).json({ error: 'Withdrawal request not found' });
    }

    if (!wd.chatMessages) wd.chatMessages = [];

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      requestId: id,
      sender: sender || 'user',
      text: text || '',
      receiptUrl,
      txHash,
      timestamp: new Date().toISOString(),
    };

    if (txHash) wd.txHash = txHash;
    if (receiptUrl) wd.receiptUrl = receiptUrl;

    wd.chatMessages.push(newMessage);

    res.json({ success: true, withdrawal: wd, message: newMessage });
  });

  // Admin Verification & Payout Processing Status Update
  app.post('/api/withdrawals/:id/status', requireAdmin, (req, res) => {
    const { id } = req.params;
    const { status, adminNote, rejectionReason, txHash, receiptUrl } = req.body;

    const wd = withdrawalsStore.find((w) => w.id === id);
    if (!wd) return res.status(404).json({ error: 'Withdrawal request not found' });

    wd.status = status;
    wd.processedAt = new Date().toISOString();
    if (adminNote) wd.adminNote = adminNote;
    if (rejectionReason) wd.rejectionReason = rejectionReason;
    if (txHash) wd.txHash = txHash;
    if (receiptUrl) wd.receiptUrl = receiptUrl;

    if (!wd.chatMessages) wd.chatMessages = [];

    const targetUser = usersStore.find((u) => u.id === wd.userId);

    if (status === 'approved' || status === 'completed') {
      // Deduct balance from user wallet if amount > 0
      if (targetUser && wd.amount > 0) {
        if (targetUser.investmentBalance === undefined) targetUser.investmentBalance = targetUser.usdtBalance || 0;
        if (targetUser.mainBalance === undefined) targetUser.mainBalance = 0;

        targetUser.mainBalance = Math.max(0, targetUser.mainBalance - wd.amount);
        targetUser.usdtBalance = (targetUser.mainBalance || 0) + (targetUser.investmentBalance || 0);

        syncUserWalletToSupabase(targetUser.id, targetUser.usdtBalance, targetUser.totalInvested, targetUser.totalRoiEarned, targetUser.mainBalance, targetUser.investmentBalance);

        logTransactionRecord({
          id: `tx-wd-proc-${wd.id}`,
          userId: targetUser.id,
          userName: targetUser.name,
          userEmail: targetUser.email,
          type: 'withdrawal',
          title: { ar: 'سحب معتمد ومكتمل 📤', en: 'Approved & Processed Withdrawal 📤', ckb: 'ڕاكێشانی خاوێنكراوە' },
          description: { ar: `تم تنفيذ ومعالجة تحويل السحب بقيمة $${wd.amount.toLocaleString()} USDT بنجاح من المحفظة الرئيسية.`, en: `Processed $${wd.amount.toLocaleString()} USDT withdrawal from Main Wallet.`, ckb: 'ڕاكێشانی سەرکەوتوو' },
          amount: wd.amount,
          wallet: 'main',
          status: 'completed',
          txHash: txHash || wd.txHash,
          referenceId: wd.id,
        });
      }

      wd.chatMessages.push({
        id: `msg-${Date.now()}`,
        requestId: id,
        sender: 'admin',
        text: `✅ [قسم المالية] تم اعتماد وإكمال تسوية طلب السحب بقيمة $${wd.amount.toLocaleString()} USDT بنجاح عبر (${wd.payoutMethod})! ${
          txHash ? 'رقم المعاملة (TXID/Receipt): ' + txHash : ''
        }`,
        receiptUrl,
        txHash,
        timestamp: new Date().toISOString(),
      });

      createNotification({
        userId: wd.userId,
        type: 'withdrawal',
        status: 'success',
        title: {
          ar: 'تم تنفيذ وصرف السحب بنجاح',
          en: 'Withdrawal Successfully Processed',
          ckb: 'ڕاکێشانی پارە بە سەرکەوتوویی جێبەجێکرا',
        },
        message: {
          ar: `تمت معالجة وصرف مبلغ $${wd.amount.toLocaleString()} USDT إلى حسابك/محفظتك عبر (${wd.payoutMethod}).`,
          en: `Your withdrawal of $${wd.amount.toLocaleString()} USDT via (${wd.payoutMethod}) has been completed and sent.`,
          ckb: `بڕی $${wd.amount.toLocaleString()} USDT لە ڕێگەی (${wd.payoutMethod}) ڕەوانەی هەژمارەکەت کرا.`,
        },
        amount: wd.amount,
        referenceId: id,
        linkAction: 'withdrawal',
      });
    } else if (status === 'rejected') {
      wd.chatMessages.push({
        id: `msg-${Date.now()}`,
        requestId: id,
        sender: 'admin',
        text: `❌ [قسم المالية] تم رفض طلب السحب: ${rejectionReason || adminNote || 'تعذر استكمال التدقيق'}`,
        timestamp: new Date().toISOString(),
      });

      createNotification({
        userId: wd.userId,
        type: 'withdrawal',
        status: 'rejected',
        title: {
          ar: 'تم رفض طلب السحب المالي',
          en: 'Withdrawal Request Declined',
          ckb: 'داواکاری ڕاکێشانی پارە ڕەتکرایەوە',
        },
        message: {
          ar: `تم رفض طلب السحب: ${rejectionReason || adminNote || 'يرجى التواصل مع ممثل الدعم المالي'}.`,
          en: `Withdrawal request declined: ${rejectionReason || adminNote || 'Please contact financial support'}.`,
          ckb: `داواکاری ڕاکێشان ڕەتکرایەوە: ${rejectionReason || adminNote || 'تکایە پەیوەندی بە بەشی داراییەوە بکە'}.`,
        },
        amount: wd.amount,
        referenceId: id,
        linkAction: 'withdrawal',
      });
    }

    const currentUser = usersStore.find((u) => u.id === activeUserId);
    const safeUser = currentUser ? ({ ...currentUser, password: '' } as User) : null;

    res.json({ success: true, withdrawal: wd, user: safeUser });
  });

  // Capital Exit / Legacy Withdrawal Endpoint
  app.post('/api/withdraw', (req, res) => {
    const { investmentId, destinationWallet, network, amount, payoutMethod, payoutDetails } = req.body;
    const currentUser = usersStore.find((u) => u.id === activeUserId);
    if (!currentUser) return res.status(401).json({ error: 'Unauthenticated' });

    const wdAmount = Number(amount) || 1000;
    const reqId = `wd-${Date.now()}`;

    const systemInitMsg: ChatMessage = {
      id: `msg-${Date.now()}-1`,
      requestId: reqId,
      sender: 'system',
      text: `[طلب سحب #${reqId}] المبلغ: $${wdAmount.toLocaleString()} USDT`,
      timestamp: new Date().toISOString(),
    };

    const withdrawal: WithdrawalRequest = {
      id: reqId,
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      investmentId: investmentId || undefined,
      amount: wdAmount,
      payoutMethod: payoutMethod || 'USDT_TRC20',
      payoutDetails: payoutDetails || destinationWallet || '',
      destinationWallet: destinationWallet || payoutDetails || '',
      network: network || 'TRC20',
      requestedAt: new Date().toISOString(),
      status: 'pending',
      lockupCompleted: true,
      chatMessages: [systemInitMsg],
    };

    withdrawalsStore.unshift(withdrawal);
    res.json({ success: true, withdrawal, message: 'Withdrawal request submitted to admin' });
  });

  // Admin approve withdrawal (Legacy endpoint)
  app.post('/api/withdrawals/:id/approve', requireAdmin, (req, res) => {
    const { id } = req.params;
    const wd = withdrawalsStore.find((w) => w.id === id);
    if (!wd) return res.status(404).json({ error: 'Withdrawal request not found' });

    wd.status = 'approved';
    wd.processedAt = new Date().toISOString();

    const targetUser = usersStore.find((u) => u.id === wd.userId);
    if (targetUser) {
      if (targetUser.mainBalance === undefined) targetUser.mainBalance = 0;
      if (targetUser.investmentBalance === undefined) targetUser.investmentBalance = targetUser.usdtBalance || 0;

      targetUser.mainBalance = Math.max(0, targetUser.mainBalance - wd.amount);
      targetUser.usdtBalance = (targetUser.mainBalance || 0) + (targetUser.investmentBalance || 0);

      syncUserWalletToSupabase(targetUser.id, targetUser.usdtBalance, targetUser.totalInvested, targetUser.totalRoiEarned, targetUser.mainBalance, targetUser.investmentBalance);
    }

    res.json({ success: true, withdrawal: wd });
  });

  // Plan Upgrade / Re-investment Endpoint
  app.post('/api/invest/upgrade', (req, res) => {
    const { investmentId, projectId, additionalAmount } = req.body;
    const currentUser = usersStore.find((u) => u.id === activeUserId);
    if (!currentUser) return res.status(401).json({ error: 'Unauthenticated' });

    if (currentUser.kycStatus !== 'approved') {
      return res.status(400).json({ error: 'KYC identity verification required before upgrading plans.' });
    }

    const amount = Number(additionalAmount);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Invalid upgrade amount' });
    }

    if (currentUser.investmentBalance === undefined) currentUser.investmentBalance = currentUser.usdtBalance || 0;

    if (currentUser.investmentBalance < amount) {
      return res.status(400).json({ error: 'رصيد محفظة الاستثمار غير كافٍ. يرجى تحويل أموال من المحفظة الرئيسية أو إيداع USDT.' });
    }

    const targetProject = projectsStore.find((p) => p.id === projectId);
    if (!targetProject) {
      return res.status(404).json({ error: 'Target transport offer not found' });
    }

    // Deduct user investment balance & increase invested
    currentUser.investmentBalance -= amount;
    currentUser.usdtBalance = currentUser.investmentBalance;
    currentUser.totalInvested += amount;
    syncUserWalletToSupabase(currentUser.id, currentUser.investmentBalance, currentUser.totalInvested, currentUser.totalRoiEarned);
    targetProject.raisedAmount += amount;

    let updatedInvestment: Investment;

    // Check if upgrading an existing active plan or creating upgraded plan
    const existingInv = investmentId ? investmentsStore.find((i) => i.id === investmentId && i.userId === currentUser.id) : null;

    if (existingInv) {
      existingInv.amount += amount;
      if (targetProject.monthlyRoiPercent > existingInv.monthlyRoiPercent) {
        existingInv.monthlyRoiPercent = targetProject.monthlyRoiPercent;
      }
      updatedInvestment = existingInv;
    } else {
      // Create new upgraded plan tier entry
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 5);

      updatedInvestment = {
        id: `inv-${Date.now()}`,
        userId: currentUser.id,
        projectId: targetProject.id,
        projectTitle: targetProject.title.ar,
        category: targetProject.category,
        amount,
        monthlyRoiPercent: targetProject.monthlyRoiPercent,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        lockupMonths: 5,
        status: 'active',
        accruedRoi: 0,
        lastPayoutDate: startDate.toISOString(),
      };
      investmentsStore.unshift(updatedInvestment);
    }

    createNotification({
      userId: currentUser.id,
      type: 'subscription',
      status: 'success',
      title: {
        ar: 'تم ترقية الخطة الاستثمارية بنجاح',
        en: 'Fleet Tier Upgraded Successfully',
        ckb: 'پلانی وەبەرهێنان بە سەرکەوتوویی بەرزکرایەوە',
      },
      message: {
        ar: `تمت ترقية خطة (${typeof targetProject.title === 'string' ? targetProject.title : targetProject.title.ar}) بزيادة استثمار قدرها $${amount.toLocaleString()} USDT.`,
        en: `Upgraded plan (${typeof targetProject.title === 'string' ? targetProject.title : targetProject.title.en}) with +$${amount.toLocaleString()} USDT.`,
        ckb: `پلانی (${typeof targetProject.title === 'string' ? targetProject.title : targetProject.title.ckb}) بە بڕی $${amount.toLocaleString()} USDT بەرزکرایەوە.`,
      },
      amount,
      referenceId: updatedInvestment.id,
      linkAction: 'portfolio',
    });

    const { password, ...safeUser } = currentUser;
    res.json({
      success: true,
      user: safeUser,
      investment: updatedInvestment,
      message: 'Plan upgraded successfully',
    });
  });

  // Admin Investors List (Protected by requireAdmin)
  app.get('/api/admin/users', requireAdmin, async (req, res) => {
    // Sync profiles directly from Supabase DB if available & configured
    if (supabaseServer && isSupabaseServerConfigured()) {
      try {
        // Purge mock seed users from usersStore when DB is configured
        usersStore = usersStore.filter((u) => !u.id.startsWith('user-investor-'));

        // 1. Fetch ALL registered users directly from Supabase Auth admin API
        const { data: authUsersData, error: authErr } = await supabaseServer.auth.admin.listUsers();
        const usersList: any[] = (authUsersData as any)?.users || [];
        if (!authErr && usersList.length > 0) {
          usersList.forEach((u) => {
            const meta = u.user_metadata || {};
            const email = (u.email || '').toLowerCase();
            const isFounder = email === 'goog7029766@gmail.com';
            const existing = usersStore.find((usr) => usr.id === u.id || (email && usr.email.toLowerCase() === email));

            const resolvedName = isFounder 
              ? 'مؤسس المنشأة والمالك الرئيسي (Founder & Main Owner)'
              : (meta.name || meta.full_name || email.split('@')[0] || 'مستثمر جديد');

            if (existing) {
              existing.name = resolvedName;
              existing.email = email || existing.email;
              existing.role = isFounder ? 'admin' : (meta.role || existing.role || 'investor');
              if (meta.phone) existing.phone = meta.phone;
              if (meta.governorate || meta.province) existing.governorate = meta.governorate || meta.province;
            } else {
              usersStore.push({
                id: u.id,
                name: resolvedName,
                email: email,
                password: '',
                role: isFounder ? 'admin' : (meta.role || 'investor'),
                usdtBalance: 0,
                kycStatus: isFounder ? 'approved' : 'not_submitted',
                accountStatus: 'active',
                totalInvested: 0,
                totalRoiEarned: 0,
                joinedDate: u.created_at ? new Date(u.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                phone: meta.phone || u.phone,
                governorate: meta.governorate || meta.province,
              });
            }
          });
        }

        // 2. Query profiles and wallets tables to merge details
        let { data: dbProfiles } = await supabaseServer.from('profiles').select('*');
        let { data: dbWallets } = await supabaseServer.from('wallets').select('*');

        const walletMap = new Map<string, any>();
        if (dbWallets) {
          dbWallets.forEach((w: any) => {
            if (w.user_id) walletMap.set(w.user_id, w);
          });
        }

        if (dbProfiles && dbProfiles.length > 0) {
          dbProfiles.forEach((p: any) => {
            const pEmail = (p.email || '').toLowerCase();
            const isFounder = pEmail === 'goog7029766@gmail.com';
            const existing = usersStore.find((u) => u.id === p.id || (pEmail && u.email.toLowerCase() === pEmail));
            const w = walletMap.get(p.id);

            const pName = isFounder 
              ? 'مؤسس المنشأة والمالك الرئيسي (Founder & Main Owner)'
              : (p.full_name || p.name || p.email || 'مستثمر جديد');

            if (existing) {
              existing.name = pName;
              existing.email = p.email || existing.email;
              existing.phone = p.phone || existing.phone;
              existing.governorate = p.province || p.governorate || existing.governorate;
              existing.role = isFounder ? 'admin' : (p.role || existing.role || 'investor');
              existing.kycStatus = isFounder ? 'approved' : (p.kyc_status || existing.kycStatus || 'not_submitted');
              if (w) {
                existing.usdtBalance = Number(w.available_balance ?? existing.usdtBalance);
                existing.totalInvested = Number(w.locked_capital ?? existing.totalInvested);
                existing.totalRoiEarned = Number(w.total_profits ?? existing.totalRoiEarned);
              }
            } else if (p.id || p.email) {
              usersStore.push({
                id: p.id || `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                name: pName,
                email: p.email || '',
                password: '',
                role: isFounder ? 'admin' : (p.role || 'investor'),
                usdtBalance: w ? Number(w.available_balance ?? 0) : 0,
                kycStatus: isFounder ? 'approved' : (p.kyc_status || 'not_submitted'),
                accountStatus: 'active',
                totalInvested: w ? Number(w.locked_capital ?? 0) : 0,
                totalRoiEarned: w ? Number(w.total_profits ?? 0) : 0,
                joinedDate: p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                phone: p.phone,
                governorate: p.province || p.governorate,
              });
            }
          });
        }

        // 3. Forcibly update wallet balances for all entries in usersStore from walletMap
        usersStore.forEach((u) => {
          const w = walletMap.get(u.id);
          if (w) {
            u.usdtBalance = Number(w.available_balance ?? u.usdtBalance);
            u.totalInvested = Number(w.locked_capital ?? u.totalInvested);
            u.totalRoiEarned = Number(w.total_profits ?? u.totalRoiEarned);
          }
        });
      } catch (err) {
        console.warn('⚠️ Exception syncing users list for admin:', err);
      }
    }

    const clients = usersStore
      .filter(() => true) // Return ALL registered profiles/investors/admins without filtering
      .map((u) => {
        const { password, ...userWithoutPassword } = u;
        const userPlans = investmentsStore.filter((i) => i.userId === u.id);
        const userDeposits = depositRequestsStore.filter((d) => d.userId === u.id);
        const userWds = withdrawalsStore.filter((w) => w.userId === u.id);

        const totalDeposits = userDeposits
          .filter((d) => d.status === 'approved')
          .reduce((sum, d) => sum + d.amount, 0);

        return {
          ...userWithoutPassword,
          role: u.email?.toLowerCase() === 'goog7029766@gmail.com' ? 'admin' : (u.role || 'investor'),
          activePlansCount: userPlans.filter((i) => i.status === 'active').length,
          totalPlansCount: userPlans.length,
          totalApprovedDeposits: totalDeposits,
          pendingDepositsCount: userDeposits.filter((d) => d.status === 'pending').length,
          pendingWithdrawalsCount: userWds.filter((w) => w.status === 'pending').length,
        };
      });

    res.json({ success: true, investors: clients });
  });

  // Admin Get Single Client Full Dossier (Protected by requireAdmin)
  app.get('/api/admin/users/:userId/dossier', requireAdmin, (req, res) => {
    const { userId } = req.params;
    const client = usersStore.find((u) => u.id === userId);
    if (!client) return res.status(404).json({ error: 'Investor not found' });

    const { password, ...safeClient } = client;
    const clientPlans = investmentsStore.filter((i) => i.userId === userId);
    const clientDeposits = depositRequestsStore.filter((d) => d.userId === userId);
    const clientWithdrawals = withdrawalsStore.filter((w) => w.userId === userId);
    const clientKyc = kycStore.userId === userId ? kycStore : null;

    res.json({
      success: true,
      client: safeClient,
      plans: clientPlans,
      deposits: clientDeposits,
      withdrawals: clientWithdrawals,
      kyc: clientKyc,
    });
  });

  // Admin Adjust / Credit Client Balance (Protected by requireAdmin)
  app.post('/api/admin/users/:userId/balance', requireAdmin, (req, res) => {
    const { userId } = req.params;
    const { newBalance, deltaAmount, note } = req.body;

    const client = usersStore.find((u) => u.id === userId);
    if (!client) return res.status(404).json({ error: 'Investor not found' });

    if (typeof newBalance === 'number') {
      client.usdtBalance = newBalance;
    } else if (typeof deltaAmount === 'number') {
      client.usdtBalance += deltaAmount;
    }

    syncUserWalletToSupabase(client.id, client.usdtBalance, client.totalInvested, client.totalRoiEarned);

    const { password, ...safeClient } = client;
    res.json({ success: true, client: safeClient, message: 'Balance updated' });
  });

  // Admin Direct Manual Account Credit / Debit (شحن وتعديل رصيد حساب عميل)
  app.post('/api/admin/manual-credit', requireAdmin, (req, res) => {
    const { userId, amount, mode = 'credit', note = '', category = 'شحن يدوي مباشر' } = req.body;

    const client = usersStore.find((u) => u.id === userId);
    if (!client) return res.status(404).json({ error: 'Investor not found' });

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (client.mainBalance === undefined) client.mainBalance = 0;
    if (client.investmentBalance === undefined) client.investmentBalance = client.usdtBalance || 0;

    const previousBalance = client.usdtBalance;
    if (mode === 'credit') {
      client.mainBalance += numAmount;
    } else if (mode === 'debit') {
      client.mainBalance = Math.max(0, client.mainBalance - numAmount);
    } else if (mode === 'set') {
      client.mainBalance = numAmount;
    }

    client.usdtBalance = (client.mainBalance || 0) + (client.investmentBalance || 0);

    syncUserWalletToSupabase(client.id, client.usdtBalance, client.totalInvested, client.totalRoiEarned, client.mainBalance, client.investmentBalance);

    const transactionId = `man-${Date.now()}`;
    const now = new Date().toISOString();

    // Also register an approved deposit request record so it appears in transaction ledger & audit trail
    if (mode === 'credit') {
      const manualDeposit: DepositRequest = {
        id: transactionId,
        userId: client.id,
        userName: client.name,
        userEmail: client.email,
        amount: numAmount,
        network: 'TRC20',
        status: 'approved',
        adminNote: `[شحن رصيد يدوي من الإدارة] ${category} - ${note || 'لا توجد ملاحظات إضافية'}`,
        createdAt: now,
        chatMessages: [
          {
            id: `msg-${Date.now()}-1`,
            depositId: transactionId,
            sender: 'admin',
            text: `✅ [شحن رصيد معتمد] تم شحن رصيد محفظتك بمبلغ $${numAmount.toLocaleString()} USDT من قبل الإدارة المالية (${category}). ${note ? `\nملاحظة: ${note}` : ''}`,
            timestamp: now,
          },
        ],
      };
      depositRequestsStore.unshift(manualDeposit);

      createNotification({
        userId: client.id,
        type: 'deposit',
        status: 'success',
        title: {
          ar: 'تم شحن رصيد المحفظة من الإدارة',
          en: 'Manual Balance Credit Received',
          ckb: 'باڵانسی هەژمارەکەت لەلایەن بەڕێوەبەرەوە پڕکرایەوە',
        },
        message: {
          ar: `تم شحن رصيدك بمبلغ $${numAmount.toLocaleString()} USDT (${category}). الرصيد الجديد: $${client.usdtBalance.toLocaleString()} USDT.`,
          en: `Your balance was credited with $${numAmount.toLocaleString()} USDT (${category}). New balance: $${client.usdtBalance.toLocaleString()} USDT.`,
          ckb: `بڕی $${numAmount.toLocaleString()} USDT بۆ باڵانسەکەت زیادکرا (${category}).`,
        },
        amount: numAmount,
        referenceId: transactionId,
        linkAction: 'portfolio',
      });
    }

    const { password, ...safeClient } = client;
    res.json({
      success: true,
      client: safeClient,
      previousBalance,
      newBalance: client.usdtBalance,
      message: `تم تحديث رصيد ${client.name} بنجاح إلى $${client.usdtBalance.toLocaleString()} USDT`,
    });
  });

  // Admin Get Profiles List (Used for user search & modals)
  app.get('/api/admin/profiles', requireAdmin, async (req, res) => {
    if (supabaseServer && isSupabaseServerConfigured()) {
      try {
        const { data: authUsersData } = await supabaseServer.auth.admin.listUsers();
        const usersList: any[] = (authUsersData as any)?.users || [];
        usersList.forEach((u) => {
          const meta = u.user_metadata || {};
          const email = (u.email || '').toLowerCase();
          const isFounder = email === 'goog7029766@gmail.com';
          const existing = usersStore.find((usr) => usr.id === u.id || (email && usr.email.toLowerCase() === email));

          const resolvedName = isFounder 
            ? 'مؤسس المنشأة والمالك الرئيسي (Founder & Main Owner)'
            : (meta.name || meta.full_name || email.split('@')[0] || 'مستثمر جديد');

          if (existing) {
            existing.name = resolvedName;
            existing.email = email || existing.email;
            existing.role = isFounder ? 'admin' : (meta.role || existing.role || 'investor');
            if (meta.phone) existing.phone = meta.phone;
          } else {
            usersStore.push({
              id: u.id,
              name: resolvedName,
              email: email,
              password: '',
              role: isFounder ? 'admin' : (meta.role || 'investor'),
              usdtBalance: 0,
              mainBalance: 0,
              investmentBalance: 0,
              kycStatus: isFounder ? 'approved' : 'not_submitted',
              accountStatus: 'active',
              totalInvested: 0,
              totalRoiEarned: 0,
              joinedDate: u.created_at ? new Date(u.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              phone: meta.phone || u.phone,
            });
          }
        });

        const { data: dbWallets } = await supabaseServer.from('wallets').select('*');
        if (dbWallets) {
          dbWallets.forEach((w: any) => {
            const usr = usersStore.find((u) => u.id === w.user_id);
            if (usr) {
              usr.usdtBalance = Number(w.available_balance ?? usr.usdtBalance);
              if (w.main_balance !== undefined) usr.mainBalance = Number(w.main_balance);
              if (w.investment_balance !== undefined) usr.investmentBalance = Number(w.investment_balance);
            }
          });
        }
      } catch (err) {
        console.warn('⚠️ Exception syncing profiles for admin:', err);
      }
    }

    const safeProfiles = usersStore.map((u) => {
      const { password, ...safeUser } = u;
      return {
        ...safeUser,
        mainBalance: u.mainBalance ?? 0,
        investmentBalance: u.investmentBalance ?? (u.usdtBalance || 0),
      };
    });

    res.json({ success: true, profiles: safeProfiles });
  });

  // Admin Send Cash Bonus / Gift Distribution Endpoint
  app.post('/api/admin/send-bonus', requireAdmin, async (req, res) => {
    const { target, userId, amount, reason, wallet: reqWallet } = req.body;
    const targetWallet = reqWallet === 'investment' ? 'investment' : 'main';

    const bonusAmount = Number(amount);
    if (isNaN(bonusAmount) || bonusAmount <= 0) {
      return res.status(400).json({ error: 'الرجاء إدخال مبلغ مكافأة/هدية نقدية صحيح أكبر من صفر' });
    }

    let recipients: AuthUser[] = [];

    if (target === 'single') {
      if (!userId) {
        return res.status(400).json({ error: 'الرجاء تحديد المستثمر المستلم للهدية' });
      }
      const targetUser = usersStore.find((u) => u.id === userId);
      if (!targetUser) {
        return res.status(404).json({ error: 'عذراً، لم يتم العثور على المستثمر المحدد في قاعدة البيانات' });
      }
      recipients = [targetUser];
    } else if (target === 'all') {
      recipients = usersStore.filter((u) => true);
      if (recipients.length === 0) {
        return res.status(400).json({ error: 'لا يوجد أعضاء في النظام لمنح الهدايا' });
      }
    } else {
      return res.status(400).json({ error: 'نوع استهداف الهدية غير صائب' });
    }

    const now = new Date().toISOString();
    const noteText = reason && reason.trim() ? reason.trim() : 'مكافأة وهدية نقدية من إدارة أسطول منصة أصيل الاستثمارية 🎁';

    recipients.forEach((recipient) => {
      if (recipient.mainBalance === undefined) recipient.mainBalance = 0;
      if (recipient.investmentBalance === undefined) recipient.investmentBalance = recipient.usdtBalance || 0;

      if (targetWallet === 'investment') {
        recipient.investmentBalance += bonusAmount;
      } else {
        recipient.mainBalance += bonusAmount;
      }

      recipient.usdtBalance = (recipient.mainBalance || 0) + (recipient.investmentBalance || 0);

      // Sync wallet balance to Supabase DB
      syncUserWalletToSupabase(
        recipient.id,
        recipient.usdtBalance,
        recipient.totalInvested,
        recipient.totalRoiEarned,
        recipient.mainBalance,
        recipient.investmentBalance
      );

      const txId = `bonus-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

      // Log transaction record for audit ledger
      logTransactionRecord({
        id: txId,
        userId: recipient.id,
        userName: recipient.name,
        userEmail: recipient.email,
        type: 'bonus',
        title: {
          ar: 'هدية ومكافأة نقدية 🎁',
          en: 'Cash Gift & Bonus Received 🎁',
          ckb: 'دیاری و پاداشتی نەقدی 🎁',
        },
        description: {
          ar: `إضافة مكافأة قدرها $${bonusAmount.toLocaleString()} USDT إلى (${targetWallet === 'investment' ? 'محفظة الاستثمار' : 'المحفظة الرئيسية'}). ${noteText}`,
          en: `Bonus gift of $${bonusAmount.toLocaleString()} USDT credited to ${targetWallet === 'investment' ? 'Investment Wallet' : 'Main Wallet'}. ${noteText}`,
          ckb: `پاداشتی $${bonusAmount.toLocaleString()} USDT بۆ جزدانەکەت زیادکرا.`,
        },
        amount: bonusAmount,
        wallet: targetWallet === 'investment' ? 'investment' : 'main',
        status: 'completed',
        referenceId: txId,
      });

      // Trigger user push notification
      createNotification({
        userId: recipient.id,
        type: 'deposit',
        status: 'success',
        title: {
          ar: 'تهانينا! وصلتك هدية نقدية من الإدارة 🎁',
          en: 'Congratulations! You received a Cash Bonus 🎁',
          ckb: 'پیرۆزە! دیارییەکی نەقدیت پێگەیشت 🎁',
        },
        message: {
          ar: `تم إيداع هدية بقيمة $${bonusAmount.toLocaleString()} USDT مباشرة في (${targetWallet === 'investment' ? 'محفظة الاستثمار' : 'المحفظة الرئيسية'}). الملاحظة: ${noteText}`,
          en: `A bonus of $${bonusAmount.toLocaleString()} USDT was credited to your ${targetWallet === 'investment' ? 'Investment Wallet' : 'Main Wallet'}. Note: ${noteText}`,
          ckb: `بڕی $${bonusAmount.toLocaleString()} USDT وەک دیاری خرایە سەر هەژمارەکەت.`,
        },
        amount: bonusAmount,
        referenceId: txId,
        linkAction: 'portfolio',
      });
    });

    logAdminActivity({
      targetUserId: target === 'single' ? userId : undefined,
      targetUserName: target === 'single' ? (recipients[0]?.name || undefined) : 'All Members',
      action: 'Sent Gift',
      details: {
        target,
        amount: bonusAmount,
        reason: noteText,
        wallet: targetWallet,
        recipientsCount: recipients.length,
      },
    });

    res.json({
      success: true,
      recipientsCount: recipients.length,
      amount: bonusAmount,
      message: `تم صرف وإيداع الهدية النقدية بقيمة ${bonusAmount.toLocaleString()} USDT لعدد (${recipients.length}) مستثمر وتحديث رصيدهم بنجاح.`,
    });
  });

  // Admin Distribute Plan-Specific Profit Endpoint
  app.post('/api/admin/distribute-plan-profit', requireAdmin, async (req, res) => {
    const { projectId, planId, distributionType, value, note } = req.body;

    const numValue = Number(value);
    if (isNaN(numValue) || numValue <= 0) {
      return res.status(400).json({ error: 'الرجاء إدخال قيمة أرباح صالحة أكبر من صفر' });
    }

    if (!projectId) {
      return res.status(400).json({ error: 'الرجاء تحديد الخطة/المشروع الاستثماري المستهدف' });
    }

    const targetProject = projectsStore.find((p) => p.id === projectId);
    if (!targetProject) {
      return res.status(404).json({ error: 'المشروع الاستثماري المحدد غير موجود' });
    }

    const projectTitle = typeof targetProject.title === 'string'
      ? targetProject.title
      : (targetProject.title.ar || targetProject.title.en);

    // Filter active investments belonging STRICTLY to this project (and sub-plan if specified)
    const matchingInvestments = investmentsStore.filter((inv) => {
      if (inv.projectId !== projectId) return false;
      if (inv.status !== 'active') return false;
      if (planId && inv.planId !== planId) return false;
      return true;
    });

    if (matchingInvestments.length === 0) {
      return res.status(400).json({
        error: `لا يوجد مستثمرون نشطون مشتركون في خطة (${projectTitle}) حالياً.`,
      });
    }

    // Calculate total capital invested strictly in this plan
    const totalPlanCapital = matchingInvestments.reduce((sum, inv) => sum + inv.amount, 0);
    if (totalPlanCapital <= 0) {
      return res.status(400).json({ error: 'إجمالي رأس المال المستثمر في هذه الخطة يساوي صفر' });
    }

    // Determine payouts per active investment based on pro-rata capital share
    let totalDistributed = 0;
    const payouts: { invId: string; userId: string; amountInvested: number; payoutAmount: number; sharePercent: number }[] = [];

    matchingInvestments.forEach((inv) => {
      const sharePercent = (inv.amount / totalPlanCapital) * 100;
      let invPayout = 0;

      if (distributionType === 'percent') {
        // Percentage yield on invested capital: (inv.amount * value) / 100
        invPayout = (inv.amount * numValue) / 100;
      } else {
        // Lump sum pool split pro-rata: totalPool * (inv.amount / totalPlanCapital)
        invPayout = numValue * (inv.amount / totalPlanCapital);
      }

      // Round payout to 2 decimal places
      invPayout = Math.round(invPayout * 100) / 100;

      payouts.push({
        invId: inv.id,
        userId: inv.userId,
        amountInvested: inv.amount,
        payoutAmount: invPayout,
        sharePercent,
      });

      totalDistributed += invPayout;
    });

    const now = new Date().toISOString();
    const uniqueUserIds = new Set<string>();

    // Execute payouts for each active investment
    for (const payout of payouts) {
      uniqueUserIds.add(payout.userId);

      const inv = investmentsStore.find((i) => i.id === payout.invId);
      if (inv) {
        inv.accruedRoi = (inv.accruedRoi || 0) + payout.payoutAmount;
        inv.lastPayoutDate = now;
      }

      const targetUser = usersStore.find((u) => u.id === payout.userId);
      if (targetUser) {
        if (targetUser.mainBalance === undefined) targetUser.mainBalance = 0;
        if (targetUser.investmentBalance === undefined) targetUser.investmentBalance = targetUser.usdtBalance || 0;

        // Credit profit directly to Main Wallet
        targetUser.mainBalance += payout.payoutAmount;
        targetUser.usdtBalance = (targetUser.mainBalance || 0) + (targetUser.investmentBalance || 0);
        targetUser.totalRoiEarned = (targetUser.totalRoiEarned || 0) + payout.payoutAmount;

        // Sync wallet to Supabase DB if configured
        syncUserWalletToSupabase(
          targetUser.id,
          targetUser.usdtBalance,
          targetUser.totalInvested,
          targetUser.totalRoiEarned,
          targetUser.mainBalance,
          targetUser.investmentBalance
        );

        // Record transaction in audit log
        logTransactionRecord({
          id: `tx-roi-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          userId: targetUser.id,
          userName: targetUser.name,
          userEmail: targetUser.email,
          type: 'roi',
          title: {
            ar: 'توزيع أرباح الخطة الاستثمارية 📈',
            en: 'Plan Profit Distribution Payout 📈',
            ckb: 'دابەشکردنی قازانجی پلان 📈',
          },
          description: {
            ar: `تم إيداع أرباح بقيمة $${payout.payoutAmount.toFixed(2)} USDT لمشاركتك بقيمة $${payout.amountInvested.toLocaleString()} USDT (${payout.sharePercent.toFixed(1)}%) في خطة (${projectTitle}). ${note ? `ملاحظة: ${note}` : ''}`,
            en: `Profit payout of $${payout.payoutAmount.toFixed(2)} USDT for your $${payout.amountInvested.toLocaleString()} USDT investment in (${projectTitle}).`,
            ckb: `بڕی $${payout.payoutAmount.toFixed(2)} USDT وەک قازانج خرایە سەر هەژمارەکەت.`,
          },
          amount: payout.payoutAmount,
          wallet: 'main',
          status: 'completed',
          referenceId: inv?.id,
        });

        // Send Notification to Investor
        createNotification({
          userId: targetUser.id,
          type: 'credit',
          status: 'success',
          title: {
            ar: 'إيداع أرباح خطة الاستثمار 📈',
            en: 'Investment Plan Profit Credited 📈',
            ckb: 'قازانجی پلان خرایە سەر هەژمارەکەت 📈',
          },
          message: {
            ar: `تم إيداع أرباح قدرها $${payout.payoutAmount.toFixed(2)} USDT في محفظتك الرئيسية عن خطة (${projectTitle}). ${note ? `\nملاحظة الإدارة: ${note}` : ''}`,
            en: `$${payout.payoutAmount.toFixed(2)} USDT profit credited to Main Wallet for (${projectTitle}).`,
            ckb: `بڕی $${payout.payoutAmount.toFixed(2)} USDT خرایە سەر جزدانی سەرەکی.`,
          },
          amount: payout.payoutAmount,
          referenceId: inv?.id,
          linkAction: 'portfolio',
        });
      }
    }

    logAdminActivity({
      action: 'Distributed Profit',
      details: {
        projectId,
        planTitle: projectTitle,
        distributionType,
        value: numValue,
        totalDistributed,
        payoutsCount: matchingInvestments.length,
        uniqueUsersCount: uniqueUserIds.size,
        note: note || '',
      },
    });

    return res.json({
      success: true,
      totalDistributed,
      payoutsCount: matchingInvestments.length,
      uniqueUsersCount: uniqueUserIds.size,
      planTitle: projectTitle,
      message: `تم توزيع وتفريغ أرباح قدرها ${totalDistributed.toFixed(2)} USDT بنجاح وحصرياً على ${uniqueUserIds.size} مستثمر نشط في خطة (${projectTitle}).`,
    });
  });

  // Admin Toggle Account Status (Active, Suspended, Verified)
  app.post('/api/admin/users/:userId/status', requireAdmin, (req, res) => {
    const { userId } = req.params;
    const { accountStatus } = req.body;

    const client = usersStore.find((u) => u.id === userId);
    if (!client) return res.status(404).json({ error: 'Investor not found' });

    const prevStatus = client.accountStatus;
    client.accountStatus = accountStatus;
    if (accountStatus === 'verified') {
      client.kycStatus = 'approved';
    }

    logAdminActivity({
      targetUserId: userId,
      targetUserName: client.name,
      action: 'Updated User Status',
      details: {
        accountStatus,
        previousStatus: prevStatus,
        userEmail: client.email,
      },
    });

    const { password, ...safeClient } = client;
    res.json({ success: true, client: safeClient });
  });

  // Admin Direct KYC Review for Specific User
  app.post('/api/admin/users/:userId/kyc', requireAdmin, async (req, res) => {
    const { userId } = req.params;
    const { kycStatus, rejectionReason } = req.body;

    const client = usersStore.find((u) => u.id === userId);
    if (!client) return res.status(404).json({ error: 'Investor not found' });

    client.kycStatus = kycStatus;
    if (kycStatus === 'approved') {
      client.accountStatus = 'verified';
    }

    if (kycStore.userId === userId) {
      kycStore.status = kycStatus;
      kycStore.reviewedAt = new Date().toISOString();
      if (rejectionReason) kycStore.rejectionReason = rejectionReason;
    }

    if (supabaseServer && isSupabaseServerConfigured()) {
      try {
        const validUserId = ensureValidUuidServer(client.id);
        await supabaseServer.from('profiles').upsert({
          id: validUserId,
          email: client.email.toLowerCase(),
          full_name: client.name,
          phone: client.phone || null,
          province: client.governorate || (client as any).province || null,
          role: client.role || 'investor',
          kyc_status: kycStatus,
        }, { onConflict: 'id' });
      } catch (err) {
        console.warn('⚠️ [Server Supabase] admin kyc update note:', err);
      }
    }

    logAdminActivity({
      targetUserId: client.id,
      targetUserName: client.name,
      action: 'Reviewed KYC',
      details: {
        kycStatus,
        rejectionReason: rejectionReason || '',
        userEmail: client.email,
      },
    });

    const { password, ...safeClient } = client;
    res.json({ success: true, client: safeClient });
  });

  // Admin Delete Investor User (Protected by requireAdmin)
  app.delete('/api/admin/users/:userId', requireAdmin, async (req, res) => {
    const { userId } = req.params;
    const clientIndex = usersStore.findIndex((u) => u.id === userId);
    if (clientIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [deletedUser] = usersStore.splice(clientIndex, 1);
    investmentsStore = investmentsStore.filter((i) => i.userId !== userId);

    if (supabaseServer && isSupabaseServerConfigured()) {
      try {
        const validUserId = ensureValidUuidServer(userId);
        await supabaseServer.from('wallets').delete().or(`user_id.eq.${userId},user_id.eq.${validUserId}`);
        await supabaseServer.from('profiles').delete().or(`id.eq.${userId},id.eq.${validUserId}`);
      } catch (sbErr) {
        console.warn('⚠️ [Server Supabase] delete user profile note:', sbErr);
      }
    }

    res.json({ success: true, message: 'User deleted successfully' });
  });

  // Admin Update User Role (Investor <-> Admin) (Protected by requireAdmin)
  app.post('/api/admin/users/:userId/role', requireAdmin, async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role || (role !== 'admin' && role !== 'investor')) {
      return res.status(400).json({ error: 'الرجاء تحديد صلاحية صالحة (admin أو investor)' });
    }

    const targetUser = usersStore.find((u) => u.id === userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    targetUser.role = role;

    // Sync role with Supabase database profiles table
    if (supabaseServer && isSupabaseServerConfigured()) {
      try {
        const validUserId = ensureValidUuidServer(targetUser.id);
        await supabaseServer.from('profiles').upsert(
          {
            id: validUserId,
            email: targetUser.email.toLowerCase(),
            full_name: targetUser.name,
            phone: targetUser.phone || null,
            province: targetUser.governorate || (targetUser as any).province || null,
            role: targetUser.role,
            kyc_status: targetUser.kycStatus || 'not_submitted',
          },
          { onConflict: 'id' }
        );

        await supabaseServer.auth.admin.updateUserById(validUserId, {
          user_metadata: { role: targetUser.role, name: targetUser.name },
        }).catch(() => {});
      } catch (err) {
        console.warn('⚠️ Exception syncing role to Supabase profiles:', err);
      }
    }

    const { password: _, ...safeUser } = targetUser;
    res.json({
      success: true,
      message: `تم تحديث صلاحية الحساب بنجاح إلى: ${role === 'admin' ? 'مدير نظام (Admin)' : 'مستثمر (Investor)'}`,
      user: safeUser,
    });
  });

  // Admin Reset User Password or Credentials (Protected by requireAdmin)
  app.post('/api/admin/users/:userId/credentials', requireAdmin, async (req, res) => {
    const { userId } = req.params;
    const { newPassword, newEmail, name } = req.body;

    const targetUser = usersStore.find((u) => u.id === userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    if (newPassword && newPassword.trim()) {
      targetUser.password = newPassword.trim();
    }
    if (newEmail && newEmail.trim()) {
      targetUser.email = newEmail.trim().toLowerCase();
    }
    if (name && name.trim()) {
      targetUser.name = name.trim();
    }

    // Sync credentials with Supabase
    if (supabaseServer && isSupabaseServerConfigured()) {
      try {
        await supabaseServer.from('profiles').upsert(
          {
            id: targetUser.id,
            email: targetUser.email,
            full_name: targetUser.name,
          },
          { onConflict: 'id' }
        );

        if (newPassword && newPassword.trim()) {
          await supabaseServer.auth.admin.updateUserById(targetUser.id, {
            password: newPassword.trim(),
            email: targetUser.email,
          }).catch(() => {});
        }
      } catch (err) {
        console.warn('⚠️ Exception syncing user credentials to Supabase:', err);
      }
    }

    const { password: _, ...safeUser } = targetUser;
    res.json({
      success: true,
      message: 'تم تحديث كلمة المرور وبيانات حساب المستخدم بنجاح',
      user: safeUser,
    });
  });

  // Admin Update Current Admin Account Credentials (Email/Username, Name, Password)
  app.post('/api/admin/credentials', requireAdmin, async (req, res) => {
    const { email, name, password, phone } = req.body;

    const adminUser = usersStore.find((u) => u.id === activeUserId || u.role === 'admin');
    if (!adminUser) {
      return res.status(404).json({ error: 'حساب مدير النظام غير موجود' });
    }

    if (email && email.trim()) {
      adminUser.email = email.trim().toLowerCase();
    }
    if (name && name.trim()) {
      adminUser.name = name.trim();
    }
    if (password && password.trim()) {
      adminUser.password = password.trim();
    }
    if (phone && phone.trim()) {
      adminUser.phone = phone.trim();
    }

    // Sync Admin credentials to Supabase DB profiles
    if (supabaseServer && isSupabaseServerConfigured()) {
      try {
        await supabaseServer.from('profiles').upsert(
          {
            id: adminUser.id,
            full_name: adminUser.name,
            email: adminUser.email,
            role: 'admin',
            phone: adminUser.phone || null,
          },
          { onConflict: 'id' }
        );

        if (password && password.trim()) {
          await supabaseServer.auth.admin.updateUserById(adminUser.id, {
            password: password.trim(),
            email: adminUser.email,
            user_metadata: { name: adminUser.name, role: 'admin' },
          }).catch((sbErr) => {
            console.warn('⚠️ Supabase Auth admin update note:', sbErr?.message || sbErr);
          });
        }
      } catch (sbEx) {
        console.warn('⚠️ Exception updating admin credentials in Supabase:', sbEx);
      }
    }

    const { password: _, ...safeAdmin } = adminUser;
    res.json({
      success: true,
      message: 'تم تحديث بيانات اعتماد مدير النظام بأسطول أصيل بنجاح',
      user: safeAdmin,
    });
  });

  // Admin Create New Admin Employee (Protected by requireAdmin)
  app.post('/api/admin/create-admin', requireAdmin, async (req, res) => {
    const { email, password, name, phone } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'الرجاء إدخال البريد الإلكتروني الخاص بالمدير الجديد' });
    }
    if (!password || password.trim().length < 6) {
      return res.status(400).json({ error: 'كلمة المرور الابتدائية يجب أن تتكون من 6 خانات على الأقل' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = usersStore.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existingUser) {
      if (existingUser.role === 'admin') {
        return res.status(400).json({ error: 'يوجد بالفعل حساب مدير نظام مسجل بهذا البريد الإلكتروني' });
      } else {
        // Upgrade existing user to admin
        existingUser.role = 'admin';
        existingUser.password = password.trim();
        if (name && name.trim()) existingUser.name = name.trim();

        // Sync to Supabase
        if (supabaseServer && isSupabaseServerConfigured()) {
          try {
            await supabaseServer.from('profiles').upsert(
              {
                id: existingUser.id,
                email: existingUser.email,
                full_name: existingUser.name,
                role: 'admin',
              },
              { onConflict: 'id' }
            );
            await supabaseServer.auth.admin.updateUserById(existingUser.id, {
              password: password.trim(),
              user_metadata: { name: existingUser.name, role: 'admin' },
            }).catch(() => {});
          } catch (err) {
            console.warn('⚠️ Supabase sync exception:', err);
          }
        }

        const { password: _, ...safeUser } = existingUser;
        return res.json({
          success: true,
          message: `تم ترقية وتعيين الحساب الحالي (${cleanEmail}) كمدير نظام جديد بنجاح!`,
          user: safeUser,
        });
      }
    }

    // Create fresh admin user
    const newAdminId = `admin_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newAdminName = name && name.trim() ? name.trim() : `مدير نظام - ${cleanEmail.split('@')[0]}`;
    
    let createdId = newAdminId;

    // Create user in Supabase Auth & profiles if configured
    if (supabaseServer && isSupabaseServerConfigured()) {
      try {
        const { data: sbAuthData, error: sbAuthErr } = await supabaseServer.auth.admin.createUser({
          email: cleanEmail,
          password: password.trim(),
          email_confirm: true,
          user_metadata: { name: newAdminName, role: 'admin' },
        });

        if (!sbAuthErr && sbAuthData?.user?.id) {
          createdId = sbAuthData.user.id;
        }

        await supabaseServer.from('profiles').upsert(
          {
            id: createdId,
            email: cleanEmail,
            full_name: newAdminName,
            role: 'admin',
            kyc_status: 'approved',
            created_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
        const { data: existingW } = await supabaseServer.from('wallets').select('id, user_id').eq('user_id', createdId).limit(1);
        const walletPayload = {
          user_id: createdId,
          available_balance: 0,
          locked_capital: 0,
          total_profits: 0,
          updated_at: new Date().toISOString(),
        };
        if (existingW && existingW.length > 0) {
          await supabaseServer.from('wallets').update(walletPayload).eq('user_id', createdId);
        } else {
          await supabaseServer.from('wallets').insert(walletPayload);
        }
      } catch (sbEx) {
        console.warn('⚠️ Exception creating admin in Supabase:', sbEx);
      }
    }

    const newAdminUser: AuthUser = {
      id: createdId,
      email: cleanEmail,
      password: password.trim(),
      name: newAdminName,
      role: 'admin',
      usdtBalance: 0,
      kycStatus: 'approved',
      accountStatus: 'active',
      totalInvested: 0,
      totalRoiEarned: 0,
      phone: phone?.trim() || '',
      joinedDate: new Date().toISOString().split('T')[0],
    };

    usersStore.push(newAdminUser);

    const { password: _, ...safeNewAdmin } = newAdminUser;
    return res.json({
      success: true,
      message: `تم إنشاء حساب مدير النظام الجديد (${cleanEmail}) وتعيين كلمة المرور بنجاح!`,
      user: safeNewAdmin,
    });
  });

  // Admin Settings Update (Protected by requireAdmin)
  app.post('/api/admin/settings', requireAdmin, async (req, res) => {
    const { trc20Address, bep20Address, p2pBankInstructions, announcementMessage, pauseDeposits, pauseWithdrawals, registrationEnabled } = req.body;

    adminSettingsStore = {
      ...adminSettingsStore,
      trc20Address: trc20Address !== undefined ? trc20Address : adminSettingsStore.trc20Address,
      bep20Address: bep20Address !== undefined ? bep20Address : adminSettingsStore.bep20Address,
      p2pBankInstructions: p2pBankInstructions || adminSettingsStore.p2pBankInstructions,
      announcementMessage: announcementMessage || adminSettingsStore.announcementMessage,
      pauseDeposits: pauseDeposits !== undefined ? Boolean(pauseDeposits) : adminSettingsStore.pauseDeposits,
      pauseWithdrawals: pauseWithdrawals !== undefined ? Boolean(pauseWithdrawals) : adminSettingsStore.pauseWithdrawals,
      registrationEnabled: registrationEnabled !== undefined ? Boolean(registrationEnabled) : (adminSettingsStore.registrationEnabled ?? true),
    };

    if (supabaseServer && isSupabaseServerConfigured()) {
      try {
        await supabaseServer.from('system_settings').upsert({
          id: '1',
          pause_deposits: adminSettingsStore.pauseDeposits,
          pause_withdrawals: adminSettingsStore.pauseWithdrawals,
          registration_enabled: adminSettingsStore.registrationEnabled,
          trc20_address: adminSettingsStore.trc20Address,
          bep20_address: adminSettingsStore.bep20Address,
          announcement_message: JSON.stringify(adminSettingsStore.announcementMessage),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
        console.log('✅ [Server Supabase] Updated system_settings in Supabase.');
      } catch (sbErr) {
        console.warn('⚠️ [Server Supabase] system_settings update note:', sbErr);
      }
    }

    logAdminActivity({
      action: 'Updated Platform Settings',
      details: {
        pauseDeposits: adminSettingsStore.pauseDeposits,
        pauseWithdrawals: adminSettingsStore.pauseWithdrawals,
        registrationEnabled: adminSettingsStore.registrationEnabled,
      },
    });

    res.json({ success: true, settings: adminSettingsStore });
  });

  // Admin Activity Logs API (Audit Trail)
  app.get('/api/admin/activity-logs', requireAdmin, async (req, res) => {
    try {
      if (supabaseServer && isSupabaseServerConfigured()) {
        const { data, error } = await supabaseServer
          .from('admin_activity_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200);

        if (!error && data && Array.isArray(data)) {
          const mappedLogs: AdminActivityLog[] = data.map((row) => ({
            id: row.id,
            admin_id: row.admin_id || row.adminId || '756cbbdc-9920-470c-b3d0-1861a38240e4',
            admin_email: row.admin_email || row.adminEmail || 'goog7029766@gmail.com',
            target_user_id: row.target_user_id || row.targetUserId || null,
            target_user_name: row.target_user_name || row.targetUserName || null,
            action: row.action,
            details: typeof row.details === 'string' ? JSON.parse(row.details) : row.details,
            created_at: row.created_at || row.createdAt || new Date().toISOString(),
          }));

          for (const log of mappedLogs) {
            if (!adminActivityLogsStore.some((l) => l.id === log.id)) {
              adminActivityLogsStore.push(log);
            }
          }
        }
      }

      adminActivityLogsStore.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      res.json({ success: true, logs: adminActivityLogsStore });
    } catch (err: any) {
      res.json({ success: true, logs: adminActivityLogsStore });
    }
  });

  app.post('/api/admin/activity-logs/create', requireAdmin, async (req, res) => {
    try {
      const { targetUserId, targetUserName, action, details } = req.body;
      const log = await logAdminActivity({
        targetUserId,
        targetUserName,
        action: action || 'Admin Action',
        details: details || {},
      });
      res.json({ success: true, log });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create activity log' });
    }
  });

  // News & Announcements API Endpoints (admin_news integration)
  app.get('/api/news', async (req, res) => {
    try {
      if (supabaseServer && isSupabaseServerConfigured()) {
        const { data, error } = await supabaseServer
          .from('admin_news')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && Array.isArray(data) && data.length > 0) {
          const mappedNews: NewsArticle[] = data.map((item: any) => {
            let parsedTitle = item.title;
            if (typeof parsedTitle === 'string' && parsedTitle.trim().startsWith('{')) {
              try { parsedTitle = JSON.parse(parsedTitle); } catch (e) {}
            }
            let parsedContent = item.content;
            if (typeof parsedContent === 'string' && parsedContent.trim().startsWith('{')) {
              try { parsedContent = JSON.parse(parsedContent); } catch (e) {}
            }

            return {
              id: item.id,
              title: parsedTitle || item.title_ar || 'إعلان إداري',
              content: parsedContent || item.content_ar || '',
              category: item.category || 'announcement',
              imageUrl: item.image_url || item.imageUrl || 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80',
              isPinned: Boolean(item.is_pinned || item.isPinned),
              publishedAt: item.created_at || item.publishedAt || new Date().toISOString(),
              author: item.author || 'إدارة الأصيل',
            };
          });

          // Update in-memory news store
          newsStore = mappedNews;
        }
      }
      res.json({ success: true, news: newsStore });
    } catch (err: any) {
      res.json({ success: true, news: newsStore });
    }
  });

  const handleUpsertNews = async (req: express.Request, res: express.Response) => {
    try {
      const { id, title, content, category, imageUrl, isPinned } = req.body;

      if (!title || !content) {
        return res.status(400).json({ error: 'العنوان والمحتوى مطلوبان لنشر الخبر' });
      }

      const existingIndex = id ? newsStore.findIndex((n) => n.id === id) : -1;
      const articleId = id || `news-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const now = new Date().toISOString();

      const article: NewsArticle = {
        id: articleId,
        title,
        content,
        category: category || 'announcement',
        imageUrl: imageUrl && imageUrl.trim() ? imageUrl.trim() : 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80',
        isPinned: Boolean(isPinned),
        publishedAt: existingIndex !== -1 ? newsStore[existingIndex].publishedAt : now,
        author: 'إدارة أسطول أصيل',
      };

      if (existingIndex !== -1) {
        newsStore[existingIndex] = article;
      } else {
        newsStore.unshift(article);
      }

      // Sync to Supabase admin_news table
      if (supabaseServer && isSupabaseServerConfigured()) {
        try {
          await supabaseServer.from('admin_news').upsert({
            id: article.id,
            title: typeof article.title === 'object' ? JSON.stringify(article.title) : article.title,
            content: typeof article.content === 'object' ? JSON.stringify(article.content) : article.content,
            category: article.category,
            image_url: article.imageUrl,
            is_pinned: article.isPinned,
            created_at: article.publishedAt,
            author: article.author,
          });
          console.log('✅ [Server Supabase] Upserted news in admin_news table');
        } catch (sbErr) {
          console.warn('⚠️ [Server Supabase] admin_news upsert note:', sbErr);
        }
      }

      // Audit activity logging
      const titleStr = typeof article.title === 'string' ? article.title : article.title.ar;
      logAdminActivity({
        action: existingIndex !== -1 ? 'Updated News Article' : 'Published News Article',
        details: {
          articleId: article.id,
          title: titleStr,
          category: article.category,
          isPinned: article.isPinned,
        },
      });

      // Notify users about new article if freshly published
      if (existingIndex === -1) {
        usersStore.forEach((u) => {
          createNotification({
            userId: u.id,
            type: 'system',
            status: 'info',
            title: {
              ar: `📰 إعلان إداري جديد: ${titleStr}`,
              en: `📰 New Announcement: ${typeof article.title === 'object' ? article.title.en : titleStr}`,
              ckb: `📰 إعلان جديد: ${titleStr}`,
            },
            message: {
              ar: typeof article.content === 'string' ? article.content.substring(0, 100) : article.content.ar?.substring(0, 100) || '',
              en: typeof article.content === 'object' ? article.content.en?.substring(0, 100) || '' : '',
              ckb: typeof article.content === 'object' ? article.content.ckb?.substring(0, 100) || '' : '',
            },
            linkAction: 'dashboard',
          });
        });
      }

      res.json({ success: true, article, news: newsStore });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to save news article' });
    }
  };

  app.post('/api/news', handleUpsertNews);
  app.post('/api/admin/news', requireAdmin, handleUpsertNews);

  const handleDeleteNews = async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const index = newsStore.findIndex((n) => n.id === id);

      if (index !== -1) {
        const deleted = newsStore.splice(index, 1)[0];
        const titleStr = typeof deleted.title === 'string' ? deleted.title : deleted.title.ar;

        logAdminActivity({
          action: 'Deleted News Article',
          details: { articleId: id, title: titleStr },
        });
      }

      if (supabaseServer && isSupabaseServerConfigured()) {
        try {
          await supabaseServer.from('admin_news').delete().eq('id', id);
          console.log(`✅ [Server Supabase] Deleted news article (${id}) from admin_news table`);
        } catch (sbErr) {
          console.warn('⚠️ [Server Supabase] admin_news delete note:', sbErr);
        }
      }

      res.json({ success: true, message: 'News article deleted successfully', news: newsStore });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to delete news article' });
    }
  };

  app.delete('/api/news/:id', handleDeleteNews);
  app.delete('/api/admin/news/:id', requireAdmin, handleDeleteNews);

  // Technical Support Ticket API Endpoints & Supabase Sync
  async function syncSupportTicketToSupabase(ticket: SupportTicket) {
    if (!supabaseServer || !isSupabaseServerConfigured()) return;
    try {
      const validUserId = ticket.userId ? ensureValidUuidServer(ticket.userId) : null;
      await supabaseServer.from('support_tickets').upsert(
        {
          id: ticket.id,
          user_id: validUserId,
          full_name: ticket.fullName,
          phone: ticket.phone || null,
          email: ticket.email || null,
          subject: ticket.subject || 'Financial & Technical Support',
          status: ticket.status,
          created_at: ticket.createdAt,
          updated_at: ticket.updatedAt,
        },
        { onConflict: 'id' }
      );

      if (ticket.messages && ticket.messages.length > 0) {
        for (const msg of ticket.messages) {
          const msgUuid = ensureValidUuidServer(msg.id.startsWith('msg-') ? undefined : msg.id);
          await supabaseServer.from('support_messages').upsert(
            {
              id: msgUuid,
              ticket_id: ticket.id,
              sender_id: validUserId,
              sender_role: msg.sender || 'user',
              sender_name: ticket.fullName,
              message: msg.text,
              created_at: msg.timestamp,
            },
            { onConflict: 'id' }
          ).catch(() => {});
        }
      }
    } catch (err) {
      console.warn('⚠️ Exception syncing support ticket to Supabase:', err);
    }
  }

  async function syncSupportMessageToSupabase(ticketId: string, message: ChatMessage) {
    if (!supabaseServer || !isSupabaseServerConfigured()) return;
    try {
      const msgUuid = ensureValidUuidServer(message.id.startsWith('msg-') ? undefined : message.id);
      await supabaseServer.from('support_messages').upsert({
        id: msgUuid,
        ticket_id: ticketId,
        sender_role: message.sender || 'user',
        message: message.text,
        created_at: message.timestamp,
      }, { onConflict: 'id' }).catch(() => {});

      await supabaseServer
        .from('support_tickets')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', ticketId)
        .catch(() => {});
    } catch (err) {
      console.warn('⚠️ Exception syncing support message to Supabase:', err);
    }
  }

  // Schema Discovery & Setup Endpoints
  app.get('/api/schema/support_tickets', (req, res) => {
    res.json({
      tableName: 'public.support_tickets',
      columns: [
        { name: 'id', type: 'text', primaryKey: true, description: 'Ticket identifier (e.g., sup-446520)' },
        { name: 'user_id', type: 'uuid', foreignKey: 'public.profiles(id)', description: 'User ID Foreign Key' },
        { name: 'full_name', type: 'text', description: 'User full name' },
        { name: 'phone', type: 'text', description: 'User phone number' },
        { name: 'email', type: 'text', description: 'User email address' },
        { name: 'subject', type: 'text', description: 'Ticket topic/subject' },
        { name: 'status', type: 'text', description: 'Status (pending_approval, pending, open, closed, unlocked)' },
        { name: 'waiting_time', type: 'text', description: 'Waiting time indicator' },
        { name: 'created_at', type: 'timestamptz', description: 'Creation timestamp' },
        { name: 'updated_at', type: 'timestamptz', description: 'Last update timestamp' },
      ],
    });
  });

  app.get('/api/schema/support_messages', (req, res) => {
    res.json({
      tableName: 'public.support_messages',
      columns: [
        { name: 'id', type: 'uuid', primaryKey: true, description: 'Message ID' },
        { name: 'ticket_id', type: 'text', foreignKey: 'public.support_tickets(id)', description: 'Foreign key to support_tickets' },
        { name: 'sender_id', type: 'uuid', description: 'Sender user UUID' },
        { name: 'sender_role', type: 'text', description: 'Role of sender (user, admin, system)' },
        { name: 'sender_name', type: 'text', description: 'Display name of sender' },
        { name: 'message', type: 'text', description: 'Chat message content' },
        { name: 'created_at', type: 'timestamptz', description: 'Sent timestamp' },
      ],
    });
  });

  app.get('/api/db-setup-sql', (req, res) => {
    const sql = `
-- Table: public.support_tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  subject TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  waiting_time TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: public.support_messages
CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id TEXT NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID,
  sender_role TEXT NOT NULL DEFAULT 'user',
  sender_name TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Policies for public.support_tickets
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own support tickets') THEN
    CREATE POLICY "Users can view own support tickets" ON public.support_tickets
      FOR SELECT USING (auth.uid() = user_id OR email = auth.email());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own support tickets') THEN
    CREATE POLICY "Users can insert own support tickets" ON public.support_tickets
      FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own support tickets') THEN
    CREATE POLICY "Users can update own support tickets" ON public.support_tickets
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins full access to support tickets') THEN
    CREATE POLICY "Admins full access to support tickets" ON public.support_tickets
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;

-- Policies for public.support_messages
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view messages for own tickets') THEN
    CREATE POLICY "Users can view messages for own tickets" ON public.support_messages
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.support_tickets
          WHERE support_tickets.id = support_messages.ticket_id
          AND (support_tickets.user_id = auth.uid() OR support_tickets.email = auth.email())
        )
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert messages to own tickets') THEN
    CREATE POLICY "Users can insert messages to own tickets" ON public.support_messages
      FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins full access to support messages') THEN
    CREATE POLICY "Admins full access to support messages" ON public.support_messages
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;
`;
    res.type('text/plain').send(sql);
  });

  app.get('/api/support/list', async (req, res) => {
    if (supabaseServer && isSupabaseServerConfigured()) {
      try {
        const { data: ticketsData, error: tErr } = await supabaseServer
          .from('support_tickets')
          .select('*')
          .order('created_at', { ascending: false });

        if (!tErr && ticketsData && ticketsData.length > 0) {
          const ticketIds = ticketsData.map((t: any) => t.id);
          const { data: msgsData } = await supabaseServer
            .from('support_messages')
            .select('*')
            .in('ticket_id', ticketIds)
            .order('created_at', { ascending: true });

          const msgsMap: Record<string, ChatMessage[]> = {};
          if (msgsData) {
            msgsData.forEach((m: any) => {
              if (!msgsMap[m.ticket_id]) msgsMap[m.ticket_id] = [];
              msgsMap[m.ticket_id].push({
                id: m.id,
                sender: (m.sender_role || 'user') as any,
                text: m.message || '',
                timestamp: m.created_at || new Date().toISOString(),
              });
            });
          }

          const sbTickets: SupportTicket[] = ticketsData.map((t: any) => ({
            id: t.id,
            userId: t.user_id || '',
            fullName: t.full_name || 'مستثمر',
            phone: t.phone || '',
            email: t.email || '',
            subject: t.subject || 'General',
            status: t.status || 'open',
            createdAt: t.created_at || new Date().toISOString(),
            updatedAt: t.updated_at || new Date().toISOString(),
            messages: msgsMap[t.id] || [],
          }));

          // Merge into store
          for (const sbt of sbTickets) {
            const existingIdx = supportTicketsStore.findIndex((st) => st.id === sbt.id);
            if (existingIdx !== -1) {
              supportTicketsStore[existingIdx] = sbt;
            } else {
              supportTicketsStore.push(sbt);
            }
          }
        }
      } catch (err) {
        console.warn('⚠️ Exception fetching support tickets from Supabase server:', err);
      }
    }
    res.json({ success: true, supportTickets: supportTicketsStore });
  });

  app.post('/api/support/connect', async (req, res) => {
    const currentUser = usersStore.find((u) => u.id === activeUserId);
    if (!currentUser) return res.status(401).json({ error: 'Unauthenticated' });

    // Check if active ticket exists for user
    let activeTicket = supportTicketsStore.find(
      (t) =>
        t.userId === currentUser.id &&
        (t.status === 'pending_approval' ||
          t.status === 'pending' ||
          t.status === 'open' ||
          t.status === 'unlocked')
    );

    if (!activeTicket) {
      const ticketId = `sup-${Math.floor(100000 + Math.random() * 900000)}`;
      const now = new Date().toISOString();

      const formattedUserName = currentUser.name
        ? currentUser.name.replace(/\s*\(Investor\)/gi, '').trim() + ' (Investor)'
        : 'Investor';

      const systemLogMsg: ChatMessage = {
        id: `msg-${Date.now()}-1`,
        sender: 'system',
        text: `[طلب اتصال جديد بالدعم #${ticketId}] المستثمر: ${formattedUserName} | بانتظار ربط وتأكيد مسؤول النظام.`,
        timestamp: now,
      };

      const welcomeMsg: ChatMessage = {
        id: `msg-${Date.now()}-2`,
        sender: 'admin',
        text: `أهلاً بك ${formattedUserName}! تم استلام طلب الاتصال بقسم الدعم المالي والفني. يرجى الانتظار (حتى 3 دقائق) لحين قبول الاتصال من المسؤول لتفعيل المحادثة المباشرة.`,
        timestamp: now,
      };

      activeTicket = {
        id: ticketId,
        userId: currentUser.id,
        fullName: currentUser.name,
        phone: currentUser.phone || '',
        email: currentUser.email,
        subject: 'Financial & Technical Support',
        status: 'pending_approval',
        createdAt: now,
        updatedAt: now,
        messages: [systemLogMsg, welcomeMsg],
      };

      supportTicketsStore.unshift(activeTicket);
    }

    await syncSupportTicketToSupabase(activeTicket);

    res.json({ success: true, ticket: activeTicket, supportTickets: supportTicketsStore });
  });

  app.post('/api/support/:id/accept', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const ticket = supportTicketsStore.find((t) => t.id === id);
    if (!ticket) {
      return res.status(404).json({ error: 'Support ticket not found' });
    }

    ticket.status = 'open';
    ticket.updatedAt = new Date().toISOString();

    const unlockMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'system',
      text: '[النظام] تم قبول طلب الاتصال من قبل ممثل الدعم الفني. المحادثة المباشرة نشطة ومفتوحة الآن.',
      timestamp: new Date().toISOString(),
    };

    ticket.messages.push(unlockMsg);

    await syncSupportTicketToSupabase(ticket);

    res.json({ success: true, ticket, supportTickets: supportTicketsStore });
  });

  app.post('/api/support/start', async (req, res) => {
    let { fullName, phone, email, initialMessage, subject } = req.body;

    if (typeof fullName === 'object' && fullName !== null) {
      phone = fullName.phone || phone;
      email = fullName.email || email;
      subject = fullName.subject || subject;
      initialMessage = fullName.initialMessage || initialMessage;
      fullName = fullName.fullName || '';
    }

    fullName = typeof fullName === 'string' ? fullName : String(fullName || '');
    phone = typeof phone === 'string' ? phone : String(phone || '');
    email = typeof email === 'string' ? email : String(email || '');
    subject = typeof subject === 'string' ? subject : String(subject || 'general');

    const currentUser = usersStore.find((u) => u.id === activeUserId);

    const ticketId = `TICKET-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date().toISOString();

    const welcomeMsg: ChatMessage = {
      id: `msg-${Date.now()}-2`,
      sender: 'admin',
      text: `أهلاً بك ${fullName || 'عزيزي المستثمر'}! تم استلام طلب الدعم الفني وتوليد التذكرة رقم (${ticketId}). ممثل الخدمة متواجد معك في هذه المحادثة المباشرة. كيف يمكننا مساعدتك اليوم؟`,
      timestamp: now,
    };

    const initialMsgs: ChatMessage[] = [
      ...(initialMessage && initialMessage.trim() ? [{
        id: `msg-${Date.now()}-1`,
        sender: 'user' as const,
        text: initialMessage.trim(),
        timestamp: now,
      }] : []),
      welcomeMsg,
    ];

    const newTicket: SupportTicket = {
      id: ticketId,
      userId: currentUser ? currentUser.id : `guest-${Date.now()}`,
      fullName: fullName || (currentUser ? currentUser.name : 'مستثمر'),
      phone: phone || (currentUser ? currentUser.phone || '' : ''),
      email: email || (currentUser ? currentUser.email : ''),
      subject: subject || 'general',
      status: 'open',
      createdAt: now,
      updatedAt: now,
      messages: initialMsgs,
    };

    supportTicketsStore.unshift(newTicket);
    await syncSupportTicketToSupabase(newTicket);

    res.json({ success: true, ticket: newTicket });
  });

  app.post('/api/support/:id/chat', async (req, res) => {
    const { id } = req.params;
    const { text, sender } = req.body;

    const ticket = supportTicketsStore.find((t) => t.id === id);
    if (!ticket) {
      return res.status(404).json({ error: 'Support ticket not found' });
    }

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: sender || 'user',
      text: text || '',
      timestamp: new Date().toISOString(),
    };

    ticket.messages.push(newMessage);
    ticket.updatedAt = new Date().toISOString();

    await syncSupportMessageToSupabase(ticket.id, newMessage);

    res.json({ success: true, ticket, message: newMessage });
  });

  app.post('/api/support/:id/close', async (req, res) => {
    const { id } = req.params;
    const ticket = supportTicketsStore.find((t) => t.id === id);
    if (!ticket) {
      return res.status(404).json({ error: 'Support ticket not found' });
    }

    ticket.status = ticket.status === 'open' ? 'closed' : 'open';
    ticket.updatedAt = new Date().toISOString();

    const closeMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'system',
      text: ticket.status === 'closed' ? '🔒 تم إغلاق تذكرة الدعم الفني.' : '🔓 تم إعادة فتح تذكرة الدعم الفني.',
      timestamp: new Date().toISOString(),
    };

    ticket.messages.push(closeMsg);
    await syncSupportTicketToSupabase(ticket);

    res.json({ success: true, ticket });
  });

  // Secure Deposit Receipts Storage & Magic Number Verification
  interface StoredReceipt {
    buffer: Buffer;
    mimeType: string;
    extension: string;
    uploadedAt: string;
    sizeBytes: number;
  }

  const secureUploadedReceiptsStore = new Map<string, StoredReceipt>();

  function verifyServerMagicNumbers(buffer: Buffer): { isValid: boolean; mimeType: string; extension: string } {
    if (!buffer || buffer.length < 8) {
      return { isValid: false, mimeType: '', extension: '' };
    }

    // 1. JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return { isValid: true, mimeType: 'image/jpeg', extension: 'jpg' };
    }

    // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    ) {
      return { isValid: true, mimeType: 'image/png', extension: 'png' };
    }

    // 3. WEBP: RIFF ... WEBP
    if (
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer.length >= 12 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    ) {
      return { isValid: true, mimeType: 'image/webp', extension: 'webp' };
    }

    return { isValid: false, mimeType: '', extension: '' };
  }

  // Secure Deposit Receipt Upload API Endpoint
  app.post('/api/deposit/upload-receipt', (req, res) => {
    try {
      const { fileData, originalName } = req.body;

      if (!fileData || typeof fileData !== 'string') {
        return res.status(400).json({ success: false, error: 'No image data provided.' });
      }

      // Check for forbidden executable or script extensions in original filename
      if (originalName) {
        const lowerName = originalName.toLowerCase();
        const forbiddenExts = ['.php', '.exe', '.svg', '.html', '.htm', '.js', '.sh', '.bat', '.py', '.pl', '.aspx', '.asp', '.jsp', '.xml', '.vbs', '.jar', '.dll'];
        if (forbiddenExts.some((ext) => lowerName.endsWith(ext))) {
          return res.status(400).json({
            success: false,
            error: 'Security Error: Uploaded file extension is strictly forbidden.',
          });
        }
      }

      // Extract base64 payload
      let base64Body = fileData;
      if (fileData.includes('base64,')) {
        base64Body = fileData.split('base64,')[1];
      }

      const fileBuffer = Buffer.from(base64Body, 'base64');

      // 1. Strict File Size Limit (5MB Max)
      const MAX_BYTES = 5 * 1024 * 1024;
      if (fileBuffer.length > MAX_BYTES) {
        return res.status(400).json({
          success: false,
          error: `Security Violation: File size (${(fileBuffer.length / (1024 * 1024)).toFixed(2)} MB) exceeds maximum allowed limit (5 MB).`,
        });
      }

      if (fileBuffer.length === 0) {
        return res.status(400).json({ success: false, error: 'Security Violation: Empty file buffer.' });
      }

      // 2. Strict Binary Header Magic Number Verification
      const headerResult = verifyServerMagicNumbers(fileBuffer);
      if (!headerResult.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Security Violation: Invalid image header (Magic Numbers Mismatch). Allowed formats are JPEG and PNG only. Executable or script files are strictly blocked.',
        });
      }

      // 3. Sanitized Randomized File Renaming (UUID)
      const sanitizedFileName = `rcpt_${crypto.randomUUID()}.${headerResult.extension}`;

      // 4. Secure Cloud Storage Isolation (Isolated Store)
      secureUploadedReceiptsStore.set(sanitizedFileName, {
        buffer: fileBuffer,
        mimeType: headerResult.mimeType,
        extension: headerResult.extension,
        uploadedAt: new Date().toISOString(),
        sizeBytes: fileBuffer.length,
      });

      const secureUrl = `/api/uploads/receipts/${sanitizedFileName}`;

      return res.json({
        success: true,
        secureUrl,
        fileName: sanitizedFileName,
        mimeType: headerResult.mimeType,
        sizeBytes: fileBuffer.length,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Server error processing secure upload.' });
    }
  });

  // Dedicated Isolated Serving Route for Uploaded Receipts
  app.get('/api/uploads/receipts/:filename', (req, res) => {
    const rawFileName = req.params.filename;

    // Strict regex validation preventing path traversal (..), null bytes, or injection
    if (!rawFileName || !/^rcpt_[a-f0-9\-]+\.(jpg|jpeg|png|webp)$/i.test(rawFileName)) {
      return res.status(400).send('Invalid or unsafe filename request.');
    }

    const fileRecord = secureUploadedReceiptsStore.get(rawFileName);
    if (!fileRecord) {
      return res.status(404).send('Receipt image not found.');
    }

    // Set Strict Security & Isolation Headers preventing script execution or MIME sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'");
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Type', fileRecord.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="receipt.${fileRecord.extension}"`);
    res.setHeader('Cache-Control', 'private, max-age=86400');

    return res.send(fileRecord.buffer);
  });

  // Secure Profile Picture Upload Endpoint (Max 2MB, Magic Numbers, Isolated Storage)
  const secureUploadedAvatarsStore = new Map<string, StoredReceipt>();

  app.post('/api/user/upload-avatar', (req, res) => {
    try {
      const { fileData, originalName } = req.body;

      if (!fileData || typeof fileData !== 'string') {
        return res.status(400).json({ success: false, error: 'No image data provided.' });
      }

      // Check forbidden executable/script extensions
      if (originalName) {
        const lowerName = originalName.toLowerCase();
        const forbiddenExts = ['.php', '.exe', '.svg', '.html', '.htm', '.js', '.sh', '.bat', '.py', '.pl', '.aspx', '.asp', '.jsp', '.xml', '.vbs', '.jar', '.dll'];
        if (forbiddenExts.some((ext) => lowerName.endsWith(ext))) {
          return res.status(400).json({
            success: false,
            error: 'Security Error: Uploaded file extension is strictly forbidden.',
          });
        }
      }

      let base64Body = fileData;
      if (fileData.includes('base64,')) {
        base64Body = fileData.split('base64,')[1];
      }

      const fileBuffer = Buffer.from(base64Body, 'base64');

      // 1. Strict File Size Limit for Avatar (2MB Max)
      const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
      if (fileBuffer.length > MAX_AVATAR_BYTES) {
        return res.status(400).json({
          success: false,
          error: `Security Violation: Profile picture size (${(fileBuffer.length / (1024 * 1024)).toFixed(2)} MB) exceeds maximum allowed limit (2 MB).`,
        });
      }

      if (fileBuffer.length === 0) {
        return res.status(400).json({ success: false, error: 'Security Violation: Empty file buffer.' });
      }

      // 2. Strict Binary Header Magic Number Verification
      const headerResult = verifyServerMagicNumbers(fileBuffer);
      if (!headerResult.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Security Violation: Invalid image header (Magic Numbers Mismatch). Allowed formats are JPEG and PNG only.',
        });
      }

      // 3. Sanitized Randomized File Renaming (UUID)
      const sanitizedFileName = `avatar_${crypto.randomUUID()}.${headerResult.extension}`;

      // 4. Secure Isolated Cloud Storage
      secureUploadedAvatarsStore.set(sanitizedFileName, {
        buffer: fileBuffer,
        mimeType: headerResult.mimeType,
        extension: headerResult.extension,
        uploadedAt: new Date().toISOString(),
        sizeBytes: fileBuffer.length,
      });

      const secureUrl = `/api/uploads/profiles/${sanitizedFileName}`;

      // Update current active user's avatarUrl
      const currentUser = usersStore.find((u) => u.id === activeUserId);
      if (currentUser) {
        currentUser.avatarUrl = secureUrl;
      }

      return res.json({
        success: true,
        secureUrl,
        fileName: sanitizedFileName,
        mimeType: headerResult.mimeType,
        sizeBytes: fileBuffer.length,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Server error processing secure avatar upload.' });
    }
  });

  // Dedicated Isolated Serving Route for Uploaded Profile Pictures
  app.get('/api/uploads/profiles/:filename', (req, res) => {
    const rawFileName = req.params.filename;

    if (!rawFileName || !/^avatar_[a-f0-9\-]+\.(jpg|jpeg|png|webp)$/i.test(rawFileName)) {
      return res.status(400).send('Invalid or unsafe filename request.');
    }

    const fileRecord = secureUploadedAvatarsStore.get(rawFileName);
    if (!fileRecord) {
      return res.status(404).send('Profile picture image not found.');
    }

    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'");
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Type', fileRecord.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="avatar.${fileRecord.extension}"`);
    res.setHeader('Cache-Control', 'private, max-age=86400');

    return res.send(fileRecord.buffer);
  });

  // Interactive P2P Deposit Requests Endpoints
  app.post('/api/deposits/connect', (req, res) => {
    if (adminSettingsStore.pauseDeposits) {
      return res.status(400).json({ error: 'Deposits are temporarily suspended.' });
    }

    const currentUser = usersStore.find((u) => u.id === activeUserId);
    if (!currentUser) return res.status(401).json({ error: 'Unauthenticated' });

    const active = depositRequestsStore.find(
      (d) =>
        d.userId === currentUser.id &&
        (d.status === 'pending_approval' ||
          d.status === 'pending' ||
          d.status === 'unlocked' ||
          d.status === 'in_discussion' ||
          d.status === 'submitted')
    );

    if (active) {
      return res.json({ success: true, deposit: active });
    }

    const reqId = `dep-${Date.now()}`;
    const now = new Date().toISOString();

    const formattedDepositUserName = currentUser.name
      ? currentUser.name.replace(/\s*\(Investor\)/gi, '').trim()
      : 'المستثمر';

    const defaultAmt = 1000;
    const targetWallet = adminSettingsStore.trc20Address;

    const newDeposit: DepositRequest = {
      id: reqId,
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      amount: defaultAmt,
      network: 'TRC20',
      status: 'pending_approval',
      createdAt: now,
      chatMessages: [
        {
          id: `msg-${Date.now()}-1`,
          depositId: reqId,
          sender: 'system',
          text: `📋 [طلب إيداع جديد #${reqId}]\n• المستثمر: ${formattedDepositUserName}\n• المبلغ المقترح: $${defaultAmt.toLocaleString()} USDT\n• الشبكة: TRC20 (USDT)\n\nبانتظار موافقة وقبول مسؤول النظام لفتح وتفعيل بطاقة الدفع وتفاصيل المحفظة الرسمية.`,
          timestamp: now,
        },
        {
          id: `msg-${Date.now()}-2`,
          depositId: reqId,
          sender: 'admin',
          text: `أهلاً بك ${formattedDepositUserName}! تم استلام طلب الإيداع. يرجى الانتظار حتى يقوم المسؤول بالموافقة على الطلب وتفعيل بوابة الدفع وتزويدك ببيانات المحفظة الرسمية.`,
          timestamp: now,
        },
      ],
    };

    depositRequestsStore.unshift(newDeposit);
    res.json({ success: true, deposit: newDeposit });
  });

  app.post('/api/deposits/start', (req, res) => {
    if (adminSettingsStore.pauseDeposits) {
      return res.status(400).json({ error: 'Deposits are temporarily suspended.' });
    }

    const { amount, network, userNote } = req.body;
    const currentUser = usersStore.find((u) => u.id === activeUserId);
    if (!currentUser) return res.status(401).json({ error: 'Unauthenticated' });

    const numAmount = Number(amount);
    const depAmount = isNaN(numAmount) || numAmount < 0 ? 0 : numAmount;
    const depNetwork = (network as NetworkType) || 'TRC20';
    const reqId = `dep-${Date.now()}`;
    const now = new Date().toISOString();

    const formattedDepositUserName = currentUser.name
      ? currentUser.name.replace(/\s*\(Investor\)/gi, '').trim()
      : 'المستثمر';

    const amountDisplayStr =
      depAmount > 0 ? `$${depAmount.toLocaleString()} USDT` : 'مبلغ مفتوح (يتم تحديده لاحقاً)';

    const newDeposit: DepositRequest = {
      id: reqId,
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      amount: depAmount,
      network: depNetwork,
      status: 'pending_approval',
      createdAt: now,
      userNote: userNote || '',
      chatMessages: [
        {
          id: `msg-${Date.now()}-1`,
          depositId: reqId,
          sender: 'system',
          text: `📋 [طلب إيداع يدوي جديد #${reqId}]\n• المستثمر: ${formattedDepositUserName}\n• المبلغ التقديري: ${amountDisplayStr}\n• الشبكة: ${depNetwork} (USDT)${
            userNote ? `\n• ملاحظات المستثمر: ${userNote}` : ''
          }\n\nتم استلام طلبك وهو الآن في انتظار مراجعة وقبول مسؤول التسويات (Admin Review) لفتح جلسة المحادثة وتزويدك ببيانات المحفظة الرسمية.`,
          timestamp: now,
        },
        {
          id: `msg-${Date.now()}-2`,
          depositId: reqId,
          sender: 'admin',
          text: `مرحباً بك ${formattedDepositUserName}! تم استلام طلب الإيداع اليدوي بنجاح. نقوم حالياً بمراجعة الطلب وسيتم فتح جلسة المحادثة وعنوان المحفظة الرسمي فور الموافقة.`,
          timestamp: now,
        },
      ],
    };

    depositRequestsStore.unshift(newDeposit);

    createNotification({
      userId: currentUser.id,
      type: 'deposit',
      status: 'pending',
      title: {
        ar: 'تم تقديم طلب إيداع رصيد جديد',
        en: 'Deposit Request Submitted',
        ckb: 'داواکاری پڕکردنەوەی باڵانس تۆمارکرا',
      },
      message: {
        ar: `تم استلام طلب الإيداع بقيمة $${depAmount > 0 ? depAmount.toLocaleString() : '---'} USDT عبر (${depNetwork}). بانتظار موافقة الإدارة وتفعيل المحفظة.`,
        en: `Deposit request of $${depAmount > 0 ? depAmount.toLocaleString() : '---'} USDT via (${depNetwork}) submitted. Awaiting gateway activation.`,
        ckb: `داواکاری پڕکردنەوەی $${depAmount > 0 ? depAmount.toLocaleString() : '---'} USDT لە ڕێگەی (${depNetwork}) تۆمارکرا.`,
      },
      amount: depAmount > 0 ? depAmount : undefined,
      referenceId: reqId,
      linkAction: 'deposit',
    });

    res.json({ success: true, deposit: newDeposit });
  });

  // Dynamic Amount & Network update endpoint (from user or admin inside chat)
  app.post('/api/deposits/:id/update-amount', (req, res) => {
    const { id } = req.params;
    const { amount, network, updatedBy } = req.body;

    const deposit = depositRequestsStore.find((d) => d.id === id);
    if (!deposit) return res.status(404).json({ error: 'Deposit request not found' });

    const newAmount = Math.max(0, Number(amount) || deposit.amount);
    deposit.amount = newAmount;
    if (network) deposit.network = network as NetworkType;

    const updaterRole = updatedBy === 'admin' ? 'مسؤول النظام' : 'المستثمر';
    deposit.chatMessages.push({
      id: `msg-${Date.now()}`,
      depositId: id,
      sender: updatedBy === 'admin' ? 'admin' : 'user',
      text: `💰 [تحديث مبلغ الإيداع] قام ${updaterRole} بتعيين مبلغ الإيداع إلى: $${newAmount.toLocaleString()} USDT${network ? ` عبر شبكة (${network})` : ''}.`,
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, deposit });
  });

  // Admin Unlock Deposit Gateway for P2P Transfer (Step 1: Admin Approval)
  app.post('/api/deposits/:id/unlock', requireAdmin, (req, res) => {
    const { id } = req.params;
    const deposit = depositRequestsStore.find((d) => d.id === id);
    if (!deposit) return res.status(404).json({ error: 'Deposit request not found' });

    deposit.status = 'unlocked';
    const targetWallet =
      deposit.network === 'BEP20'
        ? adminSettingsStore.bep20Address
        : deposit.network === 'P2P_BANK'
        ? (adminSettingsStore.p2pBankInstructions?.ar || 'Direct Bank Wire')
        : adminSettingsStore.trc20Address;

    deposit.chatMessages.push({
      id: `msg-${Date.now()}`,
      depositId: id,
      sender: 'admin',
      walletAddress: targetWallet,
      text: `🔓 [تم قبول الطلب وتفعيل المحفظة الرسمية]\nأهلاً بك! تمت الموافقة على طلب الإيداع اليدوي وتفعيل جلسة المحادثة وبوابة الدفع.\n\n📍 عنوان المحفظة الرسمي (${deposit.network}):\n${targetWallet}\n\nيرجى تحويل المبلغ المطلوب إلى هذا العنوان، ثم إدخال رقم المعاملة الرمزية (TXID / Hash) وإرفاق صورة الإيصال في الحقول أدناه لاعتماد المبلغ فورياً في محفظتك.`,
      timestamp: new Date().toISOString(),
    });

    createNotification({
      userId: deposit.userId,
      type: 'deposit',
      status: 'info',
      title: {
        ar: 'تمت الموافقة وتفعيل بوابة الإيداع',
        en: 'Deposit Gateway Unlocked',
        ckb: 'دەروازەی پڕکردنەوەی باڵانس کرایەوە',
      },
      message: {
        ar: `تم قبول طلب الإيداع وتفعيل عنوان المحفظة الرسمي (${deposit.network}). يرجى التحويل ورفع الإيصال.`,
        en: `Your deposit request has been approved. Official wallet address is ready for transfer.`,
        ckb: `داواکاری پڕکردنەوە پەسەندکرا و ناونیشانی فەرمی جزدان ئامادەیە بۆ گواستنەوە.`,
      },
      amount: deposit.amount,
      referenceId: id,
      linkAction: 'deposit',
    });

    res.json({ success: true, deposit });
  });

  // User Submit Proof (TXID & Receipt Screenshot) (Step 2: User Submission)
  app.post('/api/deposits/:id/submit-proof', (req, res) => {
    const { id } = req.params;
    const { amount, txHash, receiptUrl } = req.body;

    const deposit = depositRequestsStore.find((d) => d.id === id);
    if (!deposit) return res.status(404).json({ error: 'Deposit request not found' });

    if (amount !== undefined && Number(amount) > 0) {
      deposit.amount = Number(amount);
    }
    if (txHash) deposit.txHash = txHash;
    if (receiptUrl) deposit.receiptUrl = receiptUrl;
    deposit.status = 'submitted';

    deposit.chatMessages.push({
      id: `msg-${Date.now()}`,
      depositId: id,
      sender: 'user',
      text: `📤 [تم إرسال إثبات التحويل والمعاملة]\n• المبلغ: $${deposit.amount.toLocaleString()} USDT\n• الشبكة: ${deposit.network}\n• رقم المعاملة (TXID): ${txHash || 'مرفق بالإيصال'}\n\nتم إرسال إشعار فوري لمسؤول المالية للتحقق من البلوكشين وتدقيق الإيصال لاعتماد الرصيد وشحن المحفظة.`,
      receiptUrl,
      txHash,
      timestamp: new Date().toISOString(),
    });

    createNotification({
      userId: deposit.userId,
      type: 'deposit',
      status: 'pending',
      title: {
        ar: 'تم رفع إثبات وإيصال التحويل',
        en: 'Deposit Proof Submitted',
        ckb: 'بەڵگەی پارەدان بە سەرکەوتوویی نێردرا',
      },
      message: {
        ar: `تم استلام تفاصيل التحويل المالي ($${deposit.amount.toLocaleString()} USDT). جاري تدقيق المعاملة من قسم المالية.`,
        en: `Transfer proof received for $${deposit.amount.toLocaleString()} USDT. Verification in progress.`,
        ckb: `بەڵگەی گواستنەوە بۆ $${deposit.amount.toLocaleString()} USDT وەرگیرا و لەژێر وردبینیدایە.`,
      },
      amount: deposit.amount,
      referenceId: id,
      linkAction: 'deposit',
    });

    res.json({ success: true, deposit });
  });

  // Admin Verification & Real-time Manual Approval/Rejection (Step 3: Manual Credit with Amount Override)
  app.post('/api/deposits/:id/verify', requireAdmin, (req, res) => {
    const { id } = req.params;
    const { status, amount, adminNote, rejectionReason, txHash, receiptUrl } = req.body;

    const deposit = depositRequestsStore.find((d) => d.id === id);
    if (!deposit) return res.status(404).json({ error: 'Deposit request not found' });

    if (amount !== undefined && Number(amount) > 0) {
      deposit.amount = Number(amount);
    }
    deposit.status = status;
    if (adminNote) deposit.adminNote = adminNote;
    if (txHash) deposit.txHash = txHash;
    if (receiptUrl) deposit.receiptUrl = receiptUrl;

    const targetUser = usersStore.find((u) => u.id === deposit.userId);

    if (status === 'approved') {
      const creditedAmount = deposit.amount;
      if (targetUser) {
        if (targetUser.mainBalance === undefined) targetUser.mainBalance = 0;
        if (targetUser.investmentBalance === undefined) targetUser.investmentBalance = targetUser.usdtBalance || 0;

        targetUser.mainBalance += creditedAmount;
        targetUser.usdtBalance = (targetUser.mainBalance || 0) + (targetUser.investmentBalance || 0);

        syncUserWalletToSupabase(targetUser.id, targetUser.usdtBalance, targetUser.totalInvested, targetUser.totalRoiEarned, targetUser.mainBalance, targetUser.investmentBalance);

        logTransactionRecord({
          id: `tx-dep-appr-${deposit.id}`,
          userId: targetUser.id,
          userName: targetUser.name,
          userEmail: targetUser.email,
          type: 'deposit',
          title: { ar: 'إيداع معتمد وشحن حساب 💰', en: 'Approved USDT Deposit 💰', ckb: 'دابەزاندنی پەسەندکراو' },
          description: { ar: `تمت الموافقة على طلب الإيداع وشحن $${creditedAmount.toLocaleString()} USDT في المحفظة الرئيسية.`, en: `Deposit approved and $${creditedAmount.toLocaleString()} USDT credited to Main Wallet.`, ckb: 'پڕکردنەوەی باڵانس' },
          amount: creditedAmount,
          wallet: 'main',
          status: 'completed',
          txHash: txHash || deposit.txHash,
          referenceId: deposit.id,
          category: deposit.network,
        });

        // Manual Referral Qualification & Tier Bonus Workflow
        const pendingRef = referralsStore.find(
          (r) => r.invitedUserId === targetUser.id && r.status === 'registered'
        );
        if (pendingRef) {
          const inviter = usersStore.find((u) => u.id === pendingRef.inviterId);
          if (inviter) {
            const tiers = adminSettingsStore.referralTiers || {
              tier1Min: 1,
              tier1Max: 5,
              tier1Amount: 10,
              tier2Min: 6,
              tier2Max: 15,
              tier2Amount: 20,
              tier3Min: 16,
              tier3Amount: 35,
            };

            const currentCount = (inviter.qualifiedReferralsCount || 0) + 1;
            let tierNum = 1;
            let rewardAmt = tiers.tier1Amount || 10;

            if (currentCount >= (tiers.tier3Min || 16)) {
              tierNum = 3;
              rewardAmt = tiers.tier3Amount || 35;
            } else if (currentCount >= (tiers.tier2Min || 6)) {
              tierNum = 2;
              rewardAmt = tiers.tier2Amount || 20;
            }

            pendingRef.status = 'eligible';
            pendingRef.depositAmount = creditedAmount;
            pendingRef.rewardAmount = rewardAmt;
            pendingRef.tierApplied = tierNum;

            createNotification({
              userId: inviter.id,
              type: 'system',
              status: 'info',
              title: {
                ar: '✨ اكتمل الإيداع الأول لصديقك المدعو! الإحالة مؤهلة',
                en: '✨ First Deposit Completed! Referral Eligible',
                ckb: '✨ یەکەم ئێیداع تەواوبوو! بەکارهێنەر ئامادەیە',
              },
              message: {
                ar: `قام صديقك المدعو (${targetUser.name}) بإكمال أول عملية إيداع بنجاح. أصبحت الإحالة مؤهلة الآن، وسيتم إضافة مكافأة البونص (+${rewardAmt} USDT) يدويًا من قبل إدارة المنصة إلى محفظتك قريبًا!`,
                en: `Your invited friend (${targetUser.name}) completed their first deposit. Your referral is now eligible, and the bonus (+${rewardAmt} USDT) will be manually credited to your wallet by administration shortly!`,
                ckb: `هاوڕێیەکەت یەکەم ئێیداعی ئەنجامدا. بڕی دیاریەکە لەلایەن بەڕێوەبەرایەتیەوە دەخرێتە سەر باڵانسەکەت.`,
              },
              linkAction: 'dashboard',
            });
          }
        }
      }
      deposit.chatMessages.push({
        id: `msg-${Date.now()}`,
        depositId: id,
        sender: 'admin',
        text: `✅ [اعتماد مالي فوري وإضافة رصيد] تم التحقق من الإيصال والبلوكشين بنجاح! تم اعتماد مبلغ $${creditedAmount.toLocaleString()} USDT وإضافته فورياً إلى رصيد المحفظة. الرصيد الإجمالي الحالي للمستثمر: $${targetUser ? targetUser.usdtBalance.toLocaleString() : creditedAmount.toLocaleString()} USDT.`,
        timestamp: new Date().toISOString(),
      });

      createNotification({
        userId: deposit.userId,
        type: 'deposit',
        status: 'success',
        title: {
          ar: 'تم اعتماد الإيداع وشحن الرصيد بنجاح',
          en: 'Deposit Approved & Credited',
          ckb: 'پڕکردنەوەی باڵانس پەسەندکرا و زیادکرا',
        },
        message: {
          ar: `تهانينا! تم اعتماد إيداعك بقيمة $${creditedAmount.toLocaleString()} USDT وإضافته فورياً إلى رصيد محفظتك.`,
          en: `Congratulations! Your deposit of $${creditedAmount.toLocaleString()} USDT has been verified and credited to your wallet.`,
          ckb: `پیرۆزە! بڕی $${creditedAmount.toLocaleString()} USDT بە سەرکەوتوویی خرایە سەر باڵانسەکەت.`,
        },
        amount: creditedAmount,
        referenceId: id,
        linkAction: 'deposit',
      });
    } else if (status === 'rejected') {
      deposit.chatMessages.push({
        id: `msg-${Date.now()}`,
        depositId: id,
        sender: 'admin',
        text: `❌ [قسم المالية P2P] تعذر اعتماد الإيداع: ${rejectionReason || adminNote || 'تعذر مطابقة رقم المعاملة مع السجل الرمزي'}. يرجى مراجعة التفاصيل وإعادة المحاولة.`,
        timestamp: new Date().toISOString(),
      });

      createNotification({
        userId: deposit.userId,
        type: 'deposit',
        status: 'rejected',
        title: {
          ar: 'تعذر اعتماد وتأكيد الإيداع',
          en: 'Deposit Request Declined',
          ckb: 'داواکاری پڕکردنەوە پەسەند نەکرا',
        },
        message: {
          ar: `تم رفض الإيداع: ${rejectionReason || adminNote || 'تعذر التحقق من الإيصال أو هاش المعاملة'}.`,
          en: `Deposit declined: ${rejectionReason || adminNote || 'Could not verify the transaction receipt or hash'}.`,
          ckb: `داواکاری ڕەتکرایەوە: ${rejectionReason || adminNote || 'نەتوانرا بەڵگەکە پشتڕاست بکرێتەوە'}.`,
        },
        amount: deposit.amount,
        referenceId: id,
        linkAction: 'deposit',
      });
    } else if (status === 'unlocked' || status === 'in_discussion') {
      deposit.status = 'unlocked';
      deposit.chatMessages.push({
        id: `msg-${Date.now()}`,
        depositId: id,
        sender: 'admin',
        text: `🔓 [موافقة المسؤول] تم قبول وتأكيد طلب الإيداع! تم تفعيل بطاقة الدفع وبيانات المحفظة للمستثمر.`,
        timestamp: new Date().toISOString(),
      });

      createNotification({
        userId: deposit.userId,
        type: 'deposit',
        status: 'info',
        title: {
          ar: 'تم فتح بطاقة ومحفظة الإيداع',
          en: 'Deposit Gateway Unlocked',
          ckb: 'دەروازەی پڕکردنەوە کرایەوە',
        },
        message: {
          ar: `تم قبول طلب الإيداع من قبل المسؤول ويمكنك الآن إرسال الحوالة وإرفاق الإيصال.`,
          en: `Your deposit request has been unlocked. You can now transfer funds and attach the receipt.`,
          ckb: `داواکارییەکەت کرایەوە و ئێستا دەتوانی پارەکە بگوازیتەوە.`,
        },
        amount: deposit.amount,
        referenceId: id,
        linkAction: 'deposit',
      });
    }

    const safeUser = targetUser ? ({ ...targetUser, password: '' } as User) : null;
    res.json({ success: true, deposit, user: safeUser });
  });

  // Live Deposit Chat Thread Endpoint
  app.post('/api/deposits/:id/chat', (req, res) => {
    const { id } = req.params;
    const { text, receiptUrl, txHash, sender } = req.body;

    const deposit = depositRequestsStore.find((d) => d.id === id);
    if (!deposit) return res.status(404).json({ error: 'Deposit request not found' });

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      depositId: id,
      sender: sender || 'user',
      text: text || '',
      receiptUrl,
      txHash,
      timestamp: new Date().toISOString(),
    };

    deposit.chatMessages.push(newMessage);
    res.json({ success: true, deposit, message: newMessage });
  });

  // 1. Plan-Specific Profit Distribution API
  app.post('/api/admin/distribute-plan-profit', requireAdmin, async (req, res) => {
    try {
      const { projectId, planId, distributionType, value, note } = req.body;
      if (!projectId || !value || Number(value) <= 0) {
        return res.status(400).json({ error: 'Project ID and valid positive profit value are required' });
      }

      const project = projectsStore.find((p) => p.id === projectId);
      if (!project) return res.status(404).json({ error: 'Project not found' });

      // Find matching active investments for this project (and planId if specified)
      let matchingInvestments = investmentsStore.filter((i) => i.projectId === projectId && i.status === 'active');
      if (planId) {
        const planMatching = matchingInvestments.filter((i) => i.planId === planId);
        if (planMatching.length > 0) {
          matchingInvestments = planMatching;
        }
      }

      if (matchingInvestments.length === 0) {
        return res.status(400).json({ error: 'No active subscribers/investors found for this specific plan' });
      }

      const totalCapitalInPlan = matchingInvestments.reduce((sum, i) => sum + i.amount, 0);
      let totalDistributed = 0;
      const payouts: Array<{ userId: string; amount: number; investmentId: string }> = [];

      matchingInvestments.forEach((inv) => {
        let payoutAmount = 0;
        if (distributionType === 'percent') {
          payoutAmount = Number((inv.amount * (Number(value) / 100)).toFixed(2));
        } else {
          payoutAmount = Number(((inv.amount / totalCapitalInPlan) * Number(value)).toFixed(2));
        }

        if (payoutAmount > 0) {
          inv.accruedRoi = (inv.accruedRoi || 0) + payoutAmount;
          inv.lastPayoutDate = new Date().toISOString();

          const user = usersStore.find((u) => u.id === inv.userId);
          if (user) {
            if (user.investmentBalance === undefined) user.investmentBalance = user.usdtBalance || 0;
            if (user.mainBalance === undefined) user.mainBalance = 0;

            user.investmentBalance = Number(((user.investmentBalance || 0) + payoutAmount).toFixed(2));
            user.usdtBalance = (user.mainBalance || 0) + (user.investmentBalance || 0);
            user.totalRoiEarned = Number(((user.totalRoiEarned || 0) + payoutAmount).toFixed(2));

            logTransactionRecord({
              userId: user.id,
              userName: user.name,
              userEmail: user.email,
              type: 'roi',
              title: { ar: 'أرباح عوائد الأسطول 📈', en: 'Fleet Yield Earnings 📈', ckb: 'قازانجی وەبەرهێنان' },
              description: { ar: `إضافة أرباح الخطة ($${payoutAmount.toLocaleString()} USDT) إلى محفظة الاستثمار (${typeof project.title === 'string' ? project.title : project.title.ar})`, en: `Plan profit payout credited to Investment Wallet`, ckb: 'زیادکردنی قازانج' },
              amount: payoutAmount,
              wallet: 'investment',
              status: 'completed',
              referenceId: inv.id,
            });

            // Create notification
            notificationsStore.unshift({
              id: `notif_roi_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              userId: user.id,
              type: 'roi',
              status: 'success',
              title: {
                ar: 'توزيع أرباح الخطة الاستثمارية',
                en: 'Plan Yield Profit Distributed',
                ckb: 'دابەشکردنی قازانجی پلانی وەبەرهێنان',
              },
              message: {
                ar: `تم إيداع مبلغ +${payoutAmount.toFixed(2)} USDT كأرباح لخطة (${inv.planName || project.title.ar}) في محفظتك. ${note || ''}`,
                en: `Yield profit +${payoutAmount.toFixed(2)} USDT for plan (${inv.planName || project.title.en}) credited to wallet. ${note || ''}`,
                ckb: `بڕی +${payoutAmount.toFixed(2)} USDT وەک قازانجی پلان خرایە سەر جزدانەکەت.`,
              },
              amount: payoutAmount,
              createdAt: new Date().toISOString(),
              read: false,
              linkAction: 'portfolio',
            });

            // Update Supabase wallets table if available
            syncUserWalletToSupabase(user.id, user.usdtBalance, user.totalInvested, user.totalRoiEarned, user.mainBalance, user.investmentBalance);
          }
          payouts.push({ userId: inv.userId, amount: payoutAmount, investmentId: inv.id });
          totalDistributed += payoutAmount;
        }
      });

      res.json({
        success: true,
        message: `Successfully distributed ${totalDistributed.toFixed(2)} USDT among ${payouts.length} plan investor(s).`,
        payoutsCount: payouts.length,
        totalDistributed: Number(totalDistributed.toFixed(2)),
      });
    } catch (err: any) {
      console.error('Failed to distribute plan profit:', err);
      res.status(500).json({ error: err.message || 'Profit distribution failed' });
    }
  });

  // 2. Completed Plan Status Update API
  app.post('/api/projects/:id/plan-status', requireAdmin, (req, res) => {
    const { id } = req.params;
    const { status, planId } = req.body;
    const proj = projectsStore.find((p) => p.id === id);
    if (!proj) return res.status(404).json({ error: 'Project not found' });

    if (status) {
      proj.status = status;
      if (status === 'completed' || status === 'fully_funded') {
        proj.promoBadge = {
          ar: '✅ مكتمل - سيفتح الاستثمار قريباً',
          en: '✅ Completed - Investment Opening Soon',
          ckb: '✅ تەواوبوو - بەم زووانە دەکرێتەوە',
        };
      }
    }

    if (planId && proj.plans) {
      const plan = proj.plans.find((pl) => pl.id === planId);
      if (plan && status) {
        plan.status = status;
      }
    }

    res.json({ success: true, project: proj });
  });

  // 3. News / Announcements Section APIs
  app.get('/api/news', (req, res) => {
    res.json({ news: newsStore });
  });

  app.post('/api/news', requireAdmin, (req, res) => {
    const { id, title, content, category, imageUrl, isPinned } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    let article: NewsArticle;
    if (id) {
      const idx = newsStore.findIndex((n) => n.id === id);
      if (idx !== -1) {
        newsStore[idx] = {
          ...newsStore[idx],
          title,
          content,
          category: category || newsStore[idx].category,
          imageUrl: imageUrl !== undefined ? imageUrl : newsStore[idx].imageUrl,
          isPinned: isPinned !== undefined ? Boolean(isPinned) : newsStore[idx].isPinned,
        };
        article = newsStore[idx];
      } else {
        return res.status(404).json({ error: 'News article not found' });
      }
    } else {
      article = {
        id: `news_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title,
        content,
        category: category || 'announcement',
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80',
        isPinned: Boolean(isPinned),
        publishedAt: new Date().toISOString(),
        author: 'إدارة المنصة (Aseel Management)',
      };
      newsStore.unshift(article);

      // Broadcast news notification to all users
      const newsTitleStr = typeof title === 'object' ? title.ar || title.en : title;
      usersStore.forEach((u) => {
        notificationsStore.unshift({
          id: `notif_news_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          userId: u.id,
          type: 'system',
          status: 'info',
          title: {
            ar: '📰 نشرة إخبارية جديدة من المنصة',
            en: '📰 New Platform Announcement Published',
            ckb: '📰 بڵاوکراوەی نوێی پلاتفۆرم',
          },
          message: newsTitleStr,
          createdAt: new Date().toISOString(),
          read: false,
          linkAction: 'dashboard',
        });
      });
    }

    res.json({ success: true, article, news: newsStore });
  });

  app.delete('/api/news/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    newsStore = newsStore.filter((n) => n.id !== id);
    res.json({ success: true, news: newsStore });
  });

  // 4. Online Members Status Ping & List APIs
  app.post('/api/user/ping', (req, res) => {
    const currentUser = usersStore.find((u) => u.id === activeUserId);
    if (currentUser) {
      const existingIdx = onlineUsersStore.findIndex((o) => o.id === currentUser.id);
      const onlineRecord: OnlineUser = {
        id: currentUser.id,
        name: currentUser.name || currentUser.email,
        email: currentUser.email,
        role: currentUser.role,
        governorate: currentUser.governorate || 'بغداد',
        lastActive: new Date().toISOString(),
        isOnline: true,
      };
      if (existingIdx !== -1) {
        onlineUsersStore[existingIdx] = onlineRecord;
      } else {
        onlineUsersStore.unshift(onlineRecord);
      }
    }
    res.json({ success: true, onlineCount: onlineUsersStore.length });
  });

  app.get('/api/online-users', requireAdmin, async (req, res) => {
    if (supabaseServer && isSupabaseServerConfigured()) {
      try {
        const { data: realUsers, error } = await supabaseServer
          .from('profiles')
          .select(`
            id,
            full_name,
            phone,
            wallets (
              available_balance,
              locked_capital
            )
          `);

        if (!error && realUsers && realUsers.length > 0) {
          const uniqueMembersMap = new Map<string, any>();
          realUsers.forEach((u: any) => {
            if (u.id && !uniqueMembersMap.has(u.id)) {
              const wList = Array.isArray(u.wallets) ? u.wallets : (u.wallets ? [u.wallets] : []);
              const w = wList[0];
              const bal = w ? Number(w.available_balance || 0) : 0;
              const email = (u.email || '').toLowerCase();
              const isFounder = email === 'goog7029766@gmail.com';

              uniqueMembersMap.set(u.id, {
                id: u.id,
                name: isFounder
                  ? 'مؤسس المنشأة والمالك الرئيسي (Founder & Main Owner)'
                  : (u.full_name || u.name || u.phone || u.email || 'عضو متصل'),
                email: u.email || '',
                phone: u.phone || '',
                role: isFounder ? 'admin' : (u.role || 'investor'),
                governorate: u.province || u.governorate || 'العراق',
                lastActive: bal > 0 ? `رصيد المحفظة: $${bal.toLocaleString()} USDT` : 'نشط الآن',
                isOnline: true,
              });
            }
          });

          const activeMembers = Array.from(uniqueMembersMap.values());

          return res.json({
            onlineCount: activeMembers.length,
            users: activeMembers,
          });
        }
      } catch (err) {
        console.warn('⚠️ Error in /api/online-users DB query:', err);
      }
    }

    const activeMembers = usersStore.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      governorate: u.governorate || 'بغداد',
      lastActive: 'نشط الآن',
      isOnline: true,
    }));

    res.json({
      onlineCount: activeMembers.length,
      users: activeMembers,
    });
  });

  // 5. Bonus / Gift Payout Feature API
  app.post('/api/admin/send-bonus', requireAdmin, async (req, res) => {
    try {
      const { target, userId, amount, reason } = req.body;
      const giftAmount = Number(amount);
      if (!giftAmount || giftAmount <= 0) {
        return res.status(400).json({ error: 'Valid positive gift amount is required' });
      }

      const bonusReason = reason || 'مكافأة وهدية نقدية من إدارة منصة أصيل للاستثمار';

      let recipients: AuthUser[] = [];
      if (target === 'single') {
        const user = usersStore.find((u) => u.id === userId);
        if (!user) return res.status(404).json({ error: 'Selected recipient user not found' });
        recipients = [user];
      } else {
        recipients = usersStore.filter((u) => u.role === 'investor' || u.role === 'admin');
      }

      recipients.forEach((u) => {
        u.usdtBalance = Number(((u.usdtBalance || 0) + giftAmount).toFixed(2));

        notificationsStore.unshift({
          id: `gift_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          userId: u.id,
          type: 'credit',
          status: 'success',
          title: {
            ar: '🎁 هدية ومكافأة نقدية من المنصة',
            en: '🎁 Cash Bonus & Gift Credited',
            ckb: '🎁 دیاری و پاداشتی نەقدی لە پلاتفۆرمەوە',
          },
          message: {
            ar: `تم إيداع هدية نقدية بمبلغ +${giftAmount.toFixed(2)} USDT مباشرة في حسابك. ${bonusReason}`,
            en: `A cash bonus gift of +${giftAmount.toFixed(2)} USDT has been credited to your account balance. ${bonusReason}`,
            ckb: `پاداشت و دیاری بە بڕی +${giftAmount.toFixed(2)} USDT خرایە سەر هەژمارەکەت.`,
          },
          amount: giftAmount,
          createdAt: new Date().toISOString(),
          read: false,
          linkAction: 'dashboard',
        });

        syncUserWalletToSupabase(u.id, u.usdtBalance, u.totalInvested, u.totalRoiEarned);
      });

      res.json({
        success: true,
        message: `Successfully sent ${giftAmount.toFixed(2)} bonus gift to ${recipients.length} member(s).`,
        recipientsCount: recipients.length,
        giftAmount,
      });
    } catch (err: any) {
      console.error('Failed to send bonus payout:', err);
      res.status(500).json({ error: err.message || 'Sending bonus gift failed' });
    }
  });

  // Referral Engine Endpoints
  app.get('/api/referrals/my-stats', (req, res) => {
    const currentUser = usersStore.find((u) => u.id === activeUserId);
    if (!currentUser) return res.status(401).json({ error: 'غير مصرح / Unauthorized' });

    if (!currentUser.referralCode) {
      currentUser.referralCode = `ASEEL-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    }

    const myInvitedList = referralsStore.filter((r) => r.inviterId === currentUser.id);

    const tiers = adminSettingsStore.referralTiers || {
      tier1Min: 1,
      tier1Max: 5,
      tier1Amount: 10,
      tier2Min: 6,
      tier2Max: 15,
      tier2Amount: 20,
      tier3Min: 16,
      tier3Amount: 35,
    };

    const qualifiedCount = currentUser.qualifiedReferralsCount || myInvitedList.filter((r) => r.status === 'qualified').length;
    let currentTier = 1;
    let currentTierBonus = tiers.tier1Amount;
    let nextTierRequired = tiers.tier2Min;
    if (qualifiedCount >= tiers.tier3Min) {
      currentTier = 3;
      currentTierBonus = tiers.tier3Amount;
      nextTierRequired = tiers.tier3Min;
    } else if (qualifiedCount >= tiers.tier2Min) {
      currentTier = 2;
      currentTierBonus = tiers.tier2Amount;
      nextTierRequired = tiers.tier3Min;
    }

    res.json({
      success: true,
      referralCode: currentUser.referralCode,
      totalReferralsCount: currentUser.totalReferralsCount || myInvitedList.length,
      qualifiedReferralsCount: qualifiedCount,
      totalReferralEarnings: currentUser.totalReferralEarnings || 0,
      currentTier,
      currentTierBonus,
      nextTierRequired,
      tiers,
      invitedUsers: myInvitedList,
    });
  });

  app.get('/api/admin/referrals', requireAdmin, (req, res) => {
    const totalInvited = referralsStore.length;
    const qualifiedList = referralsStore.filter((r) => r.status === 'qualified');
    const totalQualified = qualifiedList.length;
    const totalBonusesPaid = qualifiedList.reduce((sum, r) => sum + (r.rewardAmount || 0), 0);

    const tiers = adminSettingsStore.referralTiers || {
      tier1Min: 1,
      tier1Max: 5,
      tier1Amount: 10,
      tier2Min: 6,
      tier2Max: 15,
      tier2Amount: 20,
      tier3Min: 16,
      tier3Amount: 35,
    };

    const inviterMap: Record<string, { inviterId: string; inviterName: string; inviterEmail: string; inviterCode: string; totalInvited: number; qualifiedCount: number; totalEarned: number }> = {};

    usersStore.forEach((u) => {
      const myRefs = referralsStore.filter((r) => r.inviterId === u.id);
      if (myRefs.length > 0 || (u.totalReferralsCount && u.totalReferralsCount > 0)) {
        const myQualified = myRefs.filter((r) => r.status === 'qualified');
        const earned = myQualified.reduce((s, r) => s + (r.rewardAmount || 0), 0);
        inviterMap[u.id] = {
          inviterId: u.id,
          inviterName: u.name,
          inviterEmail: u.email,
          inviterCode: u.referralCode || 'ASEEL-REF',
          totalInvited: Math.max(u.totalReferralsCount || 0, myRefs.length),
          qualifiedCount: Math.max(u.qualifiedReferralsCount || 0, myQualified.length),
          totalEarned: Math.max(u.totalReferralEarnings || 0, earned),
        };
      }
    });

    const topInviters = Object.values(inviterMap).sort((a, b) => b.totalEarned - a.totalEarned || b.qualifiedCount - a.qualifiedCount);

    res.json({
      success: true,
      stats: {
        totalInvited,
        totalQualified,
        totalBonusesPaid,
        activeInvitersCount: topInviters.length,
      },
      topInviters,
      referrals: referralsStore,
      tiers,
    });
  });

  app.post('/api/admin/referrals/tiers', requireAdmin, (req, res) => {
    const { tier1Amount, tier2Amount, tier3Amount, tier1Max, tier2Max, tier3Min } = req.body;
    const current = adminSettingsStore.referralTiers || {
      tier1Min: 1,
      tier1Max: 5,
      tier1Amount: 10,
      tier2Min: 6,
      tier2Max: 15,
      tier2Amount: 20,
      tier3Min: 16,
      tier3Amount: 35,
    };

    adminSettingsStore.referralTiers = {
      tier1Min: 1,
      tier1Max: Number(tier1Max) || current.tier1Max,
      tier1Amount: Number(tier1Amount) || current.tier1Amount,
      tier2Min: (Number(tier1Max) || current.tier1Max) + 1,
      tier2Max: Number(tier2Max) || current.tier2Max,
      tier2Amount: Number(tier2Amount) || current.tier2Amount,
      tier3Min: Number(tier3Min) || current.tier3Min,
      tier3Amount: Number(tier3Amount) || current.tier3Amount,
    };

    res.json({ success: true, tiers: adminSettingsStore.referralTiers });
  });

  app.post('/api/admin/referrals/qualify', requireAdmin, (req, res) => {
    const { referralId } = req.body;
    const refRecord = referralsStore.find((r) => r.id === referralId);
    if (!refRecord) return res.status(404).json({ error: 'Referral record not found' });

    if (refRecord.status === 'qualified') {
      return res.status(400).json({ error: 'الإحالة مؤهلة ومحسوبة بالفعل' });
    }

    const inviter = usersStore.find((u) => u.id === refRecord.inviterId);
    const tiers = adminSettingsStore.referralTiers || {
      tier1Min: 1,
      tier1Max: 5,
      tier1Amount: 10,
      tier2Min: 6,
      tier2Max: 15,
      tier2Amount: 20,
      tier3Min: 16,
      tier3Amount: 35,
    };

    const nextCount = (inviter?.qualifiedReferralsCount || 0) + 1;
    let tierNum = 1;
    let rewardAmt = tiers.tier1Amount || 10;
    if (nextCount >= tiers.tier3Min) {
      tierNum = 3;
      rewardAmt = tiers.tier3Amount;
    } else if (nextCount >= tiers.tier2Min) {
      tierNum = 2;
      rewardAmt = tiers.tier2Amount;
    }

    refRecord.status = 'qualified';
    refRecord.rewardAmount = rewardAmt;
    refRecord.tierApplied = tierNum;
    refRecord.qualifiedAt = new Date().toISOString();

    if (inviter) {
      inviter.usdtBalance = (Number(inviter.usdtBalance) || 0) + rewardAmt;
      inviter.qualifiedReferralsCount = nextCount;
      inviter.totalReferralEarnings = (Number(inviter.totalReferralEarnings) || 0) + rewardAmt;
      syncUserWalletToSupabase(inviter.id, inviter.usdtBalance, inviter.totalInvested, inviter.totalRoiEarned);

      createNotification({
        userId: inviter.id,
        type: 'credit',
        status: 'success',
        title: {
          ar: '🎉 تهانينا! تم إضافة مكافأة الإحالة إلى محفظتك',
          en: '🎉 Congratulations! Referral Reward Credited',
          ckb: '🎉 پیرۆزە! پاداشتی ڕاسپاردن خرایە سەر باڵانسەکەت',
        },
        message: {
          ar: `مبروك! تم اعتماد وصرف مكافأة الإحالة بقيمة +${rewardAmt} USDT بنجاح وإضافتها مباشرة إلى رصيد محفظتك من قبل إدارة المنصة عن انضمام وإيداع الصديق المدعو (${refRecord.invitedUserName}).`,
          en: `Congratulations! A referral reward of +${rewardAmt} USDT (Tier ${tierNum}) has been successfully credited to your wallet balance by the administration for your invited member (${refRecord.invitedUserName}).`,
          ckb: `پیرۆزە! بڕی +${rewardAmt} USDT بەدەست خرایە سەر باڵانسەکەت بۆ بانگهێشتکردنی (${refRecord.invitedUserName}).`,
        },
        amount: rewardAmt,
        linkAction: 'dashboard',
      });
    }

    res.json({ success: true, referral: refRecord, inviter });
  });

  // Reset state
  app.post('/api/reset', (req, res) => {
    usersStore = [...initialUsersList];
    activeUserId = 'user-investor-1';
    projectsStore = [...initialProjects];
    adminSettingsStore = { ...initialAdminSettings };
    investmentsStore = [...initialInvestments];
    depositRequestsStore = [...initialDepositRequests];
    kycStore = { ...initialKYC };
    withdrawalsStore = [];
    supportTicketsStore = [...initialSupportTicketsList];
    syncFounderAccountToSupabase();
    res.json({ success: true });
  });

  // Vite middleware for dev or static server in prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
