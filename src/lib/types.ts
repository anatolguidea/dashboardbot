import type { TimePeriod } from "@/components/TimeFilter";

export interface DailyData {
  date: string; // Data
  source: string; // Canal
  totalLeads: number; // Leaduri total
  leadsWith2PlusMessages: number; // Persoane care au scris 2+ mesaje
  leadsWith1Message: number; // Persoane cu 1 mesaj (Lead-uri ramase)
  leadsWithPhone: number; // Lead cu numar de telefon
  conversionRate: number; // % conversie
  errorsDetected: number; // Nr. erori depistate
}

export interface MetricsData {
  totalLeads: number;
  leadsWith2PlusMessages: number;
  leadsWithPhone: number;
  conversionRate: number;
  
  trends: {
    totalLeads: number; // percentage change
    leadsWith2PlusMessages: number;
    leadsWithPhone: number;
    conversionRate: number; // percentage point change
  };

  chartData: DailyData[];
  
  sources: {
    name: string;
    percentage: number;
    totalLeads: number;
    color: string;
  }[];
}

export interface Insight {
  id: string;
  date: string;
  text: string;
  severity: "high" | "medium" | "low" | "success";
}

export interface PythonEventPayload {
  time: string;
  bot_id: string;
  channel: string;
  sender_id: string;
  sender_name: string;
}

export interface Growth {
  messages: string;
  users: string;
  phones: string;
}

export interface ChartPoint {
  date: string;
  messages: number;
  users: number;
  platforms: Record<string, number>;
}

export interface RecentActivity {
  id: string;
  senderId: string;
  senderName: string;
  botId: string;
  channel: string;
  type: "new_user" | "new_phonenumber";
  time: string;
}

export interface AiInsightsData {
  summary: string;
  highlights: Insight[];
  recommendations: Insight[];
  lastUpdated?: string;
}

export interface ApiSuccess<T> {
  status: "success";
  data: T;
}

export interface ApiError {
  status: "error";
  message: string;
}

export interface Bot {
  id: string;
  name: string;
}

export interface MetricsQuery {
  period: TimePeriod;
  date: string;
  botId?: string;
}
