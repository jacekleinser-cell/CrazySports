import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSports } from '../context/SportsContext';
import { getGameSummary } from '../services/espn';
import { BaseballField } from '../components/BaseballField';
import { FullBoxScore } from '../components/FullBoxScore';
import { format } from 'date-fns';
import { ChevronLeft, RefreshCw, User, Star, X, Bell, BellOff } from 'lucide-react';
import { cn } from '../lib/utils';
import { useFavorites } from '../context/FavoritesContext';
import { motion, AnimatePresence } from 'motion/react';

export const GameDetailsPage = () => {
  const { sport: urlSport, league: urlLeague, id } = useParams();
  const { sport: contextSport, league: contextLeague } = useSports();
  const navigate = useNavigate();
  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showBoxScore, setShowBoxScore] = useState(false);
  const { isFavoritePlayer, addFavoritePlayer, removeFavoritePlayer, isSubscribedToGame, subscribeToGame, unsubscribeFromGame } = useFavorites();
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);

  // Use URL params if available, otherwise fallback to context (though URL should always have them now)
  const sport = urlSport || contextSport;
  const league = urlLeague || contextLeague;

  useEffect(() => {
    const fetchGame = async () => {
      if (!id) return;
      const data = await getGameSummary(sport, league, id);
      setGame(data);
      setLoading(false);
    };

    fetchGame();
    const interval = setInterval(fetchGame, 3000); // 3s polling
    return () => clearInterval(interval);
  }, [id, sport, league]);

  if (loading) return <div className="p-8 text-center">Loading game details...</div>;
  if (!game || !game.header || !game.header.competitions || game.header.competitions.length === 0) {
    return <div className="p-8 text-center">Game details not available.</div>;
  }

  const isMLB = league === 'mlb';
  const competition = game.header.competitions[0];
  const rawSituation = game.situation || competition.situation || {};
  const boxscore = game.boxscore || {};
  const plays = [...(game.plays || [])].reverse();
  
  const competitors = competition.competitors || [];
  const homeCompetitor = competitors.find((c: any) => c.homeAway === 'home') || competitors[0];
  const awayCompetitor = competitors.find((c: any) => c.homeAway === 'away') || competitors[1];

  const homeTeam = boxscore.teams?.find((t: any) => t.team.id === homeCompetitor?.id)?.team || homeCompetitor?.team;
  const awayTeam = boxscore.teams?.find((t: any) => t.team.id === awayCompetitor?.id)?.team || awayCompetitor?.team;

  const handleToggleGameSubscription = () => {
    if (!id) return;
    if (isSubscribedToGame(id)) {
      unsubscribeFromGame(id);
    } else {
      subscribeToGame({
        id,
        league,
        homeTeam: homeTeam?.displayName || homeTeam?.name || 'Home',
        awayTeam: awayTeam?.displayName || awayTeam?.name || 'Away'
      });
    }
  };

  const enrichPlayer = (player: any) => {
    if (!player) return null;
    const id = player.id || player.playerId;
    if (!id) return player;

    if (boxscore.players) {
      for (const teamPlayers of boxscore.players) {
        for (const statGroup of teamPlayers.statistics) {
           const found = statGroup.athletes?.find((a: any) => a.athlete.id?.toString() === id?.toString());
           if (found) {
             return { 
               ...player, 
               ...found.athlete, 
               team: found.athlete.team || teamPlayers.team,
               position: found.athlete.position || player.position
             };
           }
        }
      }
    }
    return player;
  };

  let currentBatter = rawSituation.batter?.athlete || rawSituation.batter || rawSituation.dueUp?.[0]?.athlete || rawSituation.dueUp?.[0];
  let currentPitcher = rawSituation.pitcher?.athlete || rawSituation.pitcher;

  // Fallback: If no batter in situation, try to infer from last play
  if (!currentBatter && plays.length > 0) {
    const lastPlay = plays[0]; // plays are reversed, so 0 is latest
    if (lastPlay.participants) {
      const p = lastPlay.participants[0]?.athlete;
      if (p) currentBatter = p;
    }
  }

  // If we still don't have a batter or pitcher, let's try to find them in the boxscore
  if (!currentBatter && boxscore.players) {
    // This is a very rough fallback, just to show *someone* if the API is being weird
    const awayBatters = boxscore.players.find((p: any) => p.team.id === awayCompetitor.id)?.statistics.find((s: any) => s.name === 'batting')?.athletes;
    if (awayBatters && awayBatters.length > 0) {
      currentBatter = awayBatters[0].athlete;
    }
  }

  if (!currentPitcher && boxscore.players) {
    const homePitchers = boxscore.players.find((p: any) => p.team.id === homeCompetitor.id)?.statistics.find((s: any) => s.name === 'pitching')?.athletes;
    if (homePitchers && homePitchers.length > 0) {
      currentPitcher = homePitchers[0].athlete;
    }
  }

  const situation = {
    ...rawSituation,
    batter: enrichPlayer(currentBatter),
    pitcher: enrichPlayer(currentPitcher)
  };

  const getPlayerImage = (athlete: any) => {
    if (!athlete) return null;
    if (athlete.headshot?.href) return athlete.headshot.href;
    const id = athlete.id || athlete.playerId;
    if (id) return `https://a.espncdn.com/combiner/i?img=/i/headshots/${league}/players/full/${id}.png&w=350&h=254`;
    return null;
  };

  const findPlayerStats = (athleteId: string, type: 'batting' | 'pitching') => {
    if (!boxscore.players || !athleteId) return null;
    
    for (const team of boxscore.players) {
      for (const statGroup of team.statistics) {
        // Check if this is the right category (batting vs pitching)
        // Note: API sometimes uses "batting" or "pitching" as name/type
        if (statGroup.name !== type && statGroup.type !== type) continue;
        
        const athlete = statGroup.athletes?.find((a: any) => a.athlete.id === athleteId);
        if (athlete) {
           // Return formatted stats
           // For batting: usually AVG (index varies), or summary like "1-3, HR"
           // Let's try to construct a summary or return the raw stats to pick from
           return {
             stats: athlete.stats,
             labels: statGroup.labels,
             summary: athlete.stats?.join('/') // Temporary fallback
           };
        }
      }
    }
    return null;
  };

  const getBatterStats = (athleteId: string) => {
    const data = findPlayerStats(athleteId, 'batting');
    if (!data) return "Waiting...";
    // Try to find AVG, HR, RBI
    const avgIndex = data.labels?.indexOf('AVG');
    const hrIndex = data.labels?.indexOf('HR');
    const rbiIndex = data.labels?.indexOf('RBI');
    
    const parts = [];
    if (avgIndex >= 0) parts.push(`AVG ${data.stats[avgIndex]}`);
    if (hrIndex >= 0) parts.push(`${data.stats[hrIndex]} HR`);
    if (rbiIndex >= 0) parts.push(`${data.stats[rbiIndex]} RBI`);
    
    return parts.join(' • ') || "Stats loading...";
  };

  const getPitcherStats = (athleteId: string) => {
    const data = findPlayerStats(athleteId, 'pitching');
    if (!data) return "Waiting...";
    // Try to find IP, ERA, K
    const ipIndex = data.labels?.indexOf('IP');
    const eraIndex = data.labels?.indexOf('ERA');
    const kIndex = data.labels?.indexOf('K');
    
    const parts = [];
    if (ipIndex >= 0) parts.push(`${data.stats[ipIndex]} IP`);
    if (eraIndex >= 0) parts.push(`${data.stats[eraIndex]} ERA`);
    if (kIndex >= 0) parts.push(`${data.stats[kIndex]} K`);
    
    return parts.join(' • ') || "Stats loading...";
  };

  const handlePlayerClick = (athlete: any) => {
    if (!athlete) return;
    // Try to find more stats in boxscore
    let stats = null;
    if (boxscore.players) {
       // Search in both teams
       boxscore.players.forEach((teamPlayers: any) => {
         teamPlayers.statistics.forEach((statGroup: any) => {
            const found = statGroup.athletes?.find((p: any) => p.athlete?.id === athlete.id);
            if (found) {
              stats = { stats: found.stats, labels: statGroup.labels };
            }
         });
       });
    }
    setSelectedPlayer({ ...athlete, stats });
  };

  const toggleFavorite = (e: React.MouseEvent, athlete: any) => {
    e.stopPropagation();
    if (!athlete) return;
    const athleteId = athlete.id || athlete.playerId;
    if (isFavoritePlayer(athleteId)) {
      removeFavoritePlayer(athleteId);
    } else {
      addFavoritePlayer({
        id: athleteId,
        name: athlete.displayName || athlete.fullName,
        position: athlete.position?.abbreviation,
        headshot: getPlayerImage(athlete) || undefined,
        team: athlete.team?.displayName
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <FullBoxScore 
        isOpen={showBoxScore} 
        onClose={() => setShowBoxScore(false)} 
        boxscore={boxscore} 
        league={league}
      />

      {/* Player Stats Modal */}
      <AnimatePresence>
        {selectedPlayer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPlayer(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden z-50"
            >
              <button onClick={() => setSelectedPlayer(null)} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white z-10 transition-colors">
                <X className="w-5 h-5" />
              </button>
              
              <div className="relative h-48 bg-gradient-to-br from-slate-800 to-slate-900 flex items-end justify-center pb-0 overflow-hidden">
                 {getPlayerImage(selectedPlayer) ? (
                   <img src={getPlayerImage(selectedPlayer)} alt={selectedPlayer.displayName || selectedPlayer.fullName} className="h-full object-contain translate-y-2" />
                 ) : (
                   <User className="w-24 h-24 text-slate-600 mb-8" />
                 )}
                 <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-900 to-transparent" />
                 <div className="absolute bottom-4 left-4 text-white">
                   <h2 className="text-2xl font-bold">{selectedPlayer.displayName || selectedPlayer.fullName}</h2>
                   <p className="text-slate-300">{selectedPlayer.position?.displayName || selectedPlayer.position?.abbreviation} • {selectedPlayer.team?.displayName}</p>
                 </div>
              </div>

              <div className="p-6">
                 <div className="flex justify-between items-center mb-6">
                    <button 
                      onClick={(e) => toggleFavorite(e, selectedPlayer)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors",
                        isFavoritePlayer(selectedPlayer.id || selectedPlayer.playerId) 
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" 
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                      )}
                    >
                      <Star className={cn("w-4 h-4", isFavoritePlayer(selectedPlayer.id || selectedPlayer.playerId) && "fill-current")} />
                      {isFavoritePlayer(selectedPlayer.id || selectedPlayer.playerId) ? "Favorited" : "Add to Favorites"}
                    </button>
                 </div>

                 {selectedPlayer.stats ? (
                   <div className="grid grid-cols-3 gap-4">
                     {selectedPlayer.stats.stats?.map((stat: string, idx: number) => {
                        const label = selectedPlayer.stats.labels?.[idx];
                        if (!label) return null;
                        return (
                          <div key={idx} className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-center">
                            <div className="text-xs text-slate-500 uppercase font-bold mb-1">{label}</div>
                            <div className="text-lg font-mono font-bold text-slate-900 dark:text-white">{stat}</div>
                          </div>
                        );
                     })}
                   </div>
                 ) : (
                   <div className="text-center text-slate-500 py-8">
                     No detailed stats available for this game.
                   </div>
                 )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center mb-4">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Scores
        </button>
        
        {id && (
          <button
            onClick={handleToggleGameSubscription}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
              isSubscribedToGame(id)
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            )}
          >
            {isSubscribedToGame(id) ? (
              <>
                <Bell className="w-4 h-4 fill-current" />
                Notifications On
              </>
            ) : (
              <>
                <BellOff className="w-4 h-4" />
                Notify Me
              </>
            )}
          </button>
        )}
      </div>

      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-8 mb-6 relative">
        <div className="flex justify-between items-center">
          {/* Away Team (Left) */}
          <div className="flex items-center gap-6 flex-1">
            <img 
              src={awayTeam?.logo || awayTeam?.logos?.[0]?.href} 
              alt={awayTeam?.displayName}
              className="w-20 h-20 object-contain" 
            />
            <div className="text-left">
              <div className="text-5xl font-bold font-mono text-slate-900 dark:text-white mb-1">{awayCompetitor?.score}</div>
              <div className="font-bold text-xl text-slate-900 dark:text-white leading-tight">{awayTeam?.displayName || awayTeam?.name}</div>
            </div>
          </div>
          
          {/* Game Status (Center) */}
          <div className="text-center px-4 shrink-0">
            <div className="text-lg font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
              {competition.status?.type?.detail}
            </div>
            <div className="text-sm text-slate-400 dark:text-slate-500">
              {competition.venue?.fullName}
            </div>
          </div>

          {/* Home Team (Right) */}
          <div className="flex items-center gap-6 flex-1 justify-end">
            <div className="text-right">
              <div className="text-5xl font-bold font-mono text-slate-900 dark:text-white mb-1">{homeCompetitor?.score}</div>
              <div className="font-bold text-xl text-slate-900 dark:text-white leading-tight">{homeTeam?.displayName || homeTeam?.name}</div>
            </div>
            <img 
              src={homeTeam?.logo || homeTeam?.logos?.[0]?.href} 
              alt={homeTeam?.displayName}
              className="w-20 h-20 object-contain" 
            />
          </div>
        </div>

        {/* Line Score (MLB) */}
        {isMLB && homeCompetitor.linescores && (
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
            <div className="overflow-x-auto">
              <table className="w-full text-center text-sm">
                <thead>
                  <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
                    <th className="text-left font-bold pb-3 pl-2">Team</th>
                    {homeCompetitor.linescores.map((_: any, i: number) => (
                      <th key={i} className="font-medium pb-3 w-10">{i + 1}</th>
                    ))}
                    <th className="font-bold text-slate-900 dark:text-white pb-3 w-12 border-l border-slate-100 dark:border-slate-700 pl-2">R</th>
                    <th className="font-bold text-slate-900 dark:text-white pb-3 w-12">H</th>
                    <th className="font-bold text-slate-900 dark:text-white pb-3 w-12">E</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Away */}
                  <tr>
                    <td className="text-left font-bold text-slate-900 dark:text-white py-3 pl-2">{awayTeam?.abbreviation}</td>
                    {awayCompetitor.linescores?.map((score: any, i: number) => (
                      <td key={i} className="text-slate-600 dark:text-slate-300 py-3 font-mono">{score.displayValue}</td>
                    ))}
                    <td className="font-bold text-slate-900 dark:text-white py-3 border-l border-slate-100 dark:border-slate-700 pl-2 font-mono text-base">{awayCompetitor.score}</td>
                    <td className="text-slate-600 dark:text-slate-300 py-3 font-mono">{awayCompetitor.hits || boxscore.teams?.find((t: any) => t.team.id === awayCompetitor.id)?.statistics?.find((s: any) => s.name === 'hits')?.displayValue || 0}</td>
                    <td className="text-slate-600 dark:text-slate-300 py-3 font-mono">{awayCompetitor.errors || boxscore.teams?.find((t: any) => t.team.id === awayCompetitor.id)?.statistics?.find((s: any) => s.name === 'errors')?.displayValue || 0}</td>
                  </tr>
                  {/* Home */}
                  <tr>
                    <td className="text-left font-bold text-slate-900 dark:text-white py-3 pl-2">{homeTeam?.abbreviation}</td>
                    {homeCompetitor.linescores?.map((score: any, i: number) => (
                      <td key={i} className="text-slate-600 dark:text-slate-300 py-3 font-mono">{score.displayValue}</td>
                    ))}
                    <td className="font-bold text-slate-900 dark:text-white py-3 border-l border-slate-100 dark:border-slate-700 pl-2 font-mono text-base">{homeCompetitor.score}</td>
                    <td className="text-slate-600 dark:text-slate-300 py-3 font-mono">{homeCompetitor.hits || boxscore.teams?.find((t: any) => t.team.id === homeCompetitor.id)?.statistics?.find((s: any) => s.name === 'hits')?.displayValue || 0}</td>
                    <td className="text-slate-600 dark:text-slate-300 py-3 font-mono">{homeCompetitor.errors || boxscore.teams?.find((t: any) => t.team.id === homeCompetitor.id)?.statistics?.find((s: any) => s.name === 'errors')?.displayValue || 0}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Field View (MLB Only) */}
          {isMLB && competition.status?.type?.state === 'in' && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
              <h3 className="font-bold text-lg mb-6 text-slate-900 dark:text-white">Live Field</h3>
              <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                {/* Field (Left) */}
                <div className="w-48 shrink-0 flex flex-col items-center gap-4">
                  <BaseballField situation={situation} />
                  
                  {/* Balls/Strikes/Outs - Redesigned */}
                  <div className="w-full bg-slate-900 text-white rounded-lg p-3 shadow-lg flex justify-between items-center px-4">
                    <div className="flex flex-col items-center">
                       <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Balls</div>
                       <div className="flex gap-1 mt-1">
                         {[1, 2, 3, 4].map(i => (
                           <div key={i} className={cn("w-2.5 h-2.5 rounded-full transition-all duration-300", (situation.balls || 0) >= i ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" : "bg-slate-700")} />
                         ))}
                       </div>
                    </div>
                    <div className="w-px h-8 bg-slate-700" />
                    <div className="flex flex-col items-center">
                       <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Strikes</div>
                       <div className="flex gap-1 mt-1">
                         {[1, 2, 3].map(i => (
                           <div key={i} className={cn("w-2.5 h-2.5 rounded-full transition-all duration-300", (situation.strikes || 0) >= i ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" : "bg-slate-700")} />
                         ))}
                       </div>
                    </div>
                    <div className="w-px h-8 bg-slate-700" />
                    <div className="flex flex-col items-center">
                       <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Outs</div>
                       <div className="flex gap-1 mt-1">
                         {[1, 2, 3].map(i => (
                           <div key={i} className={cn("w-2.5 h-2.5 rounded-full transition-all duration-300", (situation.outs || 0) >= i ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" : "bg-slate-700")} />
                         ))}
                       </div>
                    </div>
                  </div>
                </div>

                {/* Info (Right) */}
                <div className="flex flex-col gap-4 w-full max-w-md">
                    {/* Batter Info */}
                    <div 
                      onClick={() => {
                        const athlete = situation.batter?.athlete || situation.batter;
                        if (athlete) handlePlayerClick(athlete);
                      }}
                      className={cn(
                        "relative flex items-center gap-4 bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 transition-all group cursor-pointer hover:border-emerald-500/50 hover:shadow-md",
                        !situation.batter && "opacity-50 pointer-events-none"
                      )}
                    >
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Star className={cn("w-5 h-5", (situation.batter?.athlete || situation.batter) && isFavoritePlayer((situation.batter?.athlete || situation.batter).id || (situation.batter?.athlete || situation.batter).playerId) ? "fill-yellow-400 text-yellow-400" : "text-slate-300")} />
                      </div>
                      <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden shrink-0 border-2 border-slate-300 dark:border-slate-500">
                        {getPlayerImage(situation.batter?.athlete || situation.batter) ? (
                          <img 
                            src={getPlayerImage(situation.batter?.athlete || situation.batter)} 
                            alt={situation.batter?.athlete?.displayName || situation.batter?.displayName || situation.batter?.fullName} 
                            className="w-full h-full object-cover" 
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E";
                              e.currentTarget.className = "w-full h-full object-cover p-2 opacity-50";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <User className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wide font-bold mb-0.5">At Bat</div>
                        <div className="font-bold text-lg text-slate-900 dark:text-white truncate">
                          {situation.batter?.athlete?.displayName || situation.batter?.displayName || situation.batter?.fullName || situation.batter?.athlete?.shortName || situation.batter?.shortName || (
                            <span className="text-slate-400 italic font-normal text-base">
                              {competition.status?.type?.description || "Between Innings"}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {(situation.batter?.athlete || situation.batter)?.position?.abbreviation} • {(situation.batter?.athlete || situation.batter)?.team?.abbreviation}
                        </div>
                        <div className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 mt-1">
                          {situation.batter ? getBatterStats((situation.batter.athlete || situation.batter).id || (situation.batter.athlete || situation.batter).playerId) : '--'}
                        </div>
                      </div>
                    </div>

                    {/* Pitcher Info */}
                    <div 
                      onClick={() => {
                        const athlete = situation.pitcher?.athlete || situation.pitcher;
                        if (athlete) handlePlayerClick(athlete);
                      }}
                      className={cn(
                        "relative flex items-center gap-4 bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 transition-all group cursor-pointer hover:border-emerald-500/50 hover:shadow-md",
                        !situation.pitcher && "opacity-50 pointer-events-none"
                      )}
                    >
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Star className={cn("w-5 h-5", (situation.pitcher?.athlete || situation.pitcher) && isFavoritePlayer((situation.pitcher?.athlete || situation.pitcher).id || (situation.pitcher?.athlete || situation.pitcher).playerId) ? "fill-yellow-400 text-yellow-400" : "text-slate-300")} />
                      </div>
                      <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden shrink-0 border-2 border-slate-300 dark:border-slate-500">
                        {getPlayerImage(situation.pitcher?.athlete || situation.pitcher) ? (
                          <img 
                            src={getPlayerImage(situation.pitcher?.athlete || situation.pitcher)} 
                            alt={situation.pitcher?.athlete?.displayName || situation.pitcher?.displayName || situation.pitcher?.fullName} 
                            className="w-full h-full object-cover" 
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E";
                              e.currentTarget.className = "w-full h-full object-cover p-2 opacity-50";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <User className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-bold mb-0.5">Pitching</div>
                        <div className="font-bold text-lg text-slate-900 dark:text-white truncate">
                          {situation.pitcher?.athlete?.displayName || situation.pitcher?.displayName || situation.pitcher?.fullName || situation.pitcher?.athlete?.shortName || situation.pitcher?.shortName || (
                             <span className="text-slate-400 italic font-normal text-base">
                               {competition.status?.type?.description || "Between Innings"}
                             </span>
                          )}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {situation.pitcher ? getPitcherStats((situation.pitcher.athlete || situation.pitcher).id || (situation.pitcher.athlete || situation.pitcher).playerId) : '--'}
                        </div>
                      </div>
                    </div>
                </div>
              </div>
            </div>
          )}

          {/* Top Performers (Final Games) */}
          {competition.status?.type?.state === 'post' && game.leaders && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
              <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">Top Performers</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {game.leaders.map((leaderGroup: any, idx: number) => (
                  <div key={idx} className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wide">{leaderGroup.displayName}</h4>
                    {leaderGroup.leaders?.map((leader: any, lIdx: number) => {
                      const athlete = leader.athlete;
                      if (!athlete) return null;
                      return (
                        <div key={lIdx} className="flex items-center gap-4 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" onClick={() => handlePlayerClick(athlete)}>
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-white shrink-0 border border-slate-200 dark:border-slate-600">
                             {getPlayerImage(athlete) ? (
                               <img src={getPlayerImage(athlete)} alt={athlete.displayName} className="w-full h-full object-cover" />
                             ) : (
                               <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100 dark:bg-slate-700">
                                 <User className="w-6 h-6" />
                               </div>
                             )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{athlete.displayName}</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                              {athlete.team?.abbreviation} • {leader.displayValue}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Play by Play */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 font-bold text-lg text-slate-900 dark:text-white">Play by Play</div>
            <div className="max-h-[500px] overflow-y-auto">
              {plays.map((play: any, idx: number) => {
                const isScoring = play.scoringPlay || play.text?.toLowerCase().includes('homer') || play.text?.toLowerCase().includes('scores') || play.type?.text?.toLowerCase().includes('run');
                const participant = play.participants?.[0]?.athlete;

                return (
                  <div key={idx} className={cn(
                    "p-3 border-b border-slate-50 dark:border-slate-700 flex gap-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors",
                    isScoring && "bg-green-100 dark:bg-green-900/40 border-l-4 border-l-green-500"
                  )}>
                    <div className="font-mono text-slate-400 w-12 shrink-0 text-right pt-1">{play.clock?.displayValue || play.period?.number}</div>
                    
                    {participant && getPlayerImage(participant) && (
                      <div 
                        className="shrink-0 w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 cursor-pointer hover:border-emerald-500 transition-colors"
                        onClick={() => handlePlayerClick(participant)}
                      >
                        <img src={getPlayerImage(participant)} alt={participant.displayName} className="w-full h-full object-cover" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="text-slate-900 dark:text-slate-100 font-medium">{play.text}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{play.type?.text}</div>
                    </div>
                  </div>
                );
              })}
              {plays.length === 0 && <div className="p-4 text-slate-500 dark:text-slate-400 text-center">No plays available yet.</div>}
            </div>
          </div>
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-6">
          {/* Box Score Summary */}
          {boxscore.teams && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-4">
             <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">Team Stats</h3>
             <div className="space-y-2">
               {boxscore.teams.map((team: any) => (
                 <div key={team.team.id} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                   <div className="flex items-center gap-2">
                     <img src={team.team.logo || team.team.logos?.[0]?.href} className="w-6 h-6" />
                     <span className="font-medium text-sm text-slate-900 dark:text-white">{team.team.abbreviation}</span>
                   </div>
                   {/* Add specific stats based on sport if needed */}
                 </div>
               ))}
             </div>
             <div className="mt-4 text-center">
               <button 
                 onClick={() => setShowBoxScore(true)}
                 className="text-sm text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
               >
                 View Full Box Score
               </button>
             </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};
