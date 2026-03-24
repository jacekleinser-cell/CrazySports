import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Score } from '../services/espn';
import { useGuesses } from '../context/GuessContext';
import { cn } from '../lib/utils';

interface GuessModalProps {
  game: Score;
  preselectedTeamId: string;
  onClose: () => void;
}

export const GuessModal = ({ game, preselectedTeamId, onClose }: GuessModalProps) => {
  const { makeGuess } = useGuesses();
  const [selectedTeamId, setSelectedTeamId] = useState(preselectedTeamId);
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');

  const competition = game.competitions?.[0];
  const home = competition?.competitors?.find((c) => c.homeAway === 'home');
  const away = competition?.competitors?.find((c) => c.homeAway === 'away');

  if (!home || !away) return null;

  const selectedTeam = selectedTeamId === home.team.id ? home : away;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    makeGuess(
      game.id, 
      selectedTeamId, 
      homeScore ? parseInt(homeScore, 10) : undefined,
      awayScore ? parseInt(awayScore, 10) : undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Predict Score</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Who will win?</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedTeamId(away.team.id)}
                className={cn(
                  "flex flex-col items-center p-3 rounded-xl border-2 transition-all",
                  selectedTeamId === away.team.id 
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" 
                    : "border-slate-200 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-800"
                )}
              >
                <img src={away.team.logo} alt={away.team.abbreviation} className="w-10 h-10 object-contain mb-2" />
                <span className="text-sm font-bold text-slate-900 dark:text-white text-center">{away.team.name}</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTeamId(home.team.id)}
                className={cn(
                  "flex flex-col items-center p-3 rounded-xl border-2 transition-all",
                  selectedTeamId === home.team.id 
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" 
                    : "border-slate-200 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-800"
                )}
              >
                <img src={home.team.logo} alt={home.team.abbreviation} className="w-10 h-10 object-contain mb-2" />
                <span className="text-sm font-bold text-slate-900 dark:text-white text-center">{home.team.name}</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Predict the Final Score</label>
            
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 space-y-1">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{away.team.abbreviation} (Away)</div>
                <input 
                  type="number" 
                  min="0"
                  required
                  value={awayScore}
                  onChange={(e) => setAwayScore(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-lg font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0"
                />
              </div>
              <div className="text-2xl font-bold text-slate-300 dark:text-slate-600 mt-5">-</div>
              <div className="flex-1 space-y-1">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{home.team.abbreviation} (Home)</div>
                <input 
                  type="number" 
                  min="0"
                  required
                  value={homeScore}
                  onChange={(e) => setHomeScore(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-lg font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl transition-colors"
          >
            Submit Prediction
          </button>
        </form>
      </div>
    </div>
  );
};
