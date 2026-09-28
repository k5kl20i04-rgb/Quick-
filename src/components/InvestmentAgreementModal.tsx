import React from 'react';
import { FileText, Printer, Download, ShieldCheck, X, Building2, CheckCircle2 } from 'lucide-react';
import { Language, User, Project } from '../types';

interface InvestmentAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  user: User;
  amount: number;
  currentLang: Language;
}

export const InvestmentAgreementModal: React.FC<InvestmentAgreementModalProps> = ({
  isOpen,
  onClose,
  project,
  user,
  amount,
  currentLang,
}) => {
  if (!isOpen) return null;

  const projectTitle = project.title[currentLang] || project.title.ar;
  const monthlyYield = (amount * project.monthlyRoiPercent) / 100;
  const total5MonthYield = monthlyYield * 5;
  const contractId = `ASEEL-AGR-${Date.now().toString().slice(-6)}`;
  const dateStr = new Date().toLocaleDateString('ar-IQ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-3.5 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 shrink-0 gap-2">
          <div className="flex items-center space-x-2.5 sm:space-x-3 rtl:space-x-reverse min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-base font-black text-white truncate">
                {currentLang === 'ar' ? 'عقد الاستثمار والتأجير التشغيلي الرسمي' : 'Official Investment & Fleet Leasing Contract'}
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-400 font-mono truncate">ID: {contractId} | {dateStr}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onClose(); }}
            className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition shrink-0"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Printable Contract Document Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 text-slate-300 text-xs leading-relaxed print:text-black print:bg-white print:p-0">
          
          {/* Header Badge */}
          <div className="text-center border-b border-slate-800 pb-4 sm:pb-5 space-y-1.5 sm:space-y-2">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-[10px] sm:text-xs">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>عقد مضاربة شرعية إسلامية ومشاركة في الأرباح اللوجستية</span>
            </div>
            <h1 className="text-base sm:text-xl font-black text-white pt-1 sm:pt-2">
              شركة أصيل للنقل اللوجستي وإدارة أساطيل الشحن (ش.م.م)
            </h1>
            <p className="text-slate-400 text-[10px] sm:text-xs">مسجلة وموثقة وفق القوانين والأنظمة العراقية لقطاع النقل والخدمات اللوجستية</p>
          </div>

          {/* Contract Parties */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-slate-950 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-800">
            <div>
              <span className="text-slate-500 block text-[10px] font-bold">الطرف الأول (المُضارب / المدير):</span>
              <span className="font-extrabold text-amber-400 text-xs sm:text-sm block mt-0.5">شركة أصيل للنقل والحلول اللوجستية</span>
              <span className="text-[10px] sm:text-[11px] text-slate-400 block truncate">بغداد، العراق - البريد: support@aseel.iq</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-bold">الطرف الثاني (المستثمر / رب المال):</span>
              <span className="font-extrabold text-white text-xs sm:text-sm block mt-0.5">{user?.name}</span>
              <span className="text-[10px] sm:text-[11px] text-slate-400 block truncate">البريد: {user?.email} | الهوية: {user?.idNumber || 'IQ-VERIFIED'}</span>
            </div>
          </div>

          {/* Key Terms & Allocation Table */}
          <div className="space-y-2.5 sm:space-y-3">
            <h4 className="font-extrabold text-amber-400 text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
              <span>1. تفاصيل التخصيص المالي والأسطول المستهدف:</span>
            </h4>
            
            <div className="bg-slate-950 rounded-xl sm:rounded-2xl border border-slate-800 p-3 sm:p-4 space-y-2 font-mono text-[11px] sm:text-xs">
              <div className="flex justify-between border-b border-slate-800/80 pb-2 gap-2">
                <span className="text-slate-400 shrink-0">الأسطول / المشروع المستهدف:</span>
                <span className="text-white font-bold text-right truncate">{projectTitle}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">مبلغ الاستثمار المخصص:</span>
                <span className="text-emerald-400 font-bold">${amount.toLocaleString()} USDT</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">نسبة العائد التشغيلي الشهري:</span>
                <span className="text-amber-400 font-bold">+{project.monthlyRoiPercent}% شهرياً</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">الأرباح الشهرية التقديرية:</span>
                <span className="text-emerald-400 font-bold">+${monthlyYield.toFixed(2)} USDT</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">مدة حجز رأس المال (Lockup):</span>
                <span className="text-blue-400 font-bold">5 أشهر متتالية</span>
              </div>
              <div className="flex justify-between pt-1 text-xs sm:text-sm">
                <span className="text-slate-200 font-bold">إجمالي المستحقات عند نهاية العقد:</span>
                <span className="text-amber-300 font-black">${(amount + total5MonthYield).toFixed(2)} USDT</span>
              </div>
            </div>
          </div>

          {/* Clauses */}
          <div className="space-y-1.5 sm:space-y-2 text-slate-300 text-[10px] sm:text-[11px] leading-relaxed">
            <h4 className="font-extrabold text-amber-400 text-xs">2. أحكام وشروط العقد الشرعية والتشغيلية:</h4>
            <p>
              • يتعهد الطرف الأول (شركة أصيل) بتشغيل واستثمار المبلغ المخصص في شراء وصيانة وتأجير مركبـات الأسطول المحددة وفق معايير الجودة والسلامة.
            </p>
            <p>
              • تُوزع الأرباح بشكل دوري بنهاية كل شهر ميلادي مباشرةً إلى محفظة المستثمر بـ USDT.
            </p>
            <p>
              • يلتزم الطرف الثاني بمدة قفل رأس المال البالغة (5) أشهر لضمان استقرار العمليات التشغيلية، مع إمكانية تجديد العقد أو سحب الأرباح ورأس المال بعد انقضاء المدة.
            </p>
            <p>
              • جميع المعاملات والعقود خاضعة للرقابة والشفافية وتوفر تغطية تأمينية شاملة للمركبات ضد أخطار الطريق والتلف.
            </p>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6 pt-3 sm:pt-4 border-t border-slate-800 text-center text-[10px] sm:text-xs">
            <div className="space-y-4 sm:space-y-8">
              <span className="block text-slate-400 font-bold">توقيع وختم شركة أصيل اللوجستية</span>
              <div className="font-serif italic text-amber-400 border-b border-amber-500/30 pb-1.5 w-28 sm:w-36 mx-auto text-xs sm:text-sm">
                Aseel Logistics Co.
              </div>
            </div>
            <div className="space-y-4 sm:space-y-8">
              <span className="block text-slate-400 font-bold">توقيع المستثمر (إلكترونياً)</span>
              <div className="font-mono text-emerald-400 border-b border-emerald-500/30 pb-1.5 w-28 sm:w-36 mx-auto text-xs sm:text-sm truncate">
                {user.name}
              </div>
            </div>
          </div>

        </div>

        {/* Modal Actions */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); handlePrint(); }}
            className="px-4 py-2 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition"
          >
            <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            <span>طباعة العقد (Print Agreement)</span>
          </button>

          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onClose(); }}
            className="px-6 py-2 sm:py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition"
          >
            موافقة ومتابعة الاستثمار
          </button>
        </div>

      </div>
    </div>
  );
};
