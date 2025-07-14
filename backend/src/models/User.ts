import { pool } from '../config/database';

export interface User {
  id: string;
  googleId: string;
  email: string;
  name: string;
  avatar: string;
  accessToken: string;
  refreshToken?: string;
  asanaAccessToken?: string;
  asanaRefreshToken?: string;
  role: 'member' | 'admin' | 'developer';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  googleId: string;
  email: string;
  name: string;
  avatar: string;
  accessToken: string;
  refreshToken?: string;
  role: 'member' | 'admin' | 'developer';
}

export class UserModel {
  static async findByGoogleId(googleId: string): Promise<User | null> {
    try {
      const query = `
        SELECT 
          id,
          google_id as "googleId",
          email,
          name,
          avatar,
          access_token as "accessToken",
          refresh_token as "refreshToken",
          asana_access_token as "asanaAccessToken",
          asana_refresh_token as "asanaRefreshToken",
          role,
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM users 
        WHERE google_id = $1
      `;
      const result = await pool.query(query, [googleId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('findByGoogleId error:', error);
      throw error;
    }
  }

  static async findById(id: string): Promise<User | null> {
    try {
      const query = `
        SELECT 
          id,
          google_id as "googleId",
          email,
          name,
          avatar,
          access_token as "accessToken",
          refresh_token as "refreshToken",
          asana_access_token as "asanaAccessToken",
          asana_refresh_token as "asanaRefreshToken",
          role,
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM users 
        WHERE id = $1
      `;
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('findById error:', error);
      throw error;
    }
  }

  static async create(userData: CreateUserData): Promise<User> {
    try {
      const query = `
        INSERT INTO users (google_id, email, name, avatar, access_token, refresh_token, role)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const values = [
        userData.googleId,
        userData.email,
        userData.name,
        userData.avatar,
        userData.accessToken,
        userData.refreshToken,
        userData.role
      ];
      
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('create user error:', error);
      throw error;
    }
  }

  static async updateTokens(id: string, accessToken: string, refreshToken?: string): Promise<User> {
    try {
      const query = `
        UPDATE users 
        SET access_token = $1, refresh_token = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `;
      const result = await pool.query(query, [accessToken, refreshToken, id]);
      return result.rows[0];
    } catch (error) {
      console.error('updateTokens error:', error);
      throw error;
    }
  }

  static async updateAsanaTokens(id: string, asanaAccessToken: string, asanaRefreshToken?: string): Promise<User> {
    try {
      const query = `
        UPDATE users 
        SET asana_access_token = $1, asana_refresh_token = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `;
      const result = await pool.query(query, [asanaAccessToken, asanaRefreshToken, id]);
      return result.rows[0];
    } catch (error) {
      console.error('updateAsanaTokens error:', error);
      throw error;
    }
  }
}