import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

export interface LoginRequest {
  username: string;
  password: string;
}

export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * POST /api/auth/login
   * Authenticates user and returns JWT token
   * Requirements: 2.1, 2.2
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, password }: LoginRequest = req.body;

      // Validate input
      const errors: { field: string; message: string }[] = [];
      
      if (!username || typeof username !== 'string' || username.trim().length === 0) {
        errors.push({ field: 'username', message: 'Username is required' });
      }
      
      if (!password || typeof password !== 'string' || password.length === 0) {
        errors.push({ field: 'password', message: 'Password is required' });
      }

      if (errors.length > 0) {
        res.status(400).json({
          status: 400,
          message: 'Validation failed',
          errors
        });
        return;
      }

      const result = await this.authService.authenticate(username.trim(), password);

      if (!result.success) {
        res.status(401).json({
          status: 401,
          message: 'Authentication failed',
          error: result.error
        });
        return;
      }

      res.json({
        token: result.token,
        user: result.user
      });
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: 'Internal server error'
      });
    }
  };

  /**
   * GET /api/auth/me
   * Returns current authenticated user info
   * Requirements: 2.3
   */
  me = (req: Request, res: Response): void => {
    try {
      // User info is attached by auth middleware
      if (!req.user) {
        res.status(401).json({
          status: 401,
          message: 'Authentication required'
        });
        return;
      }

      res.json({
        id: req.user.userId,
        username: req.user.username,
        role: req.user.role
      });
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: 'Internal server error'
      });
    }
  };
}
