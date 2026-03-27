import React, { useState, useEffect } from 'react';
import { Activity, Clock, FileText, TrendingUp, ShieldAlert, Zap, Calendar, Loader2, Lightbulb, BookOpen, ExternalLink } from 'lucide-react';

const getCategoryAssets = (category) => {
  const assets = {
    'liquidity': { icon: Zap, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
    'rates_bonds': { icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' },
    'macro_cn': { icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    'macro_global': { icon: Activity, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-200' },
    'fx_gold_commodities': { icon: TrendingUp, color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    'equity_a': { icon: FileText, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-200' },
    'policy': { icon: ShieldAlert, color: 'text-teal-500', bg: 'bg-teal-50', border: 'border-teal-200' },
    'other_review': { icon: Clock, color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-200' },
    'default': { icon: Clock, color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-200' }
  };
  return assets[category] || assets['default'];
};

function App() {
  const [currentDate, setCurrentDate] = useState('2026-03-27');
  const [dailyData, setDailyData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetch(`/${currentDate}.json`)
      .then((response) => {
        if (!response.ok) throw new Error('今天好像没有简报数据哦，换一天试试吧！');
        return response.json();
      })
      .then((data) => {
        setDailyData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });
  }, [currentDate]);

  const handleDateChange = (e) => {
    setCurrentDate(e.target.value);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 font-sans text-slate-900">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 pb-6 border-b border-slate-200 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">市场盘前简报</h1>
            </div>
            <div className="flex items-center gap-2 mt-4 ml-5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={currentDate}
                onChange={handleDateChange}
                className="bg-white border border-slate-200 text-sm font-medium text-slate-700 px-3 py-1.5 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
              />
            </div>
          </div>
          {!isLoading && !error && dailyData && (
            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm">
              <ShieldAlert className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-semibold text-slate-700">
                {dailyData.status?.header_template?.replace('[success] ', '') || '数据加载成功'}
              </span>
            </div>
          )}
        </header>

        <main className="relative pl-0 md:pl-8">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
              <p className="text-sm font-medium tracking-widest uppercase">正在从情报库调取数据...</p>
            </div>
          )}

          {error && !isLoading && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center ml-4 md:ml-0">
              <span className="text-4xl mb-4 block">📭</span>
              <h3 className="text-lg font-bold text-rose-800 mb-2">未找到简报</h3>
              <p className="text-rose-600 text-sm">{error}</p>
            </div>
          )}

          {!isLoading && !error && dailyData && (
            <>
              <div className="relative pl-4 md:pl-0">
                <div className="absolute left-4 md:left-0 top-0 bottom-0 w-px bg-slate-200"></div>
                <div className="space-y-10">
                  {dailyData.events.map((event, index) => {
                    const { icon: Icon, color, bg, border } = getCategoryAssets(event.primary_category);
                    const isBondReview = event.headline.includes('【债券点评】');

                    return (
                      <article key={index} className="relative pl-8 md:pl-12 group">
                        <div className={`absolute left-[-16px] md:left-[-16px] top-1 w-8 h-8 rounded-full border-4 border-[#F8FAFC] flex items-center justify-center ${bg} shadow-sm z-10`}>
                          <Icon className={`w-3.5 h-3.5 ${color}`} />
                        </div>
                        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                          <div className="md:w-20 flex-shrink-0 pt-1">
                            <time className="text-sm font-mono font-bold text-slate-500">{event.display_time}</time>
                          </div>
                          <div className={`flex-1 bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all ${isBondReview ? 'ring-1 ring-amber-100' : ''}`}>
                            <div className="mb-3">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${bg} ${color} ${border}`}>
                                {event.primary_category.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="prose prose-slate prose-sm md:prose-base max-w-none text-slate-700">
                              {isBondReview ? (
                                <div>
                                  <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-amber-500" />债券市场早盘点评
                                  </h3>
                                  <p className="whitespace-pre-wrap leading-loose">{event.headline.replace('【债券点评】', '').trim()}</p>
                                </div>
                              ) : (
                                <p className="whitespace-pre-wrap leading-relaxed text-[15px] font-medium text-slate-800">{event.headline}</p>
                              )}
                            </div>
                            <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                              {event.source_badges?.map((source, idx) => (
                                <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase tracking-widest">{source}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>

              <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6 ml-4 md:ml-12">
                {dailyData.fun_fact && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 shadow-sm">
                    <h3 className="flex items-center gap-2 text-indigo-900 font-bold mb-3">
                      <Lightbulb className="w-5 h-5 text-indigo-500" />
                      {dailyData.fun_fact.title || '每日冷知识'}
                    </h3>
                    <p className="text-indigo-800/80 text-sm leading-relaxed">
                      {dailyData.fun_fact.content}
                    </p>
                  </div>
                )}

                {dailyData.selected_articles && dailyData.selected_articles.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="flex items-center gap-2 text-slate-900 font-bold mb-4">
                      <BookOpen className="w-5 h-5 text-blue-500" />
                      文章精选
                    </h3>
                    <ul className="space-y-4">
                      {dailyData.selected_articles.map((article, idx) => (
                        <li key={idx} className="group">
                          <a href={article.url} target="_blank" rel="noreferrer" className="block">
                            <h4 className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors flex items-start gap-1">
                              {article.title}
                              <ExternalLink className="w-3 h-3 mt-1 flex-shrink-0 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </h4>
                            <p className="text-xs text-slate-500 mt-1">{article.source}</p>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
