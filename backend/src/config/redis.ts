import Redis from 'ioredis';

// Redis設定
const getRedisConfig = () => {
  if (process.env.REDIS_URL) {
    // AWS ElastiCache用
    return new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
    });
  } else if (process.env.NODE_ENV === 'production') {
    // 本番環境でREDIS_URLが未設定の場合
    throw new Error('REDIS_URL is required in production environment');
  } else {
    // 開発環境用（Docker）
    return new Redis({
      host: 'redis',
      port: 6379,
    });
  }
};

export const redis = getRedisConfig();

// Redis接続テスト
redis.on('connect', () => {
  console.log('🔴 Redis に接続しました');
});

redis.on('error', (err: Error) => {
  console.error('❌ Redis 接続エラー:', err);
});

export default redis;