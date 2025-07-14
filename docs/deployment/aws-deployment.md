# AWS デプロイメントガイド

## データベース設定の切り替え

### 1. 開発環境 vs 本番環境

| 環境 | PostgreSQL | Redis | 設定方法 |
|------|------------|-------|----------|
| 開発 | Docker Container | Docker Container | docker-compose.yml |
| 本番 | AWS RDS | AWS ElastiCache | 環境変数 |

### 2. 本番環境でのデータベース設定

#### RDS PostgreSQL
```bash
# 接続文字列例
DATABASE_URL=postgresql://drm_user:secure_password@drm-postgres.xxxxx.region.rds.amazonaws.com:5432/drm_production
```

#### ElastiCache Redis
```bash
# 接続文字列例
REDIS_URL=redis://drm-redis.xxxxx.cache.amazonaws.com:6379
```

### 3. 環境変数による自動切り替え

アプリケーションは環境変数で自動的に適切なデータベースに接続：

**開発環境**: 
- `NODE_ENV=development` → Docker内のDB使用

**本番環境**: 
- `NODE_ENV=production` → AWS RDS/ElastiCache使用

### 4. Terraformによるインフラ構築

```bash
# 1. Terraformでインフラ作成
cd infrastructure/terraform
terraform init
terraform plan
terraform apply

# 2. 出力された接続情報を環境変数に設定
export DATABASE_URL="postgresql://..."
export REDIS_URL="redis://..."

# 3. アプリケーションデプロイ
# ECS、Elastic Beanstalk、またはEC2にデプロイ
```

### 5. 移行時の注意点

1. **データ移行**: 開発環境からのデータエクスポート
2. **SSL設定**: 本番環境ではSSL必須
3. **バックアップ**: RDSの自動バックアップ設定
4. **モニタリング**: CloudWatchでの監視設定

### 6. セキュリティ

- **VPC**: プライベートサブネットに配置
- **セキュリティグループ**: アプリケーションからのみアクセス許可
- **暗号化**: 保存時および転送時の暗号化
- **認証情報**: AWS Secrets Managerで管理