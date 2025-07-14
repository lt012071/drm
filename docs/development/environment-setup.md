# 環境設定ガイド

このドキュメントでは、Daily Report Management Systemの各環境での設定について説明します。

## 📋 環境構成概要

### 1. **ローカル開発環境**
- **認証**: Google OAuth2認証
- **データベース**: Docker PostgreSQL
- **セッション**: Docker Redis
- **目的**: 本番環境に近い状態での開発

### 2. **本番環境（AWS）**
- **認証**: Google OAuth2認証
- **データベース**: AWS RDS PostgreSQL
- **セッション**: AWS ElastiCache Redis
- **目的**: 本番運用

### 3. **テスト環境**
- **認証**: スキップ（モック）
- **データベース**: モックサービス
- **目的**: ユニットテスト・E2Eテスト

## 🛠️ 環境別設定

### ローカル開発環境

#### 必要な設定ファイル
```
.env                    # ルート環境変数
frontend/.env           # フロントエンド環境変数
backend/.env            # バックエンド環境変数
```

#### 設定手順

1. **セットアップスクリプト実行**
   ```bash
   ./scripts/setup-dev.sh
   ```

2. **Google OAuth2設定**
   - `backend/.env`の以下を編集：
   ```bash
   GOOGLE_CLIENT_ID=your_actual_client_id
   GOOGLE_CLIENT_SECRET=your_actual_client_secret
   ```

3. **Docker起動**
   ```bash
   docker-compose up -d
   ```

#### 環境変数詳細

**フロントエンド (`frontend/.env`)**
```bash
VITE_API_URL=http://localhost:3001
VITE_SKIP_AUTH=false              # 認証を有効化
VITE_USE_MOCK_SERVICE=false       # 実際のAPIを使用
```

**バックエンド (`backend/.env`)**
```bash
# Google OAuth2
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/auth/google/callback

# データベース（Docker PostgreSQL）
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/drm_db

# Redis（Docker Redis）
REDIS_URL=redis://localhost:6379

NODE_ENV=development
```

### 本番環境（AWS）

#### 環境変数設定

**`.env.production`をベースに設定**
```bash
# RDS PostgreSQL
DATABASE_URL=postgresql://username:password@your-rds-endpoint.region.rds.amazonaws.com:5432/drm_production

# ElastiCache Redis
REDIS_URL=redis://your-elasticache-endpoint.region.cache.amazonaws.com:6379

# Google OAuth2（本番用）
GOOGLE_CLIENT_ID=your_production_client_id
GOOGLE_CLIENT_SECRET=your_production_client_secret
GOOGLE_REDIRECT_URI=https://your-domain.com/auth/google/callback

NODE_ENV=production
```

### テスト環境

#### 環境変数設定

**自動的に`.env.test`が使用される**
```bash
# 認証スキップ
VITE_SKIP_AUTH=true
SKIP_AUTH=true

# モックサービス使用
VITE_USE_MOCK_SERVICE=true
USE_MOCK_DATA=true

NODE_ENV=test
```

#### テスト実行
```bash
# ユニットテスト
npm test

# E2Eテスト
npm run test:e2e
```

## 🔄 環境の切り替え

### 開発からテストへ
```bash
# テスト環境で実行
NODE_ENV=test npm test
```

### 開発から本番へ
```bash
# 本番用環境変数ファイルを使用
cp .env.production .env
```

## ⚠️ 注意事項

### セキュリティ
- **本番環境の認証情報は絶対にgitにコミットしない**
- **開発用の認証情報も`.env`ファイルに記載（.gitignoreで除外済み）**

### データベース
- **ローカル開発**: Docker PostgreSQLを使用
- **本番環境**: AWS RDSを使用
- **テスト**: モックデータを使用

### 認証
- **ローカル開発・本番**: 実際のGoogle OAuth2
- **テスト**: 認証スキップまたはモック

## 🏃‍♂️ 次のステップ

1. [Google OAuth2セットアップ](./google-oauth-setup.md)
2. [Docker開発環境](./docker-development.md)
3. [AWS本番デプロイ](../deployment/aws-deployment.md)