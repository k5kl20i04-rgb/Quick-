export type Language = 'ar' | 'en' | 'ckb';

export type VehicleCategory = 'cargo_freight' | 'passenger_transport';

export type ProjectStatus = 'active' | 'fully_funded' | 'paused' | 'completed';

export type KYCStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected';

export type DepositStatus = 'in_discussion' | 'pending_approval' | 'unlocked' | 'submitted' | 'pending' | 'approved' | 'rejected';

export type WithdrawalStatus = 'pending' | 'approved' | 'submitted' | 'completed' | 'rejected';

export type NetworkType = 'TRC20' | 'BEP20' | 'P2P_BANK';

export type TransactionType = 'deposit' | 'withdrawal' | 'transfer' | 'roi' | 'investment' | 'bonus' | 'refund';
export type TransactionStatus = 'completed' | 'pending' | 'rejected' | 'failed';
export type WalletType = 'main' | 'investment' | 'both';

export interface TransactionRecord {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  type: TransactionType;
  title: string | { ar: string; en: string; ckb: string };
  description?: string | { ar: string; en: string; ckb: string };
  amount: number;
  wallet: WalletType;
  sourceWallet?: WalletType;
  targetWallet?: WalletType;
  status: TransactionStatus;
  timestamp: string;
  txHash?: string;
  referenceId?: string;
  category?: string;
  adminNote?: string;
}

export interface InvestmentPlan {
  id: string;
  projectId: string;
  name: {
    ar: string;
    en: string;
    ckb: string;
  };
  monthlyRoiPercent: number;
  minInvestment: number;
  maxInvestment?: number;
  targetAmount: number;
  raisedAmount: number;
  maxParticipants?: number;
  currentParticipants?: number;
  status: 'active' | 'completed' | 'paused';
  expectedProfit?: string | { ar: string; en: string; ckb: string };
}

export interface Project {
  id: string;
  title: {
    ar: string;
    en: string;
    ckb: string;
  };
  category: VehicleCategory;
  description: {
    ar: string;
    en: string;
    ckb: string;
  };
  imageUrl: string;
  route: {
    ar: string;
    en: string;
    ckb: string;
  };
  vehicleType: string;
  targetAmount: number;
  raisedAmount: number;
  minInvestment: number;
  monthlyRoiPercent: number;
  lockupMonths: number; // Default 5 months
  status: ProjectStatus;
  totalVehicles: number;
  capacitySpecs: string; // e.g., "40 Tons Heavy Haul" or "52 Luxury Seats"
  tripsPerMonth?: number; // Average trips executed per month
  freightRatePerTrip?: number; // Average logistic freight revenue per trip (USDT)
  expectedProfit?: string | { ar: string; en: string; ckb: string };
  expectedProfitRange?: string;
  createdDate: string;
  isFeatured?: boolean;
  promoBadge?: {
    ar: string;
    en: string;
    ckb: string;
  };
  plans?: InvestmentPlan[];
}

export interface FreightTrip {
  id: string;
  projectId: string;
  planId?: string;
  projectTitle?: string;
  tripNumber: string; // e.g., "TRIP-108"
  originRoute: string; // e.g., "بغداد إلى البصرة"
  cargoStatus: 'in_transit' | 'delivered' | 'loading' | 'completed' | string;
  date: string; // e.g., "2026-08-14"
  revenueUsdt: number; // e.g., 1250
  vehiclePlate?: string;
  notes?: string;
  createdAt: string;
}

export interface Investment {
  id: string;
  userId: string;
  projectId: string;
  projectTitle: string;
  planId?: string;
  planName?: string;
  category: VehicleCategory;
  amount: number;
  monthlyRoiPercent: number;
  startDate: string; // ISO string
  endDate: string; // ISO string (5 months after start)
  lockupMonths: number;
  status: 'active' | 'completed' | 'withdrawn';
  accruedRoi: number;
  lastPayoutDate: string;
  tripsCompleted?: number; // Total completed trips for this investment period
  freightRatePerTrip?: number; // Logistic freight revenue rate per trip
  totalFreightRevenue?: number; // Calculated logistic freight gross revenue
  isReinvested?: boolean; // True if investor opted to continue investment after maturity
}

export interface NewsArticle {
  id: string;
  title: {
    ar: string;
    en: string;
    ckb: string;
  } | string;
  content: {
    ar: string;
    en: string;
    ckb: string;
  } | string;
  category: 'announcement' | 'fleet_update' | 'distribution' | 'general';
  imageUrl?: string;
  isPinned?: boolean;
  publishedAt: string; // ISO string
  author?: string;
}

export interface OnlineUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'investor' | 'admin';
  governorate?: string;
  lastActive: string;
  isOnline: boolean;
}

export interface ChatMessage {
  id: string;
  depositId?: string;
  requestId?: string;
  sender: 'user' | 'admin' | 'system';
  text: string;
  receiptUrl?: string;
  txHash?: string;
  walletAddress?: string;
  timestamp: string;
}

