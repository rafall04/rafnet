import { Request, Response } from 'express';
import { PackageService, ValidationException, CreatePackageDTO, UpdatePackageDTO } from '../services/package.service';

export class PackageController {
  constructor(private packageService: PackageService) {}

  /**
   * GET /api/packages
   * Returns all packages (protected route)
   * Requirements: 3.2
   */
  getAll = (_req: Request, res: Response): void => {
    try {
      const packages = this.packageService.findAll();
      res.json(packages);
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: 'Internal server error'
      });
    }
  };

  /**
   * GET /api/packages/active
   * Returns only active packages (public route)
   * Requirements: 1.3, 1.5
   */
  getActive = (_req: Request, res: Response): void => {
    try {
      const packages = this.packageService.findActive();
      res.json(packages);
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: 'Internal server error'
      });
    }
  };

  /**
   * GET /api/packages/:id
   * Returns a single package by ID
   * Requirements: 3.2
   */
  getById = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id, 10);
      
      if (isNaN(id)) {
        res.status(400).json({
          status: 400,
          message: 'Invalid package ID',
          errors: [{ field: 'id', message: 'ID must be a valid number' }]
        });
        return;
      }

      const pkg = this.packageService.findById(id);
      
      if (!pkg) {
        res.status(404).json({
          status: 404,
          message: 'Package not found'
        });
        return;
      }

      res.json(pkg);
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: 'Internal server error'
      });
    }
  };


  /**
   * POST /api/packages
   * Creates a new package
   * Requirements: 3.1, 3.6
   */
  create = (req: Request, res: Response): void => {
    try {
      const data: CreatePackageDTO = req.body;
      const pkg = this.packageService.create(data);
      res.status(201).json(pkg);
    } catch (error) {
      if (error instanceof ValidationException) {
        res.status(400).json({
          status: 400,
          message: 'Validation failed',
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
   * PUT /api/packages/:id
   * Updates an existing package
   * Requirements: 3.3, 3.5, 3.6
   */
  update = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id, 10);
      
      if (isNaN(id)) {
        res.status(400).json({
          status: 400,
          message: 'Invalid package ID',
          errors: [{ field: 'id', message: 'ID must be a valid number' }]
        });
        return;
      }

      const data: UpdatePackageDTO = req.body;
      const pkg = this.packageService.update(id, data);
      
      if (!pkg) {
        res.status(404).json({
          status: 404,
          message: 'Package not found'
        });
        return;
      }

      res.json(pkg);
    } catch (error) {
      if (error instanceof ValidationException) {
        res.status(400).json({
          status: 400,
          message: 'Validation failed',
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
   * DELETE /api/packages/:id
   * Deletes a package
   * Requirements: 3.4
   */
  delete = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id, 10);
      
      if (isNaN(id)) {
        res.status(400).json({
          status: 400,
          message: 'Invalid package ID',
          errors: [{ field: 'id', message: 'ID must be a valid number' }]
        });
        return;
      }

      const deleted = this.packageService.delete(id);
      
      if (!deleted) {
        res.status(404).json({
          status: 404,
          message: 'Package not found'
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
