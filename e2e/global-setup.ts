import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E test environment setup...');
  console.log('✅ E2E test environment setup completed');
}

export default globalSetup;