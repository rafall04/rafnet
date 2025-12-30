import { Router } from 'express';
import { createPackageRoutes } from './package.routes';
import { createVoucherRoutes } from './voucher.routes';
import { createAuthRoutes } from './auth.routes';
import { PackageController } from '../controllers/package.controller';
import { VoucherController } from '../controllers/voucher.controller';
import { AuthController } from '../controllers/auth.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';

export interface RouteControllers {
  packageController: PackageController;
  voucherController: VoucherController;
  authController: AuthController;
  authMiddleware: AuthMiddleware;
}

export function createApiRoutes(controllers: RouteControllers): Router {
  const router = Router();

  router.use('/packages', createPackageRoutes(
    controllers.packageController,
    controllers.authMiddleware
  ));

  router.use('/vouchers', createVoucherRoutes(
    controllers.voucherController,
    controllers.authMiddleware
  ));

  router.use('/auth', createAuthRoutes(
    controllers.authController,
    controllers.authMiddleware
  ));

  return router;
}
