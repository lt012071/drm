-- Asana連携のためのカラム追加

-- ユーザーテーブルにAsanaアクセストークンを追加
ALTER TABLE users 
ADD COLUMN asana_access_token TEXT,
ADD COLUMN asana_refresh_token TEXT;

-- インデックス作成
CREATE INDEX idx_users_asana_token ON users(asana_access_token);