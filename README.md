# 日報管理システム (Daily Report Management System)

効率的な日報作成・管理を支援するWebアプリケーションシステムです。

## ✨ 主な機能

- 📝 **日報作成・編集**: 直感的なインターフェースで簡単に日報を作成
- 📅 **カレンダー表示**: 月別・週別でのビジュアルな日報管理
- ⏱️ **タスク管理**: 作業時間とカテゴリ別のタスク追跡
- 📊 **統計表示**: 作業時間の集計と生産性分析
- 🔍 **検索・フィルタ**: 期間指定や条件での日報検索
- 📱 **レスポンシブ対応**: モバイル・タブレット・デスクトップ対応
- 🔐 **認証システム**: セキュアなユーザー認証

## 🚀 クイックスタート

### 必要な環境
- Node.js 18+
- Docker & Docker Compose
- Git
- Google Cloud Console アカウント（OAuth2設定用）

### 開発環境の起動

1. **リポジトリのクローン**
   ```bash
   git clone <repository-url>
   cd drm
   ```

2. **環境変数の設定**
   ```bash
   # 環境変数ファイルをコピー
   cp .env.example .env
   ```
   
   `.env`ファイルを編集して、以下の設定を行ってください：
   - Google OAuth2認証情報（GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET）
   - Asana OAuth2認証情報（ASANA_CLIENT_ID, ASANA_CLIENT_SECRET）
   - JWT秘密鍵（JWT_SECRET）
   - セッション秘密鍵（SESSION_SECRET）

