#!/bin/bash

set -e

# 環境設定
ENVIRONMENT=${1:-dev}
AWS_REGION=${2:-ap-northeast-1}
PROJECT_NAME="drm"

echo "🚀 Deploying DRM to AWS..."
echo "Environment: $ENVIRONMENT"
echo "Region: $AWS_REGION"

# 必要なツールの確認
if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform is not installed. Please install Terraform first."
    exit 1
fi

if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install AWS CLI first."
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# AWS認証確認
echo "🔐 Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

# ECRリポジトリの作成
echo "📦 Creating ECR repositories..."
aws ecr describe-repositories --repository-names ${PROJECT_NAME}-backend --region ${AWS_REGION} 2>/dev/null || \
    aws ecr create-repository --repository-name ${PROJECT_NAME}-backend --region ${AWS_REGION}

aws ecr describe-repositories --repository-names ${PROJECT_NAME}-frontend --region ${AWS_REGION} 2>/dev/null || \
    aws ecr create-repository --repository-name ${PROJECT_NAME}-frontend --region ${AWS_REGION}

# ECRログイン
echo "🔑 Logging into ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.${AWS_REGION}.amazonaws.com

# Dockerイメージのビルドとプッシュ
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_BACKEND_URI="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}-backend:latest"
ECR_FRONTEND_URI="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}-frontend:latest"

echo "🔨 Building and pushing backend image..."
cd ../
docker build -t ${PROJECT_NAME}-backend -f backend/Dockerfile backend/
docker tag ${PROJECT_NAME}-backend:latest ${ECR_BACKEND_URI}
docker push ${ECR_BACKEND_URI}

echo "🔨 Building and pushing frontend image..."
docker build -t ${PROJECT_NAME}-frontend -f frontend/Dockerfile frontend/
docker tag ${PROJECT_NAME}-frontend:latest ${ECR_FRONTEND_URI}
docker push ${ECR_FRONTEND_URI}

# Terraformディレクトリに移動
cd infrastructure/terraform

# Terraform初期化
echo "⚙️ Initializing Terraform..."
terraform init

# 環境変数ファイルの確認
if [ ! -f "terraform.tfvars" ]; then
    echo "⚠️ terraform.tfvars file not found. Creating template..."
    cat > terraform.tfvars << EOF
# AWS設定
aws_region = "${AWS_REGION}"
environment = "${ENVIRONMENT}"

# データベース設定
db_password = "changeme123!"

# アプリケーション設定
backend_image = "${ECR_BACKEND_URI}"
frontend_image = "${ECR_FRONTEND_URI}"

# 環境変数（機密情報は別途設定）
environment_variables = {
  NODE_ENV = "${ENVIRONMENT}"
  DATABASE_URL = ""  # Terraformで自動設定
  REDIS_URL = ""     # Terraformで自動設定
  JWT_SECRET = "your-jwt-secret-here"
  SESSION_SECRET = "your-session-secret-here"
  FRONTEND_URL = ""  # ALBのURLが自動設定
  GOOGLE_CLIENT_ID = "your-google-client-id"
  GOOGLE_CLIENT_SECRET = "your-google-client-secret"
  ASANA_CLIENT_ID = "your-asana-client-id"
  ASANA_CLIENT_SECRET = "your-asana-client-secret"
  ASANA_USE_PERSONAL_TOKEN = "false"
}

# ドメイン設定（オプション）
# domain_name = "your-domain.com"
EOF
    echo "❗ Please edit terraform.tfvars with your actual values before continuing."
    echo "   Especially update the database password and OAuth credentials."
    read -p "Press Enter after editing terraform.tfvars to continue..."
fi

# Terraformプラン
echo "📋 Planning Terraform deployment..."
terraform plan

# 確認
read -p "Do you want to proceed with the deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled."
    exit 1
fi

# Terraform適用
echo "🚀 Applying Terraform configuration..."
terraform apply -auto-approve

# 結果表示
echo "✅ Deployment completed successfully!"
echo ""
echo "📊 Application URLs:"
terraform output application_url

echo ""
echo "🔍 To check the status:"
echo "  aws ecs describe-services --cluster ${PROJECT_NAME}-cluster --services ${PROJECT_NAME}-backend ${PROJECT_NAME}-frontend --region ${AWS_REGION}"
echo ""
echo "📝 To view logs:"
echo "  aws logs tail /ecs/${PROJECT_NAME}-backend --follow --region ${AWS_REGION}"
echo "  aws logs tail /ecs/${PROJECT_NAME}-frontend --follow --region ${AWS_REGION}"