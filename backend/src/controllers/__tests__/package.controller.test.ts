import * as fc from 'fast-check';
import request from 'supertest';
import express, { Express } from 'express';
import { createTestDatabase } from '../../database';
import { PackageRepository, CreatePackageData } from '../../repositories/package.repository';
import { AdminRepository } from '../../repositories/admin.repository';
import { PackageService } from '../../services/package.service';
import { AuthService } from '../../services/auth.service';
import { PackageController } from '../package.controller';
import { createAuthMiddleware } from '../../middleware/auth.middleware';
import { createPackageRoutes } from '../../routes/package.routes';
import Database from 'better-sqlite3';

describe('PackageController Property Tests', () => {
  let db: Database.Database;
  let app: Express;
  let packageRepository: PackageRepository;
  let authService: AuthService;
  let authToken: string;

  beforeEach(async () => {
    db = createTestDatabase();
    packageRepository = new PackageRepository(db);
    const adminRepository = new AdminRepository(db);
    const packageService = new PackageService(packageRepository);
    authService = new AuthService(adminRepository);
    const packageController = new PackageController(packageService);
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
  });

  afterEach(() => {
    db.close();
  });

  const packageDataArbitrary = fc.record({
    name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
    speed: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    price: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }).map(p => Math.round(p * 100) / 100),
    description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
    isActive: fc.boolean()
  });

  /**
   * Feature: raf-net-isp-website, Property 10: Active Package Filtering
   * For any set of packages with mixed active/inactive status, the public endpoint
   * should return only packages where is_active is true, and no inactive packages
   * should appear in the result.
   * Validates: Requirements 1.3, 1.5
   */
  test('Property 10: Active Package Filtering - Validates: Requirements 1.3, 1.5', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(packageDataArbitrary, { minLength: 1, maxLength: 10 }),
        async (packagesData) => {
          // Clear existing packages
          db.exec('DELETE FROM monthly_packages');

          // Create packages with mixed active/inactive status
          const createdPackages: { id: number; isActive: boolean }[] = [];
          for (const data of packagesData) {
            const pkg = packageRepository.create(data as CreatePackageData);
            createdPackages.push({ id: pkg.id, isActive: data.isActive });
          }

          // Call the public /active endpoint
          const response = await request(app).get('/api/packages/active');

          expect(response.status).toBe(200);
          const activePackages = response.body;

          // Verify all returned packages are active
          for (const pkg of activePackages) {
            expect(pkg.isActive).toBe(true);
          }

          // Verify no inactive packages are returned
          const expectedActiveCount = createdPackages.filter(p => p.isActive).length;
          expect(activePackages.length).toBe(expectedActiveCount);

          // Verify all active packages are included
          const activeIds = new Set(activePackages.map((p: { id: number }) => p.id));
          for (const created of createdPackages) {
            if (created.isActive) {
              expect(activeIds.has(created.id)).toBe(true);
            } else {
              expect(activeIds.has(created.id)).toBe(false);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
