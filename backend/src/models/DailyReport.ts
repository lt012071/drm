import { pool } from '../config/database';

export interface DailyReport {
  id: string;
  userId: string;
  reportDate: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  dailyReportId: string;
  taskName: string;
  taskType: '新規開発' | '定型業務' | '会議' | '突発的な作業' | 'その他';
  workHours: number;
  memo?: string;
  asanaTaskId?: string;
  googleCalendarEventId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDailyReportData {
  userId: string;
  reportDate: string;
  remarks?: string;
  tasks: CreateTaskData[];
}

export interface CreateTaskData {
  taskName: string;
  taskType: '新規開発' | '定型業務' | '会議' | '突発的な作業' | 'その他';
  workHours: number;
  memo?: string;
  asanaTaskId?: string;
  googleCalendarEventId?: string;
}

export interface DailyReportWithTasks extends DailyReport {
  tasks: Task[];
}

export class DailyReportModel {
  // 日報作成
  static async create(data: CreateDailyReportData): Promise<DailyReportWithTasks> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 既存の日報をチェック
      const existingReport = await client.query(
        'SELECT id FROM daily_reports WHERE user_id = $1 AND report_date = $2',
        [data.userId, data.reportDate]
      );

      let reportId: string;

      if (existingReport.rows.length > 0) {
        // 既存の日報がある場合は更新
        reportId = existingReport.rows[0].id;
        
        // 既存のタスクを削除
        await client.query('DELETE FROM tasks WHERE daily_report_id = $1', [reportId]);
        
        // 日報を更新
        await client.query(
          'UPDATE daily_reports SET remarks = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [data.remarks, reportId]
        );
      } else {
        // 新規日報作成
        const reportResult = await client.query(
          `INSERT INTO daily_reports (user_id, report_date, remarks)
           VALUES ($1, $2, $3) RETURNING id`,
          [data.userId, data.reportDate, data.remarks]
        );
        reportId = reportResult.rows[0].id;
      }

      // タスクを作成
      const tasks: Task[] = [];
      for (const task of data.tasks) {
        const taskResult = await client.query(
          `INSERT INTO tasks (daily_report_id, task_name, task_type, work_hours, memo, asana_task_id, google_calendar_event_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [reportId, task.taskName, task.taskType, task.workHours, task.memo, task.asanaTaskId, task.googleCalendarEventId]
        );
        tasks.push(taskResult.rows[0]);
      }

      // 更新された日報を取得
      const reportResult = await client.query(
        'SELECT * FROM daily_reports WHERE id = $1',
        [reportId]
      );

      await client.query('COMMIT');

      return {
        ...reportResult.rows[0],
        tasks
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Create daily report error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // 日報取得（ユーザー別・日付別）
  static async findByUserAndDate(userId: string, reportDate: string): Promise<DailyReportWithTasks | null> {
    try {
      const reportResult = await pool.query(
        'SELECT * FROM daily_reports WHERE user_id = $1 AND report_date = $2',
        [userId, reportDate]
      );

      if (reportResult.rows.length === 0) {
        return null;
      }

      const report = reportResult.rows[0];

      const tasksResult = await pool.query(
        `SELECT id, daily_report_id, task_name as "taskName", task_type as "taskType", 
                work_hours as "workHours", memo, asana_task_id as "asanaTaskId", 
                google_calendar_event_id as "googleCalendarEventId", created_at, updated_at
         FROM tasks WHERE daily_report_id = $1 ORDER BY created_at`,
        [report.id]
      );

      return {
        ...report,
        tasks: tasksResult.rows
      };
    } catch (error) {
      console.error('Find daily report error:', error);
      throw error;
    }
  }

  // 日報一覧取得（ユーザー別・期間指定）
  static async findByUserAndDateRange(
    userId: string, 
    startDate: string, 
    endDate: string
  ): Promise<DailyReportWithTasks[]> {
    try {
      const reportResult = await pool.query(
        `SELECT dr.*, 
                COALESCE(json_agg(
                  json_build_object(
                    'id', t.id,
                    'taskName', t.task_name,
                    'taskType', t.task_type,
                    'workHours', t.work_hours,
                    'memo', t.memo,
                    'asanaTaskId', t.asana_task_id,
                    'googleCalendarEventId', t.google_calendar_event_id,
                    'createdAt', t.created_at,
                    'updatedAt', t.updated_at
                  ) ORDER BY t.created_at
                ) FILTER (WHERE t.id IS NOT NULL), '[]') as tasks
         FROM daily_reports dr
         LEFT JOIN tasks t ON dr.id = t.daily_report_id
         WHERE dr.user_id = $1 AND dr.report_date BETWEEN $2 AND $3
         GROUP BY dr.id
         ORDER BY dr.report_date DESC`,
        [userId, startDate, endDate]
      );

      return reportResult.rows.map(row => ({
        ...row,
        tasks: row.tasks
      }));
    } catch (error) {
      console.error('Find daily reports by range error:', error);
      throw error;
    }
  }

  // 日報削除
  static async delete(id: string, userId: string): Promise<boolean> {
    try {
      const result = await pool.query(
        'DELETE FROM daily_reports WHERE id = $1 AND user_id = $2',
        [id, userId]
      );
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Delete daily report error:', error);
      throw error;
    }
  }

  // 統計情報取得
  static async getStatsByUser(userId: string, startDate: string, endDate: string) {
    try {
      const result = await pool.query(
        `SELECT 
           t.task_type,
           SUM(t.work_hours) as total_hours,
           COUNT(t.id) as task_count
         FROM daily_reports dr
         JOIN tasks t ON dr.id = t.daily_report_id
         WHERE dr.user_id = $1 AND dr.report_date BETWEEN $2 AND $3
         GROUP BY t.task_type
         ORDER BY total_hours DESC`,
        [userId, startDate, endDate]
      );
      return result.rows;
    } catch (error) {
      console.error('Get stats error:', error);
      throw error;
    }
  }
}