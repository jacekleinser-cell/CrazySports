import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface Guess {
  gameId: string;
  teamId: string;
  predictedHomeScore?: number;
  predictedAwayScore?: number;
  status: 'pending' | 'won' | 'lost';
}

interface GuessContextType {
  guesses: Record<string, Guess>;
  score: number;
  makeGuess: (gameId: string, teamId: string, predictedHomeScore?: number, predictedAwayScore?: number) => void;
  resolveGuess: (gameId: string, winningTeamId: string, actualHomeScore?: number, actualAwayScore?: number) => void;
}

const GuessContext = createContext<GuessContextType | undefined>(undefined);

export const GuessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [guesses, setGuesses] = useState<Record<string, Guess>>(() => {
    const saved = localStorage.getItem('user_guesses');
    return saved ? JSON.parse(saved) : {};
  });
  const [score, setScore] = useState<number>(() => {
    const saved = localStorage.getItem('user_score');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Sync score from backend if it's higher (e.g. logged in on a new device)
  useEffect(() => {
    if (user && (user as any).score > score) {
      setScore((user as any).score);
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('user_guesses', JSON.stringify(guesses));
    localStorage.setItem('user_score', score.toString());
    
    // Sync score with backend
    const token = localStorage.getItem('auth_token');
    if (token) {
      fetch('/api/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ score })
      }).catch(console.error);
    }
  }, [guesses, score]);

  const makeGuess = (gameId: string, teamId: string, predictedHomeScore?: number, predictedAwayScore?: number) => {
    setGuesses(prev => {
      // Don't allow changing guess if already resolved
      if (prev[gameId] && prev[gameId].status !== 'pending') return prev;
      return {
        ...prev,
        [gameId]: { gameId, teamId, predictedHomeScore, predictedAwayScore, status: 'pending' }
      };
    });
  };

  const resolveGuess = (gameId: string, winningTeamId: string, actualHomeScore?: number, actualAwayScore?: number) => {
    setGuesses(prev => {
      const guess = prev[gameId];
      if (!guess || guess.status !== 'pending') return prev;

      const won = guess.teamId === winningTeamId;
      if (won) {
        let pointsEarned = 500; // 500 points for picking the winner
        
        // Bonus points for exact score prediction
        if (
          guess.predictedHomeScore !== undefined && 
          guess.predictedAwayScore !== undefined &&
          actualHomeScore !== undefined &&
          actualAwayScore !== undefined
        ) {
          if (guess.predictedHomeScore === actualHomeScore && guess.predictedAwayScore === actualAwayScore) {
            pointsEarned += 500; // 500 bonus points for exact score
          } else if (Math.abs(guess.predictedHomeScore - actualHomeScore) <= 3 && Math.abs(guess.predictedAwayScore - actualAwayScore) <= 3) {
            pointsEarned += 100; // 100 bonus points for being close (within 3 points)
          }
        }
        
        setScore(s => s + pointsEarned);
      }

      return {
        ...prev,
        [gameId]: { ...guess, status: won ? 'won' : 'lost' }
      };
    });
  };

  return (
    <GuessContext.Provider value={{ guesses, score, makeGuess, resolveGuess }}>
      {children}
    </GuessContext.Provider>
  );
};

export const useGuesses = () => {
  const context = useContext(GuessContext);
  if (context === undefined) {
    throw new Error('useGuesses must be used within a GuessProvider');
  }
  return context;
};
