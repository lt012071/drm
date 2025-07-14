# AWS デプロイメントガイド

このガイドでは、日報管理システム（DRM）をAWSにデプロイする方法を説明します。

## 🏗️ アーキテクチャ概要

デプロイされるAWSリソース：

- **ECS Fargate**: コンテナ化されたアプリケーションの実行
- **Application Load Balancer**: トラフィックの分散とルーティング
- **RDS PostgreSQL**: データベース
- **ElastiCache Redis**: セッションストアとキャッシュ
- **VPC**: 専用ネットワーク環境
- **ECR**: Dockerイメージの保存
- **CloudWatch**: ログとモニタリング
- **Route53 + ACM**: ドメインとSSL証明書（オプション）

## 📋 前提条件

### 必要なツール
- [AWS CLI v2](https://aws.amazon.com/cli/)
- [Terraform](https://www.terraform.io/downloads.html) (>= 1.0)
- [Docker](https://www.docker.com/get-started)
- Git

### AWSアカウント設定
1. AWSアカウントの作成
2. IAMユーザーの作成（適切な権限付与）
3. AWS CLIの設定

```bash
aws configure
```

### 必要なAWS権限
以下のサービスへの権限が必要です：
- EC2, ECS, ECR
- RDS, ElastiCache
- VPC, Application Load Balancer
- IAM, CloudWatch
- Route53, ACM（ドメイン使用時）

## 🚀 デプロイ手順

### 1. リポジトリのクローン
```bash
git clone https://github.com/lt012071/drm.git
cd drm
```

### 2. 環境変数の設定
```bash
# 環境変数ファイルをコピー
cp .env.example .env

# 必要な値を設定
vi .env
```

設定が必要な項目：
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `ASANA_CLIENT_ID`, `ASANA_CLIENT_SECRET`
- `JWT_SECRET`, `SESSION_SECRET`

### 3. 自動デプロイスクリプトの実行
```bash
cd infrastructure
./deploy.sh [環境名] [AWSリージョン]

# 例：開発環境を東京リージョンにデプロイ
./deploy.sh dev ap-northeast-1
```

スクリプトが以下を自動実行します：
1. ECRリポジトリの作成
2. Dockerイメージのビルドとプッシュ
3. Terraformの初期化と実行
4. AWSリソースの作成

### 4. 手動デプロイ（上級者向け）

#### ECRリポジトリの作成
```bash
aws ecr create-repository --repository-name drm-backend
aws ecr create-repository --repository-name drm-frontend
```

#### Dockerイメージのビルドとプッシュ
```bash
# ECRログイン
aws ecr get-login-password --region ap-northeast-1 | docker login --username AWS --password-stdin [ACCOUNT_ID].dkr.ecr.ap-northeast-1.amazonaws.com

# イメージビルド
docker build -t drm-backend backend/
docker build -t drm-frontend frontend/

# タグ付けとプッシュ
docker tag drm-backend:latest [ACCOUNT_ID].dkr.ecr.ap-northeast-1.amazonaws.com/drm-backend:latest
docker tag drm-frontend:latest [ACCOUNT_ID].dkr.ecr.ap-northeast-1.amazonaws.com/drm-frontend:latest

docker push [ACCOUNT_ID].dkr.ecr.ap-northeast-1.amazonaws.com/drm-backend:latest
docker push [ACCOUNT_ID].dkr.ecr.ap-northeast-1.amazonaws.com/drm-frontend:latest
```

#### Terraformによるインフラ構築
```bash
cd infrastructure/terraform

# 初期化
terraform init

# 設定ファイルの編集
cp terraform.tfvars.example terraform.tfvars
vi terraform.tfvars

# プラン確認
terraform plan

# 適用
terraform apply
```

## ⚙️ 設定項目

### terraform.tfvars の主要設定

```hcl
# AWS設定
aws_region = "ap-northeast-1"
environment = "dev"

# データベース設定
db_password = "your-secure-password"

# アプリケーション設定
backend_image = "[ACCOUNT_ID].dkr.ecr.ap-northeast-1.amazonaws.com/drm-backend:latest"
frontend_image = "[ACCOUNT_ID].dkr.ecr.ap-northeast-1.amazonaws.com/drm-frontend:latest"

# 環境変数
environment_variables = {
  JWT_SECRET = "your-jwt-secret"
  SESSION_SECRET = "your-session-secret"
  GOOGLE_CLIENT_ID = "your-google-client-id"
  GOOGLE_CLIENT_SECRET = "your-google-client-secret"
  ASANA_CLIENT_ID = "your-asana-client-id"
  ASANA_CLIENT_SECRET = "your-asana-client-secret"
}

# ドメイン設定（オプション）
domain_name = "your-domain.com"
```

## 🔍 デプロイ後の確認

### 1. アプリケーションの動作確認
```bash
# Terraform出力からURLを取得
terraform output application_url

# ブラウザでアクセスして動作確認
```

### 2. ECSサービスの状態確認
```bash
aws ecs describe-services \
  --cluster drm-cluster \
  --services drm-backend drm-frontend \
  --region ap-northeast-1
```

### 3. ログの確認
```bash
# バックエンドログ
aws logs tail /ecs/drm-backend --follow --region ap-northeast-1

# フロントエンドログ
aws logs tail /ecs/drm-frontend --follow --region ap-northeast-1
```

### 4. データベース接続確認
```bash
# RDSエンドポイントの取得
terraform output database_endpoint

# データベースに接続（要VPN接続または踏み台サーバー）
psql -h [RDS_ENDPOINT] -U postgres -d drm_db
```

## 🛠️ トラブルシューティング

### よくある問題と解決方法

#### 1. ECRプッシュエラー
```bash
# ECRへの再ログイン
aws ecr get-login-password --region ap-northeast-1 | docker login --username AWS --password-stdin [ACCOUNT_ID].dkr.ecr.ap-northeast-1.amazonaws.com
```

#### 2. ECSタスク起動失敗
```bash
# タスク定義の確認
aws ecs describe-task-definition --task-definition drm-backend

# サービスイベントの確認
aws ecs describe-services --cluster drm-cluster --services drm-backend
```

#### 3. データベース接続エラー
- セキュリティグループの設定確認
- VPC/サブネット設定の確認
- データベース認証情報の確認

#### 4. 環境変数設定エラー
```bash
# ECSタスクの環境変数確認
aws ecs describe-task-definition --task-definition drm-backend | jq '.taskDefinition.containerDefinitions[0].environment'
```

## 🔄 更新とメンテナンス

### アプリケーションの更新
```bash
# 新しいイメージをビルド・プッシュ
./deploy.sh dev ap-northeast-1

# または手動でECSサービス更新
aws ecs update-service --cluster drm-cluster --service drm-backend --force-new-deployment
```

### スケーリング
```bash
# タスク数の変更
aws ecs update-service --cluster drm-cluster --service drm-backend --desired-count 2
```

### バックアップ
- RDSの自動バックアップが有効（7日間保持）
- 手動スナップショット作成も可能

## 💰 コスト見積もり

### 開発環境（月額概算）
- ECS Fargate: $30-50
- RDS db.t3.micro: $15-20
- ElastiCache cache.t3.micro: $15-20
- ALB: $20-25
- その他: $10-15
- **合計: $90-130/月**

### 本番環境
- インスタンスサイズ、冗長化レベルに応じて調整
- モニタリング、ログ保持期間の設定

## 🔒 セキュリティ考慮事項

1. **ネットワークセキュリティ**
   - VPC、セキュリティグループによる適切な分離
   - データベースはプライベートサブネットに配置

2. **暗号化**
   - RDS暗号化有効
   - ALB-ECS間の通信はHTTPS推奨

3. **認証・認可**
   - IAMロールによる最小権限の原則
   - OAuth2による外部サービス連携

4. **ログ・監視**
   - CloudWatchによる包括的なモニタリング
   - ログ保持期間の適切な設定

## 📞 サポート

問題が発生した場合：
1. 本ドキュメントのトラブルシューティングを確認
2. AWSドキュメントを参照
3. GitHubリポジトリでIssueを作成