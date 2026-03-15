import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

export interface FavoriteTeam {
  id: string;
  name: string;
  league: string; // 'nfl', 'nba', 'mlb', 'nhl'
  logo?: string;
  notify: boolean;
}

export interface FavoritePlayer {
  id: string;
  name: string;
  team?: string;
  position?: string;
  headshot?: string;
}

export interface SubscribedGame {
  id: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
}

interface FavoritesContextType {
  favorites: FavoriteTeam[];
  favoritePlayers: FavoritePlayer[];
  subscribedGames: SubscribedGame[];
  addFavorite: (team: Omit<FavoriteTeam, 'notify'>) => void;
  removeFavorite: (teamId: string, league?: string) => void;
  toggleFavoriteNotification: (teamId: string, league?: string) => void;
  isFavorite: (teamId: string, league?: string) => boolean;
  addFavoritePlayer: (player: FavoritePlayer) => void;
  removeFavoritePlayer: (playerId: string) => void;
  isFavoritePlayer: (playerId: string) => boolean;
  subscribeToGame: (game: SubscribedGame) => void;
  unsubscribeFromGame: (gameId: string) => void;
  isSubscribedToGame: (gameId: string) => boolean;
  clearFavorites: () => void;
  clearFavoriteTeams: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const [favorites, setFavorites] = useState<FavoriteTeam[]>(() => {
    // Force clear for v3 migration to ensure no defaults
    const hasMigrated = localStorage.getItem('favorites_migrated_v3');
    if (!hasMigrated) return [];
    
    const saved = localStorage.getItem('favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const [favoritePlayers, setFavoritePlayers] = useState<FavoritePlayer[]>(() => {
    // Force clear for v3 migration
    const hasMigrated = localStorage.getItem('favorites_migrated_v3');
    if (!hasMigrated) return [];

    const saved = localStorage.getItem('favoritePlayers');
    return saved ? JSON.parse(saved) : [];
  });

  const [subscribedGames, setSubscribedGames] = useState<SubscribedGame[]>(() => {
    const saved = localStorage.getItem('subscribedGames');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    // Set migration flag after mount
    if (!localStorage.getItem('favorites_migrated_v3')) {
      localStorage.setItem('favorites_migrated_v3', 'true');
      setFavorites([]);
      setFavoritePlayers([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('favoritePlayers', JSON.stringify(favoritePlayers));
  }, [favoritePlayers]);

  useEffect(() => {
    localStorage.setItem('subscribedGames', JSON.stringify(subscribedGames));
  }, [subscribedGames]);

  const addFavorite = (team: Omit<FavoriteTeam, 'notify'>) => {
    if (!team || !team.id) return;
    if (!favorites.some(f => f.id === team.id)) {
      setFavorites(prev => [...prev, { ...team, notify: true }]);
      toast.success(`Added ${team.name} to favorites`);
    }
  };

  const removeFavorite = (teamId: string, league?: string) => {
    if (!teamId) return;
    const team = favorites.find(f => f.id === teamId && (!league || f.league === league));
    setFavorites(prev => prev.filter(f => !(f.id === teamId && (!league || f.league === league))));
    if (team) {
      toast.success(`Removed ${team.name} from favorites`);
    }
  };

  const toggleFavoriteNotification = (teamId: string, league?: string) => {
    if (!teamId) return;
    setFavorites(prev => prev.map(f => 
      (f.id === teamId && (!league || f.league === league)) ? { ...f, notify: !f.notify } : f
    ));
  };

  const isFavorite = (teamId: string, league?: string) => {
    if (!teamId) return false;
    return favorites.some(f => f.id === teamId && (!league || f.league === league));
  };

  const addFavoritePlayer = (player: FavoritePlayer) => {
    if (!favoritePlayers.some(p => p.id === player.id)) {
      setFavoritePlayers(prev => [...prev, player]);
      toast.success(`Added ${player.name} to favorites`);
    }
  };

  const removeFavoritePlayer = (playerId: string) => {
    const player = favoritePlayers.find(p => p.id === playerId);
    setFavoritePlayers(prev => prev.filter(p => p.id !== playerId));
    if (player) {
      toast.success(`Removed ${player.name} from favorites`);
    }
  };

  const isFavoritePlayer = (playerId: string) => {
    return favoritePlayers.some(p => p.id === playerId);
  };

  const subscribeToGame = (game: SubscribedGame) => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
    if (!subscribedGames.some(g => g.id === game.id)) {
      setSubscribedGames(prev => [...prev, game]);
      toast.success(`Subscribed to notifications for ${game.awayTeam} vs ${game.homeTeam}`);
    }
  };

  const unsubscribeFromGame = (gameId: string) => {
    setSubscribedGames(prev => prev.filter(g => g.id !== gameId));
    toast.success(`Unsubscribed from game notifications`);
  };

  const isSubscribedToGame = (gameId: string) => {
    return subscribedGames.some(g => g.id === gameId);
  };

  const clearFavorites = () => {
    setFavorites([]);
    setFavoritePlayers([]);
    setSubscribedGames([]);
    toast.success('Cleared all favorites and subscriptions');
  };

  const clearFavoriteTeams = () => {
    setFavorites([]);
    toast.success('Cleared all favorite teams');
  };

  return (
    <FavoritesContext.Provider value={{
      favorites,
      favoritePlayers,
      subscribedGames,
      addFavorite,
      removeFavorite,
      toggleFavoriteNotification,
      isFavorite,
      addFavoritePlayer,
      removeFavoritePlayer,
      isFavoritePlayer,
      subscribeToGame,
      unsubscribeFromGame,
      isSubscribedToGame,
      clearFavorites,
      clearFavoriteTeams
    }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
