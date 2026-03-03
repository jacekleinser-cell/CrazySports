import React from 'react';
import { Scoreboard } from '../components/Scoreboard';

export const ScoresPage = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <span className="w-2 h-8 bg-emerald-500 rounded-full" />
        Live Scores
      </h2>
      <Scoreboard />
    </div>
  );
};
