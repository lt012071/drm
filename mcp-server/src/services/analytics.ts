import { DRMDatabase } from './database.js';

export interface ProductivityAnalysis {
  userId: string;
  period: string;
  totalHours: number;
  totalTasks: number;
  averageHoursPerDay: number;
  averageTasksPerDay: number;
  taskTypeDistribution: TaskTypeDistribution[];
  productivity: {
    score: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    insights: string[];
  };
  workPatterns: {
    mostProductiveDay: string;
    averageSessionLength: number;
    taskCompletionRate: number;
  };
}

export interface TaskTypeDistribution {
  taskType: string;
  count: number;
  hours: number;
  percentage: number;
}

export interface TeamStatistics {
  period: string;
  teamId?: string;
  totalMembers: number;
  totalHours: number;
  totalTasks: number;
  averageHoursPerMember: number;
  topPerformers: {
    userId: string;
    userName: string;
    totalHours: number;
    totalTasks: number;
  }[];
  taskTypeDistribution: TaskTypeDistribution[];
  insights: string[];
}

export class DRMAnalytics {
  constructor(private database: DRMDatabase) {}

  async analyzeProductivity(userId: string, period: string): Promise<ProductivityAnalysis> {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = this.getStartDate(period);
    
    // ユーザーの活動データを取得
    const activity = await this.database.getUserActivity(userId, period);
    const taskStats = await this.database.getTaskStatistics(userId, startDate, endDate);
    
    // 基本統計の計算
    const totalHours = activity.reduce((sum, day) => sum + (day.total_hours || 0), 0);
    const totalTasks = activity.reduce((sum, day) => sum + (day.task_count || 0), 0);
    const activeDays = activity.filter(day => day.task_count > 0).length;
    
    const averageHoursPerDay = activeDays > 0 ? totalHours / activeDays : 0;
    const averageTasksPerDay = activeDays > 0 ? totalTasks / activeDays : 0;
    
    // タスク種別分布の計算
    const totalTaskHours = taskStats.reduce((sum, stat) => sum + parseFloat(stat.total_hours), 0);
    const taskTypeDistribution: TaskTypeDistribution[] = taskStats.map(stat => ({
      taskType: stat.task_type,
      count: parseInt(stat.task_count),
      hours: parseFloat(stat.total_hours),
      percentage: totalTaskHours > 0 ? (parseFloat(stat.total_hours) / totalTaskHours) * 100 : 0,
    }));
    
    // 生産性スコアの計算
    const productivity = this.calculateProductivityScore(activity, totalHours, totalTasks, activeDays);
    
    // 作業パターンの分析
    const workPatterns = this.analyzeWorkPatterns(activity);
    
    return {
      userId,
      period,
      totalHours,
      totalTasks,
      averageHoursPerDay,
      averageTasksPerDay,
      taskTypeDistribution,
      productivity,
      workPatterns,
    };
  }

  async getTeamStatistics(period: string, teamId?: string): Promise<TeamStatistics> {
    const teamActivity = await this.database.getTeamActivity(period, teamId);
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = this.getStartDate(period);
    const taskStats = await this.database.getTaskStatistics(undefined, startDate, endDate);
    
    const totalMembers = teamActivity.length;
    const totalHours = teamActivity.reduce((sum, member) => sum + (member.total_hours || 0), 0);
    const totalTasks = teamActivity.reduce((sum, member) => sum + (member.task_count || 0), 0);
    const averageHoursPerMember = totalMembers > 0 ? totalHours / totalMembers : 0;
    
    // トップパフォーマーの特定
    const topPerformers = teamActivity
      .sort((a, b) => (b.total_hours || 0) - (a.total_hours || 0))
      .slice(0, 5)
      .map(member => ({
        userId: member.user_id,
        userName: member.user_name || 'Unknown',
        totalHours: member.total_hours || 0,
        totalTasks: member.task_count || 0,
      }));
    
    // タスク種別分布
    const totalTaskHours = taskStats.reduce((sum, stat) => sum + parseFloat(stat.total_hours), 0);
    const taskTypeDistribution: TaskTypeDistribution[] = taskStats.map(stat => ({
      taskType: stat.task_type,
      count: parseInt(stat.task_count),
      hours: parseFloat(stat.total_hours),
      percentage: totalTaskHours > 0 ? (parseFloat(stat.total_hours) / totalTaskHours) * 100 : 0,
    }));
    
    // インサイトの生成
    const insights = this.generateTeamInsights(teamActivity, taskTypeDistribution);
    
    return {
      period,
      teamId,
      totalMembers,
      totalHours,
      totalTasks,
      averageHoursPerMember,
      topPerformers,
      taskTypeDistribution,
      insights,
    };
  }

