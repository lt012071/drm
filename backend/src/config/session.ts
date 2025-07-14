import session from 'express-session';
import ConnectPgSimple from 'connect-pg-simple';
import { pool } from './database';

const PgSession = ConnectPgSimple(session);

export const sessionConfig: session.SessionOptions = {
  store: new PgSession({
    pool: pool,
    tableName: 'session',
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24時間
  },
};

export default sessionConfig;