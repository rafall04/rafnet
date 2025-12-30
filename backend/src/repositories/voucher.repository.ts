import Database from 'better-sqlite3';

export interface VoucherEntity {
  id: number;
  code: string;
  duration: string;
  price: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface CreateVoucherData {
  code: string;
  duration: string;
  price: number;
  isActive?: boolean;
}

export interface UpdateVoucherData {
  code?: string;
  duration?: string;
  price?: number;
  isActive?: boolean;
}

export class VoucherRepository {
  constructor(private db: Database.Database) {}

  findAll(): VoucherEntity[] {
    const stmt = this.db.prepare('SELECT * FROM vouchers ORDER BY id DESC');
    return stmt.all() as VoucherEntity[];
  }

  findActive(): VoucherEntity[] {
    const stmt = this.db.prepare('SELECT * FROM vouchers WHERE is_active = 1 ORDER BY price ASC');
    return stmt.all() as VoucherEntity[];
  }

  findById(id: number): VoucherEntity | null {
    const stmt = this.db.prepare('SELECT * FROM vouchers WHERE id = ?');
    const result = stmt.get(id) as VoucherEntity | undefined;
    return result || null;
  }

  findByCode(code: string): VoucherEntity | null {
    const stmt = this.db.prepare('SELECT * FROM vouchers WHERE code = ?');
    const result = stmt.get(code) as VoucherEntity | undefined;
    return result || null;
  }

  create(data: CreateVoucherData): VoucherEntity {
    const stmt = this.db.prepare(`
      INSERT INTO vouchers (code, duration, price, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    
    const isActive = data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1;
    const result = stmt.run(data.code, data.duration, data.price, isActive);
    
    return this.findById(result.lastInsertRowid as number)!;
  }

  update(id: number, data: UpdateVoucherData): VoucherEntity | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (data.code !== undefined) {
      updates.push('code = ?');
      values.push(data.code);
    }
    if (data.duration !== undefined) {
      updates.push('duration = ?');
      values.push(data.duration);
    }
    if (data.price !== undefined) {
      updates.push('price = ?');
      values.push(data.price);
    }
    if (data.isActive !== undefined) {
      updates.push('is_active = ?');
      values.push(data.isActive ? 1 : 0);
    }

    if (updates.length === 0) return existing;

    updates.push("updated_at = datetime('now')");
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE vouchers SET ${updates.join(', ')} WHERE id = ?
    `);
    stmt.run(...values);

    return this.findById(id);
  }

  delete(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM vouchers WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
}
