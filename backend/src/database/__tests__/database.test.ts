import { createTestDatabase } from '../index';
import Database from 'better-sqlite3';

describe('Database Initialization', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDatabase();
  });

  afterEach(() => {
    db.close();
  });

  it('should create monthly_packages table', () => {
    const tables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='monthly_packages'"
    ).all();
    expect(tables).toHaveLength(1);
  });

  it('should create vouchers table', () => {
    const tables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='vouchers'"
    ).all();
    expect(tables).toHaveLength(1);
  });

  it('should create admins table', () => {
    const tables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='admins'"
    ).all();
    expect(tables).toHaveLength(1);
  });

  it('should have correct columns in monthly_packages table', () => {
    const columns = db.prepare("PRAGMA table_info(monthly_packages)").all() as Array<{ name: string }>;
    const columnNames = columns.map(c => c.name);
    
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('name');
    expect(columnNames).toContain('speed');
    expect(columnNames).toContain('price');
    expect(columnNames).toContain('description');
    expect(columnNames).toContain('is_active');
    expect(columnNames).toContain('created_at');
    expect(columnNames).toContain('updated_at');
  });

  it('should have correct columns in vouchers table', () => {
    const columns = db.prepare("PRAGMA table_info(vouchers)").all() as Array<{ name: string }>;
    const columnNames = columns.map(c => c.name);
    
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('code');
    expect(columnNames).toContain('duration');
    expect(columnNames).toContain('price');
    expect(columnNames).toContain('is_active');
    expect(columnNames).toContain('created_at');
    expect(columnNames).toContain('updated_at');
  });

  it('should have correct columns in admins table', () => {
    const columns = db.prepare("PRAGMA table_info(admins)").all() as Array<{ name: string }>;
    const columnNames = columns.map(c => c.name);
    
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('username');
    expect(columnNames).toContain('password_hash');
    expect(columnNames).toContain('role');
    expect(columnNames).toContain('created_at');
  });

  it('should enforce unique constraint on voucher codes', () => {
    db.prepare("INSERT INTO vouchers (code, duration, price) VALUES (?, ?, ?)").run('TEST001', '1 hour', 5000);
    
    expect(() => {
      db.prepare("INSERT INTO vouchers (code, duration, price) VALUES (?, ?, ?)").run('TEST001', '2 hours', 10000);
    }).toThrow();
  });

  it('should enforce unique constraint on admin usernames', () => {
    db.prepare("INSERT INTO admins (username, password_hash) VALUES (?, ?)").run('admin', 'hash123');
    
    expect(() => {
      db.prepare("INSERT INTO admins (username, password_hash) VALUES (?, ?)").run('admin', 'hash456');
    }).toThrow();
  });
});
