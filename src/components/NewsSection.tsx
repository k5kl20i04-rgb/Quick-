import React, { useState, useEffect } from 'react';
import { Newspaper, Bell, Sparkles, Calendar, User, Tag, ArrowRight, Eye, Pin, ChevronLeft } from 'lucide-react';
import { Language, NewsArticle } from '../types';
import { translations } from '../i18n/translations';
import { supabase, getSupabaseAdminNews } from '../lib/supabaseClient';

interface NewsSectionProps {
  currentLang: Language;
}

export const NewsSection: React.FC<NewsSectionProps> = ({ currentLang }) => {
  const t = translations[currentLang] || translations.ar;
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeArticle, setActiveArticle] = useState<NewsArticle | null>(null);

  // دالة جلب وعرض الأخبار في واجهة المستثمر
  const loadAdminNews = async () => {
    try {
      setLoading(true);

      // 1. جلب الأخبار من جدول admin_news في Supabase أولاً
      const sbNews = await getSupabaseAdminNews();
      if (sbNews && sbNews.length > 0) {
        console.log("الأخبار المسترجعة من Supabase:", sbNews);
        setArticles(sbNews);
        return;
      }

      // 2. الاستعلام المباشر كخيار احتياطي إذا لزم الأمر
      const { data, error } = await supabase
        .from('admin_news')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("خطأ في جلب الأخبار:", error.message);
      } else if (data && data.length > 0) {
        console.log("الأخبار المسترجعة:", data);
        const mapped: NewsArticle[] = data.map((item: any) => ({
          id: item.id,
          title: item.title || item.title_ar || 'إعلان إداري',
          content: item.content || item.content_ar || '',
          category: item.category || 'announcement',
          imageUrl: item.image_url || item.imageUrl || 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80',
          isPinned: Boolean(item.is_pinned || item.isPinned),
          publishedAt: item.created_at || item.publishedAt || new Date().toISOString(),
          author: item.author || 'إدارة الأصيل',
        }));
        setArticles(mapped);
        return;
      }

      // 3. Fallback to API endpoint
      const res = await fetch('/api/news');
      if (res.ok) {
        const apiData = await res.json();
        if (apiData.news) setArticles(apiData.news);
      }
    } catch (err) {
      console.warn('فشل جلب الأخبار:', err);
    } finally {
      setLoading(false);
    }
  };

  // تشغيل الدالة عند فتح الصفحة
  useEffect(() => {
    loadAdminNews();
  }, []);

  const filteredArticles = articles.filter((a) => {
    if (selectedCategory === 'all') return true;
    return a.category === selectedCategory;
  });

  const getLocalizedText = (textObj: any) => {
    if (!textObj) return '';
    if (typeof textObj === 'string') return textObj;
    return textObj[currentLang] || textObj.ar || textObj.en || '';
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-2 relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 rtl:space-x-reverse px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
            <Newspaper className="w-3.5 h-3.5" />
            <span>{currentLang === 'ar' ? 'مركز الأخبار والإعلانات الرسمية' : 'News & Announcements'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {currentLang === 'ar' ? 'نشرة التحديثات والتقارير اللوجستية' : 'Platform News & Logistics Updates'}
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
            {currentLang === 'ar'
              ? 'متابعة حية لإعلانات الإدارة، قرارات صرف الأرباح، وتحديثات توسعة أسطول مركبات أصيل في العراق والمنطقة.'
              : 'Live updates on official announcements, profit distributions, and fleet expansion across routes.'}
          </p>
        </div>

        {/* Categories Filter Pills */}
        <div className="flex flex-wrap gap-2 relative z-10">
          {[
            { id: 'all', labelAr: 'الكل', labelEn: 'All' },
            { id: 'distribution', labelAr: 'توزيعات الأرباح', labelEn: 'Payouts' },
            { id: 'fleet_update', labelAr: 'تحديثات الأسطول', labelEn: 'Fleet Updates' },
            { id: 'announcement', labelAr: 'إعلانات إدارية', labelEn: 'Announcements' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              {currentLang === 'ar' ? cat.labelAr : cat.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-500">
          <p>{currentLang === 'ar' ? 'جاري تحميل المستجدات والأخبار...' : 'Loading latest news...'}</p>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 space-y-3">
          <Newspaper className="w-10 h-10 mx-auto text-slate-600" />
          <p className="font-semibold">{currentLang === 'ar' ? 'لا توجد منشورات في هذه الفئة حالياً.' : 'No news available in this category.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => {
            const title = getLocalizedText(article.title);
            const content = getLocalizedText(article.content);

            return (
              <div
                key={article.id}
                onClick={() => setActiveArticle(article)}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl overflow-hidden shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl flex flex-col justify-between group cursor-pointer relative"
              >
                {/* Pinned Badge */}
                {article.isPinned && (
                  <div className="absolute top-3 right-3 rtl:right-auto rtl:left-3 z-10">
                    <span className="px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center gap-1 shadow-md">
                      <Pin className="w-3 h-3 fill-slate-950" />
                      <span>{currentLang === 'ar' ? 'مثبت' : 'Pinned'}</span>
                    </span>
                  </div>
                )}

                {/* Article Image Header */}
                <div className="relative h-48 overflow-hidden bg-slate-950">
                  <img
                    src={article.imageUrl || 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80'}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />
                  
                  {/* Category Pill */}
                  <div className="absolute bottom-3 left-4 rtl:left-auto rtl:right-4">
                    <span className="px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-amber-400 text-[10px] font-extrabold border border-amber-500/30">
                      {article.category === 'distribution'
                        ? (currentLang === 'ar' ? 'توزيعات أرباح' : 'Payout')
                        : article.category === 'fleet_update'
                        ? (currentLang === 'ar' ? 'تحديث أسطول' : 'Fleet Update')
                        : (currentLang === 'ar' ? 'إعلان هام' : 'Announcement')}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-base font-extrabold text-white group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
                      {title}
                    </h3>
                    <p className="text-slate-400 text-xs mt-2.5 line-clamp-3 leading-relaxed">
                      {content}
                    </p>
                  </div>

                  {/* Metadata & Read CTA */}
                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                    </div>

                    <span className="text-amber-400 font-bold flex items-center gap-1 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
                      <span>{currentLang === 'ar' ? 'اقرأ التفاصيل' : 'Read Article'}</span>
                      <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Article Reader Modal */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl relative flex flex-col">
            
            {/* Header Image */}
            <div className="relative h-64 overflow-hidden bg-slate-950 shrink-0">
              <img
                src={activeArticle.imageUrl || 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=80'}
                alt={getLocalizedText(activeArticle.title)}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
              
              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                className="absolute top-4 right-4 rtl:right-auto rtl:left-4 p-2 rounded-full bg-slate-950/80 hover:bg-slate-950 text-white border border-slate-700 transition-colors cursor-pointer"
              >
                ✕
              </button>

              <div className="absolute bottom-4 left-6 right-6">
                <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-black shadow-lg">
                  {activeArticle.category === 'distribution'
                    ? (currentLang === 'ar' ? 'توزيعات أرباح' : 'Payout')
                    : (currentLang === 'ar' ? 'إعلان رسمية' : 'Official Notice')}
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-2 leading-tight">
                  {getLocalizedText(activeArticle.title)}
                </h2>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 text-slate-300 leading-relaxed text-sm">
              <div className="flex items-center space-x-4 rtl:space-x-reverse text-xs text-slate-400 border-b border-slate-800 pb-4">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>{activeArticle.author || 'إدارة الأصيل'}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>{new Date(activeArticle.publishedAt).toLocaleString()}</span>
                </span>
              </div>

              <div className="whitespace-pre-line leading-relaxed text-slate-200">
                {getLocalizedText(activeArticle.content)}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition-all cursor-pointer"
              >
                {currentLang === 'ar' ? 'إغلاق النشرة' : 'Close Article'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
