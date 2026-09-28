import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ShieldCheck,
  Clock,
  Send,
  Lock,
  Unlock,
  RotateCcw,
  Headset,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Language, User, SupportTicket } from '../types';
import { translations } from '../i18n/translations';

interface SupportModalAndChatProps {
  currentLang: Language;
  user: User;
  supportTickets?: SupportTicket[];
  onClose: () => void;
  onConnectSupport?: () => Promise<SupportTicket>;
  onSendSupportChatMessage: (ticketId: string, text: string) => Promise<void>;
}

export const SupportModalAndChat: React.FC<SupportModalAndChatProps> = ({
  currentLang,
  user,
  supportTickets = [],
  onClose,
  onConnectSupport,
  onSendSupportChatMessage,
}) => {
  const t = translations[currentLang] || translations.ar;

  // Find user's active support ticket
  const userTickets = supportTickets.filter((t) => t.userId === user?.id);
  const existingActive =
    userTickets.find(
      (t) =>
        t.status === 'pending_approval' ||
        t.status === 'pending' ||
        t.status === 'open' ||
        t.status === 'unlocked'
    ) || userTickets[0] || null;

  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(existingActive);
  const [loading, setLoading] = useState<boolean>(false);

  // Live Chat Message State
  const [chatInput, setChatInput] = useState<string>('');
  const [isSendingMsg, setIsSendingMsg] = useState<boolean>(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 3-Minute Countdown timer for Step 1 (180 seconds = 03:00)
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(180);

  // Auto connect on mount if no active support ticket exists
  useEffect(() => {
    if (existingActive) {
      setActiveTicket(existingActive);
    } else if (onConnectSupport && !activeTicket) {
      setLoading(true);
      onConnectSupport()
        .then((tk) => setActiveTicket(tk))
        .catch((err) => console.error('Error connecting support session:', err))
        .finally(() => setLoading(false));
    }
  }, [existingActive?.id, existingActive?.status]);

  // Keep activeTicket updated in real-time with changes from external supportTickets list
  useEffect(() => {
    if (activeTicket) {
      const updated = supportTickets.find((t) => t.id === activeTicket.id);
      if (updated) {
        const currentMsgs = JSON.stringify(activeTicket.messages || []);
        const updatedMsgs = JSON.stringify(updated.messages || []);
        if (updated.status !== activeTicket.status || currentMsgs !== updatedMsgs) {
          setActiveTicket(updated);
        }
      }
    } else if (supportTickets.length > 0) {
      const userTk = supportTickets.find((t) => t.userId === user?.id);
      if (userTk) setActiveTicket(userTk);
    }
  }, [supportTickets, activeTicket]);

  // Step 1: 3-Minute Countdown calculation (180 seconds = 03:00)
  useEffect(() => {
    if (
      activeTicket &&
      (activeTicket.status === 'pending_approval' || activeTicket.status === 'pending')
    ) {
      const createdTime = new Date(activeTicket.createdAt).getTime();
      const now = Date.now();
      const elapsedSec = Math.floor((now - createdTime) / 1000);
      const remaining = Math.max(0, 180 - elapsedSec);
      setTimeLeftSeconds(isNaN(remaining) ? 180 : remaining);
    } else if (!activeTicket) {
      setTimeLeftSeconds(180);
    }
  }, [activeTicket?.id, activeTicket?.createdAt, activeTicket?.status]);

  // 1-second interval timer
  useEffect(() => {
    if (
      !activeTicket ||
      activeTicket.status === 'pending_approval' ||
      activeTicket.status === 'pending'
    ) {
      const timer = setInterval(() => {
        setTimeLeftSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [activeTicket?.status]);

  // Scroll chat feed to bottom on new message strictly within inner container
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [activeTicket?.messages]);

  // Format countdown as MM:SS
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle sending chat message
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !chatInput.trim() || isSendingMsg) return;

    // Only allow sending if chat is unlocked / accepted
    if (activeTicket.status === 'pending_approval' || activeTicket.status === 'pending') {
      return;
    }

    try {
      setIsSendingMsg(true);
      const msgText = chatInput.trim();
      setChatInput('');
      await onSendSupportChatMessage(activeTicket.id, msgText);
    } catch (err) {
      console.error('Failed to send support chat message', err);
    } finally {
      setIsSendingMsg(false);
    }
  };

  const isPending =
    !activeTicket ||
    activeTicket.status === 'pending_approval' ||
    activeTicket.status === 'pending';

  const labels = {
    step1Badge:
      currentLang === 'ar'
        ? '[الخطوة 1: بانتظار ربط وكيل الدعم الفني]'
        : currentLang === 'ckb'
        ? '[هەنگاوی ١: چاودێری بەستنەوەی نوێنەری پشتیوانی]'
        : '[Step 1: Awaiting Support Agent Connection]',
    step2Badge:
      currentLang === 'ar'
        ? '[الخطوة 2: تم الربط بوكيل الدعم المباشر]'
        : currentLang === 'ckb'
        ? '[هەنگاوی ٢: بەستنەوەی سەرکەوتوو بە نوێنەر]'
        : '[Step 2: Connected to Support Agent]',
    titlePending:
      currentLang === 'ar'
        ? 'طلب الاتصال بالدعم المالي والفني قيد الانتظار'
        : currentLang === 'ckb'
        ? 'داواکاری بەستنەوەی پشتیوانی لە چاودێریدایە'
        : 'Support Connection Request Pending',
    titleActive:
      currentLang === 'ar'
        ? 'المحادثة المباشرة مع الدعم المالي والفني'
        : currentLang === 'ckb'
        ? 'پەیامەکانی پشتیوانی تەکنیکی و دارایی'
        : 'Financial & Technical Live Support',
    pendingNotice:
      currentLang === 'ar'
        ? 'تم إرسال طلب الاتصال بوكيل الدعم الفني. يرجى الانتظار لحين قبول الطلب من قبل المسؤول لتفعيل المحادثة المباشرة.'
        : currentLang === 'ckb'
        ? 'داواکاری بەستنەوە بۆ نوێنەری پشتیوانی نێردراوە. تکایە چاوەڕوان بن تا داواکارییەکە لەلایەن بەڕێوەبەرەوە پەسەند دەکرێت.'
        : 'Support connection request sent. Please wait until the admin representative accepts the connection to unlock live chat.',
    chatLockedPlaceholder:
      currentLang === 'ar'
        ? 'المحادثة مغلقة بانتظار قبول الاتصال من قبل مسؤول الدعم...'
        : currentLang === 'ckb'
        ? 'پەیامەکان داخراون تا کاتی پەسەندکردنی بەستنەوە لەلایەن بەڕێوەبەر...'
        : 'Chat locked awaiting admin connection approval...',
    chatUnlockedPlaceholder:
      currentLang === 'ar'
        ? 'اكتب رسالتك لمسؤول قسم الدعم المالي والفني في الوقت الفعلي...'
        : currentLang === 'ckb'
        ? 'پەیامەکەت بنووسە بۆ پشتیوانی دارایی و تەکنیکی...'
        : 'Type your message to financial and technical support team...',
    chatHeader:
      currentLang === 'ar'
        ? 'المحادثة المباشرة مع مسؤول الدعم المالي والفني'
        : currentLang === 'ckb'
        ? 'گفتوگۆی ڕاستەوخۆ لەگەڵ پشتیوانی دارایی و تەکنیکی'
        : 'Live Chat with Support Representative',
    sendBtn: currentLang === 'ar' ? 'إرسال' : currentLang === 'ckb' ? 'ناردن' : 'Send',
    awaitingConnection:
      currentLang === 'ar'
        ? 'بانتظار الربط'
        : currentLang === 'ckb'
        ? 'چاودێری بەستنەوە'
        : 'Awaiting Connection',
    connected:
      currentLang === 'ar'
        ? 'نشط - تم الربط'
        : currentLang === 'ckb'
        ? 'چالاک - بەستنەوە ئەنجامدرا'
        : 'Active - Connected',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 shrink-0 relative">
          <div className="flex items-start gap-3 min-w-0 flex-1 w-full">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0 mt-0.5">
              <Headset className="w-5 h-5 text-sky-400" />
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="inline-flex items-center justify-center w-auto whitespace-nowrap text-[10px] sm:text-[11px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 rounded-full font-mono shadow-sm">
                  {isPending ? labels.step1Badge : labels.step2Badge}
                </span>

                {activeTicket && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[10px] sm:text-[11px] font-extrabold font-mono whitespace-nowrap shadow-sm">
                    <Clock className="w-3 h-3 animate-spin text-amber-400 shrink-0" />
                    <span>
                      {activeTicket.id} ({isPending ? labels.awaitingConnection : labels.connected})
                    </span>
                  </span>
                )}
              </div>
              <h2 className="text-sm sm:text-base md:text-lg font-black text-white leading-snug">
                {isPending ? labels.titlePending : labels.titleActive}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                if (onConnectSupport) {
                  setLoading(true);
                  onConnectSupport()
                    .then((tk) => setActiveTicket(tk))
                    .catch((err) => console.error(err))
                    .finally(() => setLoading(false));
                }
              }}
              title="Refresh State"
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all cursor-pointer shrink-0"
            >
              <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onClose();
              }}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MODAL BODY CONTENT */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* STEP 1: PENDING COUNTDOWN WAITING BANNER (When Awaiting Connection) */}
          {isPending && (
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-3.5 text-center shadow-lg relative overflow-hidden">
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
                  <Lock className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-amber-400">
                    {labels.titlePending}
                  </h3>
                  <p className="text-xs text-slate-300 max-w-md mx-auto mt-1 leading-relaxed">
                    {labels.pendingNotice}
                  </p>
                </div>
              </div>

              {/* 3-MINUTE COUNTDOWN TIMER DISPLAY (03:00) */}
              <div className="flex items-center justify-center gap-3 bg-slate-950/80 p-3 rounded-2xl border border-amber-500/30 max-w-xs mx-auto shadow-inner">
                <Clock className="w-5 h-5 text-amber-400 animate-spin shrink-0" />
                <div className="text-right rtl:text-left">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {currentLang === 'ar' ? 'وقت الانتظار المتوقع' : 'Expected Wait Time'}
                  </p>
                  <span className="text-2xl font-black font-mono text-amber-400 tracking-widest">
                    {formatTimer(timeLeftSeconds)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-mono pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {currentLang === 'ar'
                    ? 'المحفظة وواجهة المراسلة المباشرة مغلقة مؤقتاً لحين قبول الربط'
                    : 'Messaging interface is locked temporarily pending admin connection'}
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: CONNECTED / UNLOCKED STATUS BANNER */}
          {!isPending && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white">
                  {currentLang === 'ar'
                    ? 'تم قبول الاتصال - المحادثة المباشرة نشطة'
                    : 'Connection Accepted - Live Chat Active'}
                </h4>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  {currentLang === 'ar'
                    ? 'أنت الآن على تواصل مباشر مع ممثل الدعم المالي والفني. يمكنك كتابة استفساراتك أدناه.'
                    : 'You are now directly connected to a support representative. Feel free to send your inquiry below.'}
                </p>
              </div>
            </div>
          )}

          {/* INTEGRATED LIVE SUPPORT CHAT WINDOW */}
          {activeTicket && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-slate-800/90 shadow-lg space-y-3.5 pt-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 text-xs font-extrabold text-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                    <Headset className="w-4 h-4 text-amber-400" />
                  </div>
                  <span>{labels.chatHeader}</span>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5 font-bold font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Chat Active
                </span>
              </div>

              {/* Chat Message Feed */}
              <div
                ref={chatContainerRef}
                className="max-h-60 overflow-y-auto overscroll-contain space-y-2.5 pr-1 pl-1 custom-scrollbar"
              >
                {(activeTicket.messages || []).map((msg) => {
                  const isUser = msg.sender === 'user';
                  const isSystem = msg.sender === 'system';

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="text-center my-2">
                        <span className="text-[10px] bg-slate-900/90 text-amber-300 px-3.5 py-1.5 rounded-xl border border-amber-500/20 shadow-inner font-mono inline-block max-w-[95%] leading-relaxed">
                          {msg.text}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl p-3 text-xs space-y-1.5 shadow-md ${
                          isUser
                            ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-semibold rounded-br-xs'
                            : 'bg-slate-800/90 text-slate-100 rounded-bl-xs border border-slate-700/80'
                        }`}
                      >
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        <p
                          className={`text-[9.5px] font-medium ${
                            isUser ? 'text-slate-900/80 text-left dir-ltr' : 'text-slate-400 text-right dir-ltr'
                          }`}
                        >
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input Field (Locked during pending stage, unlocked when accepted) */}
              <form noValidate onSubmit={handleSendChat} className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder={
                    isPending
                      ? labels.chatLockedPlaceholder
                      : labels.chatUnlockedPlaceholder
                  }
                  value={chatInput}
                  disabled={isPending || isSendingMsg}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-slate-900/90 border border-slate-800 focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/40 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none transition-all shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="submit"
                  disabled={isPending || !chatInput.trim() || isSendingMsg}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-500/10 hover:shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{labels.sendBtn}</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
