import { Response } from 'express';
import { OptionalAuthenticatedRequest } from '../types/express';
import { AsanaService } from '../services/asanaService';
import { AsanaOAuth } from '../config/asana';
import { UserModel } from '../models/User';

export class AsanaController {
  // 開発環境用のユーザー設定ヘルパー
  private static ensureUser(req: OptionalAuthenticatedRequest): boolean {
    if (!req.user && (process.env.NODE_ENV === 'development' || process.env.SKIP_AUTH === 'true')) {
      req.user = {
        id: 'c4099d2e-8aca-42f6-9d5e-74fce3c5f02a',
        email: 'admin@example.com',
        role: 'user'
      };
    }
    return !!req.user;
  }

  // ワークスペース一覧取得
  static async getWorkspaces(req: OptionalAuthenticatedRequest, res: Response) {
    try {
      if (!AsanaController.ensureUser(req)) {
        return res.status(401).json({ error: '認証が必要です' });
      }

      const accessToken = await AsanaController.getUserAsanaToken(req.user!.id);
      const workspaces = await AsanaService.getWorkspaces(accessToken);
      
      return res.json({ data: workspaces });
    } catch (error) {
      console.error('Get Asana workspaces error:', error);
      
      // アクセストークンエラーの場合
      if (error instanceof Error && error.message.includes('アクセストークンが見つかりません')) {
        return res.status(401).json({ 
          error: error.message,
          needsAuth: true
        });
      }
      
      return res.status(500).json({ error: 'ワークスペース一覧の取得に失敗しました' });
    }
  }

  // プロジェクト一覧取得
  static async getProjects(req: OptionalAuthenticatedRequest, res: Response) {
    try {
      if (!AsanaController.ensureUser(req)) {
        return res.status(401).json({ error: '認証が必要です' });
      }

      const { workspaceGid } = req.params;
      
      if (!workspaceGid) {
        return res.status(400).json({ error: 'ワークスペースGIDが必要です' });
      }

      const accessToken = await AsanaController.getUserAsanaToken(req.user!.id);
      const projects = await AsanaService.getProjects(accessToken, workspaceGid);
      
      return res.json({ data: projects });
    } catch (error) {
      console.error('Get Asana projects error:', error);
      
      if (error instanceof Error && error.message.includes('アクセストークンが見つかりません')) {
        return res.status(401).json({ 
          error: error.message,
          needsAuth: true
        });
      }
      
      return res.status(500).json({ error: 'プロジェクト一覧の取得に失敗しました' });
    }
  }

  // 自分のタスク一覧取得
  static async getMyTasks(req: OptionalAuthenticatedRequest, res: Response) {
    try {
      if (!AsanaController.ensureUser(req)) {
        return res.status(401).json({ error: '認証が必要です' });
      }

      const { workspaceGid } = req.params;
      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
      
      if (!workspaceGid) {
        return res.status(400).json({ error: 'ワークスペースGIDが必要です' });
      }

      const accessToken = await AsanaController.getUserAsanaToken(req.user!.id);
      const tasks = await AsanaService.getMyTasks(accessToken, workspaceGid, startDate, endDate);
      
      return res.json({ data: tasks });
    } catch (error) {
      console.error('Get my Asana tasks error:', error);
      
      if (error instanceof Error && error.message.includes('アクセストークンが見つかりません')) {
        return res.status(401).json({ 
          error: error.message,
          needsAuth: true
        });
      }
      
      return res.status(500).json({ error: '自分のタスク取得に失敗しました' });
    }
  }

  // プロジェクトのタスク一覧取得
  static async getProjectTasks(req: OptionalAuthenticatedRequest, res: Response) {
    try {
      if (!AsanaController.ensureUser(req)) {
        return res.status(401).json({ error: '認証が必要です' });
      }

      const { projectGid } = req.params;
      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
      
      if (!projectGid) {
        return res.status(400).json({ error: 'プロジェクトGIDが必要です' });
      }

      const accessToken = await AsanaController.getUserAsanaToken(req.user!.id);
      const tasks = await AsanaService.getTasksFromProject(accessToken, projectGid, startDate, endDate);
      
      return res.json({ data: tasks });
    } catch (error) {
      console.error('Get project tasks error:', error);
      
      if (error instanceof Error && error.message.includes('アクセストークンが見つかりません')) {
        return res.status(401).json({ 
          error: error.message,
          needsAuth: true
        });
      }
      
      return res.status(500).json({ error: 'プロジェクトタスクの取得に失敗しました' });
    }
  }

