import React from 'react';
import { motion } from 'framer-motion';
import { Users, MessageSquare, Phone, Percent } from 'lucide-react';
import type { MetricsData } from '@/lib/types';

interface Props {
  data: MetricsData;
}

export function KeyMetrics({ data }: Props) {
  const formatNumber = (num: number) => new Intl.NumberFormat('ro-RO').format(num);

  const formatPercentage = (num: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num) + '%';
  };

  const metrics = [
    {
      title: "Nr. total leaduri",
      value: formatNumber(data.totalLeads),
      trend: `+${data.trends.totalLeads}%`,
      isPositive: data.trends.totalLeads >= 0,
      icon: Users,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600"
    },
    {
      title: "Lead cu ≥ 2 mesaje",
      value: formatNumber(data.leadsWith2PlusMessages),
      trend: `+${data.trends.leadsWith2PlusMessages}%`,
      isPositive: data.trends.leadsWith2PlusMessages >= 0,
      icon: MessageSquare,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-500"
    },
    {
      title: "Lead cu număr de telefon",
      value: formatNumber(data.leadsWithPhone),
      trend: `+${data.trends.leadsWithPhone}%`,
      isPositive: data.trends.leadsWithPhone >= 0,
      icon: Phone,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-500"
    },
    {
      title: "% conversie",
      value: formatPercentage(data.conversionRate),
      trend: `+${data.trends.conversionRate} pp`,
      isPositive: data.trends.conversionRate >= 0,
      icon: Percent,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-500"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, idx) => (
        <motion.div
          key={metric.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex flex-col">
               <span className="text-slate-500 text-sm font-medium mb-1">{metric.title}</span>
               <span className="text-3xl font-bold text-slate-800">{metric.value}</span>
            </div>
            <div className={`p-3 rounded-full ${metric.iconBg}`}>
              <metric.icon className={`w-6 h-6 ${metric.iconColor}`} />
            </div>
          </div>
          
          <div className="flex items-center text-xs mt-2">
            <span className={`font-semibold mr-1 ${metric.isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
              {metric.isPositive ? '↑' : '↓'} {metric.trend}
            </span>
            <span className="text-slate-400">față de perioada anterioară</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

