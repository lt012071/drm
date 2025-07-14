import request from 'supertest';
import express from 'express';
import { MockDailyReportController } from '../../src/controllers/mockDailyReportController';

const app = express();
app.use(express.json());

// テスト用のルートを設定
app.post('/api/daily-reports', MockDailyReportController.createOrUpdate as any);
app.get('/api/daily-reports/today', MockDailyReportController.getToday as any);
app.get('/api/daily-reports/:date', MockDailyReportController.getByDate as any);
app.get('/api/daily-reports', MockDailyReportController.getByDateRange as any);
app.delete('/api/daily-reports/:id', MockDailyReportController.delete as any);
app.get('/api/daily-reports/stats', MockDailyReportController.getStats as any);

describe('MockDailyReportController', () => {
  beforeEach(() => {
    // モックデータをリセット
    jest.clearAllMocks();
  });

  describe('createOrUpdate', () => {
    it('新しい日報を作成できる', async () => {
      const requestData = {
        reportDate: '2025-07-06',
        remarks: 'モックテスト日報',
        tasks: [
          {
            taskName: 'モックタスク',
            taskType: '新規開発',
            workHours: 3.0,
            memo: 'モックメモ'
          }
        ]
      };

      const response = await request(app)
        .post('/api/daily-reports')
        .send(requestData)
        .expect(201);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.reportDate).toBe('2025-07-06');
      expect(response.body.data.remarks).toBe('モックテスト日報');
      expect(response.body.data.tasks).toHaveLength(1);
    });
  });

  describe('getToday', () => {
    it('今日の日報を取得する', async () => {
      const response = await request(app)
        .get('/api/daily-reports/today')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      // モックサービスでは今日の日報が存在する場合がある
    });
  });

  describe('getByDate', () => {
    it('指定日の日報を取得できる', async () => {
      const response = await request(app)
        .get('/api/daily-reports/2025-07-05')
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });

    it('存在しない日付の場合nullを返す', async () => {
      const response = await request(app)
        .get('/api/daily-reports/2025-01-01')
        .expect(200);

      expect(response.body.data).toBeNull();
    });
  });

  describe('getByDateRange', () => {
    it('期間指定で日報一覧を取得できる', async () => {
      const response = await request(app)
        .get('/api/daily-reports')
        .query({
          startDate: '2025-07-01',
          endDate: '2025-07-31'
        })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('getStats', () => {
    it('統計情報を正しく計算する', async () => {
      const response = await request(app)
        .get('/api/daily-reports/stats')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('totalReports');
      expect(response.body.data).toHaveProperty('totalHours');
      expect(response.body.data).toHaveProperty('totalTasks');
      expect(response.body.data).toHaveProperty('averageHoursPerDay');
    });
  });
});