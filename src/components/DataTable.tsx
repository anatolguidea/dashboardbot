import React from 'react';
import type { DailyData } from '@/lib/types';

interface Props {
  data: DailyData[];
}

export function DataTable({ data }: Props) {
  const formatPercentage = (num: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num) + '%';
  };

  const isWeekend = (dateStr: string) => {
    const parts = dateStr.split(/[./-]/);
    if (parts.length !== 3) return false;

    let d: Date;
    if (parts[0].length === 4) {
      d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    } else {
      d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    
    const dayOfWeek = d.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
        <h3 className="text-lg font-semibold text-slate-800">Date detaliate</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-700 font-medium">
            <tr>
              <th className="px-6 py-4">Data</th>
              <th className="px-6 py-4">Canal</th>
              <th className="px-6 py-4 text-center">Nr. total leaduri</th>
              <th className="px-6 py-4 text-center">Lead cu ≥ 2 mesaje</th>
              <th className="px-6 py-4 text-center">Lead-uri rămase</th>
              <th className="px-6 py-4 text-center">Lead cu număr de telefon</th>
              <th className="px-6 py-4 text-center">% conversie</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, idx) => {
              const weekendClass = isWeekend(row.date) 
                ? 'bg-orange-50 hover:bg-orange-100 text-orange-900' 
                : 'hover:bg-slate-50';

              return (
                <tr key={idx} className={`transition-colors ${weekendClass}`}>
                  <td className="px-6 py-4 font-medium">{row.date}</td>
                  <td className="px-6 py-4">{row.source}</td>
                  <td className="px-6 py-4 text-center">{row.totalLeads}</td>
                  <td className="px-6 py-4 text-center">{row.leadsWith2PlusMessages}</td>
                  <td className="px-6 py-4 text-center">{row.leadsWith1Message}</td>
                  <td className="px-6 py-4 text-center">{row.leadsWithPhone}</td>
                  <td className="px-6 py-4 text-center">{formatPercentage(row.conversionRate)}</td>
                </tr>
              );
            })}
            {data.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-2xl">📊</span>
                    <p>Nu există date pentru perioada selectată</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
