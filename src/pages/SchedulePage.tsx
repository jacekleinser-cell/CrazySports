import React from 'react';
import { Scoreboard } from '../components/Scoreboard';

export const SchedulePage = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <span className="w-2 h-8 bg-purple-500 rounded-full" />
        Schedule
      </h2>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 text-center text-slate-500">
        <p>Upcoming games will appear here.</p>
        {/* Reusing Scoreboard for now as it shows upcoming games too */}
        <div className="mt-8">
          <Scoreboard />
        </div>
      </div>
    </div>
  );
};
