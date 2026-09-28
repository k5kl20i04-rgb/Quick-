import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  User,
  DepositRequest,
  WithdrawalRequest,
  AppNotification,
  Investment,
  KYCSubmission,
  Project,
  ProjectStatus,
  VehicleCategory,
  AdminSettings,
  NewsArticle,
  FreightTrip,
  AdminActivityLog,
  ReferralRecord,
} from '../types';

// Default Supabase credentials
const DEFAULT_SUPABASE_URL = 'https://yjvihqcnbcbggqmhwarz.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_VWj32_HUogAgi1EwIiZuDQ_B_or1-wk';

const isValidHttpUrl = (urlStr: string): boolean => {
  if (!urlStr || typeof urlStr !== 'string') return false;
  try {
    const parsed = new URL(urlStr.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const getEnvVar = (key: string, fallback: string): string => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      if ((import.meta as any).env[key]) return (import.meta as any).env[key];
      const altKey = key.startsWith('VITE_') ? key.replace('VITE_', '') : `VITE_${key}`;
      if ((import.meta as any).env[altKey]) return (import.meta as any).env[altKey];
    }
    if (typeof process !== 'undefined' && process.env) {
      if ((process.env as any)[key]) return (process.env as any)[key];
      const altKey = key.startsWith('VITE_') ? key.replace('VITE_', '') : `VITE_${key}`;
      if ((process.env as any)[altKey]) return (process.env as any)[altKey];
    }
  } catch {
    // fallback
  }
  return fallback;
};

const sanitizeUrl = (urlStr: string): string => {
  if (!urlStr || typeof urlStr !== 'string') return DEFAULT_SUPABASE_URL;
  let cleaned = urlStr.trim();
  cleaned = cleaned.replace(/\/rest\/v1\/?$/i, '');
  cleaned = cleaned.replace(/\/+$/, '');
  return isValidHttpUrl(cleaned) ? cleaned : DEFAULT_SUPABASE_URL;
};

const rawUrl = getEnvVar('VITE_SUPABASE_URL', DEFAULT_SUPABASE_URL);
export const supabaseUrl = sanitizeUrl(rawUrl);

const rawKey = getEnvVar('VITE_SUPABASE_ANON_KEY', DEFAULT_SUPABASE_ANON_KEY);
export const supabaseAnonKey = rawKey && rawKey.trim() ? rawKey.trim() : DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseClientConfigured = (): boolean => {
  return Boolean(
    isValidHttpUrl(supabaseUrl) &&
    supabaseAnonKey &&
    supabaseAnonKey !== 'placeholder' &&
    supabaseAnonKey !== 'YOUR_SUPABASE_KEY' &&
    (
      supabaseAnonKey.startsWith('ey') ||
      supabaseAnonKey.startsWith('sbp_') ||
      supabaseAnonKey.startsWith('sb_publishable_') ||
      supabaseAnonKey.startsWith('sb_secret_')
    )
  );
};

console.log('⚡ [Supabase Client Initialization]', {
  url: supabaseUrl,
  configured: isSupabaseClientConfigured(),
  hasAnonKey: Boolean(supabaseAnonKey),
  keyLength: supabaseAnonKey ? supabaseAnonKey.length : 0,
});

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/* =========================================================================
   1. PROFILES & WALLETS (Investor Management & Wallet Balances)
   ========================================================================= */

/**
 * Sign in a user directly with Supabase Auth (supabase.auth.signInWithPassword)
 */
export async function signInWithSupabase(
  email: string,
  password: string
): Promise<{ user: User | null; error: string | null }> {
  if (!isSupabaseClientConfigured()) {
    return { user: null, error: null };
  }

  try {
    console.log('🚀 [Supabase SignIn] Attempting supabase.auth.signInWithPassword for:', email);
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authErr) {
      console.warn('⚠️ [Supabase SignIn Auth Notice]:', authErr.message);
      return { user: null, error: authErr.message };
    }

    if (authData?.user) {
      console.log('✅ [Supabase SignIn] Auth successful for user ID:', authData.user.id);
      // Retrieve full profile from database table
      const profile = await getSupabaseProfile(authData.user.id);
      if (profile) {
        return { user: profile, error: null };
      }
      const meta = authData.user.user_metadata || {};
      const fallbackUser: User = {
        id: authData.user.id,
        email: authData.user.email || email,
        name: meta.name || meta.full_name || email.split('@')[0],
        role: meta.role || (email.includes('admin') ? 'admin' : 'investor'),
        usdtBalance: 0,
        kycStatus: 'not_submitted',
        accountStatus: 'active',
        totalInvested: 0,
        totalRoiEarned: 0,
        joinedDate: new Date().toISOString().split('T')[0],
      };
      return { user: fallbackUser, error: null };
    }

    return { user: null, error: 'فشل تسجيل الدخول بواسطة Supabase' };
  } catch (err: any) {
    console.warn('⚠️ [Supabase SignIn Exception]:', err?.message || err);
    return { user: null, error: err?.message || 'خطأ أثناء الاتصال' };
  }
}

/**
 * Register a new user in Supabase (Auth + Profiles table) with full error catching & logging
 */
export async function signUpWithSupabase(userData: {
  id?: string;
  email: string;
  password?: string;
  name: string;
  phone?: string;
  governorate?: string;
  role?: 'investor' | 'admin';
}): Promise<{
  user: User | null;
  session: any | null;
  needsEmailConfirmation: boolean;
  error: string | null;
}> {
  if (!userData.password) {
    return {
      user: null,
      session: null,
      needsEmailConfirmation: false,
      error: 'كلمة المرور مطلوبة للإنشاء / Password is required',
    };
  }

  if (!isSupabaseClientConfigured()) {
    return {
      user: null,
      session: null,
      needsEmailConfirmation: false,
      error: 'يرجى ضبط إعدادات Supabase (VITE_SUPABASE_ANON_KEY و VITE_SUPABASE_URL)',
    };
  }

  try {
    console.log('🚀 [Supabase SignUp] Registering user directly with Supabase Auth:', userData.email);
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}` : undefined;
    
    const { data: authData, error: sbAuthErr } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          name: userData.name,
          phone: userData.phone,
          governorate: userData.governorate,
          role: userData.role || 'investor',
        },
      },
    });

    if (sbAuthErr) {
      console.error('❌ [Supabase Auth SignUp Error]:', sbAuthErr.message);
      return {
        user: null,
        session: null,
        needsEmailConfirmation: false,
        error: sbAuthErr.message,
      };
    }

    if (!authData?.user) {
      return {
        user: null,
        session: null,
        needsEmailConfirmation: false,
        error: 'لم يتم إرجاع بيانات المستخدم من Supabase',
      };
    }

    const finalId = authData.user.id;
    const needsEmailConfirmation = !authData.session;

    const resultUser: User = {
      id: finalId,
      name: userData.name,
      email: userData.email,
      role: userData.role || 'investor',
      usdtBalance: 0,
      kycStatus: 'not_submitted',
      accountStatus: 'active',
      totalInvested: 0,
      totalRoiEarned: 0,
      joinedDate: new Date().toISOString().split('T')[0],
      phone: userData.phone,
      governorate: userData.governorate,
    };

    // Upsert into 'profiles' table
    try {
      const profilePayload = {
        id: finalId,
        email: userData.email,
        full_name: userData.name,
        phone: userData.phone || null,
        province: userData.governorate || null,
        role: userData.role || 'investor',
        kyc_status: 'not_submitted',
        created_at: new Date().toISOString(),
      };

      await supabase.from('profiles').upsert(profilePayload, { onConflict: 'id' });
    } catch (pEx) {
      console.warn('⚠️ Profile table insert notice:', pEx);
    }

    // Upsert into 'wallets' table safely
    try {
      const { data: existingW } = await supabase.from('wallets').select('id, user_id').eq('user_id', finalId).limit(1);
      const walletPayload = {
        user_id: finalId,
        available_balance: 0,
        locked_capital: 0,
        total_profits: 0,
        updated_at: new Date().toISOString(),
      };
      if (existingW && existingW.length > 0) {
        await supabase.from('wallets').update(walletPayload).eq('user_id', finalId);
      } else {
        await supabase.from('wallets').insert(walletPayload);
      }
    } catch (wErr) {
      console.warn('⚠️ Wallet table insert notice:', wErr);
    }

    return {
      user: resultUser,
      session: authData.session,
      needsEmailConfirmation,
      error: null,
    };
  } catch (err: any) {
    console.error('❌ [Supabase SignUp Exception]:', err);
    return {
      user: null,
      session: null,
      needsEmailConfirmation: false,
      error: err?.message || 'حدث خطأ أثناء الاتصال بـ Supabase',
    };
  }
}

/**
 * Resend email confirmation link to a user
 */
export async function resendConfirmationEmail(
  email: string
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseClientConfigured()) {
    return { success: false, error: 'تكوين Supabase غير متاح' };
  }

  try {
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}` : undefined;
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      console.warn('⚠️ [Supabase Resend Confirmation Error]:', error.message);
      return { success: false, error: error.message };
    }

    console.log('✅ [Supabase Resend Confirmation Success] Email re-sent to:', email);
    return { success: true, error: null };
  } catch (err: any) {
    console.error('❌ [Supabase Resend Confirmation Exception]:', err);
    return { success: false, error: err?.message || 'حدث خطأ أثناء إرسال البريد الإلكتروني' };
  }
}

