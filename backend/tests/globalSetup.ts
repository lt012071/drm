export default async (): Promise<void> => {
  // テストデータベースの準備やその他のグローバルセットアップ
  console.log('🧪 Starting test environment setup...');
  
  // 環境変数の設定
  process.env.NODE_ENV = 'test';
  process.env.USE_MOCK_DATA = 'true';
  process.env.SKIP_AUTH = 'true';
  
  console.log('✅ Test environment setup completed');
};