# Googleカレンダー連携機能テストガイド

## テスト環境の準備

### 1. Docker環境の起動

```bash
cd /path/to/drm
docker-compose up -d
```

### 2. ログの確認

```bash
# バックエンドログ
docker-compose logs -f backend

# フロントエンドログ  
docker-compose logs -f frontend
```

### 3. サービス稼働確認

```bash
# バックエンドAPIの確認
curl http://localhost:3001/health

# フロントエンドの確認
curl http://localhost:3000
```

## Google認証フローのテスト

### Step 1: ログイン画面にアクセス

1. ブラウザで `http://localhost:3000` にアクセス
2. 「Googleでログイン」ボタンが表示されることを確認

### Step 2: Google認証の実行

1. 「Googleでログイン」ボタンをクリック
2. Googleログイン画面にリダイレクトされることを確認
3. 以下のスコープが要求されることを確認：
   - プロフィール情報の表示
   - メールアドレスの表示  
   - Googleカレンダーの表示（読み取り専用）

### Step 3: 認証後の動作確認

1. Googleアカウントでログイン
2. アプリに戻ること
3. ダッシュボードが表示されること
4. ユーザー名がヘッダーに表示されること

## Googleカレンダー連携のテスト

### Step 1: 日報入力画面にアクセス

1. 左メニューまたはダッシュボードから「日報入力」をクリック
2. 日報入力画面が表示されることを確認

### Step 2: Googleカレンダー予定の確認

1. 「Googleカレンダー予定」セクションを確認
2. 以下のパターンをテスト：

**パターンA: 予定がある場合**
- 当日の予定が一覧表示される
- 各予定に以下の情報が表示される：
  - 予定名
  - 時間
  - 推定作業時間
  - 推定タスク種別（バッジ）

**パターンB: 予定がない場合**
- 「この日には予定がありません」と表示される

### Step 3: タスクへの変換テスト

1. **個別追加のテスト**
   - 各予定の「+」ボタンをクリック
   - タスクセクションに自動入力されることを確認
   - 予定名、作業時間、種別が正しく設定されることを確認

2. **一括追加のテスト**
   - 「全て追加」ボタンをクリック
   - 全ての予定がタスクとして追加されることを確認
   - 成功メッセージが表示されることを確認

### Step 4: 予定の再読み込みテスト

1. 「🔄」（再読み込み）ボタンをクリック
2. 予定が再取得されることを確認
3. Googleカレンダーで予定を追加/変更後、再読み込みで反映されることを確認

## エラーケースのテスト

### Case 1: 認証エラー

1. 無効なトークンでAPIにアクセス
2. 適切なエラーメッセージが表示されることを確認
3. 再認証を促すメッセージが表示されることを確認

### Case 2: Calendar API エラー

1. ネットワークエラーをシミュレート
2. エラーメッセージが表示されることを確認
3. リトライ機能が動作することを確認

### Case 3: 権限不足エラー

1. Calendarスコープなしでアクセス
2. 適切なエラーメッセージが表示されることを確認

## パフォーマンステスト

### 1. レスポンス時間の測定

```bash
# Calendar API のレスポンス時間測定
time curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3001/api/google-calendar/$(date +%Y-%m-%d)
```

### 2. 大量予定の処理

1. Googleカレンダーに多数の予定（20件以上）を作成
2. パフォーマンスの劣化がないことを確認
3. UI の表示に問題がないことを確認

## 自動化テスト

### API テスト用 curl コマンド

```bash
# JWT トークンを取得（認証後）
TOKEN=$(curl -s -X GET http://localhost:3001/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN" | \
  jq -r '.token // empty')

# 今日の予定取得
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/google-calendar/today" | \
  jq '.data | length'

# 指定日の予定取得  
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/google-calendar/2025-07-07" | \
  jq '.data[0].summary'

# タスク変換
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/google-calendar/2025-07-07/tasks" | \
  jq '.data[0].taskName'
```

## 期待される結果

### 正常動作の確認項目

- ✅ Google認証フローが完了する
- ✅ Googleカレンダー予定が取得できる
- ✅ 予定がタスクに正しく変換される
- ✅ タスク種別が適切に推定される
- ✅ 作業時間が正しく計算される
- ✅ エラー処理が適切に動作する
- ✅ ユーザビリティが良好である

### トラブル時の確認項目

1. **バックエンドログの確認**
   ```bash
   docker-compose logs backend | grep -i error
   ```

2. **フロントエンドコンソールの確認**
   - ブラウザのDevToolsでコンソールエラーを確認

3. **ネットワークの確認**
   - ブラウザのDevToolsでネットワークリクエストを確認
   - 認証ヘッダーが正しく送信されているか確認

4. **データベース状態の確認**
   ```bash
   docker-compose exec db psql -U postgres -d drm_db \
     -c "SELECT * FROM users ORDER BY created_at DESC LIMIT 5;"
   ```

## 注意事項

- テスト前にGoogleカレンダーに予定を作成しておく
- 異なるタイプの予定（会議、開発作業、その他）を作成してテストする
- 時間の異なる予定（30分、1時間、2時間等）でテストする
- 終日イベントでもテストする