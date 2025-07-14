import { User } from '../types/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export class AuthService {
  private static TOKEN_KEY = 'drm_token';

  // Google OAuth2認証開始
  static loginWithGoogle(): void {
    window.location.href = `${API_BASE_URL}/auth/google`;
  }

  // トークンを保存
  static saveToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  // トークンを取得
  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // トークンを削除
  static removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  // ログイン状態チェック
  static isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  // ユーザー情報取得
  static async getCurrentUser(): Promise<User | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('ユーザー情報の取得に失敗しました');
      }

      return await response.json();
    } catch (error) {
      console.error('ユーザー情報取得エラー:', error);
      return null;
    }
  }

  // ログアウト
  static async logout(): Promise<void> {
    const token = this.getToken();
    
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error('ログアウトエラー:', error);
      }
    }
    
    this.removeToken();
  }
}