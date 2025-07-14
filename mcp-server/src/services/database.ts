import { Pool, PoolClient } from 'pg';

export interface DailyReport {
  id: string;
  userId: string;
  date: string;
  tasks: Task[];
  remarks: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  taskName: string;
  taskType: string;
  workHours: number;
  memo: string;
  googleCalendarEventId?: string;
  asanaTaskId?: string;
}

export interface SearchTasksParams {
  query: string;
  userId?: string;
  taskType?: string;
  startDate?: string;
  endDate?: string;
}

export class DRMDatabase {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/drm_db',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
  }

  async connect(): Promise<void> {
    try {
      await this.pool.connect();
      console.log('Connected to DRM database');
    } catch (error) {
      console.error('Failed to connect to database:', error);
      throw error;
    }
  }

  async getDailyReports(userId: string, startDate: string, endDate: string): Promise<DailyReport[]> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT 
          dr.id,
          dr.user_id as "userId",
          dr.date,
          dr.remarks,
          dr.created_at as "createdAt",
          dr.updated_at as "updatedAt",
          json_agg(
            json_build_object(
              'id', t.id,
              'taskName', t.task_name,
              'taskType', t.task_type,
              'workHours', t.work_hours,
              'memo', t.memo,
              'googleCalendarEventId', t.google_calendar_event_id,
              'asanaTaskId', t.asana_task_id
            ) ORDER BY t.created_at
          ) FILTER (WHERE t.id IS NOT NULL) as tasks
        FROM daily_reports dr
        LEFT JOIN tasks t ON dr.id = t.daily_report_id
        WHERE dr.user_id = $1 
          AND dr.date >= $2 
          AND dr.date <= $3
        GROUP BY dr.id, dr.user_id, dr.date, dr.remarks, dr.created_at, dr.updated_at
        ORDER BY dr.date DESC
      `;
      
      const result = await client.query(query, [userId, startDate, endDate]);
      
      return result.rows.map(row => ({
        ...row,
        tasks: row.tasks || [],
      }));
    } finally {
      client.release();
    }
  }

  async searchTasks(params: SearchTasksParams): Promise<Task[]> {
    const client = await this.pool.connect();
    
    try {
      let query = `
        SELECT 
          t.id,
          t.task_name as "taskName",
          t.task_type as "taskType",
          t.work_hours as "workHours",
          t.memo,
          t.google_calendar_event_id as "googleCalendarEventId",
          t.asana_task_id as "asanaTaskId",
          dr.date,
          dr.user_id as "userId"
        FROM tasks t
        JOIN daily_reports dr ON t.daily_report_id = dr.id
        WHERE (t.task_name ILIKE $1 OR t.memo ILIKE $1)
      `;
      
      const queryParams: any[] = [`%${params.query}%`];
      let paramIndex = 2;
      
      if (params.userId) {
        query += ` AND dr.user_id = $${paramIndex}`;
        queryParams.push(params.userId);
        paramIndex++;
      }
      
      if (params.taskType) {
        query += ` AND t.task_type = $${paramIndex}`;
        queryParams.push(params.taskType);
        paramIndex++;
      }
      
      if (params.startDate) {
        query += ` AND dr.date >= $${paramIndex}`;
        queryParams.push(params.startDate);
        paramIndex++;
      }
      
      if (params.endDate) {
        query += ` AND dr.date <= $${paramIndex}`;
        queryParams.push(params.endDate);
        paramIndex++;
      }
      
      query += ' ORDER BY dr.date DESC, t.created_at ASC';
      
      const result = await client.query(query, queryParams);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async getTaskStatistics(userId?: string, startDate?: string, endDate?: string) {
    const client = await this.pool.connect();
    
    try {
      let query = `
        SELECT 
          t.task_type,
          COUNT(*) as task_count,
          SUM(t.work_hours) as total_hours,
          AVG(t.work_hours) as avg_hours,
          MIN(dr.date) as first_date,
          MAX(dr.date) as last_date
        FROM tasks t
        JOIN daily_reports dr ON t.daily_report_id = dr.id
      `;
      
      const queryParams: any[] = [];
      const conditions: string[] = [];
      let paramIndex = 1;
      
      if (userId) {
        conditions.push(`dr.user_id = $${paramIndex}`);
        queryParams.push(userId);
        paramIndex++;
      }
      
      if (startDate) {
        conditions.push(`dr.date >= $${paramIndex}`);
        queryParams.push(startDate);
        paramIndex++;
      }
      
      if (endDate) {
        conditions.push(`dr.date <= $${paramIndex}`);
        queryParams.push(endDate);
        paramIndex++;
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      query += ' GROUP BY t.task_type ORDER BY total_hours DESC';
      
      const result = await client.query(query, queryParams);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async getUserActivity(userId: string, period: string) {
    const client = await this.pool.connect();
    
    try {
      const periodMap = {
        week: '7 days',
        month: '30 days',
        quarter: '90 days',
      };
      
      const interval = periodMap[period as keyof typeof periodMap] || '30 days';
      
      const query = `
        SELECT 
          dr.date,
          COUNT(t.id) as task_count,
          SUM(t.work_hours) as total_hours,
          array_agg(DISTINCT t.task_type) as task_types
        FROM daily_reports dr
        LEFT JOIN tasks t ON dr.id = t.daily_report_id
        WHERE dr.user_id = $1 
          AND dr.date >= CURRENT_DATE - INTERVAL '${interval}'
        GROUP BY dr.date
        ORDER BY dr.date
      `;
      
      const result = await client.query(query, [userId]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async getTeamActivity(period: string, teamId?: string) {
    const client = await this.pool.connect();
    
    try {
      const periodMap = {
        week: '7 days',
        month: '30 days',
        quarter: '90 days',
      };
      
      const interval = periodMap[period as keyof typeof periodMap] || '30 days';
      
      let query = `
        SELECT 
          u.name as user_name,
          dr.user_id,
          COUNT(t.id) as task_count,
          SUM(t.work_hours) as total_hours,
          array_agg(DISTINCT t.task_type) as task_types,
          COUNT(DISTINCT dr.date) as active_days
        FROM daily_reports dr
        LEFT JOIN tasks t ON dr.id = t.daily_report_id
        LEFT JOIN users u ON dr.user_id = u.id
        WHERE dr.date >= CURRENT_DATE - INTERVAL '${interval}'
      `;
      
      const queryParams: any[] = [];
      
      if (teamId) {
        query += ' AND u.team_id = $1';
        queryParams.push(teamId);
      }
      
      query += `
        GROUP BY u.name, dr.user_id
        ORDER BY total_hours DESC
      `;
      
      const result = await client.query(query, queryParams);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}