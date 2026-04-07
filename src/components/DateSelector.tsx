"use client";

import React from 'react';
import { Calendar } from 'lucide-react';

interface DateSelectorProps {
  date: string;
  setDate: (date: string) => void;
}

export function DateSelector({ date, setDate }: DateSelectorProps) {
  return (
    <div className="glass-panel px-3 py-1.5 flex items-center gap-2 rounded-full border border-white/10 hidden md:flex">
      <Calendar className="w-4 h-4 text-slate-400" />
      <input 
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="bg-transparent text-sm text-slate-200 outline-none cursor-pointer [color-scheme:dark]"
      />
    </div>
  );
}
