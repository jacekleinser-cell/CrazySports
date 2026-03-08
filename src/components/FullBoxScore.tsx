import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface FullBoxScoreProps {
  isOpen: boolean;
  onClose: () => void;
  boxscore: any;
  league: string;
}

export const FullBoxScore = ({ isOpen, onClose, boxscore, league }: FullBoxScoreProps) => {
  const players = boxscore?.players || [];

  const getPlayerImage = (athlete: any) => {
    if (!athlete) return null;
    if (athlete.headshot?.href) return athlete.headshot.href;
    if (athlete.id) return `https://a.espncdn.com/combiner/i?img=/i/headshots/${league}/players/full/${athlete.id}.png&w=350&h=254`;
    return null;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[90vh] flex flex-col"
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Full Box Score</h2>
              <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-8">
              {players.map((teamData: any, teamIdx: number) => (
                <div key={teamIdx} className="space-y-4">
                  <div className="flex items-center gap-3 pb-2 border-b border-slate-200 dark:border-slate-700">
                    <img 
                      src={teamData.team.logo || teamData.team.logos?.[0]?.href} 
                      alt={teamData.team.displayName} 
                      className="w-8 h-8 object-contain"
                    />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{teamData.team.displayName}</h3>
                  </div>

                  {teamData.statistics.map((statGroup: any, groupIdx: number) => (
                    <div key={groupIdx} className="overflow-x-auto">
                      <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                        {statGroup.name || statGroup.type}
                      </h4>
                      <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium text-xs uppercase">
                          <tr>
                            <th className="px-3 py-2 text-left sticky left-0 bg-slate-50 dark:bg-slate-800 z-10 w-48">Player</th>
                            {statGroup.labels?.map((label: string, i: number) => (
                              <th key={i} className="px-3 py-2 text-center whitespace-nowrap">{label}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                          {statGroup.athletes.map((athleteData: any, athleteIdx: number) => (
                            <tr key={athleteIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                              <td className="px-3 py-2 font-medium text-slate-900 dark:text-white sticky left-0 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 z-10 border-r border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-2">
                                  {getPlayerImage(athleteData.athlete) && (
                                    <img src={getPlayerImage(athleteData.athlete)} className="w-6 h-6 rounded-full object-cover bg-slate-100 dark:bg-slate-700" />
                                  )}
                                  <span className="truncate max-w-[150px]" title={athleteData.athlete?.displayName}>
                                    {athleteData.athlete?.displayName || 'Unknown'}
                                  </span>
                                  <span className="text-xs text-slate-400 font-normal">
                                    {athleteData.athlete?.position?.abbreviation}
                                  </span>
                                </div>
                              </td>
                              {athleteData.stats.map((stat: string, statIdx: number) => (
                                <td key={statIdx} className="px-3 py-2 text-center font-mono text-slate-600 dark:text-slate-300">
                                  {stat}
                                </td>
                              ))}
                            </tr>
                          ))}
                          {/* Totals Row if available */}
                          {statGroup.totals && (
                             <tr className="bg-slate-50 dark:bg-slate-800 font-bold border-t border-slate-200 dark:border-slate-700">
                               <td className="px-3 py-2 sticky left-0 bg-slate-50 dark:bg-slate-800 z-10 border-r border-slate-200 dark:border-slate-700">Totals</td>
                               {statGroup.totals.map((total: string, totalIdx: number) => (
                                 <td key={totalIdx} className="px-3 py-2 text-center font-mono text-slate-900 dark:text-white">
                                   {total}
                                 </td>
                               ))}
                             </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              ))}
              
              {players.length === 0 && (
                <div className="text-center text-slate-500 dark:text-slate-400 py-8">
                  Detailed player statistics are not available for this game yet.
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
