import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Truck,
  Shield,
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  Globe,
  Eye,
  EyeOff,
  Building2,
  ChevronDown,
  Send,
  RefreshCw,
  Gift,
  AlertTriangle,
} from 'lucide-react';
import { Language, User as UserType, AdminSettings } from '../types';
import { translations } from '../i18n/translations';
import { countryList, getActiveCountries, CountryConfig } from '../data/countryConfig';
import { ToastContainer, ToastMessage } from './Toast';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import {
  signUpWithSupabase,
  signInWithSupabase,
  supabase,
  getSupabaseProfile,
  resendConfirmationEmail,
  isSupabaseClientConfigured,
} from '../lib/supabaseClient';
import {
  signUpSchema,
  loginSchema,
  formatPhoneNumber,
} from '../lib/validation';

interface AuthPageProps {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  onAuthSuccess: (user: UserType) => void;
  initialAdminMode?: boolean;
  adminSettings?: AdminSettings | null;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  lang,
  onLanguageChange,
  onAuthSuccess,
  initialAdminMode = false,
  adminSettings,
}) => {
  const t = translations[lang] || translations.ar;
  const isRtl = lang === 'ar' || lang === 'ckb';

  const [isAdminPortal, setIsAdminPortal] = useState<boolean>(
    initialAdminMode ||
      window.location.hash === '#admin/login' ||
      window.location.hash === '#admin' ||
      window.location.pathname.startsWith('/admin')
  );

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot password modal state
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  // Email confirmation sent state
  const [emailConfirmationSent, setEmailConfirmationSent] = useState<{
    email: string;
    name: string;
  } | null>(null);
  const [resendingEmail, setResendingEmail] = useState(false);

  // Active countries from Country Config Store
  const activeCountries = useMemo(() => getActiveCountries(), []);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('');

  const currentCountry = useMemo(() => {
    if (!selectedCountryCode) return null;
    return activeCountries.find((c) => c.code === selectedCountryCode) || null;
  }, [activeCountries, selectedCountryCode]);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedGovernorate, setSelectedGovernorate] = useState<string>('');
  const [customGovernorate, setCustomGovernorate] = useState<string>('');
  const [referralCodeInput, setReferralCodeInput] = useState<string>('');
  const [agreedToLockup, setAgreedToLockup] = useState(false);

  // Auto-detect referral code from URL search params
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const urlCode = searchParams.get('ref') || searchParams.get('code') || searchParams.get('referral') || searchParams.get('referralCode');
      if (urlCode) {
        setReferralCodeInput(urlCode.toUpperCase().trim());
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, []);

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Admin login states
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Dynamically compute governorates so every country always has "Other / أخرى" at the end
  const governorateOptions = useMemo(() => {
    const list = currentCountry?.governorates || [];
    const hasOther = list.some(
      (g) => g.id === 'other_gov' || g.id === 'other' || (g.name?.ar && g.name.ar.includes('أخرى'))
    );
    if (hasOther) return list;
    return [
      ...list,
      {
        id: 'other_gov',
        name: {
          ar: 'أخرى (Other)',
          en: 'Other',
          ckb: 'ئەوانی تر (أخرى)',
        },
      },
    ];
  }, [currentCountry]);

  const isOtherGovernorate = useMemo(() => {
    if (!selectedGovernorate) return false;
    return (
      selectedGovernorate === 'other_gov' ||
      selectedGovernorate.includes('أخرى') ||
      selectedGovernorate.toLowerCase().includes('other')
    );
  }, [selectedGovernorate]);

  // Reset governorate selection when country changes
  useEffect(() => {
    setSelectedGovernorate('');
    setCustomGovernorate('');
  }, [selectedCountryCode]);

  // Handle Hash Changes for hidden route #admin/login
  useEffect(() => {
    const handleHashChange = () => {
      if (
        window.location.hash === '#admin/login' ||
        window.location.hash === '#admin' ||
        window.location.pathname.startsWith('/admin')
      ) {
        setIsAdminPortal(true);
        setError(null);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const addToast = (type: 'success' | 'error' | 'info', message: string, title?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts((prev) => [...prev, { id, type, message, title, duration: 4000 }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Reset fields on mode switch cleanly
  const handleModeSwitch = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    setError(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
    if (newMode === 'login') {
      setConfirmPassword('');
    }
  };

  const handleLogin = async (loginEmail?: string, loginPassword?: string) => {
    const inputEmail = (loginEmail || email).trim();
    const inputPassword = loginPassword || password;

    // Validate login input with Zod
    const validationResult = loginSchema.safeParse({
      email: inputEmail,
      password: inputPassword,
    });

    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues[0]?.message || 'يرجى إدخال البيانات بصورة صحيحة';
      setError(firstIssue);
      addToast('error', firstIssue);
      return;
    }

    const { email: cleanEmail, password: p } = validationResult.data;

    setLoading(true);
    setError(null);

    try {
      // 1. Try server authentication first
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password: p }),
        });
        if (res.ok) {
          const localData = await res.json();
          if (localData.user) {
            addToast('success', t.loginSuccessToast || 'تم تسجيل الدخول بنجاح! مرحباً بك.');
            await onAuthSuccess(localData.user);
            return;
          }
        }
      } catch (localErr) {
        console.warn('⚠️ Server auth endpoint note:', localErr);
      }

      // 2. If server login didn't match, attempt Supabase Auth if configured
      if (isSupabaseClientConfigured()) {
        const { data, error: sbErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: p,
        });

        if (!sbErr && data?.user) {
          console.log('✅ [Supabase Auth] Login successful for user:', data.user.id);
          let userObj: UserType | null = await getSupabaseProfile(data.user.id).catch(() => null);

          if (!userObj) {
            const meta = data.user.user_metadata || {};
            userObj = {
              id: data.user.id,
              email: data.user.email || cleanEmail,
              name: meta.name || meta.full_name || cleanEmail.split('@')[0],
              role: meta.role || (cleanEmail.toLowerCase().includes('admin') ? 'admin' : 'investor'),
              usdtBalance: 0,
              kycStatus: 'not_submitted',
              accountStatus: 'active',
              totalInvested: 0,
              totalRoiEarned: 0,
              joinedDate: new Date().toISOString().split('T')[0],
            };
          }

          addToast('success', t.loginSuccessToast || 'تم تسجيل الدخول بنجاح! مرحباً بك.');
          await onAuthSuccess(userObj);
          return;
        }
      }

      // 3. Fallback error message if credentials do not match
      const userFacingErr = lang === 'ar' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Invalid email or password';
      setError(userFacingErr);
      addToast('error', userFacingErr);
    } catch (err: any) {
      const errorMsg = lang === 'ar' ? 'حدث خطأ أثناء تسجيل الدخول، يرجى المحاولة لاحقاً' : (err?.message || 'Login failed');
      setError(errorMsg);
      addToast('error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (adminSettings?.registrationEnabled === false) {
      const disabledMsg = lang === 'ar'
        ? 'عذراً، تم إيقاف التسجيلات الجديدة مؤقتاً بواسطة إدارة النظام. يمكنك تسجيل الدخول إذا كان لديك حساب سابق.'
        : 'New user registration is currently disabled by administrator.';
      setError(disabledMsg);
      addToast('error', disabledMsg);
      return;
    }

    // Validate Sign-Up Form with Zod Schema
    const validationResult = signUpSchema.safeParse({
      fullName,
      email,
      phoneNumber,
      password,
      confirmPassword,
      countryCode: selectedCountryCode,
      selectedGovernorate,
      agreedToLockup,
    });

    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues[0]?.message || 'يرجى التأكد من ملء جميع الحقول بصورة صحيحة';
      setError(firstIssue);
      addToast('error', firstIssue);
      return;
    }

    const {
      fullName: cleanName,
      email: cleanEmail,
      phoneNumber: rawPhone,
      password: validPassword,
      selectedGovernorate: govChoice,
    } = validationResult.data;

    setLoading(true);
    setError(null);

    const isOtherSelected =
      selectedGovernorate === 'other_gov' ||
      selectedGovernorate.includes('أخرى') ||
      selectedGovernorate.toLowerCase().includes('other');

    const governorateName = isOtherSelected
      ? (customGovernorate.trim() || 'أخرى (Other)')
      : govChoice;

    setLoading(true);
    setError(null);

    const dialCode = currentCountry ? currentCountry.dialCode : '';
    const fullPhoneFormatted = formatPhoneNumber(dialCode, rawPhone);

    try {
      let sbUser: UserType | null = null;
      let sbError: string | null = null;

      if (isSupabaseClientConfigured()) {
        const sbResult = await signUpWithSupabase({
          email: cleanEmail,
          password: validPassword,
          name: cleanName,
          phone: fullPhoneFormatted,
          governorate: governorateName,
          role: 'investor',
        });

        if (sbResult.error) {
          if (
            sbResult.error.toLowerCase().includes('already registered') ||
            sbResult.error.toLowerCase().includes('already exists')
          ) {
            throw new Error(lang === 'ar' ? 'البريد الإلكتروني مسجل بالفعل' : 'Email is already registered');
          }
          console.warn('⚠️ Supabase Auth notice:', sbResult.error);
          sbError = sbResult.error;
        } else {
          sbUser = sbResult.user;
        }

        // Establish client-side Supabase auth session instantly
        try {
          await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: validPassword,
          });
        } catch (signInErr) {
          console.warn('⚠️ Supabase instant sign-in notice:', signInErr);
        }
      }

      // Sync user profile with backend API (sets session on server)
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: sbUser?.id, // Real Supabase user ID if created
          name: cleanName,
          email: cleanEmail,
          password: validPassword,
          phone: fullPhoneFormatted,
          governorate: governorateName,
          countryCode: currentCountry.code,
          referralCodeInput: referralCodeInput.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || sbError || 'فشل إنشاء الحساب');
      }

      const finalUser: UserType = sbUser || data.user;

      // Direct Access: Immediately establish session and open dashboard
      addToast('success', t.signupSuccessToast || 'تم إنشاء حساب المستثمر بنجاح! مرحباً بك.');
      try {
        await onAuthSuccess(finalUser);
      } catch (authErr) {
        console.error('Error handling signup success:', authErr);
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'حدث خطأ أثناء إنشاء الحساب';
      setError(errorMsg);
      addToast('error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!emailConfirmationSent?.email) return;
    setResendingEmail(true);
    try {
      const res = await resendConfirmationEmail(emailConfirmationSent.email);
      if (res.success) {
        addToast(
          'success',
          lang === 'ar'
            ? 'تم إعادة إرسال رابط التفعيل بنجاح! يرجى مراجعة البريد الإلكتروني.'
            : 'Confirmation link re-sent! Please check your inbox.',
          lang === 'ar' ? 'تم الإرسال' : 'Sent'
        );
      } else {
        addToast('error', res.error || 'فشل إرسال رابط التأكيد');
      }
    } catch (err: any) {
      addToast('error', err?.message || 'خطأ أثناء إعادة الإرسال');
    } finally {
      setResendingEmail(false);
    }
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans relative overflow-x-hidden"
    >
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} isRtl={isRtl} />

      {/* Decorative Atmosphere Backdrops */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.12),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b10_1px,transparent_1px),linear-gradient(to_bottom,#1e293b10_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none opacity-60" />

      {/* Header Bar with Language Selector */}
      <header className="relative z-10 flex items-center justify-between max-w-5xl mx-auto w-full mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/40 shrink-0">
            <Truck className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black tracking-wide text-white">
                {t.brandName}
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                Logistics & Fleets
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 hidden sm:block mt-0.5">
              {t.brandSubtitle}
            </p>
          </div>
        </div>

        {/* Language Switcher */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-2xl border border-slate-800 backdrop-blur-md shadow-sm">
          <Globe className="w-3.5 h-3.5 text-amber-400 mx-1.5 shrink-0" />
          {(['ar', 'en', 'ckb'] as Language[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => onLanguageChange(l)}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-bold transition-all ${
                lang === l
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {l === 'ar' ? 'العربية' : l === 'en' ? 'English' : 'كوردى'}
            </button>
          ))}
        </div>
      </header>

      {/* Main Form Center Box */}
      <main className="relative z-10 max-w-lg w-full mx-auto my-auto py-2">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-5 sm:p-8 shadow-2xl backdrop-blur-2xl ring-1 ring-white/5"
        >
          {isAdminPortal ? (
            /* ====================================================== */
            /* HIDDEN ADMIN LOGIN CONSOLE (/admin or #admin/login)    */
            /* ====================================================== */
            <div className="space-y-5">
              <div className="text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold mb-2">
                  <Lock className="w-3.5 h-3.5" />
                  <span>بوابة الإدارة المشفرة / Operator Console</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  تسجيل دخول الإدارة (Admin Login)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  أدخل بيانات اعتماد مدير النظام للوصول إلى لوحة العمليات
                </p>
              </div>

              {/* Error Banner */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2.5"
                >
                  <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              <form
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLogin(adminEmail, adminPassword);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    البريد الإلكتروني / اسم المستخدم
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute top-3.5 right-3.5 rtl:right-3.5 ltr:left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@aseel.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-10 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-rose-500 transition-all font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    كلمة المرور السرية
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute top-3.5 right-3.5 rtl:right-3.5 ltr:left-3.5 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-10 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-rose-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute top-3.5 left-3.5 rtl:left-3.5 ltr:right-3.5 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>دخول لوحة التحكم (Admin Access)</span>
                      <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                    </>
                  )}
                </button>
              </form>

              {/* Return to Investor Portal Link */}
              <div className="pt-3 border-t border-slate-800/80 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdminPortal(false);
                    setError(null);
                    window.location.hash = '';
                  }}
                  className="text-xs text-slate-400 hover:text-amber-400 transition"
                >
                  ← العودة لبوابة دخول المستثمرين
                </button>
              </div>
            </div>
          ) : emailConfirmationSent ? (
            /* ====================================================== */
            /* EMAIL CONFIRMATION SENT VIEW                           */
            /* ====================================================== */
            <div className="space-y-6 text-center py-2">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-xl shadow-amber-500/10 ring-8 ring-amber-500/5">
                <Mail className="w-8 h-8 animate-pulse" />
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
                  <Send className="w-3.5 h-3.5" />
                  <span>Supabase Auth — Email Verification</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  {lang === 'ar' ? 'تأكيد البريد الإلكتروني' : lang === 'ckb' ? 'پشتڕاستکردنەوەی ئیمەیڵ' : 'Verify Your Email Address'}
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
                  {lang === 'ar' ? (
                    <>
                      أهلاً بك <strong className="text-white">{emailConfirmationSent.name}</strong>! لقد أرسلنا رابط تفعيل الحساب فوراً إلى بريدك الإلكتروني:
                    </>
                  ) : (
                    <>
                      Welcome <strong className="text-white">{emailConfirmationSent.name}</strong>! We sent a confirmation link to:
                    </>
                  )}
                </p>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl font-mono text-sm text-amber-400 font-bold inline-block break-all max-w-full">
                  {emailConfirmationSent.email}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-300 text-xs space-y-2 text-right rtl:text-right ltr:text-left">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{lang === 'ar' ? 'تعليمات التفعيل:' : 'Instructions:'}</span>
                </div>
                <ul className="list-disc list-inside space-y-1.5 text-slate-400 text-[11px] leading-relaxed">
                  <li>{lang === 'ar' ? 'افتح البريد الإلكتروني المذكور أعلاه وانقر على زر "Confirm Email".' : 'Open your inbox and click "Confirm Email".'}</li>
                  <li>{lang === 'ar' ? 'يرجى تفقد مجلد البريد غير المرغوب فيه (Spam/Junk) إذا لم تجد الرسالة.' : 'Check your spam or junk folder if you don\'t see it in your inbox.'}</li>
                  <li>{lang === 'ar' ? 'بعد الضغط على الرابط، سيتم تفعيل حسابك وتسجيل الدخول تلقائياً.' : 'After clicking the link, your account will be activated automatically.'}</li>
                </ul>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleResendEmail}
                  disabled={resendingEmail}
                  className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {resendingEmail ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                      <span>{lang === 'ar' ? 'إعادة إرسال رابط التفعيل' : 'Resend Verification Email'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEmailConfirmationSent(null);
                    setMode('login');
                  }}
                  className="text-xs text-slate-400 hover:text-amber-400 transition underline font-medium"
                >
                  ← {lang === 'ar' ? 'العودة لصفحة تسجيل الدخول' : 'Return to Login Page'}
                </button>
              </div>
            </div>
          ) : (
            /* ====================================================== */
            /* STANDARD PUBLIC INVESTOR AUTHENTICATION                */
            /* ====================================================== */
            <div className="space-y-5">
              {/* Header Title & Subtitle */}
              <div className="text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold mb-2">
                  <Shield className="w-3.5 h-3.5" />
                  <span>{t.authTitle}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  {mode === 'login' ? t.loginTab : t.signupTab}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {mode === 'login' ? t.loginSubtitle : t.signupSubtitle}
                </p>
              </div>

              {/* Tab Mode Toggle */}
              <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => handleModeSwitch('login')}
                  className={`py-2.5 rounded-xl text-xs font-black transition-all ${
                    mode === 'login'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.loginTab}
                </button>
                <button
                  type="button"
                  onClick={() => handleModeSwitch('signup')}
                  className={`py-2.5 rounded-xl text-xs font-black transition-all ${
                    mode === 'signup'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.signupTab}
                </button>
              </div>

              {/* Error Banner */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2.5"
                >
                  <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              {/* ==================================================== */}
              {/* LOGIN FORM                                           */}
              {/* ==================================================== */}
              {mode === 'login' && (
                <form
                  noValidate
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleLogin();
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      {t.emailLabel}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute top-3.5 right-3.5 rtl:right-3.5 ltr:left-3.5 pointer-events-none" />
                      <input
                        type="text"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="investor@aseel.iq"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-10 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      {t.passwordLabel}
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute top-3.5 right-3.5 rtl:right-3.5 ltr:left-3.5 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-10 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute top-3.5 left-3.5 rtl:left-3.5 ltr:right-3.5 text-slate-500 hover:text-slate-300"
                        title={showPassword ? t.hidePassword : t.showPassword}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Forgot Password Link */}
                    <div className="flex items-center justify-end mt-1.5">
                      <button
                        type="button"
                        onClick={() => setShowForgotPasswordModal(true)}
                        className="text-xs text-amber-400 hover:text-amber-300 transition font-medium hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                        <span>
                          {lang === 'ar'
                            ? 'نسيت كلمة المرور؟'
                            : lang === 'ckb'
                            ? 'وشەی نهێنیت لەبیرچووە؟'
                            : 'Forgot Password?'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2 cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>{t.loginBtn}</span>
                        <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* ==================================================== */}
              {/* SIGNUP FORM WITH DYNAMIC COUNTRY & PHONE INTEGRATION */}
              {/* ==================================================== */}
              {mode === 'signup' && (
                <form noValidate onSubmit={handleSignup} className="space-y-3.5">
                  {adminSettings?.registrationEnabled === false && (
                    <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-start gap-3 text-rose-300 text-xs leading-relaxed">
                      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-rose-200 text-sm mb-1">
                          {lang === 'ar' ? 'تسجيل الحسابات الجديدة معطل مؤقتاً' : 'New Registration Suspended'}
                        </p>
                        <p>
                          {lang === 'ar'
                            ? 'تم إيقاف إنشاء حسابات جديدة بقرار من إدارة المنصة. يمكنك الانتقال إلى تبويب تسجيل الدخول لاستخدام حسابك الحالي.'
                            : 'New account registration is currently disabled by administrator. Existing users can log in.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      {t.fullNameLabelAuth}
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute top-3 right-3.5 rtl:right-3.5 ltr:left-3.5 pointer-events-none" />
                      <input
                        type="text"
                        autoComplete="name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={lang === 'ar' ? 'أحمد مصطفى العبيدي' : 'Ahmed M. Al-Obeidi'}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-10 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      {t.emailLabel}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute top-3 right-3.5 rtl:right-3.5 ltr:left-3.5 pointer-events-none" />
                      <input
                        type="text"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="investor@example.com"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-10 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* Dynamic Country Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      {t.countryLabel}
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-500 absolute top-3 right-3.5 rtl:right-3.5 ltr:left-3.5 pointer-events-none" />
                      <select
                        value={selectedCountryCode}
                        onChange={(e) => {
                          setSelectedCountryCode(e.target.value);
                          setSelectedGovernorate('');
                          setCustomGovernorate('');
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-10 text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition-all appearance-none cursor-pointer"
                      >
                        <option value="" disabled className="bg-slate-900 text-slate-400">
                          {lang === 'ar' ? '-- اختر الدولة --' : lang === 'ckb' ? '-- وڵات هەڵبژێرە --' : '-- Select Country --'}
                        </option>
                        {activeCountries.map((c) => (
                          <option key={c.code} value={c.code} className="bg-slate-900 text-slate-100 py-1">
                            {c.flag} {c.name[lang] || c.name.ar} ({c.dialCode})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-500 absolute top-3 left-3.5 rtl:left-3.5 ltr:right-3.5 pointer-events-none" />
                    </div>
                  </div>

                  {/* Phone Number & Dynamic Governorate Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Phone Number with integrated Dial Code */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        {t.phoneLabel}
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute right-3 rtl:right-3 ltr:left-3 text-xs font-mono font-bold text-amber-400 flex items-center gap-1 pointer-events-none">
                          <span>{currentCountry ? currentCountry.flag : '🌐'}</span>
                          <span>{currentCountry ? currentCountry.dialCode : '+'}</span>
                        </span>
                        <input
                          type="text"
                          autoComplete="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder={currentCountry ? currentCountry.placeholder : (lang === 'ar' ? 'رقم الهاتف' : 'Phone Number')}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pr-20 pl-3 rtl:pr-20 rtl:pl-3 ltr:pl-20 ltr:pr-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-all font-mono"
                        />
                      </div>
                    </div>

                    {/* Dynamic Governorate based on Selected Country */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        {t.governorateLabel}
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-slate-500 absolute top-3 right-3.5 rtl:right-3.5 ltr:left-3.5 pointer-events-none" />
                        <select
                          value={selectedGovernorate}
                          onChange={(e) => setSelectedGovernorate(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-10 text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition-all appearance-none cursor-pointer"
                        >
                          <option value="" disabled className="bg-slate-900 text-slate-400">
                            {lang === 'ar' ? '-- اختر المحافظة / الولاية --' : lang === 'ckb' ? '-- پارێزگا هەڵبژێرە --' : '-- Select Governorate --'}
                          </option>
                          {governorateOptions.map((g) => {
                            const govName = g.name[lang] || g.name.ar;
                            return (
                              <option key={g.id} value={govName} className="bg-slate-900 text-slate-100">
                                {govName}
                              </option>
                            );
                          })}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-500 absolute top-3 left-3.5 rtl:left-3.5 ltr:right-3.5 pointer-events-none" />
                      </div>

                      {/* Custom Governorate Input when "Other" / "أخرى" is selected */}
                      {isOtherGovernorate && (
                        <div className="mt-2 relative">
                          <input
                            type="text"
                            value={customGovernorate}
                            onChange={(e) => setCustomGovernorate(e.target.value)}
                            placeholder={
                              lang === 'ar'
                                ? 'أدخل اسم المحافظة / المدينة المحددة (اختياري)...'
                                : lang === 'ckb'
                                ? 'ناوی پارێزگا یان شارەکەت بنووسە (ئارەزوومەندانە)...'
                                : 'Enter your specific governorate or city (optional)...'
                            }
                            className="w-full bg-slate-950/90 border border-amber-500/40 rounded-xl py-2 px-3 text-xs text-amber-300 focus:outline-none focus:border-amber-400 transition-all placeholder:text-slate-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Passwords Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        {t.passwordLabel}
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-500 absolute top-3 right-3.5 rtl:right-3.5 ltr:left-3.5 pointer-events-none" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-10 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute top-3 left-3.5 rtl:left-3.5 ltr:right-3.5 text-slate-500 hover:text-slate-300"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        {t.confirmPasswordLabel}
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-slate-500 absolute top-3 right-3.5 rtl:right-3.5 ltr:left-3.5 pointer-events-none" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-10 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute top-3 left-3.5 rtl:left-3.5 ltr:right-3.5 text-slate-500 hover:text-slate-300"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Referral Code (Custom Code-Based Tracking) */}
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
                    <label className="block text-xs font-bold text-amber-300 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Gift className="w-3.5 h-3.5 text-amber-400" />
                        {lang === 'ar'
                          ? 'كود الدعوة (اختياري)'
                          : lang === 'ckb'
                          ? 'کۆدی ڕاسپاردن (ئارەزوومەندانە)'
                          : 'Referral Code (Optional)'}
                      </span>
                      <span className="text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        🎁 {lang === 'ar' ? 'بونص ترحيبي للمستثمرين' : 'Investor Bonus'}
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={referralCodeInput}
                        onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                        placeholder={
                          lang === 'ar'
                            ? 'أدخل كود صديقك مثل: ASEEL-7A9B'
                            : lang === 'ckb'
                            ? 'کۆدی هاوڕێکەت بنووسە وەکو: ASEEL-7A9B'
                            : 'Enter referral code e.g. ASEEL-7A9B'
                        }
                        className="w-full bg-slate-950 border border-amber-500/30 rounded-lg py-2 px-3 text-sm text-amber-200 placeholder-slate-600 focus:outline-none focus:border-amber-400 font-mono tracking-wider transition-all"
                      />
                    </div>
                  </div>

                  {/* 5-Month Lockup Policy Agreement Checkbox */}
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/90 mt-1">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreedToLockup}
                        onChange={(e) => setAgreedToLockup(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900 cursor-pointer"
                      />
                      <span className="text-[11px] text-slate-300 leading-relaxed">
                        {lang === 'ar' ? (
                          <>
                            أقر بالموافقة على <strong className="text-amber-400">سياسة حجز رأس المال (5 أشهر)</strong> المنظمة لعقود تشغيل الشاحنات والأساطيل وعدم طلب السحب قبل انتهاء المدة.
                          </>
                        ) : lang === 'ckb' ? (
                          <>
                            ڕازیم بە <strong className="text-amber-400">یاسای ڕاگرتنی 5 مانگی سەرمایە</strong> بۆ بەگەڕخستنی ئۆتۆمبێلەکان بەبێ ڕاکێشانی پێشوەختە.
                          </>
                        ) : (
                          <>
                            I acknowledge and agree to the <strong className="text-amber-400">5-month capital lockup agreement</strong> governing commercial logistics fleet deployment.
                          </>
                        )}
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || adminSettings?.registrationEnabled === false}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-1 cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : adminSettings?.registrationEnabled === false ? (
                      <span>{lang === 'ar' ? 'التسجيل معطل حالياً' : 'Registration Disabled'}</span>
                    ) : (
                      <>
                        <span>{t.signupBtn}</span>
                        <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </motion.div>
      </main>

      {/* Footer Info */}
      <footer className="relative z-10 text-center py-3 text-xs text-slate-500 flex flex-col items-center gap-1">
        <div className="text-[11px]">
          © {new Date().getFullYear()} {t.brandName} — {t.brandSubtitle}. All rights reserved.
        </div>
      </footer>

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <ForgotPasswordModal
          currentLang={lang}
          onClose={() => setShowForgotPasswordModal(false)}
          onSuccessToast={(msg) =>
            addToast(
              'success',
              msg,
              lang === 'ar'
                ? 'تم إرسال الطلب'
                : lang === 'ckb'
                ? 'داواکاری نێردرا'
                : 'Request Sent'
            )
          }
        />
      )}
    </div>
  );
};