export interface DepositRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  network: NetworkType;
  txHash?: string;
  receiptUrl?: string;
  status: DepositStatus;
  createdAt: string;
  adminNote?: string;
  userNote?: string;
  chatMessages: ChatMessage[];
}

export interface KYCSubmission {
  userId: string;
  userName: string;
  userEmail: string;
  fullName: string;
  idNumber: string;
  nationalIdFront: string;
  nationalIdBack: string;
  housingCard: string; // Residence Card / بطاقة السكن
  status: KYCStatus;
  submittedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export type PayoutMethod = 'USDT_TRC20' | 'USDT_BEP20' | 'P2P_ZAINCASH' | 'P2P_BANK' | 'P2P_FASTPAY';

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  investmentId?: string;
  projectTitle?: string;
  amount: number;
  sourceWallet?: 'investment' | 'main';
  payoutMethod: PayoutMethod;
  payoutDetails: string;
  destinationWallet?: string;
  network?: NetworkType;
  withdrawalCategory?: 'profits_only' | 'capital_exit' | 'reinvest';
  requestedAt: string;
  processedAt?: string;
  status: WithdrawalStatus;
  lockupCompleted?: boolean;
  rejectionReason?: string;
  adminNote?: string;
  chatMessages: ChatMessage[];
  receiptUrl?: string;
  txHash?: string;
}

export interface ReferralTierConfig {
  tier1Min: number; // Default: 1
  tier1Max: number; // Default: 5
  tier1Amount: number; // Default: 10 USDT per referral
  tier2Min: number; // Default: 6
  tier2Max: number; // Default: 15
  tier2Amount: number; // Default: 20 USDT per referral
  tier3Min: number; // Default: 16
  tier3Amount: number; // Default: 35 USDT per referral
}

export interface AdminSettings {
  trc20Address: string;
  bep20Address: string;
  p2pBankInstructions: {
    ar: string;
    en: string;
    ckb: string;
  };
  announcementMessage: {
    ar: string;
    en: string;
    ckb: string;
  };
  defaultMonthlyRoi: number;
  minDepositUsdt: number;
  pauseDeposits?: boolean;
  pauseWithdrawals?: boolean;
  registrationEnabled?: boolean;
  referralTiers?: ReferralTierConfig;
}

export interface ReferralRecord {
  id: string;
  inviterId: string;
  inviterName: string;
  inviterEmail?: string;
  inviterCode: string;
  invitedUserId: string;
  invitedUserName: string;
  invitedUserEmail: string;
  status: 'registered' | 'eligible' | 'qualified';
  depositAmount?: number;
  rewardAmount: number;
  tierApplied: number; // 1, 2, or 3
  createdAt: string;
  qualifiedAt?: string;
}

export interface SupportTicket {
  id: string; // e.g. sup-882103
  userId: string;
  fullName: string;
  phone: string;
  email: string;
  subject?: string;
  status: 'pending_approval' | 'pending' | 'unlocked' | 'open' | 'closed';
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export type NotificationType =
  | 'subscription'
  | 'deposit'
  | 'withdrawal'
  | 'kyc'
  | 'roi'
  | 'support'
  | 'system'
  | 'credit';

export type NotificationStatus = 'success' | 'pending' | 'rejected' | 'info';

export interface AppNotification {
  id: string;
  userId?: string;
  type: NotificationType;
  status: NotificationStatus;
  title:
    | {
        ar: string;
        en: string;
        ckb: string;
      }
    | string;
  message:
    | {
        ar: string;
        en: string;
        ckb: string;
      }
    | string;
  amount?: number;
  referenceId?: string;
  createdAt: string; // ISO date string
  read: boolean;
  linkAction?: 'portfolio' | 'deposit' | 'withdrawal' | 'kyc' | 'chat' | 'dashboard' | 'news';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'investor' | 'admin';
  usdtBalance: number;
  mainBalance?: number; // Main Wallet (General storage / savings)
  investmentBalance?: number; // Investment Wallet (Active trading & investment liquidity)
  kycStatus: KYCStatus;
  accountStatus?: 'active' | 'suspended' | 'verified';
  idNumber?: string;
  totalInvested: number;
  totalRoiEarned: number;
  joinedDate?: string;
  phone?: string;
  governorate?: string;
  countryCode?: string;
  referralCode?: string;
  avatarUrl?: string;
  referredBy?: string;
  referredByCode?: string;
  totalReferralsCount?: number;
  qualifiedReferralsCount?: number;
  totalReferralEarnings?: number;
}

export interface AdminActivityLog {
  id: string;
  admin_id: string;
  admin_email?: string;
  adminId?: string;
  adminName?: string;
  target_user_id?: string | null;
  targetUserId?: string | null;
  target_user_name?: string | null;
  targetUserName?: string | null;
  action: string;
  details: Record<string, any>;
  created_at: string;
  createdAt?: string;
}

export type { CountryConfig, GovernorateOption } from './data/countryConfig';
