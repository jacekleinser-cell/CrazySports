import React from 'react';
import { cn } from '../lib/utils';

interface BaseballFieldProps {
  situation: {
    onFirst?: boolean;
    onSecond?: boolean;
    onThird?: boolean;
    outs?: number;
    balls?: number;
    strikes?: number;
    batter?: {
      athlete: {
        displayName: string;
        headshot?: { href: string };
      };
    };
    pitcher?: {
      athlete: {
        displayName: string;
        headshot?: { href: string };
      };
    };
  };
}

export const BaseballField = ({ situation }: BaseballFieldProps) => {
  return (
    <div className="relative w-full aspect-square max-w-[400px] mx-auto bg-emerald-600 rounded-lg overflow-hidden border-4 border-emerald-800 shadow-inner">
      {/* Infield Dirt */}
      <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-[#d2b48c] rotate-45 rounded-sm" />
      
      {/* Grass Infield */}
      <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[55%] h-[55%] bg-emerald-600 rotate-45 rounded-sm" />

      {/* Bases */}
      {/* 2nd Base */}
      <div className={cn(
        "absolute top-[22%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-8 h-8 rotate-45 border-2 border-white transition-colors duration-300 z-10 shadow-md",
        situation.onSecond ? "bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,1)] scale-110" : "bg-white"
      )} />
      
      {/* 3rd Base */}
      <div className={cn(
        "absolute top-[50%] left-[22%] -translate-x-1/2 -translate-y-1/2 w-8 h-8 rotate-45 border-2 border-white transition-colors duration-300 z-10 shadow-md",
        situation.onThird ? "bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,1)] scale-110" : "bg-white"
      )} />
      
      {/* 1st Base */}
      <div className={cn(
        "absolute top-[50%] right-[22%] translate-x-1/2 -translate-y-1/2 w-8 h-8 rotate-45 border-2 border-white transition-colors duration-300 z-10 shadow-md",
        situation.onFirst ? "bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,1)] scale-110" : "bg-white"
      )} />

      {/* Home Plate */}
      <div className={cn(
        "absolute bottom-[22%] left-[50%] -translate-x-1/2 translate-y-1/2 w-8 h-8 bg-white rotate-45 z-10 shadow-md transition-all duration-300",
        situation.batter && "bg-yellow-300 ring-4 ring-yellow-400 ring-opacity-80 shadow-[0_0_25px_rgba(250,204,21,0.9)] scale-125 animate-pulse"
      )} />

      {/* Pitcher's Mound */}
      <div className={cn(
        "absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-[#d2b48c] rounded-full border-2 border-white/20 z-10 transition-all duration-300",
        situation.pitcher && "ring-2 ring-yellow-400/50 shadow-[0_0_10px_rgba(250,204,21,0.5)]"
      )} />
    </div>
  );
};
