import React, { useEffect, useRef } from 'react';
import { useFavorites } from '../context/FavoritesContext';
import { useSports } from '../context/SportsContext';
import { getScores, Score } from '../services/espn';
import { Sport, League } from '../context/SportsContext';

const LEAGUE_TO_SPORT: Record<string, Sport> = {
  'nba': 'basketball',
  'nfl': 'football',
  'mlb': 'baseball',
  'nhl': 'hockey',
  'eng.1': 'soccer'
};

export const NotificationManager = () => {
  const { favorites } = useFavorites();
  const { notificationsEnabled } = useSports();
  const previousScoresRef = useRef<Record<string, string>>({});

  useEffect(() => {
    // Check if notifications are supported and permitted
    if (!("Notification" in window) || Notification.permission !== "granted" || !notificationsEnabled) {
      return;
    }

    const checkScores = async () => {
      // Group favorites by league to minimize API calls
      const leaguesToFetch = new Set<string>();
      favorites.forEach(fav => {
        if (fav.notify && fav.league) {
          leaguesToFetch.add(fav.league);
        }
      });

      for (const league of Array.from(leaguesToFetch)) {
        const sport = LEAGUE_TO_SPORT[league];
        if (!sport) continue;

        try {
          const scores = await getScores(sport, league as League);
          
          scores.forEach((game: Score) => {
            if (!game.competitions?.[0]?.competitors) return;

            // Check if any favorite team is in this game
            const home = game.competitions[0].competitors.find(c => c.homeAway === 'home');
            const away = game.competitions[0].competitors.find(c => c.homeAway === 'away');
            
            if (!home || !away) return;

            const isFavoriteGame = favorites.some(fav => 
              fav.notify && (fav.id === home.team.id || fav.id === away.team.id)
            );

            if (!isFavoriteGame) return;

            const homeScore = home.score || '0';
            const awayScore = away.score || '0';
            const scoreString = `${awayScore}-${homeScore}`;
            
            // Check for score change
            if (previousScoresRef.current[game.id] && previousScoresRef.current[game.id] !== scoreString) {
              const homeName = home.team.displayName;
              const awayName = away.team.displayName;
              
              new Notification("Score Update", {
                body: `${awayName} ${awayScore} - ${homeScore} ${homeName}`,
                icon: '/vite.svg', // Placeholder
                tag: game.id // Prevent duplicate notifications stacking too much
              });
            }
            
            previousScoresRef.current[game.id] = scoreString;
          });
        } catch (error) {
          console.error(`Error checking scores for ${league}:`, error);
        }
      }
    };

    const interval = setInterval(checkScores, 15000); // Check every 15s
    checkScores(); // Initial check

    return () => clearInterval(interval);
  }, [favorites, notificationsEnabled]);

  return null; // This component doesn't render anything
};
