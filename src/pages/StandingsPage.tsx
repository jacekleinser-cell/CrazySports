import React from 'react';
import { Standings } from '../components/Standings';
import { useSports, Sport, League } from '../context/SportsContext';
import { ChevronDown } from 'lucide-react';

export const StandingsPage = () => {
  const { sport, league, setSportLeague } = useSports();

  const leagues: { name: string; sport: Sport; league: League }[] = [
    { name: 'NBA', sport: 'basketball', league: 'nba' },
    { name: 'NFL', sport: 'football', league: 'nfl' },
    { name: 'MLB', sport: 'baseball', league: 'mlb' },
    { name: 'NHL', sport: 'hockey', league: 'nhl' },
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <span className="w-2 h-8 bg-indigo-500 rounded-full" />
          Standings
        </h2>

        <div className="relative">
          <select
            value={league}
            onChange={(e) => {
              const selected = leagues.find(l => l.league === e.target.value);
              if (selected) {
                setSportLeague(selected.sport, selected.league);
              }
            }}
            className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white py-2 pl-4 pr-10 rounded-lg font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {leagues.map((l) => (
              <option key={l.league} value={l.league}>
                {l.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        </div>
      </div>
      
      <Standings />
    </div>
  );
};
