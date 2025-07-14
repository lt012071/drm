import { Response } from 'express';
import { DailyReportModel, CreateDailyReportData } from '../models/DailyReport';
import { OptionalAuthenticatedRequest } from '../types/express';

export class DailyReportController {
  // 開発環境用のユーザー設定ヘルパー
  private static ensureUser(req: OptionalAuthenticatedRequest): boolean {
    if (!req.user && process.env.NODE_ENV === 'development') {
      req.user = {
        id: 'c4099d2e-8aca-42f6-9d5e-74fce3c5f02a',
        email: 'admin@example.com',
        role: 'user'
      };
    }
    return !!req.user;
  }
  // 日報作成・更新
  static async createOrUpdate(req: OptionalAuthenticatedRequest, res: Response) {
    try {
      if (!DailyReportController.ensureUser(req)) {
        return res.status(401).json({ error: '認証が必要です' });
      }

      const data: CreateDailyReportData = {
        userId: req.user!.id,
        reportDate: req.body.reportDate,
        remarks: req.body.remarks,
        tasks: req.body.tasks
      };

      const report = await DailyReportModel.create(data);
      
      return res.status(201).json({
        message: '日報を保存しました',
        data: report
      });
    } catch (error) {
      console.error('Create/Update daily report error:', error);
      return res.status(500).json({ error: '日報の保存に失敗しました' });
    }
  }

  // 日報取得（日付指定）
  static async getByDate(req: OptionalAuthenticatedRequest, res: Response) {
    try {
      if (!DailyReportController.ensureUser(req)) {
        return res.status(401).json({ error: '認証が必要です' });
      }

      const { date } = req.params;
      const report = await DailyReportModel.findByUserAndDate(req.user!.id, date);
      
      if (!report) {
        return res.status(404).json({ error: '指定された日付の日報が見つかりません' });
      }

      return res.json({ data: report });
    } catch (error) {
      console.error('Get daily report error:', error);
      return res.status(500).json({ error: '日報の取得に失敗しました' });
    }
  }

  // 日報一覧取得（期間指定）
  static async getByDateRange(req: OptionalAuthenticatedRequest, res: Response) {
    try {
      if (!DailyReportController.ensureUser(req)) {
        return res.status(401).json({ error: '認証が必要です' });
      }

      const { startDate, endDate } = req.query as { startDate: string; endDate: string };
      const reports = await DailyReportModel.findByUserAndDateRange(
        req.user!.id, 
        startDate, 
        endDate
      );
      
      return res.json({ 
        data: reports,
        count: reports.length
      });
    } catch (error) {
      console.error('Get daily reports error:', error);
      return res.status(500).json({ error: '日報一覧の取得に失敗しました' });
    }
  }

  // 日報削除
  static async delete(req: OptionalAuthenticatedRequest, res: Response) {
    try {
      if (!DailyReportController.ensureUser(req)) {
        return res.status(401).json({ error: '認証が必要です' });
      }

      const { id } = req.params;
      const deleted = await DailyReportModel.delete(id, req.user!.id);
      
      if (!deleted) {
        return res.status(404).json({ error: '削除対象の日報が見つかりません' });
      }

      return res.json({ message: '日報を削除しました' });
    } catch (error) {
      console.error('Delete daily report error:', error);
      return res.status(500).json({ error: '日報の削除に失敗しました' });
    }
  }

  // 統計情報取得
  static async getStats(req: OptionalAuthenticatedRequest, res: Response) {
    try {
      if (!DailyReportController.ensureUser(req)) {
        return res.status(401).json({ error: '認証が必要です' });
      }

      const { startDate, endDate } = req.query as { startDate: string; endDate: string };
      const stats = await DailyReportModel.getStatsByUser(
        req.user!.id, 
        startDate, 
        endDate
      );
      
      return res.json({ data: stats });
    } catch (error) {
      console.error('Get stats error:', error);
      return res.status(500).json({ error: '統計情報の取得に失敗しました' });
    }
  }

  // 今日の日報取得（便利メソッド）
  static async getToday(req: OptionalAuthenticatedRequest, res: Response) {
    try {
      if (!DailyReportController.ensureUser(req)) {
        return res.status(401).json({ error: '認証が必要です' });
      }

      // ローカルタイムゾーンで今日の日付を取得
      const now = new Date();
      const today = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
      const report = await DailyReportModel.findByUserAndDate(req.user!.id, today);
      
      return res.json({ 
        data: report,
        date: today
      });
    } catch (error) {
      console.error('Get today report error:', error);
      return res.status(500).json({ error: '本日の日報取得に失敗しました' });
    }
  }

  // 前日のタスクを取得（コピー用）
  static async getPreviousTasks(req: OptionalAuthenticatedRequest, res: Response) {
    try {
      if (!DailyReportController.ensureUser(req)) {
        return res.status(401).json({ error: '認証が必要です' });
      }

      const { date } = req.params;
      if (!date) {
        return res.status(400).json({ error: '日付が必要です' });
      }

      // 前日の日付を計算
      const targetDate = new Date(date);
      targetDate.setDate(targetDate.getDate() - 1);
      const previousDate = targetDate.toISOString().split('T')[0];

      const report = await DailyReportModel.findByUserAndDate(req.user!.id, previousDate);
      
      if (!report || !report.tasks || report.tasks.length === 0) {
        return res.json({ 
          data: [],
          previousDate,
          message: '前日のタスクが見つかりません'
        });
      }

      // Googleカレンダーと連携したタスクは除外して返す
      const filteredTasks = report.tasks
        .filter(task => !task.googleCalendarEventId)
        .map(task => ({
          taskName: task.taskName,
          taskType: task.taskType,
          workHours: task.workHours,
          memo: task.memo,
          // 外部連携IDはコピーしない
          asanaTaskId: undefined,
          googleCalendarEventId: undefined
        }));

      return res.json({ 
        data: filteredTasks,
        previousDate,
        originalTaskCount: report.tasks.length,
        copiedTaskCount: filteredTasks.length
      });
    } catch (error) {
      console.error('Get previous tasks error:', error);
      return res.status(500).json({ error: '前日のタスク取得に失敗しました' });
    }
  }
}