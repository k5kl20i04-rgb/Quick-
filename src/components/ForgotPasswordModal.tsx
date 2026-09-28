import React, { useState } from 'react';
import {
  X,
  KeyRound,
  Mail,
  Phone,
  CreditCard,
  Lock,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  EyeOff,
  Camera,
  FileCheck,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { Language } from '../types';
import { submitPasswordResetRequest } from '../lib/supabaseClient';

interface ForgotPasswordModalProps {
  currentLang: Language;
  onClose: () => void;
  onSuccessToast?: (msg: string) => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  currentLang,
  onClose,
  onSuccessToast,
}) => {
  const isRtl = currentLang === 'ar' || currentLang === 'ckb';

  // Form input states
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nationalIdNumber, setNationalIdNumber] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Document image states (base64 data URLs)
  const [idFrontImage, setIdFrontImage] = useState<string>('');
  const [idBackImage, setIdBackImage] = useState<string>('');
  const [residenceCardImage, setResidenceCardImage] = useState<string>('');
  const [selfieImage, setSelfieImage] = useState<string>('');

  // UI status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResponse, setSuccessResponse] = useState<string | null>(null);

  // Default sample images for quick testing
  const SAMPLE_FRONT =
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
  const SAMPLE_BACK =
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80';
  const SAMPLE_RESIDENCE =
    'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=600&q=80';
  const SAMPLE_SELFIE =
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80';

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 12 * 1024 * 1024) {
        setError(
          currentLang === 'ar'
            ? 'حجم الملف كبير جداً. يرجى اختيار صورة أقل من 12 ميغابايت'
            : 'File size too large. Please select an image under 12MB.'
        );
        return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const fillSampleDocuments = () => {
    if (!idFrontImage) setIdFrontImage(SAMPLE_FRONT);
    if (!idBackImage) setIdBackImage(SAMPLE_BACK);
    if (!residenceCardImage) setResidenceCardImage(SAMPLE_RESIDENCE);
    if (!selfieImage) setSelfieImage(SAMPLE_SELFIE);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Form Validations
    if (!email.trim()) {
      setError(
        currentLang === 'ar'
          ? 'يرجى إدخال البريد الإلكتروني المسجل'
          : 'Please enter your registered email'
      );
      return;
    }
    if (!phone.trim()) {
      setError(
        currentLang === 'ar'
          ? 'يرجى إدخال رقم الهاتف المسجل'
          : 'Please enter your phone number'
      );
      return;
    }
    if (!nationalIdNumber.trim()) {
      setError(
        currentLang === 'ar'
          ? 'يرجى إدخال رقم البطاقة الوطنية'
          : 'Please enter your National ID number'
      );
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError(
        currentLang === 'ar'
          ? 'كلمة المرور الجديدة يجب أن تحتوي على 6 أحرف على الأقل'
          : 'New password must be at least 6 characters'
      );
      return;
    }
    if (!idFrontImage || !idBackImage) {
      setError(
        currentLang === 'ar'
          ? 'يرجى إرفاق صوري البطاقة الوطنية (الوجه الأمامي والخلفي)'
          : 'Please upload National ID images (Front & Back)'
      );
      return;
    }
    if (!residenceCardImage) {
      setError(
        currentLang === 'ar'
          ? 'يرجى إرفاق صورة بطاقة السكن'
          : 'Please upload Residence Card image'
      );
      return;
    }
    if (!selfieImage) {
      setError(
        currentLang === 'ar'
          ? 'يرجى إرفاق الصورة الشخصية (Selfie)'
          : 'Please upload a selfie photo'
      );
      return;
    }

    try {
      setLoading(true);
      const res = await submitPasswordResetRequest({
        email: email.trim(),
        phone: phone.trim(),
        nationalIdNumber: nationalIdNumber.trim(),
        newPassword,
        idFrontImage,
        idBackImage,
        residenceCardImage,
        selfieImage,
      });

      if (!res.success) {
        setError(res.error || 'فشل إرسال الطلب');
      } else {
        const msg =
          res.message ||
          'Request sent successfully. Your password will be updated within 2 to 24 hours';
        setSuccessResponse(msg);
        if (onSuccessToast) onSuccessToast(msg);
      }
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ أثناء إرسال البيانات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl space-y-4 relative max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                {currentLang === 'ar'
                  ? 'طلب إعادة تعيين كلمة المرور'
                  : currentLang === 'ckb'
                  ? 'داواکاری گۆڕینی وشەی نهێنی'
                  : 'Forgot Password Request'}
              </h2>
              <p className="text-xs text-slate-400">
                {currentLang === 'ar'
                  ? 'استعادة الوصول عن طريق التحقق من الهوية والمستمسكات الرسمية'
                  : 'Restore access via official document verification'}
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

        {/* Success View */}
        {successResponse ? (
          <div className="space-y-6 text-center py-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/10 ring-8 ring-emerald-500/5">
              <CheckCircle2 className="w-8 h-8 animate-bounce" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                <Clock className="w-3.5 h-3.5" />
                <span>2 - 24 Hours Verification Window</span>
              </div>
              <h3 className="text-xl font-black text-white">
                {currentLang === 'ar'
                  ? 'تم إرسال طلبك بنجاح'
                  : 'Request Sent Successfully'}
              </h3>
              <p className="text-sm font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 p-3.5 rounded-2xl max-w-md mx-auto leading-relaxed">
                {successResponse}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 text-xs space-y-2 text-right rtl:text-right ltr:text-left">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>
                  {currentLang === 'ar'
                    ? 'تفاصيل الطلب المقدم:'
                    : 'Submitted Request Summary:'}
                </span>
              </div>
              <ul className="space-y-1.5 text-slate-400 text-[11px] font-mono leading-relaxed">
                <li>
                  • {currentLang === 'ar' ? 'البريد الإلكتروني:' : 'Email:'}{' '}
                  <strong className="text-white">{email}</strong>
                </li>
                <li>
                  • {currentLang === 'ar' ? 'رقم الهاتف:' : 'Phone:'}{' '}
                  <strong className="text-white">{phone}</strong>
                </li>
                <li>
                  • {currentLang === 'ar' ? 'رقم البطاقة الوطنية:' : 'ID #:'}{' '}
                  <strong className="text-white">{nationalIdNumber}</strong>
                </li>
                <li>
                  •{' '}
                  {currentLang === 'ar'
                    ? 'المستمسكات المرفقة:'
                    : 'Attached Docs:'}{' '}
                  <span className="text-emerald-400 font-bold">
                    4 {currentLang === 'ar' ? 'صور معتمدة' : 'Verified Photos'}
                  </span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition shadow-lg shadow-amber-500/20"
            >
              {currentLang === 'ar'
                ? 'العودة لصفحة تسجيل الدخول'
                : 'Return to Login Page'}
            </button>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Quick Demo Autofill Notice */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between text-xs text-amber-300 gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
                <span>
                  {currentLang === 'ar'
                    ? 'يمكنك اختيار الصور من جهازك أو استخدام النماذج الجاهزة:'
                    : 'Upload files from device or auto-fill demo documents:'}
                </span>
              </div>
              <button
                type="button"
                onClick={fillSampleDocuments}
                className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-black text-[11px] hover:bg-amber-400 transition shrink-0"
              >
                {currentLang === 'ar' ? 'تعبئة المستمسكات' : 'Auto-Fill Docs'}
              </button>
            </div>

            {/* Section 1: Basic Account Identity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Registered Email */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {currentLang === 'ar'
                    ? 'البريد الإلكتروني المسجل'
                    : 'Registered Email'}{' '}
                  <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute top-3 right-3.5 rtl:right-3.5 ltr:left-3.5 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="investor@example.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-9 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {currentLang === 'ar' ? 'رقم الهاتف' : 'Phone Number'}{' '}
                  <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute top-3 right-3.5 rtl:right-3.5 ltr:left-3.5 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+964 780 123 4567"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-9 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* National ID Number */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {currentLang === 'ar'
                    ? 'رقم البطاقة الوطنية'
                    : 'National ID Number'}{' '}
                  <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-slate-500 absolute top-3 right-3.5 rtl:right-3.5 ltr:left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={nationalIdNumber}
                    onChange={(e) => setNationalIdNumber(e.target.value)}
                    placeholder="19958472910"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-9 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {currentLang === 'ar'
                    ? 'كلمة المرور الجديدة'
                    : 'New Password'}{' '}
                  <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute top-3 right-3.5 rtl:right-3.5 ltr:left-3.5 pointer-events-none" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-9 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute top-3 left-3 rtl:left-3 ltr:right-3 text-slate-500 hover:text-slate-300"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Section 2: Required Documents & Photos */}
            <div className="pt-2 border-t border-slate-800">
              <h4 className="text-xs font-black text-amber-400 mb-2 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4" />
                <span>
                  {currentLang === 'ar'
                    ? 'المستمسكات والتحقق من الشخصية (مطلوبة للتدقيق):'
                    : 'Identity Verification Documents (Required):'}
                </span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* ID Front */}
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="block text-[11px] font-bold text-slate-300">
                    {currentLang === 'ar'
                      ? 'البطاقة الوطنية (الوجه الأمامي)'
                      : 'National ID (Front)'}{' '}
                    <span className="text-rose-400">*</span>
                  </span>
                  {idFrontImage ? (
                    <div className="relative rounded-xl overflow-hidden border border-emerald-500/40 group h-24 bg-slate-900">
                      <img
                        src={idFrontImage}
                        alt="ID Front"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                        <label className="p-1.5 rounded-lg bg-amber-500 text-slate-950 text-[10px] font-bold cursor-pointer hover:bg-amber-400">
                          <span>
                            {currentLang === 'ar' ? 'تغيير' : 'Change'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              handleFileUpload(e, setIdFrontImage)
                            }
                          />
                        </label>
                      </div>
                      <div className="absolute top-1.5 right-1.5 bg-emerald-500 text-slate-950 p-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 hover:border-amber-500/50 rounded-xl p-3 cursor-pointer transition bg-slate-900/50 group">
                      <Upload className="w-5 h-5 text-slate-500 group-hover:text-amber-400 transition mb-1" />
                      <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-200">
                        {currentLang === 'ar'
                          ? 'انقر لرفع وجه الهوية'
                          : 'Upload Front ID'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, setIdFrontImage)}
                      />
                    </label>
                  )}
                </div>

                {/* ID Back */}
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="block text-[11px] font-bold text-slate-300">
                    {currentLang === 'ar'
                      ? 'البطاقة الوطنية (الوجه الخلفي)'
                      : 'National ID (Back)'}{' '}
                    <span className="text-rose-400">*</span>
                  </span>
                  {idBackImage ? (
                    <div className="relative rounded-xl overflow-hidden border border-emerald-500/40 group h-24 bg-slate-900">
                      <img
                        src={idBackImage}
                        alt="ID Back"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                        <label className="p-1.5 rounded-lg bg-amber-500 text-slate-950 text-[10px] font-bold cursor-pointer hover:bg-amber-400">
                          <span>
                            {currentLang === 'ar' ? 'تغيير' : 'Change'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              handleFileUpload(e, setIdBackImage)
                            }
                          />
                        </label>
                      </div>
                      <div className="absolute top-1.5 right-1.5 bg-emerald-500 text-slate-950 p-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 hover:border-amber-500/50 rounded-xl p-3 cursor-pointer transition bg-slate-900/50 group">
                      <Upload className="w-5 h-5 text-slate-500 group-hover:text-amber-400 transition mb-1" />
                      <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-200">
                        {currentLang === 'ar'
                          ? 'انقر لرفع ظهر الهوية'
                          : 'Upload Back ID'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, setIdBackImage)}
                      />
                    </label>
                  )}
                </div>

                {/* Residence Card Image */}
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="block text-[11px] font-bold text-slate-300">
                    {currentLang === 'ar'
                      ? 'صورة بطاقة السكن'
                      : 'Residence Card'}{' '}
                    <span className="text-rose-400">*</span>
                  </span>
                  {residenceCardImage ? (
                    <div className="relative rounded-xl overflow-hidden border border-emerald-500/40 group h-24 bg-slate-900">
                      <img
                        src={residenceCardImage}
                        alt="Residence Card"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                        <label className="p-1.5 rounded-lg bg-amber-500 text-slate-950 text-[10px] font-bold cursor-pointer hover:bg-amber-400">
                          <span>
                            {currentLang === 'ar' ? 'تغيير' : 'Change'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              handleFileUpload(e, setResidenceCardImage)
                            }
                          />
                        </label>
                      </div>
                      <div className="absolute top-1.5 right-1.5 bg-emerald-500 text-slate-950 p-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 hover:border-amber-500/50 rounded-xl p-3 cursor-pointer transition bg-slate-900/50 group">
                      <Upload className="w-5 h-5 text-slate-500 group-hover:text-amber-400 transition mb-1" />
                      <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-200">
                        {currentLang === 'ar'
                          ? 'رفع بطاقة السكن'
                          : 'Upload Residence Card'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleFileUpload(e, setResidenceCardImage)
                        }
                      />
                    </label>
                  )}
                </div>

                {/* Selfie Photo */}
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="block text-[11px] font-bold text-slate-300">
                    {currentLang === 'ar'
                      ? 'الصورة الشخصية (Selfie)'
                      : 'Selfie Photo'}{' '}
                    <span className="text-rose-400">*</span>
                  </span>
                  {selfieImage ? (
                    <div className="relative rounded-xl overflow-hidden border border-emerald-500/40 group h-24 bg-slate-900">
                      <img
                        src={selfieImage}
                        alt="Selfie"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                        <label className="p-1.5 rounded-lg bg-amber-500 text-slate-950 text-[10px] font-bold cursor-pointer hover:bg-amber-400">
                          <span>
                            {currentLang === 'ar' ? 'تغيير' : 'Change'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              handleFileUpload(e, setSelfieImage)
                            }
                          />
                        </label>
                      </div>
                      <div className="absolute top-1.5 right-1.5 bg-emerald-500 text-slate-950 p-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 hover:border-amber-500/50 rounded-xl p-3 cursor-pointer transition bg-slate-900/50 group">
                      <Camera className="w-5 h-5 text-slate-500 group-hover:text-amber-400 transition mb-1" />
                      <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-200">
                        {currentLang === 'ar'
                          ? 'التقاط / رفع سيلفي'
                          : 'Upload Selfie'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, setSelfieImage)}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>
                      {currentLang === 'ar'
                        ? 'إرسال طلب تغيير كلمة المرور'
                        : 'Submit Password Reset Request'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
