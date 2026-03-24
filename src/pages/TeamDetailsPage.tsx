import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2, Star } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import { cn } from '../lib/utils';

export const TeamDetailsPage = () => {
  const { sport, league, id } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { isFavoriteTeam, addFavoriteTeam, removeFavoriteTeam } = useFavorites();

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/teams/${id}`);
        const data = await res.json();
        setTeam(data.team);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, [sport, league, id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!team) {
    return <div className="p-8 text-center text-slate-500">Team not found</div>;
  }

  const toggleFavorite = () => {
    if (isFavoriteTeam(team.id)) {
      removeFavoriteTeam(team.id);
    } else {
      addFavoriteTeam({
        id: team.id,
        name: team.displayName,
        logo: team.logos?.[0]?.href
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
          <div className="w-32 h-32 shrink-0 bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 flex items-center justify-center border border-slate-100 dark:border-slate-700">
             {team.logos?.[0]?.href ? (
               <img src={team.logos[0].href} alt={team.displayName} className="w-full h-full object-contain" />
             ) : (
               <div className="text-4xl font-bold text-slate-300">{team.abbreviation}</div>
             )}
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">{team.displayName}</h1>
            <div className="text-lg text-slate-500 dark:text-slate-400 mb-6">
              {team.location} • {team.standingSummary || 'No standing info'}
            </div>
            
            <button 
              onClick={toggleFavorite}
              className={cn(
                "inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-colors",
                isFavoriteTeam(team.id) 
                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" 
                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              )}
            >
              <Star className={cn("w-5 h-5", isFavoriteTeam(team.id) && "fill-current")} />
              {isFavoriteTeam(team.id) ? "Favorited" : "Add to Favorites"}
            </button>
          </div>
        </div>
        
        {team.record?.items && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {team.record.items.map((rec: any, idx: number) => (
              <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
                <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">{rec.description}</div>
                <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white">{rec.summary}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
