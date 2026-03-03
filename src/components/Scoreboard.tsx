import React, { useEffect, useState } from 'react';
import { useSports } from '../context/SportsContext';
import { useFavorites } from '../context/FavoritesContext';
import { getScores, Score } from '../services/espn';
import { format, addDays, subDays } from 'date-fns';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { Calendar, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

export const Scoreboard = () => {
  const { sport, league, setSportLeague } = useSports();
  const { favorites, isFavorite } = useFavorites();
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const fetchScores = async () => {
      // Don't set loading to true on subsequent polls to avoid flicker
      if (scores.length === 0) setLoading(true);
      const dateStr = format(selectedDate, 'yyyyMMdd');
      const data = await getScores(sport, league, dateStr);
      setScores(data);
      setLoading(false);
    };

    fetchScores();
    const interval = setInterval(fetchScores, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [sport, league, selectedDate]);

  const filteredScores = scores.filter(game => {
    if (filter === 'favorites') {
      const homeId = game.competitions?.[0]?.competitors?.find(c => c.homeAway === 'home')?.team?.id;
      const awayId = game.competitions?.[0]?.competitors?.find(c => c.homeAway === 'away')?.team?.id;
      return (homeId && isFavorite(homeId)) || (awayId && isFavorite(awayId));
    }
    return true;
  }).sort((a, b) => {
    // Sort favorites to the top
    const aHomeId = a.competitions?.[0]?.competitors?.find(c => c.homeAway === 'home')?.team?.id;
    const aAwayId = a.competitions?.[0]?.competitors?.find(c => c.homeAway === 'away')?.team?.id;
    const bHomeId = b.competitions?.[0]?.competitors?.find(c => c.homeAway === 'home')?.team?.id;
    const bAwayId = b.competitions?.[0]?.competitors?.find(c => c.homeAway === 'away')?.team?.id;

    const aIsFav = (aHomeId && isFavorite(aHomeId)) || (aAwayId && isFavorite(aAwayId));
    const bIsFav = (bHomeId && isFavorite(bHomeId)) || (bAwayId && isFavorite(bAwayId));

    if (aIsFav && !bIsFav) return -1;
    if (!aIsFav && bIsFav) return 1;
    return 0;
  });

  const leagues = [
    { name: 'NBA', sport: 'basketball', league: 'nba' },
    { name: 'NFL', sport: 'football', league: 'nfl' },
    { name: 'MLB', sport: 'baseball', league: 'mlb' },
    { name: 'NHL', sport: 'hockey', league: 'nhl' },
  ] as const;

  const renderBaseballDetails = (game: Score) => {
    const situation = game.competitions?.[0]?.situation;
    if (!situation) return null;

    return (
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-4">
          {/* Diamond Visualization */}
          <div className="relative w-16 h-16 flex-shrink-0 bg-green-600/10 dark:bg-green-900/20 rounded-lg">
            {/* Base Paths */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 border border-slate-300 dark:border-slate-600 rotate-45" />
            
            {/* Bases */}
            <div className={cn("absolute top-[25%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rotate-45 border border-slate-400 z-10", situation.onSecond ? "bg-yellow-400 border-yellow-500 shadow-[0_0_4px_rgba(250,204,21,0.8)]" : "bg-slate-200 dark:bg-slate-600")} /> {/* 2nd */}
            <div className={cn("absolute top-1/2 right-[25%] translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rotate-45 border border-slate-400 z-10", situation.onFirst ? "bg-yellow-400 border-yellow-500 shadow-[0_0_4px_rgba(250,204,21,0.8)]" : "bg-slate-200 dark:bg-slate-600")} /> {/* 1st */}
            <div className={cn("absolute top-1/2 left-[25%] -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rotate-45 border border-slate-400 z-10", situation.onThird ? "bg-yellow-400 border-yellow-500 shadow-[0_0_4px_rgba(250,204,21,0.8)]" : "bg-slate-200 dark:bg-slate-600")} /> {/* 3rd */}
            <div className="absolute bottom-[25%] left-1/2 -translate-x-1/2 translate-y-1/2 w-2.5 h-2.5 rotate-45 border border-slate-400 bg-white z-10" /> {/* Home */}
          </div>

          {/* Players Info */}
          <div className="flex-1 grid grid-cols-2 gap-2">
            {/* Batter */}
            {situation.batter && (
              <div className="flex items-center gap-2">
                <img 
                  src={`https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/${situation.batter.playerId}.png&w=48&h=48&scale=crop`} 
                  alt={situation.batter.fullName}
                  className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-600 bg-slate-100 object-cover"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{situation.batter.fullName}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wide">Batting</div>
                </div>
              </div>
            )}
            
            {/* Pitcher */}
            {situation.pitcher && (
              <div className="flex items-center gap-2">
                <img 
                  src={`https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/${situation.pitcher.playerId}.png&w=48&h=48&scale=crop`} 
                  alt={situation.pitcher.fullName}
                  className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-600 bg-slate-100 object-cover"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{situation.pitcher.fullName}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wide">Pitching</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Count */}
        <div className="mt-2 flex items-center justify-center gap-6 text-xs font-mono font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 py-1 rounded-md">
          <div className="flex gap-1">
            <span className="text-slate-400">B</span>
            <span className={cn(situation.balls >= 4 ? "text-emerald-500 font-bold" : "text-slate-900 dark:text-white")}>{situation.balls}</span>
          </div>
          <div className="flex gap-1">
            <span className="text-slate-400">S</span>
            <span className={cn(situation.strikes >= 3 ? "text-red-500 font-bold" : "text-slate-900 dark:text-white")}>{situation.strikes}</span>
          </div>
          <div className="flex gap-1">
            <span className="text-slate-400">O</span>
            <span className={cn(situation.outs >= 3 ? "text-red-500 font-bold" : "text-slate-900 dark:text-white")}>{situation.outs}</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading && scores.length === 0) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="min-w-[300px] h-32 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* League Selector */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg overflow-x-auto max-w-full">
            {leagues.map((l) => (
              <button
                key={l.league}
                onClick={() => setSportLeague(l.sport, l.league)}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap",
                  league === l.league
                    ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                )}
              >
                {l.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Date Navigation */}
            <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1">
              <button 
                onClick={() => setSelectedDate(d => subDays(d, 1))}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-400 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-3 text-sm font-medium text-slate-700 dark:text-slate-200 min-w-[100px] text-center">
                {format(selectedDate, 'MMM d, yyyy')}
              </div>
              <button 
                onClick={() => setSelectedDate(d => addDays(d, 1))}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-400 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Dropdown */}
            <div className="relative flex-1 sm:flex-none">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | 'favorites')}
                className="w-full appearance-none pl-4 pr-10 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Teams</option>
                <option value="favorites">Favorites</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <Filter className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {filteredScores.length === 0 ? (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
          {filter === 'favorites' 
            ? "No games found for your favorite teams on this date." 
            : "No games scheduled for this date."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredScores.map((game) => {
            const competition = game.competitions?.[0];
            if (!competition) return null;

            const home = competition.competitors?.find((c) => c.homeAway === 'home');
            const away = competition.competitors?.find((c) => c.homeAway === 'away');
            const status = game.status?.type;

            if (!home || !away || !status) return null;

            return (
              <button 
                key={game.id} 
                onClick={() => navigate(`/game/${sport}/${league}/${game.id}`)}
                className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-5 hover:shadow-md transition-all hover:scale-[1.02] cursor-pointer text-left group w-full"
              >
                <div className="flex justify-between items-center mb-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <span className={cn(
                    "px-2.5 py-1 rounded-full flex items-center gap-1.5",
                    status.state === 'in' ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" : "bg-slate-100 dark:bg-slate-800"
                  )}>
                    {status.state === 'in' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                    {status.state === 'pre' && (status.detail.includes(' EST') || status.detail.includes(' EDT')) ? 'Scheduled' : status.detail}
                  </span>
                  <span>{format(new Date(game.date), 'h:mm a')}</span>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <img src={away.team?.logo} alt={away.team?.abbreviation} className="w-10 h-10 object-contain" />
                      <div className="flex flex-col">
                        <span className="font-bold text-lg text-slate-900 dark:text-white leading-tight">{away.team?.displayName}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{away.records?.[0]?.summary}</span>
                      </div>
                    </div>
                    <span className="text-3xl font-mono font-bold text-slate-900 dark:text-white">{away.score}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <img src={home.team?.logo} alt={home.team?.abbreviation} className="w-10 h-10 object-contain" />
                      <div className="flex flex-col">
                        <span className="font-bold text-lg text-slate-900 dark:text-white leading-tight">{home.team?.displayName}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{home.records?.[0]?.summary}</span>
                      </div>
                    </div>
                    <span className="text-3xl font-mono font-bold text-slate-900 dark:text-white">{home.score}</span>
                  </div>
                </div>
                
                {status.state === 'in' && sport === 'baseball' && renderBaseballDetails(game)}

                {status.state === 'pre' && (
                   <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-800 text-xs text-slate-400 flex items-center gap-1.5">
                     <Calendar className="w-3.5 h-3.5" />
                     {competition.venue?.fullName || 'TBD'}
                   </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
