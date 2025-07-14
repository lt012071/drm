import { DailyReport, CreateDailyReportRequest, CreateTaskData } from '../types/dailyReport';

let mockReports: DailyReport[] = [];
let initialized = false;

// モックデータの初期化
async function initializeMockData(): Promise<void> {
  if (initialized) return;
  
  try {
    const response = await fetch('/mock-reports.json');
    const data = await response.json();
    mockReports = data.data;
    initialized = true;
    console.log('Mock data initialized:', mockReports.length, 'reports loaded');
  } catch (error) {
    console.error('Failed to load mock data:', error);
    mockReports = [];
    initialized = true;
  }
}

export class MockDailyReportService {
  // 日報作成・更新
  static async createOrUpdate(data: CreateDailyReportRequest): Promise<DailyReport> {
    await initializeMockData();
    
    console.log('Mock createOrUpdate called:', data);
    
    // 既存の日報を検索
    const existingIndex = mockReports.findIndex(r => r.reportDate === data.reportDate);
    
    if (existingIndex !== -1) {
      // 更新
      mockReports[existingIndex] = {
        ...mockReports[existingIndex],
        remarks: data.remarks,
        tasks: data.tasks.map((task, index) => ({
          id: `task-${Date.now()}-${index}`,
          dailyReportId: mockReports[existingIndex].id!,
          taskName: task.taskName,
          taskType: task.taskType,
          workHours: task.workHours,
          memo: task.memo || '',
          asanaTaskId: task.asanaTaskId,
          googleCalendarEventId: task.googleCalendarEventId
        })),
        updatedAt: new Date().toISOString()
      };
      
      console.log('Updated report:', mockReports[existingIndex]);
      return mockReports[existingIndex];
    } else {
      // 新規作成
      const newReport: DailyReport = {
        id: `report-${Date.now()}`,
        userId: 'user-123',
        reportDate: data.reportDate,
        remarks: data.remarks || '',
        tasks: data.tasks.map((task, index) => ({
          id: `task-${Date.now()}-${index}`,
          dailyReportId: `report-${Date.now()}`,
          taskName: task.taskName,
          taskType: task.taskType,
          workHours: task.workHours,
          memo: task.memo || '',
          asanaTaskId: task.asanaTaskId,
          googleCalendarEventId: task.googleCalendarEventId
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      mockReports.push(newReport);
      console.log('Created new report:', newReport);
      return newReport;
    }
  }

  // 今日の日報取得
  static async getToday(): Promise<DailyReport | null> {
    await initializeMockData();
    
    const today = this.formatDateString(new Date());
    const report = mockReports.find(r => r.reportDate === today);
    
    console.log('Mock getToday:', today, report ? 'found' : 'not found');
    return report || null;
  }

  // 日報取得（日付指定）
  static async getByDate(date: string): Promise<DailyReport | null> {
    await initializeMockData();
    
    const report = mockReports.find(r => r.reportDate === date);
    
    console.log('Mock getByDate:', date, report ? 'found' : 'not found');
    return report || null;
  }

  // 日報一覧取得（期間指定）
  static async getByDateRange(startDate: string, endDate: string): Promise<DailyReport[]> {
    await initializeMockData();
    
    const filteredReports = mockReports.filter(r => {
      return r.reportDate >= startDate && r.reportDate <= endDate;
    }).sort((a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime());
    
    console.log('Mock getByDateRange:', { startDate, endDate }, 'found:', filteredReports.length);
    return filteredReports;
  }

  // 日報削除
  static async delete(id: string): Promise<void> {
    await initializeMockData();
    
    const index = mockReports.findIndex(r => r.id === id);
    if (index !== -1) {
      mockReports.splice(index, 1);
      console.log('Mock delete:', id, 'success');
    } else {
      console.log('Mock delete:', id, 'not found');
      throw new Error('削除対象の日報が見つかりません');
    }
  }

  // 統計情報取得
  static async getStats(startDate: string, endDate: string) {
    await initializeMockData();
    
    const filteredReports = mockReports.filter(r => {
      return r.reportDate >= startDate && r.reportDate <= endDate;
    });
    
    const stats = {
      totalReports: filteredReports.length,
      totalHours: filteredReports.reduce((sum, r) => 
        sum + r.tasks.reduce((taskSum, t) => taskSum + t.workHours, 0), 0),
      totalTasks: filteredReports.reduce((sum, r) => sum + r.tasks.length, 0)
    };
    
    console.log('Mock getStats:', { startDate, endDate }, stats);
    return stats;
  }

  // 今月の日報一覧取得
  static async getCurrentMonth(): Promise<DailyReport[]> {
    const now = new Date();
    const startDate = this.formatDateString(new Date(now.getFullYear(), now.getMonth(), 1));
    const endDate = this.formatDateString(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    
    return this.getByDateRange(startDate, endDate);
  }

  // 今週の日報一覧取得
  static async getCurrentWeek(): Promise<DailyReport[]> {
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
    await initializeMockData();
    
    // 前日の日付を計算
    const targetDate = new Date(date);
    targetDate.setDate(targetDate.getDate() - 1);
    const previousDate = this.formatDateString(targetDate);
    
    const previousReport = mockReports.find(
      report => report.reportDate === previousDate
    );
    
    if (!previousReport || !previousReport.tasks || previousReport.tasks.length === 0) {
      return {
        data: [],
        previousDate,
        originalTaskCount: 0,
        copiedTaskCount: 0,
        message: '前日のタスクが見つかりません'
      };
    }
    
    // Googleカレンダーと連携したタスクは除外
    const filteredTasks = previousReport.tasks
      .filter(task => !task.googleCalendarEventId)
      .map(task => ({
        taskName: task.taskName,
        taskType: task.taskType,
        workHours: task.workHours,
        memo: task.memo || '',
        // 外部連携IDはコピーしない
        asanaTaskId: undefined,
        googleCalendarEventId: undefined
      }));
    
    return {
      data: filteredTasks,
      previousDate,
      originalTaskCount: previousReport.tasks.length,
      copiedTaskCount: filteredTasks.length
    };
  }

  // ローカルタイムゾーンで日付文字列を取得
  private static formatDateString(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}