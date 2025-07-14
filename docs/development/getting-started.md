# 開発環境セットアップガイド

## 前提条件

- Docker Desktop (または Docker Engine + Docker Compose)
- 8GB以上のメモリ推奨

## 開発環境の起動

### 1. プロジェクトのクローン
```bash
git clone <repository-url>
cd drm
```

### 2. 環境変数の設定

#### バックエンド
```bash
cp backend/.env.example backend/.env
```

#### フロントエンド
```bash
cp frontend/.env.example frontend/.env
```

### 3. Google OAuth2の設定

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成
2. OAuth2認証情報を作成
3. 認証済みリダイレクトURIに `http://localhost:3001/auth/google/callback` を追加
4. `backend/.env` に以下を設定：

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/auth/google/callback
SESSION_SECRET=your_session_secret
JWT_SECRET=your_jwt_secret
```

### 4. 開発環境の起動

```bash
# 開発環境を起動
./scripts/dev-start.sh
```

起動後、以下のURLにアクセスできます：

- **フロントエンド**: http://localhost:3000
- **バックエンドAPI**: http://localhost:3001
- **データベース**: localhost:5432
- **Redis**: localhost:6379

## 初回ログイン

1. http://localhost:3000 にアクセス
2. 「Googleでログイン」ボタンをクリック
3. Googleアカウントで認証
4. ダッシュボードにリダイレクトされることを確認

## 開発用コマンド

### ログ確認
```bash
# 全サービスのログ
docker-compose logs -f

# 特定のサービスのログ
docker-compose logs -f backend
docker-compose logs -f frontend
```

### データベース操作
```bash
# データベースに接続
docker-compose exec db psql -U postgres -d drm_db

# テーブル確認
\dt

# ユーザー一覧
SELECT * FROM users;
```

### 開発環境のリセット
```bash
# 完全リセット（データも削除）
./scripts/dev-reset.sh
```

## トラブルシューティング

### ポートが使用されている場合
```bash
# ポート使用状況確認
lsof -i :3000
lsof -i :3001
lsof -i :5432

# プロセス停止後、再起動
docker-compose down
docker-compose up -d
```

### 認証エラーの場合
1. Google Cloud Consoleの設定を確認
2. 環境変数が正しく設定されているか確認
3. リダイレクトURIが正しいか確認

### データベース接続エラー
```bash
# データベースの状態確認
docker-compose ps db

# データベースの再起動
docker-compose restart db
```