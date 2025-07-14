# Docker開発環境ガイド

## 概要

日報管理システムはDockerを使用してローカル開発環境を構築します。フロントエンド、バックエンド、PostgreSQL、Redisが全て含まれたマイクロサービス構成です。

## 前提条件

- Docker Desktop (または Docker Engine + Docker Compose)
- 8GB以上のメモリ推奨

## 開発環境の起動

### 1. 初回起動
```bash
# プロジェクトディレクトリに移動
cd /path/to/drm

# 開発環境を起動
./scripts/dev-start.sh
```

### 2. 日常的な起動/停止
```bash
# 起動
docker-compose up -d

# 停止
docker-compose down
```

## サービス詳細

### フロントエンド (port: 3000)
- React 18 + TypeScript + Vite
- ホットリロード対応
- URL: http://localhost:3000

### バックエンド (port: 3001)
- Node.js + Express + TypeScript
- ホットリロード対応（ts-node-dev）
- URL: http://localhost:3001

### データベース (port: 5432)
- PostgreSQL 15
- 初期化スクリプト自動実行
- 開発用シードデータ含む

### Redis (port: 6379)
- セッションストア用
- 開発環境では永続化設定

## 開発用コマンド

### ログ確認
```bash
# 全サービスのログ
docker-compose logs -f

# 特定のサービスのログ
docker-compose logs -f backend
docker-compose logs -f frontend
```

### コンテナ内でのコマンド実行
```bash
# バックエンドコンテナ内でコマンド実行
docker-compose exec backend npm test

# フロントエンドコンテナ内でコマンド実行
docker-compose exec frontend npm run lint

# データベースに接続
docker-compose exec db psql -U postgres -d drm_db
```

### 開発データのリセット
```bash
# データベースとRedisのデータを削除して再起動
./scripts/dev-reset.sh

# または手動で
docker-compose down -v
docker-compose up -d
```

## トラブルシューティング

### ポートが既に使用されている場合
```bash
# 使用中のポートを確認
lsof -i :3000
lsof -i :3001
lsof -i :5432

# プロセスを停止してから再起動
```

### コンテナのビルドエラー
```bash
# キャッシュを削除してビルド
docker-compose build --no-cache

# 全てのイメージを削除してリビルド
docker-compose down --rmi all
docker-compose build
```

### データベース接続エラー
```bash
# データベースコンテナの状態確認
docker-compose ps db

# データベースログの確認
docker-compose logs db

# データベースコンテナの再起動
docker-compose restart db
```

## 本番環境との違い

開発環境では以下の設定が本番環境と異なります：

1. **ホットリロード**: ソースコードの変更が即座に反映
2. **シードデータ**: 開発用のテストデータが自動投入
3. **ログレベル**: より詳細なログ出力
4. **セキュリティ**: 開発用の緩い設定

## ファイル監視

以下のファイルを変更すると自動でリロードされます：

- `frontend/src/**/*`: フロントエンドのホットリロード
- `backend/src/**/*`: バックエンドのホットリロード
- `database/init/**/*.sql`: データベースの再初期化（要リスタート）