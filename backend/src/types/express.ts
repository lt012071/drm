import { Request, RequestHandler } from 'express';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export interface OptionalAuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Route handler types
export type AuthenticatedRequestHandler = RequestHandler & {
  (req: OptionalAuthenticatedRequest, res: any): any;
};