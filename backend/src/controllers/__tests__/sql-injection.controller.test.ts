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

describe('SQL Injection Prevention Property Tests', () => {
  let db: Database.Database;
  let app: Express;
  let authToken: string;
  let packageRepository: PackageRepository;
  let voucherRepository: VoucherRepository;

  beforeEach(async () => {
    db = createTestDatabase();
    packageRepository = new PackageRepository(db);
    voucherRepository = new VoucherRepository(db);
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

    // Seed some initial data to verify it's not deleted
    packageRepository.create({ name: 'Test Package', speed: '10 Mbps', price: 100 });
    voucherRepository.create({ code: 'TEST001', duration: '1 hour', price: 5 });
  });

  afterEach(() => {
    db.close();
  });


  // SQL injection patterns to test
  const sqlInjectionPatterns = [
    "'; DROP TABLE monthly_packages; --",
    "'; DROP TABLE vouchers; --",
    "'; DELETE FROM monthly_packages; --",
    "1; DROP TABLE monthly_packages",
    "1 OR 1=1",
    "' OR '1'='1",
    "'; UPDATE monthly_packages SET price=0; --",
    "'; INSERT INTO admins VALUES (999, 'hacker', 'hash', 'admin'); --",
    "UNION SELECT * FROM admins --",
    "' UNION SELECT username, password_hash FROM admins --",
    "'; TRUNCATE TABLE monthly_packages; --",
    "1; SELECT * FROM admins WHERE '1'='1",
    "Robert'); DROP TABLE monthly_packages;--",
    "' OR ''='",
    "admin'--",
    "1' AND '1'='1",
    "' OR 1=1--",
    "' OR 'x'='x",
    "') OR ('1'='1",
    "'; EXEC xp_cmdshell('dir'); --"
  ];

  // Arbitrary that generates SQL injection patterns
  const sqlInjectionArbitrary = fc.constantFrom(...sqlInjectionPatterns);

  // Arbitrary for package data with SQL injection in various fields
  const packageWithInjectionArbitrary = fc.record({
    name: sqlInjectionArbitrary,
    speed: fc.oneof(sqlInjectionArbitrary, fc.constant('10 Mbps')),
    price: fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true }),
    description: fc.option(sqlInjectionArbitrary, { nil: undefined })
  });

  // Arbitrary for voucher data with SQL injection in various fields
  const voucherWithInjectionArbitrary = fc.record({
    code: sqlInjectionArbitrary,
    duration: fc.oneof(sqlInjectionArbitrary, fc.constant('1 hour')),
    price: fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true })
  });

  /**
   * Feature: raf-net-isp-website, Property 14: SQL Injection Prevention
   * For any input containing SQL injection patterns, the input should be safely handled
   * without executing malicious SQL, and the database should remain intact.
   * Validates: Requirements 6.2, 6.4
   */
  test('Property 14: SQL Injection Prevention for Packages - Validates: Requirements 6.2, 6.4', async () => {
    await fc.assert(
      fc.asyncProperty(packageWithInjectionArbitrary, async (injectionData) => {
        // Count tables before the request
        const packageCountBefore = packageRepository.findAll().length;
        const tablesBefore = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();

        // Attempt to create package with SQL injection payload
        const response = await request(app)
          .post('/api/packages')
          .set('Authorization', `Bearer ${authToken}`)
          .send(injectionData);

        // The request should either succeed (treating injection as literal string)
        // or fail with validation error - but never execute the SQL injection
        expect([200, 201, 400]).toContain(response.status);

        // Verify database integrity - tables should still exist
        const tablesAfter = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
        expect(tablesAfter.length).toBe(tablesBefore.length);

        // Verify the original test data still exists
        const packages = packageRepository.findAll();
        expect(packages.length).toBeGreaterThanOrEqual(packageCountBefore);

        // If creation succeeded, verify the injection string was stored literally
        if (response.status === 201) {
          const created = response.body;
          expect(created.name).toBe(injectionData.name);
        }
      }),
      { numRuns: 100 }
    );
  });


  test('Property 14: SQL Injection Prevention for Vouchers - Validates: Requirements 6.2, 6.4', async () => {
    // Track unique codes to avoid duplicate code errors
    let codeCounter = 0;

    await fc.assert(
      fc.asyncProperty(voucherWithInjectionArbitrary, async (injectionData) => {
        // Make code unique by appending counter
        const uniqueInjectionData = {
          ...injectionData,
          code: `${injectionData.code}_${codeCounter++}`
        };

        // Count tables before the request
        const voucherCountBefore = voucherRepository.findAll().length;
        const tablesBefore = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();

        // Attempt to create voucher with SQL injection payload
        const response = await request(app)
          .post('/api/vouchers')
          .set('Authorization', `Bearer ${authToken}`)
          .send(uniqueInjectionData);

        // The request should either succeed (treating injection as literal string)
        // or fail with validation/conflict error - but never execute the SQL injection
        expect([200, 201, 400, 409]).toContain(response.status);

        // Verify database integrity - tables should still exist
        const tablesAfter = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
        expect(tablesAfter.length).toBe(tablesBefore.length);

        // Verify the original test data still exists
        const vouchers = voucherRepository.findAll();
        expect(vouchers.length).toBeGreaterThanOrEqual(voucherCountBefore);

        // If creation succeeded, verify the injection string was stored literally
        if (response.status === 201) {
          const created = response.body;
          expect(created.code).toBe(uniqueInjectionData.code);
        }
      }),
      { numRuns: 100 }
    );
  });

  test('Property 14: SQL Injection Prevention in URL parameters - Validates: Requirements 6.2, 6.4', async () => {
    await fc.assert(
      fc.asyncProperty(sqlInjectionArbitrary, async (injectionPayload) => {
        // Count tables before the request
        const tablesBefore = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();

        // Attempt to access package with SQL injection in ID parameter
        const response = await request(app)
          .get(`/api/packages/${encodeURIComponent(injectionPayload)}`)
          .set('Authorization', `Bearer ${authToken}`);

        // Should return 400 (invalid ID), 404 (not found), or 200 (if parsed as valid number)
        // The key is that the SQL injection should NOT execute
        expect([200, 400, 404]).toContain(response.status);

        // Verify database integrity - tables should still exist
        const tablesAfter = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
        expect(tablesAfter.length).toBe(tablesBefore.length);

        // Verify original data still exists (this is the critical check)
        const packages = packageRepository.findAll();
        expect(packages.some(p => p.name === 'Test Package')).toBe(true);

        // If we got a 200, verify it didn't return all records (SQL injection like "1 OR 1=1")
        if (response.status === 200) {
          // Should return a single package object, not an array of all packages
          expect(Array.isArray(response.body)).toBe(false);
        }
      }),
      { numRuns: 50 }
    );
  });
});
