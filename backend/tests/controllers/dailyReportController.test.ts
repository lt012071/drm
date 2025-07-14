import request from 'supertest';
import express from 'express';
import { DailyReportController } from '../../src/controllers/dailyReportController';
import { DailyReportModel } from '../../src/models/DailyReport';

// DailyReportModelをモック
jest.mock('../../src/models/DailyReport');

const app = express();
app.use(express.json());

// テスト用のルートを設定
app.post('/api/daily-reports', DailyReportController.createOrUpdate as any);
app.get('/api/daily-reports/today', DailyReportController.getToday as any);
app.get('/api/daily-reports/:date', DailyReportController.getByDate as any);
app.get('/api/daily-reports', DailyReportController.getByDateRange as any);
app.delete('/api/daily-reports/:id', DailyReportController.delete as any);
app.get('/api/daily-reports/stats', DailyReportController.getStats as any);

describe('DailyReportController', () => {
  const mockDailyReportModel = DailyReportModel as jest.Mocked<typeof DailyReportModel>;

  beforeEach(() => {
    jest.clearAllMocks();
    // 開発環境でのユーザー設定テスト
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    delete process.env.NODE_ENV;
  });

  describe('createOrUpdate', () => {
    it('新しい日報を作成できる', async () => {
      const mockReport = {
        id: 'test-report-id',
        userId: 'dev-user-123',
        reportDate: '2025-07-06',
        remarks: 'テスト日報',
        tasks: [
          {
            id: 'task-1',
            dailyReportId: 'test-report-id',
            taskName: 'テストタスク',
            taskType: '新規開発',
            workHours: 2.0,
            memo: 'テストメモ',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDailyReportModel.create.mockResolvedValue(mockReport as any);

      const requestData = {
        reportDate: '2025-07-06',
        remarks: 'テスト日報',
        tasks: [
          {
            taskName: 'テストタスク',
            taskType: '新規開発',
            workHours: 2.0,
            memo: 'テストメモ'
          }
        ]
      };

      const response = await request(app)
        .post('/api/daily-reports')
        .send(requestData)
        .expect(201);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.id).toBe('test-report-id');
      expect(mockDailyReportModel.create).toHaveBeenCalledWith({
        userId: 'dev-user-123',
        reportDate: '2025-07-06',
        remarks: 'テスト日報',
        tasks: requestData.tasks
      });
    });
  });

  describe('getToday', () => {
    it('今日の日報を取得できる', async () => {
      const mockReport = {
        id: 'today-report-id',
        userId: 'dev-user-123',
        reportDate: new Date().toISOString().split('T')[0],
        remarks: '今日の日報',
        tasks: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDailyReportModel.findByUserAndDate.mockResolvedValue(mockReport as any);

      const response = await request(app)
        .get('/api/daily-reports/today')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.id).toBe('today-report-id');
    });

    it('今日の日報が存在しない場合、nullを返す', async () => {
      mockDailyReportModel.findByUserAndDate.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/daily-reports/today')
        .expect(200);

      expect(response.body.data).toBeNull();
    });
  });

  describe('getByDateRange', () => {
    it('期間指定で日報一覧を取得できる', async () => {
      const mockReports = [
        {
          id: 'report-1',
          userId: 'dev-user-123',
          reportDate: '2025-07-06',
          remarks: '日報1',
          tasks: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockDailyReportModel.findByUserAndDateRange.mockResolvedValue(mockReports as any);

      const response = await request(app)
        .get('/api/daily-reports')
        .query({
          startDate: '2025-07-01',
          endDate: '2025-07-31'
        })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(1);
    });
  });

  describe('delete', () => {
    it('日報を削除できる', async () => {
      mockDailyReportModel.delete.mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/daily-reports/test-id')
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(mockDailyReportModel.delete).toHaveBeenCalledWith('test-id');
    });
  });

  describe('getStats', () => {
    it('統計情報を取得できる', async () => {
      const mockStats = [
        {
          totalReports: 10,
          totalHours: 80.0,
          totalTasks: 25,
          averageHoursPerDay: 8.0
        }
      ];

      mockDailyReportModel.getStatsByUser.mockResolvedValue(mockStats as any);

      const response = await request(app)
        .get('/api/daily-reports/stats')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toEqual(mockStats[0]);
    });
  });
});