import React, { useState, memo } from 'react';
import { Truck, Users, Lock, Calendar, ArrowRight, ShieldCheck, MapPin, Gauge, Calculator, DollarSign, Sparkles, TrendingUp } from 'lucide-react';
import { Project, Language } from '../types';
import { translations } from '../i18n/translations';

interface ProjectCardProps {
  project: Project;
  currentLang: Language;
  onSelectInvest: (project: Project) => void;
}

const ProjectCardComponent: React.FC<ProjectCardProps> = ({
  project,
  currentLang,
  onSelectInvest,
}) => {
  const t = translations[currentLang] || translations.ar;

  const [calcAmount, setCalcAmount] = useState<number>(
    project.minInvestment > 1000 ? project.minInvestment : 1000
  );

  const isCompleted =
    project.status === 'completed' ||
    project.status === 'fully_funded' ||
    project.raisedAmount >= project.targetAmount;

  const fundingPercent = isCompleted
    ? 100
    : Math.min(100, Math.round((project.raisedAmount / project.targetAmount) * 100));

  const titleText = project.title?.[currentLang] || project.title?.ar || 'مشروع أسطول';
  const descText = project.description?.[currentLang] || project.description?.ar || '';
  const routeText = project.route?.[currentLang] || project.route?.ar || 'بغداد ⇄ أربيل';
  const promoText = isCompleted
    ? (currentLang === 'ar' ? '✅ مكتمل - سيفتح الاستثمار قريباً' : '✅ Completed - Investment Opening Soon')
    : project.promoBadge
    ? project.promoBadge[currentLang] || project.promoBadge.ar
    : null;

  // Selected plan for calculator if project has sub-plans
  const [selectedPlanId, setSelectedPlanId] = useState<string>(project.plans?.[0]?.id || '');
  const activePlan = project.plans?.find((p) => p.id === selectedPlanId) || project.plans?.[0];
  const activeRoiPercent = activePlan ? activePlan.monthlyRoiPercent : project.monthlyRoiPercent;

  // Monthly Return = calcAmount * activeRoiPercent / 100
  const monthlyReturn = (calcAmount * activeRoiPercent) / 100;
  // 5-Month Lockup Cumulative Return
  const total5MonthReturn = monthlyReturn * 5;
  // Maturity Payout (Capital + Return)
  const maturityPayout = calcAmount + total5MonthReturn;

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl overflow-hidden shadow-xl transition-all hover:shadow-2xl hover:-translate-y-1 flex flex-col group relative">
      
      {/* Image & Badges */}
      <div className="relative h-52 w-full overflow-hidden bg-slate-950 shrink-0">
        <img
          src={project.imageUrl || 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80'}
          alt={titleText}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            const defaultImg = 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80';
            if (e.currentTarget.src !== defaultImg) {
              e.currentTarget.src = defaultImg;
            }
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none" />

        {/* Category & Status Badges */}
        <div className="absolute top-4 left-4 rtl:left-auto rtl:right-4 flex flex-col gap-2">
          <span className="px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-amber-400 text-xs font-extrabold border border-amber-500/30 flex items-center space-x-1.5 rtl:space-x-reverse shadow-lg">
            {project.category === 'cargo_freight' ? (
              <>
                <Truck className="w-3.5 h-3.5" />
                <span>{t.filterCargo}</span>
              </>
            ) : (
              <>
                <Users className="w-3.5 h-3.5" />
                <span>{t.filterPassenger}</span>
              </>
            )}
          </span>

          {promoText && (
            <span className={`px-3 py-1 rounded-full text-[11px] font-black shadow-md border ${
              isCompleted
                ? 'bg-emerald-500 text-slate-950 border-emerald-300'
                : 'bg-amber-500/90 text-slate-950 border-amber-400'
            }`}>
              {promoText}
            </span>
          )}
        </div>

        {/* Lockup Duration Badge */}
        <div className="absolute top-4 right-4 rtl:right-auto rtl:left-4">
          <span className="px-3 py-1 rounded-full bg-slate-900/90 backdrop-blur-md text-slate-200 text-xs font-bold border border-slate-700 flex items-center space-x-1 rtl:space-x-reverse">
            <Lock className="w-3 h-3 text-amber-400" />
            <span>5 {t.months} {t.lockupDuration}</span>
          </span>
        </div>

        {/* Route Overlay */}
        <div className="absolute bottom-3 left-4 right-4 flex items-center space-x-1.5 rtl:space-x-reverse text-slate-200 text-xs font-semibold">
          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">{routeText}</span>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
        <div>
          <h3 className="text-lg font-extrabold text-white group-hover:text-amber-400 transition-colors line-clamp-2">
            {titleText}
          </h3>
          <p className="text-slate-400 text-xs mt-2 line-clamp-2 leading-relaxed">
            {descText}
          </p>
        </div>

        {/* Investment Plans Tier Selector (if project has multiple plans) */}
        {project.plans && project.plans.length > 0 && (
          <div className="space-y-1.5 bg-slate-950/80 p-3 rounded-2xl border border-amber-500/30">
            <p className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>{currentLang === 'ar' ? 'خطط الاستثمار المتاحة للمشروع:' : 'Available Investment Plans:'}</span>
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {project.plans.map((plan) => {
                const planName = plan.name[currentLang] || plan.name.ar;
                const isSelected = selectedPlanId === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => {
                      setSelectedPlanId(plan.id);
                      if (calcAmount < plan.minInvestment) setCalcAmount(plan.minInvestment);
                    }}
                    className={`p-2 rounded-xl text-right rtl:text-right border transition-all text-[11px] cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-extrabold text-amber-400 truncate">{planName}</div>
                    <div className="text-[10px] text-emerald-400 font-extrabold mt-0.5 truncate">
                      {(() => {
                        const pexp = plan.expectedProfit;
                        if (typeof pexp === 'string') return pexp;
                        if (pexp) return pexp[currentLang] || pexp.ar;
                        return currentLang === 'ar' ? 'أرباح حسب رحلات الشحن' : 'Trip-based profit';
                      })()}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Specifications & Batch Units */}
        <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>{t.specsLabel}:</span>
            <span className="font-semibold text-slate-200">{project.capacitySpecs}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>{t.vehiclesCount}:</span>
            <span className="font-semibold text-amber-400">{project.totalVehicles} Units</span>
          </div>
        </div>

        {/* Funding Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-400">{t.fundedAmount}:</span>
            <span className="text-white font-mono">
              ${project.raisedAmount.toLocaleString()} / ${project.targetAmount.toLocaleString()} ({fundingPercent}%)
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
            <div
              className={`h-full rounded-full transition-all duration-700 shadow-sm ${
                isCompleted
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-emerald-500/50'
                  : 'bg-gradient-to-r from-amber-500 to-amber-400 shadow-amber-500/50'
              }`}
              style={{ width: `${fundingPercent}%` }}
            />
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl text-center flex flex-col justify-center">
            <p className="text-[10px] text-amber-400 font-extrabold uppercase tracking-wider">
              {currentLang === 'ar' ? 'الأرباح القائمة على الرحلات' : 'Trip-Based Profit'}
            </p>
            <p className="text-xs font-black text-white mt-1 leading-snug truncate">
              {(() => {
                const exp = activePlan?.expectedProfit || project.expectedProfit;
                if (typeof exp === 'string') return exp;
                return exp?.[currentLang] || exp?.ar || (currentLang === 'ar' ? 'أرباح تقديرية حسب الرحلات' : 'Trip-based profit');
              })()}
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-3 rounded-2xl text-center">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">{t.minInvestment}</p>
            <p className="text-lg font-black text-white font-mono">
              ${activePlan?.minInvestment || project.minInvestment}
            </p>
          </div>
        </div>

        {/* Expected Operational Profit Range Banner */}
        {(activePlan?.expectedProfit || project.expectedProfit) && (
          <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl flex items-center gap-2.5 text-xs">
            <TrendingUp className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="block text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                {currentLang === 'ar' ? 'تفاصيل الأرباح المتوقعة لرحلات الشحن:' : 'Trip-Based Profit Details:'}
              </span>
              <span className="font-extrabold text-white text-xs block truncate mt-0.5">
                {(() => {
                  const exp = activePlan?.expectedProfit || project.expectedProfit;
                  if (typeof exp === 'string') return exp;
                  return exp?.[currentLang] || exp?.ar || '';
                })()}
              </span>
            </div>
          </div>
        )}

        {/* INTERACTIVE INVESTMENT CALCULATOR */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-1.5 font-bold text-amber-400">
              <Calculator className="w-3.5 h-3.5" />
              <span>{currentLang === 'ar' ? 'حاسبة أرباح الخطة التفاعلية' : 'Plan ROI Calculator'}</span>
            </div>
            <span className="text-[10px] text-amber-400 font-bold">
              {currentLang === 'ar' ? 'عوائد تشغيلية حسب رحلات الأسطول' : 'Trip-based Returns'}
            </span>
          </div>

          {/* Amount Input */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>{currentLang === 'ar' ? 'مبلغ الاستثمار (USDT):' : 'Investment Amount ($):'}</span>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 rtl:left-auto rtl:right-3 flex items-center text-amber-400 font-bold text-sm">
                $
              </span>
              <input
                type="number"
                min={activePlan?.minInvestment || project.minInvestment}
                step="50"
                value={calcAmount}
                onChange={(e) => setCalcAmount(Math.max(activePlan?.minInvestment || project.minInvestment, Number(e.target.value) || 100))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-7 rtl:pl-3 rtl:pr-7 text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-500 transition-all"
              />
            </div>
          </div>

          {/* Calculated Output Rows */}
          <div className="space-y-1.5 pt-1 text-[11px] font-mono">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">{currentLang === 'ar' ? 'العائد الشهري للخطة:' : 'Plan Monthly Yield:'}</span>
              <span className="font-bold text-emerald-400">+${monthlyReturn.toFixed(2)} USDT</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">{currentLang === 'ar' ? 'إجمالي عوائد 5 أشهر:' : '5-Month Total Returns:'}</span>
              <span className="font-bold text-amber-400">+${total5MonthReturn.toFixed(2)} USDT</span>
            </div>
            <div className="flex justify-between text-white font-bold border-t border-slate-800/80 pt-1 text-xs">
              <span>{currentLang === 'ar' ? 'إجمالي السداد عند الاستحقاق:' : 'Total Maturity Payout:'}</span>
              <span className="text-amber-300">${maturityPayout.toFixed(2)} USDT</span>
            </div>
          </div>
        </div>

        {/* Investment Action CTA */}
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); if (!isCompleted) onSelectInvest(project); }}
          disabled={isCompleted || project.status === 'paused'}
          className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center space-x-2 rtl:space-x-reverse cursor-pointer ${
            isCompleted
              ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 cursor-not-allowed shadow-none'
              : project.status === 'active'
              ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <span>
            {isCompleted
              ? (currentLang === 'ar' ? '✅ مكتمل - سيفتح الاستثمار قريباً' : '✅ Completed - Investment Opening Soon')
              : project.status === 'active'
              ? t.investNow
              : t.projectPaused}
          </span>
          {!isCompleted && project.status === 'active' && <ArrowRight className="w-4 h-4 rtl:rotate-180" />}
        </button>

      </div>
    </div>
  );
};

export const ProjectCard = memo(ProjectCardComponent);

