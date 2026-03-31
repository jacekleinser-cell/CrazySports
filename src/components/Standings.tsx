import React, { useEffect, useState } from 'react';
import { useSports, Sport, League } from '../context/SportsContext';
import { useFavorites } from '../context/FavoritesContext';
import { getStandings, Standing, StandingsGroup } from '../services/espn';
import { cn } from '../lib/utils';
import { ChevronRight, Star } from 'lucide-react';

export const Standings = ({ sport, league }: { sport: Sport; league: League }) => {
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const [groups, setGroups] = useState<StandingsGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    const fetchStandings = async () => {
      // Only set loading true on first fetch
      if (groups.length === 0) setLoading(true);
      const data = await getStandings(sport, league);
      setGroups(data);
      setLoading(false);
    };

    fetchStandings();
    const interval = setInterval(fetchStandings, 60000); // Poll every 60s
    return () => clearInterval(interval);
  }, [sport, league]);

  const toggleFavorite = (e: React.MouseEvent, team: Standing['team']) => {
    e.stopPropagation();
    if (isFavorite(team.id, league)) {
      removeFavorite(team.id, league);
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

  if (groups.length === 0) {
    return <div className="p-4 text-center text-slate-500">Standings not available for this league.</div>;
  }

  // Helper to get stat value safely
  const getStat = (team: Standing, name: string) => {
    return team.stats?.find(s => s.name === name || s.abbreviation === name)?.displayValue || '-';
  };

  const isMLB = league === 'mlb';

  return (
    <div className="space-y-8">
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

      {groups.map((group) => {
        const filteredEntries = showFavoritesOnly 
          ? group.entries.filter(entry => isFavorite(entry.team?.id, league))
          : group.entries;

        // Sort entries by win percentage descending
        const sortedEntries = [...filteredEntries].sort((a, b) => {
          const aPct = parseFloat(getStat(a, 'winPercent')) || 0;
          const bPct = parseFloat(getStat(b, 'winPercent')) || 0;
          return bPct - aPct;
        });

        if (sortedEntries.length === 0 && showFavoritesOnly) return null;

        return (
          <div key={group.name} className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white px-1">{group.name}</h3>
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
                      {isMLB && (
                        <>
                          <th className="px-4 py-3 text-center hidden md:table-cell">RS</th>
                          <th className="px-4 py-3 text-center hidden md:table-cell">RA</th>
                          <th className="px-4 py-3 text-center hidden md:table-cell">DIFF</th>
                          <th className="px-4 py-3 text-center hidden sm:table-cell">L10</th>
                        </>
                      )}
                      <th className="px-4 py-3 text-center">STRK</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {sortedEntries.map((entry, idx) => (
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
                                  isFavorite(entry.team?.id, league) 
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
                          {isMLB && (
                            <>
                              <td className="px-4 py-3 text-center font-mono text-slate-500 dark:text-slate-400 hidden md:table-cell">{getStat(entry, 'pointsFor')}</td>
                              <td className="px-4 py-3 text-center font-mono text-slate-500 dark:text-slate-400 hidden md:table-cell">{getStat(entry, 'pointsAgainst')}</td>
                              <td className="px-4 py-3 text-center font-mono text-slate-500 dark:text-slate-400 hidden md:table-cell">{getStat(entry, 'pointDifferential')}</td>
                              <td className="px-4 py-3 text-center font-mono text-slate-500 dark:text-slate-400 hidden sm:table-cell">{getStat(entry, 'L10')}</td>
                            </>
                          )}
                          <td className="px-4 py-3 text-center font-mono text-xs">
                            <span className={cn(
                              "px-2 py-0.5 rounded-full",
                              getStat(entry, 'streak').startsWith('W') ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                            )}>
                              {getStat(entry, 'streak')}
                            </span>
                          </td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })}
      
      {showFavoritesOnly && groups.every(g => g.entries.filter(e => isFavorite(e.team?.id, league)).length === 0) && (
        <div className="p-8 text-center text-slate-500 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
          No favorite teams found in these standings.
        </div>
      )}
    </div>
  );
};
