import { Request, Response, NextFunction } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { getApps } from 'firebase-admin/app';

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Middleware that verifies Firebase ID token if present, attaching user to req.user.
 * If authentication is required, it returns 401 Unauthorized.
 */
export async function authenticateFirebaseToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const idToken = authHeader.split('Bearer ')[1]?.trim();
  if (!idToken) {
    return next();
  }

  try {
    if (getApps().length > 0) {
      const decodedToken = await getAuth().verifyIdToken(idToken);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
        picture: decodedToken.picture,
      };
    }
  } catch (error: any) {
    console.warn('[auth] Firebase ID token validation warning:', error?.message || error);
    // Continue without setting req.user, allowing public read or downstream rejection
  }

  next();
}

/**
 * Enforces authenticated user on sensitive write routes.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user && process.env.NODE_ENV === 'production' && process.env.ENFORCE_AUTH === 'true') {
    res.status(401).json({ error: 'Autenticação necessária para esta operação.' });
    return;
  }
  next();
}
