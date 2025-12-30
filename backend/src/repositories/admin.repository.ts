import Database from 'better-sqlite3';

export interface AdminEntity {
  id: number;
  username: string;
  password_hash: string;
  role: string;
  created_at: string;
}

export interface CreateAdminData {
  username: string;
  passwordHash: string;
  role?: string;
}

export class AdminRepository {
  constructor(private db: Database.Database) {}

  findByUsername(username: string): AdminEntity | null {
    const stmt = this.db.prepare('SELECT * FROM admins WHERE username = ?');
    const result = stmt.get(username) as AdminEntity | undefined;
    return result || null;
  }

  findById(id: number): AdminEntity | null {
    const stmt = this.db.prepare('SELECT * FROM admins WHERE id = ?');
    const result = stmt.get(id) as AdminEntity | undefined;
    return result || null;
  }

  create(data: CreateAdminData): AdminEntity {
    const stmt = this.db.prepare(`
      INSERT INTO admins (username, password_hash, role, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `);
    
    const role = data.role || 'admin';
    const result = stmt.run(data.username, data.passwordHash, role);
    
    return this.findById(result.lastInsertRowid as number)!;
  }
}
