import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { getScores, Score } from '../services/espn';

export type Sport = 'football' | 'basketball' | 'baseball' | 'hockey' | 'soccer';
export type League = 'nfl' | 'nba' | 'mlb' | 'nhl' | 'eng.1';

interface SportsContextType {
  sport: Sport;
  league: League;
  setSportLeague: (sport: Sport, league: League) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  mainSport: { sport: Sport; league: League };
  setMainSportPreference: (sport: Sport, league: League) => void;
  notificationsEnabled: boolean;
  toggleNotifications: () => Promise<void>;
}

const SportsContext = createContext<SportsContextType | undefined>(undefined);

export const SportsProvider = ({ children }: { children: ReactNode }) => {
  // Load initial state from localStorage
  const [sport, setSport] = useState<Sport>(() => (localStorage.getItem('lastSport') as Sport) || 'basketball');
  const [league, setLeague] = useState<League>(() => (localStorage.getItem('lastLeague') as League) || 'nba');
  
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as 'light' | 'dark') || 'light');
  
  const [mainSport, setMainSport] = useState<{ sport: Sport; league: League }>(() => {
    const saved = localStorage.getItem('mainSport');
    return saved ? JSON.parse(saved) : { sport: 'baseball', league: 'mlb' };
  });

  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    return localStorage.getItem('notificationsEnabled') === 'true';
  });

  // Persist state changes
  useEffect(() => {
    localStorage.setItem('lastSport', sport);
    localStorage.setItem('lastLeague', league);
  }, [sport, league]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('mainSport', JSON.stringify(mainSport));
  }, [mainSport]);

  useEffect(() => {
    localStorage.setItem('notificationsEnabled', String(notificationsEnabled));
  }, [notificationsEnabled]);

  const setSportLeague = (s: Sport, l: League) => {
    setSport(s);
    setLeague(l);
  };

  const toggleTheme = () => {
    setTheme(prev => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return newTheme;
    });
  };

  const setMainSportPreference = (s: Sport, l: League) => {
    setMainSport({ sport: s, league: l });
  };

  const toggleNotifications = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notification");
      return;
    }
    
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      return;
    }

    if (Notification.permission === "granted") {
      setNotificationsEnabled(true);
    } else if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setNotificationsEnabled(true);
      }
    } else {
      alert("Notifications are blocked. Please enable them in your browser settings.");
    }
  };

  return (
    <SportsContext.Provider value={{ 
      sport, league, setSportLeague,
      theme, toggleTheme,
      mainSport, setMainSportPreference,
      notificationsEnabled, toggleNotifications
    }}>
      {children}
    </SportsContext.Provider>
  );
};

export const useSports = () => {
  const context = useContext(SportsContext);
  if (context === undefined) {
    throw new Error('useSports must be used within a SportsProvider');
  }
  return context;
};
