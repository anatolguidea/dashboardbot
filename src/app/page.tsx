"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { KeyMetrics } from '@/components/KeyMetrics';
import { ActivityCharts } from '@/components/ActivityCharts';
import { DataTable } from '@/components/DataTable';
import { AiInsights } from '@/components/AiInsights';
import { useMetrics } from '@/hooks/useMetrics';
import { Download, RefreshCw, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { signOut } from 'next-auth/react';

const MONTHS_RO = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
];

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [source, setSource] = useState('Toate');
  const [grouping, setGrouping] = useState<'Zi' | 'Săptămână' | 'Lună'>('Zi');
  
  // Month navigation state
  const [viewDate, setViewDate] = useState(new Date());
  const [isCustomRange, setIsCustomRange] = useState(false);
  // Initialize dates based on current viewDate
  const getInitialDates = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const format = (d: Date) => {
      const Y = d.getFullYear();
      const M = String(d.getMonth() + 1).padStart(2, '0');
      const D = String(d.getDate()).padStart(2, '0');
      return `${Y}-${M}-${D}`;
    };
    
    return { start: format(firstDay), end: format(lastDay) };
  };

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const currentViewDates = getInitialDates(viewDate);
  const effectiveStartDate = isCustomRange ? startDate : currentViewDates.start;
  const effectiveEndDate = isCustomRange ? endDate : currentViewDates.end;

  const { data, loading, error } = useMetrics(source, effectiveStartDate, effectiveEndDate, grouping);

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    setEndDate(prev => prev || effectiveEndDate);
    setIsCustomRange(true);
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    setStartDate(prev => prev || effectiveStartDate);
    setIsCustomRange(true);
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const handlePrevMonth = () => {
    setIsCustomRange(false);
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setIsCustomRange(false);
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleExport = () => {
    if (!data) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `dashboard_metrics_${source.toLowerCase()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleResetFilters = () => {
    setSource('Toate');
    setGrouping('Zi');
    setIsCustomRange(false);
    setViewDate(new Date());
  };

  if (error) {
    return (
      <div className="h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
         <div className="glass-panel p-8 max-w-md w-full border border-red-200 rounded-2xl">
           <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-500 text-2xl">⚠️</span>
           </div>
           <h2 className="text-xl text-red-600 font-semibold mb-2">Connection Error</h2>
           <p className="text-slate-600 text-sm mb-4">{error}</p>
         </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] overflow-hidden">
      {/* Sidebar */}
      <aside className={`bg-white border-r border-slate-200 flex flex-col flex-shrink-0 transition-all duration-300 z-20 absolute md:relative h-full ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full md:w-0 md:-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between border-b border-slate-100 whitespace-nowrap">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
            </div>
            <span className="font-bold text-xl text-blue-600 tracking-tight">LeadTrack</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <a href="#" className="flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-600 rounded-xl font-medium whitespace-nowrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Dashboard
          </a>
          
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-medium whitespace-nowrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            Baza de cunoștințe
          </a>
        </nav>
        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl font-medium transition-colors whitespace-nowrap"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Deconectare
          </button>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 z-10 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <main className="flex-1 p-6 lg:p-10 mx-auto w-full max-w-[1400px] h-full overflow-y-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <div>
              <h1 className="text-3xl font-semibold text-slate-800 mb-1">Dashboard leaduri</h1>
              <p className="text-slate-500 text-sm">Statistici și conversie pe canal</p>
            </div>
          </div>
          
          <div className="flex items-center text-slate-500 text-sm">
            <span>Actualizat la: {new Date().toLocaleDateString('ro-RO')}</span>
            <button className="ml-2 p-1 hover:bg-slate-200 rounded-full transition-colors" onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          {/* Month Navigator */}
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-slate-700 min-w-[120px]">
              {MONTHS_RO[viewDate.getMonth()]} {viewDate.getFullYear()}
            </div>
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
              <button 
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 transition-colors"
                aria-label="Luna anterioară"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 transition-colors"
                aria-label="Luna următoare"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400">
            <input 
              type="date" 
              value={effectiveStartDate} 
              onChange={e => handleStartDateChange(e.target.value)}
              className="text-sm text-slate-700 outline-none bg-transparent"
              title="Data de început"
            />
            <span className="mx-2 text-slate-400">-</span>
            <input 
              type="date" 
              value={effectiveEndDate} 
              onChange={e => handleEndDateChange(e.target.value)}
              className="text-sm text-slate-700 outline-none bg-transparent"
              title="Data de sfârșit"
            />
          </div>

          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            {['Toate', ...(data?.sources?.map((s: { name: string }) => s.name) || ['Facebook', 'Instagram', 'Site'])].map(tab => (
              <button 
                key={tab}
                onClick={() => setSource(tab)}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  source === tab ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-300 overflow-hidden pr-3">
            <select 
              value={grouping}
              onChange={(e) => setGrouping(e.target.value as 'Zi' | 'Săptămână' | 'Lună')}
              className="pl-4 pr-2 py-2 text-sm font-medium text-slate-700 outline-none bg-transparent appearance-none cursor-pointer"
            >
              <option value="Zi">Grupare: Zi</option>
              <option value="Săptămână">Grupare: Săptămână</option>
              <option value="Lună">Grupare: Lună</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          <div className="flex-1"></div>

          <button 
            onClick={handleResetFilters}
            className="flex items-center text-sm font-medium text-slate-600 hover:text-slate-800 px-4 py-2"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset filtre
          </button>

          <button 
            onClick={handleExport}
            className="flex items-center bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <section>
            <KeyMetrics data={data} />
          </section>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ActivityCharts chartData={data.chartData} />
            </div>
            <div className="lg:col-span-1 space-y-6">
               <AiInsights sources={data.sources} chartData={data.chartData} />
            </div>
          </div>

          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <DataTable data={data.chartData} />
          </motion.section>
        </div>
      </main>
    </div>
  );
}
