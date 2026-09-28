import React, { useState, useEffect } from 'react';
import { Users, Activity, MapPin, X, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Language, OnlineUser } from '../types';
import { translations } from '../i18n/translations';
import { supabase, isSupabaseClientConfigured } from '../lib/supabaseClient';

interface OnlineMembersWidgetProps {
  currentLang: Language;
}

export const OnlineMembersWidget: React.FC<OnlineMembersWidgetProps> = ({ currentLang }) => {
  const t = translations[currentLang] || translations.ar;
  const [isOpen, setIsOpen] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const setOnlineMembers = (realUsers: any[]) => {
    const uniqueMap = new Map<string, OnlineUser>();
    realUsers.forEach((u: any) => {
      if (u.id && !uniqueMap.has(u.id)) {
        const wList = Array.isArray(u.wallets) ? u.wallets : (u.wallets ? [u.wallets] : []);
        const w = wList[0];
        const bal = w ? Number(w.available_balance || 0) : 0;
        const email = (u.email || '').toLowerCase();
        const isFounder = email === 'goog7029766@gmail.com';

        uniqueMap.set(u.id, {
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

    const mapped = Array.from(uniqueMap.values());
    setOnlineUsers(mapped);
    setOnlineCount(mapped.length);
  };

  // Ping heartbeat & fetch online users directly from Supabase profiles + wallets
  const fetchOnlineUsers = async () => {
    try {
      // Send ping heartbeat
      fetch('/api/user/ping', { method: 'POST' }).catch(() => {});

      if (isSupabaseClientConfigured()) {
        const { data: realUsers, error } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            email,
            phone,
            role,
            province,
            governorate,
            wallets (
              available_balance,
              locked_capital
            )
          `);

        if (!error && realUsers && realUsers.length > 0) {
          // ربط القائمة بالبيانات الحقيقية القادمة من قاعدة البيانات فوراً
          setOnlineMembers(realUsers);
          return;
        }
      }

      const res = await fetch('/api/online-users');
      if (res.ok) {
        const data = await res.json();
        if (data.users) setOnlineUsers(data.users);
        if (data.onlineCount) setOnlineCount(data.onlineCount);
      }
    } catch (err) {
      console.warn('Failed to fetch online members', err);
    }
  };

  useEffect(() => {
    fetchOnlineUsers();
    const interval = setInterval(fetchOnlineUsers, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Trigger Button Widget */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 rtl:space-x-reverse px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs transition-all shadow-sm cursor-pointer"
        title={currentLang === 'ar' ? 'عرض الأعضاء المتواجدين الآن' : 'View Online Members'}
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <Users className="w-3.5 h-3.5 text-emerald-400" />
        <span className="font-mono">{onlineCount}</span>
        <span className="hidden sm:inline text-[11px]">
          {currentLang === 'ar' ? 'متواجد الآن' : currentLang === 'ckb' ? 'ئۆنلاینن' : 'Online'}
        </span>
      </button>

      {/* Online Members List Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-5 overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
                <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Activity className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <span>{currentLang === 'ar' ? 'الأعضاء المتواجدون الآن' : 'Online Members'}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold">
                      {onlineCount}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {currentLang === 'ar' ? 'حالة التواجد المباشرة للمستثمرين في المنصة' : 'Real-time online activity feed across regions'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Members List Scroll */}
            <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1 text-xs">
              {onlineUsers.length === 0 ? (
                <p className="text-slate-500 text-center py-6">
                  {currentLang === 'ar' ? 'جاري تحميل قائمة المتواجدين...' : 'Loading online members...'}
                </p>
              ) : (
                onlineUsers.map((user) => (
                  <div
                    key={user.id}
                    className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-emerald-500/30 transition-all flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center space-x-3 rtl:space-x-reverse min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-amber-400 text-sm uppercase">
                          {user.name.charAt(0)}
                        </div>
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-950" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-white text-xs">{user.name}</span>
                          <span className="font-mono text-[9px] text-amber-400/90 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20" title={`Supabase UUID: ${user.id}`}>
                            ID: {user.id.length > 8 ? user.id.substring(0, 8) : user.id}
                          </span>
                          {user.role === 'admin' ? (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[10px] font-extrabold border border-amber-500/30">
                              {currentLang === 'ar' ? 'مؤسس/إدارة' : 'Founder'}
                            </span>
                          ) : (
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          )}
                        </div>
                        {(user.email || user.phone) && (
                          <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5 flex items-center gap-1.5">
                            {user.email && <span>{user.email}</span>}
                            {user.email && user.phone && <span>•</span>}
                            {user.phone && <span>{user.phone}</span>}
                          </div>
                        )}
                        <div className="flex items-center space-x-2 rtl:space-x-reverse text-[11px] text-slate-400 mt-0.5 flex-wrap">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span>{user.governorate || 'العراق'}</span>
                          </span>
                          <span>•</span>
                          <span className="text-emerald-400 font-medium">{user.lastActive || 'نشط الآن'}</span>
                        </div>
                      </div>
                    </div>

                    <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 shrink-0">
                      ● {currentLang === 'ar' ? 'متصل' : 'Online'}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-slate-800 text-center">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all"
              >
                {currentLang === 'ar' ? 'إغلاق القائمة' : 'Close'}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
