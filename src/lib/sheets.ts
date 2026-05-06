import type { DailyData, MetricsData } from './types';

function parseFlexibleDate(dateStr: string): Date {
  const parts = dateStr.split(/[./-]/);
  if (parts.length !== 3) return new Date(NaN);

  let day, month, year;
  if (parts[0].length === 4) {
    // YYYY-MM-DD
    year = parseInt(parts[0]);
    month = parseInt(parts[1]) - 1;
    day = parseInt(parts[2]);
  } else {
    // DD.MM.YYYY or MM.DD.YYYY (Assuming DD.MM.YYYY for RO)
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
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(d.setDate(diff));
}

function formatDDMMYYYY(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}.${m}.${y}`;
}

const MONTHS = ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'];

export async function fetchSheetData(
  channel: string = 'Toate',
  startDate?: string, // YYYY-MM-DD
  endDate?: string,   // YYYY-MM-DD
  grouping: 'Zi' | 'Săptămână' | 'Lună' = 'Zi'
): Promise<MetricsData> {
  
  const defaultEmptyData: MetricsData = {
      totalLeads: 0,
      leadsWith2PlusMessages: 0,
      leadsWithPhone: 0,
      conversionRate: 0,
      trends: { totalLeads: 0, leadsWith2PlusMessages: 0, leadsWithPhone: 0, conversionRate: 0 },
      chartData: [],
      sources: []
  };

  // Fetch channels for this user from our local API
  let channelsData: any[] = [];
  try {
    const res = await fetch('/api/user/channels');
    if (!res.ok) {
      if (res.status === 401) return defaultEmptyData;
      throw new Error('Failed to fetch channels');
    }
    channelsData = await res.json();
  } catch (err) {
    console.error('Error fetching channels:', err);
    return defaultEmptyData;
  }

  if (!channelsData || channelsData.length === 0) {
    return defaultEmptyData;
  }

  // Filter channels based on selection
  let activeChannels = channelsData;
  if (channel !== 'Toate') {
    activeChannels = channelsData.filter(c => c.name.toLowerCase() === channel.toLowerCase());
  }

  // If no channels matched the filter, we still want to return the sources so the UI can show the tabs
  if (activeChannels.length === 0) {
    const defaultColors = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'];
    const sources = channelsData.map((ch, index) => ({
      name: ch.name,
      percentage: 0,
      color: defaultColors[index % defaultColors.length]
    }));
    return { ...defaultEmptyData, sources };
  }
  
  try {
    let allDailyData: DailyData[] = [];
    
    // Fetch and parse CSV for all active channels
    for (const ch of activeChannels) {
      if (!ch.sheet_url) continue;
      
      let finalUrl = ch.sheet_url;
      // Convert standard Google Sheets link to export link if necessary
      if (finalUrl.includes('/edit')) {
        finalUrl = finalUrl.replace(/\/edit.*$/, '/export?format=csv');
        // Handle gid if present in the original URL
        const gidMatch = ch.sheet_url.match(/[#&]gid=([0-9]+)/);
        if (gidMatch) {
          finalUrl += `&gid=${gidMatch[1]}`;
        }
      } else if (!finalUrl.includes('/export')) {
        finalUrl = finalUrl.replace(/\/$/, '') + '/export?format=csv';
      }
      
      try {
        const res = await fetch(finalUrl, { cache: 'no-store' });
        if (!res.ok) continue;
        
        const text = await res.text();
        const lines = text.split('\n').filter(line => line.trim() !== '');
        
        let dataStarted = false;
        for (const line of lines) {
          const normalizedLine = line.trim();
          if (normalizedLine.toLowerCase().startsWith('data') && (normalizedLine.includes(',') || normalizedLine.includes(';'))) {
            dataStarted = true;
            continue;
          }
          if (!dataStarted) continue;
          
          const delimiter = line.includes(';') ? ';' : ',';
          let inQuote = false;
          let currentToken = '';
          const tokens: string[] = [];
          for (let i = 0; i < line.length; i++) {
            if (line[i] === '"') inQuote = !inQuote;
            else if (line[i] === delimiter && !inQuote) {
              tokens.push(currentToken);
              currentToken = '';
            } else currentToken += line[i];
          }
          tokens.push(currentToken);
          
          const dateStr = tokens[0]?.trim();
          const dateRegex = /^(\d{1,4})[./-](\d{1,2})[./-](\d{1,4})$/;
          if (!dateStr || !dateRegex.test(dateStr)) continue;

          const parseNumber = (val: string | undefined) => {
            if (!val) return 0;
            const cleaned = val.replace(/"/g, '').replace(/\./g, '').replace(/,/g, '.').replace('%', '').trim();
            const num = parseFloat(cleaned);
            return isNaN(num) ? 0 : num;
          };

          allDailyData.push({
            date: dateStr,
            source: ch.name,
            totalLeads: parseNumber(tokens[1]),
            leadsWith2PlusMessages: parseNumber(tokens[2]),
            leadsWith1Message: parseNumber(tokens[3]),
            leadsWithPhone: parseNumber(tokens[4]),
            conversionRate: parseNumber(tokens[5]),
            errorsDetected: parseNumber(tokens[6]),
          });
        }
      } catch (e) {
        console.error(`Network error fetching ${ch.name}:`, e);
      }
    }

    // 1. Filter all data by date range first
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

    let dailyData = [...allDailyData];

    // Combine data that has the same date if channel is 'Toate'
    if (dailyData.length > 0 && grouping === 'Zi') {
       const mergedByDate = new Map<string, DailyData>();
       for (const d of dailyData) {
         if (!mergedByDate.has(d.date)) {
           mergedByDate.set(d.date, { ...d, source: channel === 'Toate' ? 'Toate' : d.source });
         } else {
           const existing = mergedByDate.get(d.date)!;
           existing.totalLeads += d.totalLeads;
           existing.leadsWith2PlusMessages += d.leadsWith2PlusMessages;
           existing.leadsWith1Message += d.leadsWith1Message;
           existing.leadsWithPhone += d.leadsWithPhone;
           existing.errorsDetected += d.errorsDetected;
           existing.conversionRate = existing.leadsWith2PlusMessages > 0 ? (existing.leadsWithPhone / existing.leadsWith2PlusMessages) * 100 : 0;
         }
       }
       dailyData = Array.from(mergedByDate.values());
       dailyData.sort((a, b) => parseFlexibleDate(a.date).getTime() - parseFlexibleDate(b.date).getTime());
    }

    // Grouping
    if (grouping !== 'Zi' && dailyData.length > 0) {
      const grouped = new Map<string, DailyData>();
      
      for (const d of dailyData) {
        const rowDate = parseFlexibleDate(d.date);
        let groupKey = '';
        let displayDate = '';

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

        if (!grouped.has(groupKey)) {
          grouped.set(groupKey, {
            date: displayDate,
            source: channel === 'Toate' ? 'Toate' : d.source,
            totalLeads: 0,
            leadsWith2PlusMessages: 0,
            leadsWith1Message: 0,
            leadsWithPhone: 0,
            conversionRate: 0,
            errorsDetected: 0
          });
        }

        const group = grouped.get(groupKey)!;
        group.totalLeads += d.totalLeads;
        group.leadsWith2PlusMessages += d.leadsWith2PlusMessages;
        group.leadsWith1Message += d.leadsWith1Message;
        group.leadsWithPhone += d.leadsWithPhone;
        group.errorsDetected += d.errorsDetected;
        group.conversionRate = group.leadsWith2PlusMessages > 0 ? (group.leadsWithPhone / group.leadsWith2PlusMessages) * 100 : 0;
      }
      
      dailyData = Array.from(grouped.values());
    }

    const totalLeads = dailyData.reduce((acc, curr) => acc + curr.totalLeads, 0);
    const leadsWith2PlusMessages = dailyData.reduce((acc, curr) => acc + curr.leadsWith2PlusMessages, 0);
    const leadsWithPhone = dailyData.reduce((acc, curr) => acc + curr.leadsWithPhone, 0);
    const conversionRate = leadsWith2PlusMessages > 0 ? (leadsWithPhone / leadsWith2PlusMessages) * 100 : 0;

    let trends = {
      totalLeads: 0,
      leadsWith2PlusMessages: 0,
      leadsWithPhone: 0,
      conversionRate: 0
    };

    if (dailyData.length >= 2) {
      const lastDay = dailyData[dailyData.length - 1];
      const prevDay = dailyData[dailyData.length - 2];
      const calcTrend = (oldVal: number, newVal: number) => oldVal > 0 ? ((newVal - oldVal) / oldVal) * 100 : 0;
      trends = {
        totalLeads: calcTrend(prevDay.totalLeads, lastDay.totalLeads),
        leadsWith2PlusMessages: calcTrend(prevDay.leadsWith2PlusMessages, lastDay.leadsWith2PlusMessages),
        leadsWithPhone: calcTrend(prevDay.leadsWithPhone, lastDay.leadsWithPhone),
        conversionRate: lastDay.conversionRate - prevDay.conversionRate
      };
    }

    const defaultColors = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'];
    const sources = channelsData.map((ch, index) => {
      let chLeads = 0;
      if (channel !== 'Toate' && ch.name.toLowerCase() === channel.toLowerCase()) {
         chLeads = totalLeads;
      } else if (channel === 'Toate') {
         chLeads = allDailyData.filter(d => d.source === ch.name).reduce((sum, d) => sum + d.totalLeads, 0);
      }
      return {
        name: ch.name,
        percentage: totalLeads > 0 ? Math.round((chLeads / totalLeads) * 100) : 0,
        color: defaultColors[index % defaultColors.length]
      };
    });

    if (totalLeads === 0 && channelsData.length > 0) {
       sources.forEach(s => s.percentage = Math.round(100 / channelsData.length));
    }

    return {
      totalLeads,
      leadsWith2PlusMessages,
      leadsWithPhone,
      conversionRate,
      trends,
      chartData: dailyData,
      sources
    };
  } catch (error) {
    console.error('Failed to fetch sheet data:', error);
    throw error;
  }
}
