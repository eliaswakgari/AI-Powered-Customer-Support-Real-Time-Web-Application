import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthUser {
         id: string;
         role: 'admin' | 'agent' | 'customer';
}

declare global {
         namespace Express {
                  interface Request {
                           user?: AuthUser;
                  }
         }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
         const token = req.cookies?.token;
         if (!token) {
                  return res.status(401).json({ message: 'Not authenticated' });
         }

         try {
                  const secret = process.env.JWT_SECRET || 'change-me';
                  const decoded = jwt.verify(token, secret) as AuthUser;
                  req.user = decoded;
                  return next();
         } catch {
                  return res.status(401).json({ message: 'Invalid token' });
         }
};

export const requireRoles = (...roles: AuthUser['role'][]) => {
         return (req: Request, res: Response, next: NextFunction) => {
                  if (!req.user || !roles.includes(req.user.role)) {
                           return res.status(403).json({ message: 'Forbidden' });
                  }
                  return next();
         };
};
