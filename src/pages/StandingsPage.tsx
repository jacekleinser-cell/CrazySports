import React from 'react';
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

  return (
    <div className="container mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-6">
        <span className="w-2 h-8 bg-indigo-500 rounded-full" />
        Standings
      </h2>
      
      <div className="space-y-12">
        {leagues.map((l) => (
          <div key={l.league}>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">{l.name}</h3>
            <Standings sport={l.sport} league={l.league} />
          </div>
        ))}
      </div>
    </div>
  );
};