  // Asanaタスクを日報タスクに変換
  static async convertTasksToReportTasks(req: OptionalAuthenticatedRequest, res: Response) {
    try {
      if (!AsanaController.ensureUser(req)) {
        return res.status(401).json({ error: '認証が必要です' });
      }

      const { taskGids } = req.body as { taskGids: string[] };
      
      if (!taskGids || !Array.isArray(taskGids) || taskGids.length === 0) {
        return res.status(400).json({ error: 'タスクGIDが必要です' });
      }

      const accessToken = await AsanaController.getUserAsanaToken(req.user!.id);
      
      // 各タスクの詳細情報を取得
      const tasks = await Promise.all(
        taskGids.map(gid => AsanaService.getTaskDetail(accessToken, gid))
      );
      
      // 日報タスク形式に変換
      const reportTasks = AsanaService.convertAsanaTasksToReportTasks(tasks);
      
      return res.json({ 
        data: reportTasks,
        originalTasks: tasks,
        count: reportTasks.length
      });
    } catch (error) {
      console.error('Convert Asana tasks error:', error);
      
      if (error instanceof Error && error.message.includes('アクセストークンが見つかりません')) {
        return res.status(401).json({ 
          error: error.message,
          needsAuth: true
        });
      }
      
      return res.status(500).json({ error: 'タスク変換に失敗しました' });
    }
  }

  // Asana OAuth2認証の開始
  static async startOAuth(req: OptionalAuthenticatedRequest, res: Response) {
    try {
      if (!AsanaController.ensureUser(req)) {
        return res.status(401).json({ error: '認証が必要です' });
      }

      // ユーザーIDをstateに含める（セキュリティ上の理由で）
      const state = Buffer.from(JSON.stringify({ userId: req.user!.id })).toString('base64');
      
      const authUrl = AsanaOAuth.generateAuthUrl(state);
      
      return res.json({
        authUrl,
        message: 'Asana認証を開始してください'
      });
    } catch (error) {
      console.error('Asana OAuth start error:', error);
      return res.status(500).json({ error: 'OAuth2認証の開始に失敗しました' });
    }
  }

