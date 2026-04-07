"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { KeyMetrics } from '@/components/KeyMetrics';
import { ActivityCharts } from '@/components/ActivityCharts';
import { TimeFilter } from '@/components/TimeFilter';
import { DateSelector } from '@/components/DateSelector';
import { AiInsights } from '@/components/AiInsights';
import { BotSelector } from '@/components/BotSelector';
import { useLanguage } from '@/components/LanguageProvider';
import { DownloadCloud, Globe } from 'lucide-react';
import { useMetrics } from '@/hooks/useMetrics';
import { useAiInsights } from '@/hooks/useAiInsights';
import { useBots } from '@/hooks/useBots';
import type { RecentActivity } from '@/lib/types';
import type { Language } from '@/lib/i18n';

export default function Dashboard() {
  const [selectedBotId, setSelectedBotId] = React.useState("all");
  const { t, language, setLanguage } = useLanguage();
  const { bots } = useBots();
  const { data, loading, error, period, setPeriod, dateSelected, setDateSelected } = useMetrics(selectedBotId);
  const { insights, loading: aiLoading, error: aiError } = useAiInsights(period, dateSelected, selectedBotId);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
         <div className="glass-panel p-8 max-w-md w-full border border-red-500/30 rounded-3xl">
           <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-500 text-2xl">⚠️</span>
           </div>
           <h2 className="text-xl text-red-400 font-semibold mb-2">Connection Error</h2>
           <p className="text-slate-300 text-sm mb-4">{error}</p>
           <p className="text-slate-400 text-xs p-3 bg-red-950/20 rounded-lg border border-red-500/20">
              Please make sure your Python backend API is running at <code className="text-red-300">http://127.0.0.1:8000</code>.
           </p>
         </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">{t.dashboard}</h1>
          <p className="text-slate-400 flex items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
            {t.integrationReady}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <BotSelector bots={bots} value={selectedBotId} setValue={setSelectedBotId} />

          <TimeFilter period={period} setPeriod={setPeriod} />

          <DateSelector date={dateSelected} setDate={setDateSelected} />

          <div className="glass-panel px-3 py-1.5 flex items-center gap-2 rounded-full border border-white/10">
            <Globe className="w-4 h-4 text-slate-400" />
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="bg-transparent text-sm text-slate-200 outline-none cursor-pointer"
              >
              <option value="en" className="bg-slate-900">{t.language_en}</option>
              <option value="ro" className="bg-slate-900">{t.language_ro}</option>
            </select>
          </div>
          
          <button 
            onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
              const downloadAnchorNode = document.createElement('a');
              downloadAnchorNode.setAttribute("href", dataStr);
              downloadAnchorNode.setAttribute("download", "dashboard_metrics.json");
              document.body.appendChild(downloadAnchorNode);
              downloadAnchorNode.click();
              downloadAnchorNode.remove();
            }}
            className="glass-panel px-4 py-2 flex items-center gap-2 text-sm font-medium hover:bg-white/5 transition-colors group"
          >
            <DownloadCloud className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300" />
            <span>{t.exportData}</span>
          </button>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="space-y-6">
        <section>
          <KeyMetrics data={data} />
        </section>
        
        <section>
          <ActivityCharts chartData={data.chartData} />
        </section>

        <AiInsights insights={insights} loading={aiLoading} error={aiError} />

        {/* Recent Activity Table using Glassmorphism */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel p-6 mt-6"
        >
          <h3 className="text-lg font-semibold mb-6 flex items-center">
            <div className="w-2 h-6 bg-pink-500 rounded-full mr-3"></div>
            {t.recentActivity}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="pb-3 text-sm font-medium text-slate-400">{t.sender}</th>
                  <th className="pb-3 text-sm font-medium text-slate-400">{t.eventType}</th>
                  <th className="pb-3 text-sm font-medium text-slate-400">{t.channel}</th>
                  <th className="pb-3 text-sm font-medium text-slate-400">{t.botId}</th>
                  <th className="pb-3 text-sm font-medium text-slate-400">Time</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {data.recentActivity.map((activity: RecentActivity) => (
                  <tr key={activity.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="py-4 text-slate-200">
                      <div className="font-medium">{activity.senderName}</div>
                      <div className="text-xs text-slate-500">{activity.senderId}</div>
                    </td>
                    <td className="py-4 text-slate-300">
                      {activity.type === 'new_phonenumber' ? t.newPhoneNumber : t.newUser}
                    </td>
                    <td className="py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        activity.channel.toLowerCase() === 'facebook' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        activity.channel.toLowerCase() === 'instagram' ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {activity.channel}
                      </span>
                    </td>
                    <td className="py-4 text-slate-400">{activity.botId}</td>
                    <td className="py-4 text-slate-400">{activity.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
