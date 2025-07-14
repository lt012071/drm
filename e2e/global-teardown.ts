import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting E2E test environment cleanup...');
  
  try {
    // テストデータのクリーンアップ（必要に応じて）
    console.log('📝 Cleaning up test data...');
    
    // Docker環境のクリーンアップ（CIでない場合はスキップ）
    if (process.env.CI) {
      console.log('🐳 Stopping Docker containers...');
      const { exec } = require('child_process');
      await new Promise((resolve, reject) => {
        exec('docker-compose down', (error: any, stdout: string, stderr: string) => {
          if (error) {
            console.error('Error stopping Docker containers:', error);
            reject(error);
          } else {
            console.log('Docker containers stopped successfully');
            resolve(stdout);
          }
        });
      });
    }
    
    console.log('✅ E2E test environment cleanup completed');
    
  } catch (error) {
    console.error('❌ E2E test environment cleanup failed:', error);
    // クリーンアップエラーはテスト結果に影響しないようにする
  }
}

export default globalTeardown;