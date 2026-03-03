import React from 'react';
import { Menu, Search, Bell, X } from 'lucide-react';
import { useSports } from '../context/SportsContext';
import { cn } from '../lib/utils';

interface NavbarProps {
  toggleSidebar: () => void;
  toggleSearch: () => void;
}

export const Navbar = ({ toggleSidebar, toggleSearch }: NavbarProps) => {
  const { league, notificationsEnabled, toggleNotifications } = useSports();

  return (
    <nav className="bg-slate-900 text-white p-4 sticky top-0 z-50 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={toggleSidebar} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold tracking-tight">
            Sports<span className="text-emerald-500">Central</span>
            <span className="ml-2 text-xs font-mono text-slate-400 uppercase border border-slate-700 px-2 py-0.5 rounded-full">
              {league.toUpperCase()}
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={toggleSearch}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>
          <button 
            onClick={toggleNotifications}
            className={cn(
              "p-2 rounded-lg transition-colors relative",
              notificationsEnabled ? "text-emerald-500 hover:bg-slate-800" : "hover:bg-slate-800 text-slate-400"
            )}
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {notificationsEnabled && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            )}
          </button>
        </div>
      </div>
    </nav>
  );
};
