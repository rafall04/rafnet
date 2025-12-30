import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { AdminRepository, AdminEntity } from '../repositories/admin.repository';

export interface TokenPayload {
  userId: number;
  username: string;
  role: string;
}

export interface AuthResult {
  success: boolean;
  token?: string;
  user?: {
    id: number;
    username: string;
    role: string;
  };
  error?: string;
}

const SALT_ROUNDS = 10;
const JWT_SECRET: jwt.Secret = process.env.JWT_SECRET || 'raf-net-secret-key-change-in-production';
const JWT_EXPIRATION = '24h';

export class AuthService {
  constructor(private adminRepository: AdminRepository) {}

  async authenticate(username: string, password: string): Promise<AuthResult> {
    const admin = this.adminRepository.findByUsername(username);
    
    if (!admin) {
      return { success: false, error: 'Invalid credentials' };
    }

    const isValidPassword = await this.comparePassword(password, admin.password_hash);
    
    if (!isValidPassword) {
      return { success: false, error: 'Invalid credentials' };
    }

    const token = this.generateToken(admin);
    
    return {
      success: true,
      token,
      user: {
        id: admin.id,
        username: admin.username,
        role: admin.role
      }
    };
  }

  verifyToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  private generateToken(admin: AdminEntity): string {
    const payload: TokenPayload = {
      userId: admin.id,
      username: admin.username,
      role: admin.role
    };
    
    const options: SignOptions = { expiresIn: JWT_EXPIRATION };
    return jwt.sign(payload, JWT_SECRET, options);
  }

  // For testing purposes - generate token with custom expiration
  generateTokenWithExpiration(admin: AdminEntity, expiresIn: number): string {
    const payload: TokenPayload = {
      userId: admin.id,
      username: admin.username,
      role: admin.role
    };
    
    const options: SignOptions = { expiresIn };
    return jwt.sign(payload, JWT_SECRET, options);
  }
}

// Export constants for testing
export { JWT_SECRET, JWT_EXPIRATION };
