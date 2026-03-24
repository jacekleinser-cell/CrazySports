import React, { useEffect, useState } from 'react';
import { useSports, Sport, League } from '../context/SportsContext';
import { getLeaders } from '../services/espn';
import { cn } from '../lib/utils';
import { User, Trophy, Star } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';

const STATS_CONFIG: Record<League, { label: string; category: string; name: string }[]> = {
  nba: [
    { label: 'Points Per Game', category: 'offensive', name: 'avgPoints' },
    { label: 'Assists Per Game', category: 'offensive', name: 'avgAssists' },
    { label: 'Rebounds Per Game', category: 'general', name: 'avgRebounds' },
    { label: 'Steals Per Game', category: 'defensive', name: 'avgSteals' },
    { label: 'Blocks Per Game', category: 'defensive', name: 'avgBlocks' },
    { label: 'Field Goal %', category: 'offensive', name: 'fieldGoalPct' },
    { label: '3-Point FG %', category: 'offensive', name: 'threePointFieldGoalPct' },
    { label: 'Free Throw %', category: 'offensive', name: 'freeThrowPct' },
    { label: 'Turnovers Per Game', category: 'offensive', name: 'avgTurnovers' },
    { label: 'Minutes Per Game', category: 'general', name: 'avgMinutes' },
  ],
  nfl: [
    { label: 'Passing Yards', category: 'passing', name: 'passingYards' },
    { label: 'Passing Touchdowns', category: 'passing', name: 'passingTouchdowns' },
    { label: 'Rushing Yards', category: 'rushing', name: 'rushingYards' },
    { label: 'Rushing Touchdowns', category: 'rushing', name: 'rushingTouchdowns' },
    { label: 'Receptions', category: 'receiving', name: 'receptions' },
    { label: 'Receiving Yards', category: 'receiving', name: 'receivingYards' },
    { label: 'Total Tackles', category: 'defensive', name: 'totalTackles' },
    { label: 'Sacks', category: 'defensive', name: 'sacks' },
    { label: 'Interceptions', category: 'defensiveinterceptions', name: 'interceptions' },
    { label: 'Field Goal %', category: 'kicking', name: 'fieldGoalPct' },
  ],
  mlb: [
    { label: 'Batting Average', category: 'batting', name: 'avg' },
    { label: 'Home Runs', category: 'batting', name: 'homeRuns' },
    { label: 'Runs Batted In', category: 'batting', name: 'RBIs' },
    { label: 'On Base Percentage', category: 'batting', name: 'onBasePct' },
    { label: 'Slugging Percentage', category: 'batting', name: 'slugAvg' },
    { label: 'OPS', category: 'batting', name: 'OPS' },
    { label: 'Earned Run Average', category: 'pitching', name: 'ERA' },
    { label: 'Wins', category: 'pitching', name: 'wins' },
    { label: 'Strikeouts', category: 'pitching', name: 'strikeouts' },
    { label: 'WHIP', category: 'pitching', name: 'WHIP' },
  ],
  nhl: [
    { label: 'Points Per Game', category: 'offensive', name: 'pointsPerGame' },
    { label: 'Goals', category: 'offensive', name: 'goals' },
    { label: 'Assists', category: 'offensive', name: 'assists' },
    { label: 'Plus/Minus', category: 'general', name: 'plusMinus' },
    { label: 'Shots', category: 'offensive', name: 'shotsTotal' },
    { label: 'Power Play Goals', category: 'offensive', name: 'powerPlayGoals' },
    { label: 'Save Percentage', category: 'defensive', name: 'savePct' },
    { label: 'Goals Against Average', category: 'defensive', name: 'avgGoalsAgainst' },
    { label: 'Saves', category: 'defensive', name: 'saves' },
    { label: 'Shutouts', category: 'defensive', name: 'shutouts' },
  ],
  'eng.1': [
    { label: 'Goals', category: 'offensive', name: 'goals' },
    { label: 'Assists', category: 'offensive', name: 'assists' },
    { label: 'Shots', category: 'offensive', name: 'shotsTotal' },
    { label: 'Shots on Target', category: 'offensive', name: 'shotsOnTarget' },
    { label: 'Passes', category: 'offensive', name: 'passes' },
    { label: 'Tackles', category: 'defensive', name: 'tackles' },
    { label: 'Interceptions', category: 'defensive', name: 'interceptions' },
    { label: 'Yellow Cards', category: 'general', name: 'yellowCards' },
    { label: 'Red Cards', category: 'general', name: 'redCards' },
    { label: 'Saves', category: 'defensive', name: 'saves' },
  ],
};

