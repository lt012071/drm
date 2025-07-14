# Frontend Dockerfile
FROM node:18-alpine

# 作業ディレクトリを設定
WORKDIR /app

# パッケージファイルをコピーして依存関係をインストール
COPY package*.json ./
RUN npm ci

# アプリケーションコードをコピー
COPY . .

# ポート3000を公開
EXPOSE 3000

# 開発モードで起動（docker-compose.ymlでオーバーライド可能）
CMD ["npm", "run", "dev"]