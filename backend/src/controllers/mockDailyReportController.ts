import { Response } from 'express';
import { mockReports } from '../data/mockData';
import { OptionalAuthenticatedRequest } from '../types/express';

export class MockDailyReportController {
  // 日報作成・更新
  static async createOrUpdate(req: OptionalAuthenticatedRequest, res: Response) {
    try {
      console.log('Mock createOrUpdate called with:', req.body);
      
      const userId = req.user?.id || 'user-123';
      const { reportDate, remarks, tasks } = req.body;
      
      // 既存の日報を検索
      let existingReport = mockReports.find(r => r.reportDate === reportDate && r.userId === userId);
      
      if (existingReport) {
        // 更新
        existingReport.remarks = remarks;
        existingReport.tasks = tasks.map((task: any, index: number) => ({
          id: `task-${Date.now()}-${index}`,
          dailyReportId: existingReport!.id,
          taskName: task.taskName,
          taskType: task.taskType,
          workHours: task.workHours,
          memo: task.memo || ''
        }));
        existingReport.updatedAt = new Date().toISOString();
        
        return res.status(200).json({
          message: '日報を更新しました',
          data: existingReport
        });
      } else {
        // 新規作成
        const newReport = {
          id: `report-${Date.now()}`,
          userId,
          reportDate,
          remarks: remarks || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tasks: tasks.map((task: any, index: number) => ({
            id: `task-${Date.now()}-${index}`,
            dailyReportId: `report-${Date.now()}`,
            taskName: task.taskName,
            taskType: task.taskType,
            workHours: task.workHours,
            memo: task.memo || ''
          }))
        };
        
        mockReports.push(newReport);
        
        return res.status(201).json({
          message: '日報を作成しました',
          data: newReport
        });
      }
    } catch (error) {
      console.error('Mock create/update error:', error);
      return res.status(500).json({ error: '日報の保存に失敗しました' });
    }
  }

  // 日報取得（日付指定）
  static async getByDate(req: OptionalAuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id || 'user-123';
      const { date } = req.params;
      
      console.log('Mock getByDate called for:', date, 'user:', userId);
      
      const report = mockReports.find(r => r.reportDate === date && r.userId === userId);
      
      if (!report) {
        return res.status(404).json({ error: '指定された日付の日報が見つかりません' });
      }

      return res.json({ data: report });
    } catch (error) {
      console.error('Mock get by date error:', error);
      return res.status(500).json({ error: '日報の取得に失敗しました' });
    }
  }

  // 日報一覧取得（期間指定）
  static async getByDateRange(req: OptionalAuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id || 'user-123';
      const { startDate, endDate } = req.query as { startDate: string; endDate: string };
      
      console.log('Mock getByDateRange called:', { startDate, endDate, userId });
      
      const reports = mockReports.filter(r => {
        return r.userId === userId && 
               r.reportDate >= startDate && 
               r.reportDate <= endDate;
      }).sort((a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime());
      
      console.log('Mock returning reports:', reports.length);
      
      return res.json({ 
        data: reports,
        count: reports.length
      });
    } catch (error) {
      console.error('Mock get by date range error:', error);
      return res.status(500).json({ error: '日報一覧の取得に失敗しました' });
    }
  }

  // 日報削除
  static async delete(req: OptionalAuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id || 'user-123';
      const { id } = req.params;
      
      const reportIndex = mockReports.findIndex(r => r.id === id && r.userId === userId);
      
      if (reportIndex === -1) {
        return res.status(404).json({ error: '削除対象の日報が見つかりません' });
      }

      mockReports.splice(reportIndex, 1);
      
      return res.json({ message: '日報を削除しました' });
    } catch (error) {
      console.error('Mock delete error:', error);
      return res.status(500).json({ error: '日報の削除に失敗しました' });
    }
  }

  // 今日の日報取得
  static async getToday(req: OptionalAuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id || 'user-123';
      const today = new Date().toISOString().split('T')[0];
      
      console.log('Mock getToday called for:', today, 'user:', userId);
      
      const report = mockReports.find(r => r.reportDate === today && r.userId === userId);
      
      return res.json({ 
        data: report,
        date: today
      });
    } catch (error) {
      console.error('Mock get today error:', error);
      return res.status(500).json({ error: '本日の日報取得に失敗しました' });
    }
  }

  // 統計情報取得
  static async getStats(req: OptionalAuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id || 'user-123';
      const { startDate, endDate } = req.query as { startDate: string; endDate: string };
      
      const reports = mockReports.filter(r => {
        return r.userId === userId && 
               r.reportDate >= startDate && 
               r.reportDate <= endDate;
      });
      
      // 簡単な統計を計算
      const stats = {
        totalReports: reports.length,
        totalHours: reports.reduce((sum, r) => sum + r.tasks.reduce((taskSum, t) => taskSum + t.workHours, 0), 0),
        totalTasks: reports.reduce((sum, r) => sum + r.tasks.length, 0)
      };
      
      return res.json({ data: stats });
    } catch (error) {
      console.error('Mock get stats error:', error);
      return res.status(500).json({ error: '統計情報の取得に失敗しました' });
    }
  }
}