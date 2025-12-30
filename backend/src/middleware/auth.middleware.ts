import { Request, Response, NextFunction } from 'express';
import { AuthService, TokenPayload } from '../services/auth.service';

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export class AuthMiddleware {
  constructor(private authService: AuthService) {}

  /**
   * Middleware to verify JWT token and protect routes
   * Returns 401 for missing/invalid/expired tokens
   * Requirements: 2.3, 2.4, 6.1
   */
  authenticate = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        status: 401,
        message: 'Authentication required',
        error: 'No authorization header provided'
      });
      return;
    }

    // Check for Bearer token format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({
        status: 401,
        message: 'Authentication required',
        error: 'Invalid authorization header format. Use: Bearer <token>'
      });
      return;
    }

    const token = parts[1];

    // Verify the token
    const payload = this.authService.verifyToken(token);

    if (!payload) {
      res.status(401).json({
        status: 401,
        message: 'Authentication failed',
        error: 'Invalid or expired token'
      });
      return;
    }

    // Attach user info to request
    req.user = payload;
    next();
  };
}

// Factory function to create middleware with injected auth service
export function createAuthMiddleware(authService: AuthService): AuthMiddleware {
  return new AuthMiddleware(authService);
}
