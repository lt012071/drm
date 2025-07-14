import { pool } from '../config/database';

export interface WorkTimeStats {
  date: string;
  totalHours: number;
  taskCount: number;
  taskTypes: {
    [key: string]: {
      hours: number;
      count: number;
    };
  };
}

export interface MonthlyReport {
  year: number;
  month: number;
  totalWorkDays: number;
  totalHours: number;
  averageHoursPerDay: number;
  taskTypeBreakdown: {
    [taskType: string]: {
      totalHours: number;
      percentage: number;
      taskCount: number;
    };
  };
  dailyStats: WorkTimeStats[];
}

export interface TeamReport {
  period: {
    startDate: string;
    endDate: string;
  };
  members: Array<{
    userId: string;
    userName: string;
    totalHours: number;
    workDays: number;
    averageHoursPerDay: number;
    taskTypeBreakdown: {
      [taskType: string]: number;
    };
  }>;
  teamTotals: {
    totalHours: number;
    totalTasks: number;
    averageHoursPerMember: number;
    taskTypeBreakdown: {
      [taskType: string]: {
        totalHours: number;
        percentage: number;
      };
    };
  };
}

export class ReportService {
  // 個人の月次レポート取得
  static async getMonthlyReport(userId: string, year: number, month: number): Promise<MonthlyReport> {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // 日別統計取得
      const dailyStatsQuery = `
        SELECT 
          dr.report_date,
          COALESCE(SUM(t.work_hours), 0) as total_hours,
          COUNT(t.id) as task_count,
          json_object_agg(
            COALESCE(t.task_type, 'なし'), 
            json_build_object(
              'hours', COALESCE(SUM(t.work_hours), 0),
              'count', COUNT(t.id)
            )
          ) FILTER (WHERE t.id IS NOT NULL) as task_types
        FROM daily_reports dr
        LEFT JOIN tasks t ON dr.id = t.daily_report_id
        WHERE dr.user_id = $1 AND dr.report_date BETWEEN $2 AND $3
        GROUP BY dr.report_date
        ORDER BY dr.report_date
      `;

      const dailyResult = await pool.query(dailyStatsQuery, [userId, startDateStr, endDateStr]);
      
      // 全体統計取得
      const totalStatsQuery = `
        SELECT 
          COUNT(DISTINCT dr.report_date) as total_work_days,
          COALESCE(SUM(t.work_hours), 0) as total_hours,
          t.task_type,
          COALESCE(SUM(t.work_hours), 0) as type_hours,
          COUNT(t.id) as type_count
        FROM daily_reports dr
        LEFT JOIN tasks t ON dr.id = t.daily_report_id
        WHERE dr.user_id = $1 AND dr.report_date BETWEEN $2 AND $3
        GROUP BY t.task_type
      `;

      const totalResult = await pool.query(totalStatsQuery, [userId, startDateStr, endDateStr]);
      
      // 結果の整形
      const dailyStats: WorkTimeStats[] = dailyResult.rows.map(row => ({
        date: row.report_date,
        totalHours: parseFloat(row.total_hours || '0'),
        taskCount: parseInt(row.task_count || '0'),
        taskTypes: row.task_types || {}
      }));

      const totalHours = totalResult.rows.reduce((sum, row) => sum + parseFloat(row.type_hours || '0'), 0);
      const totalWorkDays = Math.max(1, dailyStats.filter(d => d.totalHours > 0).length);

      const taskTypeBreakdown: { [key: string]: any } = {};
      totalResult.rows.forEach(row => {
        if (row.task_type) {
          const hours = parseFloat(row.type_hours || '0');
          taskTypeBreakdown[row.task_type] = {
            totalHours: hours,
            percentage: totalHours > 0 ? Math.round((hours / totalHours) * 100) : 0,
            taskCount: parseInt(row.type_count || '0')
          };
        }
      });

      return {
        year,
        month,
        totalWorkDays,
        totalHours,
        averageHoursPerDay: totalHours / totalWorkDays,
        taskTypeBreakdown,
        dailyStats
      };
    } catch (error) {
      console.error('Get monthly report error:', error);
      throw new Error('月次レポートの取得に失敗しました');
    }
  }

  // チームレポート取得（管理者用）
  static async getTeamReport(startDate: string, endDate: string): Promise<TeamReport> {
    try {
      // メンバー別統計取得
      const memberStatsQuery = `
        SELECT 
          u.id as user_id,
          u.name as user_name,
          COUNT(DISTINCT dr.report_date) as work_days,
          COALESCE(SUM(t.work_hours), 0) as total_hours,
          t.task_type,
          COALESCE(SUM(t.work_hours), 0) as type_hours
        FROM users u
        LEFT JOIN daily_reports dr ON u.id = dr.user_id 
          AND dr.report_date BETWEEN $1 AND $2
        LEFT JOIN tasks t ON dr.id = t.daily_report_id
        WHERE u.role IN ('member', 'admin', 'developer')
        GROUP BY u.id, u.name, t.task_type
        ORDER BY u.name, t.task_type
      `;

      const memberResult = await pool.query(memberStatsQuery, [startDate, endDate]);
      
      // メンバー別にデータを整理
      const memberMap = new Map();
      memberResult.rows.forEach(row => {
        const userId = row.user_id;
        if (!memberMap.has(userId)) {
          memberMap.set(userId, {
            userId,
            userName: row.user_name,
            totalHours: 0,
            workDays: parseInt(row.work_days || '0'),
            averageHoursPerDay: 0,
            taskTypeBreakdown: {}
          });
        }
        
        const member = memberMap.get(userId);
        const typeHours = parseFloat(row.type_hours || '0');
        member.totalHours += typeHours;
        
        if (row.task_type) {
          member.taskTypeBreakdown[row.task_type] = typeHours;
        }
      });

      // 平均時間計算
      const members = Array.from(memberMap.values()).map(member => ({
        ...member,
        averageHoursPerDay: member.workDays > 0 ? member.totalHours / member.workDays : 0
      }));

      // チーム全体の統計計算
      const teamTotalHours = members.reduce((sum, m) => sum + m.totalHours, 0);
      const teamTotalTasks = await this.getTotalTaskCount(startDate, endDate);
      
      // タスク種別別の集計
      const teamTaskTypes: { [key: string]: number } = {};
      members.forEach(member => {
        Object.entries(member.taskTypeBreakdown).forEach(([type, hours]) => {
          teamTaskTypes[type] = (teamTaskTypes[type] || 0) + (hours as number);
        });
      });

      const taskTypeBreakdown: { [key: string]: any } = {};
      Object.entries(teamTaskTypes).forEach(([type, hours]) => {
        taskTypeBreakdown[type] = {
          totalHours: hours,
          percentage: teamTotalHours > 0 ? Math.round((hours / teamTotalHours) * 100) : 0
        };
      });

      return {
        period: { startDate, endDate },
        members,
        teamTotals: {
          totalHours: teamTotalHours,
          totalTasks: teamTotalTasks,
          averageHoursPerMember: members.length > 0 ? teamTotalHours / members.length : 0,
          taskTypeBreakdown
        }
      };
    } catch (error) {
      console.error('Get team report error:', error);
      throw new Error('チームレポートの取得に失敗しました');
    }
  }

  // 作業効率分析
  static async getProductivityAnalysis(userId: string, days: number = 30) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      const query = `
        SELECT 
          dr.report_date,
          SUM(t.work_hours) as daily_hours,
          COUNT(t.id) as daily_tasks,
          AVG(t.work_hours) as avg_task_hours,
          array_agg(DISTINCT t.task_type) as task_types
        FROM daily_reports dr
        JOIN tasks t ON dr.id = t.daily_report_id
        WHERE dr.user_id = $1 
          AND dr.report_date BETWEEN $2 AND $3
        GROUP BY dr.report_date
        ORDER BY dr.report_date
      `;

      const result = await pool.query(query, [
        userId,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      ]);

      const dailyData = result.rows.map(row => ({
        date: row.report_date,
        hours: parseFloat(row.daily_hours || '0'),
        tasks: parseInt(row.daily_tasks || '0'),
        avgTaskHours: parseFloat(row.avg_task_hours || '0'),
        taskTypes: row.task_types || []
      }));

      // 統計計算
      const totalHours = dailyData.reduce((sum, d) => sum + d.hours, 0);
      const totalTasks = dailyData.reduce((sum, d) => sum + d.tasks, 0);
      const workDays = dailyData.filter(d => d.hours > 0).length;

      return {
        period: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          days: workDays
        },
        summary: {
          totalHours,
          totalTasks,
          averageHoursPerDay: workDays > 0 ? totalHours / workDays : 0,
          averageTasksPerDay: workDays > 0 ? totalTasks / workDays : 0,
          averageHoursPerTask: totalTasks > 0 ? totalHours / totalTasks : 0
        },
        dailyData
      };
    } catch (error) {
      console.error('Get productivity analysis error:', error);
      throw new Error('生産性分析の取得に失敗しました');
    }
  }

  // 補助メソッド: 期間内の総タスク数取得
  private static async getTotalTaskCount(startDate: string, endDate: string): Promise<number> {
    const query = `
      SELECT COUNT(t.id) as total_tasks
      FROM daily_reports dr
      JOIN tasks t ON dr.id = t.daily_report_id
      WHERE dr.report_date BETWEEN $1 AND $2
    `;
    
    const result = await pool.query(query, [startDate, endDate]);
    return parseInt(result.rows[0]?.total_tasks || '0');
  }
}