  async generateReport(
    reportType: string,
    targetId: string,
    startDate: string,
    endDate: string,
    format: string = 'summary'
  ): Promise<any> {
    switch (reportType) {
      case 'individual':
        return await this.generateIndividualReport(targetId, startDate, endDate, format);
      case 'team':
        return await this.generateTeamReport(targetId, startDate, endDate, format);
      case 'project':
        return await this.generateProjectReport(targetId, startDate, endDate, format);
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }
  }

  async getInsights(userId: string, insightType: string, period: string): Promise<any> {
    const analysis = await this.analyzeProductivity(userId, period);
    
    switch (insightType) {
      case 'productivity':
        return this.generateProductivityInsights(analysis);
      case 'workload':
        return this.generateWorkloadInsights(analysis);
      case 'patterns':
        return this.generatePatternInsights(analysis);
      case 'recommendations':
        return this.generateRecommendations(analysis);
      default:
        throw new Error(`Unknown insight type: ${insightType}`);
    }
  }

  private getStartDate(period: string): string {
    const now = new Date();
    switch (period) {
      case 'week':
        now.setDate(now.getDate() - 7);
        break;
      case 'month':
        now.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        now.setMonth(now.getMonth() - 3);
        break;
      default:
        now.setMonth(now.getMonth() - 1);
    }
    return now.toISOString().split('T')[0];
  }

  private calculateProductivityScore(activity: any[], totalHours: number, totalTasks: number, activeDays: number) {
    // 生産性スコアの計算（0-100）
    let score = 0;
    
    // 作業時間の一貫性（30点）
    const hoursConsistency = this.calculateConsistency(activity.map(d => d.total_hours || 0));
    score += hoursConsistency * 30;
    
    // タスク完了率（30点）
    const taskEfficiency = activeDays > 0 ? Math.min(totalTasks / activeDays / 5, 1) : 0; // 1日5タスクを目標
    score += taskEfficiency * 30;
    
    // 作業時間の適正性（40点）
    const averageDaily = activeDays > 0 ? totalHours / activeDays : 0;
    const hoursScore = averageDaily >= 6 && averageDaily <= 9 ? 1 : Math.max(0, 1 - Math.abs(averageDaily - 7.5) / 7.5);
    score += hoursScore * 40;
    
    // トレンドの分析
    const recentActivity = activity.slice(-7); // 最近1週間
    const olderActivity = activity.slice(0, -7);
    const recentAvg = recentActivity.reduce((sum, d) => sum + (d.total_hours || 0), 0) / recentActivity.length;
    const olderAvg = olderActivity.length > 0 ? olderActivity.reduce((sum, d) => sum + (d.total_hours || 0), 0) / olderActivity.length : recentAvg;
    
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (recentAvg > olderAvg * 1.1) trend = 'increasing';
    else if (recentAvg < olderAvg * 0.9) trend = 'decreasing';
    
    // インサイトの生成
    const insights: string[] = [];
    if (score >= 80) insights.push('優秀な生産性を維持しています');
    else if (score >= 60) insights.push('良好な作業ペースです');
    else if (score >= 40) insights.push('改善の余地があります');
    else insights.push('作業パターンの見直しが必要です');
    
    if (trend === 'increasing') insights.push('生産性が向上傾向にあります');
    else if (trend === 'decreasing') insights.push('生産性が低下傾向にあります');
    
    return {
      score: Math.round(score),
      trend,
      insights,
    };
  }

