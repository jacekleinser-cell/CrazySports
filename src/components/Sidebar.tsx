import { useState } from 'react';
import { X, Trophy, Newspaper, Activity, Settings, ChevronDown, ChevronUp, Star, Trash2, User, BarChart2, Search } from 'lucide-react';
import { useSports, Sport, League } from '../context/SportsContext';
import { useFavorites } from '../context/FavoritesContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSearch?: () => void;
}

export const Sidebar = ({ isOpen, onClose, onOpenSearch }: SidebarProps) => {
  const { 
    sport, league, setSportLeague, 
    mainSport, setMainSportPreference,
  } = useSports();
  const { favorites, removeFavorite, favoritePlayers, removeFavoritePlayer } = useFavorites();
  
  const navigate = useNavigate();
  const location = useLocation();
  const [scoresOpen, setScoresOpen] = useState(false);

  const leagues: { name: string; sport: Sport; league: League }[] = [
    { name: 'NBA', sport: 'basketball', league: 'nba' },
    { name: 'NFL', sport: 'football', league: 'nfl' },
    { name: 'MLB', sport: 'baseball', league: 'mlb' },
    { name: 'NHL', sport: 'hockey', league: 'nhl' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleLeagueSelect = (s: Sport, l: League) => {
    setSportLeague(s, l);
    navigate('/scores');
    onClose();
  };

  const handleLiveScoresClick = () => {
    setSportLeague(mainSport.sport, mainSport.league);
    navigate('/scores');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 h-full w-72 bg-slate-900 dark:bg-slate-950 text-white z-50 shadow-xl border-r border-slate-800 flex flex-col"
          >
            <div className="p-4 flex justify-between items-center border-b border-slate-800">
              <h2 className="font-bold text-lg">Menu</h2>
              <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-6 flex-1 overflow-y-auto">
              {/* Favorites Section */}
              <div className="pb-6 border-b border-slate-800 space-y-6">
                {favorites.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3">My Teams</h3>
                    <div className="space-y-1">
                      {favorites.map((team) => (
                        <div key={team.id} className="flex items-center justify-between group px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors">
                          <div className="flex items-center gap-3 overflow-hidden">
                            {team.logo ? (
                              <img src={team.logo} alt={team.name} className="w-6 h-6 object-contain" />
                            ) : (
                              <div className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center text-[10px] font-bold">
                                {team.name.substring(0, 2)}
                              </div>
                            )}
                            <span className="text-sm font-medium truncate text-slate-300 group-hover:text-white">{team.name}</span>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFavorite(team.id);
                            }}
                            className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                            title="Remove from favorites"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {favoritePlayers.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3">My Players</h3>
                    <div className="space-y-1">
                      {favoritePlayers.map((player) => (
                        <div key={player.id} className="flex items-center justify-between group px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden shrink-0 border border-slate-600">
                              {player.headshot ? (
                                <img src={player.headshot} alt={player.name} className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate text-slate-300 group-hover:text-white">{player.name}</div>
                              <div className="text-[10px] text-slate-500 truncate">{player.team}</div>
                            </div>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFavoritePlayer(player.id);
                            }}
                            className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                            title="Remove from favorites"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {favorites.length === 0 && favoritePlayers.length === 0 && (
                  <div className="px-3 py-4 text-center border border-slate-800 rounded-lg bg-slate-800/50">
                    <Star className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                    <p className="text-sm text-slate-400 mb-3">No favorites yet.</p>
                  </div>
                )}
                
                <button 
                  onClick={onOpenSearch}
                  className="w-full text-left px-3 py-2 mt-2 rounded-lg text-sm font-medium text-emerald-500 hover:bg-emerald-500/10 flex items-center justify-center gap-2 transition-colors border border-emerald-500/20"
                >
                  <Search className="w-4 h-4" /> Search Teams & Players
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between w-full">
                  <button 
                    onClick={handleLiveScoresClick}
                    className="flex-1 text-left px-3 py-2 rounded-l-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white flex items-center gap-3 transition-colors"
                  >
                    <Activity className="w-4 h-4" /> Live Scores
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setScoresOpen(!scoresOpen); }}
                    className="px-3 py-2 rounded-r-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors border-l border-slate-800"
                  >
                    {scoresOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
                
                <AnimatePresence>
                  {scoresOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden pl-4"
                    >
                      <div className="space-y-1 mt-1 border-l border-slate-800 pl-2">
                        {leagues.map((l) => (
                          <button
                            key={l.league}
                            onClick={() => handleLeagueSelect(l.sport, l.league)}
                            className={cn(
                              "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between",
                              league === l.league 
                                ? "text-emerald-500" 
                                : "text-slate-400 hover:text-white"
                            )}
                          >
                            {l.name}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div>
                <button 
                  onClick={() => handleNavigation('/standings')}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-3",
                    location.pathname === '/standings' ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <Trophy className="w-4 h-4" /> Standings
                </button>
                <button 
                  onClick={() => handleNavigation('/stats')}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-3",
                    location.pathname === '/stats' ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <BarChart2 className="w-4 h-4" /> Stats
                </button>
                <button 
                  onClick={() => handleNavigation('/news')}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-3",
                    location.pathname === '/news' ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <Newspaper className="w-4 h-4" /> News
                </button>
              </div>

              <div className="pt-6 border-t border-slate-800">
                <button 
                  onClick={() => handleNavigation('/settings')}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white flex items-center gap-3"
                >
                  <Settings className="w-4 h-4" /> Settings
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
