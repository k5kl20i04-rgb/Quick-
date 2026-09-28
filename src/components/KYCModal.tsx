import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Upload,
  CheckCircle2,
  Clock,
  XCircle,
  FileCheck,
  UserCheck,
  CreditCard,
  Home,
  AlertCircle,
} from 'lucide-react';
import { KYCSubmission, KYCStatus, Language, User } from '../types';
import { translations } from '../i18n/translations';

interface KYCModalProps {
  currentLang: Language;
  user: User;
  kycData: KYCSubmission;
  onClose: () => void;
  onSubmitKYC: (payload: {
    fullName: string;
    idNumber: string;
    nationalIdFront: string;
    nationalIdBack: string;
    housingCard: string;
  }) => Promise<void>;
}

export const KYCModal: React.FC<KYCModalProps> = ({
  currentLang,
  user,
  kycData,
  onClose,
  onSubmitKYC,
}) => {
  const t = translations[currentLang] || translations.ar;

  const [fullName, setFullName] = useState<string>(kycData?.fullName || user?.name || '');
  const [idNumber, setIdNumber] = useState<string>(kycData?.idNumber || '199284750192');

  // Pre-set document image options for user selection/preview
  const sampleNationalFront = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
  const sampleNationalBack = 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80';
  const sampleHousingCard = 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=600&q=80';

  const [idFront, setIdFront] = useState<string>(kycData?.nationalIdFront || sampleNationalFront);
  const [idBack, setIdBack] = useState<string>(kycData?.nationalIdBack || sampleNationalBack);
  const [housingCard, setHousingCard] = useState<string>(kycData?.housingCard || sampleHousingCard);

  const [loading, setLoading] = useState<boolean>(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await onSubmitKYC({
        fullName,
        idNumber,
        nationalIdFront: idFront,
        nationalIdBack: idBack,
        housingCard,
      });
      setSubmittedSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl max-w-2xl w-full p-4 sm:p-6 lg:p-8 shadow-2xl space-y-4 sm:space-y-6 relative max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 sm:pb-4 gap-2">
          <div className="flex items-center space-x-2.5 sm:space-x-3 rtl:space-x-reverse min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-lg font-black text-white truncate">{t.kycTitle}</h2>
              <p className="text-[10px] sm:text-xs text-slate-400 truncate">{t.kycDescription}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onClose();
            }}
            className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Current Status Header Banner */}
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border bg-slate-950 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5 sm:space-x-3 rtl:space-x-reverse">
            {user?.kycStatus === 'approved' ? (
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 shrink-0" />
            ) : user?.kycStatus === 'pending' ? (
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 shrink-0" />
            ) : user?.kycStatus === 'rejected' ? (
              <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-rose-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400 shrink-0" />
            )}
            <div>
              <p className="text-[10px] sm:text-xs font-bold text-slate-200">{t.kycStatus}</p>
              <p
                className={`text-xs sm:text-sm font-black ${
                  user?.kycStatus === 'approved'
                    ? 'text-emerald-400'
                    : user?.kycStatus === 'pending'
                    ? 'text-amber-400'
                    : user?.kycStatus === 'rejected'
                    ? 'text-rose-400'
                    : 'text-slate-400'
                }`}
              >
                {user?.kycStatus === 'approved'
                  ? t.kycVerified
                  : user?.kycStatus === 'pending'
                  ? t.kycPending
                  : user?.kycStatus === 'rejected'
                  ? t.kycRejected
                  : t.kycNotSubmitted}
              </p>
            </div>
          </div>

          {kycData?.rejectionReason && user?.kycStatus === 'rejected' && (
            <p className="text-[10px] sm:text-xs text-rose-300 max-w-xs">{kycData.rejectionReason}</p>
          )}
        </div>

        {/* KYC Document Upload Form */}
        {submittedSuccess || user?.kycStatus === 'approved' ? (
          <div className="text-center py-6 sm:py-8 space-y-3 sm:space-y-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-400 mx-auto" />
            <h3 className="text-base sm:text-lg font-black text-white">
              {(t as any).kycSubmittedTitle || (currentLang === 'ar' ? 'تم تقديم وتوثيق الهوية بنجاح' : 'KYC Verified Successfully')}
            </h3>
            <p className="text-[11px] sm:text-xs text-emerald-200 max-w-md mx-auto leading-relaxed">
              {(t as any).kycSubmittedDesc || (currentLang === 'ar' ? 'حسابك الاستثماري موثق وجاهز لإجراء الاستثمارات والسحوبات بكل أمان.' : 'Your investment account is verified and ready for secure transactions.')}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onClose();
              }}
              className="px-5 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        ) : (
          <form noValidate onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            
            {/* User Info Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1 sm:space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  {t.fullNameLabel}
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg sm:rounded-xl px-3 sm:px-3.5 py-2 sm:py-2.5 text-xs text-white outline-none"
                />
              </div>

              <div className="space-y-1 sm:space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  {t.idNumberLabel}
                </label>
                <input
                  type="text"
                  required
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg sm:rounded-xl px-3 sm:px-3.5 py-2 sm:py-2.5 text-xs text-white font-mono outline-none"
                />
              </div>
            </div>

            {/* Document Upload Grids */}
            <div className="space-y-3 sm:space-y-4">
              <h4 className="text-[11px] sm:text-xs font-black text-amber-400 uppercase tracking-wider">
                Upload Required Identification Documents
              </h4>

              {/* Document 1: National ID Front */}
              <div className="bg-slate-950 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center space-x-2 rtl:space-x-reverse text-xs font-bold text-slate-200">
                  <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                  <span>{t.nationalIdFront}</span>
                </div>
                <div className="flex items-center gap-2.5 sm:gap-4">
                  <img
                    src={idFront}
                    alt="National ID Front"
                    className="w-16 h-12 sm:w-24 sm:h-16 object-cover rounded-lg sm:rounded-xl border border-slate-700 shrink-0"
                  />
                  <div className="flex-1 min-w-0 text-xs text-slate-400 space-y-1">
                    <p className="text-[10px] sm:text-xs truncate">{t.uploadDragDrop}</p>
                    <input
                      type="text"
                      value={idFront}
                      onChange={(e) => setIdFront(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-[10px] text-slate-300 rounded-lg px-2 py-1 font-mono outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Document 2: National ID Back */}
              <div className="bg-slate-950 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center space-x-2 rtl:space-x-reverse text-xs font-bold text-slate-200">
                  <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                  <span>{t.nationalIdBack}</span>
                </div>
                <div className="flex items-center gap-2.5 sm:gap-4">
                  <img
                    src={idBack}
                    alt="National ID Back"
                    className="w-16 h-12 sm:w-24 sm:h-16 object-cover rounded-lg sm:rounded-xl border border-slate-700 shrink-0"
                  />
                  <div className="flex-1 min-w-0 text-xs text-slate-400 space-y-1">
                    <p className="text-[10px] sm:text-xs truncate">{t.uploadDragDrop}</p>
                    <input
                      type="text"
                      value={idBack}
                      onChange={(e) => setIdBack(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-[10px] text-slate-300 rounded-lg px-2 py-1 font-mono outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Document 3: Housing Card (بطاقة السكن) */}
              <div className="bg-slate-950 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center space-x-2 rtl:space-x-reverse text-xs font-bold text-slate-200">
                  <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                  <span>{t.housingCardLabel}</span>
                </div>
                <div className="flex items-center gap-2.5 sm:gap-4">
                  <img
                    src={housingCard}
                    alt="Housing Card"
                    className="w-16 h-12 sm:w-24 sm:h-16 object-cover rounded-lg sm:rounded-xl border border-slate-700 shrink-0"
                  />
                  <div className="flex-1 min-w-0 text-xs text-slate-400 space-y-1">
                    <p className="text-[10px] sm:text-xs truncate">{t.uploadDragDrop}</p>
                    <input
                      type="text"
                      value={housingCard}
                      onChange={(e) => setHousingCard(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-[10px] text-slate-300 rounded-lg px-2 py-1 font-mono outline-none"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 rtl:space-x-reverse cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{t.submitKycBtn}</span>
            </button>

          </form>
        )}

      </div>
    </div>
  );
};
