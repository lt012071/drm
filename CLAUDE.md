# 日報管理システム開発プロジェクト

## 1. プロジェクト概要

このプロジェクトは、AsanaとGoogleカレンダーと連携する日報管理システムを開発することを目的としています。メンバーが日報を通じてタスクに費やした時間を記録し、管理者がその集計レポートを確認できるようにします。

## 2. 達成したいこと

* メンバーが日報を簡単に記入し、タスクの作業時間を記録できるようにする。
* AsanaやGoogleカレンダーと連携し、既存のタスクや予定を日報に効率的に取り込めるようにする。
* 管理者がメンバーの作業時間データを集計し、レポートとして確認できるようにする。
* 将来的にAIエージェントによる日報内容の分析・集計を可能にする。

## 3. 技術スタック

* **フロントエンド**: React 18 + TypeScript + Vite + Mantine + Zustand
* **バックエンド**: Node.js + Express + TypeScript + Passport.js
* **データベース**: PostgreSQL
* **インフラ**: AWS (TerraformでのIaCを前提とする)
* **認証**: GoogleアカウントによるOAuth2認証
* **AI連携**: MCPサーバーとの連携 (OAuth2認証を使用)

## 開発コマンド

### Docker環境（推奨）
```bash
# 開発環境の起動
./scripts/dev-start.sh

# 開発環境の停止
./scripts/dev-stop.sh

# 完全リセット（データベースも初期化）
./scripts/dev-reset.sh

# 個別操作
docker-compose up -d          # 全サービス起動
docker-compose down           # 全サービス停止
docker-compose logs -f        # 全ログ表示
docker-compose logs -f backend # バックエンドのログのみ表示
docker-compose exec backend sh # バックエンドコンテナにログイン
docker-compose exec db psql -U postgres -d drm_db # データベースに接続
```

### ローカル環境（Docker未使用の場合）

#### フロントエンド
```bash
cd frontend
npm install
npm run dev          # 開発サーバー起動
npm run build        # ビルド
npm run type-check   # 型チェック
npm run lint         # ESLint実行
npm test             # テスト実行
```

#### バックエンド
```bash
cd backend
npm install
npm run dev          # 開発サーバー起動
npm run build        # ビルド
npm run type-check   # 型チェック
npm run lint         # ESLint実行
npm test             # テスト実行
```

## プロジェクト構造

```
drm/
├── frontend/              # React + TypeScript
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── backend/               # Node.js + Express + TypeScript
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── database/              # PostgreSQL関連
│   └── init/              # 初期化SQLスクリプト
├── scripts/               # 開発用スクリプト
│   ├── dev-start.sh       # 開発環境起動
│   ├── dev-stop.sh        # 開発環境停止
│   └── dev-reset.sh       # 開発環境リセット
├── infrastructure/        # Terraform
├── docs/                  # ドキュメント
├── docker-compose.yml     # Docker Compose設定
└── .env                   # 環境変数
```

## サービス構成

- **frontend**: React開発サーバー (port: 3000)
- **backend**: Node.js API サーバー (port: 3001)
- **db**: PostgreSQL データベース (port: 5432)
- **redis**: Redis セッションストア (port: 6379)

## 実装済み機能

### 認証機能
- Google OAuth2 ログイン
- JWT トークンベース認証
- ユーザー情報管理

### 日報機能
- 日報の作成・編集・削除
- タスク管理（種別、作業時間、メモ）
- 日報一覧表示（期間指定）
- 日報詳細表示

### Google Calendar連携
- カレンダー予定の取得
- 予定のタスク自動変換
- 日報入力時の予定取り込み
- タスク種別の自動判定

### API エンドポイント
- `/auth/*` - 認証関連
- `/api/daily-reports` - 日報CRUD操作
- `/api/daily-reports/today` - 今日の日報
- `/api/daily-reports/stats` - 統計情報
- `/api/google-calendar` - Googleカレンダー連携
- `/api/asana` - Asana連携（基盤のみ）

### フロントエンド画面
- ログイン画面
- ダッシュボード
- 日報入力画面（カレンダー連携付き）
- 日報一覧画面
- 日報詳細画面

### 拡張レポート機能
- 月次レポート生成
- チームレポート（管理者用）
- 生産性分析
- 詳細統計情報

## 4. 主な機能要件

### 4.1. ユーザー管理・認証

* GoogleアカウントによるOAuth2認証でログイン。
* ログインしたユーザーの権限（メンバー/管理者/開発者）を判断する。

### 4.2. 日報入力画面 (メンバー向け)

* **日本語UI**で構成。
* 日付選択機能（デフォルトで当日日付）。
* **タスク入力セクション:**
    * 1タスク1行形式で、以下の項目を入力。
        * **タスク名:** テキスト入力。Asanaタスクリスト、Googleカレンダー予定からの選択機能。
        * **種別:** 「新規開発」「定型業務」「会議」「突発的な作業」「その他」のプルダウン選択。
        * **作業時間:** 数値入力（時間単位）。
        * **メモ:** 短いテキスト入力。
    * **デフォルト表示:** Googleカレンダーの当日の予定がタスク名として自動入力される。
    * 「**タスクを追加**」ボタンで新しい空のタスク行を追加。
    * 「**前回のタスクをコピー**」ボタンで、前日の日報からGoogleカレンダー以外のタスク内容をコピー。
    * 「**Googleカレンダーを再読み込み**」ボタンで、Googleカレンダーの予定を再取得・反映。
* **備考・報告事項:** 1日ごとの自由記述テキストエリア。
* 「**日報を保存**」ボタン。

### 4.3. 日報閲覧画面 (メンバー向け)

* 自分の過去の日報を日付で選択し、閲覧可能。
* 入力画面と同様のレイアウトで読み取り専用表示。

### 4.4. レポート/集計画面 (管理者向け)

* 管理者のみアクセス可能。
* 期間選択機能（週次、月次、カスタム）。
* フィルター機能（メンバー別、作業種別別）。
* 以下の集計データを視覚的に表示（グラフなど）：
    * タスクごとの合計時間
    * メンバーごとの合計時間
    * 作業種別ごとの合計時間
* 詳細データの一覧表示。

### 4.5. 外部システム連携

* **Asana連携**: Asanaのタスクリストからタスク名を取得し、日報入力時のタスク選択に利用。
* **Googleカレンダー連携**: Googleカレンダーの予定を取得し、日報入力時のデフォルト値として利用。OAuth2認証を使用。

### 4.6. インフラとデプロイ

* AWSをTerraformで構築する。
* CI/CDパイプラインも検討する。

### 4.7. MCPサーバー連携 (将来的な拡張)

* 日報データの参照、分析、集計指示を行うMCPサーバーを別途構築。
* 日報管理システムとMCPサーバー間の認証にはOAuth2を使用。

## 5. 開発プロセス

1.  初期セットアップと基本的な認証フローの実装。
2.  日報入力画面のUI/UXとバックエンドAPIの実装。
3.  Asana/Googleカレンダー連携機能の実装。
4.  日報閲覧機能の実装。
5.  レポート/集計機能の実装。
6.  インフラのTerraform化とデプロイ。
7.  MCPサーバーとの連携準備。

## 6. その他

* セキュリティを最優先に考慮する。
* コードの可読性と保守性を重視する。
* 単体テスト、結合テストを適切に行う。