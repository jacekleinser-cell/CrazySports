import React from 'react';
import { useSports } from '../context/SportsContext';
import { Moon, Sun, Check, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export const SettingsPage = () => {
  const { 
    theme, toggleTheme, 
    mainSport, setMainSportPreference,
    notificationsEnabled, toggleNotifications 
  } = useSports();
  const navigate = useNavigate();

  const leagues = [
    { name: 'NBA', sport: 'basketball', league: 'nba' },
    { name: 'NFL', sport: 'football', league: 'nfl' },
    { name: 'MLB', sport: 'baseball', league: 'mlb' },
    { name: 'NHL', sport: 'hockey', league: 'nhl' },
  ] as const;

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-300" />
        </button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
      </div>

      <div className="space-y-8">
        {/* Appearance Section */}
        <section className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Appearance</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                {theme === 'dark' ? <Moon className="w-5 h-5 text-indigo-500" /> : <Sun className="w-5 h-5 text-amber-500" />}
              </div>
              <div>
                <div className="font-medium text-slate-900 dark:text-white">Theme</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {theme === 'dark' ? 'Dark mode is active' : 'Light mode is active'}
                </div>
              </div>
            </div>
            <button 
              onClick={toggleTheme}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
            >
              Toggle
            </button>
          </div>
        </section>

        {/* Preferences Section */}
        <section className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Preferences</h2>
          
          <div className="space-y-6">
            {/* Main Sport */}
            <div>
              <div className="mb-3 font-medium text-slate-900 dark:text-white">Main Sport</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {leagues.map((l) => (
                  <button
                    key={l.league}
                    onClick={() => setMainSportPreference(l.sport, l.league)}
                    className={cn(
                      "px-4 py-3 rounded-xl text-sm font-medium border transition-all flex flex-col items-center gap-2",
                      mainSport.league === l.league
                        ? "bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                    )}
                  >
                    {l.name}
                    {mainSport.league === l.league && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500">This sport will be shown by default when you open the app.</p>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800" />

            {/* Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-slate-900 dark:text-white">Notifications</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Get alerts for live games and score updates
                </div>
              </div>
              <button 
                onClick={toggleNotifications}
                className={cn(
                  "w-12 h-6 rounded-full relative transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900",
                  notificationsEnabled ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"
                )}
              >
                <span className={cn(
                  "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out shadow-sm",
                  notificationsEnabled ? "translate-x-6" : "translate-x-0"
                )} />
              </button>
            </div>
          </div>
        </section>

        <div className="text-center text-xs text-slate-400">
          App Version 1.0.0
        </div>
      </div>
    </div>
  );
};
