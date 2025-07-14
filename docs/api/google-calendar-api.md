# Google Calendar API仕様書

## 概要

Googleカレンダーと連携して、予定を日報のタスクとして取り込む機能を提供します。

## 認証

- JWT認証が必要
- GoogleカレンダーAPIへのアクセス権限が必要（OAuth2スコープ: `https://www.googleapis.com/auth/calendar.readonly`）

## エンドポイント

### GET /api/google-calendar/today
今日のカレンダー予定を取得

**レスポンス**
```json
{
  "data": [
    {
      "id": "event_id_123",
      "summary": "プロジェクトミーティング",
      "description": "週次の進捗確認",
      "start": {
        "dateTime": "2025-01-15T10:00:00+09:00"
      },
      "end": {
        "dateTime": "2025-01-15T11:00:00+09:00"
      },
      "duration": 60
    }
  ],
  "count": 1,
  "date": "2025-01-15"
}
```

### GET /api/google-calendar/:date
指定日のカレンダー予定を取得

**パラメータ**
- `date`: YYYY-MM-DD形式

### GET /api/google-calendar?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
期間指定でカレンダー予定を取得

**クエリパラメータ**
- `startDate`: 開始日
- `endDate`: 終了日

### GET /api/google-calendar/:date/tasks
指定日の予定をタスク形式に変換

**レスポンス**
```json
{
  "data": [
    {
      "taskName": "プロジェクトミーティング",
      "taskType": "会議",
      "workHours": 1.0,
      "memo": "週次の進捗確認",
      "googleCalendarEventId": "event_id_123"
    }
  ],
  "originalEvents": [...],
  "count": 1,
  "date": "2025-01-15"
}
```

### POST /api/google-calendar/refresh-token
アクセストークンのリフレッシュ

## タスク種別の自動判定

カレンダー予定の内容から以下のルールでタスク種別を推測：

- **会議**: "ミーティング", "会議", "meeting", "打ち合わせ"
- **新規開発**: "開発", "実装", "コーディング", "プログラミング"
- **定型業務**: "レビュー", "確認", "テスト", "検証"
- **突発的な作業**: "緊急", "急", "バグ", "修正"
- **その他**: 上記に該当しない場合

## エラーレスポンス

### 401 Unauthorized
```json
{
  "error": "Googleカレンダーへのアクセス権限が無効です。再度ログインしてください。"
}
```

## 使用例

### フロントエンドでの実装例

```typescript
import { GoogleCalendarService } from '@/services/googleCalendarService';

// 今日の予定を取得
const events = await GoogleCalendarService.getTodayEvents();

// 予定をタスクに変換
const result = await GoogleCalendarService.convertEventsToTasks('2025-01-15');
onAddTasksFromCalendar(result.data);
```