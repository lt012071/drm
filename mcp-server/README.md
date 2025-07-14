# DRM MCP Server

日報管理システム（DRM）用のMCP（Model Context Protocol）サーバーです。Claude などのLLMから日報データの分析、レポート生成、インサイトの取得などを行うことができます。

## 機能

### 📊 分析機能
- **生産性分析**: ユーザーの作業効率と生産性の分析
- **チーム統計**: チーム全体のパフォーマンス分析
- **作業パターン分析**: 個人の作業習慣とパターンの識別

### 📋 レポート機能
- **個人レポート**: 個人の詳細な作業レポート
- **チームレポート**: チーム全体の統計レポート
- **カスタムレポート**: 期間や条件を指定したレポート生成

### 🔍 データ検索
- **タスク検索**: 条件に基づくタスクの検索
- **日報検索**: 期間指定での日報取得
- **統計データ取得**: 様々な統計情報の取得

### 🤖 AI インサイト
- **生産性インサイト**: AIによる生産性向上の提案
- **作業負荷分析**: 適切な作業量の分析
- **パターン認識**: 効率的な作業パターンの特定
- **改善提案**: データに基づく具体的な改善案

## インストール

### 前提条件
- Node.js 18.0.0 以上
- PostgreSQL データベース（DRMシステム）
- TypeScript

### セットアップ

1. **依存関係のインストール**
   ```bash
   cd mcp-server
   npm install
   ```

2. **環境変数の設定**
   ```bash
   cp .env.example .env
   # .envファイルを編集して適切な値を設定
   ```

3. **ビルド**
   ```bash
   npm run build
   ```

4. **起動**
   ```bash
   npm start
   ```

## 利用可能なツール

### 1. get_daily_reports
指定したユーザーの日報を期間指定で取得します。

```json
{
  "name": "get_daily_reports",
  "arguments": {
    "userId": "user-id",
    "startDate": "2024-01-01", 
    "endDate": "2024-01-31"
  }
}
```

### 2. analyze_productivity
ユーザーの生産性を分析します。

```json
{
  "name": "analyze_productivity",
  "arguments": {
    "userId": "user-id",
    "period": "month"
  }
}
```

### 3. get_team_statistics
チーム全体の統計情報を取得します。

```json
{
  "name": "get_team_statistics", 
  "arguments": {
    "period": "month",
    "teamId": "team-id"
  }
}
```

### 4. generate_report
包括的なレポートを生成します。

```json
{
  "name": "generate_report",
  "arguments": {
    "reportType": "individual",
    "targetId": "user-id", 
    "startDate": "2024-01-01",
    "endDate": "2024-01-31",
    "format": "markdown"
  }
}
```

### 5. search_tasks
タスクを検索します。

```json
{
  "name": "search_tasks",
  "arguments": {
    "query": "開発",
    "userId": "user-id",
    "taskType": "新規開発"
  }
}
```

### 6. get_insights
AIによるインサイトを取得します。

```json
{
  "name": "get_insights",
  "arguments": {
    "userId": "user-id",
    "insightType": "productivity", 
    "period": "month"
  }
}
```

## Claude Desktop での使用

### 設定方法

1. **Claude Desktop の設定ファイルを編集**
   
   macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   
   Windows: `%APPDATA%\\Claude\\claude_desktop_config.json`

2. **MCPサーバーの設定を追加**
   ```json
   {
     "mcpServers": {
       "drm-analytics": {
         "command": "node",
         "args": ["/path/to/drm/mcp-server/dist/index.js"],
         "env": {
           "DATABASE_URL": "postgresql://postgres:postgres@localhost:5432/drm_db"
         }
       }
     }
   }
   ```

3. **Claude Desktop を再起動**

### 使用例

Claude に以下のように尋ねることができます：

- "先月の私の生産性を分析してください"
- "チーム全体の今月の統計を教えてください" 
- "新規開発タスクを検索してください"
- "今週の作業パターンから改善点を提案してください"
- "個人レポートをマークダウン形式で生成してください"

## 権限管理

MCPサーバーは以下の権限レベルで動作します：

- **admin**: 全ての機能にアクセス可能
- **user**: 自分のデータのみアクセス可能
- **readonly**: 読み取り専用アクセス

## セキュリティ

- OAuth2認証との連携
- APIキーによるアクセス制御
- ユーザー権限の細かな制御
- アクセスログの記録

## 開発

### 開発モードでの実行
```bash
npm run dev
```

### テスト
```bash
npm test
```

### 型チェック
```bash
npm run type-check
```

### リント
```bash
npm run lint
```

## トラブルシューティング

### よくある問題

1. **データベース接続エラー**
   - `DATABASE_URL` が正しく設定されているか確認
   - PostgreSQLサービスが起動しているか確認

2. **権限エラー**
   - ユーザーIDと権限レベルを確認
   - 管理者権限が必要な操作かどうか確認

3. **Claude Desktop で認識されない**
   - 設定ファイルのパスが正しいか確認
   - Node.js とTypeScript のビルドが成功しているか確認

## ライセンス

MIT License

## 貢献

バグレポートや機能要望は GitHub Issues でお知らせください。