  // Asana OAuth2認証のコールバック処理
  static async handleOAuthCallback(req: OptionalAuthenticatedRequest, res: Response) {
    try {
      console.log('🔄 Asana OAuth callback received:', req.query);
      const { code, state } = req.query as { code?: string; state?: string };
      
      if (!code) {
        console.error('❌ 認証コードが見つかりません');
        return res.status(400).json({ error: '認証コードが見つかりません' });
      }

      // stateからユーザーIDを取得
      let userId: string;
      if (state) {
        try {
          const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
          userId = stateData.userId;
          console.log('🔑 ユーザーID取得成功:', userId);
        } catch {
          console.error('❌ 不正なstateパラメータです');
          return res.status(400).json({ error: '不正なstateパラメータです' });
        }
      } else {
        console.error('❌ stateパラメータが見つかりません');
        return res.status(400).json({ error: 'stateパラメータが見つかりません' });
      }

      // アクセストークンを取得
      console.log('🔄 アクセストークン取得中...');
      const tokenData = await AsanaOAuth.exchangeCodeForToken(code);
      console.log('✅ アクセストークン取得成功');
      
      // データベースに保存
      console.log('🔄 データベースにトークンを保存中...');
      const updatedUser = await UserModel.updateAsanaTokens(
        userId,
        tokenData.access_token,
        tokenData.refresh_token
      );
      console.log('✅ データベース保存成功:', updatedUser ? 'User updated' : 'User not found');

      // フロントエンドにリダイレクト
      console.log('🔄 フロントエンドにリダイレクト中...');
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard?asana=connected`);
    } catch (error) {
      console.error('❌ Asana OAuth callback error:', error);
      return res.status(500).json({ error: 'OAuth2認証に失敗しました' });
    }
  }

  // その日に関わったタスクを取得
  static async getTasksInvolvedToday(req: OptionalAuthenticatedRequest, res: Response) {
    try {
      if (!AsanaController.ensureUser(req)) {
        return res.status(401).json({ error: '認証が必要です' });
      }

      const { workspaceGid, date } = req.query as { workspaceGid: string; date: string };
      
      if (!workspaceGid) {
        return res.status(400).json({ error: 'ワークスペースGIDが必要です' });
      }

      const targetDate = date || new Date().toISOString().split('T')[0];
      
      const accessToken = await AsanaController.getUserAsanaToken(req.user!.id);
      const tasks = await AsanaService.getTasksInvolvedToday(accessToken, workspaceGid, targetDate);
      
      return res.json({ 
        data: tasks,
        targetDate,
        count: tasks.length
      });
    } catch (error) {
      console.error('Get involved tasks error:', error);
      
      if (error instanceof Error && error.message.includes('アクセストークンが見つかりません')) {
        return res.status(401).json({ 
          error: error.message,
          needsAuth: true
        });
      }
      
      return res.status(500).json({ error: '関わったタスクの取得に失敗しました' });
    }
  }

  // 特定のタスクをデバッグ
  static async debugTask(req: OptionalAuthenticatedRequest, res: Response) {
    try {
      if (!AsanaController.ensureUser(req)) {
        return res.status(401).json({ error: '認証が必要です' });
      }

      const { taskGid, date } = req.query as { taskGid: string; date: string };
      
      if (!taskGid) {
        return res.status(400).json({ error: 'タスクGIDが必要です' });
      }
      
      const targetDate = date || new Date().toISOString().split('T')[0];
      
      const accessToken = await AsanaController.getUserAsanaToken(req.user!.id);
      const debugResult = await AsanaService.debugSpecificTask(accessToken, taskGid, targetDate);
      
      return res.json(debugResult);
    } catch (error) {
      console.error('Debug task error:', error);
      
      if (error instanceof Error && error.message.includes('アクセストークンが見つかりません')) {
        return res.status(401).json({ 
          error: error.message,
          needsAuth: true
        });
      }
      
      return res.status(500).json({ error: 'タスクのデバッグに失敗しました' });
    }
  }

  // タスクを検索
  static async searchTasks(req: OptionalAuthenticatedRequest, res: Response) {
    try {
      if (!AsanaController.ensureUser(req)) {
        return res.status(401).json({ error: '認証が必要です' });
      }

      const { workspaceGid, query, searchType } = req.query as { 
        workspaceGid: string; 
        query: string; 
        searchType?: 'text' | 'url' 
      };
      
      if (!workspaceGid) {
        return res.status(400).json({ error: 'ワークスペースGIDが必要です' });
      }

      if (!query) {
        return res.status(400).json({ error: '検索キーワードが必要です' });
      }
      
      const accessToken = await AsanaController.getUserAsanaToken(req.user!.id);
      const tasks = await AsanaService.searchTasks(accessToken, workspaceGid, query, searchType);
      
      return res.json({ 
        data: tasks,
        query,
        searchType: searchType || 'text',
        count: tasks.length
      });
    } catch (error) {
      console.error('Search tasks error:', error);
      
      if (error instanceof Error && error.message.includes('アクセストークンが見つかりません')) {
        return res.status(401).json({ 
          error: error.message,
          needsAuth: true
        });
      }
      
      return res.status(500).json({ error: 'タスクの検索に失敗しました' });
    }
  }

  // ユーザーのAsanaアクセストークンを取得（プライベートメソッド）
  private static async getUserAsanaToken(userId: string): Promise<string | undefined> {
    // Personal Access Token使用時はユーザートークンを使用しない
    const usePersonalToken = process.env.ASANA_USE_PERSONAL_TOKEN === 'true';
    console.log('🔄 getUserAsanaToken - usePersonalToken:', usePersonalToken, 'userId:', userId);
    
    if (usePersonalToken) {
      console.log('🔑 Personal Access Token使用');
      return undefined; // AsanaServiceがPersonal Access Tokenを使用
    }

    // OAuth2モード：ユーザーのアクセストークンを使用
    console.log('🔄 データベースからユーザー情報を取得中...');
    const user = await UserModel.findById(userId);
    console.log('🔍 ユーザー情報:', user ? {
      id: user.id,
      email: user.email,
      hasAsanaToken: !!user.asanaAccessToken,
      asanaTokenLength: user.asanaAccessToken?.length || 0
    } : 'ユーザーが見つかりません');
    
    if (!user || !user.asanaAccessToken) {
      console.error('❌ Asanaアクセストークンが見つかりません');
      throw new Error('Asanaアクセストークンが見つかりません。認証を行ってください。');
    }
    
    console.log('✅ Asanaアクセストークンを取得しました');
    return user.asanaAccessToken;
  }
}