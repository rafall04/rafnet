import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';

export function createAuthRoutes(
  authController: AuthController,
  authMiddleware: AuthMiddleware
): Router {
  const router = Router();

  // Public route - login
  router.post('/login', authController.login);

  // Protected route - get current user
  router.get('/me', authMiddleware.authenticate, authController.me);

  return router;
}
