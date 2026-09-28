import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
} from 'recharts';
import { TrendingUp, DollarSign, ShieldCheck, BarChart3, Layers, Sparkles, Calculator, Truck } from 'lucide-react';
import { Language, User } from '../types';
import { translations } from '../i18n/translations';

interface ROIAnalyticsProps {
  currentLang: Language;
  user?: User | null;
}

export const ROIAnalytics: React.FC<ROIAnalyticsProps> = ({ currentLang, user }) => {
  const t = translations[currentLang] || translations.ar;

  // Base investment calculation: use user's active total invested amount or default to $10,000 for simulation
  const actualInvested = user?.totalInvested || 0;
  const [simulatedAmount, setSimulatedAmount] = useState<number>(
    actualInvested > 0 ? actualInvested : 10000
  );
  const [viewMode, setViewMode] = useState<'monthly' | 'category'>('monthly');

  // Use actual invested if user has active funds, unless user changed simulation
  const activeCapital = simulatedAmount;

  // Monthly yield calculations based on active Capital
  const cargoMonthly = Math.round(activeCapital * 0.048); // 4.8% monthly ROI
  const passengerMonthly = Math.round(activeCapital * 0.042); // 4.2% monthly ROI
  const heavyMonthly = Math.round(activeCapital * 0.050); // 5.0% monthly ROI
  const hybridMonthly = Math.round(activeCapital * 0.046); // 4.6% avg hybrid ROI

  // Month-by-month projected earnings dataset
  const monthlyProjectionData = [
    {
      month: currentLang === 'ar' ? 'الشهر 1' : currentLang === 'ckb' ? 'مانگی 1' : 'Month 1',
      cargo: cargoMonthly,
      passenger: passengerMonthly,
      hybrid: hybridMonthly,
    },
    {
      month: currentLang === 'ar' ? 'الشهر 2' : currentLang === 'ckb' ? 'مانگی 2' : 'Month 2',
      cargo: cargoMonthly,
      passenger: passengerMonthly,
      hybrid: hybridMonthly,
    },
    {
      month: currentLang === 'ar' ? 'الشهر 3' : currentLang === 'ckb' ? 'مانگی 3' : 'Month 3',
      cargo: cargoMonthly,
      passenger: passengerMonthly,
      hybrid: hybridMonthly,
    },
    {
      month: currentLang === 'ar' ? 'الشهر 4' : currentLang === 'ckb' ? 'مانگی 4' : 'Month 4',
      cargo: cargoMonthly,
      passenger: passengerMonthly,
      hybrid: hybridMonthly,
    },
    {
      month: currentLang === 'ar' ? 'الشهر 5 (القفل)' : currentLang === 'ckb' ? 'مانگی 5' : 'Month 5 (Lockup)',
      cargo: cargoMonthly,
      passenger: passengerMonthly,
      hybrid: hybridMonthly,
    },
    {
      month: currentLang === 'ar' ? 'الشهر 6 (مكتمل)' : currentLang === 'ckb' ? 'مانگی 6' : 'Month 6 (Maturity)',
      cargo: cargoMonthly,
      passenger: passengerMonthly,
      hybrid: hybridMonthly,
    },
  ];

  // Category comparison dataset
  const categoryComparisonData = [
    {
      category: currentLang === 'ar' ? 'شاحنات الشحن البري' : currentLang === 'ckb' ? 'شاحناتی بار' : 'Cargo Freight',
      rate: '4.8%',
      monthlyEarning: cargoMonthly,
      fiveMonthTotal: cargoMonthly * 5,
      color: '#f59e0b',
    },
    {
      category: currentLang === 'ar' ? 'حافلات نقل المسافرين' : currentLang === 'ckb' ? 'پاسەکانی گەشتیاری' : 'Passenger Express',
      rate: '4.2%',
      monthlyEarning: passengerMonthly,
      fiveMonthTotal: passengerMonthly * 5,
      color: '#10b981',
    },
    {
      category: currentLang === 'ar' ? 'النقل الثقيل واللوجستي' : currentLang === 'ckb' ? 'بارکێشی قورس' : 'Heavy Logistics',
      rate: '5.0%',
      monthlyEarning: heavyMonthly,
      fiveMonthTotal: heavyMonthly * 5,
      color: '#3b82f6',
    },
    {
      category: currentLang === 'ar' ? 'المحفظة الهجينة' : currentLang === 'ckb' ? 'تێکەڵاوی گشتی' : 'Hybrid Fleet Strategy',
      rate: '4.6%',
      monthlyEarning: hybridMonthly,
      fiveMonthTotal: hybridMonthly * 5,
      color: '#ec4899',
    },
  ];

  // Labels based on language
  const labels = {
    ar: {
      title: 'تحليلات ومقارنة العوائد الشهرية المتوقعة',
      subtitle: 'مخطط بياني تقارني لمستويات الأرباح الشهرية الصافية بناءً على حجم استثمارك الحالي في أسطول المركبات',
      currentInvestmentLabel: 'إجمالي استثمارك الحالي في الأسطول:',
      projectedMonthlyReturn: 'العائد الشهري المتوقع (متوسط 4.6%):',
      fiveMonthLockupReturn: 'إجمالي أرباح 5 أشهر (فترة القفل):',
      maturityTotal: 'القيمة الكلية عند الاستحقاق (رأس المال + العوائد):',
      viewMonthly: 'توقع الأرباح الشهرية (6 أشهر)',
      viewCategory: 'مقارنة فئات مركبات الأسطول',
      cargoLegend: 'شاحنات الشحن (4.8%)',
      passengerLegend: 'حافلات المسافرين (4.2%)',
      hybridLegend: 'المحفظة الهجينة (4.6%)',
      customAmountPrompt: 'محاكاة مبالغ استثمارية أخرى:',
      actualBadge: 'استثمارك المعتمد المباشر',
      simulationBadge: 'وضع المحاكاة التقديرية',
    },
    en: {
      title: 'Projected Monthly Earnings & ROI Analytics',
      subtitle: 'Comparative bar chart visualizing projected net monthly earnings based on your current vehicle fleet investment',
      currentInvestmentLabel: 'Current Total Investment:',
      projectedMonthlyReturn: 'Projected Monthly Return (~4.6% avg):',
      fiveMonthLockupReturn: '5-Month Lockup Cumulative Return:',
      maturityTotal: 'Total Value at Maturity (Capital + Returns):',
      viewMonthly: 'Monthly Projection (6 Months)',
      viewCategory: 'Compare Fleet Categories',
      cargoLegend: 'Cargo Freight (4.8%)',
      passengerLegend: 'Passenger Express (4.2%)',
      hybridLegend: 'Hybrid Fleet (4.6%)',
      customAmountPrompt: 'Simulate with custom investment amount:',
      actualBadge: 'Active Portfolio Investment',
      simulationBadge: 'Interactive Simulation Mode',
    },
    ckb: {
      title: 'شیکاری قازانجی مانگانەی ڕەخساو',
      subtitle: 'نەخشەی بەراوردکاری قازانجی مانگانە لەسەر بنەمای سەرمایەگوزاری ئێستات بۆ ئۆتۆمبێلەکان',
      currentInvestmentLabel: 'کۆی سەرمایەگوزاری ئێستا:',
      projectedMonthlyReturn: 'قازانجی مانگانەی پێشبینیکراو (4.6%):',
      fiveMonthLockupReturn: 'کۆی قازانجی 5 مانگ:',
      maturityTotal: 'کۆی بەهای کۆتایی (سەرمایە + قازانج):',
      viewMonthly: 'پێشبینی مانگانە (6 مانگ)',
      viewCategory: 'بەراوردی جۆرەکانی ئۆتۆمبێل',
      cargoLegend: 'شاحناتی بار (4.8%)',
      passengerLegend: 'پاسەکان (4.2%)',
      hybridLegend: 'تێکەڵاو (4.6%)',
      customAmountPrompt: 'تاقیکردنەوەی بڕی تر:',
      actualBadge: 'سەرمایەی چالاک',
      simulationBadge: 'دۆخی تاقیکاری',
    },
  };

  const l = labels[currentLang] || labels.ar;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
      {/* Header with Title and Mode Badges */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-white">{l.title}</h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">{l.subtitle}</p>
        </div>

        {/* View Switcher Buttons */}
        <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setViewMode('monthly');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'monthly'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{l.viewMonthly}</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setViewMode('category');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'category'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{l.viewCategory}</span>
          </button>
        </div>
      </div>

      {/* Capital Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Investment Amount */}
        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 relative overflow-hidden group hover:border-amber-500/40 transition">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] text-slate-400 font-medium">{l.currentInvestmentLabel}</span>
            <span
              className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
                actualInvested > 0 && activeCapital === actualInvested
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
            >
              {actualInvested > 0 && activeCapital === actualInvested ? l.actualBadge : l.simulationBadge}
            </span>
          </div>
          <p className="text-2xl font-black text-white font-mono">
            ${activeCapital.toLocaleString()} <span className="text-xs text-amber-400">USDT</span>
          </p>
        </div>

        {/* Card 2: Monthly Projected Return */}
        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 group hover:border-emerald-500/40 transition">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] text-slate-400 font-medium">{l.projectedMonthlyReturn}</span>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              +4.6% {currentLang === 'ar' ? 'شهرياً' : '/mo'}
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-400 font-mono">
            +${hybridMonthly.toLocaleString()} <span className="text-xs text-emerald-500">USDT</span>
          </p>
        </div>

        {/* Card 3: 5-Month Lockup Total Yield */}
        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 group hover:border-blue-500/40 transition">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] text-slate-400 font-medium">{l.fiveMonthLockupReturn}</span>
            <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
              5 {currentLang === 'ar' ? 'أشهر' : 'Months'}
            </span>
          </div>
          <p className="text-2xl font-black text-blue-400 font-mono">
            +${(hybridMonthly * 5).toLocaleString()} <span className="text-xs text-blue-500">USDT</span>
          </p>
        </div>

        {/* Card 4: Maturity Total Value */}
        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 group hover:border-purple-500/40 transition">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] text-slate-400 font-medium">{l.maturityTotal}</span>
            <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
              123% {currentLang === 'ar' ? 'عوائد + رأس المال' : 'ROI + Principal'}
            </span>
          </div>
          <p className="text-2xl font-black text-purple-300 font-mono">
            ${(activeCapital + hybridMonthly * 5).toLocaleString()} <span className="text-xs text-purple-400">USDT</span>
          </p>
        </div>
      </div>

      {/* TRIP & LOGISTIC FREIGHT EARNINGS EXPLANATION BOX */}
      <div className="bg-slate-950/90 p-5 rounded-2xl border border-amber-500/30 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-amber-400 font-extrabold text-sm">
            <Truck className="w-5 h-5 text-amber-400" />
            <span>
              {currentLang === 'ar'
                ? 'آلية احتساب الأرباح التشغيلية (عدد السفرات + الشحن اللوجستي)'
                : 'Operational Profit Formula (Trips + Logistic Freight Revenue)'}
            </span>
          </div>
          <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            {currentLang === 'ar' ? 'قابلة للسحب المباشر' : 'Available for Withdrawal'}
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          {currentLang === 'ar'
            ? 'تُحتسب أرباح المستثمر في منصة أصيل بشكل ديناميكي بناءً على الأداء التشغيلي الميداني للأسطول: عدد السفرات النقل المكتملة شهرياً متضمنة إيرادات الشحن اللوجستي وأجور النقل الثقيل المسجلة بالعقود.'
            : 'Investor profits on the Aseel platform are dynamically computed based on real-world fleet performance: monthly executed transport trips combined with verified logistic freight revenues.'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 text-[11px] block">{currentLang === 'ar' ? 'معدل السفرات الشهري:' : 'Monthly Trips Rate:'}</span>
            <span className="text-white font-extrabold font-mono text-sm">16 {currentLang === 'ar' ? 'سفرة / شاحنة' : 'trips/truck'}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 text-[11px] block">{currentLang === 'ar' ? 'عائد الشحن اللوجستي:' : 'Logistic Freight Rate:'}</span>
            <span className="text-emerald-400 font-extrabold font-mono text-sm">$1,250 USDT / {currentLang === 'ar' ? 'سفرة' : 'trip'}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 text-[11px] block">{currentLang === 'ar' ? 'خيار رأس المال عند الاستحقاق:' : 'Principal Options at Maturity:'}</span>
            <span className="text-amber-400 font-extrabold text-xs">{currentLang === 'ar' ? 'سحب كامل أو إعادة الاستثمار ⚡' : 'Withdraw or Re-invest ⚡'}</span>
          </div>
        </div>
      </div>

      {/* BAR CHART SECTION */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/90 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-bold">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>
              {viewMode === 'monthly'
                ? currentLang === 'ar'
                  ? 'مقارنة الأرباح الشهرية عبر أشهر القفل الخمسة ($ USDT)'
                  : 'Monthly Earnings Comparison Over 6 Months ($ USDT)'
                : currentLang === 'ar'
                ? 'مقارنة العائد الشهري الصافي حسب قطاع المركبات ($ USDT)'
                : 'Net Monthly Return Comparison by Fleet Category ($ USDT)'}
            </span>
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            {currentLang === 'ar' ? 'محتسبة لـ:' : 'Calculated for:'} <strong className="text-amber-400">${activeCapital.toLocaleString()} USDT</strong>
          </div>
        </div>

        {/* Recharts Bar Chart */}
        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === 'monthly' ? (
              <BarChart data={monthlyProjectionData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  cursor={{ fill: '#0f172a' }}
                  contentStyle={{
                    backgroundColor: '#090d16',
                    borderColor: '#334155',
                    borderRadius: '16px',
                    color: '#fff',
                    fontSize: '12px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
                  }}
                  formatter={(value: any) => [`$${Number(value).toLocaleString()} USDT`, '']}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '15px', fontSize: '11px', color: '#94a3b8' }}
                />
                <Bar
                  dataKey="cargo"
                  name={l.cargoLegend}
                  fill="#f59e0b"
                  radius={[6, 6, 0, 0]}
                  barSize={18}
                />
                <Bar
                  dataKey="passenger"
                  name={l.passengerLegend}
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  barSize={18}
                />
                <Bar
                  dataKey="hybrid"
                  name={l.hybridLegend}
                  fill="#ec4899"
                  radius={[6, 6, 0, 0]}
                  barSize={18}
                />
              </BarChart>
            ) : (
              <BarChart data={categoryComparisonData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="category" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  cursor={{ fill: '#0f172a' }}
                  contentStyle={{
                    backgroundColor: '#090d16',
                    borderColor: '#334155',
                    borderRadius: '16px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(value: any, name: any, item: any) => [
                    `$${Number(value).toLocaleString()} USDT / month (${item.payload.rate})`,
                    currentLang === 'ar' ? 'العائد الشهري' : 'Monthly Earnings',
                  ]}
                />
                <Bar dataKey="monthlyEarning" radius={[8, 8, 0, 0]} barSize={40}>
                  {categoryComparisonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Simulator Preset Buttons */}
      <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
          <Calculator className="w-4 h-4 text-amber-400" />
          <span>{l.customAmountPrompt}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono">
          {[1000, 5000, 10000, 25000, 50000, 100000].map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setSimulatedAmount(amt);
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                activeCapital === amt
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
              }`}
            >
              ${amt.toLocaleString()}
            </button>
          ))}
          {actualInvested > 0 && activeCapital !== actualInvested && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setSimulatedAmount(actualInvested);
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500/30 transition cursor-pointer"
            >
              {currentLang === 'ar' ? 'إعادة لاستثماري الحقيقي' : 'Reset to My Active Investment'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
