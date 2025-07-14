import { CalendarEvent, CalendarEventsResponse, CalendarTasksResponse } from '../types/googleCalendar';
import { AuthService } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export class GoogleCalendarService {
  private static getHeaders() {
    const token = AuthService.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  // 今日のカレンダー予定取得
  static async getTodayEvents(): Promise<CalendarEvent[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/google-calendar/today`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '今日の予定取得に失敗しました');
      }

      const result: CalendarEventsResponse = await response.json();
      return result.data;
    } catch (error) {
      console.error('Get today events error:', error);
      throw error;
    }
  }

  // 指定日のカレンダー予定取得
  static async getEventsForDate(date: string): Promise<CalendarEvent[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/google-calendar/${date}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'カレンダー予定の取得に失敗しました');
      }

      const result: CalendarEventsResponse = await response.json();
      return result.data;
    } catch (error) {
      console.error('Get events for date error:', error);
      throw error;
    }
  }

  // 期間指定でのカレンダー予定取得
  static async getEventsForDateRange(startDate: string, endDate: string): Promise<CalendarEvent[]> {
    try {
      const params = new URLSearchParams({ startDate, endDate });
      const response = await fetch(`${API_BASE_URL}/api/google-calendar?${params}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'カレンダー予定の取得に失敗しました');
      }

      const result: CalendarEventsResponse = await response.json();
      return result.data;
    } catch (error) {
      console.error('Get events for date range error:', error);
      throw error;
    }
  }

  // カレンダー予定をタスク形式に変換
  static async convertEventsToTasks(date: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/google-calendar/${date}/tasks`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'タスク変換に失敗しました');
      }

      const result: CalendarTasksResponse = await response.json();
      return result;
    } catch (error) {
      console.error('Convert events to tasks error:', error);
      throw error;
    }
  }

  // アクセストークンのリフレッシュ
  static async refreshToken(): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/google-calendar/refresh-token`, {
        method: 'POST',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'トークンの更新に失敗しました');
      }
    } catch (error) {
      console.error('Refresh token error:', error);
      throw error;
    }
  }

  // イベントの時刻フォーマット
  static formatEventTime(event: CalendarEvent): string {
    const start = event.start.dateTime || event.start.date;
    const end = event.end.dateTime || event.end.date;

    if (!start || !end) return '';

    if (event.start.dateTime && event.end.dateTime) {
      // 時刻指定のイベント
      const startTime = new Date(start).toLocaleTimeString('ja-JP', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      const endTime = new Date(end).toLocaleTimeString('ja-JP', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      return `${startTime} - ${endTime}`;
    } else {
      // 終日イベント
      return '終日';
    }
  }

  // イベントの時間（時間単位）を取得
  static getEventDurationInHours(event: CalendarEvent): number {
    if (!event.duration) return 1; // デフォルト1時間
    return Math.round((event.duration / 60) * 10) / 10; // 小数点1桁
  }
}