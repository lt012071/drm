export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  duration?: number; // 分
}

export interface CalendarEventsResponse {
  data: CalendarEvent[];
  count: number;
  date?: string;
  startDate?: string;
  endDate?: string;
}

export interface CalendarTasksResponse {
  data: CalendarTask[];
  originalEvents: CalendarEvent[];
  count: number;
  date: string;
}

export interface CalendarTask {
  taskName: string;
  taskType: '新規開発' | '定型業務' | '会議' | '突発的な作業' | 'その他';
  workHours: number;
  memo: string;
  googleCalendarEventId: string;
}