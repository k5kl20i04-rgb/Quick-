import React, { useState, useMemo } from 'react';
import {
  X,
  DollarSign,
  User as UserIcon,
  Search,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  MinusCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Tag,
  FileText,
  CreditCard,
  Building2,
} from 'lucide-react';
import { Language, User } from '../../types';
import { translations } from '../../i18n/translations';

interface ManualCreditModalProps {
  currentLang: Language;
  users: User[];
  preselectedUserId?: string;
  onClose: () => void;
  onSuccess: (updatedUser: User, message: string) => void;
}

export const ManualCreditModal: React.FC<ManualCreditModalProps> = ({
  currentLang,
  users,
  preselectedUserId,
  onClose,
  onSuccess,
}) => {
  const isRtl = currentLang === 'ar' || currentLang === 'ckb';
  const t = translations[currentLang] || translations.ar;

  // All users available for selection
  const clientUsers = useMemo(() => {
    return users;
  }, [users]);

  // Selected User
  const [selectedUserId, setSelectedUserId] = useState<string>(
    preselectedUserId || clientUsers[0]?.id || users[0]?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Mode: credit (+) | debit (-) | set (=)
  const [mode, setMode] = useState<'credit' | 'debit' | 'set'>('credit');
  const [amount, setAmount] = useState<string>('5000');
  const [category, setCategory] = useState<string>('شحن مباشر P2P');
  const [note, setNote] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedUser = useMemo(() => {
    return users.find((u) => u.id === selectedUserId) || null;
  }, [users, selectedUserId]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase().trim();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.includes(q))
    );
  }, [users, searchQuery]);

  // Balance calculations
  const currentBalance = selectedUser ? selectedUser.usdtBalance : 0;
  const numAmount = Math.max(0, Number(amount) || 0);

  const calculatedNewBalance = useMemo(() => {
    if (mode === 'credit') return currentBalance + numAmount;
    if (mode === 'debit') return Math.max(0, currentBalance - numAmount);
    if (mode === 'set') return numAmount;
    return currentBalance;
  }, [currentBalance, numAmount, mode]);

  // Categories presets
  const categories = [
    { id: 'p2p', labelAr: 'شحن مباشر P2P', labelEn: 'Direct P2P Deposit' },
    { id: 'bank', labelAr: 'حوالة مصرفية معتمدة', labelEn: 'Bank Wire Settlement' },
    { id: 'bonus', labelAr: 'مكافأة إيداع تشجيعية', labelEn: 'Incentive Bonus' },
    { id: 'adjustment', labelAr: 'تسوية وتصحيح رصيد', labelEn: 'Administrative Adjustment' },
    { id: 'profit', labelAr: 'توزيع أرباح إضافية', labelEn: 'Yield / Profit Credit' },
  ];

  // Quick Amount Presets
  const amountPresets = [500, 1000, 2500, 5000, 10000, 20000, 50000];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedUserId) {
      setErrorMsg(isRtl ? 'يرجى اختيار حساب المستثمر' : 'Please select an investor');
      return;
    }

    if (numAmount <= 0) {
      setErrorMsg(isRtl ? 'يرجى إدخال مبلغ صحيح أكبر من 0' : 'Please enter an amount greater than 0');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/admin/manual-credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          amount: numAmount,
          mode,
          note: note.trim(),
          category,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update balance');
      }

      onSuccess(data.client, data.message || 'تم تحديث رصيد المستثمر بنجاح');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء تنفيذ عملية الشحن');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto overscroll-contain text-slate-100 relative custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                {isRtl ? 'شحن وتعديل رصيد حساب عميل' : 'Manual Account Balance Top-Up'}
              </h3>
              <p className="text-xs text-amber-400 font-medium">
                {isRtl
                  ? 'إضافة أو خصم رصيد USDT لحساب المستثمر مباشرة مع قيد العملية'
                  : 'Credit or adjust investor balance with instant ledger registration'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* 1. Investor Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              {isRtl ? '1. اختيار المستثمر / الحساب المستهدف:' : '1. Select Target Investor:'}
            </label>

            {/* Quick Search */}
            <div className="relative mb-2">
              <Search className="w-4 h-4 text-slate-500 absolute top-3 right-3 rtl:right-3 ltr:left-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isRtl ? 'بحث بالاسم، البريد الإلكتروني أو الهاتف...' : 'Filter investors by name, email...'}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-9 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-slate-100 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              {filteredUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} [ID: {u.id.substring(0, 8)}] ({u.email || u.phone || 'بدون بريد'}) — الرصيد: ${u.usdtBalance.toLocaleString()} USDT
                </option>
              ))}
            </select>
          </div>

          {/* Selected User Snapshot */}
          {selectedUser && (
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 flex items-center justify-center font-bold">
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <span className="font-extrabold text-white block">{selectedUser.name}</span>
                  <span className="text-[11px] text-slate-400 font-mono">{selectedUser.email}</span>
                </div>
              </div>

              <div className="text-right rtl:text-left">
                <span className="text-[10px] text-slate-500 block">{isRtl ? 'الرصيد الحالي' : 'Current Balance'}</span>
                <span className="font-mono font-black text-amber-400 text-sm">
                  ${selectedUser.usdtBalance.toLocaleString()} USDT
                </span>
              </div>
            </div>
          )}

          {/* 2. Operation Mode Toggle (Credit + / Debit - / Set =) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              {isRtl ? '2. نوع العملية المالية:' : '2. Operation Type:'}
            </label>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMode('credit')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'credit'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>{isRtl ? 'إيداع وشحن (+)' : 'Credit (+)'}</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('debit')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'debit'
                    ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <MinusCircle className="w-4 h-4" />
                <span>{isRtl ? 'خصم رصيد (-)' : 'Debit (-)'}</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('set')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'set'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>{isRtl ? 'تعيين الرصيد (=)' : 'Set Balance (=)'}</span>
              </button>
            </div>
          </div>

          {/* 3. Amount & Quick Presets */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300">
              {isRtl ? '3. مبلغ العملية (USDT):' : '3. Amount (USDT):'}
            </label>

            <div className="relative">
              <span className="absolute left-4 rtl:left-auto rtl:right-4 top-3.5 text-amber-400 font-extrabold text-sm">$</span>
              <input
                type="number"
                min={1}
                step={1}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="5000"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 text-white font-mono font-black text-base rounded-xl py-3 px-8 outline-none transition"
              />
              <span className="absolute right-4 rtl:right-auto rtl:left-4 top-3.5 text-xs font-black text-amber-400 font-sans">
                USDT
              </span>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {amountPresets.map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setAmount(p.toString())}
                  className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                    amount === p.toString()
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  +${p.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Category / Reason */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              {isRtl ? '4. تصنيف سبب المعاملة:' : '4. Transaction Category:'}
            </label>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c.id} value={isRtl ? c.labelAr : c.labelEn}>
                  {isRtl ? c.labelAr : c.labelEn}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Administrative Note */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              {isRtl ? '5. ملاحظة العملية / رقم السند (اختياري):' : '5. Administrative Note (Optional):'}
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={isRtl ? 'مثال: تم الاستلام نقداً في الفرع الرئيسي / حوالة ويسترن يونيون' : 'e.g., Direct bank receipt #884920'}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Real-time Calculation Summary Card */}
          <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
            <div className="text-[11px] font-bold text-slate-400 border-b border-slate-800 pb-1.5 flex items-center justify-between">
              <span>{isRtl ? 'ملخص الحساب المالي بعد العملية:' : 'Balance Calculation Summary:'}</span>
              <span className="font-mono text-amber-400 font-bold">1 USDT = $1.00 USD</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block">{isRtl ? 'الرصيد السابق' : 'Previous'}</span>
                <span className="font-mono font-bold text-slate-300">${currentBalance.toLocaleString()}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block">{isRtl ? 'مقدار التعديل' : 'Delta'}</span>
                <span
                  className={`font-mono font-black ${
                    mode === 'credit'
                      ? 'text-emerald-400'
                      : mode === 'debit'
                      ? 'text-rose-400'
                      : 'text-amber-400'
                  }`}
                >
                  {mode === 'credit' ? `+${numAmount.toLocaleString()}` : mode === 'debit' ? `-${numAmount.toLocaleString()}` : `=${numAmount.toLocaleString()}`}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block">{isRtl ? 'الرصيد الجديد' : 'New Balance'}</span>
                <span className="font-mono font-black text-emerald-400 text-sm">
                  ${calculatedNewBalance.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || numAmount <= 0}
              className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>
                {loading
                  ? isRtl ? 'جاري تحديث الرصيد...' : 'Processing...'
                  : isRtl ? 'تأكيد شحن الحساب وتحديث الرصيد' : 'Confirm & Update Balance'}
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
