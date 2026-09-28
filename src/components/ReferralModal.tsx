import React, { useState, useEffect } from 'react';
import {
  X,
  Gift,
  Copy,
  Check,
  Award,
  Users,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
  Sparkles,
  Share2,
  Info,
  ArrowRight,
} from 'lucide-react';
import { Language, ReferralRecord, ReferralTierConfig } from '../types';

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: Language;
  userReferralCode?: string;
}

export const ReferralModal: React.FC<ReferralModalProps> = ({
  isOpen,
  onClose,
  currentLang,
  userReferralCode,
}) => {
  if (!isOpen) return null;

  const isAr = currentLang === 'ar';
  const isCkb = currentLang === 'ckb';

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    referralCode: userReferralCode || 'ASEEL-REF',
    totalReferralsCount: 0,
    qualifiedReferralsCount: 0,
    totalReferralEarnings: 0,
    currentTier: 1,
    currentTierBonus: 10,
    nextTierRequired: 6,
    tiers: {
      tier1Min: 1,
      tier1Max: 5,
      tier1Amount: 10,
      tier2Min: 6,
      tier2Max: 15,
      tier2Amount: 20,
      tier3Min: 16,
      tier3Amount: 35,
    } as ReferralTierConfig,
    invitedUsers: [] as ReferralRecord[],
  });

  const [copied, setCopied] = useState(false);

  const fetchMyStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/referrals/my-stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to load referral stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMyStats();
    }
  }, [isOpen]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(stats.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate progress percentage to next tier
  const qualified = stats.qualifiedReferralsCount || 0;
  let progressPercent = (qualified / (stats.tiers.tier3Min || 16)) * 100;
  if (progressPercent > 100) progressPercent = 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-100 flex items-center gap-2">
                <span>{isAr ? 'برنامج مكافآت الإحالة' : 'Referral Rewards Program'}</span>
                <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded-full">
                  🎁 {isAr ? 'بونص فوري' : 'Instant Bonus'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {isAr
                  ? 'شارك كود دعوتك المخصص واكسب مكافآت نقدية تصاعدية تضاف مباشرة لمحفظتك'
                  : 'Share your clean dedicated referral code and earn tier bonus credits.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Custom Referral Code Card */}
          <div className="bg-gradient-to-r from-amber-950/50 via-slate-950 to-slate-950 border border-amber-500/30 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-3">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                {isAr ? 'كود الدعوة المخصص الخاص بك' : 'Your Dedicated Referral Code'}
              </span>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-amber-500/30 rounded-xl p-3">
                <span className="font-mono text-2xl font-black text-amber-300 tracking-widest text-center sm:text-right rtl:sm:text-right ltr:sm:text-left">
                  {stats.referralCode}
                </span>

                <button
                  onClick={handleCopyCode}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-slate-950" />
                      <span>{isAr ? 'تم نسخ الكود!' : 'Code Copied!'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-950" />
                      <span>{isAr ? 'نسخ كود الدعوة' : 'Copy Code'}</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-amber-200/90 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl">
                💡 {isAr
                  ? 'ملاحظة: تتم مراجعة وصرف مكافآت الإحالة يدويًا من قبل الإدارة فور إكمال الصديق لأول إيداع. ستتلقى إشعارًا فورياً يهنئك ويؤكد إضافة المكافأة إلى محفظتك.'
                  : 'Note: Referral rewards are processed manually. When your invited friend completes their first deposit, the bonus will be manually credited to your wallet by administration with an instant notification.'}
              </p>
            </div>
          </div>

          {/* Tiered Milestone Progress Scaling */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-slate-200">
                  {isAr ? 'مستويات الشريحة والمكافآت (Tiered Rewards)' : 'Milestone Tiers'}
                </span>
              </div>
              <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                {isAr ? `المستوى الحالي: Tier ${stats.currentTier}` : `Current Tier: ${stats.currentTier}`}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold text-slate-400">
                <span>{isAr ? `${qualified} إحالة مؤهلة` : `${qualified} Qualified`}</span>
                <span>{isAr ? `المستوى القادم عند ${stats.nextTierRequired} إحالات` : `Next Tier at ${stats.nextTierRequired}`}</span>
              </div>
              <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(5, progressPercent)}%` }}
                />
              </div>
            </div>

            {/* Tier Breakdown Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div
                className={`p-3 rounded-xl border transition-all ${
                  stats.currentTier === 1
                    ? 'bg-amber-500/10 border-amber-500/40'
                    : 'bg-slate-900/50 border-slate-800'
                }`}
              >
                <div className="text-[10px] font-bold text-amber-400">Tier 1 (1-5 إحالات)</div>
                <div className="text-lg font-black text-slate-100 font-mono mt-0.5">
                  +${stats.tiers.tier1Amount} <span className="text-xs font-normal text-slate-400">USDT / داعٍ</span>
                </div>
              </div>

              <div
                className={`p-3 rounded-xl border transition-all ${
                  stats.currentTier === 2
                    ? 'bg-indigo-500/10 border-indigo-500/40'
                    : 'bg-slate-900/50 border-slate-800'
                }`}
              >
                <div className="text-[10px] font-bold text-indigo-400">Tier 2 (6-15 إحالة)</div>
                <div className="text-lg font-black text-slate-100 font-mono mt-0.5">
                  +${stats.tiers.tier2Amount} <span className="text-xs font-normal text-slate-400">USDT / داعٍ</span>
                </div>
              </div>

              <div
                className={`p-3 rounded-xl border transition-all ${
                  stats.currentTier === 3
                    ? 'bg-emerald-500/10 border-emerald-500/40'
                    : 'bg-slate-900/50 border-slate-800'
                }`}
              >
                <div className="text-[10px] font-bold text-emerald-400">Tier 3 (16+ إحالة)</div>
                <div className="text-lg font-black text-slate-100 font-mono mt-0.5">
                  +${stats.tiers.tier3Amount} <span className="text-xs font-normal text-slate-400">USDT / داعٍ</span>
                </div>
              </div>
            </div>
          </div>

          {/* User Earnings Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-center">
              <span className="text-[10px] text-slate-400 font-bold block mb-1">
                {isAr ? 'إجمالي المدعوين' : 'Invited Members'}
              </span>
              <span className="text-xl font-black text-slate-100 font-mono">
                {stats.totalReferralsCount}
              </span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-center">
              <span className="text-[10px] text-slate-400 font-bold block mb-1">
                {isAr ? 'المؤهلون للاستثمار' : 'Qualified Members'}
              </span>
              <span className="text-xl font-black text-emerald-400 font-mono">
                {stats.qualifiedReferralsCount}
              </span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-center">
              <span className="text-[10px] text-slate-400 font-bold block mb-1">
                {isAr ? 'أرباح الإحالات' : 'Referral Earnings'}
              </span>
              <span className="text-xl font-black text-amber-400 font-mono">
                ${stats.totalReferralEarnings}
              </span>
            </div>
          </div>

          {/* Invited Users List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-400" />
              <span>{isAr ? 'سجل الأعضاء الانضمام بكودك' : 'Your Referral History'}</span>
            </h3>

            {stats.invitedUsers.length === 0 ? (
              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-6 text-center text-slate-500 text-xs">
                {isAr
                  ? 'لم ينضم أي عضو باستخدام كود دعوتك بعد. انسخ الكود وشاركه مع أصدقائك للبدء!'
                  : 'No invited members yet. Share your code to start earning referral bonuses!'}
              </div>
            ) : (
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/60 text-xs">
                {stats.invitedUsers.map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-200">{item.invitedUserName}</div>
                      <div className="text-[10px] text-slate-500">{item.invitedUserEmail}</div>
                    </div>

                    <div className="text-right rtl:text-right ltr:text-left">
                      {item.status === 'qualified' ? (
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {isAr ? 'تم الصرف والإضافة للمحفظة' : 'Bonus Credited'}
                          </span>
                          <span className="text-[11px] font-mono font-bold text-amber-400 mt-0.5">
                            +${item.rewardAmount} USDT
                          </span>
                        </div>
                      ) : item.status === 'eligible' ? (
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-cyan-400" />
                            {isAr ? 'مؤهل (بانتظار إضافة الإدارة)' : 'Eligible (Pending Credit)'}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 mt-0.5">
                            +${item.rewardAmount || 10} USDT
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {isAr ? 'مسجل (بانتظار الإيداع الأول)' : 'Pending First Deposit'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
