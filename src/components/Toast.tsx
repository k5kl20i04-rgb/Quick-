import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
  isRtl?: boolean;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss, isRtl = false }) => {
  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="fixed top-4 sm:top-6 right-4 sm:right-6 left-4 sm:left-auto z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
};

interface ToastItemProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const duration = toast.duration || 4000;

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast.id, duration, onDismiss]);

  const getStyle = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200',
          iconBg: 'bg-emerald-500/20 text-emerald-400',
          bar: 'bg-emerald-500',
          Icon: CheckCircle2,
        };
      case 'error':
        return {
          bg: 'bg-rose-950/90 border-rose-500/40 text-rose-200',
          iconBg: 'bg-rose-500/20 text-rose-400',
          bar: 'bg-rose-500',
          Icon: AlertCircle,
        };
      case 'info':
      default:
        return {
          bg: 'bg-amber-950/90 border-amber-500/40 text-amber-200',
          iconBg: 'bg-amber-500/20 text-amber-400',
          bar: 'bg-amber-500',
          Icon: Info,
        };
    }
  };

  const style = getStyle();
  const IconComponent = style.Icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`pointer-events-auto relative overflow-hidden rounded-2xl border p-3.5 sm:p-4 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 ${style.bg}`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-1.5 rounded-xl shrink-0 ${style.iconBg}`}>
          <IconComponent className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0 pr-1">
          {toast.title && <h4 className="text-xs font-bold text-white mb-0.5">{toast.title}</h4>}
          <p className="text-xs font-medium leading-relaxed opacity-95">{toast.message}</p>
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 shrink-0"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Animated timer bar */}
      <motion.div
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
        className={`absolute bottom-0 left-0 right-0 h-1 ${style.bar}`}
      />
    </motion.div>
  );
};
