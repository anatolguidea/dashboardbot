"use client";

import type { Bot } from "@/lib/types";
import { useLanguage } from "./LanguageProvider";

interface BotSelectorProps {
  bots: Bot[];
  value: string;
  setValue: (botId: string) => void;
}

export function BotSelector({ bots, value, setValue }: BotSelectorProps) {
  const { t } = useLanguage();

  return (
    <div className="glass-panel px-3 py-1.5 flex items-center gap-2 rounded-full border border-white/10">
      <label className="text-sm text-slate-400">{t.bot}</label>
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="bg-transparent text-sm text-slate-200 outline-none cursor-pointer"
      >
        <option value="all" className="bg-slate-900">
          {t.allBots}
        </option>
        {bots.map((bot) => (
          <option key={bot.id} value={bot.id} className="bg-slate-900">
            {bot.name}
          </option>
        ))}
      </select>
    </div>
  );
}
