# Google OAuth2およびCalendar API設定ガイド

## 概要

日報管理システムでGoogleカレンダー連携を利用するために必要なGoogle Cloud Console設定手順です。

## 前提条件

- Googleアカウント
- Google Cloud Console へのアクセス権

## セットアップ手順

### 1. Google Cloud Console プロジェクトの設定

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成または既存プロジェクトを選択
3. 左メニューから「APIとサービス」→「ライブラリ」を選択

### 2. 必要なAPIの有効化

以下のAPIを有効にします：

1. **Google Calendar API**
   - ライブラリから「Google Calendar API」を検索
   - 「有効にする」をクリック

2. **Google+ API**（OAuth2認証用）
   - ライブラリから「Google+ API」を検索  
   - 「有効にする」をクリック

### 3. OAuth2認証情報の作成

1. 左メニューから「APIとサービス」→「認証情報」を選択
2. 「認証情報を作成」→「OAuth 2.0 クライアントID」を選択
3. アプリケーションの種類：「ウェブアプリケーション」
4. 名前：「日報管理システム」（任意）
5. 承認済みのリダイレクト URI：
   ```
   http://localhost:3001/auth/google/callback
   ```

### 4. スコープの設定

OAuth同意画面の設定：

1. 「OAuth同意画面」タブを選択
2. ユーザータイプ：「外部」を選択（テスト用）
3. アプリ情報：
   - アプリ名：「日報管理システム」
   - ユーザーサポートメール：あなたのメールアドレス
   - 承認済みドメイン：（空欄でOK）
   - デベロッパーの連絡先情報：あなたのメールアドレス

4. スコープ設定：
   ```
   https://www.googleapis.com/auth/calendar.readonly
   https://www.googleapis.com/auth/userinfo.email
   https://www.googleapis.com/auth/userinfo.profile
   ```

### 5. 環境変数の設定

作成された認証情報をコピーして、`backend/.env` ファイルに設定：

```bash
# Google OAuth2設定
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3001/auth/google/callback
```

## テスト手順

### 1. アプリケーションの起動

```bash
# Docker環境を起動
docker-compose up -d

# ログ確認
docker-compose logs -f backend
```

### 2. 認証フローのテスト

1. ブラウザで `http://localhost:3000` にアクセス
2. 「Googleでログイン」ボタンをクリック
3. Google認証画面でアカウントを選択
4. 権限の許可画面で「許可」をクリック
5. アプリケーションにリダイレクトされることを確認

### 3. Calendar API のテスト

認証後、以下の手順でカレンダー連携をテスト：

1. 「日報入力」画面にアクセス
2. 「Googleカレンダー予定」セクションでカレンダーイベントが表示されることを確認
3. 「全て追加」ボタンでタスクに変換されることを確認

## トラブルシューティング

### よくあるエラー

1. **401 Unauthorized**
   - OAuth2認証情報が正しく設定されているか確認
   - リダイレクトURIが正確に設定されているか確認

2. **403 Forbidden**
   - Calendar APIが有効化されているか確認
   - OAuth同意画面のスコープ設定を確認

3. **Calendar events not found**
   - ユーザーのGoogleカレンダーに予定が存在するか確認
   - 指定した日付にイベントがあるか確認

### デバッグ方法

```bash
# バックエンドのログを確認
docker-compose logs -f backend

# 特定のAPIエンドポイントをテスト
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3001/api/google-calendar/2025-07-07
```

## セキュリティ注意事項

- **本番環境では**：
  - HTTPS必須
  - 適切なドメインのリダイレクトURIを設定
  - 環境変数は暗号化して保存
  - OAuth同意画面を「公開」にする前に Google の審査が必要

- **開発環境では**：
  - テストユーザーとして自分のアカウントを追加
  - ローカルホスト（http://localhost）のリダイレクトURIを使用

## 参考資料

- [Google Calendar API Documentation](https://developers.google.com/calendar/api)
- [Google OAuth2 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)