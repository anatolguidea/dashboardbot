"use client";

import React, { useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import { useLanguage } from './LanguageProvider';
import type { ChartPoint } from '@/lib/types';

interface ChartProps {
  chartData: ChartPoint[];
}

const PREDEFINED_COLORS = [
  "#3b82f6", // Blue
  "#ec4899", // Pink
  "#10b981", // Emerald
  "#8b5cf6", // Violet
  "#f59e0b", // Amber
  "#06b6d4", // Cyan
  "#ef4444", // Red
  "#84cc16", // Lime
];

export function ActivityCharts({ chartData }: ChartProps) {
  const { t } = useLanguage();

  // Extract all unique platform keys present in the current dataset dynamically
  const platformKeys = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];
    
    const keys = new Set<string>();
    chartData.forEach(dataPoint => {
      if (dataPoint.platforms) {
        Object.keys(dataPoint.platforms).forEach(k => keys.add(k));
      }
    });
    return Array.from(keys);
  }, [chartData]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      
      {/* Area Chart for Messages & Users */}
      <div className="glass-panel p-6">
        <h3 className="text-lg font-semibold mb-6 flex items-center">
          <div className="w-2 h-6 bg-indigo-500 rounded-full mr-3"></div>
          {t.activityChart}
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#64748b" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(15, 17, 21, 0.9)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  backdropFilter: 'blur(8px)'
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }}/>
              <Area 
                type="monotone" 
                dataKey="messages" 
                name={t.messages}
                stroke="#6366f1" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorMessages)" 
              />
              <Area 
                type="monotone" 
                dataKey="users" 
                name={t.users}
                stroke="#8b5cf6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorUsers)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart for Platforms Split */}
      <div className="glass-panel p-6">
        <h3 className="text-lg font-semibold mb-6 flex items-center">
          <div className="w-2 h-6 bg-emerald-500 rounded-full mr-3"></div>
          {t.platforms}
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#64748b" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(15, 17, 21, 0.9)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px'
                }}
                cursor={{fill: 'rgba(255,255,255,0.05)'}}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }}/>
              {platformKeys.map((platform, indx) => {
                const color = PREDEFINED_COLORS[indx % PREDEFINED_COLORS.length];
                const isLast = indx === platformKeys.length - 1;
                return (
                  <Bar 
                    key={platform} 
                    dataKey={`platforms.${platform}`} 
                    name={platform.charAt(0).toUpperCase() + platform.slice(1)} 
                    stackId="a" 
                    fill={color} 
                    radius={isLast ? [4, 4, 0, 0] : [0, 0, 0, 0]} 
                  />
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
