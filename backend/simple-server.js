const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3004;

// CORS設定
app.use(cors({
  origin: 'http://localhost:3002',
  credentials: true,
}));

app.use(express.json());

// モックデータ
const mockReports = [
  {
    id: "1",
    userId: "user-123",
    reportDate: "2025-07-05",
    remarks: "今日は新機能の実装を進めました。APIの設計で少し時間がかかりましたが、基本的な構造は完成しました。",
    createdAt: "2025-07-05T18:00:00Z",
    updatedAt: "2025-07-05T18:00:00Z",
    tasks: [
      {
        id: "task-1",
        dailyReportId: "1",
        taskName: "ユーザー認証API実装",
        taskType: "新規開発",
        workHours: 4.0,
        memo: "JWT認証の実装とテスト"
      },
      {
        id: "task-2", 
        dailyReportId: "1",
        taskName: "チームミーティング",
        taskType: "会議",
        workHours: 1.0,
        memo: "週次進捗確認"
      },
      {
        id: "task-3",
        dailyReportId: "1", 
        taskName: "バグ修正",
        taskType: "突発的な作業",
        workHours: 2.0,
        memo: "ログイン画面のレイアウト崩れ修正"
      }
    ]
  },
  {
    id: "2",
    userId: "user-123", 
    reportDate: "2025-07-04",
    remarks: "データベース設計を見直し、パフォーマンス改善を検討しました。",
    createdAt: "2025-07-04T18:00:00Z",
    updatedAt: "2025-07-04T18:00:00Z",
    tasks: [
      {
        id: "task-4",
        dailyReportId: "2",
        taskName: "データベース設計見直し", 
        taskType: "定型業務",
        workHours: 3.0,
        memo: "インデックス最適化の検討"
      },
      {
        id: "task-5",
        dailyReportId: "2",
        taskName: "コードレビュー",
        taskType: "定型業務", 
        workHours: 2.0,
        memo: "新人の実装をレビュー"
      }
    ]
  },
  {
    id: "3",
    userId: "user-123",
    reportDate: "2025-07-03", 
    remarks: "UI/UXの改善に取り組みました。ユーザビリティテストの結果を反映させています。",
    createdAt: "2025-07-03T18:00:00Z", 
    updatedAt: "2025-07-03T18:00:00Z",
    tasks: [
      {
        id: "task-6",
        dailyReportId: "3",
        taskName: "UI改善実装",
        taskType: "新規開発",
        workHours: 5.0,
        memo: "レスポンシブデザインの対応"
      },
      {
        id: "task-7", 
        dailyReportId: "3",
        taskName: "ユーザビリティテスト",
        taskType: "定型業務",
        workHours: 2.0,
        memo: "5名のユーザーでテスト実施"
      }
    ]
  }
];

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: 'development-mock' 
  });
});

// テストエンドポイント
app.get('/api/daily-reports/test', (req, res) => {
  res.json({
    message: 'Mock test successful',
    count: mockReports.length,
    data: mockReports,
    mode: 'development'
  });
});

// 日報一覧取得（期間指定）
app.get('/api/daily-reports', (req, res) => {
  const { startDate, endDate } = req.query;
  
  console.log('GET /api/daily-reports called:', { startDate, endDate });
  
  let filteredReports = mockReports;
  if (startDate && endDate) {
    filteredReports = mockReports.filter(r => {
      return r.reportDate >= startDate && r.reportDate <= endDate;
    });
  }
  
  const sortedReports = filteredReports.sort((a, b) => 
    new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime()
  );
  
  console.log('Returning reports:', sortedReports.length);
  
  res.json({ 
    data: sortedReports,
    count: sortedReports.length
  });
});

// 日報取得（日付指定）
app.get('/api/daily-reports/:date', (req, res) => {
  const { date } = req.params;
  
  console.log('GET /api/daily-reports/:date called:', date);
  
  const report = mockReports.find(r => r.reportDate === date);
  
  if (!report) {
    return res.status(404).json({ error: '指定された日付の日報が見つかりません' });
  }

  console.log('Found report:', report);
  res.json({ data: report });
});

// 今日の日報取得
app.get('/api/daily-reports/today', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  
  console.log('GET /api/daily-reports/today called:', today);
  
  const report = mockReports.find(r => r.reportDate === today);
  
  res.json({ 
    data: report,
    date: today
  });
});

// 日報作成・更新
app.post('/api/daily-reports', (req, res) => {
  const { reportDate, remarks, tasks } = req.body;
  
  console.log('POST /api/daily-reports called:', { reportDate, remarks, tasks });
  
  // 既存の日報を検索
  let existingReportIndex = mockReports.findIndex(r => r.reportDate === reportDate);
  
  if (existingReportIndex !== -1) {
    // 更新
    mockReports[existingReportIndex].remarks = remarks;
    mockReports[existingReportIndex].tasks = tasks.map((task, index) => ({
      id: `task-${Date.now()}-${index}`,
      dailyReportId: mockReports[existingReportIndex].id,
      taskName: task.taskName,
      taskType: task.taskType,
      workHours: task.workHours,
      memo: task.memo || ''
    }));
    mockReports[existingReportIndex].updatedAt = new Date().toISOString();
    
    console.log('Updated report:', mockReports[existingReportIndex]);
    
    res.status(200).json({
      message: '日報を更新しました',
      data: mockReports[existingReportIndex]
    });
  } else {
    // 新規作成
    const newReport = {
      id: `report-${Date.now()}`,
      userId: "user-123",
      reportDate,
      remarks: remarks || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tasks: tasks.map((task, index) => ({
        id: `task-${Date.now()}-${index}`,
        dailyReportId: `report-${Date.now()}`,
        taskName: task.taskName,
        taskType: task.taskType,
        workHours: task.workHours,
        memo: task.memo || ''
      }))
    };
    
    mockReports.push(newReport);
    
    console.log('Created new report:', newReport);
    
    res.status(201).json({
      message: '日報を作成しました',
      data: newReport
    });
  }
});

// 日報削除
app.delete('/api/daily-reports/:id', (req, res) => {
  const { id } = req.params;
  
  console.log('DELETE /api/daily-reports/:id called:', id);
  
  const reportIndex = mockReports.findIndex(r => r.id === id);
  
  if (reportIndex === -1) {
    return res.status(404).json({ error: '削除対象の日報が見つかりません' });
  }

  mockReports.splice(reportIndex, 1);
  
  res.json({ message: '日報を削除しました' });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`🚀 Simple mock server running on http://localhost:${PORT}`);
  console.log(`🧪 Mock data loaded: ${mockReports.length} reports`);
});