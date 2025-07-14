# Asana Personal Access Token 設定手順

## Starterプラン向けの解決策

Asana StarterプランでOAuth2アプリが作成できない場合、Personal Access Tokenを使用します。

## 設定手順

### 1. Personal Access Token取得

1. Asanaにログイン: https://app.asana.com
2. 右上プロフィール画像 → **「My Settings」**
3. 左メニュー **「Apps」** → **「Personal access tokens」**
4. **「Create new token」**
5. Token name: `Daily Report Management System`
6. **「Create token」** → トークンをコピー

### 2. 環境変数設定

`/home/m-isozaki/source/drm/backend/.env` ファイルを編集：

```bash
# Personal Access Token使用設定
ASANA_USE_PERSONAL_TOKEN=true
ASANA_PERSONAL_ACCESS_TOKEN=1/1234567890:abcdef...（取得したトークン）
```

### 3. システム再起動

```bash
docker-compose restart backend
```

### 4. 動作確認

1. http://localhost:3000 にアクセス
2. ログイン後、日報入力画面に移動
3. Asanaタスクセクションでワークスペース一覧が表示される

## 注意事項

- Personal Access Tokenは**一度だけ表示**されます
- トークンは**安全に保管**してください
- 本格運用時はOAuth2アプリの使用を推奨

## トラブルシューティング

### トークンが見つからない場合
Personal access tokens セクションが見つからない場合：
- Asanaの画面レイアウトが変更されている可能性
- 「My Profile Settings」→「Developer」を確認

### 権限エラーの場合
- ワークスペースの管理者に権限確認を依頼
- Asanaサポートに問い合わせ

## 制限事項

Personal Access Tokenの制限：
- レート制限: 1500 requests/hour
- 有効期限: なし（手動で無効化するまで有効）
- スコープ: 全てのワークスペースにアクセス可能