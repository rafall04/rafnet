import * as fc from 'fast-check';
import { createTestDatabase } from '../database';
import { AdminRepository } from '../repositories/admin.repository';
import { AuthService } from './auth.service';
import Database from 'better-sqlite3';

describe('AuthService Property Tests', () => {
  let db: Database.Database;
  let adminRepository: AdminRepository;
  let authService: AuthService;
  let testCounter = 0;

  beforeEach(() => {
    db = createTestDatabase();
    adminRepository = new AdminRepository(db);
    authService = new AuthService(adminRepository);
    testCounter = 0;
  });

  afterEach(() => {
    db.close();
  });

  // Arbitrary for valid passwords (8-100 chars)
  const passwordArbitrary = fc.string({ minLength: 8, maxLength: 100 })
    .filter(s => s.trim().length >= 8);

  /**
   * Feature: raf-net-isp-website, Property 8: Authentication Correctness
   * *For any* admin user with stored credentials, authenticating with the correct password 
   * should succeed and return a valid JWT token, while authenticating with any incorrect 
   * password should fail.
   * **Validates: Requirements 2.1, 2.2**
   */
  test('Property 8: Authentication Correctness - Validates: Requirements 2.1, 2.2', async () => {
    await fc.assert(
      fc.asyncProperty(
        passwordArbitrary,
        async (password) => {
          // Generate unique username for each test run
          const username = `testuser_${++testCounter}_${Date.now()}`;
          
          // Hash the password and create admin
          const passwordHash = await authService.hashPassword(password);
          adminRepository.create({
            username,
            passwordHash,
            role: 'admin'
          });

          // Test 1: Correct password should succeed
          const successResult = await authService.authenticate(username, password);
          expect(successResult.success).toBe(true);
          expect(successResult.token).toBeDefined();
          expect(successResult.user).toBeDefined();
          expect(successResult.user!.username).toBe(username);

          // Verify the token is valid
          const decoded = authService.verifyToken(successResult.token!);
          expect(decoded).not.toBeNull();
          expect(decoded!.username).toBe(username);

          // Test 2: Wrong password should fail
          const wrongPassword = password + '_wrong';
          const failResult = await authService.authenticate(username, wrongPassword);
          expect(failResult.success).toBe(false);
          expect(failResult.token).toBeUndefined();
          expect(failResult.error).toBeDefined();

          // Test 3: Non-existent user should fail
          const nonExistentResult = await authService.authenticate('nonexistent_user_xyz', password);
          expect(nonExistentResult.success).toBe(false);
          expect(nonExistentResult.token).toBeUndefined();
        }
      ),
      { numRuns: 20 }  // Reduced due to bcrypt hashing being slow
    );
  }, 60000);  // 60 second timeout for bcrypt operations

  /**
   * Feature: raf-net-isp-website, Property 9: Password Hash Security
   * *For any* password, the stored hash should differ from the plaintext password, 
   * and the hash should be verifiable against the original password using bcrypt comparison.
   * **Validates: Requirements 2.5**
   */
  test('Property 9: Password Hash Security - Validates: Requirements 2.5', async () => {
    await fc.assert(
      fc.asyncProperty(
        passwordArbitrary,
        async (password) => {
          // Hash the password
          const hash = await authService.hashPassword(password);
          
          // Property 1: Hash should differ from plaintext
          expect(hash).not.toBe(password);
          
          // Property 2: Hash should be verifiable against original password
          const isValid = await authService.comparePassword(password, hash);
          expect(isValid).toBe(true);
          
          // Property 3: Hash should NOT verify against different password
          const wrongPassword = password + '_different';
          const isInvalid = await authService.comparePassword(wrongPassword, hash);
          expect(isInvalid).toBe(false);
          
          // Property 4: Same password hashed twice should produce different hashes (bcrypt salting)
          const hash2 = await authService.hashPassword(password);
          expect(hash).not.toBe(hash2);
          
          // Property 5: Both hashes should still verify against original password
          const isValid2 = await authService.comparePassword(password, hash2);
          expect(isValid2).toBe(true);
        }
      ),
      { numRuns: 20 }  // Reduced due to bcrypt hashing being slow
    );
  }, 60000);  // 60 second timeout for bcrypt operations
});
