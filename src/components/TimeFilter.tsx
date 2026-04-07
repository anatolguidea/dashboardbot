"use client";

import React from 'react';
import { useLanguage } from './LanguageProvider';

export type TimePeriod = 'month' | 'week' | 'day';

interface TimeFilterProps {
  period: TimePeriod;
  setPeriod: (period: TimePeriod) => void;
}

export function TimeFilter({ period, setPeriod }: TimeFilterProps) {
  const { t } = useLanguage();

  const periods: TimePeriod[] = ['month', 'week', 'day'];

  return (
    <div className="glass-panel p-1 flex items-center gap-1 rounded-full border border-white/10 shadow-inner bg-black/20">
      {periods.map((p) => (
        <button 
          key={p}
          onClick={() => setPeriod(p)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
            period === p 
            ? 'bg-indigo-500/20 text-indigo-300 shadow-md ring-1 ring-indigo-500/30' 
            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          {t[p] || p.charAt(0).toUpperCase() + p.slice(1)}
        </button>
      ))}
    </div>
  );
}
