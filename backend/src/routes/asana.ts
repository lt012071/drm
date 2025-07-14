import { Router } from 'express';
import passport from '../config/passport';
import { AsanaController } from '../controllers/asanaController';
import { validateDateRange } from '../middleware/validation';

const router = Router();

// Asana OAuth2認証のコールバック（認証不要）
router.get('/auth/callback', AsanaController.handleOAuthCallback as any);

// Asana OAuth2認証の開始（認証不要）
router.get('/auth', AsanaController.startOAuth as any);

// 認証の設定
if (process.env.SKIP_AUTH === 'true' || process.env.NODE_ENV === 'development') {
  console.log('🔓 Asana API: 認証をスキップします (開発モード)');
} else {
  console.log('🔒 Asana API: 認証を有効にします (本番環境)');
  router.use(passport.authenticate('jwt', { session: false }));
}

// ワークスペース一覧取得
router.get('/workspaces', AsanaController.getWorkspaces as any);

// プロジェクト一覧取得
router.get('/workspaces/:workspaceGid/projects', AsanaController.getProjects as any);

// 自分のタスク一覧取得
router.get('/workspaces/:workspaceGid/my-tasks', validateDateRange, AsanaController.getMyTasks as any);

// プロジェクトのタスク一覧取得
router.get('/projects/:projectGid/tasks', validateDateRange, AsanaController.getProjectTasks as any);

// Asanaタスクを日報タスクに変換
router.post('/tasks/convert', AsanaController.convertTasksToReportTasks as any);

// その日に関わったタスクを取得
router.get('/tasks/involved-today', AsanaController.getTasksInvolvedToday as any);

// タスクを検索
router.get('/tasks/search', AsanaController.searchTasks as any);

// タスクのデバッグ情報を取得
router.get('/tasks/debug', AsanaController.debugTask as any);

export default router;