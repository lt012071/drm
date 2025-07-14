export const mockReports = [
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

export const mockUsers = [
  {
    id: "user-123",
    email: "test@example.com", 
    name: "テストユーザー",
    role: "developer",
    avatar: null
  }
];