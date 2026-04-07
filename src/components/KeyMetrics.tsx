"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Users, Phone } from 'lucide-react';
import { useLanguage } from './LanguageProvider';

interface MetricsProps {
  data: {
    messagesThisMonth: number;
    totalUsers: number;
    phoneNumbersCaptured: number;
    growth: {
      messages: string;
      users: string;
      phones: string;
    };
  };
}

export function KeyMetrics({ data }: MetricsProps) {
  const { t } = useLanguage();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-3 gap-6"
    >
      <motion.div variants={item} className="glass-panel p-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-500"></div>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400 mb-1">{t.messagesThisMonth}</p>
            <h3 className="text-4xl font-bold tracking-tight text-white">
              {data.messagesThisMonth.toLocaleString()}
            </h3>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-emerald-400 font-medium">{data.growth.messages}</span>
              <span className="text-slate-500 ml-2">{t.growth}</span>
            </div>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <MessageSquare className="w-6 h-6 text-indigo-400" />
          </div>
        </div>
      </motion.div>

      <motion.div variants={item} className="glass-panel p-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-500"></div>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400 mb-1">{t.totalUsers}</p>
            <h3 className="text-4xl font-bold tracking-tight text-white">
              {data.totalUsers.toLocaleString()}
            </h3>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-emerald-400 font-medium">{data.growth.users}</span>
              <span className="text-slate-500 ml-2">{t.growth}</span>
            </div>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <Users className="w-6 h-6 text-violet-400" />
          </div>
        </div>
      </motion.div>

      <motion.div variants={item} className="glass-panel p-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-500"></div>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400 mb-1">{t.phonesCaptured}</p>
            <h3 className="text-4xl font-bold tracking-tight text-white">
              {data.phoneNumbersCaptured.toLocaleString()}
            </h3>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-emerald-400 font-medium">{data.growth.phones}</span>
              <span className="text-slate-500 ml-2">{t.growth}</span>
            </div>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <Phone className="w-6 h-6 text-emerald-400" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
