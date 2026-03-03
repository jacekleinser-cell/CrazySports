import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

interface FavoritesContextType {
  favorites: FavoriteTeam[];
  favoritePlayers: FavoritePlayer[];
  addFavorite: (team: Omit<FavoriteTeam, 'notify'>) => void;
  removeFavorite: (teamId: string) => void;
  toggleFavoriteNotification: (teamId: string) => void;
  isFavorite: (teamId: string) => boolean;
  addFavoritePlayer: (player: FavoritePlayer) => void;
  removeFavoritePlayer: (playerId: string) => void;
  isFavoritePlayer: (playerId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const [favorites, setFavorites] = useState<FavoriteTeam[]>(() => {
    const saved = localStorage.getItem('favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const [favoritePlayers, setFavoritePlayers] = useState<FavoritePlayer[]>(() => {
    const saved = localStorage.getItem('favoritePlayers');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('favoritePlayers', JSON.stringify(favoritePlayers));
  }, [favoritePlayers]);

  const addFavorite = (team: Omit<FavoriteTeam, 'notify'>) => {
    if (!favorites.some(f => f.id === team.id)) {
      setFavorites(prev => [...prev, { ...team, notify: true }]);
    }
  };

  const removeFavorite = (teamId: string) => {
    setFavorites(prev => prev.filter(f => f.id !== teamId));
  };

  const toggleFavoriteNotification = (teamId: string) => {
    setFavorites(prev => prev.map(f => 
      f.id === teamId ? { ...f, notify: !f.notify } : f
    ));
  };

  const isFavorite = (teamId: string) => {
    return favorites.some(f => f.id === teamId);
  };

  const addFavoritePlayer = (player: FavoritePlayer) => {
    if (!favoritePlayers.some(p => p.id === player.id)) {
      setFavoritePlayers(prev => [...prev, player]);
    }
  };

  const removeFavoritePlayer = (playerId: string) => {
    setFavoritePlayers(prev => prev.filter(p => p.id !== playerId));
  };

  const isFavoritePlayer = (playerId: string) => {
    return favoritePlayers.some(p => p.id === playerId);
  };

  return (
    <FavoritesContext.Provider value={{
      favorites,
      favoritePlayers,
      addFavorite,
      removeFavorite,
      toggleFavoriteNotification,
      isFavorite,
      addFavoritePlayer,
      removeFavoritePlayer,
      isFavoritePlayer
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
