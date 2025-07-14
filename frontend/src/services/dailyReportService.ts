import { 
  DailyReport, 
  CreateDailyReportRequest, 
  CreateTaskData,
  DailyReportResponse,
  DailyReportListResponse,
  DailyReportStatsResponse
} from '../types/dailyReport';
import { AuthService } from './auth';
import { MockDailyReportService } from './mockDailyReportService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const useMockService = import.meta.env.VITE_USE_MOCK_SERVICE === 'true';

export class DailyReportService {
  // 日付を YYYY-MM-DD 形式に正規化
  private static normalizeDateString(dateString: string): string {
    if (!dateString) {
      return dateString;
    }
    
    // ISO形式の場合は日付部分のみ抽出
    if (dateString.includes('T')) {
      return dateString.split('T')[0];
    }
    
    return dateString;
  }
  private static getHeaders() {
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };
    
    // 認証をスキップしない場合のみ認証ヘッダーを追加
    if (import.meta.env.VITE_SKIP_AUTH !== 'true') {
      const token = AuthService.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    return headers;
  }

  // 日報作成・更新
  static async createOrUpdate(data: CreateDailyReportRequest): Promise<DailyReport> {
    if (useMockService) {
      console.log('🧪 Using mock service for createOrUpdate');
      return MockDailyReportService.createOrUpdate(data);
    }
    
    try {
      console.log('Sending daily report data:', data);
      console.log('API URL:', `${API_BASE_URL}/api/daily-reports`);
      
      const response = await fetch(`${API_BASE_URL}/api/daily-reports`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        try {
          const error = JSON.parse(errorText);
          throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
        } catch {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      const result: DailyReportResponse = await response.json();
      return result.data;
    } catch (error) {
      console.error('Create/Update daily report error:', error);
      throw error;
    }
  }

  // 今日の日報取得
  static async getToday(): Promise<DailyReport | null> {
    if (useMockService) {
      console.log('🧪 Using mock service for getToday');
      return MockDailyReportService.getToday();
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/daily-reports/today`, {
        headers: this.getHeaders(),
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error('今日の日報取得に失敗しました');
      }

      const result = await response.json();
      
      // 日付フォーマットを統一
      if (result.data) {
        return {
          ...result.data,
          reportDate: this.normalizeDateString(result.data.reportDate)
        };
      }
      
      return result.data;
    } catch (error) {
      console.error('Get today report error:', error);
      throw error;
    }
  }

  // 日報取得（日付指定）
  static async getByDate(date: string): Promise<DailyReport | null> {
    if (useMockService) {
      console.log('🧪 Using mock service for getByDate:', date);
      return MockDailyReportService.getByDate(date);
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/daily-reports/${date}`, {
        headers: this.getHeaders(),
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error('日報の取得に失敗しました');
      }

      const result: DailyReportResponse = await response.json();
      
      // 日付フォーマットを統一
      if (result.data) {
        return {
          ...result.data,
          reportDate: this.normalizeDateString(result.data.reportDate)
        };
      }
      
      return result.data;
    } catch (error) {
      console.error('Get daily report error:', error);
      throw error;
    }
  }

  // 日報一覧取得（期間指定）
  static async getByDateRange(startDate: string, endDate: string): Promise<DailyReport[]> {
    if (useMockService) {
      console.log('🧪 Using mock service for getByDateRange:', { startDate, endDate });
      return MockDailyReportService.getByDateRange(startDate, endDate);
    }
    
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
      });

      const response = await fetch(`${API_BASE_URL}/api/daily-reports?${params}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('日報一覧の取得に失敗しました');
      }

      const result: DailyReportListResponse = await response.json();
      
      // 日付フォーマットを統一（ISO文字列を YYYY-MM-DD 形式に変換）
      const normalizedData = result.data.map(report => {
        // report_date フィールドを reportDate に変換
        const dateField = report.reportDate || (report as any).report_date;
        
        // タスクデータのフィールド名も統一
        const normalizedTasks = report.tasks?.map(task => ({
          ...task,
          taskName: task.taskName || (task as any).task_name,
          taskType: task.taskType || (task as any).task_type,
          workHours: task.workHours !== undefined ? task.workHours : (task as any).work_hours
        })) || [];
        
        return {
          ...report,
          reportDate: this.normalizeDateString(dateField),
          tasks: normalizedTasks
        };
      });
      
      return normalizedData;
    } catch (error) {
      console.error('Get daily reports error:', error);
      throw error;
    }
  }

  // 日報削除
  static async delete(id: string): Promise<void> {
    if (useMockService) {
      console.log('🧪 Using mock service for delete:', id);
      return MockDailyReportService.delete(id);
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/daily-reports/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '日報の削除に失敗しました');
      }
    } catch (error) {
      console.error('Delete daily report error:', error);
      throw error;
    }
  }

  // 統計情報取得
  static async getStats(startDate: string, endDate: string) {
    if (useMockService) {
      console.log('🧪 Using mock service for getStats:', { startDate, endDate });
      return MockDailyReportService.getStats(startDate, endDate);
    }
    
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
      });

      const response = await fetch(`${API_BASE_URL}/api/daily-reports/stats?${params}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('統計情報の取得に失敗しました');
      }

      const result: DailyReportStatsResponse = await response.json();
      return result.data;
    } catch (error) {
      console.error('Get stats error:', error);
      throw error;
    }
  }

  // ローカルタイムゾーンで日付文字列を取得
  private static formatDateString(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 今月の日報一覧取得（便利メソッド）
  static async getCurrentMonth(): Promise<DailyReport[]> {
    if (useMockService) {
      console.log('🧪 Using mock service for getCurrentMonth');
      return MockDailyReportService.getCurrentMonth();
    }
    
    const now = new Date();
    const startDate = this.formatDateString(new Date(now.getFullYear(), now.getMonth(), 1));
    const endDate = this.formatDateString(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    
    return this.getByDateRange(startDate, endDate);
  }

  // 今週の日報一覧取得（便利メソッド）
  static async getCurrentWeek(): Promise<DailyReport[]> {
    if (useMockService) {
      console.log('🧪 Using mock service for getCurrentWeek');
      return MockDailyReportService.getCurrentWeek();
    }
    
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const startDate = this.formatDateString(monday);
    const endDate = this.formatDateString(sunday);
    
    return this.getByDateRange(startDate, endDate);
  }

  // 前日のタスクを取得（コピー用）
  static async getPreviousTasks(date: string): Promise<{
    data: CreateTaskData[];
    previousDate: string;
    originalTaskCount: number;
    copiedTaskCount: number;
    message?: string;
  }> {
    if (useMockService) {
      console.log('🧪 Using mock service for getPreviousTasks:', { date });
      return MockDailyReportService.getPreviousTasks(date);
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/daily-reports/${date}/previous-tasks`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('前日のタスク取得に失敗しました');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Get previous tasks error:', error);
      throw error;
    }
  }
}