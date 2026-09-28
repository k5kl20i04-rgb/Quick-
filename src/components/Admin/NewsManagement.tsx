import React, { useState, useEffect } from 'react';
import { Newspaper, Plus, Trash2, Edit3, Pin, CheckCircle2, AlertCircle, Image as ImageIcon, Send } from 'lucide-react';
import { Language, NewsArticle } from '../../types';
import { getSupabaseAdminNews, upsertSupabaseAdminNews, deleteSupabaseAdminNews } from '../../lib/supabaseClient';

interface NewsManagementProps {
  currentLang: Language;
}

export const NewsManagement: React.FC<NewsManagementProps> = ({ currentLang }) => {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);

  // Form State
  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [contentAr, setContentAr] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [category, setCategory] = useState<'announcement' | 'fleet_update' | 'distribution' | 'general'>('announcement');
  const [imageUrl, setImageUrl] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const sbNews = await getSupabaseAdminNews();
      if (sbNews && sbNews.length > 0) {
        setNews(sbNews);
        setLoading(false);
        return;
      }
      const res = await fetch('/api/news');
      if (res.ok) {
        const data = await res.json();
        if (data.news) setNews(data.news);
      }
    } catch (err) {
      console.warn('Failed to load news for admin', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleOpenForm = (article?: NewsArticle) => {
    setStatusMsg(null);
    if (article) {
      setEditingArticle(article);
      const titleObj = typeof article.title === 'object' ? article.title : { ar: article.title, en: article.title, ckb: article.title };
      const contentObj = typeof article.content === 'object' ? article.content : { ar: article.content, en: article.content, ckb: article.content };
      setTitleAr(titleObj.ar || '');
      setTitleEn(titleObj.en || '');
      setContentAr(contentObj.ar || '');
      setContentEn(contentObj.en || '');
      setCategory(article.category || 'announcement');
      setImageUrl(article.imageUrl || '');
      setIsPinned(Boolean(article.isPinned));
    } else {
      setEditingArticle(null);
      setTitleAr('');
      setTitleEn('');
      setContentAr('');
      setContentEn('');
      setCategory('announcement');
      setImageUrl('');
      setIsPinned(false);
    }
    setIsFormOpen(true);
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (!titleAr.trim() || !contentAr.trim()) {
      setStatusMsg({ type: 'error', text: currentLang === 'ar' ? 'يرجى إدخال عنوان ومحتوى الخبر باللغة العربية' : 'Arabic title and content are required' });
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingArticle?.id,
          title: {
            ar: titleAr,
            en: titleEn || titleAr,
            ckb: titleAr,
          },
          content: {
            ar: contentAr,
            en: contentEn || contentAr,
            ckb: contentAr,
          },
          category,
          imageUrl: imageUrl.trim() || undefined,
          isPinned,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save news');

      if (data.article) {
        await upsertSupabaseAdminNews(data.article);
      }

      setStatusMsg({
        type: 'success',
        text: currentLang === 'ar' ? 'تم نشر وتوثيق الخبر بنجاح وإشعار جميع الأعضاء!' : 'News article saved and broadcasted successfully!',
      });

      if (data.news) setNews(data.news);
      setTimeout(() => {
        setIsFormOpen(false);
        setStatusMsg(null);
      }, 1500);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Error saving news article' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm(currentLang === 'ar' ? 'هل أنت تأكد من حذف هذا الخبر رسمياً؟' : 'Are you sure you want to delete this article?')) return;
    try {
      await deleteSupabaseAdminNews(id);
      const res = await fetch(`/api/news/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNews((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete news', err);
    }
  };

  const getLocalizedTitle = (a: NewsArticle) => {
    if (typeof a.title === 'string') return a.title;
    return a.title?.ar || a.title?.en || '';
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Newspaper className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">
              {currentLang === 'ar' ? 'إدارة النشرة الإخبارية والإعلانات الرسمية' : 'News & Announcements Publishing'}
            </h3>
            <p className="text-xs text-slate-400">
              {currentLang === 'ar'
                ? 'نشر مستجدات الأسطول، قرارات التوزيعات، والتنبيهات العامة للمستثمرين'
                : 'Publish fleet updates, yield announcements, and platform notices'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleOpenForm()}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center space-x-2 rtl:space-x-reverse cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{currentLang === 'ar' ? 'نشر خبر / إعلان جديد' : 'Publish New Article'}</span>
        </button>
      </div>

      {/* Form Drawer / Modal */}
      {isFormOpen && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-base font-extrabold text-amber-400">
              {editingArticle
                ? (currentLang === 'ar' ? 'تعديل النشرة الإخبارية' : 'Edit News Article')
                : (currentLang === 'ar' ? 'كتابة ونشر خبر جديد' : 'Publish New Article')}
            </h4>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-slate-400 hover:text-white text-xs font-bold"
            >
              ✕ {currentLang === 'ar' ? 'إغلاق' : 'Close'}
            </button>
          </div>

          {statusMsg && (
            <div
              className={`p-4 rounded-2xl text-xs flex items-center gap-2 border ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleSaveArticle} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">{currentLang === 'ar' ? 'عنوان الخبر (بالعربية):' : 'Title (Arabic):'}</label>
                <input
                  type="text"
                  required
                  value={titleAr}
                  onChange={(e) => setTitleAr(e.target.value)}
                  placeholder="مثال: 🚀 توزيع أرباح أسطول شاحنات مرسيدس لشهر أغسطس"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-2.5 px-4 text-white focus:outline-none focus:border-amber-500 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">{currentLang === 'ar' ? 'عنوان الخبر (بالإنجليزية - اختياري):' : 'Title (English):'}</label>
                <input
                  type="text"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder="e.g. August 2026 Fleet Yield Distributed"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-2.5 px-4 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">{currentLang === 'ar' ? 'فئة الخبر:' : 'Category:'}</label>
                <select
                  value={category}
                  onChange={(e: any) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-2.5 px-4 text-white focus:outline-none focus:border-amber-500 font-bold"
                >
                  <option value="announcement">{currentLang === 'ar' ? 'إعلان إداري عام' : 'General Announcement'}</option>
                  <option value="distribution">{currentLang === 'ar' ? 'توزيعات وإيداع أرباح' : 'Yield / Payout'}</option>
                  <option value="fleet_update">{currentLang === 'ar' ? 'تحديثات وتوسعة الأسطول' : 'Fleet Expansion'}</option>
                  <option value="general">{currentLang === 'ar' ? 'مستجدات عامة' : 'General News'}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">{currentLang === 'ar' ? 'رابط صورة الخبر (URL):' : 'Article Image URL:'}</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-2.5 px-4 text-white focus:outline-none focus:border-amber-500 font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-300">{currentLang === 'ar' ? 'محتوى الخبر والنشرة:' : 'Content:'}</label>
              <textarea
                required
                rows={4}
                value={contentAr}
                onChange={(e) => setContentAr(e.target.value)}
                placeholder="اكتب التاصيل الكاملة للنشرة الإخبارية هنا..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:outline-none focus:border-amber-500 leading-relaxed"
              />
            </div>

            <div className="flex items-center space-x-2 rtl:space-x-reverse pt-1">
              <input
                type="checkbox"
                id="pinCheckbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-0"
              />
              <label htmlFor="pinCheckbox" className="font-bold text-slate-300 cursor-pointer">
                {currentLang === 'ar' ? 'تثبيت الخبر في أعلى القائمة الرئيسية' : 'Pin article to top of news feed'}
              </label>
            </div>

            <div className="flex items-center justify-end space-x-3 rtl:space-x-reverse pt-3">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
              >
                {currentLang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? (currentLang === 'ar' ? 'جاري النشر...' : 'Saving...') : (currentLang === 'ar' ? 'نشر وإرسال إشعار' : 'Publish & Broadcast')}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Articles List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            {currentLang === 'ar' ? 'جاري تحميل الأخبار...' : 'Loading news articles...'}
          </div>
        ) : news.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            {currentLang === 'ar' ? 'لا توجد منشورات حتى الآن.' : 'No published news found.'}
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {news.map((item) => (
              <div key={item.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-950/40 transition-colors">
                <div className="flex items-start space-x-4 rtl:space-x-reverse">
                  <img
                    src={item.imageUrl || 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80'}
                    alt="News"
                    className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-slate-800"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white text-sm line-clamp-1">{getLocalizedTitle(item)}</span>
                      {item.isPinned && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black border border-amber-500/30 flex items-center gap-1">
                          <Pin className="w-2.5 h-2.5" />
                          <span>مثبت</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-1">
                      {typeof item.content === 'object' ? item.content.ar || item.content.en : item.content}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span>{new Date(item.publishedAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="text-amber-400 font-bold">{item.category}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 rtl:space-x-reverse self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleOpenForm(item)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                    title="تعديل"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteArticle(item.id)}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
