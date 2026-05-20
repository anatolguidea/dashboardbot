import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { CheckCircle2, AlertTriangle, Star } from 'lucide-react';
import type { DailyData } from '@/lib/types';

interface SourceData {
  name: string;
  percentage: number;
  totalLeads: number;
  color: string;
}

interface Props {
  sources: SourceData[];
  chartData: DailyData[];
}

export function AiInsights({ sources, chartData }: Props) {
  const [mounted, setMounted] = React.useState(false);
  const hasSourceLeads = sources.some((source) => source.totalLeads > 0);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const insights = useMemo(() => {
    if (!chartData || chartData.length === 0) return null;

    const rowsWithLeads = chartData.filter((row) => row.totalLeads > 0);
    const rowsWithConversionBase = chartData.filter((row) => row.leadsWith2PlusMessages > 0);

    if (rowsWithLeads.length === 0 || rowsWithConversionBase.length === 0) return null;

    const highestConvDay = [...rowsWithConversionBase].sort((a, b) => b.conversionRate - a.conversionRate)[0];
    const highestVolDay = [...rowsWithLeads].sort((a, b) => b.totalLeads - a.totalLeads)[0];
    const bestConvDay = [...rowsWithConversionBase].filter(d => d.date !== highestConvDay.date).sort((a, b) => b.conversionRate - a.conversionRate)[0] || null;

    return {
      highestConv: {
        date: highestConvDay.date,
        rate: highestConvDay.conversionRate.toFixed(1)
      },
      highestVol: {
        date: highestVolDay.date,
        isLowConv: highestVolDay.conversionRate < 50
      },
      bestConv: bestConvDay
        ? {
            date: bestConvDay.date,
            rate: bestConvDay.conversionRate.toFixed(1)
          }
        : null
    };
  }, [chartData]);

  return (
    <div className="space-y-6">
      {/* Distribuție pe surse */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Distribuție pe surse</h3>
        <div className="flex flex-col sm:flex-row items-center">
          <div className="w-40 h-40 relative">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                <Pie
                  data={sources}
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="percentage"
                  stroke="none"
                >
                  {sources.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number | string | undefined | readonly (string | number)[]) => `${value}%`}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            )}
            {/* Center Text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-xl font-bold text-slate-800">
                {hasSourceLeads ? '100%' : '0%'}
              </span>
            </div>
          </div>
          
          <div className="mt-4 sm:mt-0 sm:ml-8 flex flex-col gap-3">
            {sources.map((source, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm w-32">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color }}></div>
                  <span className="text-slate-600">{source.name}</span>
                </div>
                <span className="font-medium text-slate-800">{source.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Observații */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Observații</h3>
        {insights ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
              <p className="text-sm text-slate-600 mt-0.5">
                <span className="font-medium text-slate-800">{insights.highestConv.date}</span> are o conversie ridicată: {insights.highestConv.rate}%
              </p>
            </div>
            
            <div className="flex items-start gap-3">
              <AlertTriangle className={`w-6 h-6 shrink-0 ${insights.highestVol.isLowConv ? 'text-amber-500' : 'text-blue-500'}`} />
              <p className="text-sm text-slate-600 mt-0.5">
                <span className="font-medium text-slate-800">{insights.highestVol.date}</span> are volum maxim, {insights.highestVol.isLowConv ? 'dar conversie mai slabă' : 'cu o conversie solidă'}
              </p>
            </div>
            {insights.bestConv && (
              <div className="flex items-start gap-3">
                <Star className="w-6 h-6 text-emerald-500 fill-emerald-500 shrink-0" />
                <p className="text-sm text-slate-600 mt-0.5">
                  <span className="font-medium text-slate-800">{insights.bestConv.date}</span> menține de asemenea o conversie excelentă: {insights.bestConv.rate}%
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Nu există suficiente date pentru a genera observații.</p>
        )}
      </div>
    </div>
  );
}