  private calculateConsistency(values: number[]): number {
    if (values.length <= 1) return 1;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);
    
    // 標準偏差が小さいほど一貫性が高い（0-1の範囲に正規化）
    return Math.max(0, 1 - standardDeviation / (mean || 1));
  }

  private analyzeWorkPatterns(activity: any[]) {
    const activeDays = activity.filter(day => day.task_count > 0);
    
    // 最も生産的な曜日
    const dayOfWeekHours: { [key: number]: number } = {};
    activeDays.forEach(day => {
      const dayOfWeek = new Date(day.date).getDay();
      dayOfWeekHours[dayOfWeek] = (dayOfWeekHours[dayOfWeek] || 0) + (day.total_hours || 0);
    });
    
    const mostProductiveDay = Object.entries(dayOfWeekHours)
      .sort(([, a], [, b]) => b - a)[0]?.[0];
    
    const dayNames = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
    
    // 平均セッション長（仮の計算）
    const averageSessionLength = activeDays.length > 0 
      ? activeDays.reduce((sum, day) => sum + (day.total_hours || 0), 0) / activeDays.length
      : 0;
    
    // タスク完了率（簡易計算）
    const taskCompletionRate = activeDays.length > 0 ? 
      Math.min(activeDays.reduce((sum, day) => sum + (day.task_count || 0), 0) / (activeDays.length * 5), 1) : 0;
    
    return {
      mostProductiveDay: mostProductiveDay ? dayNames[parseInt(mostProductiveDay)] : '不明',
      averageSessionLength: Math.round(averageSessionLength * 100) / 100,
      taskCompletionRate: Math.round(taskCompletionRate * 100),
    };
  }

  private generateTeamInsights(teamActivity: any[], taskTypeDistribution: TaskTypeDistribution[]): string[] {
    const insights: string[] = [];
    
    // チーム全体の分析
    const totalMembers = teamActivity.length;
    const activeMembers = teamActivity.filter(m => m.total_hours > 0).length;
    
    if (activeMembers / totalMembers < 0.8) {
      insights.push(`チームメンバーの${Math.round((1 - activeMembers / totalMembers) * 100)}%が非アクティブです`);
    }
    
    // タスク種別の分析
    const developmentTasks = taskTypeDistribution.find(t => t.taskType === '新規開発');
    if (developmentTasks && developmentTasks.percentage > 50) {
      insights.push('新規開発タスクが全体の50%以上を占めています');
    }
    
    const meetingTasks = taskTypeDistribution.find(t => t.taskType === '会議');
    if (meetingTasks && meetingTasks.percentage > 30) {
      insights.push('会議時間が全体の30%以上を占めています - 効率化を検討してください');
    }
    
    return insights;
  }

  private async generateIndividualReport(userId: string, startDate: string, endDate: string, format: string) {
    const reports = await this.database.getDailyReports(userId, startDate, endDate);
    const period = this.getPeriodFromDates(startDate, endDate);
    const analysis = await this.analyzeProductivity(userId, period);
    
    if (format === 'json') {
      return {
        type: 'individual',
        userId,
        period: { startDate, endDate },
        reports,
        analysis,
        summary: {
          totalDays: reports.length,
          totalHours: analysis.totalHours,
          totalTasks: analysis.totalTasks,
        },
      };
    }
    
    if (format === 'markdown') {
      return this.generateMarkdownReport('individual', { reports, analysis, userId, startDate, endDate });
    }
    
    // summary format
    return `個人レポート（${startDate} - ${endDate}）\n` +
           `ユーザー: ${userId}\n` +
           `総作業時間: ${analysis.totalHours}時間\n` +
           `総タスク数: ${analysis.totalTasks}件\n` +
           `生産性スコア: ${analysis.productivity.score}/100\n` +
           `トレンド: ${analysis.productivity.trend}`;
  }

  private async generateTeamReport(teamId: string, startDate: string, endDate: string, format: string) {
    const period = this.getPeriodFromDates(startDate, endDate);
    const stats = await this.getTeamStatistics(period, teamId);
    
    if (format === 'json') {
      return {
        type: 'team',
        teamId,
        period: { startDate, endDate },
        stats,
      };
    }
    
    return `チームレポート（${startDate} - ${endDate}）\n` +
           `チーム: ${teamId}\n` +
           `メンバー数: ${stats.totalMembers}人\n` +
           `総作業時間: ${stats.totalHours}時間\n` +
           `平均時間/人: ${stats.averageHoursPerMember.toFixed(1)}時間`;
  }

  private async generateProjectReport(projectId: string, startDate: string, endDate: string, format: string) {
    // プロジェクトレポートの実装（今回は簡易版）
    return `プロジェクトレポート（${projectId}）は開発中です`;
  }

  private generateProductivityInsights(analysis: ProductivityAnalysis) {
    return {
      score: analysis.productivity.score,
      level: analysis.productivity.score >= 80 ? '高' : analysis.productivity.score >= 60 ? '中' : '低',
      insights: analysis.productivity.insights,
      recommendations: this.generateProductivityRecommendations(analysis),
    };
  }

  private generateWorkloadInsights(analysis: ProductivityAnalysis) {
    const averageDaily = analysis.averageHoursPerDay;
    let workloadLevel = '適正';
    let recommendations: string[] = [];
    
    if (averageDaily > 9) {
      workloadLevel = '過重';
      recommendations.push('作業時間が長すぎます。休息時間を確保してください');
    } else if (averageDaily < 4) {
      workloadLevel = '軽微';
      recommendations.push('作業時間が短すぎる可能性があります');
    }
    
    return {
      averageHoursPerDay: averageDaily,
      level: workloadLevel,
      recommendations,
    };
  }

  private generatePatternInsights(analysis: ProductivityAnalysis) {
    return {
      mostProductiveDay: analysis.workPatterns.mostProductiveDay,
      averageSessionLength: analysis.workPatterns.averageSessionLength,
      taskTypePreferences: analysis.taskTypeDistribution
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 3),
    };
  }

  private generateRecommendations(analysis: ProductivityAnalysis): string[] {
    const recommendations: string[] = [];
    
    if (analysis.productivity.score < 60) {
      recommendations.push('作業パターンの見直しを検討してください');
    }
    
    if (analysis.averageHoursPerDay > 8) {
      recommendations.push('作業時間の短縮を検討してください');
    }
    
    const meetingTasks = analysis.taskTypeDistribution.find(t => t.taskType === '会議');
    if (meetingTasks && meetingTasks.percentage > 25) {
      recommendations.push('会議時間の最適化を検討してください');
    }
    
    return recommendations;
  }

  private generateProductivityRecommendations(analysis: ProductivityAnalysis): string[] {
    const recommendations: string[] = [];
    
    if (analysis.productivity.trend === 'decreasing') {
      recommendations.push('生産性が低下傾向にあります。作業環境の見直しを検討してください');
    }
    
    if (analysis.workPatterns.taskCompletionRate < 70) {
      recommendations.push('タスクの細分化や優先順位付けを見直してください');
    }
    
    return recommendations;
  }

  private getPeriodFromDates(startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
    
    if (diffDays <= 7) return 'week';
    if (diffDays <= 31) return 'month';
    return 'quarter';
  }

  private generateMarkdownReport(type: string, data: any): string {
    // Markdownレポートの生成（簡易版）
    return `# ${type}レポート\n\n` +
           `期間: ${data.startDate} - ${data.endDate}\n\n` +
           `## 概要\n\n` +
           `詳細なMarkdownレポートは開発中です。`;
  }
}