import React, { useState, useMemo, useEffect } from 'react';
import {
  Gift,
  Users,
  User,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Search,
  Check,
  Wallet,
  ChevronDown,
  RefreshCw,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { Language, User as UserType } from '../../types';

interface BonusGiftModalProps {
  currentLang: Language;
  users: UserType[];
  onClose: () => void;
  onSuccess: () => void;
}

export const BonusGiftModal: React.FC<BonusGiftModalProps> = ({
  currentLang,
  users: initialUsers,
  onClose,
  onSuccess,
}) => {
  const [targetMode, setTargetMode] = useState<'single' | 'all'>('single');
  const [usersList, setUsersList] = useState<UserType[]>(initialUsers || []);
  const [selectedUserId, setSelectedUserId] = useState<string>(initialUsers[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  
  const [targetWallet, setTargetWallet] = useState<'main' | 'investment'>('main');
  const [giftAmount, setGiftAmount] = useState<number>(100);
  const [reason, setReason] = useState<string>('مكافأة التميز والولاء لمنصة أصيل 🌟');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fallback fetch of latest users list if initialUsers is empty
  useEffect(() => {
    if (!initialUsers || initialUsers.length === 0) {
      fetch('/api/admin/profiles')
        .then((res) => res.json())
        .then((data) => {
          if (data && Array.isArray(data.profiles)) {
            setUsersList(data.profiles);
            if (!selectedUserId && data.profiles[0]) {
              setSelectedUserId(data.profiles[0].id);
            }
          } else if (Array.isArray(data)) {
            setUsersList(data);
            if (!selectedUserId && data[0]) {
              setSelectedUserId(data[0].id);
            }
          }
        })
        .catch(() => {});
    }
  }, [initialUsers]);

  // Filter users based on search query (name, email, phone, ID)
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return usersList;
    const term = searchQuery.toLowerCase().trim();
    return usersList.filter(
      (u) =>
        (u.name && u.name.toLowerCase().includes(term)) ||
        (u.email && u.email.toLowerCase().includes(term)) ||
        (u.phone && u.phone.toLowerCase().includes(term)) ||
        (u.id && u.id.toLowerCase().includes(term))
    );
  }, [usersList, searchQuery]);

  // Derived currently selected user
  const selectedUser = useMemo(() => {
    return usersList.find((u) => u.id === selectedUserId);
  }, [usersList, selectedUserId]);

  const handleSelectUser = (user: UserType) => {
    setSelectedUserId(user.id);
    setIsDropdownOpen(false);
    setErrorMsg(null);
  };

  const handleSendBonus = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!giftAmount || giftAmount <= 0) {
      setErrorMsg(
        currentLang === 'ar'
          ? 'يرجى إدخال مبلغ هدية نقدية صحيح أكبر من صفر'
          : 'Please enter a valid positive bonus amount'
      );
      return;
    }

    if (targetMode === 'single' && !selectedUserId) {
      setErrorMsg(
        currentLang === 'ar'
          ? 'يرجى البحث واختيار المستثمر المستلم'
          : 'Please search and select recipient user'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/admin/send-bonus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: targetMode,
          userId: targetMode === 'single' ? selectedUserId : undefined,
          amount: giftAmount,
          wallet: targetWallet,
          reason: reason.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send bonus');
      }

      const walletNameAr = targetWallet === 'investment' ? 'محفظة الاستثمار' : 'المحفظة الرئيسية';
      const walletNameEn = targetWallet === 'investment' ? 'Investment Wallet' : 'Main Wallet';

      setSuccessMsg(
        currentLang === 'ar'
          ? `✅ تم تحويل وإيداع هدية نقدية بقيمة $${giftAmount.toLocaleString()} USDT بنجاح في (${walletNameAr}) لعدد (${data.recipientsCount}) مستثمر وتحديث الرصيد فوراً.`
          : `Successfully sent $${giftAmount.toLocaleString()} USDT bonus gift into (${walletNameEn}) for ${data.recipientsCount} member(s).`
      );

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Bonus payout failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative space-y-6 overflow-hidden max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-500/10">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>{currentLang === 'ar' ? 'صرف الهدايا والمكافآت النقدية' : 'Bonus & Gift Distribution'}</span>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-mono">
                  USDT Pool
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentLang === 'ar'
                  ? 'خصم المبلغ من محفظة النظام وإخصاب حساب المستثمر مباشرة'
                  : 'Deduct from system pool and safely credit investor wallet'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="space-y-5">
          {/* Target Toggle */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <span>{currentLang === 'ar' ? '1. نطاق الاستهداف والمستلم:' : '1. Gift Recipient Target Scope:'}</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setTargetMode('single');
                  setIsDropdownOpen(false);
                }}
                className={`py-3 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all border cursor-pointer ${
                  targetMode === 'single'
                    ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-500/20'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <User className="w-4 h-4" />
                <span>{currentLang === 'ar' ? 'عضو/مستثمر محدد' : 'Specific Investor'}</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetMode('all')}
                className={`py-3 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all border cursor-pointer ${
                  targetMode === 'all'
                    ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-500/20'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>{currentLang === 'ar' ? 'جميع المستثمرين (بث عام)' : 'Broadcast All Members'}</span>
              </button>
            </div>
          </div>

          {/* Interactive User Search & Autocomplete */}
          {targetMode === 'single' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300">
                  {currentLang === 'ar' ? 'البحث عن المستثمر:' : 'Search & Select Investor:'}
                </label>
                {selectedUser && (
                  <span className="text-[11px] text-purple-400 font-mono">
                    {currentLang === 'ar' ? 'مستثمر محدد جاهز' : 'Selected'}
                  </span>
                )}
              </div>

              {/* Selected User Display Card */}
              {selectedUser && !isDropdownOpen ? (
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-purple-500/30 flex items-center justify-between gap-3 shadow-inner">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md">
                      {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-white truncate">{selectedUser.name}</h4>
                        <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-mono shrink-0">
                          ID: {selectedUser.id.substring(0, 8)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {selectedUser.email || selectedUser.phone || 'بدون بريد'}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] font-mono text-emerald-400 mt-1">
                        <span>رصيد المحفظة: ${selectedUser.usdtBalance?.toLocaleString() ?? 0} USDT</span>
                        {selectedUser.mainBalance !== undefined && (
                          <span className="text-slate-400">| الرئيسية: ${selectedUser.mainBalance.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(true)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-bold shrink-0 transition-colors border border-purple-500/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>{currentLang === 'ar' ? 'تغيير المستثمر' : 'Change User'}</span>
                  </button>
                </div>
              ) : (
                /* Search Input & Dropdown */
                <div className="relative">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-3.5 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      autoFocus={isDropdownOpen}
                      placeholder={
                        currentLang === 'ar'
                          ? 'ادخل الاسم، البريد الإلكتروني، رقم الهاتف، أو ID...'
                          : 'Type name, email, phone, or ID to search...'
                      }
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setIsDropdownOpen(true);
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-2xl py-3 pl-10 rtl:pl-10 rtl:pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 rtl:right-auto rtl:left-3 top-3 text-slate-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Dropdown Results List */}
                  {isDropdownOpen && (
                    <div className="mt-2 bg-slate-950 border border-slate-800 rounded-2xl max-h-56 overflow-y-auto p-2 space-y-1 shadow-2xl z-20 relative divide-y divide-slate-800/40">
                      <div className="px-2 py-1 text-[10px] text-slate-400 font-mono flex items-center justify-between">
                        <span>{currentLang === 'ar' ? 'نتائج البحث:' : 'Search Results:'}</span>
                        <span className="text-purple-400 font-bold">{filteredUsers.length} مستثمر</span>
                      </div>

                      {filteredUsers.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400">
                          {currentLang === 'ar'
                            ? `لم يتم العثور على أي مستثمر بهذ الاسم أو البيانات (${searchQuery})`
                            : 'No matching investors found'}
                        </div>
                      ) : (
                        filteredUsers.map((user) => {
                          const isSelected = user.id === selectedUserId;
                          return (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => handleSelectUser(user)}
                              className={`w-full text-right rtl:text-right p-2.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-purple-600/20 border border-purple-500/40 text-white'
                                  : 'hover:bg-slate-800/70 text-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-slate-800 text-purple-300 font-black text-xs flex items-center justify-center shrink-0">
                                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div className="min-w-0 text-right rtl:text-right">
                                  <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                                    <span>{user.name}</span>
                                    <span className="text-[9px] bg-slate-800 text-slate-400 px-1 py-0.2 rounded font-mono">
                                      ID: {user.id.substring(0, 6)}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 truncate">
                                    {user.email || user.phone || 'لا يوجد بريد'}
                                  </div>
                                </div>
                              </div>

                              <div className="text-left rtl:text-left shrink-0 ml-2 rtl:ml-0 rtl:mr-2">
                                <div className="text-xs font-mono font-bold text-emerald-400">
                                  ${user.usdtBalance?.toLocaleString() ?? 0}
                                </div>
                                <div className="text-[9px] text-slate-400 font-mono">USDT Balance</div>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Destination Wallet Selection (Routing Rule) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-purple-400" />
              <span>{currentLang === 'ar' ? '2. تحديد المحفظة المستلمة:' : '2. Target Recipient Wallet:'}</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setTargetWallet('main')}
                className={`p-3 rounded-2xl text-xs font-bold text-right rtl:text-right transition-all border cursor-pointer ${
                  targetWallet === 'main'
                    ? 'bg-purple-600/20 border-purple-500 text-white shadow-md'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full border-2 ${targetWallet === 'main' ? 'border-purple-400 bg-purple-500' : 'border-slate-600'}`} />
                  <span className="text-white font-extrabold">{currentLang === 'ar' ? 'المحفظة الرئيسية' : 'Main Wallet'}</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-normal">
                  {currentLang === 'ar' ? 'متاحة للسحب المباشر أو إعادة الاستثمار' : 'Available for payout or investment'}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTargetWallet('investment')}
                className={`p-3 rounded-2xl text-xs font-bold text-right rtl:text-right transition-all border cursor-pointer ${
                  targetWallet === 'investment'
                    ? 'bg-purple-600/20 border-purple-500 text-white shadow-md'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full border-2 ${targetWallet === 'investment' ? 'border-purple-400 bg-purple-500' : 'border-slate-600'}`} />
                  <span className="text-white font-extrabold">{currentLang === 'ar' ? 'محفظة الاستثمار' : 'Investment Wallet'}</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-normal">
                  {currentLang === 'ar' ? 'مخصصة للاكتتاب المباشر في الأسطول' : 'Allocated for fleet project investments'}
                </p>
              </button>
            </div>
          </div>

          {/* Gift Amount & Presets */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">
              {currentLang === 'ar' ? '3. قيمة الهدية / البونص (USDT):' : '3. Gift Amount ($ USDT):'}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-4 rtl:left-auto rtl:right-4 flex items-center text-purple-400 font-mono font-black text-sm">
                $
              </span>
              <input
                type="number"
                min="1"
                step="10"
                value={giftAmount}
                onChange={(e) => setGiftAmount(Number(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-8 rtl:pl-4 rtl:pr-8 text-base font-mono font-extrabold text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Quick Presets */}
            <div className="grid grid-cols-6 gap-1.5 pt-1">
              {[25, 50, 100, 250, 500, 1000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setGiftAmount(preset)}
                  className={`py-1.5 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer ${
                    giftAmount === preset
                      ? 'bg-purple-500/20 text-purple-300 border-purple-400'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  ${preset}
                </button>
              ))}
            </div>
          </div>

          {/* Reason / Accompanying Message */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">
              {currentLang === 'ar' ? '4. سبب الهدية / ملاحظات الإدارة:' : '4. Gift Reason & Message:'}
            </label>
            <input
              type="text"
              placeholder={currentLang === 'ar' ? 'مثال: مكافأة التميز والولاء لمنصة أصيل' : 'e.g. Loyalty Appreciation Bonus'}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-xs text-white focus:outline-none focus:border-purple-500"
            />

            {/* Preset reasons */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                'مكافأة التميز والولاء لمنصة أصيل 🌟',
                'بونص ترحيبي للمستثمر الجديد 🎁',
                'هدية عوائد موسمية استثنائية 📈',
                'توزيع أرباح إضافية للأسطول 🚛',
              ].map((pReason) => (
                <button
                  key={pReason}
                  type="button"
                  onClick={() => setReason(pReason)}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-[10px] text-slate-400 border border-slate-800 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {pReason}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* System Pool Deduction & Direct Routing Notice */}
        <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/20 flex items-start gap-2.5 text-[11px] text-purple-300 leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <span>
            {currentLang === 'ar'
              ? `سيتم خصم مبلغ $${giftAmount.toLocaleString()} USDT من محفظة النظام العامة وإضافته مباشرة إلى (${targetWallet === 'investment' ? 'محفظة الاستثمار' : 'المحفظة الرئيسية'}) مع إرسال إشعار فوري للمستلم.`
              : `Amount of $${giftAmount.toLocaleString()} USDT will be deducted from system pool and credited directly to recipient's (${targetWallet === 'investment' ? 'Investment Wallet' : 'Main Wallet'}).`}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer"
          >
            {currentLang === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleSendBonus}
            disabled={isSubmitting}
            className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2 rtl:space-x-reverse"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{currentLang === 'ar' ? 'جاري تحويل الهدية...' : 'Sending Gift...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{currentLang === 'ar' ? 'إرسال الهدية وتحديث الرصيد الآن' : 'Send Cash Gift Now'}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

