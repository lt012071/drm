#!/bin/bash

# 日報管理システム 開発環境リセットスクリプト

set -e

echo "🔄 日報管理システム開発環境をリセットしています..."

# Docker Composeでサービスを停止し、ボリュームも削除
docker-compose down -v

# イメージの再ビルド
echo "🔨 Dockerイメージを再ビルド中..."
docker-compose build --no-cache

# 開発環境を再起動
echo "🚀 開発環境を再起動中..."
docker-compose up -d

# データベースの起動を待機
echo "🔄 データベースの起動を待機中..."
until docker-compose exec -T db pg_isready -U postgres; do
  echo "データベースの起動を待機中..."
  sleep 2
done

echo "✅ 開発環境がリセットされました！"
echo ""
echo "🌐 アクセスURL:"
echo "  - フロントエンド: http://localhost:3000"
echo "  - バックエンドAPI: http://localhost:3001"
echo ""