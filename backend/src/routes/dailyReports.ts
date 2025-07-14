import { Router } from 'express';
import passport from '../config/passport';
import { DailyReportController } from '../controllers/dailyReportController';
import { MockDailyReportController } from '../controllers/mockDailyReportController';
import { pool } from '../config/database';
import { 
  validateDailyReport, 
  validateDate, 
  validateDateRange, 
  validateUUID 
} from '../middleware/validation';

const router = Router();

// テストモード用の認証なしモックエンドポイント
const isTestMode = process.env.NODE_ENV === 'test';
const useMockData = process.env.USE_MOCK_DATA === 'true' || (isTestMode && process.env.USE_MOCK_DATA !== 'false');


if (useMockData) {
  console.log('🧪 モックデータを使用します');
  
  // モック用の認証なしエンドポイント
  router.post('/mock', MockDailyReportController.createOrUpdate as any);
  router.get('/mock/today', MockDailyReportController.getToday as any);
  router.get('/mock/:date', MockDailyReportController.getByDate as any);
  router.get('/mock', MockDailyReportController.getByDateRange as any);
  router.delete('/mock/:id', MockDailyReportController.delete as any);
  router.get('/mock/stats', MockDailyReportController.getStats as any);
} else {
  console.log('🏢 実際のデータベースを使用します');
}

// テスト用の認証なしエンドポイント
router.get('/test', async (_req, res) => {
  try {
    if (useMockData) {
      const { mockReports } = await import('../data/mockData');
      return res.json({
        message: 'Mock test successful',
        count: mockReports.length,
        data: mockReports.slice(0, 5),
        mode: 'mock'
      });
    }
    
    const query = `
      SELECT dr.*, 
             json_agg(
               json_build_object(
                 'id', t.id,
                 'taskName', t.task_name,
                 'taskType', t.task_type,
                 'workHours', t.work_hours,
                 'memo', t.memo
               )
             ) FILTER (WHERE t.id IS NOT NULL) as tasks
      FROM daily_reports dr
      LEFT JOIN tasks t ON dr.id = t.daily_report_id
      GROUP BY dr.id
      ORDER BY dr.report_date DESC
      LIMIT 5
    `;
    
    const result = await pool.query(query);
    return res.json({
      message: 'Database test successful',
      count: result.rows.length,
      data: result.rows,
      mode: 'production'
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return res.status(500).json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 全てのルートでJWT認証を必須とする（テストモードまたは認証スキップ設定でスキップ）
const skipAuth = isTestMode || process.env.SKIP_AUTH === 'true';
if (!skipAuth) {
  router.use(passport.authenticate('jwt', { session: false }));
} else {
  console.log('🔓 認証をスキップします (テストモード)');
}

// 日報作成・更新
if (useMockData) {
  router.post('/', MockDailyReportController.createOrUpdate as any);
} else {
  router.post('/', validateDailyReport, DailyReportController.createOrUpdate as any);
}

// 今日の日報取得
if (useMockData) {
  router.get('/today', MockDailyReportController.getToday as any);
} else {
  router.get('/today', DailyReportController.getToday as any);
}

// 日報一覧取得（期間指定）
if (useMockData) {
  router.get('/', MockDailyReportController.getByDateRange as any);
} else {
  router.get('/', validateDateRange, DailyReportController.getByDateRange as any);
}

// 統計情報取得
if (useMockData) {
  router.get('/stats', MockDailyReportController.getStats as any);
} else {
  router.get('/stats', validateDateRange, DailyReportController.getStats as any);
}

// 日報取得（日付指定）
if (useMockData) {
  router.get('/:date', MockDailyReportController.getByDate as any);
} else {
  router.get('/:date', validateDate, DailyReportController.getByDate as any);
}

// 前日のタスクを取得（コピー用）
if (!useMockData) {
  router.get('/:date/previous-tasks', validateDate, DailyReportController.getPreviousTasks as any);
}

// 日報削除
if (useMockData) {
  router.delete('/:id', MockDailyReportController.delete as any);
} else {
  router.delete('/:id', validateUUID, DailyReportController.delete as any);
}

export default router;