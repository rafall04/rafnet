import * as fc from 'fast-check';
import request from 'supertest';
import express, { Express } from 'express';
import { createTestDatabase } from '../../database';
import { PackageRepository } from '../../repositories/package.repository';
import { VoucherRepository } from '../../repositories/voucher.repository';
import { AdminRepository } from '../../repositories/admin.repository';
import { PackageService } from '../../services/package.service';
import { VoucherService } from '../../services/voucher.service';
import { AuthService } from '../../services/auth.service';
import { PackageController } from '../package.controller';
import { VoucherController } from '../voucher.controller';
import { createAuthMiddleware } from '../../middleware/auth.middleware';
import { createPackageRoutes } from '../../routes/package.routes';
import { createVoucherRoutes } from '../../routes/voucher.routes';
import Database from 'better-sqlite3';

describe('Validation Error Response Property Tests', () => {
  let db: Database.Database;
  let app: Express;
  let authToken: string;

  beforeEach(async () => {
    db = createTestDatabase();
    const packageRepository = new PackageRepository(db);
    const voucherRepository = new VoucherRepository(db);
    const adminRepository = new AdminRepository(db);
    const packageService = new PackageService(packageRepository);
    const voucherService = new VoucherService(voucherRepository);
    const authService = new AuthService(adminRepository);
    const packageController = new PackageController(packageService);
    const voucherController = new VoucherController(voucherService);
    const authMiddleware = createAuthMiddleware(authService);

    // Create test admin user
    const passwordHash = await authService.hashPassword('testpassword');
    adminRepository.create({
      username: 'testadmin',
      passwordHash,
      role: 'admin'
    });

    // Get auth token
    const authResult = await authService.authenticate('testadmin', 'testpassword');
    authToken = authResult.token!;

    // Setup express app
    app = express();
    app.use(express.json());
    app.use('/api/packages', createPackageRoutes(packageController, authMiddleware));
    app.use('/api/vouchers', createVoucherRoutes(voucherController, authMiddleware));
  });

  afterEach(() => {
    db.close();
  });

  // Arbitrary for invalid package data (missing required fields)
  const invalidPackageDataArbitrary = fc.oneof(
    // Missing name
    fc.record({
      speed: fc.string({ minLength: 1 }),
      price: fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true })
    }),
    // Missing speed
    fc.record({
      name: fc.string({ minLength: 1 }),
      price: fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true })
    }),
    // Missing price
    fc.record({
      name: fc.string({ minLength: 1 }),
      speed: fc.string({ minLength: 1 })
    }),
    // Empty name
    fc.record({
      name: fc.constant(''),
      speed: fc.string({ minLength: 1 }),
      price: fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true })
    }),
    // Whitespace-only name
    fc.record({
      name: fc.constant('   '),
      speed: fc.string({ minLength: 1 }),
      price: fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true })
    }),
    // Negative price
    fc.record({
      name: fc.string({ minLength: 1 }),
      speed: fc.string({ minLength: 1 }),
      price: fc.float({ min: Math.fround(-1000), max: Math.fround(-0.01), noNaN: true })
    })
  );


  // Arbitrary for invalid voucher data (missing required fields)
  const invalidVoucherDataArbitrary = fc.oneof(
    // Missing code
    fc.record({
      duration: fc.string({ minLength: 1 }),
      price: fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true })
    }),
    // Missing duration
    fc.record({
      code: fc.string({ minLength: 1 }),
      price: fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true })
    }),
    // Missing price
    fc.record({
      code: fc.string({ minLength: 1 }),
      duration: fc.string({ minLength: 1 })
    }),
    // Empty code
    fc.record({
      code: fc.constant(''),
      duration: fc.string({ minLength: 1 }),
      price: fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true })
    }),
    // Whitespace-only code
    fc.record({
      code: fc.constant('   '),
      duration: fc.string({ minLength: 1 }),
      price: fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true })
    }),
    // Negative price
    fc.record({
      code: fc.string({ minLength: 1 }),
      duration: fc.string({ minLength: 1 }),
      price: fc.float({ min: Math.fround(-1000), max: Math.fround(-0.01), noNaN: true })
    })
  );

  /**
   * Feature: raf-net-isp-website, Property 13: Validation Error Response
   * For any invalid input data (missing required fields, wrong types, constraint violations),
   * the API should return a 400 status with specific field-level error messages.
   * Validates: Requirements 3.6, 4.6, 6.3
   */
  test('Property 13: Validation Error Response for Packages - Validates: Requirements 3.6, 6.3', async () => {
    await fc.assert(
      fc.asyncProperty(invalidPackageDataArbitrary, async (invalidData) => {
        const response = await request(app)
          .post('/api/packages')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidData);

        // Should return 400 for validation errors
        expect(response.status).toBe(400);
        
        // Should have proper error structure
        expect(response.body).toHaveProperty('status', 400);
        expect(response.body).toHaveProperty('message', 'Validation failed');
        expect(response.body).toHaveProperty('errors');
        expect(Array.isArray(response.body.errors)).toBe(true);
        expect(response.body.errors.length).toBeGreaterThan(0);

        // Each error should have field and message
        for (const error of response.body.errors) {
          expect(error).toHaveProperty('field');
          expect(error).toHaveProperty('message');
          expect(typeof error.field).toBe('string');
          expect(typeof error.message).toBe('string');
        }
      }),
      { numRuns: 100 }
    );
  });

  test('Property 13: Validation Error Response for Vouchers - Validates: Requirements 4.6, 6.3', async () => {
    await fc.assert(
      fc.asyncProperty(invalidVoucherDataArbitrary, async (invalidData) => {
        const response = await request(app)
          .post('/api/vouchers')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidData);

        // Should return 400 for validation errors
        expect(response.status).toBe(400);
        
        // Should have proper error structure
        expect(response.body).toHaveProperty('status', 400);
        expect(response.body).toHaveProperty('message', 'Validation failed');
        expect(response.body).toHaveProperty('errors');
        expect(Array.isArray(response.body.errors)).toBe(true);
        expect(response.body.errors.length).toBeGreaterThan(0);

        // Each error should have field and message
        for (const error of response.body.errors) {
          expect(error).toHaveProperty('field');
          expect(error).toHaveProperty('message');
          expect(typeof error.field).toBe('string');
          expect(typeof error.message).toBe('string');
        }
      }),
      { numRuns: 100 }
    );
  });
});
