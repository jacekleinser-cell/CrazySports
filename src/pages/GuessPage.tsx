import React, { useEffect, useState } from 'react';
import { useSports } from '../context/SportsContext';
import { getScores, Score } from '../services/espn';
import { format, addDays, subDays } from 'date-fns';
import { cn, getRank } from '../lib/utils';
import { ChevronLeft, ChevronRight, Target, CheckCircle2, XCircle, Calendar, Star } from 'lucide-react';
import { useGuesses } from '../context/GuessContext';
import { useNavigate } from 'react-router-dom';
import { GuessModal } from '../components/GuessModal';

export const GuessPage = () => {
  const { sport, league, setSportLeague } = useSports();
  const { guesses, makeGuess, resolveGuess, score } = useGuesses();
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedGameForGuess, setSelectedGameForGuess] = useState<{game: Score, preselectedTeamId: string} | null>(null);
  const navigate = useNavigate();
  const currentRank = getRank(score);

  useEffect(() => {
    const fetchScores = async () => {
      if (scores.length === 0) setLoading(true);
      const dateStr = format(selectedDate, 'yyyyMMdd');
      const data = await getScores(sport, league, dateStr);
      setScores(data);
      setLoading(false);

      // Resolve any pending guesses that have finished
      data.forEach(game => {
        const status = game.status?.type;
        if (status?.completed) {
          const home = game.competitions?.[0]?.competitors?.find(c => c.homeAway === 'home');
          const away = game.competitions?.[0]?.competitors?.find(c => c.homeAway === 'away');
          if (home && away) {
            const homeScore = parseInt(home.score || '0', 10);
            const awayScore = parseInt(away.score || '0', 10);
            if (homeScore > awayScore) {
              resolveGuess(game.id, home.team.id, homeScore, awayScore);
            } else if (awayScore > homeScore) {
              resolveGuess(game.id, away.team.id, homeScore, awayScore);
            }
          }
        }
      });
    };

    fetchScores();
    const interval = setInterval(fetchScores, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [sport, league, selectedDate, resolveGuess]);

  const leagues = [
    { name: 'NBA', sport: 'basketball', league: 'nba' },
    { name: 'NFL', sport: 'football', league: 'nfl' },
    { name: 'MLB', sport: 'baseball', league: 'mlb' },
    { name: 'NHL', sport: 'hockey', league: 'nhl' },
  ] as const;

  if (loading && scores.length === 0) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Target className="w-6 h-6 text-emerald-500" />
            Make Your Picks
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-2 flex-wrap">
            <span>Guess the winning team and score for upcoming games to climb the leaderboard!</span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-600">•</span>
            <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
              <Star className="w-3.5 h-3.5 fill-emerald-500" />
              {currentRank.name} ({score} pts)
            </span>
          </p>
        </div>
        
        <button 
          onClick={() => navigate('/leaderboard')}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
        >
          View Leaderboard
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
        </div>
      </div>

      {scores.length === 0 ? (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
          No games scheduled for this date.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scores.map((game) => {
            const competition = game.competitions?.[0];
            if (!competition) return null;

            const home = competition.competitors?.find((c) => c.homeAway === 'home');
            const away = competition.competitors?.find((c) => c.homeAway === 'away');
            const status = game.status?.type;

            if (!home || !away || !status) return null;
            
            // Filter out Sacramento River Cats
            if (home.team.name.toLowerCase().includes('sacramento river cats') || away.team.name.toLowerCase().includes('sacramento river cats')) {
                return null;
            }

            const guess = guesses[game.id];
            
            let canGuess = false;
            if (status.state === 'pre') {
              canGuess = true;
            } else if (status.state === 'in') {
              const period = game.status?.period || 1;
              if (league === 'mlb') canGuess = period < 6;
              else if (league === 'nfl') canGuess = period < 3;
              else if (league === 'nba') canGuess = period < 3;
              else if (league === 'nhl') canGuess = period < 2;
            }

            return (
              <div 
                key={game.id} 
                onClick={() => navigate(`/game/${sport}/${league}/${game.id}`)}
                className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-4 flex flex-col relative overflow-hidden hover:shadow-md transition-all hover:scale-[1.02] cursor-pointer"
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

                <div className="space-y-2 flex-1">
                  {/* Away Team */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); canGuess && setSelectedGameForGuess({game, preselectedTeamId: away.team.id}); }}
                    disabled={!canGuess}
                    className={cn(
                      "w-full flex justify-between items-center p-2 rounded-lg transition-all",
                      guess?.teamId === away.team.id 
                        ? "bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-500" 
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50",
                      !canGuess && guess?.teamId !== away.team.id && "opacity-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <img src={away.team?.logo} alt={away.team?.abbreviation} className="w-8 h-8 object-contain" />
                      <div className="flex flex-col items-start">
                        <span className="font-bold text-base text-slate-900 dark:text-white leading-tight">{away.team?.displayName}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">{away.records?.[0]?.summary}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {guess && guess.predictedAwayScore !== undefined && (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-1 rounded-md">Pick: {guess.predictedAwayScore}</span>
                      )}

                      {guess?.teamId === away.team.id && guess.status === 'won' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                      {guess?.teamId === away.team.id && guess.status === 'lost' && <XCircle className="w-5 h-5 text-red-500" />}
                      <span className="text-2xl font-mono font-bold text-slate-900 dark:text-white">{away.score}</span>
                    </div>
                  </button>

                  {/* Home Team */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); canGuess && setSelectedGameForGuess({game, preselectedTeamId: home.team.id}); }}
                    disabled={!canGuess}
                    className={cn(
                      "w-full flex justify-between items-center p-2 rounded-lg transition-all",
                      guess?.teamId === home.team.id 
                        ? "bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-500" 
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50",
                      !canGuess && guess?.teamId !== home.team.id && "opacity-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <img src={home.team?.logo} alt={home.team?.abbreviation} className="w-8 h-8 object-contain" />
                      <div className="flex flex-col items-start">
                        <span className="font-bold text-base text-slate-900 dark:text-white leading-tight">{home.team?.displayName}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">{home.records?.[0]?.summary}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {guess && guess.predictedHomeScore !== undefined && (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-1 rounded-md">Pick: {guess.predictedHomeScore}</span>
                      )}

                      {guess?.teamId === home.team.id && guess.status === 'won' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                      {guess?.teamId === home.team.id && guess.status === 'lost' && <XCircle className="w-5 h-5 text-red-500" />}
                      <span className="text-2xl font-mono font-bold text-slate-900 dark:text-white">{home.score}</span>
                    </div>
                  </button>
                </div>

                {!canGuess && !guess && (
                  <div className="mt-4 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/50 py-2 rounded-md">
                    {status.state === 'post' ? 'Game has ended. Guessing is closed.' : 'Guessing deadline has passed.'}
                  </div>
                )}
                {canGuess && !guess && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSelectedGameForGuess({game, preselectedTeamId: away.team.id}); }}
                    className="mt-4 w-full text-center text-sm text-white bg-emerald-500 hover:bg-emerald-600 py-2 rounded-md font-bold transition-colors"
                  >
                    Make a Pick
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedGameForGuess && (
        <GuessModal 
          game={selectedGameForGuess.game}
          preselectedTeamId={selectedGameForGuess.preselectedTeamId}
          onClose={() => setSelectedGameForGuess(null)}
        />
      )}
    </div>
  );
};
