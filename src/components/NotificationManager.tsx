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
  const { favorites, subscribedGames } = useFavorites();
  const { notificationsEnabled } = useSports();
  const previousScoresRef = useRef<Record<string, string>>({});
  const notifiedUpcomingRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    // Check if notifications are supported and permitted
    if (!("Notification" in window) || Notification.permission !== "granted" || !notificationsEnabled) {
      return;
    }

    const checkScores = async () => {
      // Group favorites and subscribed games by league to minimize API calls
      const leaguesToFetch = new Set<string>();
      favorites.forEach(fav => {
        if (fav.notify && fav.league) {
          leaguesToFetch.add(fav.league);
        }
      });
      subscribedGames.forEach(game => {
        if (game.league) {
          leaguesToFetch.add(game.league);
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
              fav.notify && fav.league === league && (fav.id === home.team.id || fav.id === away.team.id)
            );
            const isSubscribedGame = subscribedGames.some(sub => sub.id === game.id);

            if (!isFavoriteGame && !isSubscribedGame) return;

            const homeName = home.team.displayName;
            const awayName = away.team.displayName;

            // 15-minute pre-game notification
            if (game.date && game.status?.type?.state === 'pre') {
              const gameTime = new Date(game.date).getTime();
              const now = Date.now();
              const diffMinutes = (gameTime - now) / 1000 / 60;
              
              if (diffMinutes > 0 && diffMinutes <= 15 && !notifiedUpcomingRef.current[game.id]) {
                new Notification("Game Starting Soon", {
                  body: `${awayName} vs ${homeName} is starting in ${Math.ceil(diffMinutes)} minutes!`,
                  icon: '/vite.svg',
                  tag: `upcoming-${game.id}`
                });
                notifiedUpcomingRef.current[game.id] = true;
              }
            }

            // Score update notification
            if (game.status?.type?.state === 'in') {
              const homeScore = home.score || '0';
              const awayScore = away.score || '0';
              const scoreString = `${awayScore}-${homeScore}`;
              
              // Check for score change
              if (previousScoresRef.current[game.id] && previousScoresRef.current[game.id] !== scoreString) {
                const prevScoreString = previousScoresRef.current[game.id];
                const [prevAway, prevHome] = prevScoreString.split('-').map(Number);
                const currAway = Number(awayScore);
                const currHome = Number(homeScore);
                
                let isSignificant = false;
                
                if (sport === 'basketball') {
                  // For basketball, notify on lead changes, ties, or double-digit leads
                  const prevLead = prevAway > prevHome ? 'away' : prevHome > prevAway ? 'home' : 'tie';
                  const currLead = currAway > currHome ? 'away' : currHome > currAway ? 'home' : 'tie';
                  
                  if (prevLead !== currLead) {
                    isSignificant = true; // Lead change or tie
                  } else if (Math.abs(currAway - currHome) >= 10 && Math.abs(prevAway - prevHome) < 10) {
                    isSignificant = true; // Double digit lead established
                  }
                } else {
                  // For other sports (baseball, football, hockey, soccer), any score change is significant
                  isSignificant = true;
                }

                if (isSignificant) {
                  new Notification("Score Update", {
                    body: `${awayName} ${awayScore} - ${homeScore} ${homeName}`,
                    icon: '/vite.svg', // Placeholder
                    tag: game.id // Prevent duplicate notifications stacking too much
                  });
                }
              }
              
              previousScoresRef.current[game.id] = scoreString;
            }
          });
        } catch (error) {
          console.error(`Error checking scores for ${league}:`, error);
        }
      }
    };

    const interval = setInterval(checkScores, 15000); // Check every 15s
    checkScores(); // Initial check

    return () => clearInterval(interval);
  }, [favorites, subscribedGames, notificationsEnabled]);

  return null; // This component doesn't render anything
};