3. **Google OAuth2設定**
   - [Google Cloud Console](https://console.cloud.google.com/)でプロジェクトを作成
   - OAuth2認証情報を作成し、`.env`に設定
   - 詳細は `docs/development/google-oauth-setup.md` を参照

4. **Docker で起動**
   ```bash
   # 全サービス（フロントエンド、バックエンド、DB）を起動
   docker-compose up -d
   
   # アクセス
   # フロントエンド: http://localhost:3000
   # バックエンドAPI: http://localhost:3001
   ```

3. **手動セットアップ**
   ```bash
   # 依存関係のインストール
   cd frontend && npm install
   cd ../backend && npm install
   
   # 環境変数の設定
   cp frontend/.env.example frontend/.env
   cp backend/.env.example backend/.env
   
   # データベース・Redis起動（Docker）
   docker-compose up -d db redis
   
   # 開発サーバー起動
   cd frontend && npm run dev    # ポート3000
   cd backend && npm run dev     # ポート3001
   ```

## 🧪 テスト

包括的なテスト環境を整備しています：

### クイックテストコマンド
```bash
# 全テスト（ユニット + E2E）実行
./scripts/test-all.sh

# 開発向け高速テスト
./scripts/test-dev.sh quick

# フロントエンドのみ
cd frontend && npm run test

# バックエンドのみ
cd backend && npm run test

# E2Eテストのみ
npm run e2e
```

### テスト構成
- **ユニットテスト**: コンポーネント・関数の個別テスト
- **統合テスト**: API・サービス間連携テスト
- **E2Eテスト**: ユーザーワークフロー・ブラウザ横断テスト
- **カバレッジ**: 自動カバレッジ計測・レポート

詳細は [TEST_README.md](./TEST_README.md) を参照してください。

## 🏗️ プロジェクト構造

```
drm/
├── frontend/                 # フロントエンド（React + TypeScript）
│   ├── src/
│   │   ├── components/       # 再利用可能なコンポーネント
│   │   ├── pages/           # ページコンポーネント
│   │   ├── services/        # API通信・ビジネスロジック
│   │   ├── stores/          # 状態管理（Zustand）
│   │   ├── types/           # TypeScript型定義
│   │   └── test/            # テストユーティリティ
│   └── public/              # 静的ファイル
├── backend/                 # バックエンド（Node.js + Express + TypeScript）
│   ├── src/
│   │   ├── controllers/     # APIコントローラー
│   │   ├── models/          # データモデル
│   │   ├── routes/          # ルーティング定義
│   │   ├── services/        # ビジネスロジック
│   │   ├── middleware/      # 認証・バリデーション
│   │   └── config/          # 設定ファイル
│   └── tests/               # ユニット・統合テスト
├── e2e/                     # E2Eテスト（Playwright）
├── scripts/                 # 開発・テスト用スクリプト
├── database/                # データベース初期化・シード
├── .github/workflows/       # CI/CDパイプライン
└── docs/                    # プロジェクトドキュメント
```

## 🛠️ 技術スタック

### フロントエンド
- **React 18** + TypeScript
- **Vite** - 高速開発環境
- **Mantine** - UIコンポーネントライブラリ
- **Zustand** - 軽量状態管理
- **React Router** - SPA ルーティング
- **Day.js** - 日付操作

### バックエンド
- **Node.js** + Express.js
- **TypeScript** - 型安全性
- **PostgreSQL** - メインデータベース
- **Redis** - セッションストレージ
- **Passport.js** - 認証戦略
- **Express Validator** - 入力検証

### テスト・品質
- **Vitest** - フロントエンドテスト
- **Jest** - バックエンドテスト
- **Playwright** - E2Eテスト
- **ESLint** + **Prettier** - コード品質
- **GitHub Actions** - CI/CD

### インフラ・運用
- **Docker** - コンテナ化
- **PostgreSQL** - 本番データベース
- **Redis** - キャッシュ・セッション
- **Terraform** - インフラ管理（AWS）

## 📦 利用可能なスクリプト

### ルートレベル
```bash
npm run start:dev             # Docker サービス起動
npm run stop:dev              # Docker サービス停止
npm run test:all              # 全テスト実行
npm run e2e                   # E2Eテスト実行
```

### フロントエンド
```bash
npm run dev                   # 開発サーバー起動
npm run dev:mock              # モックデータでの開発
npm run build                 # 本番ビルド
npm run test                  # ユニットテスト
npm run test:coverage         # カバレッジ付きテスト
npm run lint                  # リンター実行
```

### バックエンド
```bash
npm run dev                   # 開発サーバー起動
npm run build                 # 本番ビルド
npm run start                 # 本番サーバー起動
npm run test                  # ユニットテスト
npm run test:coverage         # カバレッジ付きテスト
npm run lint                  # リンター実行
```

## 🚀 デプロイ

### 本番ビルド
```bash
# フロントエンド・バックエンド両方をビルド
docker-compose -f docker-compose.prod.yml build

# 本番設定でデプロイ
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 コントリビューション

1. リポジトリをフォーク
2. フィーチャーブランチを作成: `git checkout -b feature/amazing-feature`
3. 変更をコミット（テスト含む）
4. テストスイートを実行: `./scripts/test-all.sh`
5. ブランチにプッシュ: `git push origin feature/amazing-feature`
6. プルリクエストを作成

### コード品質基準
- **テストカバレッジ**: 新規コード80%以上
- **TypeScript**: strict モード、`any` 型の使用禁止
- **Linting**: ESLint Airbnb設定準拠
- **コミット**: Conventional Commits形式

## 📖 ドキュメント

- [テストガイド](./TEST_README.md) - 包括的なテスト情報
- [開発ガイド](./docs/development/) - 開発環境セットアップ
- [APIドキュメント](./docs/api/) - REST API仕様
- [デプロイガイド](./docs/deployment/) - 本番環境構築

## 🔧 トラブルシューティング

### よくある問題

1. **ポート競合**: 3000, 3001, 5432, 6379番ポートが利用可能か確認
2. **データベース接続**: PostgreSQLが起動・アクセス可能か確認
3. **Dockerの問題**: `docker-compose down -v` でボリュームリセット
4. **テスト失敗**: 環境変数とサービス可用性を確認

### デバッグモード
```bash
# フロントエンドデバッグ
npm run dev -- --debug

# バックエンドデバッグ
npm run dev -- --inspect

# E2Eデバッグ
npm run e2e:debug
```

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 📞 サポート

質問・問題・貢献について：
- GitHubリポジトリでIssueを作成
- 開発チームに連絡
- `/docs/` ディレクトリのドキュメントを確認

---

**❤️ 開発チームより**