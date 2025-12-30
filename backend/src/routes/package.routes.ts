import { Router } from 'express';
import { PackageController } from '../controllers/package.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';

export function createPackageRoutes(
  packageController: PackageController,
  authMiddleware: AuthMiddleware
): Router {
  const router = Router();

  // Public route - get active packages only
  router.get('/active', packageController.getActive);

  // Protected routes - require authentication
  router.get('/', authMiddleware.authenticate, packageController.getAll);
  router.get('/:id', authMiddleware.authenticate, packageController.getById);
  router.post('/', authMiddleware.authenticate, packageController.create);
  router.put('/:id', authMiddleware.authenticate, packageController.update);
  router.delete('/:id', authMiddleware.authenticate, packageController.delete);

  return router;
}
