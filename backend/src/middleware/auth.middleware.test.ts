import * as fc from 'fast-check';
import { createTestDatabase } from '../database';
import { AdminRepository } from '../repositories/admin.repository';
import { AuthService } from '../services/auth.service';
import { AuthMiddleware } from './auth.middleware';
import { Request, Response, NextFunction } from 'express';
import Database from 'better-sqlite3';

describe('AuthMiddleware Property Tests', () => {
  let db: Database.Database;
  let adminRepository: AdminRepository;
  let authService: AuthService;
  let authMiddleware: AuthMiddleware;
  let testCounter = 0;

  beforeEach(() => {
    db = createTestDatabase();
    adminRepository = new AdminRepository(db);
    authService = new AuthService(adminRepository);
    authMiddleware = new AuthMiddleware(authService);
    testCounter = 0;
  });

  afterEach(() => {
    db.close();
  });

  // Helper to create mock request
  const createMockRequest = (authHeader?: string): Partial<Request> => ({
    headers: authHeader ? { authorization: authHeader } : {}
  });

  // Helper to create mock response
  const createMockResponse = (): Partial<Response> & { statusCode?: number; jsonData?: any } => {
    const res: Partial<Response> & { statusCode?: number; jsonData?: any } = {
      statusCode: undefined,
      jsonData: undefined
    };
    res.status = ((code: number) => {
      res.statusCode = code;
      return res as Response;
    }) as any;
    res.json = ((data: any) => {
      res.jsonData = data;
      return res as Response;
    }) as any;
    return res;
  };

  // Arbitrary for valid passwords
  const passwordArbitrary = fc.string({ minLength: 8, maxLength: 100 })
    .filter(s => s.trim().length >= 8);

  // Arbitrary for invalid tokens
  const invalidTokenArbitrary = fc.oneof(
    fc.constant(''),
    fc.constant('invalid'),
    fc.constant('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature'),
    fc.string({ minLength: 10, maxLength: 200 })
  );

  /**
   * Feature: raf-net-isp-website, Property 11: Protected Route Authorization
   * *For any* request to a protected endpoint with a valid non-expired JWT token, 
   * the request should be authorized. For any request without a token or with an 
   * invalid token, the request should be rejected with 401.
   * **Validates: Requirements 2.3, 6.1**
   */
  test('Property 11: Protected Route Authorization - Validates: Requirements 2.3, 6.1', async () => {
    await fc.assert(
      fc.asyncProperty(
        passwordArbitrary,
        invalidTokenArbitrary,
        async (password, invalidToken) => {
          const username = `testuser_${++testCounter}_${Date.now()}`;
          
          // Create admin and get valid token
          const passwordHash = await authService.hashPassword(password);
          const admin = adminRepository.create({
            username,
            passwordHash,
            role: 'admin'
          });
          
          const authResult = await authService.authenticate(username, password);
          const validToken = authResult.token!;

          // Test 1: Valid token should authorize
          const validReq = createMockRequest(`Bearer ${validToken}`) as Request;
          const validRes = createMockResponse() as Response;
          let nextCalled = false;
          const validNext: NextFunction = () => { nextCalled = true; };
          
          authMiddleware.authenticate(validReq, validRes, validNext);
          expect(nextCalled).toBe(true);
          expect(validReq.user).toBeDefined();
          expect(validReq.user!.username).toBe(username);

          // Test 2: No token should reject with 401
          const noTokenReq = createMockRequest() as Request;
          const noTokenRes = createMockResponse();
          let noTokenNextCalled = false;
          const noTokenNext: NextFunction = () => { noTokenNextCalled = true; };
          
          authMiddleware.authenticate(noTokenReq, noTokenRes as Response, noTokenNext);
          expect(noTokenNextCalled).toBe(false);
          expect(noTokenRes.statusCode).toBe(401);

          // Test 3: Invalid token should reject with 401
          const invalidReq = createMockRequest(`Bearer ${invalidToken}`) as Request;
          const invalidRes = createMockResponse();
          let invalidNextCalled = false;
          const invalidNext: NextFunction = () => { invalidNextCalled = true; };
          
          authMiddleware.authenticate(invalidReq, invalidRes as Response, invalidNext);
          expect(invalidNextCalled).toBe(false);
          expect(invalidRes.statusCode).toBe(401);

          // Test 4: Malformed auth header should reject with 401
          const malformedReq = createMockRequest('NotBearer token') as Request;
          const malformedRes = createMockResponse();
          let malformedNextCalled = false;
          const malformedNext: NextFunction = () => { malformedNextCalled = true; };
          
          authMiddleware.authenticate(malformedReq, malformedRes as Response, malformedNext);
          expect(malformedNextCalled).toBe(false);
          expect(malformedRes.statusCode).toBe(401);
        }
      ),
      { numRuns: 20 }  // Reduced due to bcrypt hashing being slow
    );
  }, 60000);

  /**
   * Feature: raf-net-isp-website, Property 12: Token Expiration Rejection
   * *For any* expired JWT token, requests to protected endpoints should be 
   * rejected with 401 and require re-authentication.
   * **Validates: Requirements 2.4**
   */
  test('Property 12: Token Expiration Rejection - Validates: Requirements 2.4', async () => {
    await fc.assert(
      fc.asyncProperty(
        passwordArbitrary,
        async (password) => {
          const username = `testuser_exp_${++testCounter}_${Date.now()}`;
          
          // Create admin
          const passwordHash = await authService.hashPassword(password);
          const admin = adminRepository.create({
            username,
            passwordHash,
            role: 'admin'
          });

          // Generate a token that expires immediately (1 second)
          const expiredToken = authService.generateTokenWithExpiration(admin, 1);
          
          // Wait for token to expire
          await new Promise(resolve => setTimeout(resolve, 1100));

          // Test: Expired token should be rejected with 401
          const expiredReq = createMockRequest(`Bearer ${expiredToken}`) as Request;
          const expiredRes = createMockResponse();
          let expiredNextCalled = false;
          const expiredNext: NextFunction = () => { expiredNextCalled = true; };
          
          authMiddleware.authenticate(expiredReq, expiredRes as Response, expiredNext);
          expect(expiredNextCalled).toBe(false);
          expect(expiredRes.statusCode).toBe(401);
          expect(expiredRes.jsonData.error).toContain('Invalid or expired token');
        }
      ),
      { numRuns: 5 }  // Reduced due to wait time for expiration
    );
  }, 30000);
});
