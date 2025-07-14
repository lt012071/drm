# 日報API仕様書

## エンドポイント一覧

### 認証
全てのエンドポイントは JWT 認証が必要です。
リクエストヘッダーに `Authorization: Bearer <token>` を含めてください。

## 日報関連API

### POST /api/daily-reports
日報の作成・更新

**リクエスト**
```json
{
  "reportDate": "2025-01-15",
  "remarks": "今日の振り返りと特記事項",
  "tasks": [
    {
      "taskName": "フロントエンド実装",
      "taskType": "新規開発",
      "workHours": 6.0,
      "memo": "React コンポーネントの実装"
    },
    {
      "taskName": "週次ミーティング",
      "taskType": "会議",
      "workHours": 1.0,
      "memo": "プロジェクトの進捗確認"
    }
  ]
}
```

**レスポンス**
```json
{
  "message": "日報を保存しました",
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "reportDate": "2025-01-15",
    "remarks": "今日の振り返りと特記事項",
    "tasks": [
      {
        "id": "uuid",
        "taskName": "フロントエンド実装",
        "taskType": "新規開発",
        "workHours": 6.0,
        "memo": "React コンポーネントの実装",
        "createdAt": "2025-01-15T10:00:00Z",
        "updatedAt": "2025-01-15T10:00:00Z"
      }
    ],
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-15T10:00:00Z"
  }
}
```

### GET /api/daily-reports/today
今日の日報取得

**レスポンス**
```json
{
  "data": {
    "id": "uuid",
    "reportDate": "2025-01-15",
    "remarks": "...",
    "tasks": [...]
  },
  "date": "2025-01-15"
}
```

### GET /api/daily-reports/:date
指定日の日報取得

**パラメータ**
- `date`: YYYY-MM-DD 形式の日付

**レスポンス**
```json
{
  "data": {
    "id": "uuid",
    "reportDate": "2025-01-15",
    "remarks": "...",
    "tasks": [...]
  }
}
```

### GET /api/daily-reports?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
期間指定での日報一覧取得

**クエリパラメータ**
- `startDate`: 開始日（YYYY-MM-DD）
- `endDate`: 終了日（YYYY-MM-DD）

**レスポンス**
```json
{
  "data": [
    {
      "id": "uuid",
      "reportDate": "2025-01-15",
      "remarks": "...",
      "tasks": [...]
    }
  ],
  "count": 1
}
```

### DELETE /api/daily-reports/:id
日報削除

**パラメータ**
- `id`: 日報ID（UUID）

**レスポンス**
```json
{
  "message": "日報を削除しました"
}
```

### GET /api/daily-reports/stats?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
統計情報取得

**クエリパラメータ**
- `startDate`: 開始日（YYYY-MM-DD）
- `endDate`: 終了日（YYYY-MM-DD）

**レスポンス**
```json
{
  "data": [
    {
      "taskType": "新規開発",
      "totalHours": 42.0,
      "taskCount": 7
    },
    {
      "taskType": "会議",
      "totalHours": 8.0,
      "taskCount": 4
    }
  ]
}
```

## バリデーションルール

### 日報
- `reportDate`: 必須、ISO8601形式の日付
- `remarks`: 任意、2000文字以内
- `tasks`: 必須、配列（最低1つ）

### タスク
- `taskName`: 必須、500文字以内
- `taskType`: 必須、以下のいずれか
  - "新規開発"
  - "定型業務"
  - "会議"
  - "突発的な作業"
  - "その他"
- `workHours`: 必須、0以上24以下の数値
- `memo`: 任意、500文字以内

## エラーレスポンス

### 400 Bad Request
```json
{
  "error": "バリデーションエラー",
  "details": [
    {
      "msg": "タスク名は必須です",
      "param": "tasks.0.taskName"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "認証が必要です"
}
```

### 404 Not Found
```json
{
  "error": "指定された日付の日報が見つかりません"
}
```

### 500 Internal Server Error
```json
{
  "error": "内部サーバーエラー"
}
```