import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, ArrowLeft, LogOut, Lock } from 'lucide-react';
import { Language, User } from '../types';
import { translations } from '../i18n/translations';

interface AccessDeniedProps {
  lang: Language;
  user: User | null;
  onReturnToClient: () => void;
  onLogout: () => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  lang,
  user,
  onReturnToClient,
  onLogout,
}) => {
  const t = translations[lang] || translations.ar;
  const isRtl = lang === 'ar' || lang === 'ckb';

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden"
    >
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl text-center relative z-10 backdrop-blur-xl ring-1 ring-rose-500/20"
      >
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-4 sm:mb-5 shadow-lg shadow-rose-500/10">
          <ShieldAlert className="w-6 h-6 sm:w-8 sm:h-8" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] sm:text-xs font-bold mb-2 sm:mb-3">
          <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span>{t.adminOnlyBadge}</span>
        </div>

        <h2 className="text-lg sm:text-xl font-bold text-slate-100 mb-2">
          {t.accessDeniedTitle}
        </h2>

        <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed mb-5 sm:mb-6">
          {t.accessDeniedDesc}
        </p>

        {user && (
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl sm:rounded-2xl p-3 sm:p-3.5 mb-5 sm:mb-6 text-right rtl:text-right ltr:text-left flex items-center justify-between text-xs">
            <div>
              <div className="text-slate-400 font-medium text-[11px] sm:text-xs">الحساب الحالي:</div>
              <div className="font-bold text-slate-200 mt-0.5 text-xs sm:text-sm">{user.name}</div>
            </div>
            <div className="px-2 sm:px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold uppercase text-[10px]">
              {user.role}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
          <button
            onClick={onReturnToClient}
            className="flex-1 py-2.5 sm:py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            <span>{t.backToClientPortal}</span>
          </button>

          <button
            onClick={onLogout}
            className="py-2.5 sm:py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 font-semibold text-xs flex items-center justify-center gap-2 transition-all border border-slate-700/80"
          >
            <LogOut className="w-4 h-4" />
            <span>{t.logoutBtn}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