export async function getSupabaseProfiles(): Promise<User[]> {
  if (!isSupabaseClientConfigured()) return [];
  try {
    // Try relational join query first
    const { data: realUsers, error: relError } = await supabase
      .from('profiles')
      .select(`
        *,
        wallets (
          available_balance,
          locked_capital,
          total_profits
        )
      `)
      .order('created_at', { ascending: false });

    if (!relError && realUsers && realUsers.length > 0) {
      console.log('✅ [Supabase getProfiles Relational] Fetched', realUsers.length, 'user profiles with wallets');
      return realUsers.map((d: any): User => {
        const email = (d.email || '').toLowerCase();
        const isFounder = email === 'goog7029766@gmail.com';
        const wList = Array.isArray(d.wallets) ? d.wallets : (d.wallets ? [d.wallets] : []);
        const wallet = wList[0];

        const mainBal = wallet ? Number(wallet.main_balance ?? wallet.mainBalance ?? 0) : Number(d.main_balance ?? d.mainBalance ?? 0);
        const invBal = wallet ? Number(wallet.investment_balance ?? wallet.investmentBalance ?? wallet.available_balance ?? 0) : Number(d.investment_balance ?? d.investmentBalance ?? d.usdt_balance ?? d.balance ?? 0);
        const totalBal = mainBal + invBal;

        return {
          id: d.id,
          name: isFounder
            ? 'مؤسس المنشأة والمالك الرئيسي (Founder & Main Owner)'
            : (d.full_name || d.name || d.username || d.email || 'مستثمر'),
          email: d.email || '',
          role: isFounder ? 'admin' : (d.role || 'investor'),
          mainBalance: mainBal,
          investmentBalance: invBal,
          usdtBalance: totalBal || (wallet ? Number(wallet.available_balance ?? 0) : Number(d.usdt_balance ?? d.balance ?? 0)),
          kycStatus: isFounder ? 'approved' : (d.kyc_status || 'not_submitted'),
          accountStatus: 'active',
          totalInvested: wallet ? Number(wallet.locked_capital ?? 0) : Number(d.total_invested ?? 0),
          totalRoiEarned: wallet ? Number(wallet.total_profits ?? 0) : Number(d.total_roi_earned ?? 0),
          phone: d.phone,
          governorate: d.province || d.governorate,
          joinedDate: d.created_at ? new Date(d.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        };
      });
    }

    let { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('⚠️ [Supabase getProfiles notice]:', error.message, 'Retrying without order by created_at...');
      const retry = await supabase.from('profiles').select('*');
      data = retry.data;
      error = retry.error;
    }

    if (error || !data) {
      if (error) console.warn('⚠️ [Supabase getProfiles error]:', error.message);
      return [];
    }

    let walletsMap = new Map<string, any>();
    try {
      const { data: wData } = await supabase.from('wallets').select('*');
      if (wData) {
        wData.forEach((w: any) => {
          if (w.user_id) walletsMap.set(w.user_id, w);
        });
      }
    } catch {}

    console.log('✅ [Supabase getProfiles] Fetched', data.length, 'user profiles');
    return data.map((d: any): User => {
      const email = (d.email || '').toLowerCase();
      const isFounder = email === 'goog7029766@gmail.com';
      const wallet = walletsMap.get(d.id);

      const mainBal = wallet ? Number(wallet.main_balance ?? wallet.mainBalance ?? 0) : Number(d.main_balance ?? d.mainBalance ?? 0);
      const invBal = wallet ? Number(wallet.investment_balance ?? wallet.investmentBalance ?? wallet.available_balance ?? 0) : Number(d.investment_balance ?? d.investmentBalance ?? d.usdt_balance ?? d.balance ?? 0);
      const totalBal = mainBal + invBal;

      return {
        id: d.id,
        name: isFounder
          ? 'مؤسس المنشأة والمالك الرئيسي (Founder & Main Owner)'
          : (d.full_name || d.name || d.username || d.email || 'مستثمر'),
        email: d.email || '',
        role: isFounder ? 'admin' : (d.role || 'investor'),
        mainBalance: mainBal,
        investmentBalance: invBal,
        usdtBalance: totalBal || (wallet ? Number(wallet.available_balance ?? 0) : Number(d.usdt_balance ?? d.balance ?? 0)),
        kycStatus: isFounder ? 'approved' : (d.kyc_status || 'not_submitted'),
        accountStatus: 'active',
        totalInvested: wallet ? Number(wallet.locked_capital ?? 0) : Number(d.total_invested ?? 0),
        totalRoiEarned: wallet ? Number(wallet.total_profits ?? 0) : Number(d.total_roi_earned ?? 0),
        phone: d.phone,
        governorate: d.province || d.governorate,
        joinedDate: d.created_at ? new Date(d.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      };
    });
  } catch (err) {
    console.warn('⚠️ [Supabase getProfiles exception]:', err);
    return [];
  }
}

export async function getSupabaseProfile(userIdOrEmail: string): Promise<User | null> {
  if (!isSupabaseClientConfigured()) return null;
  try {
    let query = supabase.from('profiles').select('*');
    if (userIdOrEmail.includes('@')) {
      query = query.eq('email', userIdOrEmail.toLowerCase());
    } else {
      query = query.eq('id', userIdOrEmail);
    }

    const { data, error } = await query.maybeSingle();

    if (error || !data) return null;

    const email = (data.email || '').toLowerCase();
    const isFounder = email === 'goog7029766@gmail.com';
    const role = isFounder ? 'admin' : (data.role || 'investor');
    const kycStatus = isFounder ? 'approved' : (data.kyc_status || 'not_submitted');

    let walletBal = 0;
    let mainBal = 0;
    let invBal = 0;
    let totalInvested = 0;
    let totalRoi = 0;

    try {
      const { data: wData } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', data.id)
        .maybeSingle();
      if (wData) {
        walletBal = Number(wData.available_balance ?? 0);
        mainBal = Number(wData.main_balance ?? wData.mainBalance ?? 0);
        invBal = Number(wData.investment_balance ?? wData.investmentBalance ?? wData.available_balance ?? walletBal);
        totalInvested = Number(wData.locked_capital ?? 0);
        totalRoi = Number(wData.total_profits ?? 0);
      }
    } catch {}

    const totalBal = mainBal + invBal;

    if (isFounder && (data.role !== 'admin' || data.kyc_status !== 'approved')) {
      Promise.resolve(supabase.from('profiles').update({ role: 'admin', kyc_status: 'approved' }).eq('id', data.id)).catch(() => {});
    }

    return {
      id: data.id,
      name: isFounder ? 'مؤسس المنشأة والمالك الرئيسي (Founder & Main Owner)' : (data.full_name || data.name || ''),
      email: data.email || '',
      role: role,
      mainBalance: mainBal,
      investmentBalance: invBal,
      usdtBalance: totalBal || walletBal,
      kycStatus: kycStatus,
      accountStatus: 'active',
      totalInvested: totalInvested,
      totalRoiEarned: totalRoi,
      phone: data.phone,
      governorate: data.province || data.governorate,
      joinedDate: data.created_at ? new Date(data.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    };
  } catch (err) {
    console.warn('⚠️ [Supabase getProfile exception]:', err);
    return null;
  }
}

export async function upsertSupabaseProfile(user: Partial<User> & { id: string }): Promise<boolean> {
  if (!isSupabaseClientConfigured()) return true;
  try {
    console.log('🔄 [Supabase] upsertSupabaseProfile for ID:', user.id, 'Email:', user.email);
    const isFounder = user.email?.toLowerCase() === 'goog7029766@gmail.com';
    const validId = ensureValidUuid(user.id);

    const payload: any = {
      id: validId,
    };
    if (user.email !== undefined) payload.email = user.email.toLowerCase();
    if (user.name !== undefined) payload.full_name = isFounder ? 'مؤسس المنشأة والمالك الرئيسي (Founder & Main Owner)' : user.name;
    if (user.phone !== undefined) payload.phone = user.phone || null;
    if (user.governorate !== undefined || (user as any).province !== undefined) {
      payload.province = user.governorate || (user as any).province || null;
    }
    if (user.role !== undefined || isFounder) payload.role = isFounder ? 'admin' : (user.role || 'investor');
    if (user.kycStatus !== undefined || isFounder) payload.kyc_status = isFounder ? 'approved' : (user.kycStatus || 'not_submitted');
    if (user.joinedDate !== undefined || (user as any).created_at !== undefined) {
      payload.created_at = (user as any).created_at || (user.joinedDate ? new Date(user.joinedDate).toISOString() : new Date().toISOString());
    }

    const { data, error: profileErr } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })
      .select();

    if (profileErr) {
      console.warn('⚠️ [Supabase upsertProfile Note]:', profileErr.message);
    } else {
      console.log('✅ [Supabase upsertProfile Success]:', data);
    }

    if (user.usdtBalance !== undefined || user.totalInvested !== undefined || user.totalRoiEarned !== undefined) {
      try {
        const walletPayload: any = { user_id: user.id, updated_at: new Date().toISOString() };
        if (user.usdtBalance !== undefined) walletPayload.available_balance = user.usdtBalance;
        if (user.totalInvested !== undefined) walletPayload.locked_capital = user.totalInvested;
        if (user.totalRoiEarned !== undefined) walletPayload.total_profits = user.totalRoiEarned;

        const { data: existingW } = await supabase.from('wallets').select('id, user_id').eq('user_id', user.id).limit(1);
        if (existingW && existingW.length > 0) {
          await supabase.from('wallets').update(walletPayload).eq('user_id', user.id);
        } else {
          await supabase.from('wallets').insert(walletPayload);
        }
      } catch (wErr) {
        console.warn('⚠️ Wallet table upsert note:', wErr);
      }
    }

    return !profileErr;
  } catch (err) {
    console.warn('⚠️ [Supabase upsertProfile Exception]:', err);
    return false;
  }
}

export async function deleteSupabaseProfile(userId: string): Promise<boolean> {
  try {
    const validId = ensureValidUuid(userId);
    try { await supabase.from('wallets').delete().or(`user_id.eq.${userId},user_id.eq.${validId}`); } catch {}
    const { error } = await supabase.from('profiles').delete().or(`id.eq.${userId},id.eq.${validId}`);
    return !error;
  } catch (err) {
    console.warn('Supabase deleteProfile exception:', err);
    return false;
  }
}

/* =========================================================================
   2. FLEETS / PROJECTS (Fleet Management Dashboard)
   ========================================================================= */

function ensureValidUuid(id?: string): string {
  if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id;
  }
  if (id && typeof id === 'string' && id.trim()) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    const hex2 = Math.abs(hash * 31).toString(16).padStart(8, '0');
    const hex3 = Math.abs(hash * 127).toString(16).padStart(8, '0');
    const hex4 = Math.abs(hash * 8191).toString(16).padStart(8, '0');
    const combined = (hex + hex2 + hex3 + hex4).slice(0, 32);
    return `${combined.slice(0, 8)}-${combined.slice(8, 12)}-4${combined.slice(13, 16)}-a${combined.slice(17, 20)}-${combined.slice(20, 32)}`;
  }
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function uploadFleetImageToSupabase(file: File): Promise<string> {
  try {
    if (!isSupabaseClientConfigured()) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }

    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `fleet_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const filePath = `images/${fileName}`;

    const { data, error } = await supabase.storage.from('fleets').upload(filePath, file, {
      contentType: file.type || 'image/png',
      upsert: true,
    });

    if (error) {
      console.warn('⚠️ [Supabase Storage upload warning]:', error.message);
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }

    const { data: publicUrlData } = supabase.storage.from('fleets').getPublicUrl(filePath);
    return publicUrlData?.publicUrl || '';
  } catch (err) {
    console.warn('⚠️ [uploadFleetImageToSupabase exception]:', err);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }
}

export async function getSupabaseFleets(): Promise<Project[]> {
  try {
    const { data, error } = await supabase
      .from('fleets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn('Supabase getFleets error:', error?.message);
      return [];
    }

    return data.map((item: any): Project => {
      let parsedTitle: any = null;
      let rawTitle = item.title;

      if (typeof rawTitle === 'string' && rawTitle.trim().startsWith('{')) {
        try {
          parsedTitle = JSON.parse(rawTitle);
        } catch {
          parsedTitle = null;
        }
      } else if (typeof rawTitle === 'object' && rawTitle !== null) {
        parsedTitle = rawTitle;
      }

      const titleObj = {
        ar: parsedTitle?.ar || (typeof rawTitle === 'string' ? rawTitle : 'مشروع أسطول استثماري'),
        en: parsedTitle?.en || parsedTitle?.ar || (typeof rawTitle === 'string' ? rawTitle : 'Fleet Investment Plan'),
        ckb: parsedTitle?.ckb || parsedTitle?.ar || (typeof rawTitle === 'string' ? rawTitle : 'پڕۆژەی کاروان'),
      };

      let descObj = parsedTitle?.description || item.description;
      if (typeof descObj === 'string' && descObj.trim().startsWith('{')) {
        try { descObj = JSON.parse(descObj); } catch { descObj = { ar: descObj, en: descObj, ckb: descObj }; }
      } else if (typeof descObj === 'string') {
        descObj = { ar: descObj, en: descObj, ckb: descObj };
      }

      let routeObj = parsedTitle?.route || item.route;
      if (typeof routeObj === 'string' && routeObj.trim().startsWith('{')) {
        try { routeObj = JSON.parse(routeObj); } catch { routeObj = { ar: routeObj, en: routeObj, ckb: routeObj }; }
      } else if (typeof routeObj === 'string') {
        routeObj = { ar: routeObj, en: routeObj, ckb: routeObj };
      }

      const vehicleType = parsedTitle?.vehicleType || item.vehicle_type || item.vehicleType || 'Heavy Cargo Transporter';
      const minInvestment = Number(parsedTitle?.minInvestment ?? item.min_investment ?? item.minInvestment ?? 100);
      const totalVehicles = Number(parsedTitle?.totalVehicles ?? item.total_vehicles ?? item.totalVehicles ?? 10);
      const capacitySpecs = parsedTitle?.capacitySpecs || item.capacity_specs || item.capacitySpecs || '40 Tons Capacity';

      return {
        id: item.id,
        title: titleObj,
        category: item.category || 'cargo_freight',
        description: descObj || { ar: '', en: '', ckb: '' },
        imageUrl: item.image_url || item.imageUrl || 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=80',
        route: routeObj || { ar: 'بغداد ⇄ أربيل ⇄ البصرة', en: 'Baghdad ⇄ Erbil ⇄ Basra', ckb: 'بەغدا ⇄ هەولێر ⇄ بەسرە' },
        vehicleType,
        targetAmount: Number(item.target_amount ?? item.targetAmount ?? 100000),
        raisedAmount: Number(item.raised_amount ?? item.raisedAmount ?? 0),
        minInvestment,
        monthlyRoiPercent: Number(item.roi_percentage ?? item.monthly_roi_percent ?? item.monthlyRoiPercent ?? 4.5),
        lockupMonths: Number(item.lock_period_months ?? item.lockup_months ?? item.lockupMonths ?? 5),
        status: item.is_active !== undefined ? (item.is_active ? 'active' : 'paused') : (item.status || 'active'),
        totalVehicles,
        capacitySpecs,
        createdDate: item.created_at ? new Date(item.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      };
    });
  } catch (err) {
    console.warn('Supabase getFleets exception:', err);
    return [];
  }
}

export async function upsertSupabaseFleet(project: Partial<Project> & { id?: string }): Promise<boolean> {
  try {
    const validId = ensureValidUuid(project.id);

    const titleAr = typeof project.title === 'object' ? project.title?.ar : project.title || 'أسطول جديد';
    const titleEn = typeof project.title === 'object' ? project.title?.en : project.title || 'New Fleet';
    const titleCkb = typeof project.title === 'object' ? project.title?.ckb : project.title || 'کاروانی نوێ';

    const metaTitle = JSON.stringify({
      ar: titleAr,
      en: titleEn,
      ckb: titleCkb,
      route: project.route,
      description: project.description,
      vehicleType: project.vehicleType,
      minInvestment: project.minInvestment,
      totalVehicles: project.totalVehicles,
      capacitySpecs: project.capacitySpecs,
    });

    const payload: any = {
      id: validId,
      title: metaTitle,
      category: project.category || 'cargo_freight',
      target_amount: Number(project.targetAmount || 100000),
      raised_amount: Number(project.raisedAmount || 0),
      roi_percentage: Number(project.monthlyRoiPercent || 4.5),
      lock_period_months: Number(project.lockupMonths || 5),
      image_url: project.imageUrl || 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=80',
      is_active: project.status ? project.status === 'active' : true,
      created_at: project.createdDate ? new Date(project.createdDate).toISOString() : new Date().toISOString(),
    };

    const { error: fleetErr } = await supabase
      .from('fleets')
      .upsert(payload, { onConflict: 'id' });

    if (fleetErr) {
      console.warn('⚠️ [Supabase upsertFleet error]:', fleetErr.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase upsertFleet exception:', err);
    return false;
  }
}

export async function updateSupabaseFleetStatus(id: string, status: ProjectStatus): Promise<boolean> {
  try {
    const validId = ensureValidUuid(id);
    const { error: fleetErr } = await supabase
      .from('fleets')
      .update({ is_active: status === 'active' })
      .eq('id', validId);
    return !fleetErr;
  } catch (err) {
    console.warn('Supabase updateFleetStatus exception:', err);
    return false;
  }
}

export async function deleteSupabaseFleet(id: string): Promise<boolean> {
  try {
    const validId = ensureValidUuid(id);
    const { error: fleetErr } = await supabase.from('fleets').delete().or(`id.eq.${id},id.eq.${validId}`);
    return !fleetErr;
  } catch (err) {
    console.warn('Supabase deleteFleet exception:', err);
    return false;
  }
}

/* =========================================================================
   3. INVESTMENTS (Active Plans & Portfolio)
   ========================================================================= */

export async function getSupabaseInvestments(userId?: string): Promise<Investment[]> {
  try {
    let query = supabase.from('investments').select('*').order('created_at', { ascending: false });
    if (userId) {
      const validUserId = ensureValidUuid(userId);
      query = query.or(`user_id.eq.${userId},user_id.eq.${validUserId}`);
    }
    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((inv: any): Investment => {
      const amountVal = Number(inv.amount || 0);
      const rawMonthlyReturn = inv.monthly_return ?? inv.monthly_roi_percent ?? inv.monthlyRoiPercent ?? 4.5;
      const monthlyReturnNum = Number(rawMonthlyReturn || 4.5);
      const monthlyRoiPercent = monthlyReturnNum <= 100 ? monthlyReturnNum : (amountVal > 0 ? Number(((monthlyReturnNum / amountVal) * 100).toFixed(2)) : 4.5);

      return {
        id: inv.id,
        userId: inv.user_id || inv.userId,
        projectId: inv.fleet_id || inv.project_id || inv.projectId || '',
        projectTitle: inv.project_title || inv.projectTitle || 'خطة أسطول',
        category: inv.category || 'cargo_freight',
        amount: amountVal,
        monthlyRoiPercent: monthlyRoiPercent,
        startDate: inv.start_date || inv.startDate || inv.created_at || new Date().toISOString(),
        endDate: inv.end_date || inv.endDate || new Date().toISOString(),
        lockupMonths: Number(inv.lockup_months ?? inv.lockupMonths ?? 5),
        status: inv.status || 'active',
        accruedRoi: Number(inv.accrued_roi ?? inv.accruedRoi ?? 0),
        lastPayoutDate: inv.last_payout_date || inv.lastPayoutDate || inv.created_at || new Date().toISOString(),
      };
    });
  } catch (err) {
    console.warn('Supabase getInvestments exception:', err);
    return [];
  }
}

export async function insertSupabaseInvestment(inv: Investment): Promise<boolean> {
  try {
    const validInvId = ensureValidUuid(inv.id);
    const validUserId = ensureValidUuid(inv.userId);
    const validFleetId = ensureValidUuid(inv.projectId);
    const monthlyReturnVal = Number(inv.monthlyRoiPercent || 4.5);

    const payload: any = {
      id: validInvId,
      user_id: validUserId,
      fleet_id: validFleetId,
      amount: Number(inv.amount || 0),
      monthly_return: monthlyReturnVal,
      status: inv.status || 'active',
      created_at: inv.startDate ? new Date(inv.startDate).toISOString() : new Date().toISOString(),
      // Backward compatibility fields for legacy table structures
      project_id: validFleetId,
      project_title: inv.projectTitle || 'خطة أسطول',
      category: inv.category || 'cargo_freight',
      monthly_roi_percent: monthlyReturnVal,
      start_date: inv.startDate ? new Date(inv.startDate).toISOString() : new Date().toISOString(),
      end_date: inv.endDate ? new Date(inv.endDate).toISOString() : new Date().toISOString(),
      lockup_months: Number(inv.lockupMonths || 5),
      accrued_roi: Number(inv.accruedRoi || 0),
      last_payout_date: inv.lastPayoutDate ? new Date(inv.lastPayoutDate).toISOString() : new Date().toISOString(),
    };

    const { error } = await supabase.from('investments').upsert(payload, { onConflict: 'id' });
    return !error;
  } catch (err) {
    console.warn('Supabase insertInvestment exception:', err);
    return false;
  }
}

export async function updateSupabaseInvestmentStatus(id: string, status: string): Promise<boolean> {
  try {
    const validId = ensureValidUuid(id);
    const { error } = await supabase
      .from('investments')
      .update({ status })
      .or(`id.eq.${id},id.eq.${validId}`);
    return !error;
  } catch (err) {
    console.warn('Supabase updateInvestmentStatus exception:', err);
    return false;
  }
}

/* =========================================================================
   4. TRANSACTIONS / DEPOSITS & WITHDRAWALS (Wallet Balances & P2P)
   ========================================================================= */

export async function getSupabaseTransactions(userId?: string): Promise<{
  deposits: DepositRequest[];
  withdrawals: WithdrawalRequest[];
}> {
  try {
    // 1. Fetch deposits
    const deposits = await getSupabaseDeposits(userId) || [];
    // 2. Fetch withdrawals
    const withdrawals = await getSupabaseWithdrawals(userId) || [];

    // Also check 'transactions' table if set up
    let txQuery = supabase.from('transactions').select('*').order('created_at', { ascending: false });
    if (userId) {
      txQuery = txQuery.eq('user_id', userId);
    }
    const { data: txData } = await txQuery;

    if (txData && txData.length > 0) {
      txData.forEach((tx: any) => {
        if (tx.type === 'deposit') {
          if (!deposits.some((d) => d.id === tx.id)) {
            deposits.unshift({
              id: tx.id,
              userId: tx.user_id || tx.userId,
              userName: tx.user_name || 'Investor',
              userEmail: tx.user_email || '',
              amount: Number(tx.amount || 0),
              network: tx.network || 'TRC20',
              status: tx.status || 'pending',
              txHash: tx.tx_hash,
              receiptUrl: tx.receipt_url,
              createdAt: tx.created_at || new Date().toISOString(),
              adminNote: tx.admin_note,
              userNote: tx.user_note,
              chatMessages: tx.chat_messages || [],
            });
          }
        } else if (tx.type === 'withdrawal') {
          if (!withdrawals.some((w) => w.id === tx.id)) {
            withdrawals.unshift({
              id: tx.id,
              userId: tx.user_id || tx.userId,
              userName: tx.user_name || 'Investor',
              userEmail: tx.user_email || '',
              amount: Number(tx.amount || 0),
              payoutMethod: tx.payout_method || 'USDT_TRC20',
              payoutDetails: tx.payout_details || '',
              destinationWallet: tx.destination_wallet || tx.payout_details || '',
              requestedAt: tx.requested_at || tx.created_at || new Date().toISOString(),
              status: tx.status || 'pending',
              adminNote: tx.admin_note,
              receiptUrl: tx.receipt_url,
              txHash: tx.tx_hash,
              chatMessages: tx.chat_messages || [],
            });
          }
        }
      });
    }

    return { deposits, withdrawals };
  } catch (err) {
    console.warn('Supabase getTransactions exception:', err);
    return { deposits: [], withdrawals: [] };
  }
}

export async function getSupabaseDeposits(userId?: string): Promise<DepositRequest[] | null> {
  try {
    let query = supabase.from('deposits').select('*').order('created_at', { ascending: false });
    if (userId) query = query.eq('user_id', userId);

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((d: any): DepositRequest => ({
      id: d.id,
      userId: d.user_id || d.userId,
      userName: d.user_name || d.userName || 'Investor',
      userEmail: d.user_email || d.userEmail || '',
      amount: Number(d.amount || 0),
      network: d.network || 'TRC20',
      status: d.status || 'pending',
      txHash: d.tx_hash || d.txHash,
      receiptUrl: d.receipt_url || d.receiptUrl,
      createdAt: d.created_at || d.createdAt || new Date().toISOString(),
      adminNote: d.admin_note || d.adminNote,
      userNote: d.user_note || d.userNote,
      chatMessages: d.chat_messages || d.chatMessages || [],
    }));
  } catch (err) {
    console.warn('Supabase getDeposits exception:', err);
    return [];
  }
}

export async function insertSupabaseDeposit(deposit: DepositRequest): Promise<boolean> {
  if (!deposit || !deposit.id) {
    console.warn('⚠️ [Supabase] insertSupabaseDeposit received invalid deposit:', deposit);
    return false;
  }
  try {
    const payload = {
      id: deposit.id,
      user_id: deposit.userId || 'investor',
      user_name: deposit.userName || 'المستثمر',
      user_email: deposit.userEmail || '',
      amount: deposit.amount || 0,
      network: deposit.network || 'TRC20',
      status: deposit.status || 'pending',
      tx_hash: deposit.txHash || null,
      receipt_url: deposit.receiptUrl || null,
      created_at: deposit.createdAt || new Date().toISOString(),
      admin_note: deposit.adminNote || null,
      user_note: deposit.userNote || null,
      chat_messages: deposit.chatMessages || [],
    };

    const { error: depErr } = await supabase.from('deposits').insert(payload);

    // Also sync to 'transactions' table
    try {
      await supabase.from('transactions').insert({
        id: deposit.id,
        user_id: deposit.userId || 'investor',
        user_name: deposit.userName || 'المستثمر',
        user_email: deposit.userEmail || '',
        type: 'deposit',
        amount: deposit.amount || 0,
        network: deposit.network || 'TRC20',
        status: deposit.status || 'pending',
        tx_hash: deposit.txHash || null,
        receipt_url: deposit.receiptUrl || null,
        created_at: deposit.createdAt || new Date().toISOString(),
        admin_note: deposit.adminNote || null,
        user_note: deposit.userNote || null,
        chat_messages: deposit.chatMessages || [],
      });
    } catch {}

    return !depErr;
  } catch (err) {
    console.warn('Supabase insertDeposit exception:', err);
    return false;
  }
}

export async function updateSupabaseDeposit(deposit: DepositRequest): Promise<boolean> {
  if (!deposit || !deposit.id) {
    console.warn('⚠️ [Supabase] updateSupabaseDeposit received invalid deposit:', deposit);
    return false;
  }
  try {
    const payload = {
      status: deposit.status || 'pending',
      amount: deposit.amount || 0,
      tx_hash: deposit.txHash || null,
      receipt_url: deposit.receiptUrl || null,
      admin_note: deposit.adminNote || null,
      user_note: deposit.userNote || null,
      chat_messages: deposit.chatMessages || [],
      updated_at: new Date().toISOString(),
    };

    const { error: depErr } = await supabase.from('deposits').update(payload).eq('id', deposit.id);

    try { await supabase.from('transactions').update(payload).eq('id', deposit.id); } catch {}

    return !depErr;
  } catch (err) {
    console.warn('Supabase updateDeposit exception:', err);
    return false;
  }
}

export async function getSupabaseWithdrawals(userId?: string): Promise<WithdrawalRequest[] | null> {
  try {
    let query = supabase.from('withdrawals').select('*').order('created_at', { ascending: false });
    if (userId) query = query.eq('user_id', userId);

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((w: any): WithdrawalRequest => ({
      id: w.id,
      userId: w.user_id || w.userId,
      userName: w.user_name || w.userName || 'Investor',
      userEmail: w.user_email || w.userEmail,
      investmentId: w.investment_id || w.investmentId,
      projectTitle: w.project_title || w.projectTitle,
      amount: Number(w.amount || 0),
      payoutMethod: w.payout_method || w.payoutMethod || 'USDT_TRC20',
      payoutDetails: w.payout_details || w.payoutDetails || '',
      destinationWallet: w.destination_wallet || w.destinationWallet,
      network: w.network,
      withdrawalCategory: w.withdrawal_category || w.withdrawalCategory,
      requestedAt: w.requested_at || w.requestedAt || w.created_at || new Date().toISOString(),
      processedAt: w.processed_at || w.processedAt,
      status: w.status || 'pending',
      lockupCompleted: w.lockup_completed || w.lockupCompleted,
      rejectionReason: w.rejection_reason || w.rejectionReason,
      adminNote: w.admin_note || w.adminNote,
      chatMessages: w.chat_messages || w.chatMessages || [],
      receiptUrl: w.receipt_url || w.receiptUrl,
      txHash: w.tx_hash || w.txHash,
    }));
  } catch (err) {
    console.warn('Supabase getWithdrawals exception:', err);
    return [];
  }
}

export async function insertSupabaseWithdrawal(wd: WithdrawalRequest): Promise<boolean> {
  try {
    const payload = {
      id: wd.id,
      user_id: wd.userId,
      user_name: wd.userName,
      user_email: wd.userEmail,
      investment_id: wd.investmentId,
      project_title: wd.projectTitle,
      amount: wd.amount,
      payout_method: wd.payoutMethod,
      payout_details: wd.payoutDetails,
      destination_wallet: wd.destinationWallet,
      network: wd.network,
      withdrawal_category: wd.withdrawalCategory,
      requested_at: wd.requestedAt,
      processed_at: wd.processedAt,
      status: wd.status,
      lockup_completed: wd.lockupCompleted,
      rejection_reason: wd.rejectionReason,
      admin_note: wd.adminNote,
      chat_messages: wd.chatMessages,
      receipt_url: wd.receiptUrl,
      tx_hash: wd.txHash,
    };

    const { error: wdErr } = await supabase.from('withdrawals').insert(payload);

    try {
      await supabase.from('transactions').insert({
        id: wd.id,
        user_id: wd.userId,
        user_name: wd.userName,
        user_email: wd.userEmail,
        type: 'withdrawal',
        amount: wd.amount,
        payout_method: wd.payoutMethod,
        payout_details: wd.payoutDetails,
        status: wd.status,
        created_at: wd.requestedAt,
        admin_note: wd.adminNote,
        chat_messages: wd.chatMessages,
        receipt_url: wd.receiptUrl,
        tx_hash: wd.txHash,
      });
    } catch {}

    return !wdErr;
  } catch (err) {
    console.warn('Supabase insertWithdrawal exception:', err);
    return false;
  }
}

export async function updateSupabaseWithdrawal(wd: WithdrawalRequest): Promise<boolean> {
  try {
    const payload = {
      status: wd.status,
      processed_at: wd.processedAt,
      admin_note: wd.adminNote,
      rejection_reason: wd.rejectionReason,
      tx_hash: wd.txHash,
      receipt_url: wd.receiptUrl,
      chat_messages: wd.chatMessages,
      updated_at: new Date().toISOString(),
    };

    const { error: wdErr } = await supabase.from('withdrawals').update(payload).eq('id', wd.id);

    try { await supabase.from('transactions').update(payload).eq('id', wd.id); } catch {}

    return !wdErr;
  } catch (err) {
    console.warn('Supabase updateWithdrawal exception:', err);
    return false;
  }
}

/* =========================================================================
   5. NOTIFICATIONS (Live Alerts & Activity Logs)
   ========================================================================= */

export async function getSupabaseNotifications(userId?: string): Promise<AppNotification[] | null> {
  try {
    let query = supabase.from('notifications').select('*').order('created_at', { ascending: false });
    if (userId) {
      const validUserId = ensureValidUuid(userId);
      query = query.or(`user_id.eq.${userId},user_id.eq.${validUserId},user_id.is.null`);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((n: any): AppNotification => {
      let parsedTitle = n.title;
      if (typeof n.title === 'string' && (n.title.trim().startsWith('{') || n.title.trim().startsWith('['))) {
        try { parsedTitle = JSON.parse(n.title); } catch {}
      }

      let parsedMessage = n.message;
      if (typeof n.message === 'string' && (n.message.trim().startsWith('{') || n.message.trim().startsWith('['))) {
        try { parsedMessage = JSON.parse(n.message); } catch {}
      }

      const isReadVal = n.is_read !== undefined ? Boolean(n.is_read) : Boolean(n.read);

      return {
        id: n.id,
        userId: n.user_id || n.userId,
        type: n.type || 'system',
        status: n.status || 'info',
        title: parsedTitle || n.title || '',
        message: parsedMessage || n.message || '',
        amount: n.amount ? Number(n.amount) : undefined,
        referenceId: n.reference_id || n.referenceId,
        createdAt: n.created_at || n.createdAt || new Date().toISOString(),
        read: isReadVal,
        linkAction: n.link_action || n.linkAction,
      };
    });
  } catch (err) {
    console.warn('Supabase getNotifications exception:', err);
    return [];
  }
}

export async function insertSupabaseNotification(notif: AppNotification): Promise<boolean> {
  try {
    const validId = ensureValidUuid(notif.id);
    const validUserId = notif.userId ? ensureValidUuid(notif.userId) : null;
    const titleStr = typeof notif.title === 'object' ? JSON.stringify(notif.title) : (notif.title || '');
    const messageStr = typeof notif.message === 'object' ? JSON.stringify(notif.message) : (notif.message || '');
    const isReadVal = notif.read ?? false;

    const { error } = await supabase.from('notifications').upsert({
      id: validId,
      user_id: validUserId,
      title: titleStr,
      message: messageStr,
      is_read: isReadVal,
      created_at: notif.createdAt ? new Date(notif.createdAt).toISOString() : new Date().toISOString(),
      // Backward compatibility fields if old column structure exists
      read: isReadVal,
      type: notif.type,
      status: notif.status,
      amount: notif.amount,
      reference_id: notif.referenceId,
      link_action: notif.linkAction,
    }, { onConflict: 'id' });
    return !error;
  } catch (err) {
    console.warn('Supabase insertNotification exception:', err);
    return false;
  }
}

export async function markSupabaseNotificationRead(id: string): Promise<boolean> {
  try {
    const validId = ensureValidUuid(id);
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read: true })
      .or(`id.eq.${id},id.eq.${validId}`);
    return !error;
  } catch (err) {
    console.warn('Supabase markRead exception:', err);
    return false;
  }
}

export async function markAllSupabaseNotificationsRead(userId?: string): Promise<boolean> {
  try {
    let query = supabase.from('notifications').update({ is_read: true, read: true });
    if (userId) {
      const validUserId = ensureValidUuid(userId);
      query = query.or(`user_id.eq.${userId},user_id.eq.${validUserId},user_id.is.null`);
    } else {
      query = query.neq('id', '');
    }
    const { error } = await query;
    return !error;
  } catch (err) {
    console.warn('Supabase markAllRead exception:', err);
    return false;
  }
}

export async function clearSupabaseNotifications(userId?: string): Promise<boolean> {
  try {
    let query = supabase.from('notifications').delete();
    if (userId) {
      const validUserId = ensureValidUuid(userId);
      query = query.or(`user_id.eq.${userId},user_id.eq.${validUserId}`);
    } else {
      query = query.neq('id', '');
    }
    const { error } = await query;
    return !error;
  } catch (err) {
    console.warn('Supabase clearNotifications exception:', err);
    return false;
  }
}

/* =========================================================================
   6. REAL-TIME SUBSCRIPTIONS ACROSS ALL DASHBOARDS
   ========================================================================= */

export function subscribeToSupabaseRealtime({
  onNotification,
  onDepositUpdate,
  onWithdrawalUpdate,
  onProfileUpdate,
  onFleetUpdate,
  onInvestmentUpdate,
  onSupportTicketUpdate,
  onSupportMessageInsert,
}: {
  onNotification?: (notif: AppNotification) => void;
  onDepositUpdate?: (deposit: DepositRequest) => void;
  onWithdrawalUpdate?: (wd: WithdrawalRequest) => void;
  onProfileUpdate?: (user: User) => void;
  onFleetUpdate?: (fleet: Project) => void;
  onInvestmentUpdate?: (inv: Investment) => void;
  onSupportTicketUpdate?: (ticket: SupportTicket) => void;
  onSupportMessageInsert?: (ticketId: string, message: ChatMessage) => void;
} = {}) {
  try {
    const channel = supabase
      .channel('schema-db-all-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        (payload: any) => {
          if (onNotification && payload.new) {
            let parsedTitle = payload.new.title;
            if (typeof payload.new.title === 'string' && (payload.new.title.trim().startsWith('{') || payload.new.title.trim().startsWith('['))) {
              try { parsedTitle = JSON.parse(payload.new.title); } catch {}
            }

            let parsedMessage = payload.new.message;
            if (typeof payload.new.message === 'string' && (payload.new.message.trim().startsWith('{') || payload.new.message.trim().startsWith('['))) {
              try { parsedMessage = JSON.parse(payload.new.message); } catch {}
            }

            const isReadVal = payload.new.is_read !== undefined ? Boolean(payload.new.is_read) : Boolean(payload.new.read);

            onNotification({
              id: payload.new.id,
              userId: payload.new.user_id,
              type: payload.new.type || 'system',
              status: payload.new.status || 'info',
              title: parsedTitle || payload.new.title || '',
              message: parsedMessage || payload.new.message || '',
              amount: payload.new.amount ? Number(payload.new.amount) : undefined,
              referenceId: payload.new.reference_id,
              createdAt: payload.new.created_at || new Date().toISOString(),
              read: isReadVal,
              linkAction: payload.new.link_action,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'deposits' },
        (payload: any) => {
          if (onDepositUpdate && payload.new) {
            onDepositUpdate({
              id: payload.new.id,
              userId: payload.new.user_id || payload.new.userId,
              userName: payload.new.user_name || payload.new.userName || 'Investor',
              userEmail: payload.new.user_email || payload.new.userEmail || '',
              amount: Number(payload.new.amount || 0),
              network: payload.new.network || 'TRC20',
              status: payload.new.status,
              txHash: payload.new.tx_hash,
              receiptUrl: payload.new.receipt_url,
              createdAt: payload.new.created_at || new Date().toISOString(),
              adminNote: payload.new.admin_note,
              userNote: payload.new.user_note,
              chatMessages: payload.new.chat_messages || [],
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'withdrawals' },
        (payload: any) => {
          if (onWithdrawalUpdate && payload.new) {
            onWithdrawalUpdate({
              id: payload.new.id,
              userId: payload.new.user_id || payload.new.userId,
              userName: payload.new.user_name || payload.new.userName || 'Investor',
              userEmail: payload.new.user_email || payload.new.userEmail,
              investmentId: payload.new.investment_id,
              projectTitle: payload.new.project_title,
              amount: Number(payload.new.amount || 0),
              payoutMethod: payload.new.payout_method || 'USDT_TRC20',
              payoutDetails: payload.new.payout_details || '',
              destinationWallet: payload.new.destination_wallet,
              network: payload.new.network,
              withdrawalCategory: payload.new.withdrawal_category,
              requestedAt: payload.new.requested_at || payload.new.created_at || new Date().toISOString(),
              processedAt: payload.new.processed_at,
              status: payload.new.status,
              lockupCompleted: payload.new.lockup_completed,
              rejectionReason: payload.new.rejection_reason,
              adminNote: payload.new.admin_note,
              txHash: payload.new.tx_hash,
              receiptUrl: payload.new.receipt_url,
              chatMessages: payload.new.chat_messages || [],
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload: any) => {
          if (onProfileUpdate && payload.new) {
            onProfileUpdate({
              id: payload.new.id,
              name: payload.new.name || '',
              email: payload.new.email || '',
              role: payload.new.role || 'investor',
              usdtBalance: Number(payload.new.usdt_balance ?? payload.new.balance ?? 0),
              kycStatus: payload.new.kyc_status || 'not_submitted',
              accountStatus: payload.new.account_status || 'active',
              totalInvested: Number(payload.new.total_invested ?? 0),
              totalRoiEarned: Number(payload.new.total_roi_earned ?? 0),
              phone: payload.new.phone,
              governorate: payload.new.governorate,
              joinedDate: payload.new.joined_date,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fleets' },
        (payload: any) => {
          if (onFleetUpdate && payload.new) {
            getSupabaseFleets().then((fleets) => {
              const updated = fleets.find((f) => f.id === payload.new.id);
              if (updated) onFleetUpdate(updated);
            }).catch(() => {});
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'investments' },
        (payload: any) => {
          if (onInvestmentUpdate && payload.new) {
            onInvestmentUpdate({
              id: payload.new.id,
              userId: payload.new.user_id,
              projectId: payload.new.project_id || payload.new.fleet_id,
              projectTitle: payload.new.project_title,
              category: payload.new.category || 'cargo_freight',
              amount: Number(payload.new.amount || 0),
              monthlyRoiPercent: Number(payload.new.monthly_roi_percent || 4.5),
              startDate: payload.new.start_date || new Date().toISOString(),
              endDate: payload.new.end_date || new Date().toISOString(),
              lockupMonths: Number(payload.new.lockup_months || 5),
              status: payload.new.status || 'active',
              accruedRoi: Number(payload.new.accrued_roi || 0),
              lastPayoutDate: payload.new.last_payout_date || new Date().toISOString(),
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'support_tickets' },
        (payload: any) => {
          if (onSupportTicketUpdate && payload.new) {
            onSupportTicketUpdate({
              id: payload.new.id,
              userId: payload.new.user_id || '',
              fullName: payload.new.full_name || 'مستثمر',
              phone: payload.new.phone || '',
              email: payload.new.email || '',
              subject: payload.new.subject || 'General',
              status: payload.new.status || 'open',
              createdAt: payload.new.created_at || new Date().toISOString(),
              updatedAt: payload.new.updated_at || new Date().toISOString(),
              messages: [],
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_messages' },
        (payload: any) => {
          if (onSupportMessageInsert && payload.new) {
            onSupportMessageInsert(payload.new.ticket_id, {
              id: payload.new.id,
              sender: (payload.new.sender_role || 'user') as any,
              text: payload.new.message || '',
              timestamp: payload.new.created_at || new Date().toISOString(),
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Realtime subscription not active:', err);
    return () => {};
  }
}

/* =========================================================================
   10. FORGOT PASSWORD & ADMIN SECURITY REVIEW
   ========================================================================= */

export interface PasswordResetRequest {
  email: string;
  phone: string;
  nationalIdNumber: string;
  newPassword: string;
  idFrontImage: string;
  idBackImage: string;
  residenceCardImage: string;
  selfieImage: string;
}

/**
 * Submit password reset request with KYC identity documents to backend and Supabase
 */
export async function submitPasswordResetRequest(
  data: PasswordResetRequest
): Promise<{ success: boolean; message: string; error: string | null }> {
  try {
    console.log('🚀 [Supabase/API] Submitting Password Reset Request for:', data.email);

    // 1. Submit to server endpoint
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const resData = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: '',
        error: resData.error || 'فشل إرسال طلب إعادة تعيين كلمة المرور',
      };
    }

    // 2. Direct Supabase insert attempt for client backup if configured
    if (isSupabaseClientConfigured()) {
      try {
        const { error: sbErr } = await supabase.from('password_reset_requests').insert([
          {
            email: data.email.trim().toLowerCase(),
            phone: data.phone,
            national_id_number: data.nationalIdNumber,
            new_password: data.newPassword,
            id_front_image: data.idFrontImage,
            id_back_image: data.idBackImage,
            residence_card_image: data.residenceCardImage,
            selfie_image: data.selfieImage,
            status: 'pending',
            created_at: new Date().toISOString(),
          },
        ]);

        if (sbErr) {
          console.warn('⚠️ [Supabase Client] password_reset_requests insert note:', sbErr.message);
        } else {
          console.log('✅ [Supabase Client] Password reset request logged to Supabase.');
        }
      } catch (sbEx) {
        console.warn('⚠️ [Supabase Client Exception]:', sbEx);
      }
    }

    return {
      success: true,
      message: resData.message || 'Request sent successfully. Your password will be updated within 2 to 24 hours',
      error: null,
    };
  } catch (err: any) {
    console.error('❌ [Password Reset Exception]:', err);
    return {
      success: false,
      message: '',
      error: err?.message || 'حدث خطأ في الاتصال أثناء إرسال الطلب',
    };
  }
}

/* =========================================================================
   7. SYSTEM STATUS & ADMIN SETTINGS (Pause Deposits/Withdrawals Persistence)
   ========================================================================= */

export async function getSupabaseAdminSettings(): Promise<Partial<AdminSettings> | null> {
  if (!isSupabaseClientConfigured()) return null;
  try {
    const { data, error } = await supabase.from('system_settings').select('*').limit(1).maybeSingle();
    if (error || !data) return null;

    let p2pInst = { ar: '', en: '', ckb: '' };
    if (typeof data.p2p_bank_instructions === 'string') {
      try { p2pInst = JSON.parse(data.p2p_bank_instructions); } catch {}
    } else if (data.p2p_bank_instructions) {
      p2pInst = data.p2p_bank_instructions;
    }

    let annMsg = { ar: '', en: '', ckb: '' };
    if (typeof data.announcement_message === 'string') {
      try { annMsg = JSON.parse(data.announcement_message); } catch {}
    } else if (data.announcement_message) {
      annMsg = data.announcement_message;
    }

    return {
      trc20Address: data.trc20_address || data.trc20Address || undefined,
      bep20Address: data.bep20_address || data.bep20Address || undefined,
      p2pBankInstructions: p2pInst,
      announcementMessage: annMsg,
      defaultMonthlyRoi: data.default_monthly_roi ? Number(data.default_monthly_roi) : undefined,
      minDepositUsdt: data.min_deposit_usdt ? Number(data.min_deposit_usdt) : undefined,
      pauseDeposits: data.pause_deposits !== undefined ? Boolean(data.pause_deposits) : data.pauseDeposits !== undefined ? Boolean(data.pauseDeposits) : undefined,
      pauseWithdrawals: data.pause_withdrawals !== undefined ? Boolean(data.pause_withdrawals) : data.pauseWithdrawals !== undefined ? Boolean(data.pauseWithdrawals) : undefined,
      registrationEnabled: data.registration_enabled !== undefined ? Boolean(data.registration_enabled) : data.registrationEnabled !== undefined ? Boolean(data.registrationEnabled) : data.allow_registration !== undefined ? Boolean(data.allow_registration) : undefined,
    };
  } catch (err) {
    console.warn('⚠️ [Supabase Client] getSupabaseAdminSettings notice:', err);
    return null;
  }
}

export async function upsertSupabaseAdminSettings(settings: Partial<AdminSettings>): Promise<boolean> {
  if (!isSupabaseClientConfigured()) return false;
  try {
    const payload: any = {
      id: '1',
      updated_at: new Date().toISOString(),
    };
    if (settings.pauseDeposits !== undefined) payload.pause_deposits = settings.pauseDeposits;
    if (settings.pauseWithdrawals !== undefined) payload.pause_withdrawals = settings.pauseWithdrawals;
    if (settings.registrationEnabled !== undefined) payload.registration_enabled = settings.registrationEnabled;
    if (settings.trc20Address !== undefined) payload.trc20_address = settings.trc20Address;
    if (settings.bep20Address !== undefined) payload.bep20_address = settings.bep20Address;
    if (settings.announcementMessage !== undefined) payload.announcement_message = JSON.stringify(settings.announcementMessage);

    const { error } = await supabase.from('system_settings').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('⚠️ [Supabase Client] system_settings upsert error:', error.message);
      return false;
    }
    console.log('✅ [Supabase Client] System status settings updated successfully in Supabase.');
    return true;
  } catch (err) {
    console.warn('⚠️ [Supabase Client] upsertSupabaseAdminSettings exception:', err);
    return false;
  }
}

/**
 * Fetch and load news from Supabase admin_news table
 */
export async function getSupabaseAdminNews(): Promise<NewsArticle[] | null> {
  if (!isSupabaseClientConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('admin_news')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("خطأ في جلب الأخبار:", error.message);
      return null;
    }

    if (!data) return null;

    console.log("الأخبار المسترجعة:", data);

    return data.map((item: any) => {
      let titleVal = item.title;
      let contentVal = item.content;

      if (typeof item.title === 'string' && item.title.startsWith('{')) {
        try { titleVal = JSON.parse(item.title); } catch {}
      }
      if (typeof item.content === 'string' && item.content.startsWith('{')) {
        try { contentVal = JSON.parse(item.content); } catch {}
      }

      return {
        id: item.id,
        title: titleVal || item.title_ar || 'إعلان إداري',
        content: contentVal || item.content_ar || '',
        category: item.category || 'announcement',
        imageUrl: item.image_url || item.imageUrl || 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80',
        isPinned: Boolean(item.is_pinned || item.isPinned),
        publishedAt: item.created_at || item.publishedAt || new Date().toISOString(),
        author: item.author || 'إدارة الأصيل',
      };
    });
  } catch (err: any) {
    console.error("خطأ في جلب الأخبار من Supabase:", err?.message || err);
    return null;
  }
}

/**
 * Upsert news article into Supabase admin_news table
 */
export async function upsertSupabaseAdminNews(article: NewsArticle): Promise<boolean> {
  if (!isSupabaseClientConfigured()) return false;
  try {
    const titleVal = typeof article.title === 'object' ? JSON.stringify(article.title) : article.title;
    const contentVal = typeof article.content === 'object' ? JSON.stringify(article.content) : article.content;

    const payload: any = {
      id: article.id,
      title: titleVal,
      content: contentVal,
      category: article.category || 'announcement',
      image_url: article.imageUrl || null,
      is_pinned: Boolean(article.isPinned),
      created_at: article.publishedAt || new Date().toISOString(),
    };

    const { error } = await supabase.from('admin_news').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('⚠️ [Supabase Client] admin_news upsert error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('⚠️ [Supabase Client] upsertSupabaseAdminNews exception:', err);
    return false;
  }
}

/**
 * Delete news article from Supabase admin_news table
 */
export async function deleteSupabaseAdminNews(id: string): Promise<boolean> {
  if (!isSupabaseClientConfigured()) return false;
  try {
    const { error } = await supabase.from('admin_news').delete().eq('id', id);
    if (error) {
      console.warn('⚠️ [Supabase Client] admin_news delete error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('⚠️ [Supabase Client] deleteSupabaseAdminNews exception:', err);
    return false;
  }
}

/**
 * Fetch freight trips from Supabase freight_trips table if available
 */
export async function getSupabaseTrips(): Promise<FreightTrip[] | null> {
  if (!isSupabaseClientConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('freight_trips')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      return null;
    }

    return data.map((item: any) => ({
      id: item.id || `trip-${Math.random()}`,
      projectId: item.project_id || item.projectId,
      planId: item.plan_id || item.planId,
      projectTitle: item.project_title || item.projectTitle,
      tripNumber: item.trip_number || item.tripNumber || 'TRIP-00',
      originRoute: item.origin_route || item.originRoute || 'بغداد ➔ البصرة',
      cargoStatus: item.cargo_status || item.cargoStatus || 'delivered',
      date: item.date || new Date().toISOString().split('T')[0],
      revenueUsdt: Number(item.revenue_usdt || item.revenueUsdt || 0),
      vehiclePlate: item.vehicle_plate || item.vehiclePlate,
      notes: item.notes,
      createdAt: item.created_at || item.createdAt || new Date().toISOString(),
    }));
  } catch (err) {
    return null;
  }
}

/**
 * Log admin action into Supabase admin_activity_logs table
 */
export async function logSupabaseAdminActivity(log: {
  admin_id: string;
  target_user_id?: string | null;
  action: string;
  details: Record<string, any>;
}): Promise<boolean> {
  if (!isSupabaseClientConfigured()) return false;
  try {
    const payload = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      admin_id: log.admin_id,
      target_user_id: log.target_user_id || null,
      action: log.action,
      details: log.details || {},
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('admin_activity_logs').insert(payload);
    if (error) {
      console.warn('⚠️ [Supabase Client] admin_activity_logs insert error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('⚠️ [Supabase Client] logSupabaseAdminActivity exception:', err);
    return false;
  }
}

/**
 * Fetch admin activity logs from Supabase admin_activity_logs table
 */
export async function getSupabaseAdminActivityLogs(): Promise<AdminActivityLog[] | null> {
  if (!isSupabaseClientConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('admin_activity_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      return null;
    }

    return data.map((item: any) => ({
      id: item.id || `log-${Math.random()}`,
      admin_id: item.admin_id,
      target_user_id: item.target_user_id,
      action: item.action,
      details: typeof item.details === 'string' ? JSON.parse(item.details) : item.details || {},
      created_at: item.created_at || new Date().toISOString(),
    }));
  } catch (err) {
    return null;
  }
}

/* =========================================================================
   REFERRALS (public.referrals)
   ========================================================================= */

/**
 * Fetch referrals from public.referrals
 */
export async function getSupabaseReferrals(referrerId?: string): Promise<ReferralRecord[] | null> {
  if (!isSupabaseClientConfigured()) return null;
  try {
    let query = supabase.from('referrals').select('*').order('created_at', { ascending: false });
    if (referrerId) {
      const validRefId = ensureValidUuid(referrerId);
      query = query.or(`referrer_id.eq.${referrerId},referrer_id.eq.${validRefId}`);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((item: any) => ({
      id: item.id,
      inviterId: item.referrer_id || item.inviter_id || referrerId || '',
      inviterName: item.inviter_name || item.inviterName || 'مستثمر',
      inviterEmail: item.inviter_email || item.inviterEmail || '',
      inviterCode: item.code || item.inviter_code || item.inviterCode || '',
      invitedUserId: item.referred_id || item.invited_user_id || item.invitedUserId || '',
      invitedUserName: item.invited_user_name || item.invitedUserName || 'عضو مدعو',
      invitedUserEmail: item.invited_user_email || item.invitedUserEmail || '',
      status: item.status || 'pending',
      rewardAmount: Number(item.reward_amount || item.rewardAmount || 0),
      tierApplied: Number(item.tier_applied || item.tierApplied || 1),
      createdAt: item.created_at || new Date().toISOString(),
    }));
  } catch (err) {
    console.warn('⚠️ [Supabase Client] getSupabaseReferrals exception:', err);
    return [];
  }
}

/**
 * Upsert referral into public.referrals table
 */
export async function upsertSupabaseReferral(referral: {
  id?: string;
  referrerId: string;
  referredId: string;
  code: string;
  status?: string;
  createdAt?: string;
}): Promise<boolean> {
  if (!isSupabaseClientConfigured()) return false;
  try {
    const validId = ensureValidUuid(referral.id || `ref-${Date.now()}`);
    const validReferrerId = ensureValidUuid(referral.referrerId);
    const validReferredId = ensureValidUuid(referral.referredId);

    const payload = {
      id: validId,
      referrer_id: validReferrerId,
      referred_id: validReferredId,
      code: referral.code || '',
      status: referral.status || 'pending',
      created_at: referral.createdAt || new Date().toISOString(),
    };

    const { error } = await supabase.from('referrals').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('⚠️ [Supabase Client] referrals upsert error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('⚠️ [Supabase Client] upsertSupabaseReferral exception:', err);
    return false;
  }
}

/* =========================================================================
   SUPPORT TICKETS & MESSAGES (public.support_tickets, public.support_messages)
   ========================================================================= */

/**
 * Fetch all support tickets with their associated messages from Supabase
 */
export async function getSupabaseSupportTickets(userId?: string): Promise<SupportTicket[]> {
  if (!isSupabaseClientConfigured() || !supabase) return [];
  try {
    let query = supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
    if (userId) {
      const validUserId = ensureValidUuid(userId);
      query = query.or(`user_id.eq.${userId},user_id.eq.${validUserId}`);
    }
    const { data: ticketsData, error: ticketsError } = await query;
    if (ticketsError || !ticketsData) return [];

    const ticketIds = ticketsData.map((t: any) => t.id);
    let messagesMap: Record<string, ChatMessage[]> = {};

    if (ticketIds.length > 0) {
      const { data: msgsData, error: msgsError } = await supabase
        .from('support_messages')
        .select('*')
        .in('ticket_id', ticketIds)
        .order('created_at', { ascending: true });

      if (!msgsError && msgsData) {
        msgsData.forEach((m: any) => {
          if (!messagesMap[m.ticket_id]) messagesMap[m.ticket_id] = [];
          messagesMap[m.ticket_id].push({
            id: m.id,
            sender: (m.sender_role || 'user') as any,
            text: m.message || '',
            timestamp: m.created_at || new Date().toISOString(),
          });
        });
      }
    }

    return ticketsData.map((t: any) => ({
      id: t.id,
      userId: t.user_id || '',
      fullName: t.full_name || 'مستثمر',
      phone: t.phone || '',
      email: t.email || '',
      subject: t.subject || 'General',
      status: t.status || 'open',
      createdAt: t.created_at || new Date().toISOString(),
      updatedAt: t.updated_at || new Date().toISOString(),
      messages: messagesMap[t.id] || [],
    }));
  } catch (err) {
    console.warn('⚠️ Exception fetching support tickets from Supabase:', err);
    return [];
  }
}

/**
 * Insert or update a support ticket and its initial messages in Supabase
 */
export async function insertSupabaseSupportTicket(ticket: SupportTicket): Promise<SupportTicket | null> {
  if (!isSupabaseClientConfigured() || !supabase) return null;
  try {
    const validUserId = ticket.userId ? ensureValidUuid(ticket.userId) : null;
    const ticketPayload = {
      id: ticket.id,
      user_id: validUserId,
      full_name: ticket.fullName,
      phone: ticket.phone,
      email: ticket.email,
      subject: ticket.subject || 'Financial & Technical Support',
      status: ticket.status || 'open',
      created_at: ticket.createdAt || new Date().toISOString(),
      updated_at: ticket.updatedAt || new Date().toISOString(),
    };

    const { error: ticketError } = await supabase.from('support_tickets').upsert(ticketPayload, { onConflict: 'id' });
    if (ticketError) {
      console.warn('⚠️ Error inserting support ticket to Supabase:', ticketError.message);
    }

    if (ticket.messages && ticket.messages.length > 0) {
      for (const m of ticket.messages) {
        const msgUuid = ensureValidUuid(m.id.startsWith('msg-') ? undefined : m.id);
        await supabase.from('support_messages').upsert({
          id: msgUuid,
          ticket_id: ticket.id,
          sender_id: validUserId,
          sender_role: m.sender || 'user',
          sender_name: ticket.fullName,
          message: m.text,
          created_at: m.timestamp || new Date().toISOString(),
        }, { onConflict: 'id' }).catch((e) => {
          console.warn('⚠️ Error inserting support message:', e);
        });
      }
    }

    return ticket;
  } catch (err) {
    console.warn('⚠️ Exception inserting support ticket to Supabase:', err);
    return null;
  }
}

/**
 * Insert a message for a support ticket into public.support_messages
 */
export async function insertSupabaseSupportMessage(
  ticketId: string,
  message: ChatMessage
): Promise<ChatMessage | null> {
  if (!isSupabaseClientConfigured() || !supabase) return null;
  try {
    const msgUuid = ensureValidUuid(message.id.startsWith('msg-') ? undefined : message.id);
    const payload = {
      id: msgUuid,
      ticket_id: ticketId,
      sender_role: message.sender || 'user',
      message: message.text,
      created_at: message.timestamp || new Date().toISOString(),
    };

    const { error } = await supabase.from('support_messages').upsert([payload], { onConflict: 'id' });
    if (error) {
      console.warn('⚠️ Error inserting support message to Supabase:', error.message);
    }

    await supabase
      .from('support_tickets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', ticketId)
      .catch(() => {});

    return message;
  } catch (err) {
    console.warn('⚠️ Exception inserting support message to Supabase:', err);
    return null;
  }
}

/**
 * Update a support ticket status in Supabase
 */
export async function updateSupabaseSupportTicketStatus(
  ticketId: string,
  status: string
): Promise<boolean> {
  if (!isSupabaseClientConfigured() || !supabase) return false;
  try {
    const { error } = await supabase
      .from('support_tickets')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', ticketId);

    if (error) {
      console.warn('⚠️ Error updating support ticket status in Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('⚠️ Exception updating support ticket status in Supabase:', err);
    return false;
  }
}


