# Asana Developer Console トラブルシューティング

## 問題: アプリが追加されない / Developer Consoleが表示されない

### 確認手順

#### 1. アカウント状況確認
- [ ] Asana有料プランに加入しているか
- [ ] 組織の管理者権限を持っているか
- [ ] 個人アカウントではなく、組織アカウントでログインしているか

#### 2. ブラウザ環境確認
- [ ] 別ブラウザ（Chrome、Firefox、Safari）で試行
- [ ] シークレット/プライベートモードで試行
- [ ] 広告ブロッカー・セキュリティ拡張機能を無効化
- [ ] ブラウザキャッシュをクリア

#### 3. アクセス方法確認
- [ ] 正しいURL: https://app.asana.com/0/developer-console
- [ ] 代替URL: https://app.asana.com/admin/developer-apps
- [ ] Asanaメイン画面 → プロフィール → Settings → Apps

#### 4. ネットワーク環境確認
- [ ] 企業ネットワークのファイアウォール確認
- [ ] VPN接続の有無
- [ ] プロキシ設定の影響

## 代替解決策

### Option 1: Personal Access Token使用
Developer Consoleが利用できない場合、Personal Access Tokenを使用できます：

1. Asanaメイン画面 → プロフィール → Settings
2. 「Apps」タブ → 「Manage developer apps」
3. 「Personal access tokens」セクション
4. 「Create new token」

**注意**: Personal Access Tokenは本格運用には推奨されません。

### Option 2: Asanaサポート問い合わせ
- Asanaサポート: https://asana.com/support
- 組織管理者に開発者権限の確認を依頼

## 環境変数設定（Token使用の場合）

Personal Access Tokenを使用する場合の設定：

```bash
# .envファイル
ASANA_PERSONAL_ACCESS_TOKEN=your_personal_access_token_here
ASANA_USE_PERSONAL_TOKEN=true
```

この設定により、OAuth2の代わりにPersonal Access TokenでAPIアクセスが可能になります。