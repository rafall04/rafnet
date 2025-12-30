import { Router } from 'express';
import { VoucherController } from '../controllers/voucher.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';

export function createVoucherRoutes(
  voucherController: VoucherController,
  authMiddleware: AuthMiddleware
): Router {
  const router = Router();

  // Public route for active vouchers
  router.get('/active', voucherController.getActive);

  // Protected routes
  router.get('/', authMiddleware.authenticate, voucherController.getAll);
  router.get('/:id', authMiddleware.authenticate, voucherController.getById);
  router.post('/', authMiddleware.authenticate, voucherController.create);
  router.put('/:id', authMiddleware.authenticate, voucherController.update);
  router.delete('/:id', authMiddleware.authenticate, voucherController.delete);

  return router;
}
