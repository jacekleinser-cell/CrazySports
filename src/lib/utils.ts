import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Rank = 'Rookie' | 'Pro' | 'Star' | 'All-Star' | 'All-Pro';

export function getRank(score: number): { name: Rank; nextThreshold: number | null; progress: number; minScore: number } {
  if (score < 100) return { name: 'Rookie', nextThreshold: 100, progress: (score / 100) * 100, minScore: 0 };
  if (score < 300) return { name: 'Pro', nextThreshold: 300, progress: ((score - 100) / 200) * 100, minScore: 100 };
  if (score < 600) return { name: 'Star', nextThreshold: 600, progress: ((score - 300) / 300) * 100, minScore: 300 };
  if (score < 1000) return { name: 'All-Star', nextThreshold: 1000, progress: ((score - 600) / 400) * 100, minScore: 600 };
  return { name: 'All-Pro', nextThreshold: null, progress: 100, minScore: 1000 };
}
