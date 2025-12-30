import * as fc from 'fast-check';
import { createTestDatabase } from '../database';
import { PackageRepository, CreatePackageData, UpdatePackageData } from './package.repository';
import Database from 'better-sqlite3';

describe('PackageRepository Property Tests', () => {
  let db: Database.Database;
  let repository: PackageRepository;

  beforeEach(() => {
    db = createTestDatabase();
    repository = new PackageRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  const packageDataArbitrary = fc.record({
    name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
    speed: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    price: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }).map(p => Math.round(p * 100) / 100),
    description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
    isActive: fc.option(fc.boolean(), { nil: undefined })
  });

  const updateDataArbitrary = fc.record({
    name: fc.option(fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0), { nil: undefined }),
    speed: fc.option(fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0), { nil: undefined }),
    price: fc.option(fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }).map(p => Math.round(p * 100) / 100), { nil: undefined }),
    description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
    isActive: fc.option(fc.boolean(), { nil: undefined })
  });

  test('Property 1: Package CRUD Round-Trip - Validates: Requirements 3.1, 3.2', () => {
    fc.assert(
      fc.property(packageDataArbitrary, (data: CreatePackageData) => {
        const created = repository.create(data);
        expect(created.name).toBe(data.name);
        expect(created.speed).toBe(data.speed);
        expect(created.price).toBeCloseTo(data.price, 2);
        if (data.description !== undefined && data.description !== '') {
          expect(created.description).toBe(data.description);
        }
        const expectedActive = data.isActive !== undefined ? data.isActive : true;
        expect(created.is_active).toBe(expectedActive ? 1 : 0);
        const byId = repository.findById(created.id);
        expect(byId).not.toBeNull();
        expect(byId!.name).toBe(data.name);
      }),
      { numRuns: 100 }
    );
  });

  test('Property 2: Package Update Persistence - Validates: Requirements 3.3, 3.5', () => {
    fc.assert(
      fc.property(packageDataArbitrary, updateDataArbitrary, (createData: CreatePackageData, updateData: UpdatePackageData) => {
        const created = repository.create(createData);
        repository.update(created.id, updateData);
        const retrieved = repository.findById(created.id);
        expect(retrieved).not.toBeNull();
        if (updateData.name !== undefined) {
          expect(retrieved!.name).toBe(updateData.name);
        } else {
          expect(retrieved!.name).toBe(createData.name);
        }
        if (updateData.speed !== undefined) {
          expect(retrieved!.speed).toBe(updateData.speed);
        } else {
          expect(retrieved!.speed).toBe(createData.speed);
        }
        if (updateData.price !== undefined) {
          expect(retrieved!.price).toBeCloseTo(updateData.price, 2);
        } else {
          expect(retrieved!.price).toBeCloseTo(createData.price, 2);
        }
      }),
      { numRuns: 100 }
    );
  });

  test('Property 3: Package Delete Removes Record - Validates: Requirements 3.4', () => {
    fc.assert(
      fc.property(packageDataArbitrary, (data: CreatePackageData) => {
        const created = repository.create(data);
        const beforeDelete = repository.findById(created.id);
        expect(beforeDelete).not.toBeNull();
        const deleted = repository.delete(created.id);
        expect(deleted).toBe(true);
        const afterDelete = repository.findById(created.id);
        expect(afterDelete).toBeNull();
      }),
      { numRuns: 100 }
    );
  });
});
