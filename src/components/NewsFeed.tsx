import React, { useEffect, useState } from 'react';
import { useSports } from '../context/SportsContext';
import { getNews, NewsArticle } from '../services/espn';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink } from 'lucide-react';

export const NewsFeed = () => {
  const { sport, league } = useSports();
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      const data = await getNews(sport, league);
      setNews(data);
      setLoading(false);
    };

    fetchNews();
  }, [sport, league]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="aspect-[4/3] bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {news.map((article, idx) => (
        <a 
          key={idx} 
          href={article.links.web.href} 
          target="_blank" 
          rel="noopener noreferrer"
          className="group block bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
        >
          <div className="aspect-video overflow-hidden relative">
            {article.images?.[0] ? (
              <img 
                src={article.images[0].url} 
                alt={article.images[0].alt || article.headline} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                No Image
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
              <span className="text-white text-sm font-medium flex items-center gap-2">
                Read on ESPN <ExternalLink className="w-4 h-4" />
              </span>
            </div>
          </div>
          <div className="p-5">
            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2 uppercase tracking-wider">
              {article.byline || 'News'} • {formatDistanceToNow(new Date(article.published), { addSuffix: true })}
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {article.headline}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-3">
              {article.description}
            </p>
          </div>
        </a>
      ))}
    </div>
  );
};
