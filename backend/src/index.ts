import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import session from 'express-session';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// テストモードでのみデータベース関連設定をスキップ
const isTestMode = process.env.NODE_ENV === 'test';

if (!isTestMode) {
  require('./config/session');
  require('./config/passport');
}
const passport = isTestMode ? null : require('./config/passport').default;
import authRoutes from './routes/auth';
import dailyReportsRoutes from './routes/dailyReports';
import googleCalendarRoutes from './routes/googleCalendar';
import asanaRoutes from './routes/asana';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// セキュリティミドルウェア
app.use(helmet());

// CORS設定
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// レート制限（本番環境のみ）
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分
    max: 100, // 最大100リクエスト
    message: 'Too many requests from this IP, please try again later.',
  });
  app.use('/api/', limiter);
}

// ログ出力
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// JSON parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// テストモードでのみセッション・認証をスキップ
if (!isTestMode) {
  const { sessionConfig } = require('./config/session');
  app.use(session(sessionConfig));
  
  if (passport) {
    app.use(passport.initialize());
    app.use(passport.session());
  }
}

// ルート設定
if (!isTestMode) {
  app.use('/auth', authRoutes);
  app.use('/api/asana', asanaRoutes);
}
// Google Calendar と Daily Reports は常に有効（認証スキップを内部で管理）
app.use('/api/google-calendar', googleCalendarRoutes);
app.use('/api/daily-reports', dailyReportsRoutes);

// ヘルスチェック
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// 404ハンドラー
app.use('*', (_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// エラーハンドラー
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message 
  });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`🚀 サーバーが起動しました: http://localhost:${PORT}`);
  console.log(`🔧 環境: ${process.env.NODE_ENV || 'development'}`);
});

export default app;