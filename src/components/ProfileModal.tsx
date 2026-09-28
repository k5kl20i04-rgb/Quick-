import React, { useState } from 'react';
import { X, User, ShieldCheck, Mail, Phone, MapPin, Calendar, Award, Hash, Wallet, ArrowUpRight, Camera, RefreshCw, AlertTriangle, Lock, ArrowLeftRight } from 'lucide-react';
import { Language, User as UserType } from '../types';
import { translations } from '../i18n/translations';
import { uploadProfilePictureSecurely, sanitizeImageUrl } from '../lib/secureImageUpload';

interface ProfileModalProps {
  currentLang: Language;
  user: UserType | null;
  onClose: () => void;
  onOpenKYC: () => void;
  onOpenDeposit: () => void;
  onOpenTransferModal?: () => void;
  onUserUpdate?: (updatedUser: UserType) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  currentLang,
  user,
  onClose,
  onOpenKYC,
  onOpenDeposit,
  onOpenTransferModal,
  onUserUpdate,
}) => {
  const t = translations[currentLang] || translations.ar;
  const [uploadingAvatar, setUploadingAvatar] = useState<boolean>(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | undefined>(user?.avatarUrl);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError(null);
    setUploadingAvatar(true);

    try {
      const res = await uploadProfilePictureSecurely(file, currentLang as any);
      if (res.success && res.url) {
        setLocalAvatarUrl(res.url);
        if (user && onUserUpdate) {
          onUserUpdate({ ...user, avatarUrl: res.url });
        }
      } else {
        setAvatarError(res.error || (currentLang === 'ar' ? 'فشل رفع الصورة الشخصية.' : 'Failed to upload profile picture.'));
      }
    } catch (err: any) {
      setAvatarError(err.message || 'Error processing profile image.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const getKycBadgeClass = (status: string) => {
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

  const getKycBadgeText = (status: string) => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-5 relative max-h-[92vh] overflow-y-auto text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 sm:pb-4">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">{t.profileModalTitle}</h2>
              <p className="text-xs text-slate-400">{t.investorMode}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onClose();
            }}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 flex items-center gap-4">
          <div className="relative group shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 font-extrabold flex items-center justify-center text-xl border border-amber-500/40 overflow-hidden shadow-lg">
              {localAvatarUrl ? (
                <img
                  src={sanitizeImageUrl(localAvatarUrl)}
                  alt={user?.name || 'Avatar'}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                />
              ) : user?.name ? (
                user.name.charAt(0).toUpperCase()
              ) : (
                'U'
              )}
            </div>

            <label className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg cursor-pointer transition-all border border-amber-300 flex items-center justify-center">
              {uploadingAvatar ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
              ) : (
                <Camera className="w-3.5 h-3.5" />
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarFileChange}
                disabled={uploadingAvatar}
                className="hidden"
              />
            </label>
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <h3 className="text-base font-extrabold text-white truncate">{user?.name}</h3>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono font-bold uppercase border border-amber-500/20">
                {user?.role}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${getKycBadgeClass(user?.kycStatus || 'not_submitted')}`}>
                {getKycBadgeText(user?.kycStatus || 'not_submitted')}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Avatar Error Banner */}
        {avatarError && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-3 rounded-xl flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{avatarError}</span>
          </div>
        )}

        {/* Profile Details List */}
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80">
            <div className="flex items-center gap-2 text-slate-400">
              <Hash className="w-4 h-4 text-amber-400" />
              <span>{t.investorId}</span>
            </div>
            <span className="font-mono font-bold text-white">INV-884291</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80">
            <div className="flex items-center gap-2 text-slate-400">
              <Award className="w-4 h-4 text-amber-400" />
              <span>{t.accountTier}</span>
            </div>
            <span className="font-bold text-amber-400">Tier 1 - VIP Freight</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80">
            <div className="flex items-center gap-2 text-slate-400">
              <Phone className="w-4 h-4 text-amber-400" />
              <span>{t.phoneLabel}</span>
            </div>
            <span className="font-mono text-slate-200">{user?.phone || '+964 770 000 0000'}</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80">
            <div className="flex items-center gap-2 text-slate-400">
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>{t.governorateLabel}</span>
            </div>
            <span className="font-semibold text-slate-200">{user?.governorate || 'Erbil / Baghdad'}</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80">
            <div className="flex items-center gap-2 text-slate-400">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>{t.memberSince}</span>
            </div>
            <span className="font-semibold text-slate-200">2024 / 01</span>
          </div>
        </div>

        {/* Dual Wallet Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Investment Wallet */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1">
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
              {currentLang === 'ar' ? 'محفظة الاستثمار' : 'Investment Wallet'}
            </span>
            <p className="text-lg font-black text-amber-400 font-mono">
              ${(user?.investmentBalance ?? user?.usdtBalance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-slate-400">
              {currentLang === 'ar' ? 'للخطط الاستثمارية والعوائد' : 'Dedicated for active plans'}
            </p>
          </div>

          {/* Main Wallet */}
          <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 space-y-1">
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block">
              {currentLang === 'ar' ? 'المحفظة الرئيسية (ادخار)' : 'Main Wallet (Savings)'}
            </span>
            <p className="text-lg font-black text-blue-400 font-mono">
              ${(user?.mainBalance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-slate-400">
              {currentLang === 'ar' ? 'لحفظ المبالغ بأمان' : 'For safe general storage'}
            </p>
          </div>
        </div>

        {/* Quick Actions (Transfer & Deposit) */}
        <div className="grid grid-cols-2 gap-2">
          {onOpenTransferModal && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onClose();
                onOpenTransferModal();
              }}
              className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs transition-all border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>{currentLang === 'ar' ? 'تحويل بين المحافظ' : 'Transfer Wallets'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onClose();
              onOpenDeposit();
            }}
            className="py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>{t.navDeposit}</span>
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {user?.kycStatus !== 'approved' && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onClose();
                onOpenKYC();
              }}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{t.menuKyc}</span>
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onClose();
            }}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all cursor-pointer"
          >
            {currentLang === 'ar' ? 'إغلاق' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};
