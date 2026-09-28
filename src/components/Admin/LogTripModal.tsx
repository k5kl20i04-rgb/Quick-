import React, { useState } from 'react';
import { Project, Language } from '../../types';
import { Truck, X, Route, Calendar, DollarSign, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface LogTripModalProps {
  currentLang: Language;
  project: Project;
  onClose: () => void;
  onTripLogged: () => void;
}

export const LogTripModal: React.FC<LogTripModalProps> = ({
  currentLang,
  project,
  onClose,
  onTripLogged,
}) => {
  const isAr = currentLang === 'ar';

  const projectTitle = typeof project.title === 'string' ? project.title : project.title.ar;

  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    project.plans && project.plans.length > 0 ? project.plans[0].id : ''
  );
  const [tripNumber, setTripNumber] = useState(
    `TRIP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
  );
  const [originRoute, setOriginRoute] = useState('بغداد ➔ البصرة (ميناء أم قصر)');
  const [cargoStatus, setCargoStatus] = useState<'delivered' | 'in_transit' | 'scheduled'>('delivered');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [revenueUsdt, setRevenueUsdt] = useState<string>('1450');
  const [vehiclePlate, setVehiclePlate] = useState('84920 بغداد - نقل خاص');
  const [notes, setNotes] = useState('تم تفريغ وسحب الشحنة بنجاح وتسليم الوثائق الرسمية.');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!originRoute.trim()) {
      setError(isAr ? 'يرجى كتابة خط ومسار الرحلة' : 'Please enter route');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/admin/log-trip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'admin',
        },
        body: JSON.stringify({
          projectId: project.id,
          planId: selectedPlanId || undefined,
          tripNumber,
          originRoute,
          cargoStatus,
          date,
          revenueUsdt: Number(revenueUsdt) || 0,
          vehiclePlate,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || (isAr ? 'فشل تسجيل الرحلة' : 'Failed to log trip'));
      }

      setSuccess(
        isAr
          ? `✅ تم تسجيل رحلة النقل رقم (${tripNumber}) بنجاح وإشعار المستثمرين مباشرة!`
          : `✅ Trip #${tripNumber} registered successfully!`
      );

      onTripLogged();

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || (isAr ? 'حدث خطأ أثناء الاتصال بالسيرفر' : 'Server error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto animate-fadeIn">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 left-5 rtl:right-5 rtl:left-auto text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 border-b border-slate-800 pb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            <Truck className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px] font-bold mb-1">
              {isAr ? 'لوحة تحكم الإدارة • تسجيل رحلة نقل live' : 'Admin Control • Log Freight Trip'}
            </div>
            <h2 className="text-lg font-black text-white">
              {isAr ? 'تسجيل رحلة نقل جديدة' : 'Register New Freight Trip'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{projectTitle}</p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Select Fleet Plan if multiple */}
          {project.plans && project.plans.length > 0 && (
            <div>
              <label className="block font-bold text-slate-300 mb-1.5">
                {isAr ? 'اختر الخطة الاستثمارية للأسطول:' : 'Select Investment Plan:'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-bold focus:outline-none focus:border-blue-500"
              >
                {project.plans.map((plan) => {
                  const planName = typeof plan.name === 'string' ? plan.name : plan.name?.ar;
                  const expProfit = typeof plan.expectedProfit === 'string' ? plan.expectedProfit : plan.expectedProfit?.ar || 'أرباح السفرات';
                  return (
                    <option key={plan.id} value={plan.id}>
                      {planName} ({expProfit})
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Grid: Trip Number & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-300 mb-1.5">
                {isAr ? 'رقم الرحلة / السفرة المرجعي:' : 'Trip Reference Number:'}
              </label>
              <input
                type="text"
                value={tripNumber}
                onChange={(e) => setTripNumber(e.target.value)}
                placeholder="TRIP-2026-108"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-amber-400 font-mono font-bold focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                {isAr ? 'تاريخ تنفيذ الرحلة:' : 'Trip Date:'}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono font-bold focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Origin & Destination Route */}
          <div>
            <label className="block font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Route className="w-3.5 h-3.5 text-emerald-400" />
              {isAr ? 'خط ومسار الشحن اللوجستي (من ➔ إلى):' : 'Freight Route (Origin ➔ Destination):'}
            </label>
            <input
              type="text"
              value={originRoute}
              onChange={(e) => setOriginRoute(e.target.value)}
              placeholder="مثال: بغداد ➔ البصرة (ميناء أم قصر)"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-bold focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* Grid: Completed Revenue & Cargo Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                {isAr ? 'إيراد الرحلة المكتملة ($ USDT):' : 'Completed Trip Revenue ($ USDT):'}
              </label>
              <input
                type="number"
                value={revenueUsdt}
                onChange={(e) => setRevenueUsdt(e.target.value)}
                placeholder="1450"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-emerald-400 font-mono font-extrabold focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1.5">
                {isAr ? 'حالة الشحنة:' : 'Cargo Status:'}
              </label>
              <select
                value={cargoStatus}
                onChange={(e) => setCargoStatus(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-bold focus:outline-none focus:border-blue-500"
              >
                <option value="delivered">{isAr ? 'تم التسليم بنجاح ✅' : 'Delivered'}</option>
                <option value="in_transit">{isAr ? 'قيد الترانزيت والنقل 🚚' : 'In Transit'}</option>
                <option value="scheduled">{isAr ? 'مجدولة للانطلاق 📅' : 'Scheduled'}</option>
              </select>
            </div>
          </div>

          {/* Vehicle / Truck Plate */}
          <div>
            <label className="block font-bold text-slate-300 mb-1.5">
              {isAr ? 'رقم لوحة الشاحنة / أصل المركبة (اختياري):' : 'Truck License Plate (Optional):'}
            </label>
            <input
              type="text"
              value={vehiclePlate}
              onChange={(e) => setVehiclePlate(e.target.value)}
              placeholder="مثال: 84920 بغداد - نقل خاص"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 font-bold focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Notes & Freight Details */}
          <div>
            <label className="block font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              {isAr ? 'ملاحظات وتفاصيل حمولة الرحلة:' : 'Cargo Notes & Logistic Details:'}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="تفاصيل الشحنة، وزن الحاوية، أو وثائق الاستلام..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Submit Action Button */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Truck className="w-4 h-4 text-amber-300" />
              <span>
                {isSubmitting
                  ? isAr ? 'جاري الحفظ والتسجيل...' : 'Saving...'
                  : isAr ? 'تسجيل ونشر الرحلة للمستثمرين 🚀' : 'Log & Publish Trip Live'}
              </span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
