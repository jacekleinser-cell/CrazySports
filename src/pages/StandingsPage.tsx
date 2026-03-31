import React, { useState } from 'react';
import { Standings } from '../components/Standings';
import { useSports, Sport, League } from '../context/SportsContext';
import { ChevronDown } from 'lucide-react';

export const StandingsPage = () => {
  const leagues: { name: string; sport: Sport; league: League }[] = [
    { name: 'NBA', sport: 'basketball', league: 'nba' },
    { name: 'NFL', sport: 'football', league: 'nfl' },
    { name: 'MLB', sport: 'baseball', league: 'mlb' },
    { name: 'NHL', sport: 'hockey', league: 'nhl' },
  ];

  const [selectedLeague, setSelectedLeague] = useState(leagues[0]);

  return (
    <div className="container mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-6">
        <span className="w-2 h-8 bg-indigo-500 rounded-full" />
        Standings
      </h2>
      
      <div className="mb-6">
        <select
          value={selectedLeague.league}
          onChange={(e) => setSelectedLeague(leagues.find(l => l.league === e.target.value)!)}
          className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-800 dark:text-white"
        >
          {leagues.map(l => (
            <option key={l.league} value={l.league}>{l.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-12">
        <div key={selectedLeague.league}>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">{selectedLeague.name}</h3>
          <Standings sport={selectedLeague.sport} league={selectedLeague.league} />
        </div>
      </div>
    </div>
  );
};
