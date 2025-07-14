import { Router } from 'express';
import passport from '../config/passport';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';

const router = Router();

// Google OAuth2認証開始
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar.readonly'] 
  })
);

// Google OAuth2コールバック
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=auth_failed` }),
  (req: Request, res: Response) => {
    try {
      // 認証成功時の処理
      const user = req.user as any;
      
      if (!user) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=no_user`);
      }
      
      // JWTトークンを生成
      const jwtSecret = process.env.JWT_SECRET || 'default-secret-for-development';
      const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          role: user.role 
        } as Record<string, any>,
        jwtSecret,
        { expiresIn } as jwt.SignOptions
      );
      
      // フロントエンドにリダイレクト（トークンをクエリパラメータで渡す）
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?token=${token}`);
    } catch (error) {
      console.error('Auth callback error:', error);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=server_error`);
    }
  }
);

// ログアウト
router.post('/logout', (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'ログアウトに失敗しました' });
    }
    return res.json({ message: 'ログアウトしました' });
  });
});

// ユーザー情報取得
router.get('/me', passport.authenticate('jwt', { session: false }), (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: '認証が必要です' });
  }
  return res.json(req.user);
});

export default router;