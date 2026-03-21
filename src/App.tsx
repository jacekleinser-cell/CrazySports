/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { SportsProvider } from './context/SportsContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { SearchModal } from './components/SearchModal';
import { ScoresPage } from './pages/ScoresPage';
import { StandingsPage } from './pages/StandingsPage';
import { NewsPage } from './pages/NewsPage';
import { SchedulePage } from './pages/SchedulePage';
import { GameDetailsPage } from './pages/GameDetailsPage';
import { SettingsPage } from './pages/SettingsPage';
import { StatsPage } from './pages/StatsPage';

function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      <Navbar 
        toggleSidebar={() => setSidebarOpen(true)} 
        toggleSearch={() => setSearchOpen(true)} 
      />
      
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        onOpenSearch={() => {
          setSidebarOpen(false);
          setSearchOpen(true);
        }}
      />
      
      <SearchModal 
        isOpen={searchOpen} 
        onClose={() => setSearchOpen(false)} 
      />

      {children}
    </div>
  );
}

import { FavoritesProvider } from './context/FavoritesContext';
import { NotificationManager } from './components/NotificationManager';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './components/AuthScreen';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<ScoresPage />} />
          <Route path="/scores" element={<ScoresPage />} />
          <Route path="/standings" element={<StandingsPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/game/:sport/:league/:id" element={<GameDetailsPage />} />
        </Routes>
        <NotificationManager />
        <Toaster theme="dark" position="bottom-right" />
      </Layout>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SportsProvider>
        <FavoritesProvider>
          <AppContent />
        </FavoritesProvider>
      </SportsProvider>
    </AuthProvider>
  );
}
