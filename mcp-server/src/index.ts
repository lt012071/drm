#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { DRMAnalytics } from './services/analytics.js';
import { DRMDatabase } from './services/database.js';
import { AuthService } from './services/auth.js';
import dotenv from 'dotenv';

// 環境変数の読み込み
dotenv.config();

class DRMServer {
  private server: Server;
  private analytics: DRMAnalytics;
  private database: DRMDatabase;
  private auth: AuthService;

  constructor() {
    this.server = new Server(
      {
        name: 'drm-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.database = new DRMDatabase();
    this.auth = new AuthService();
    this.analytics = new DRMAnalytics(this.database);

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // ツール一覧の返却
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_daily_reports',
            description: 'Get daily reports for a specific user and date range',
            inputSchema: {
              type: 'object',
              properties: {
                userId: {
                  type: 'string',
                  description: 'User ID',
                },
                startDate: {
                  type: 'string',
                  description: 'Start date (YYYY-MM-DD)',
                },
                endDate: {
                  type: 'string',
                  description: 'End date (YYYY-MM-DD)',
                },
              },
              required: ['userId', 'startDate', 'endDate'],
            },
          },
          {
            name: 'analyze_productivity',
            description: 'Analyze productivity metrics for a user',
            inputSchema: {
              type: 'object',
              properties: {
                userId: {
                  type: 'string',
                  description: 'User ID',
                },
                period: {
                  type: 'string',
                  enum: ['week', 'month', 'quarter'],
                  description: 'Analysis period',
                },
              },
              required: ['userId', 'period'],
            },
          },
          {
            name: 'get_team_statistics',
            description: 'Get team-wide statistics and metrics',
            inputSchema: {
              type: 'object',
              properties: {
                period: {
                  type: 'string',
                  enum: ['week', 'month', 'quarter'],
                  description: 'Analysis period',
                },
                teamId: {
                  type: 'string',
                  description: 'Team ID (optional)',
                },
              },
              required: ['period'],
            },
          },
          {
            name: 'generate_report',
            description: 'Generate a comprehensive report based on various metrics',
            inputSchema: {
              type: 'object',
              properties: {
                reportType: {
                  type: 'string',
                  enum: ['individual', 'team', 'project'],
                  description: 'Type of report to generate',
                },
                targetId: {
                  type: 'string',
                  description: 'Target ID (user ID, team ID, or project ID)',
                },
                startDate: {
                  type: 'string',
                  description: 'Start date (YYYY-MM-DD)',
                },
                endDate: {
                  type: 'string',
                  description: 'End date (YYYY-MM-DD)',
                },
                format: {
                  type: 'string',
                  enum: ['json', 'markdown', 'summary'],
                  description: 'Output format',
                  default: 'summary',
                },
              },
              required: ['reportType', 'targetId', 'startDate', 'endDate'],
            },
          },
          {
            name: 'search_tasks',
            description: 'Search for tasks across daily reports',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query',
                },
                userId: {
                  type: 'string',
                  description: 'User ID (optional)',
                },
                taskType: {
                  type: 'string',
                  enum: ['新規開発', '定型業務', '会議', '突発的な作業', 'その他'],
                  description: 'Task type filter (optional)',
                },
                startDate: {
                  type: 'string',
                  description: 'Start date (YYYY-MM-DD) (optional)',
                },
                endDate: {
                  type: 'string',
                  description: 'End date (YYYY-MM-DD) (optional)',
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'get_insights',
            description: 'Get AI-powered insights and recommendations',
            inputSchema: {
              type: 'object',
              properties: {
                userId: {
                  type: 'string',
                  description: 'User ID',
                },
                insightType: {
                  type: 'string',
                  enum: ['productivity', 'workload', 'patterns', 'recommendations'],
                  description: 'Type of insights to generate',
                },
                period: {
                  type: 'string',
                  enum: ['week', 'month', 'quarter'],
                  description: 'Analysis period',
                },
              },
              required: ['userId', 'insightType', 'period'],
            },
          },
        ],
      };
    });

    // ツール実行のハンドラー
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_daily_reports':
            return await this.handleGetDailyReports(args);
          case 'analyze_productivity':
            return await this.handleAnalyzeProductivity(args);
          case 'get_team_statistics':
            return await this.handleGetTeamStatistics(args);
          case 'generate_report':
            return await this.handleGenerateReport(args);
          case 'search_tasks':
            return await this.handleSearchTasks(args);
          case 'get_insights':
            return await this.handleGetInsights(args);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        console.error(`Error executing tool ${name}:`, error);
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to execute tool: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    });
  }

  private async handleGetDailyReports(args: any) {
    const { userId, startDate, endDate } = args;
    
    // 認証チェック
    const isAuthorized = await this.auth.checkAccess(userId, 'read_reports');
    if (!isAuthorized) {
      throw new McpError(ErrorCode.InvalidRequest, 'Unauthorized access');
    }

    const reports = await this.database.getDailyReports(userId, startDate, endDate);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: reports,
            count: reports.length,
            period: { startDate, endDate },
          }, null, 2),
        },
      ],
    };
  }

  private async handleAnalyzeProductivity(args: any) {
    const { userId, period } = args;
    
    const isAuthorized = await this.auth.checkAccess(userId, 'read_analytics');
    if (!isAuthorized) {
      throw new McpError(ErrorCode.InvalidRequest, 'Unauthorized access');
    }

    const analysis = await this.analytics.analyzeProductivity(userId, period);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: analysis,
            period,
            generatedAt: new Date().toISOString(),
          }, null, 2),
        },
      ],
    };
  }

  private async handleGetTeamStatistics(args: any) {
    const { period, teamId } = args;
    
    // チーム統計は管理者権限が必要
    const isAuthorized = await this.auth.checkAccess('admin', 'read_team_stats');
    if (!isAuthorized) {
      throw new McpError(ErrorCode.InvalidRequest, 'Admin access required');
    }

    const stats = await this.analytics.getTeamStatistics(period, teamId);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: stats,
            period,
            teamId,
            generatedAt: new Date().toISOString(),
          }, null, 2),
        },
      ],
    };
  }

  private async handleGenerateReport(args: any) {
    const { reportType, targetId, startDate, endDate, format = 'summary' } = args;
    
    const isAuthorized = await this.auth.checkAccess(targetId, 'generate_reports');
    if (!isAuthorized) {
      throw new McpError(ErrorCode.InvalidRequest, 'Unauthorized access');
    }

    const report = await this.analytics.generateReport(
      reportType,
      targetId,
      startDate,
      endDate,
      format
    );
    
    return {
      content: [
        {
          type: 'text',
          text: format === 'json' ? JSON.stringify(report, null, 2) : report,
        },
      ],
    };
  }

  private async handleSearchTasks(args: any) {
    const { query, userId, taskType, startDate, endDate } = args;
    
    const results = await this.database.searchTasks({
      query,
      userId,
      taskType,
      startDate,
      endDate,
    });
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: results,
            query,
            count: results.length,
          }, null, 2),
        },
      ],
    };
  }

  private async handleGetInsights(args: any) {
    const { userId, insightType, period } = args;
    
    const isAuthorized = await this.auth.checkAccess(userId, 'read_insights');
    if (!isAuthorized) {
      throw new McpError(ErrorCode.InvalidRequest, 'Unauthorized access');
    }

    const insights = await this.analytics.getInsights(userId, insightType, period);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: insights,
            insightType,
            period,
            generatedAt: new Date().toISOString(),
          }, null, 2),
        },
      ],
    };
  }

  async run() {
    // データベース接続
    await this.database.connect();
    
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.error('DRM MCP Server running on stdio');
  }
}

const server = new DRMServer();
server.run().catch(console.error);