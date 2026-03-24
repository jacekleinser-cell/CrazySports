import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2, Star, User } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import { cn } from '../lib/utils';

export const PlayerDetailsPage = () => {
  const { sport, league, id } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { isFavoritePlayer, addFavoritePlayer, removeFavoritePlayer } = useFavorites();

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        const res = await fetch(`https://site.api.espn.com/apis/common/v3/sports/${sport}/${league}/athletes/${id}`);
        const data = await res.json();
        setPlayer(data.athlete);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlayer();
  }, [sport, league, id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!player) {
    return <div className="p-8 text-center text-slate-500">Player not found</div>;
  }

  const toggleFavorite = () => {
    if (isFavoritePlayer(player.id)) {
      removeFavoritePlayer(player.id);
    } else {
      addFavoritePlayer({
        id: player.id,
        name: player.displayName,
        position: player.position?.abbreviation,
        headshot: player.headshot?.href,
        team: player.team?.displayName
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" /> Back
      </button>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="w-40 h-40 shrink-0 bg-slate-50 dark:bg-slate-800 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-100 dark:border-slate-700">
             {player.headshot?.href ? (
               <img src={player.headshot.href} alt={player.displayName} className="w-full h-full object-cover" />
             ) : (
               <User className="w-16 h-16 text-slate-300" />
             )}
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">{player.displayName}</h1>
            <div className="text-lg text-slate-500 dark:text-slate-400 mb-6 flex items-center justify-center md:justify-start gap-2">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{player.position?.displayName}</span>
              <span>•</span>
              <span>{player.team?.displayName || 'Free Agent'}</span>
              {player.jersey && (
                <>
                  <span>•</span>
                  <span className="font-mono">#{player.jersey}</span>
                </>
              )}
            </div>
            
            <button 
              onClick={toggleFavorite}
              className={cn(
                "inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-colors",
                isFavoritePlayer(player.id) 
                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" 
                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              )}
            >
              <Star className={cn("w-5 h-5", isFavoritePlayer(player.id) && "fill-current")} />
              {isFavoritePlayer(player.id) ? "Favorited" : "Add to Favorites"}
            </button>
          </div>
        </div>
        
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Height</div>
            <div className="text-lg font-mono font-bold text-slate-900 dark:text-white">{player.displayHeight || '--'}</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Weight</div>
            <div className="text-lg font-mono font-bold text-slate-900 dark:text-white">{player.displayWeight || '--'}</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Age</div>
            <div className="text-lg font-mono font-bold text-slate-900 dark:text-white">{player.age || '--'}</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Experience</div>
            <div className="text-lg font-mono font-bold text-slate-900 dark:text-white">{player.experience?.years || 0} yrs</div>
          </div>
        </div>
      </div>
    </div>
  );
};
