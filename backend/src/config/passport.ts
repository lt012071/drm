import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { UserModel } from '../models/User';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_REDIRECT_URI!,
      scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar.readonly']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // ユーザーが既に存在するかチェック
        let user = await UserModel.findByGoogleId(profile.id);
        
        if (user) {
          // 既存ユーザーの場合、アクセストークンを更新
          user = await UserModel.updateTokens(user.id, accessToken, refreshToken);
          return done(null, user);
        }
        
        // 新規ユーザーの場合、データベースに保存
        const newUser = await UserModel.create({
          googleId: profile.id,
          email: profile.emails?.[0]?.value || '',
          name: profile.displayName || '',
          avatar: profile.photos?.[0]?.value || '',
          accessToken,
          refreshToken,
          role: 'member' // デフォルト権限
        });
        
        return done(null, newUser);
      } catch (error) {
        return done(error, undefined);
      }
    }
  )
);

// JWT Strategy
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET!,
    },
    async (payload, done) => {
      try {
        const user = await UserModel.findById(payload.userId);
        if (user) {
          return done(null, user);
        }
        return done(null, false);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await UserModel.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;