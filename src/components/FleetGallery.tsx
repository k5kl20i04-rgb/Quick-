import React, { memo } from 'react';
import { Truck, Users, MapPin, Gauge, ShieldCheck, Activity, Route } from 'lucide-react';
import { Project, Language } from '../types';
import { translations } from '../i18n/translations';

interface FleetGalleryProps {
  currentLang: Language;
  projects: Project[];
}

const FleetGalleryComponent: React.FC<FleetGalleryProps> = ({
  currentLang,
  projects,
}) => {
  const t = translations[currentLang] || translations.ar;

  return (
    <div className="space-y-8">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center space-x-2 rtl:space-x-reverse px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
            <Activity className="w-4 h-4" />
            <span>Telemetry & Live GPS Tracker</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">{t.fleetTitle}</h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            {t.fleetSubtitle}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((proj) => {
          const titleText = proj.title?.[currentLang] || proj.title?.ar || 'أسطول استثماري';
          const routeText = proj.route?.[currentLang] || proj.route?.ar || 'بغداد ⇄ أربيل ⇄ البصرة';
          const defaultFleetImage = 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80';

          return (
            <div
              key={proj.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl hover:border-slate-700 transition-all flex flex-col min-h-[380px]"
            >
              <div className="relative h-52 w-full overflow-hidden bg-slate-950 shrink-0">
                <img
                  src={proj.imageUrl || defaultFleetImage}
                  alt={titleText}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== defaultFleetImage) {
                      target.src = defaultFleetImage;
                    }
                  }}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent pointer-events-none" />
                <span className="absolute top-3 left-3 rtl:left-auto rtl:right-3 px-3 py-1 rounded-full bg-emerald-500/90 text-slate-950 text-[10px] font-black uppercase tracking-wider flex items-center space-x-1 rtl:space-x-reverse shadow-md">
                  <span className="w-2 h-2 rounded-full bg-slate-950" />
                  <span>{t.activeStatus}</span>
                </span>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider font-mono">
                    {proj.vehicleType}
                  </span>
                  <h3 className="text-base font-extrabold text-white mt-1 line-clamp-1">{titleText}</h3>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse text-slate-300">
                    <Route className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-slate-400">{t.vehicleRoute}:</span>
                    <span className="font-semibold text-white truncate">{routeText}</span>
                  </div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse text-slate-300">
                    <Gauge className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-slate-400">{t.capacity}:</span>
                    <span className="font-semibold text-white">{proj.capacitySpecs}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs font-mono border-t border-slate-800 pt-3">
                  <span className="text-slate-400">Total Batch Fleet:</span>
                  <span className="font-black text-amber-400">{proj.totalVehicles} Vehicles</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const FleetGallery = memo(FleetGalleryComponent);

