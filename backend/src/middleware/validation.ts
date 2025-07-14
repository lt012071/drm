import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// バリデーション結果をチェックするミドルウェア
export const checkValidation = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'バリデーションエラー',
      details: errors.array()
    });
  }
  return next();
};

// 日報作成・更新バリデーション
export const validateDailyReport = [
  body('reportDate')
    .isISO8601()
    .withMessage('日付は有効なISO8601形式である必要があります'),
  
  body('remarks')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('備考は2000文字以内で入力してください'),
  
  body('tasks')
    .isArray({ min: 1 })
    .withMessage('少なくとも1つのタスクが必要です'),
  
  body('tasks.*.taskName')
    .notEmpty()
    .withMessage('タスク名は必須です')
    .isLength({ max: 500 })
    .withMessage('タスク名は500文字以内で入力してください'),
  
  body('tasks.*.taskType')
    .isIn(['新規開発', '定型業務', '会議', '突発的な作業', 'その他'])
    .withMessage('有効なタスク種別を選択してください'),
  
  body('tasks.*.workHours')
    .isFloat({ min: 0, max: 24 })
    .withMessage('作業時間は0以上24以下の数値で入力してください'),
  
  body('tasks.*.memo')
    .optional()
    .isLength({ max: 500 })
    .withMessage('メモは500文字以内で入力してください'),

  checkValidation
];

// 日付バリデーション
export const validateDate = [
  param('date')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('日付はYYYY-MM-DD形式で入力してください'),

  checkValidation
];

// 期間バリデーション
export const validateDateRange = [
  query('startDate')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('開始日はYYYY-MM-DD形式で入力してください'),
  
  query('endDate')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('終了日はYYYY-MM-DD形式で入力してください'),

  checkValidation
];

// UUIDバリデーション
export const validateUUID = [
  param('id')
    .isUUID()
    .withMessage('有効なIDを指定してください'),

  checkValidation
];