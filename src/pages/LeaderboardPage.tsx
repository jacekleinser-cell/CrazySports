import React, { useEffect, useState } from 'react';
import { Trophy, Medal, Award, User, Loader2, Star } from 'lucide-react';
import { useGuesses } from '../context/GuessContext';
import { useAuth } from '../context/AuthContext';
import { cn, getRank } from '../lib/utils';

interface LeaderboardUser {
  id: string;
  username: string;
  score: number;
}

export const LeaderboardPage = () => {
  const { score } = useGuesses();
  const { user } = useAuth();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch('/api/leaderboard');
        if (res.ok) {
          const data = await res.json();
          setUsers(data.leaderboard);
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 10000);
    return () => clearInterval(interval);
  }, []);

  // Make sure current user is in the list with their latest local score
  // (in case the backend hasn't updated yet or they are offline)
  const allUsers = [...users];
  if (user) {
    const meIndex = allUsers.findIndex(u => u.id === user.id);
    if (meIndex >= 0) {
      allUsers[meIndex].score = score;
    } else {
      allUsers.push({ id: user.id, username: user.username, score });
    }
  }
  
  allUsers.sort((a, b) => b.score - a.score);

  if (loading && users.length === 0) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const currentRank = getRank(score);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col items-center text-center gap-4 py-8 bg-gradient-to-b from-emerald-500/10 to-transparent rounded-3xl border border-emerald-500/20">
        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Trophy className="w-10 h-10 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Global Leaderboard</h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Make correct picks on the Guess page to earn points and climb the ranks. 10 points per win, plus up to 50 bonus points for predicting the exact margin of victory!
          </p>
        </div>
        
        <div className="mt-4 flex flex-wrap justify-center items-center gap-6 bg-white dark:bg-slate-900 px-8 py-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="text-center">
            <div className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold mb-1">Your Score</div>
            <div className="text-3xl font-mono font-bold text-emerald-500">{score}</div>
          </div>
          <div className="hidden sm:block w-px h-12 bg-slate-200 dark:bg-slate-800" />
          <div className="text-center">
            <div className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold mb-1">Global Rank</div>
            <div className="text-3xl font-mono font-bold text-slate-900 dark:text-white">
              #{allUsers.findIndex(u => u.id === (user?.id || 'me')) + 1}
            </div>
          </div>
          <div className="hidden sm:block w-px h-12 bg-slate-200 dark:bg-slate-800" />
          <div className="text-center">
            <div className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold mb-1">Status</div>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 justify-center">
              <Star className="w-6 h-6 fill-emerald-500 text-emerald-500" />
              {currentRank.name}
            </div>
          </div>
        </div>

        <div className="w-full max-w-md mt-4 px-4">
          <div className="flex justify-between text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
            <span>{currentRank.name}</span>
            {currentRank.nextThreshold ? (
              <span className="text-slate-500">{currentRank.nextThreshold - score} pts to {getRank(currentRank.nextThreshold).name}</span>
            ) : (
              <span className="text-emerald-500">Max Rank Achieved!</span>
            )}
          </div>
          <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all duration-1000 ease-out relative"
              style={{ width: `${currentRank.progress}%` }}
            >
              <div className="absolute inset-0 bg-white/20" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto] gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <div className="w-12 text-center">Rank</div>
          <div>Player</div>
          <div className="text-right pr-4">Score</div>
        </div>
        
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {allUsers.map((u, index) => {
            const isMe = u.id === (user?.id || 'me');
            const rank = index + 1;
            const userRank = getRank(u.score);
            
            return (
              <div 
                key={u.id} 
                className={cn(
                  "grid grid-cols-[auto_1fr_auto] gap-4 p-4 items-center transition-colors",
                  isMe ? "bg-emerald-50/50 dark:bg-emerald-900/10" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                )}
              >
                <div className="w-12 flex justify-center">
                  {rank === 1 ? <Trophy className="w-6 h-6 text-yellow-500" /> :
                   rank === 2 ? <Medal className="w-6 h-6 text-slate-400" /> :
                   rank === 3 ? <Medal className="w-6 h-6 text-amber-600" /> :
                   <span className="text-lg font-mono font-bold text-slate-400">{rank}</span>}
                </div>
                
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg",
                    isMe ? "bg-emerald-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  )}>
                    {isMe ? <User className="w-5 h-5" /> : u.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className={cn(
                      "font-bold text-base flex items-center gap-2",
                      isMe ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"
                    )}>
                      {u.username}
                      {isMe && <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">You</span>}
                    </span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {userRank.name}
                    </span>
                  </div>
                </div>
                
                <div className="text-right pr-4">
                  <span className="text-xl font-mono font-bold text-slate-900 dark:text-white">{u.score}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">pts</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
