import { AuthService } from './auth';

export interface AsanaWorkspace {
  gid: string;
  name: string;
  resourceType: string;
}

export interface AsanaProject {
  gid: string;
  name: string;
  resourceType: string;
  color?: string;
  notes?: string;
}

export interface AsanaTask {
  gid: string;
  name: string;
  resourceType: string;
  notes?: string;
  completed: boolean;
  dueDate?: string;
  assignee?: {
    gid: string;
    name: string;
  };
  projects?: AsanaProject[];
  tags?: Array<{
    gid: string;
    name: string;
  }>;
}

export interface AsanaTaskConversion {
  taskName: string;
  taskType: '新規開発' | '定型業務' | '会議' | '突発的な作業' | 'その他';
  workHours: number;
  memo: string;
  asanaTaskId: string;
}

export class AsanaService {
  private static readonly API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  private static readonly BASE_URL = '/api/asana';

  // API呼び出し用のヘルパーメソッド
  private static async apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = AuthService.getToken();
    const url = `${this.API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || response.statusText || `HTTP error! status: ${response.status}`;
      
      // 401エラーの場合は認証が必要
      if (response.status === 401) {
        throw new Error('NEEDS_AUTH');
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Asana OAuth2認証を開始
  static async startAuthentication(): Promise<{ authUrl: string; message: string }> {
    try {
      return await this.apiCall(`${this.BASE_URL}/auth`);
    } catch (error) {
      console.error('Asana auth start error:', error);
      throw new Error(error instanceof Error ? error.message : 'Asana認証の開始に失敗しました');
    }
  }

  // ワークスペース一覧を取得
  static async getWorkspaces(): Promise<AsanaWorkspace[]> {
    try {
      const response = await this.apiCall(`${this.BASE_URL}/workspaces`);
      return response.data;
    } catch (error) {
      console.error('Get workspaces error:', error);
      if (error instanceof Error && (
        error.message.includes('401') || 
        error.message.includes('Unauthorized') ||
        error.message.includes('アクセストークンが見つかりません') ||
        error.message.includes('認証')
      )) {
        throw new Error('NEEDS_AUTH');
      }
      throw new Error(error instanceof Error ? error.message : 'ワークスペースの取得に失敗しました');
    }
  }

  // プロジェクト一覧を取得
  static async getProjects(workspaceGid: string): Promise<AsanaProject[]> {
    try {
      const response = await this.apiCall(`${this.BASE_URL}/workspaces/${workspaceGid}/projects`);
      return response.data;
    } catch (error) {
      console.error('Get projects error:', error);
      if (error instanceof Error && error.message.includes('401')) {
        throw new Error('NEEDS_AUTH');
      }
      throw new Error(error instanceof Error ? error.message : 'プロジェクトの取得に失敗しました');
    }
  }

  // 自分のタスク一覧を取得
  static async getMyTasks(
    workspaceGid: string,
    startDate?: string,
    endDate?: string
  ): Promise<AsanaTask[]> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const url = `${this.BASE_URL}/workspaces/${workspaceGid}/my-tasks?${params.toString()}`;
      const response = await this.apiCall(url);
      return response.data;
    } catch (error) {
      console.error('Get my tasks error:', error);
      if (error instanceof Error && error.message.includes('401')) {
        throw new Error('NEEDS_AUTH');
      }
      throw new Error(error instanceof Error ? error.message : '自分のタスクの取得に失敗しました');
    }
  }

  // プロジェクトのタスク一覧を取得
  static async getProjectTasks(
    projectGid: string,
    startDate?: string,
    endDate?: string
  ): Promise<AsanaTask[]> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const url = `${this.BASE_URL}/projects/${projectGid}/tasks?${params.toString()}`;
      const response = await this.apiCall(url);
      return response.data;
    } catch (error) {
      console.error('Get project tasks error:', error);
      if (error instanceof Error && error.message.includes('401')) {
        throw new Error('NEEDS_AUTH');
      }
      throw new Error(error instanceof Error ? error.message : 'プロジェクトのタスクの取得に失敗しました');
    }
  }

  // Asanaタスクを日報タスクに変換
  static async convertTasksToReportTasks(taskGids: string[]): Promise<{
    data: AsanaTaskConversion[];
    originalTasks: AsanaTask[];
    count: number;
  }> {
    try {
      const response = await this.apiCall(`${this.BASE_URL}/tasks/convert`, {
        method: 'POST',
        body: JSON.stringify({ taskGids }),
      });
      return response;
    } catch (error) {
      console.error('Convert tasks error:', error);
      if (error instanceof Error && error.message.includes('401')) {
        throw new Error('NEEDS_AUTH');
      }
      throw new Error(error instanceof Error ? error.message : 'タスクの変換に失敗しました');
    }
  }

  // Asana認証が必要かチェック
  static async checkAuthStatus(): Promise<boolean> {
    try {
      await this.getWorkspaces();
      return true;
    } catch (error) {
      if (error instanceof Error && error.message === 'NEEDS_AUTH') {
        return false;
      }
      throw error;
    }
  }

  // その日に関わったタスクを取得
  static async getTasksInvolvedToday(
    workspaceGid: string,
    date: string
  ): Promise<AsanaTask[]> {
    try {
      const params = new URLSearchParams();
      params.append('workspaceGid', workspaceGid);
      params.append('date', date);

      const url = `${this.BASE_URL}/tasks/involved-today?${params.toString()}`;
      const response = await this.apiCall(url);
      return response.data;
    } catch (error) {
      console.error('Get involved tasks error:', error);
      if (error instanceof Error && error.message.includes('401')) {
        throw new Error('NEEDS_AUTH');
      }
      throw new Error(error instanceof Error ? error.message : '関わったタスクの取得に失敗しました');
    }
  }

  // タスクを検索
  static async searchTasks(
    workspaceGid: string,
    query: string,
    searchType: 'text' | 'url' = 'text'
  ): Promise<AsanaTask[]> {
    try {
      const params = new URLSearchParams();
      params.append('workspaceGid', workspaceGid);
      params.append('query', query);
      params.append('searchType', searchType);

      const url = `${this.BASE_URL}/tasks/search?${params.toString()}`;
      const response = await this.apiCall(url);
      return response.data;
    } catch (error) {
      console.error('Search tasks error:', error);
      if (error instanceof Error && error.message.includes('401')) {
        throw new Error('NEEDS_AUTH');
      }
      throw new Error(error instanceof Error ? error.message : 'タスクの検索に失敗しました');
    }
  }
}