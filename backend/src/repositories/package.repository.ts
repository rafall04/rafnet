import Database from 'better-sqlite3';

export interface PackageEntity {
  id: number;
  name: string;
  speed: string;
  price: number;
  description: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePackageData {
  name: string;
  speed: string;
  price: number;
  description?: string;
  isActive?: boolean;
}

export interface UpdatePackageData {
  name?: string;
  speed?: string;
  price?: number;
  description?: string;
  isActive?: boolean;
}

export class PackageRepository {
  constructor(private db: Database.Database) {}

  findAll(): PackageEntity[] {
    const stmt = this.db.prepare('SELECT * FROM monthly_packages ORDER BY id DESC');
    return stmt.all() as PackageEntity[];
  }

  findActive(): PackageEntity[] {
    const stmt = this.db.prepare('SELECT * FROM monthly_packages WHERE is_active = 1 ORDER BY id DESC');
    return stmt.all() as PackageEntity[];
  }

  findById(id: number): PackageEntity | null {
    const stmt = this.db.prepare('SELECT * FROM monthly_packages WHERE id = ?');
    const result = stmt.get(id) as PackageEntity | undefined;
    return result || null;
  }

  create(data: CreatePackageData): PackageEntity {
    const stmt = this.db.prepare(`
      INSERT INTO monthly_packages (name, speed, price, description, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    
    const isActive = data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1;
    const result = stmt.run(data.name, data.speed, data.price, data.description || null, isActive);
    
    return this.findById(result.lastInsertRowid as number)!;
  }

  update(id: number, data: UpdatePackageData): PackageEntity | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.speed !== undefined) {
      updates.push('speed = ?');
      values.push(data.speed);
    }
    if (data.price !== undefined) {
      updates.push('price = ?');
      values.push(data.price);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }
    if (data.isActive !== undefined) {
      updates.push('is_active = ?');
      values.push(data.isActive ? 1 : 0);
    }

    if (updates.length === 0) return existing;

    updates.push("updated_at = datetime('now')");
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE monthly_packages SET ${updates.join(', ')} WHERE id = ?
    `);
    stmt.run(...values);

    return this.findById(id);
  }

  delete(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM monthly_packages WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
}
