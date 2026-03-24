import React, { useEffect, useState } from 'react';
import { Loader2, TrendingUp } from 'lucide-react';
import { cn } from '../lib/utils';

interface KalshiProbabilityProps {
  homeTeam: string;
  awayTeam: string;
  date?: string;
}

export const KalshiProbability: React.FC<KalshiProbabilityProps> = ({ homeTeam, awayTeam, date }) => {
  const [loading, setLoading] = useState(true);
  const [probability, setProbability] = useState<{ home: number; away: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchKalshiData = async () => {
      try {
        setLoading(true);
        // In a real app, this would call your backend which securely holds the Kalshi API key
        // and makes the request to https://trading-api.kalshi.com/trade-api/v2/markets
        // Since we don't have an API key, we'll simulate the response based on team names for the preview
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock probability based on team names to be deterministic but varied
        const hash = (homeTeam + awayTeam).split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0);
        
        const homeProb = 30 + (Math.abs(hash) % 40); // 30% to 70%
        
        setProbability({
          home: homeProb,
          away: 100 - homeProb
        });
      } catch (err) {
        setError('Failed to fetch Kalshi markets');
      } finally {
        setLoading(false);
      }
    };

    fetchKalshiData();
  }, [homeTeam, awayTeam]);

  if (loading) {
    return (
      <div className="mt-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-100 dark:border-slate-600 flex items-center justify-center">
        <Loader2 className="w-4 h-4 animate-spin text-emerald-500 mr-2" />
        <span className="text-xs text-slate-500">Loading Kalshi markets...</span>
      </div>
    );
  }

  if (error || !probability) {
    return null;
  }

  return (
    <div className="mt-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 border border-slate-100 dark:border-slate-600">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-emerald-500" />
          Kalshi Win Probability
        </div>
      </div>
      
      <div className="flex items-center justify-between text-sm font-bold">
        <span className="text-slate-900 dark:text-white">{probability.away}%</span>
        <div className="flex-1 h-2 mx-3 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden flex">
          <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${probability.away}%` }} />
          <div className="h-full bg-red-500 transition-all duration-1000" style={{ width: `${probability.home}%` }} />
        </div>
        <span className="text-slate-900 dark:text-white">{probability.home}%</span>
      </div>
      <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-medium">
        <span>{awayTeam}</span>
        <span>{homeTeam}</span>
      </div>
    </div>
  );
};
