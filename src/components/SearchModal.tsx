import React, { useState, useEffect } from 'react';
import { Search, X, User, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { search } from '../services/espn';
import { useFavorites } from '../context/FavoritesContext';
import { cn } from '../lib/utils';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal = ({ isOpen, onClose }: SearchModalProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { addFavorite, removeFavorite, isFavorite, addFavoritePlayer, removeFavoritePlayer, isFavoritePlayer } = useFavorites();

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
          
          setResults([...teams, ...players]);
        } catch (error) {
          console.error("Search failed", error);
          setResults([]);
        }
        setLoading(false);
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const handleFavorite = (e: React.MouseEvent, result: any) => {
    e.stopPropagation();
    
    const isTeam = result.type === 'team';

    if (isTeam) {
      const teamId = result.id;
      if (!teamId) return;

      if (isFavorite(teamId)) {
        removeFavorite(teamId);
      } else {
        addFavorite({
          id: teamId,
          name: result.displayName,
          league: result.league || 'unknown',
          logo: result.logos?.[0]?.href
        });
      }
    } else {
      // Player
      const playerId = result.id;
      if (!playerId) return;

      if (isFavoritePlayer(playerId)) {
        removeFavoritePlayer(playerId);
      } else {
        // Try to find team name from relationships
        const teamName = result.teamRelationships?.find((r: any) => r.type === 'team')?.displayName || result.team?.displayName;
        
        addFavoritePlayer({
          id: playerId,
          name: result.displayName,
          team: teamName,
          position: result.position?.abbreviation, // Might be undefined, that's ok
          headshot: result.headshot?.href || result.images?.[0]?.url
        });
      }
    }
  };

  const isResultFavorite = (result: any) => {
    if (!result.id) return false;
    if (result.type === 'team') {
      return isFavorite(result.id);
    }
    return isFavoritePlayer(result.id);
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
            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search for players, teams..."
                className="flex-1 text-lg outline-none placeholder:text-slate-400 bg-transparent text-slate-900 dark:text-white"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
              <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto bg-white dark:bg-slate-900">
              {loading && (
                <div className="p-8 text-center text-slate-500">Searching...</div>
              )}
              
              {!loading && results.length > 0 && (
                <div className="py-2">
                  <h3 className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Results</h3>
                  {results.map((result, idx) => {
                    const isTeam = result.type === 'team';
                    const isFav = isResultFavorite(result);
                    const imageUrl = isTeam ? result.logos?.[0]?.href : (result.headshot?.href || result.images?.[0]?.url);
                    const subtitle = isTeam 
                      ? `${result.league?.toUpperCase() || ''} Team` 
                      : (result.teamRelationships?.find((r: any) => r.type === 'team')?.displayName || result.team?.displayName || 'Free Agent');

                    return (
                      <div key={`${result.type}-${result.id}-${idx}`} className="w-full px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-4 text-left transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0 group cursor-pointer" onClick={(e) => handleFavorite(e, result)}>
                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                          {imageUrl ? (
                            <img src={imageUrl} alt={result.displayName} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-900 dark:text-white truncate">{result.displayName || 'Unknown'}</div>
                          <div className="text-sm text-slate-500 truncate">{subtitle}</div>
                        </div>
                        
                        <button
                          onClick={(e) => handleFavorite(e, result)}
                          className={cn(
                            "p-2 rounded-full transition-colors",
                            isFav ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-700"
                          )}
                          title={isFav ? "Remove from favorites" : "Add to favorites"}
                        >
                          <Star 
                            className={cn(
                              "w-5 h-5", 
                              isFav ? "fill-yellow-400 text-yellow-400" : "text-slate-300 dark:text-slate-600"
                            )} 
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {!loading && query.length > 2 && results.length === 0 && (
                <div className="p-8 text-center text-slate-500">No results found for "{query}"</div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
