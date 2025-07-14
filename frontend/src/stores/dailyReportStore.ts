import { create } from 'zustand';
import { DailyReport } from '../types/dailyReport';
import { DailyReportService } from '../services/dailyReportService';

interface DailyReportState {
  currentReport: DailyReport | null;
  reports: DailyReport[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadTodayReport: () => Promise<void>;
  loadReportByDate: (date: string) => Promise<void>;
  loadReports: (startDate: string, endDate: string) => Promise<void>;
  saveReport: (report: DailyReport) => Promise<void>;
  deleteReport: (id: string) => Promise<void>;
  clearError: () => void;
  setCurrentReport: (report: DailyReport | null) => void;
  refreshReports: () => Promise<void>;
  forceRefresh: (year: number, month: number) => Promise<void>;
}

export const useDailyReportStore = create<DailyReportState>((set, get) => ({
  currentReport: null,
  reports: [],
  isLoading: false,
  error: null,

  loadTodayReport: async () => {
    set({ isLoading: true, error: null });
    try {
      const report = await DailyReportService.getToday();
      set({ currentReport: report, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '今日の日報取得に失敗しました',
        isLoading: false 
      });
    }
  },

  loadReportByDate: async (date: string) => {
    set({ isLoading: true, error: null });
    try {
      const report = await DailyReportService.getByDate(date);
      set({ currentReport: report, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '日報の取得に失敗しました',
        isLoading: false 
      });
    }
  },

  loadReports: async (startDate: string, endDate: string) => {
    set({ isLoading: true, error: null });
    try {
      const reports = await DailyReportService.getByDateRange(startDate, endDate);
      set({ reports, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '日報一覧の取得に失敗しました',
        isLoading: false 
      });
    }
  },

  saveReport: async (report: DailyReport) => {
    set({ isLoading: true, error: null });
    try {
      const savedReport = await DailyReportService.createOrUpdate({
        reportDate: report.reportDate,
        remarks: report.remarks,
        tasks: report.tasks
      });
      
      set({ 
        currentReport: savedReport, 
        isLoading: false 
      });
      
      // 既存のレポート一覧も更新
      const { reports } = get();
      const updatedReports = reports.map(r => 
        r.reportDate === savedReport.reportDate ? savedReport : r
      );
      
      // 新規の場合は追加
      if (!reports.find(r => r.reportDate === savedReport.reportDate)) {
        updatedReports.push(savedReport);
        updatedReports.sort((a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime());
      }
      
      set({ reports: updatedReports });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '日報の保存に失敗しました',
        isLoading: false 
      });
      throw error;
    }
  },

  deleteReport: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await DailyReportService.delete(id);
      
      const { reports } = get();
      const updatedReports = reports.filter(r => r.id !== id);
      
      set({ 
        reports: updatedReports,
        currentReport: null,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '日報の削除に失敗しました',
        isLoading: false 
      });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },

  setCurrentReport: (report: DailyReport | null) => {
    set({ currentReport: report });
  },

  refreshReports: async () => {
    const { loadReports } = get();
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const formatDateString = (date: Date): string => {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    await loadReports(formatDateString(startDate), formatDateString(endDate));
  },

  forceRefresh: async (year: number, month: number) => {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    
    const formatDateString = (date: Date): string => {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    // 強制的にキャッシュをクリアしてから再取得
    set({ reports: [], isLoading: true, error: null });
    
    try {
      console.log('Force refreshing reports for:', formatDateString(startDate), 'to', formatDateString(endDate));
      const reports = await DailyReportService.getByDateRange(formatDateString(startDate), formatDateString(endDate));
      console.log('Force refresh result:', reports);
      set({ reports, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '日報一覧の取得に失敗しました',
        isLoading: false 
      });
    }
  }
}));