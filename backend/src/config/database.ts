import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

export const pool = new Pool(poolConfig);

// データベース接続テスト
pool.on('connect', () => {
  console.log('📊 PostgreSQL データベースに接続しました');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL 接続エラー:', err);
});

export default pool;