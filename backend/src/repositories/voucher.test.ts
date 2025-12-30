import * as fc from 'fast-check';
import { createTestDatabase } from '../database';
import { VoucherRepository, CreateVoucherData, UpdateVoucherData } from './voucher.repository';
import Database from 'better-sqlite3';

describe('VoucherRepository Property Tests', () => {
  let db: Database.Database;
  let repository: VoucherRepository;

  beforeEach(() => {
    db = createTestDatabase();
    repository = new VoucherRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  // Generate unique voucher codes using UUID-like strings
  const voucherCodeArbitrary = fc.uuid().map(uuid => uuid.replace(/-/g, '').substring(0, 16).toUpperCase());

  const voucherDataArbitrary = fc.record({
    code: voucherCodeArbitrary,
    duration: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    price: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }).map(p => Math.round(p * 100) / 100),
    isActive: fc.option(fc.boolean(), { nil: undefined })
  });

  const updateDataArbitrary = fc.record({
    code: fc.option(voucherCodeArbitrary, { nil: undefined }),
    duration: fc.option(fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0), { nil: undefined }),
    price: fc.option(fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }).map(p => Math.round(p * 100) / 100), { nil: undefined }),
    isActive: fc.option(fc.boolean(), { nil: undefined })
  });

  // Feature: raf-net-isp-website, Property 4: Voucher CRUD Round-Trip
  test('Property 4: Voucher CRUD Round-Trip - Validates: Requirements 4.1, 4.2', () => {
    fc.assert(
      fc.property(voucherDataArbitrary, (data: CreateVoucherData) => {
        const created = repository.create(data);
        expect(created.code).toBe(data.code);
        expect(created.duration).toBe(data.duration);
        expect(created.price).toBeCloseTo(data.price, 2);
        const expectedActive = data.isActive !== undefined ? data.isActive : true;
        expect(created.is_active).toBe(expectedActive ? 1 : 0);
        
        const byId = repository.findById(created.id);
        expect(byId).not.toBeNull();
        expect(byId!.code).toBe(data.code);
        expect(byId!.duration).toBe(data.duration);
        expect(byId!.price).toBeCloseTo(data.price, 2);
        
        const byCode = repository.findByCode(data.code);
        expect(byCode).not.toBeNull();
        expect(byCode!.id).toBe(created.id);
        
        const all = repository.findAll();
        expect(all.some(v => v.id === created.id)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  // Feature: raf-net-isp-website, Property 5: Voucher Update Persistence
  test('Property 5: Voucher Update Persistence - Validates: Requirements 4.3, 4.5', () => {
    fc.assert(
      fc.property(voucherDataArbitrary, updateDataArbitrary, (createData: CreateVoucherData, updateData: UpdateVoucherData) => {
        const created = repository.create(createData);
        
        // If updating code, ensure it's unique by appending the id
        const safeUpdateData = { ...updateData };
        if (safeUpdateData.code !== undefined) {
          safeUpdateData.code = `${safeUpdateData.code}_${created.id}`;
        }
        
        repository.update(created.id, safeUpdateData);
        const retrieved = repository.findById(created.id);
        expect(retrieved).not.toBeNull();
        
        if (safeUpdateData.code !== undefined) {
          expect(retrieved!.code).toBe(safeUpdateData.code);
        } else {
          expect(retrieved!.code).toBe(createData.code);
        }
        if (safeUpdateData.duration !== undefined) {
          expect(retrieved!.duration).toBe(safeUpdateData.duration);
        } else {
          expect(retrieved!.duration).toBe(createData.duration);
        }
        if (safeUpdateData.price !== undefined) {
          expect(retrieved!.price).toBeCloseTo(safeUpdateData.price, 2);
        } else {
          expect(retrieved!.price).toBeCloseTo(createData.price, 2);
        }
        if (safeUpdateData.isActive !== undefined) {
          expect(retrieved!.is_active).toBe(safeUpdateData.isActive ? 1 : 0);
        } else {
          const expectedActive = createData.isActive !== undefined ? createData.isActive : true;
          expect(retrieved!.is_active).toBe(expectedActive ? 1 : 0);
        }
      }),
      { numRuns: 100 }
    );
  });

  // Feature: raf-net-isp-website, Property 6: Voucher Delete Removes Record
  test('Property 6: Voucher Delete Removes Record - Validates: Requirements 4.4', () => {
    fc.assert(
      fc.property(voucherDataArbitrary, (data: CreateVoucherData) => {
        const created = repository.create(data);
        
        // Verify voucher exists before delete
        const beforeDelete = repository.findById(created.id);
        expect(beforeDelete).not.toBeNull();
        
        // Delete the voucher
        const deleted = repository.delete(created.id);
        expect(deleted).toBe(true);
        
        // Verify voucher no longer exists
        const afterDelete = repository.findById(created.id);
        expect(afterDelete).toBeNull();
        
        // Verify findByCode also returns null
        const byCode = repository.findByCode(data.code);
        expect(byCode).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  // Feature: raf-net-isp-website, Property 7: Voucher Code Uniqueness
  test('Property 7: Voucher Code Uniqueness - Validates: Requirements 4.7, 7.5', () => {
    fc.assert(
      fc.property(voucherDataArbitrary, (data: CreateVoucherData) => {
        // Create first voucher
        const created = repository.create(data);
        expect(created).not.toBeNull();
        
        // Attempt to create second voucher with same code should throw due to UNIQUE constraint
        expect(() => {
          repository.create(data);
        }).toThrow();
        
        // Verify only one voucher exists with this code
        const all = repository.findAll();
        const withSameCode = all.filter(v => v.code === data.code);
        expect(withSameCode.length).toBe(1);
      }),
      { numRuns: 100 }
    );
  });
});
