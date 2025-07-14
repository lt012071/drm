#!/bin/bash

# ローカル開発環境セットアップスクリプト

echo "📋 Setting up local development environment..."

# ルートディレクトリの環境変数ファイルをコピー
if [ ! -f .env ]; then
    echo "📄 Creating root .env file..."
    cp .env.development .env
    echo "✅ Created .env from .env.development"
else
    echo "ℹ️  .env already exists in root directory"
fi

# フロントエンドの環境変数ファイルをコピー
if [ ! -f frontend/.env ]; then
    echo "📄 Creating frontend .env file..."
    cp frontend/.env.example frontend/.env
    echo "✅ Created frontend/.env from frontend/.env.example"
else
    echo "ℹ️  frontend/.env already exists"
fi

# バックエンドの環境変数ファイルをコピー
if [ ! -f backend/.env ]; then
    echo "📄 Creating backend .env file..."
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env from backend/.env.example"
else
    echo "ℹ️  backend/.env already exists"
fi

echo ""
echo "🔧 Next steps:"
echo "1. Edit backend/.env and add your Google OAuth2 credentials:"
echo "   - GOOGLE_CLIENT_ID=your_actual_client_id"
echo "   - GOOGLE_CLIENT_SECRET=your_actual_client_secret"
echo ""
echo "2. Start the development environment:"
echo "   docker-compose up -d"
echo ""
echo "3. The application will be available at:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:3001"
echo "   - Database: localhost:5432"
echo ""
echo "📖 For Google OAuth setup instructions, see:"
echo "   docs/development/google-oauth-setup.md"