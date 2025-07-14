import { config } from 'dotenv';

// テスト環境変数を設定
config({ path: '.env.test' });

// グローバルテスト設定
jest.setTimeout(10000);

// データベースコネクションプールのモック
jest.mock('../src/config/database', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
  },
}));

// Redis接続のモック
jest.mock('../src/config/redis', () => ({
  redisClient: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
  },
}));