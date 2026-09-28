import React, { useState } from 'react';
import { FreightTrip, Language } from '../types';
import { Truck, Route, Calendar, CheckCircle2, Clock, MapPin, ShieldCheck, ChevronDown, ChevronUp, Activity, DollarSign } from 'lucide-react';

interface FreightTripFeedProps {
  currentLang: Language;
  trips: FreightTrip[];
  projectId?: string;
  planId?: string;
  limit?: number;
}

export const FreightTripFeed: React.FC<FreightTripFeedProps> = ({
  currentLang,
  trips = [],
  projectId,
  planId,
  limit,
}) => {
  const isAr = currentLang === 'ar';
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);

  // Filter trips by project or plan if specified
  const filteredTrips = trips.filter((t) => {
    if (projectId && t.projectId !== projectId) return false;
    if (planId && t.planId && t.planId !== planId) return false;
    return true;
  });

  const displayTrips = limit ? filteredTrips.slice(0, limit) : filteredTrips;

  const totalDelivered = filteredTrips.filter((t) => t.cargoStatus === 'delivered').length;
  const totalInTransit = filteredTrips.filter((t) => t.cargoStatus === 'in_transit').length;
  const totalRevenue = filteredTrips.reduce((sum, t) => sum + (t.revenueUsdt || 0), 0);

  if (filteredTrips.length === 0) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
          <Truck className="w-6 h-6 text-slate-500" />
        </div>
        <h4 className="text-sm font-bold text-slate-300">
          {isAr ? 'لا توجد رحلات شحن مسجلة لهذا الأسطول بعد' : 'No freight trips logged for this fleet yet'}
        </h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          {isAr
            ? 'سيتم عرض سجلات الرحلات وسفرات الشحن اللوجستي مباشرة بمجرد تسجيلها من قبل إدارة الأسطول.'
            : 'Live freight trips will appear here automatically when logged by fleet operations.'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
      {/* Feed Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            <Truck className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <h3 className="text-sm font-extrabold text-white">
                {isAr ? 'سجل رحلات الشحن والنقل اللوجستي المباشر' : 'Live Freight Trip Operations Feed'}
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isAr ? 'تحديثات حية وموثقة لسفرات أسطولك الميدانية' : 'Real-time verified logs of fleet operations'}
            </p>
          </div>
        </div>

        {/* Quick Stats Summary */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
            <span className="text-slate-500 text-[10px] block">{isAr ? 'السفرات المكتملة' : 'Completed'}</span>
            <span className="text-emerald-400 font-extrabold">{totalDelivered}</span>
          </div>
          {totalInTransit > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <span className="text-blue-300 text-[10px] block">{isAr ? 'قيد الترانزيت' : 'In Transit'}</span>
              <span className="font-extrabold">{totalInTransit}</span>
            </div>
          )}
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
            <span className="text-slate-500 text-[10px] block">{isAr ? 'عائد الرحلات' : 'Total Revenue'}</span>
            <span className="text-amber-400 font-extrabold">${totalRevenue.toLocaleString()} USDT</span>
          </div>
        </div>
      </div>

      {/* Trips Timeline Feed */}
      <div className="space-y-3">
        {displayTrips.map((trip) => {
          const isExpanded = expandedTripId === trip.id;
          const isDelivered = trip.cargoStatus === 'delivered';
          const isInTransit = trip.cargoStatus === 'in_transit';

          return (
            <div
              key={trip.id}
              className="bg-slate-950/80 border border-slate-800/90 hover:border-slate-700 rounded-2xl p-4 transition-all duration-200 space-y-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                {/* Trip Number & Status */}
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 font-mono font-bold border border-blue-500/20 text-[11px]">
                    {trip.tripNumber}
                  </span>

                  {isDelivered && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      {isAr ? 'تم التسليم بنجاح' : 'Delivered'}
                    </span>
                  )}

                  {isInTransit && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold animate-pulse">
                      <Truck className="w-3 h-3" />
                      {isAr ? 'في الطريق - ترانزيت' : 'In Transit'}
                    </span>
                  )}

                  {!isDelivered && !isInTransit && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                      <Clock className="w-3 h-3" />
                      {isAr ? 'مجدولة للانطلاق' : 'Scheduled'}
                    </span>
                  )}
                </div>

                {/* Revenue Badge & Date */}
                <div className="flex items-center gap-3">
                  <span className="font-mono font-extrabold text-emerald-400 text-sm bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    +${trip.revenueUsdt.toLocaleString()} USDT
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    {trip.date}
                  </span>
                </div>
              </div>

              {/* Route & Vehicle Info */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
                <div className="flex items-center gap-2 text-slate-200 font-bold">
                  <Route className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{trip.originRoute}</span>
                </div>

                {trip.vehiclePlate && (
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2.5 py-0.5 rounded-md border border-slate-800">
                    🚚 {trip.vehiclePlate}
                  </span>
                )}
              </div>

              {/* Collapsible Details & Notes */}
              {trip.notes && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setExpandedTripId(isExpanded ? null : trip.id)}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>{isExpanded ? (isAr ? 'إخفاء التفاصيل' : 'Hide Notes') : (isAr ? 'عرض تفاصيل الحمولة' : 'View Notes')}</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {isExpanded && (
                    <div className="mt-2 p-3 rounded-xl bg-slate-900 border border-slate-800/80 text-[11px] text-slate-300 space-y-1 animate-fadeIn">
                      <p className="leading-relaxed">{trip.notes}</p>
                      {trip.projectTitle && (
                        <div className="text-[10px] text-slate-500 font-mono border-t border-slate-800/60 pt-1 mt-1">
                          {isAr ? 'الأسطول المخصص:' : 'Fleet:'} {trip.projectTitle}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
