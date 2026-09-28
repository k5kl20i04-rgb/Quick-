import React, { useState } from 'react';
import { X, Settings, Shield, Bell, Check, Lock, Smartphone, Mail, Sparkles } from 'lucide-react';
import { Language, User } from '../types';
import { translations } from '../i18n/translations';

interface SettingsModalProps {
  currentLang: Language;
  user: User;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  currentLang,
  user,
  onClose,
}) => {
  const t = translations[currentLang] || translations.ar;

  const [smsAlerts, setSmsAlerts] = useState(true);
  const [emailReceipts, setEmailReceipts] = useState(true);
  const [roiNotifications, setRoiNotifications] = useState(true);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-5 relative max-h-[92vh] overflow-y-auto text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 sm:pb-4">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">{t.settingsModalTitle}</h2>
              <p className="text-xs text-slate-400">{user?.email}</p>
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

        {savedSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{currentLang === 'ar' ? 'تم حفظ التغييرات بنجاح!' : 'Settings saved successfully!'}</span>
          </div>
        )}

        <form noValidate onSubmit={handleSave} className="space-y-4">
          
          {/* Notifications Preferences Section */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5" />
              <span>{t.notificationPreferences}</span>
            </h3>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3">
              
              <label className="flex items-center justify-between text-xs cursor-pointer">
                <div className="flex items-center gap-2 text-slate-300">
                  <Smartphone className="w-4 h-4 text-slate-400" />
                  <span>{t.smsAlerts}</span>
                </div>
                <input
                  type="checkbox"
                  checked={smsAlerts}
                  onChange={(e) => setSmsAlerts(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-amber-500/30"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer border-t border-slate-800/60 pt-2.5">
                <div className="flex items-center gap-2 text-slate-300">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>{t.emailReceipts}</span>
                </div>
                <input
                  type="checkbox"
                  checked={emailReceipts}
                  onChange={(e) => setEmailReceipts(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-amber-500/30"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer border-t border-slate-800/60 pt-2.5">
                <div className="flex items-center gap-2 text-slate-300">
                  <Sparkles className="w-4 h-4 text-slate-400" />
                  <span>{t.roiNotifications}</span>
                </div>
                <input
                  type="checkbox"
                  checked={roiNotifications}
                  onChange={(e) => setRoiNotifications(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-amber-500/30"
                />
              </label>

            </div>
          </div>

          {/* Security & Password Section */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>{t.securitySettings}</span>
            </h3>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  {currentLang === 'ar' ? 'كلمة المرور الحالية' : 'Current Password'}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-500 absolute right-3 rtl:right-auto rtl:left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  {currentLang === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
                </label>
                <input
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>{t.saveChanges}</span>
          </button>

        </form>

      </div>
    </div>
  );
};
