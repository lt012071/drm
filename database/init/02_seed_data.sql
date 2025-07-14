-- 日報管理システム シードデータ

-- 開発用管理者ユーザー（実際の本番環境では削除）
INSERT INTO users (google_id, email, name, role) VALUES
('dev_admin_001', 'admin@example.com', '管理者ユーザー', 'admin'),
('dev_member_001', 'member@example.com', 'メンバーユーザー', 'member'),
('dev_developer_001', 'developer@example.com', '開発者ユーザー', 'developer')
ON CONFLICT (google_id) DO NOTHING;

-- 開発用の日報サンプルデータ
DO $$
DECLARE
    admin_user_id UUID;
    member_user_id UUID;
    report_id UUID;
BEGIN
    -- ユーザーIDを取得
    SELECT id INTO admin_user_id FROM users WHERE google_id = 'dev_admin_001';
    SELECT id INTO member_user_id FROM users WHERE google_id = 'dev_member_001';
    
    -- 管理者の日報
    INSERT INTO daily_reports (id, user_id, report_date, remarks) VALUES
    (gen_random_uuid(), admin_user_id, CURRENT_DATE - INTERVAL '1 day', 'システム設計とAPI仕様書作成を行いました。')
    ON CONFLICT (user_id, report_date) DO NOTHING
    RETURNING id INTO report_id;
    
    -- 管理者のタスク
    INSERT INTO tasks (daily_report_id, task_name, task_type, work_hours, memo) VALUES
    (report_id, 'システム設計書作成', '新規開発', 4.0, 'データベース設計とAPI設計'),
    (report_id, 'チームミーティング', '会議', 1.5, '週次定例会議'),
    (report_id, 'コードレビュー', '定型業務', 2.0, 'プルリクエストの確認')
    ON CONFLICT DO NOTHING;
    
    -- メンバーの日報
    INSERT INTO daily_reports (id, user_id, report_date, remarks) VALUES
    (gen_random_uuid(), member_user_id, CURRENT_DATE - INTERVAL '1 day', 'フロントエンドの実装を進めました。')
    ON CONFLICT (user_id, report_date) DO NOTHING
    RETURNING id INTO report_id;
    
    -- メンバーのタスク
    INSERT INTO tasks (daily_report_id, task_name, task_type, work_hours, memo) VALUES
    (report_id, 'ログイン画面実装', '新規開発', 6.0, 'Google OAuth2実装'),
    (report_id, 'バグ修正', '突発的な作業', 1.5, 'CSS表示不具合の修正')
    ON CONFLICT DO NOTHING;
    
END $$;