#!/bin/bash

# 日報管理システム 開発環境起動スクリプト

set -e

echo "🚀 日報管理システム開発環境を起動しています..."

# Docker Composeでサービスを起動
echo "📦 Dockerコンテナを起動中..."
docker-compose up -d

# データベースの起動を待機
echo "🔄 データベースの起動を待機中..."
until docker-compose exec -T db pg_isready -U postgres; do
  echo "データベースの起動を待機中..."
  sleep 2
done

echo "✅ 開発環境が起動しました！"
echo ""
echo "🌐 アクセスURL:"
echo "  - フロントエンド: http://localhost:3000"
echo "  - バックエンドAPI: http://localhost:3001"
echo "  - データベース: localhost:5432"
echo "  - Redis: localhost:6379"
echo ""
echo "🛠️  開発用コマンド:"
echo "  - ログ確認: docker-compose logs -f [service_name]"
echo "  - コンテナ停止: docker-compose down"
echo "  - 完全リセット: docker-compose down -v"
echo ""