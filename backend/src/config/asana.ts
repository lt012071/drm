import { Strategy as BearerStrategy } from 'passport-http-bearer';
import passport from 'passport';
import axios from 'axios';
import { UserModel } from '../models/User';

export interface AsanaOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
}

export class AsanaOAuth {
  private static config: AsanaOAuthConfig = {
    clientId: process.env.ASANA_CLIENT_ID!,
    clientSecret: process.env.ASANA_CLIENT_SECRET!,
    redirectUri: process.env.ASANA_REDIRECT_URI!,
    scope: 'default'
  };

  // OAuth2認証URLを生成
  static generateAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scope,
    });

    if (state) {
      params.append('state', state);
    }

    return `https://app.asana.com/-/oauth_authorize?${params.toString()}`;
  }

  // 認証コードからアクセストークンを取得
  static async exchangeCodeForToken(code: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  }> {
    try {
      const response = await axios.post('https://app.asana.com/-/oauth_token', {
        grant_type: 'authorization_code',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri,
        code: code,
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Asana token exchange error:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`Asana OAuth Error: ${error.response.data.error_description || error.response.data.error}`);
      }
      throw new Error('Asanaアクセストークンの取得に失敗しました');
    }
  }

  // リフレッシュトークンを使用してアクセストークンを更新
  static async refreshAccessToken(refreshToken: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  }> {
    try {
      const response = await axios.post('https://app.asana.com/-/oauth_token', {
        grant_type: 'refresh_token',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: refreshToken,
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Asana token refresh error:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`Asana OAuth Error: ${error.response.data.error_description || error.response.data.error}`);
      }
      throw new Error('Asanaアクセストークンの更新に失敗しました');
    }
  }

  // アクセストークンの有効性を検証
  static async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await axios.get('https://app.asana.com/api/1.0/users/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  // ユーザーのAsanaアクセストークンを自動更新
  static async refreshUserToken(userId: string): Promise<void> {
    try {
      const user = await UserModel.findById(userId);
      if (!user || !user.asanaRefreshToken) {
        throw new Error('リフレッシュトークンが見つかりません');
      }

      const tokenData = await this.refreshAccessToken(user.asanaRefreshToken);
      
      await UserModel.updateAsanaTokens(
        userId,
        tokenData.access_token,
        tokenData.refresh_token
      );
    } catch (error) {
      console.error('User token refresh error:', error);
      throw new Error('Asanaアクセストークンの更新に失敗しました');
    }
  }
}

// Passport Bearer Strategy for Asana
passport.use('asana-bearer', new BearerStrategy(
  async (token: string, done: any) => {
    try {
      // トークンの有効性を確認
      const isValid = await AsanaOAuth.validateToken(token);
      if (!isValid) {
        return done(null, false);
      }

      // トークンからユーザー情報を取得
      const response = await axios.get('https://app.asana.com/api/1.0/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const asanaUser = response.data.data;
      
      // データベースからユーザーを検索（Asanaアクセストークンで）
      // 注意: この実装では簡単のため、トークンだけでユーザーを特定しています
      // 実際の実装では、より安全な方法を使用してください
      return done(null, { asanaUser, token });
    } catch (error) {
      return done(error, false);
    }
  }
));

export default AsanaOAuth;