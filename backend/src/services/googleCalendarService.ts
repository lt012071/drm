import { google } from 'googleapis';
import { UserModel } from '../models/User';

export interface CalendarEvent {
  id: string;
  summary: string;
  description: string;
  start: {
    dateTime: string | null | undefined;
    date: string | null | undefined;
  };
  end: {
    dateTime: string | null | undefined;
    date: string | null | undefined;
  };
  duration: number; // 時間（分）
}

export class GoogleCalendarService {
  // OAuth2クライアントの作成
  private static createOAuth2Client(accessToken: string, refreshToken?: string) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken || null,
    });

    return oauth2Client;
  }

  // 指定日のカレンダー予定を取得
  static async getEventsForDate(userId: string, date: string): Promise<CalendarEvent[]> {
    try {
      // ユーザー情報取得
      const user = await UserModel.findById(userId);
      if (!user || !user.accessToken) {
        throw new Error('ユーザーのアクセストークンが見つかりません');
      }

      // OAuth2クライアント作成
      const auth = this.createOAuth2Client(user.accessToken, user.refreshToken);
      const calendar = google.calendar({ version: 'v3', auth });

      // 指定日の開始・終了時刻（日本時間）
      const startTime = new Date(date + 'T00:00:00+09:00');
      const endTime = new Date(date + 'T23:59:59+09:00');

      // カレンダー予定取得
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: startTime.toISOString(),
        timeMax: endTime.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items || [];
      
      return events.map(event => {
        const start = event.start?.dateTime || event.start?.date;
        const end = event.end?.dateTime || event.end?.date;
        
        // 時間の計算（分単位）
        let duration = 0;
        if (start && end) {
          const startDate = new Date(start);
          const endDate = new Date(end);
          duration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
        }

        return {
          id: event.id || '',
          summary: event.summary || '無題の予定',
          description: event.description || '',
          start: {
            dateTime: event.start?.dateTime,
            date: event.start?.date,
          },
          end: {
            dateTime: event.end?.dateTime,
            date: event.end?.date,
          },
          duration,
        };
      });
    } catch (error) {
      console.error('Google Calendar API error:', error);
      
      // アクセストークンの期限切れなどの場合
      if ((error as any)?.code === 401) {
        throw new Error('Googleカレンダーへのアクセス権限が無効です。再度ログインしてください。');
      }
      
      throw new Error('Googleカレンダーの予定取得に失敗しました');
    }
  }

  // 期間指定でのカレンダー予定取得
  static async getEventsForDateRange(
    userId: string, 
    startDate: string, 
    endDate: string
  ): Promise<CalendarEvent[]> {
    try {
      const user = await UserModel.findById(userId);
      if (!user || !user.accessToken) {
        throw new Error('ユーザーのアクセストークンが見つかりません');
      }

      const auth = this.createOAuth2Client(user.accessToken, user.refreshToken);
      const calendar = google.calendar({ version: 'v3', auth });

      const startTime = new Date(startDate + 'T00:00:00+09:00');
      const endTime = new Date(endDate + 'T23:59:59+09:00');

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: startTime.toISOString(),
        timeMax: endTime.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items || [];
      
      return events.map(event => {
        const start = event.start?.dateTime || event.start?.date;
        const end = event.end?.dateTime || event.end?.date;
        
        let duration = 0;
        if (start && end) {
          const startDate = new Date(start);
          const endDate = new Date(end);
          duration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
        }

        return {
          id: event.id || '',
          summary: event.summary || '無題の予定',
          description: event.description || '',
          start: {
            dateTime: event.start?.dateTime,
            date: event.start?.date,
          },
          end: {
            dateTime: event.end?.dateTime,
            date: event.end?.date,
          },
          duration,
        };
      });
    } catch (error) {
      console.error('Google Calendar API error:', error);
      throw new Error('Googleカレンダーの予定取得に失敗しました');
    }
  }

  // カレンダー予定をタスク形式に変換
  static convertEventsToTasks(events: CalendarEvent[]) {
    return events.map(event => ({
      taskName: event.summary,
      taskType: this.guessTaskType(event.summary, event.description),
      workHours: Math.round((event.duration || 60) / 60 * 10) / 10, // 小数点1桁で時間に変換
      memo: '', // 予定の詳細は反映しない
      googleCalendarEventId: event.id,
    }));
  }

  // イベント名・説明からタスク種別を推測
  private static guessTaskType(summary: string, description?: string): string {
    const text = (summary + ' ' + (description || '')).toLowerCase();
    
    if (text.includes('ミーティング') || text.includes('会議') || 
        text.includes('meeting') || text.includes('打ち合わせ') ||
        text.includes('幹部会') || text.includes('朝礼') ||
        text.includes('定例') || text.includes('進捗共有') ||
        text.includes('mtg') || text.includes('面談')) {
      return '会議';
    }
    
    if (text.includes('開発') || text.includes('実装') || 
        text.includes('コーディング') || text.includes('プログラミング')) {
      return '新規開発';
    }
    
    if (text.includes('レビュー') || text.includes('確認') || 
        text.includes('テスト') || text.includes('検証')) {
      return '定型業務';
    }
    
    if (text.includes('緊急') || text.includes('急') || 
        text.includes('バグ') || text.includes('修正')) {
      return '突発的な作業';
    }
    
    return 'その他';
  }

  // ユーザーのアクセストークン更新
  static async refreshUserToken(userId: string): Promise<void> {
    try {
      const user = await UserModel.findById(userId);
      if (!user || !user.refreshToken) {
        throw new Error('リフレッシュトークンが見つかりません');
      }

      const auth = this.createOAuth2Client(user.accessToken!, user.refreshToken);
      const { credentials } = await auth.refreshAccessToken();

      if (credentials.access_token) {
        await UserModel.updateTokens(
          userId, 
          credentials.access_token, 
          credentials.refresh_token || user.refreshToken
        );
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      throw new Error('アクセストークンの更新に失敗しました');
    }
  }
}