export interface Task {
  id?: string;
  taskName: string;
  taskType: '新規開発' | '定型業務' | '会議' | '突発的な作業' | 'その他';
  workHours: number;
  memo?: string;
  asanaTaskId?: string;
  googleCalendarEventId?: string;
}

export interface CreateTaskData {
  taskName: string;
  taskType: '新規開発' | '定型業務' | '会議' | '突発的な作業' | 'その他';
  workHours: number;
  memo?: string;
  asanaTaskId?: string;
  googleCalendarEventId?: string;
}

export interface DailyReport {
  id?: string;
  userId?: string;
  reportDate: string;
  remarks?: string;
  tasks: Task[];
  createdAt?: string;
  updatedAt?: string;
}

export interface DailyReportStats {
  taskType: string;
  totalHours: number;
  taskCount: number;
}

export interface CreateDailyReportRequest {
  reportDate: string;
  remarks?: string;
  tasks: CreateTaskData[];
}

export interface DailyReportResponse {
  message?: string;
  data: DailyReport;
}

export interface DailyReportListResponse {
  data: DailyReport[];
  count: number;
}

export interface DailyReportStatsResponse {
  data: DailyReportStats[];
}

export const TASK_TYPES = [
  '新規開発',
  '定型業務', 
  '会議',
  '突発的な作業',
  'その他'
] as const;

export const TASK_TYPE_COLORS = {
  '新規開発': 'blue',
  '定型業務': 'green',
  '会議': 'orange',
  '突発的な作業': 'red',
  'その他': 'gray'
} as const;