import React from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import type { DailyData } from '@/lib/types';

interface Props {
  chartData: DailyData[];
}

export function ActivityCharts({ chartData }: Props) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-[400px]" />;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-[400px]">
      <h3 className="text-lg font-semibold text-slate-800 mb-6">Evoluția leadurilor și conversiei</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              yAxisId="left" 
              orientation="left" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
              label={{ value: 'Număr leaduri', angle: -90, position: 'insideLeft', fill: '#3b82f6', fontSize: 12, dy: -60, dx: 10 }}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickFormatter={(value) => `${value}%`}
              label={{ value: 'Conversie (%)', angle: 90, position: 'insideRight', fill: '#f97316', fontSize: 12, dy: -60, dx: -10 }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              itemStyle={{ fontSize: '13px' }}
              labelStyle={{ color: '#0f172a', fontWeight: 'bold', marginBottom: '8px' }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', color: '#475569', paddingTop: '20px' }}
            />
            <Bar yAxisId="left" dataKey="totalLeads" name="Nr. total leaduri" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={30} />
            <Bar yAxisId="left" dataKey="leadsWith2PlusMessages" name="Lead cu ≥ 2 mesaje" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} />
            <Bar yAxisId="left" dataKey="leadsWithPhone" name="Lead cu număr de telefon" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={30} />
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="conversionRate" 
              name="% conversie" 
              stroke="#f97316" 
              strokeWidth={2}
              dot={{ r: 4, fill: '#f97316', strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
