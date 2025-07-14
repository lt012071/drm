# Asanaアプリ作成時のブラウザデバッグ手順

## エラー詳細確認方法

### Chrome/Edgeの場合：
1. https://app.asana.com/0/my-apps を開く
2. **F12キー**を押して開発者ツールを開く
3. **「Console」**タブをクリック
4. **「Network」**タブもクリック
5. アプリ作成フォームに入力
6. **「アプリを作成」**ボタンをクリック
7. **Console**と**Network**タブで赤いエラーメッセージを確認

### 確認すべきエラーメッセージ：
- `403 Forbidden` → 権限不足
- `402 Payment Required` → プラン制限
- `400 Bad Request` → 入力データの問題
- JavaScript エラー → ブラウザ/フォームの問題

## よくあるエラーと対処法

### "Upgrade required" または "Premium feature"
→ Starterプランでは利用不可

### "Organization admin required"
→ 管理者権限が必要

### "Invalid app name" または "Name already exists"
→ アプリ名を変更して再試行

## 入力データ確認

### 試すべき入力パターン：
- **App name**: `DRM-Test-App-001` (英数字のみ)
- **Description**: `Test application for daily reports` (英語、簡潔)
- **特殊文字を避ける**: 日本語、記号、絵文字は使用しない