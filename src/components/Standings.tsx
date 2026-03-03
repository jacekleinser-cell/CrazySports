import React, { useEffect, useState } from 'react';
import { useSports } from '../context/SportsContext';
import { useFavorites } from '../context/FavoritesContext';
import { getStandings, Standing } from '../services/espn';
import { cn } from '../lib/utils';
import { ChevronRight, Star } from 'lucide-react';

export const Standings = () => {
  const { sport, league } = useSports();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    const fetchStandings = async () => {
      setLoading(true);
      const data = await getStandings(sport, league);
      setStandings(data);
      setLoading(false);
    };

    fetchStandings();
  }, [sport, league]);

  const toggleFavorite = (e: React.MouseEvent, team: Standing['team']) => {
    e.stopPropagation();
    if (isFavorite(team.id)) {
      removeFavorite(team.id);
    } else {
      addFavorite({
        id: team.id,
        name: team.displayName,
        league: league,
        logo: team.logos?.[0]?.href
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-slate-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (standings.length === 0) {
    return <div className="p-4 text-center text-slate-500">Standings not available for this league.</div>;
  }

  // Helper to get stat value safely
  const getStat = (team: Standing, name: string) => {
    return team.stats?.find(s => s.name === name || s.abbreviation === name)?.displayValue || '-';
  };

  const filteredStandings = showFavoritesOnly 
    ? standings.filter(entry => isFavorite(entry.team?.id))
    : standings;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border",
            showFavoritesOnly 
              ? "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800" 
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
          )}
        >
          <Star className={cn("w-4 h-4", showFavoritesOnly && "fill-yellow-400")} />
          {showFavoritesOnly ? "Showing My Teams" : "Show My Teams Only"}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium uppercase text-xs">
              <tr>
                <th className="px-4 py-3 w-10"></th>
                <th className="px-4 py-3">Team</th>
                <th className="px-4 py-3 text-center">W</th>
                <th className="px-4 py-3 text-center">L</th>
                <th className="px-4 py-3 text-center">PCT</th>
                <th className="px-4 py-3 text-center">GB</th>
                <th className="px-4 py-3 text-center">STRK</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredStandings.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                    {showFavoritesOnly 
                      ? "No favorite teams yet. Click the star icon next to a team to add it to your favorites!" 
                      : "No standings available."}
                  </td>
                </tr>
              )}
              {filteredStandings.map((entry, idx) => (
                <React.Fragment key={entry.team?.id || idx}>
                  <tr 
                    onClick={() => setSelectedTeam(selectedTeam === entry.team?.id ? null : entry.team?.id)}
                    className={cn(
                      "hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer",
                      selectedTeam === entry.team?.id ? "bg-slate-50 dark:bg-slate-700/50" : ""
                    )}
                  >
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => toggleFavorite(e, entry.team)}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full transition-colors"
                      >
                        <Star 
                          className={cn(
                            "w-4 h-4", 
                            isFavorite(entry.team?.id) 
                              ? "fill-yellow-400 text-yellow-400" 
                              : "text-slate-300 dark:text-slate-600"
                          )} 
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white flex items-center gap-3">
                      <span className="text-slate-400 w-4 text-right">{idx + 1}</span>
                      <img src={entry.team?.logos?.[0]?.href} alt={entry.team?.abbreviation} className="w-6 h-6 object-contain" />
                      <span className="hidden sm:inline">{entry.team?.displayName || 'Unknown Team'}</span>
                      <span className="sm:hidden">{entry.team?.abbreviation || 'UNK'}</span>
                      {selectedTeam === entry.team?.id && <ChevronRight className="w-4 h-4 text-emerald-500 ml-auto" />}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-slate-900 dark:text-slate-200">{getStat(entry, 'wins')}</td>
                    <td className="px-4 py-3 text-center font-mono text-slate-900 dark:text-slate-200">{getStat(entry, 'losses')}</td>
                    <td className="px-4 py-3 text-center font-mono text-slate-900 dark:text-slate-200">{getStat(entry, 'winPercent')}</td>
                    <td className="px-4 py-3 text-center font-mono text-slate-500 dark:text-slate-400">{getStat(entry, 'gamesBehind')}</td>
                    <td className="px-4 py-3 text-center font-mono text-xs">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full",
                        getStat(entry, 'streak').startsWith('W') ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                      )}>
                        {getStat(entry, 'streak')}
                      </span>
                    </td>
                  </tr>
                  {selectedTeam === entry.team?.id && (
                    <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                          <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Next Game</div>
                          <div className="text-sm text-slate-900 dark:text-white font-bold">
                             {/* Placeholder for next game data since it's not in the standings API */}
                             vs. Opponent (TBD)
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-500">
                            Check Schedule for details
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
