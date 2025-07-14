import { Response } from 'express';
import { GoogleCalendarService } from '../services/googleCalendarService';
import { OptionalAuthenticatedRequest } from '../types/express';

export class GoogleCalendarController {
  // 指定日のカレンダー予定取得
  static async getEventsForDate(req: OptionalAuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: '認証が必要です' });
      }

      const { date } = req.params;
      
      // 日付フォーマットの検証
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: '日付はYYYY-MM-DD形式で指定してください' });
      }

      const events = await GoogleCalendarService.getEventsForDate(req.user!.id, date);
      
      return res.json({
        data: events,
        count: events.length,
        date
      });
    } catch (error) {
      console.error('Get calendar events error:', error);
      
      if ((error as Error).message.includes('アクセス権限が無効')) {
        return res.status(401).json({ error: (error as Error).message });
      }
      
      return res.status(500).json({ error: (error as Error).message || 'カレンダー予定の取得に失敗しました' });
    }
  }

  // 期間指定でのカレンダー予定取得
  static async getEventsForDateRange(req: OptionalAuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: '認証が必要です' });
      }

      const { startDate, endDate } = req.query as { startDate: string; endDate: string };
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDateとendDateが必要です' });
      }

      const events = await GoogleCalendarService.getEventsForDateRange(
        req.user!.id, 
        startDate, 
        endDate
      );
      
      return res.json({
        data: events,
        count: events.length,
        startDate,
        endDate
      });
    } catch (error) {
      console.error('Get calendar events range error:', error);
      return res.status(500).json({ error: (error as Error).message || 'カレンダー予定の取得に失敗しました' });
    }
  }

  // 今日のカレンダー予定取得
  static async getTodayEvents(req: OptionalAuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: '認証が必要です' });
      }

      const today = new Date().toISOString().split('T')[0];
      const events = await GoogleCalendarService.getEventsForDate(req.user!.id, today);
      
      return res.json({
        data: events,
        count: events.length,
        date: today
      });
    } catch (error) {
      console.error('Get today events error:', error);
      return res.status(500).json({ error: (error as Error).message || '今日の予定取得に失敗しました' });
    }
  }

  // カレンダー予定をタスク形式に変換
  static async convertEventsToTasks(req: OptionalAuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: '認証が必要です' });
      }

      const { date } = req.params;
      
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: '日付はYYYY-MM-DD形式で指定してください' });
      }

      const events = await GoogleCalendarService.getEventsForDate(req.user!.id, date);
      const tasks = GoogleCalendarService.convertEventsToTasks(events);
      
      return res.json({
        data: tasks,
        originalEvents: events,
        count: tasks.length,
        date
      });
    } catch (error) {
      console.error('Convert events to tasks error:', error);
      return res.status(500).json({ error: (error as Error).message || 'タスク変換に失敗しました' });
    }
  }

  // アクセストークンのリフレッシュ
  static async refreshToken(req: OptionalAuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: '認証が必要です' });
      }

      await GoogleCalendarService.refreshUserToken(req.user!.id);
      
      return res.json({ message: 'アクセストークンを更新しました' });
    } catch (error) {
      console.error('Refresh token error:', error);
      return res.status(500).json({ error: (error as Error).message || 'トークンの更新に失敗しました' });
    }
  }
}