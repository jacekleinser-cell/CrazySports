import React from 'react';
import { NewsFeed } from '../components/NewsFeed';

export const NewsPage = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
        <span className="w-2 h-8 bg-blue-500 rounded-full" />
        Latest News
      </h2>
      <NewsFeed />
    </div>
  );
};
