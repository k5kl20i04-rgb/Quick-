import React, { useState } from 'react';
import { DollarSign, Layers, CheckCircle2, AlertCircle, Percent, Users, Sparkles, X, PieChart } from 'lucide-react';
import { Project, Investment, Language } from '../../types';

interface PlanProfitDistributionModalProps {
  currentLang: Language;
  projects: Project[];
  investments: Investment[];
  onClose: () => void;
  onSuccess: () => void;
}

export const PlanProfitDistributionModal: React.FC<PlanProfitDistributionModalProps> = ({
  currentLang,
  projects,
  investments,
  onClose,
  onSuccess,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [distributionType, setDistributionType] = useState<'percent' | 'amount'>('percent');
  const [profitValue, setProfitValue] = useState<number>(4.5);
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const activeProject = projects.find((p) => p.id === selectedProjectId);
  const activePlans = activeProject?.plans || [];

  // Strictly filter investments for the selected project and sub-plan
  const planInvestments = investments.filter((i) => {
    if (i.projectId !== selectedProjectId) return false;
    if (i.status !== 'active') return false;
    if (selectedPlanId && i.planId !== selectedPlanId) return false;
    return true;
  });

  const totalPlanCapital = planInvestments.reduce((sum, i) => sum + i.amount, 0);

  // Calculate unique investors count for this plan
  const uniqueInvestorIds = Array.from(new Set(planInvestments.map((i) => i.userId)));
  const uniqueInvestorsCount = uniqueInvestorIds.length;

  // Calculate total profit payout
  let estimatedTotalPayout = 0;
  if (distributionType === 'percent') {
    estimatedTotalPayout = (totalPlanCapital * profitValue) / 100;
  } else {
    estimatedTotalPayout = profitValue;
  }

  // Aggregate user shares for real-time preview breakdown
  const subscriberBreakdown = uniqueInvestorIds.map((uId) => {
    const userInvs = planInvestments.filter((i) => i.userId === uId);
    const userCapital = userInvs.reduce((sum, i) => sum + i.amount, 0);
    const sharePercent = totalPlanCapital > 0 ? (userCapital / totalPlanCapital) * 100 : 0;
    const estimatedPayout = distributionType === 'percent'
      ? (userCapital * profitValue) / 100
      : (profitValue * (userCapital / totalPlanCapital));

    return {
      userId: uId,
      contractsCount: userInvs.length,
      userCapital,
      sharePercent,
      estimatedPayout,
    };
  });

  const handleExecuteDistribution = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedProjectId) {
      setErrorMsg(currentLang === 'ar' ? 'يرجى اختيار المشروع الاستثماري' : 'Please select a project');
      return;
    }

    if (!profitValue || profitValue <= 0) {
      setErrorMsg(currentLang === 'ar' ? 'يرجى إدخال قيمة أرباح صحيحة' : 'Please enter valid profit value');
      return;
    }

    if (planInvestments.length === 0) {
      setErrorMsg(
        currentLang === 'ar'
          ? 'لا يوجد مستثمرون نشطون مشتركون في هذه الخطة حالياً.'
          : 'No active subscribers found in this plan.'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/admin/distribute-plan-profit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId,
          planId: selectedPlanId || undefined,
          distributionType,
          value: profitValue,
          note: note.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Distribution failed');
      }

      setSuccessMsg(
        currentLang === 'ar'
          ? `تم توزيع الأرباح بنجاح بمبلغ إجمالي $${data.totalDistributed?.toFixed(2)} USDT على ${data.uniqueUsersCount || data.payoutsCount} مستثمر في الخطة.`
          : `Successfully distributed $${data.totalDistributed?.toFixed(2)} USDT among ${data.uniqueUsersCount || data.payoutsCount} plan investors.`
      );

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Profit distribution failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative space-y-5 overflow-hidden max-h-[92vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                {currentLang === 'ar' ? 'توزيع أرباح الخطة الاستثمارية الخاصة' : 'Plan-Specific Profit Distribution'}
              </h3>
              <p className="text-xs text-slate-400">
                {currentLang === 'ar'
                  ? 'عزل تام واحتساب التوزيع التناسبي حصرياً على مستثمري الخطة المختارة'
                  : 'Strict isolation and proportional pro-rata distribution per selected plan'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Select Project */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              {currentLang === 'ar' ? '1. اختر المشروع الاستثماري المستهدف:' : '1. Select Target Investment Project:'}
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setSelectedPlanId('');
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title.ar} ({p.category === 'cargo_freight' ? 'شحن وبضائع' : 'نقل مسافرين'})
                </option>
              ))}
            </select>
          </div>

          {/* Select Sub-Plan if available */}
          {activePlans.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-amber-400">
                {currentLang === 'ar' ? '2. اختر المستوى/الخطة المحددة (Plan Tier):' : '2. Select Specific Plan Tier:'}
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full bg-slate-950 border border-amber-500/40 rounded-2xl py-3 px-4 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">{currentLang === 'ar' ? 'جميع خطط هذا المشروع' : 'All Plans in Project'}</option>
                {activePlans.map((pl) => (
                  <option key={pl.id} value={pl.id}>
                    {pl.name.ar} - عائد {pl.monthlyRoiPercent}% شهرياً
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Distribution Method Toggle */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              {currentLang === 'ar' ? '3. طريقة احتساب وتوزيع العائد:' : '3. Profit Calculation Method:'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setDistributionType('percent');
                  setProfitValue(activeProject?.monthlyRoiPercent || 4.5);
                }}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all border cursor-pointer ${
                  distributionType === 'percent'
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Percent className="w-3.5 h-3.5" />
                <span>{currentLang === 'ar' ? 'نسبة مئوية لكل عقد (%)' : 'Percentage Rate (%)'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDistributionType('amount');
                  setProfitValue(5000);
                }}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all border cursor-pointer ${
                  distributionType === 'amount'
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>{currentLang === 'ar' ? 'مبلغ إجمالي مجمع (Pro-Rata)' : 'Total Pool (Pro-Rata)'}</span>
              </button>
            </div>
          </div>

          {/* Profit Value Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              {distributionType === 'percent'
                ? (currentLang === 'ar' ? 'نسبة العائد الصافي للشهر (%):' : 'Monthly ROI Yield Rate (%):')
                : (currentLang === 'ar' ? 'إجمالي الأرباح المجمعة للصرف (USDT):' : 'Total Profit Pool Amount ($):')}
            </label>
            <div className="relative">
              <input
                type="number"
                step={distributionType === 'percent' ? '0.1' : '50'}
                value={profitValue}
                onChange={(e) => setProfitValue(Number(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-4 pr-12 text-sm font-mono font-bold text-white focus:outline-none focus:border-amber-500"
              />
              <span className="absolute inset-y-0 right-4 flex items-center text-amber-400 font-bold text-xs font-mono">
                {distributionType === 'percent' ? '%' : 'USDT'}
              </span>
            </div>
          </div>

          {/* Note Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              {currentLang === 'ar' ? 'ملاحظات وتوضيح للمستثمرين (اختياري):' : 'Distribution Note for Investors (Optional):'}
            </label>
            <input
              type="text"
              placeholder={currentLang === 'ar' ? 'مثال: أرباح رحلات أسطول الشحن لشهر أغسطس' : 'e.g. August Fleet Cargo Revenue'}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Live Preview Summary Card */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <PieChart className="w-4 h-4" />
                <span>{currentLang === 'ar' ? 'معاينة ملخص التوزيع المباشر (Plan Isolated Preview)' : 'Real-time Plan Distribution Preview'}</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                {currentLang === 'ar' ? 'توزيع تناسبي حصري' : 'Strict Isolated Pro-Rata'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-slate-300">
              <div>
                <span className="text-[11px] text-slate-400 block">{currentLang === 'ar' ? 'المستثمرون المستهدفون:' : 'Active Plan Investors:'}</span>
                <span className="font-bold text-amber-400 font-mono text-sm flex items-center gap-1 mt-0.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>{uniqueInvestorsCount} {currentLang === 'ar' ? 'مستثمر' : 'investor(s)'}</span>
                  <span className="text-[10px] text-slate-400 font-normal">({planInvestments.length} {currentLang === 'ar' ? 'عقد' : 'contracts'})</span>
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block">{currentLang === 'ar' ? 'إجمالي رأسمال الخطة:' : 'Total Plan Capital:'}</span>
                <span className="font-bold text-white font-mono text-sm mt-0.5 block">
                  ${totalPlanCapital.toLocaleString()} USDT
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center text-slate-200 font-bold pt-2 border-t border-slate-800/80">
              <span>{currentLang === 'ar' ? 'إجمالي الأرباح الموزعة للـمُشتركين:' : 'Total Profit Payout:'}</span>
              <span className="text-emerald-400 font-mono text-base font-black">+${estimatedTotalPayout.toFixed(2)} USDT</span>
            </div>

            {/* Subscriber Pro-Rata List Breakdown */}
            {subscriberBreakdown.length > 0 && (
              <div className="pt-2 space-y-1.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  {currentLang === 'ar' ? 'جدول توزيع حصص المستثمرين التناسبية (Pro-Rata Shares):' : 'Pro-Rata Investor Shares Breakdown:'}
                </span>
                <div className="max-h-28 overflow-y-auto space-y-1 pr-1 border border-slate-800/60 rounded-xl p-2 bg-slate-900/60">
                  {subscriberBreakdown.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px] py-1 border-b border-slate-800/40 last:border-0">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <span className="w-4 h-4 rounded-full bg-slate-800 text-[9px] flex items-center justify-center text-slate-400 font-mono">{idx + 1}</span>
                        <span className="font-mono text-[10px] text-slate-400">{s.userId.substring(0, 10)}...</span>
                        <span className="text-[10px] text-slate-500">({s.contractsCount} {currentLang === 'ar' ? 'عقد' : 'contracts'})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 font-mono">${s.userCapital.toLocaleString()} <span className="text-[9px] text-amber-400">({s.sharePercent.toFixed(1)}%)</span></span>
                        <span className="text-emerald-400 font-mono font-bold">+${s.estimatedPayout.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer"
          >
            {currentLang === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleExecuteDistribution}
            disabled={isSubmitting || planInvestments.length === 0}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold text-xs transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-1.5 rtl:space-x-reverse"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {isSubmitting
                ? (currentLang === 'ar' ? 'جاري تحويل الأرباح...' : 'Processing...')
                : (currentLang === 'ar' ? 'تأكيد وصرف أرباح الخطة الآن' : 'Execute Plan Profit Distribution')}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
