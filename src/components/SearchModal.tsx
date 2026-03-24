import React, { useState, useEffect } from 'react';
import { Search, X, User, Star, Shield, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { search, getStandings } from '../services/espn';
import { useFavorites } from '../context/FavoritesContext';
import { useSports } from '../context/SportsContext';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal = ({ isOpen, onClose }: SearchModalProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ teams: any[], players: any[] }>({ teams: [], players: [] });
  const [suggestedTeams, setSuggestedTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { addFavorite, removeFavorite, isFavorite, addFavoritePlayer, removeFavoritePlayer, isFavoritePlayer } = useFavorites();
  const { sport, league } = useSports();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && query.length === 0) {
      const fetchSuggestions = async () => {
        try {
          const standings = await getStandings(sport, league);
          const allTeams = standings.flatMap(group => group.entries.map(entry => ({
            id: entry.team.id,
            displayName: entry.team.displayName,
            location: entry.team.location,
            league: league.toUpperCase(),
            logos: entry.team.logos
          })));
          // Sort alphabetically
          allTeams.sort((a, b) => a.displayName.localeCompare(b.displayName));
          setSuggestedTeams(allTeams);
        } catch (error) {
          console.error("Failed to fetch suggestions", error);
        }
      };
      fetchSuggestions();
    }
  }, [isOpen, query, sport, league]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length > 2) {
        setLoading(true);
        try {
          const [playerData, teamData] = await Promise.all([
            search(query, 'player'),
            search(query, 'team')
          ]);
          
          const players = Array.isArray(playerData) ? playerData : [];
          const teams = Array.isArray(teamData) ? teamData : [];
          
          // Deduplicate results by ID
          const uniqueTeams = Array.from(new Map(teams.filter(t => t.id).map(t => [t.id, t])).values());
          const uniquePlayers = Array.from(new Map(players.filter(p => p.id).map(p => [p.id, p])).values());

          setResults({
            teams: uniqueTeams,
            players: uniquePlayers
          });
        } catch (error) {
          console.error("Search failed", error);
          setResults({ teams: [], players: [] });
        }
        setLoading(false);
      } else {
        setResults({ teams: [], players: [] });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const handleFavoriteTeam = (e: React.MouseEvent, team: any) => {
    e.stopPropagation();
    const teamId = team.id;
    if (!teamId) return;

    const teamLeague = team.league || league.toUpperCase();
    if (isFavorite(teamId, teamLeague)) {
      removeFavorite(teamId, teamLeague);
    } else {
      addFavorite({
        id: teamId,
        name: team.displayName,
        league: teamLeague,
        logo: team.logos?.[0]?.href
      });
    }
  };

  const handleFavoritePlayer = (e: React.MouseEvent, player: any) => {
    e.stopPropagation();
    const playerId = player.id;
    if (!playerId) return;

    if (isFavoritePlayer(playerId)) {
      removeFavoritePlayer(playerId);
    } else {
      const teamName = player.team?.displayName || player.teamRelationships?.find((r: any) => r.type === 'team')?.displayName;
      
      addFavoritePlayer({
        id: playerId,
        name: player.displayName,
        team: teamName,
        position: player.position?.abbreviation,
        headshot: player.headshot?.href || player.images?.[0]?.url
      });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <div 
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          />
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col max-h-[80vh]"
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 shrink-0">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder={`Search for players, teams in ${league.toUpperCase()}...`}
                className="flex-1 text-lg outline-none placeholder:text-slate-400 bg-transparent text-slate-900 dark:text-white"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
              <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="overflow-y-auto bg-white dark:bg-slate-900 p-2">
              {loading && (
                <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
                  <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span>Searching...</span>
                </div>
              )}
              
              {!loading && query.length <= 2 && suggestedTeams.length > 0 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5" /> All {league.toUpperCase()} Teams
                    </h3>
                    <div className="grid grid-cols-1 gap-1">
                      {suggestedTeams.map((team) => {
                        const isFav = isFavorite(team.id, team.league || league.toUpperCase());
                        return (
                          <div 
                            key={`suggested-team-${team.id}`} 
                            className="group flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
                            onClick={() => {
                              navigate(`/team/${sport}/${team.league?.toLowerCase() || league}/${team.id}`);
                              onClose();
                            }}
                          >
                            <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center p-1 shrink-0">
                              {team.logos?.[0]?.href ? (
                                <img src={team.logos[0].href} alt={team.displayName} className="w-full h-full object-contain" />
                              ) : (
                                <Shield className="w-6 h-6 text-slate-300" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-slate-900 dark:text-white truncate">{team.displayName}</div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                  {team.league || league.toUpperCase()}
                                </span>
                                <span className="text-xs text-slate-400 truncate">{team.location}</span>
                              </div>
                            </div>
                            <button
                              onClick={(e) => handleFavoriteTeam(e, team)}
                              className={cn(
                                "p-2 rounded-full transition-all duration-200",
                                isFav 
                                  ? "bg-yellow-50 text-yellow-500 opacity-100" 
                                  : "text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 opacity-0 group-hover:opacity-100"
                              )}
                            >
                              <Star className={cn("w-5 h-5", isFav && "fill-current")} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {!loading && query.length > 2 && (results.teams.length > 0 || results.players.length > 0) && (
                <div className="space-y-6">
                  {/* Teams Section */}
                  {results.teams.length > 0 && (
                    <div>
                      <h3 className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5" /> Teams
                      </h3>
                      <div className="grid grid-cols-1 gap-1">
                        {results.teams.map((team) => {
                          const isFav = isFavorite(team.id, team.league || league.toUpperCase());
                          return (
                            <div 
                              key={`team-${team.id}`} 
                              className="group flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
                              onClick={() => {
                                navigate(`/team/${sport}/${team.league?.toLowerCase() || league}/${team.id}`);
                                onClose();
                              }}
                            >
                              <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center p-1 shrink-0">
                                {team.logos?.[0]?.href ? (
                                  <img src={team.logos[0].href} alt={team.displayName} className="w-full h-full object-contain" />
                                ) : (
                                  <Shield className="w-6 h-6 text-slate-300" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-slate-900 dark:text-white truncate">{team.displayName}</div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                    {team.league || 'Team'}
                                  </span>
                                  <span className="text-xs text-slate-400 truncate">{team.location}</span>
                                </div>
                              </div>
                              <button
                                onClick={(e) => handleFavoriteTeam(e, team)}
                                className={cn(
                                  "p-2 rounded-full transition-all duration-200",
                                  isFav 
                                    ? "bg-yellow-50 text-yellow-500 opacity-100" 
                                    : "text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 opacity-0 group-hover:opacity-100"
                                )}
                              >
                                <Star className={cn("w-5 h-5", isFav && "fill-current")} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Players Section */}
                  {results.players.length > 0 && (
                    <div>
                      <h3 className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Users className="w-3.5 h-3.5" /> Players
                      </h3>
                      <div className="grid grid-cols-1 gap-1">
                        {results.players.map((player) => {
                          const isFav = isFavoritePlayer(player.id);
                          const teamName = player.team?.displayName || player.teamRelationships?.find((r: any) => r.type === 'team')?.displayName;
                          
                          return (
                            <div 
                              key={`player-${player.id}`} 
                              className="group flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
                              onClick={() => {
                                navigate(`/player/${sport}/${league}/${player.id}`);
                                onClose();
                              }}
                            >
                              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                                {player.headshot?.href || player.images?.[0]?.url ? (
                                  <img src={player.headshot?.href || player.images?.[0]?.url} alt={player.displayName} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <User className="w-6 h-6 text-slate-400" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-slate-900 dark:text-white truncate">{player.displayName}</div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {player.position?.abbreviation && (
                                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-900/20 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                                      {player.position.abbreviation}
                                    </span>
                                  )}
                                  <span className="text-xs text-slate-500 truncate">{teamName || 'Free Agent'}</span>
                                </div>
                              </div>
                              <button
                                onClick={(e) => handleFavoritePlayer(e, player)}
                                className={cn(
                                  "p-2 rounded-full transition-all duration-200",
                                  isFav 
                                    ? "bg-yellow-50 text-yellow-500 opacity-100" 
                                    : "text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 opacity-0 group-hover:opacity-100"
                                )}
                              >
                                <Star className={cn("w-5 h-5", isFav && "fill-current")} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!loading && query.length > 2 && results.teams.length === 0 && results.players.length === 0 && (
                <div className="p-12 text-center text-slate-500">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                    <Search className="w-6 h-6 text-slate-400" />
                  </div>
                  <p>No results found for "{query}"</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
