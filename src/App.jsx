import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

function App() {
  const [currentDate, setCurrentDate] = useState('2026-03-27');
  const [dailyData, setDailyData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('brief');

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetch(`/${currentDate}.json`)
      .then((response) => {
        if (!response.ok) throw new Error('今日报纸尚未发行，请查阅其他日期。');
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
    <div className="min-h-screen bg-[#F9F8F6] py-12 px-4 font-serif text-stone-900 selection:bg-stone-300">
      <div className="max-w-3xl mx-auto">

        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-stone-900 uppercase mb-4 border-b-4 border-double border-stone-800 pb-6">
            The Daily Brief
            <span className="block text-xl md:text-2xl font-bold tracking-widest text-stone-700 mt-2">市场盘前简报</span>
          </h1>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm font-medium text-stone-600 uppercase tracking-widest">
            <span>Vol. {currentDate.split('-')[0]}</span>
            <span className="hidden md:inline">•</span>
            <div className="relative inline-block border-b border-stone-400 hover:border-stone-800 transition-colors">
              <input
                type="date"
                value={currentDate}
                onChange={handleDateChange}
                className="bg-transparent appearance-none outline-none cursor-pointer font-serif text-stone-800 text-center w-32"
              />
            </div>
            <span className="hidden md:inline">•</span>
            <span>Est. 2026</span>
          </div>

          {!isLoading && !error && dailyData && (
            <div className="mt-4 text-xs italic text-stone-500">
              {dailyData.status?.header_template?.replace('[success] ', '') || 'Published Successfully'}
            </div>
          )}
        </header>

        <nav className="flex justify-center gap-8 border-y border-stone-300 py-3 mb-10 text-sm font-bold uppercase tracking-widest">
          <button
            onClick={() => setActiveTab('brief')}
            className={`transition-colors ${activeTab === 'brief' ? 'text-stone-900 border-b-2 border-stone-900' : 'text-stone-400 hover:text-stone-700'}`}
          >
            每日简报
          </button>
          <button
            onClick={() => setActiveTab('fun_fact')}
            className={`transition-colors ${activeTab === 'fun_fact' ? 'text-stone-900 border-b-2 border-stone-900' : 'text-stone-400 hover:text-stone-700'}`}
          >
            冷知识
          </button>
          <button
            onClick={() => setActiveTab('articles')}
            className={`transition-colors ${activeTab === 'articles' ? 'text-stone-900 border-b-2 border-stone-900' : 'text-stone-400 hover:text-stone-700'}`}
          >
            文章精选
          </button>
        </nav>

        <main className="min-h-[400px]">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 text-stone-400">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-stone-800" />
              <p className="text-sm uppercase tracking-widest">Fetching the latest dispatch...</p>
            </div>
          )}

          {error && !isLoading && (
            <div className="border border-stone-300 bg-stone-100 p-10 text-center">
              <h3 className="text-2xl font-bold text-stone-800 mb-2">No Publication Found</h3>
              <p className="text-stone-600 italic">{error}</p>
            </div>
          )}

          {!isLoading && !error && dailyData && (
            <div>

              {activeTab === 'brief' && (
                <div className="space-y-12">
                  {dailyData.events.map((event, index) => {
                    const isBondReview = event.headline.includes('【债券点评】');

                    return (
                      <article key={index} className="relative pl-6 border-l border-stone-300 group">
                        <div className="flex items-baseline gap-4 mb-3">
                          <time className="text-sm font-bold text-stone-900">{event.display_time}</time>
                          <span className="text-[10px] uppercase tracking-widest font-bold text-stone-500 border border-stone-300 px-1.5 py-0.5">
                            {event.primary_category.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="prose prose-stone prose-lg max-w-none text-stone-800 leading-relaxed">
                          {isBondReview ? (
                            <div className="bg-stone-100/50 border border-stone-200 p-6 my-4 shadow-sm">
                              <h3 className="text-xl font-bold text-stone-900 mb-4 border-b border-stone-300 pb-2 uppercase tracking-wide">
                                债券市场早盘点评
                              </h3>
                              <p className="whitespace-pre-wrap">
                                {event.headline.replace('【债券点评】', '').trim()}
                              </p>
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap">{event.headline}</p>
                          )}
                        </div>
                        {event.source_badges && event.source_badges.length > 0 && (
                          <div className="mt-4 flex gap-2">
                            {event.source_badges.map((source, idx) => (
                              <span key={idx} className="text-[10px] uppercase tracking-widest font-semibold text-stone-400">
                                — {source}
                              </span>
                            ))}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}

              {activeTab === 'fun_fact' && dailyData.fun_fact && (
                <div className="max-w-xl mx-auto text-center py-10">
                  <span className="block text-4xl mb-6 text-stone-300">❦</span>
                  <h2 className="text-2xl font-bold uppercase tracking-widest mb-6 border-b border-stone-300 pb-4 inline-block">
                    {dailyData.fun_fact.title || 'Fun Fact'}
                  </h2>
                  <p className="text-lg leading-loose text-stone-700 italic">
                    {dailyData.fun_fact.content}
                  </p>
                </div>
              )}

              {activeTab === 'articles' && dailyData.selected_articles && (
                <div className="max-w-2xl mx-auto py-6">
                  <h2 className="text-2xl font-bold uppercase tracking-widest mb-8 text-center border-b-2 border-stone-800 pb-4">
                    Editorial Picks
                  </h2>
                  <ul className="space-y-8">
                    {dailyData.selected_articles.map((article, idx) => (
                      <li key={idx} className="group border-b border-stone-200 pb-6 last:border-0">
                        <a href={article.url} target="_blank" rel="noreferrer" className="block hover:opacity-75 transition-opacity">
                          <h4 className="text-xl font-bold text-stone-900 mb-2 leading-snug">{article.title}</h4>
                          <p className="text-sm font-bold uppercase tracking-widest text-stone-500">By {article.source}</p>
                        </a>
                      </li>
                    ))}
                  </ul>
                  {dailyData.selected_articles.length === 0 && (
                    <p className="text-center text-stone-500 italic py-10">今日暂无精选文章。</p>
                  )}
                </div>
              )}

            </div>
          )}
        </main>

        <footer className="mt-20 pt-8 border-t border-stone-300 text-center pb-12">
          <p className="text-xs uppercase tracking-widest text-stone-400 font-bold">
            Printed digitally • Intelligent Output System © {new Date().getFullYear()}
          </p>
        </footer>

      </div>
    </div>
  );
}

export default App;
