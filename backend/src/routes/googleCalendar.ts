import { Router } from 'express';
import passport from '../config/passport';
import { GoogleCalendarController } from '../controllers/googleCalendarController';
import { validateDate, validateDateRange } from '../middleware/validation';

const router = Router();

// テストモード用の認証なしモックエンドポイント
const isTestMode = process.env.NODE_ENV === 'test';
const skipAuth = process.env.SKIP_AUTH === 'true';
const useMockData = process.env.USE_MOCK_DATA === 'true' || (isTestMode && process.env.USE_MOCK_DATA !== 'false');

if (useMockData) {
  // モックデータを返すエンドポイント
  router.get('/today', (_req, res) => {
    res.json({
      data: [
        {
          id: 'mock-event-1',
          summary: 'モックミーティング',
          description: 'プロジェクトの進捗確認',
          start: { dateTime: '2025-07-07T10:00:00+09:00' },
          end: { dateTime: '2025-07-07T11:00:00+09:00' },
          duration: 60
        },
        {
          id: 'mock-event-2',
          summary: 'コードレビュー',
          description: 'フロントエンドの実装レビュー',
          start: { dateTime: '2025-07-07T14:00:00+09:00' },
          end: { dateTime: '2025-07-07T15:30:00+09:00' },
          duration: 90
        }
      ],
      count: 2,
      date: new Date().toISOString().split('T')[0]
    });
  });

  router.get('/:date', (req, res) => {
    const { date } = req.params;
    res.json({
      data: [
        {
          id: 'mock-event-1',
          summary: 'モックミーティング',
          description: 'プロジェクトの進捗確認',
          start: { dateTime: `${date}T10:00:00+09:00` },
          end: { dateTime: `${date}T11:00:00+09:00` },
          duration: 60
        },
        {
          id: 'mock-event-2',
          summary: 'コードレビュー',
          description: 'フロントエンドの実装レビュー',
          start: { dateTime: `${date}T14:00:00+09:00` },
          end: { dateTime: `${date}T15:30:00+09:00` },
          duration: 90
        }
      ],
      count: 2,
      date
    });
  });

  router.get('/:date/tasks', (req, res) => {
    const { date } = req.params;
    res.json({
      data: [
        {
          taskName: 'モックミーティング',
          taskType: '会議',
          workHours: 1.0,
          memo: 'プロジェクトの進捗確認',
          googleCalendarEventId: 'mock-event-1'
        },
        {
          taskName: 'コードレビュー',
          taskType: '定型業務',
          workHours: 1.5,
          memo: 'フロントエンドの実装レビュー',
          googleCalendarEventId: 'mock-event-2'
        }
      ],
      originalEvents: [
        {
          id: 'mock-event-1',
          summary: 'モックミーティング',
          description: 'プロジェクトの進捗確認',
          start: { dateTime: `${date}T10:00:00+09:00` },
          end: { dateTime: `${date}T11:00:00+09:00` },
          duration: 60
        },
        {
          id: 'mock-event-2',
          summary: 'コードレビュー',
          description: 'フロントエンドの実装レビュー',
          start: { dateTime: `${date}T14:00:00+09:00` },
          end: { dateTime: `${date}T15:30:00+09:00` },
          duration: 90
        }
      ],
      count: 2,
      date
    });
  });

  router.get('/', (req, res) => {
    const { startDate, endDate } = req.query;
    res.json({
      data: [
        {
          id: 'mock-event-1',
          summary: 'モックミーティング',
          description: 'プロジェクトの進捗確認',
          start: { dateTime: `${startDate}T10:00:00+09:00` },
          end: { dateTime: `${startDate}T11:00:00+09:00` },
          duration: 60
        }
      ],
      count: 1,
      startDate,
      endDate
    });
  });

  router.post('/refresh-token', (_req, res) => {
    res.json({ message: 'モック: アクセストークンを更新しました' });
  });

  console.log('🔓 Google Calendar API: モックデータを使用します');
} else if (skipAuth) {
  console.log('🔓 Google Calendar API: 認証をスキップします');
  // 認証スキップの場合のテストエンドポイント
  router.get('/:date', (req, res) => {
    // ダミーユーザーIDでAPIを呼び出し
    const dummyUser = { id: '4f3a82c5-5d56-4394-9d89-6dcb30c7f90a' };
    req.user = dummyUser;
    GoogleCalendarController.getEventsForDate(req as any, res);
  });
  
  router.get('/:date/tasks', (req, res) => {
    const dummyUser = { id: '4f3a82c5-5d56-4394-9d89-6dcb30c7f90a' };
    req.user = dummyUser;
    GoogleCalendarController.convertEventsToTasks(req as any, res);
  });
} else {
  // 全てのルートでJWT認証を必須とする
  router.use(passport.authenticate('jwt', { session: false }));

  // 今日のカレンダー予定取得
  router.get('/today', GoogleCalendarController.getTodayEvents as any);

  // 期間指定でのカレンダー予定取得
  router.get('/', validateDateRange, GoogleCalendarController.getEventsForDateRange as any);

  // 指定日のカレンダー予定取得
  router.get('/:date', validateDate, GoogleCalendarController.getEventsForDate as any);

  // カレンダー予定をタスク形式に変換
  router.get('/:date/tasks', validateDate, GoogleCalendarController.convertEventsToTasks as any);

  // アクセストークンのリフレッシュ
  router.post('/refresh-token', GoogleCalendarController.refreshToken as any);
}

export default router;