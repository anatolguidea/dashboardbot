"use server"

import prisma from '@/lib/prisma';
import type { DailyData, MetricsData } from './types';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

interface RawSourceRow {
  source: string;
}

interface RawMetricRow {
  date: string | Date;
  source: string;
  totalLeads: number;
  leadsWith2PlusMessages: number;
  leadsWith1Message: number;
  leadsWithPhone: number;
  conversionRate: number;
  errorsDetected: number;
}

function parseFlexibleDate(dateStr: string): Date {
  const parts = dateStr.split(/[./-]/);
  if (parts.length !== 3) return new Date(NaN);

  let day, month, year;
  if (parts[0].length === 4) {
    year = parseInt(parts[0]);
    month = parseInt(parts[1]) - 1;
    day = parseInt(parts[2]);
  } else {
    day = parseInt(parts[0]);
    month = parseInt(parts[1]) - 1;
    year = parseInt(parts[2]);
    if (month >= 12 && day <= 12) {
      [day, month] = [month + 1, day - 1];
    }
  }
  return new Date(year, month, day);
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function formatDDMMYYYY(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}.${m}.${y}`;
}

const MONTHS = ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'];

const defaultEmptyData: MetricsData = {
  totalLeads: 0,
  leadsWith2PlusMessages: 0,
  leadsWithPhone: 0,
  conversionRate: 0,
  trends: { totalLeads: 0, leadsWith2PlusMessages: 0, leadsWithPhone: 0, conversionRate: 0 },
  chartData: [],
  sources: []
};

export async function fetchMetricsData(
  channel: string = 'Toate',
  startDate?: string, // YYYY-MM-DD
  endDate?: string,   // YYYY-MM-DD
  grouping: 'Zi' | 'Săptămână' | 'Lună' = 'Zi'
): Promise<MetricsData> {
  
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return defaultEmptyData;
  }

  const userId = (session.user as { id: string }).id;

  let userData;
  try {
    // Using raw query to bypass stale Prisma Client type cache in IDE
    const userResult = await prisma.$queryRawUnsafe<{ db_name: string | null }[]>(
      `SELECT db_name FROM User WHERE id = ?`, 
      userId
    );
    userData = userResult[0] || null;
  } catch (err) {
    console.error('Error fetching user data:', err);
    return defaultEmptyData;
  }

  if (!userData || !userData.db_name) {
    console.warn("User has no database assigned.");
    return defaultEmptyData;
  }

  const db_name = userData.db_name;
  
  // SECURITY: Strict validation to prevent SQL Injection
  // Only alphanumeric and underscores allowed, must start with a letter.
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(db_name)) {
    console.error("Invalid database name format detected:", db_name);
    return defaultEmptyData;
  }
  
  try {
    // 1. Fetch ALL sources available in this client's database to generate tabs automatically
    const sourcesRaw = await prisma.$queryRawUnsafe<RawSourceRow[]>(`
      SELECT DISTINCT source FROM ${db_name}.daily_stats WHERE source IS NOT NULL
    `);
    
    const availableSources = sourcesRaw.map(s => s.source as string);
    const defaultColors = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#f97316', '#06b6d4'];
    
    // 2. Fetch the actual metric data
    const rawData = await prisma.$queryRawUnsafe<RawMetricRow[]>(`
      SELECT 
        stat_date as date,
        source,
        total as totalLeads,
        msg2 as leadsWith2PlusMessages,
        ramase as leadsWith1Message,
        phone as leadsWithPhone,
        conv as conversionRate,
        errors as errorsDetected
      FROM ${db_name}.daily_stats
    `);

    let allDailyData: DailyData[] = [];
    for (const row of rawData) {
      const d = new Date(row.date);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      allDailyData.push({
        date: dateStr,
        source: row.source || 'Unknown',
        totalLeads: Number(row.totalLeads) || 0,
        leadsWith2PlusMessages: Number(row.leadsWith2PlusMessages) || 0,
        leadsWith1Message: Number(row.leadsWith1Message) || 0,
        leadsWithPhone: Number(row.leadsWithPhone) || 0,
        conversionRate: Number(row.conversionRate) || 0,
        errorsDetected: Number(row.errorsDetected) || 0,
      });
    }

    // 3. Filter by date range
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date(8640000000000000);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      allDailyData = allDailyData.filter(d => {
        const rowDate = parseFlexibleDate(d.date);
        return rowDate >= start && rowDate <= end;
      });
    }

    // 4. Filter by channel selection (Tab)
    let filteredData = [...allDailyData];
    if (channel !== 'Toate') {
      filteredData = allDailyData.filter(d => d.source.toLowerCase() === channel.toLowerCase());
    }

    // 5. Group and Merge data
    let displayData = [...filteredData];
    
    // If 'Toate' is selected or grouping is active, we merge records by date
    if (displayData.length > 0) {
       const mergedByDate = new Map<string, DailyData>();
       for (const d of displayData) {
         let groupKey = d.date;
         let displayDate = d.date;

         if (grouping !== 'Zi') {
            const rowDate = parseFlexibleDate(d.date);
            if (grouping === 'Săptămână') {
              const weekStart = getStartOfWeek(rowDate);
              const weekEnd = new Date(weekStart);
              weekEnd.setDate(weekStart.getDate() + 6);
              groupKey = weekStart.toISOString();
              displayDate = `${formatDDMMYYYY(weekStart)} - ${formatDDMMYYYY(weekEnd)}`;
            } else if (grouping === 'Lună') {
              groupKey = `${rowDate.getFullYear()}-${rowDate.getMonth()}`;
              displayDate = `${MONTHS[rowDate.getMonth()]} ${rowDate.getFullYear()}`;
            }
         }

         if (!mergedByDate.has(groupKey)) {
           mergedByDate.set(groupKey, { 
             ...d, 
             date: displayDate,
             source: channel === 'Toate' ? 'Toate' : d.source 
           });
         } else {
           const existing = mergedByDate.get(groupKey)!;
           existing.totalLeads += d.totalLeads;
           existing.leadsWith2PlusMessages += d.leadsWith2PlusMessages;
           existing.leadsWith1Message += d.leadsWith1Message;
           existing.leadsWithPhone += d.leadsWithPhone;
           existing.errorsDetected += d.errorsDetected;
           existing.conversionRate = existing.leadsWith2PlusMessages > 0 ? (existing.leadsWithPhone / existing.leadsWith2PlusMessages) * 100 : 0;
         }
       }
       displayData = Array.from(mergedByDate.values());
       if (grouping === 'Zi') {
          displayData.sort((a, b) => parseFlexibleDate(a.date).getTime() - parseFlexibleDate(b.date).getTime());
       }
    }

    const totalLeads = displayData.reduce((acc, curr) => acc + curr.totalLeads, 0);
    const leadsWith2PlusMessages = displayData.reduce((acc, curr) => acc + curr.leadsWith2PlusMessages, 0);
    const leadsWithPhone = displayData.reduce((acc, curr) => acc + curr.leadsWithPhone, 0);
    const conversionRate = leadsWith2PlusMessages > 0 ? (leadsWithPhone / leadsWith2PlusMessages) * 100 : 0;

    let trends = {
      totalLeads: 0,
      leadsWith2PlusMessages: 0,
      leadsWithPhone: 0,
      conversionRate: 0
    };

    if (displayData.length >= 2) {
      const lastDay = displayData[displayData.length - 1];
      const prevDay = displayData[displayData.length - 2];
      const calcTrend = (oldVal: number, newVal: number) => oldVal > 0 ? ((newVal - oldVal) / oldVal) * 100 : 0;
      trends = {
        totalLeads: calcTrend(prevDay.totalLeads, lastDay.totalLeads),
        leadsWith2PlusMessages: calcTrend(prevDay.leadsWith2PlusMessages, lastDay.leadsWith2PlusMessages),
        leadsWithPhone: calcTrend(prevDay.leadsWithPhone, lastDay.leadsWithPhone),
        conversionRate: lastDay.conversionRate - prevDay.conversionRate
      };
    }

    // Generate source percentages for the pie chart / legend
    const sources = availableSources.map((sourceName, index) => {
      const sourceLeads = allDailyData
        .filter(d => d.source.toLowerCase() === sourceName.toLowerCase())
        .reduce((sum, d) => sum + d.totalLeads, 0);
        
      return {
        name: sourceName,
        percentage: totalLeads > 0 ? Math.round((sourceLeads / allDailyData.reduce((s, d) => s + d.totalLeads, 0)) * 100) : 0,
        color: defaultColors[index % defaultColors.length]
      };
    });

    return {
      totalLeads,
      leadsWith2PlusMessages,
      leadsWithPhone,
      conversionRate,
      trends,
      chartData: displayData,
      sources
    };
  } catch (error) {
    console.error('Failed to query metrics data:', error);
    throw error;
  }
}
