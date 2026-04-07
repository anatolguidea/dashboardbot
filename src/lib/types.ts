import type { TimePeriod } from "@/components/TimeFilter";

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

export interface MetricsData {
  messagesThisMonth: number;
  totalUsers: number;
  phoneNumbersCaptured: number;
  growth: Growth;
  chartData: ChartPoint[];
  recentActivity: RecentActivity[];
}

export interface Insight {
  title: string;
  detail: string;
  severity?: "low" | "medium" | "high";
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

export interface PythonEventPayload {
  time: string;
  bot_id: string;
  channel: string;
  sender_id: string;
  sender_name: string;
}
