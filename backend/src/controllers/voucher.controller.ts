import { Request, Response } from 'express';
import { VoucherService, ValidationException, CreateVoucherDTO, UpdateVoucherDTO } from '../services/voucher.service';

export class VoucherController {
  constructor(private voucherService: VoucherService) {}

  /**
   * GET /api/vouchers
   * Returns all vouchers (protected route)
   * Requirements: 4.2
   */
  getAll = (_req: Request, res: Response): void => {
    try {
      const vouchers = this.voucherService.findAll();
      res.json(vouchers);
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: 'Internal server error'
      });
    }
  };

  /**
   * GET /api/vouchers/active
   * Returns all active vouchers (public route)
   */
  getActive = (_req: Request, res: Response): void => {
    try {
      const vouchers = this.voucherService.findActive();
      res.json(vouchers);
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: 'Internal server error'
      });
    }
  };

  /**
   * GET /api/vouchers/:id
   * Returns a single voucher by ID
   * Requirements: 4.2
   */
  getById = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id, 10);
      
      if (isNaN(id)) {
        res.status(400).json({
          status: 400,
          message: 'Invalid voucher ID',
          errors: [{ field: 'id', message: 'ID must be a valid number' }]
        });
        return;
      }

      const voucher = this.voucherService.findById(id);
      
      if (!voucher) {
        res.status(404).json({
          status: 404,
          message: 'Voucher not found'
        });
        return;
      }

      res.json(voucher);
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: 'Internal server error'
      });
    }
  };


  /**
   * POST /api/vouchers
   * Creates a new voucher
   * Requirements: 4.1, 4.6, 4.7
   */
  create = (req: Request, res: Response): void => {
    try {
      const data: CreateVoucherDTO = req.body;
      const voucher = this.voucherService.create(data);
      res.status(201).json(voucher);
    } catch (error) {
      if (error instanceof ValidationException) {
        // Check if it's a duplicate code error
        const isDuplicateCode = error.errors.some(e => e.message === 'Voucher code already exists');
        res.status(isDuplicateCode ? 409 : 400).json({
          status: isDuplicateCode ? 409 : 400,
          message: isDuplicateCode ? 'Conflict' : 'Validation failed',
          errors: error.errors
        });
        return;
      }
      res.status(500).json({
        status: 500,
        message: 'Internal server error'
      });
    }
  };

  /**
   * PUT /api/vouchers/:id
   * Updates an existing voucher
   * Requirements: 4.3, 4.5, 4.6
   */
  update = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id, 10);
      
      if (isNaN(id)) {
        res.status(400).json({
          status: 400,
          message: 'Invalid voucher ID',
          errors: [{ field: 'id', message: 'ID must be a valid number' }]
        });
        return;
      }

      const data: UpdateVoucherDTO = req.body;
      const voucher = this.voucherService.update(id, data);
      
      if (!voucher) {
        res.status(404).json({
          status: 404,
          message: 'Voucher not found'
        });
        return;
      }

      res.json(voucher);
    } catch (error) {
      if (error instanceof ValidationException) {
        const isDuplicateCode = error.errors.some(e => e.message === 'Voucher code already exists');
        res.status(isDuplicateCode ? 409 : 400).json({
          status: isDuplicateCode ? 409 : 400,
          message: isDuplicateCode ? 'Conflict' : 'Validation failed',
          errors: error.errors
        });
        return;
      }
      res.status(500).json({
        status: 500,
        message: 'Internal server error'
      });
    }
  };

  /**
   * DELETE /api/vouchers/:id
   * Deletes a voucher
   * Requirements: 4.4
   */
  delete = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id, 10);
      
      if (isNaN(id)) {
        res.status(400).json({
          status: 400,
          message: 'Invalid voucher ID',
          errors: [{ field: 'id', message: 'ID must be a valid number' }]
        });
        return;
      }

      const deleted = this.voucherService.delete(id);
      
      if (!deleted) {
        res.status(404).json({
          status: 404,
          message: 'Voucher not found'
        });
        return;
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: 'Internal server error'
      });
    }
  };
}