export const StatsPage = () => {
  const { sport, league, setSportLeague } = useSports();
  const { isFavoritePlayer, addFavoritePlayer, removeFavoritePlayer } = useFavorites();
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatIndex, setSelectedStatIndex] = useState<number>(0);
  const [seasonType, setSeasonType] = useState<number>(2); // 2 = Regular, 1 = Preseason

  const leagues: { name: string; sport: Sport; league: League }[] = [
    { name: 'NBA', sport: 'basketball', league: 'nba' },
    { name: 'NFL', sport: 'football', league: 'nfl' },
    { name: 'MLB', sport: 'baseball', league: 'mlb' },
    { name: 'NHL', sport: 'hockey', league: 'nhl' },
    { name: 'Premier League', sport: 'soccer', league: 'eng.1' },
  ];

  useEffect(() => {
    const fetchLeaders = async () => {
      if (leaders.length === 0) setLoading(true);
      const currentStat = STATS_CONFIG[league][selectedStatIndex] || STATS_CONFIG[league][0];
      const data = await getLeaders(sport, league, currentStat.category, currentStat.name, seasonType);
      setLeaders(data);
      setLoading(false);
    };

    fetchLeaders();
    const interval = setInterval(fetchLeaders, 3000); // Poll every 3s
    return () => clearInterval(interval);
  }, [sport, league, selectedStatIndex, seasonType]);

  const handleLeagueChange = (s: Sport, l: League) => {
    setSportLeague(s, l);
    // Reset filters when changing league
    setSelectedStatIndex(0);
    setSeasonType(2);
  };

  const toggleFavoritePlayer = (player: any) => {
    if (isFavoritePlayer(player.id)) {
      removeFavoritePlayer(player.id);
    } else {
      addFavoritePlayer({
        id: player.id,
        name: player.displayName,
        team: player.team || 'Unknown Team',
        position: player.position?.displayName || 'Unknown Position',
        headshot: player.headshot?.href
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col gap-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <span className="w-2 h-8 bg-indigo-500 rounded-full" />
            Stats Leaders
          </h2>

          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg overflow-x-auto">
            {leagues.map((l) => (
              <button
                key={l.league}
                onClick={() => handleLeagueChange(l.sport, l.league)}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap",
                  league === l.league
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                {l.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
             <select
               value={selectedStatIndex}
               onChange={(e) => setSelectedStatIndex(Number(e.target.value))}
               className="px-4 py-1.5 rounded-md text-sm font-medium transition-all bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm border-none outline-none cursor-pointer"
             >
               {STATS_CONFIG[league].map((stat, idx) => (
                 <option key={idx} value={idx}>
                   {stat.label}
                 </option>
               ))}
             </select>
          </div>

          <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
             <button
               onClick={() => setSeasonType(2)}
               className={cn(
                 "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                 seasonType === 2
                   ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                   : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
               )}
             >
               Regular Season
             </button>
             <button
               onClick={() => setSeasonType(1)}
               className={cn(
                 "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                 seasonType === 1
                   ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                   : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
               )}
             >
               {league === 'mlb' ? 'Spring Training' : 'Preseason'}
             </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
           <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden max-w-2xl mx-auto w-full">
              <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 dark:text-white">{leaders[0]?.statLabel || 'Leaders'}</h3>
                <Trophy className="w-4 h-4 text-yellow-500" />
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {leaders.map((leader: any, leaderIdx: number) => (
                  <div key={leaderIdx} className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                    <div className="font-mono text-slate-400 font-bold w-6 text-center">{leader.rank}</div>
                    
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden border border-slate-100 dark:border-slate-600">
                        {leader.athlete.headshot?.href ? (
                          <img src={leader.athlete.headshot.href} alt={leader.athlete.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-6 h-6 text-slate-400" />
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-0.5 shadow-sm border border-slate-100 dark:border-slate-700">
                         {leader.athlete.teamLogos?.[0]?.href && (
                             <img src={leader.athlete.teamLogos[0].href} alt="Team" className="w-4 h-4 object-contain" referrerPolicy="no-referrer" />
                         )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white truncate flex items-center gap-2">
                        {leader.athlete.displayName}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavoritePlayer(leader.athlete);
                          }}
                          className={cn(
                            "transition-opacity focus:opacity-100",
                            isFavoritePlayer(leader.athlete.id) ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                          )}
                        >
                          <Star 
                            className={cn(
                              "w-4 h-4", 
                              isFavoritePlayer(leader.athlete.id) 
                                ? "fill-yellow-400 text-yellow-400" 
                                : "text-slate-300 hover:text-yellow-400"
                            )} 
                          />
                        </button>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {leader.athlete.position?.displayName} • {leader.team}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 font-mono">{leader.displayValue}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          {leaders.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500">
              No stats available for this league currently.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
