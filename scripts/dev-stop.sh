#!/bin/bash

# 日報管理システム 開発環境停止スクリプト

set -e

echo "🛑 日報管理システム開発環境を停止しています..."

# Docker Composeでサービスを停止
docker-compose down

echo "✅ 開発環境が停止しました！"
echo ""
echo "🔄 完全リセット（データも削除）したい場合:"
echo "  docker-compose down -v"
echo ""