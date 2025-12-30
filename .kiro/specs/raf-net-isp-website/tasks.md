# Implementation Plan: RAF NET ISP Website

## Overview

This implementation plan builds the RAF NET ISP Website incrementally, starting with the backend infrastructure, then adding CRUD operations, authentication, and finally the React frontend. Each task builds on previous work to ensure no orphaned code.

## Tasks

- [x] 1. Set up project structure and dependencies
  - [x] 1.1 Initialize backend Node.js project with TypeScript
    - Create `backend/` directory with package.json
    - Install dependencies: express, better-sqlite3, bcrypt, jsonwebtoken, cors, helmet
    - Install dev dependencies: typescript, jest, supertest, fast-check, ts-node, @types/*
    - Configure tsconfig.json and jest.config.js
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 1.2 Initialize frontend React project with TypeScript
    - Create `frontend/` directory using Vite + React + TypeScript
    - Install dependencies: react-router-dom, axios, @heroui/react (or similar UI library)
    - Configure project structure with pages/, components/, contexts/, api/
    - _Requirements: 1.1, 5.1_

  - [x] 1.3 Set up SQLite database initialization
    - Create database connection module
    - Implement table creation for monthly_packages, vouchers, admins
    - Add database initialization on server startup
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 2. Implement Package Repository and Service
  - [x] 2.1 Create Package repository with CRUD operations
    - Implement findAll, findActive, findById, create, update, delete methods
    - Use parameterized queries for SQL injection prevention
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 6.4_

  - [x] 2.2 Write property test for Package CRUD round-trip
    - **Property 1: Package CRUD Round-Trip**
    - **Validates: Requirements 3.1, 3.2**

  - [x] 2.3 Create Package service with business logic
    - Implement service methods calling repository
    - Add input validation for required fields
    - _Requirements: 3.1, 3.3, 3.5, 3.6_

  - [x] 2.4 Write property test for Package update persistence
    - **Property 2: Package Update Persistence**
    - **Validates: Requirements 3.3, 3.5**

  - [x] 2.5 Write property test for Package delete
    - **Property 3: Package Delete Removes Record**
    - **Validates: Requirements 3.4**

- [x] 3. Implement Voucher Repository and Service
  - [x] 3.1 Create Voucher repository with CRUD operations
    - Implement findAll, findById, findByCode, create, update, delete methods
    - Use parameterized queries for SQL injection prevention
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 6.4_

  - [x] 3.2 Write property test for Voucher CRUD round-trip
    - **Property 4: Voucher CRUD Round-Trip**
    - **Validates: Requirements 4.1, 4.2**

  - [x] 3.3 Create Voucher service with business logic
    - Implement service methods calling repository
    - Add input validation for required fields
    - Add voucher code uniqueness check
    - _Requirements: 4.1, 4.3, 4.5, 4.6, 4.7_

  - [x] 3.4 Write property test for Voucher update persistence
    - **Property 5: Voucher Update Persistence**
    - **Validates: Requirements 4.3, 4.5**

  - [x] 3.5 Write property test for Voucher delete
    - **Property 6: Voucher Delete Removes Record**
    - **Validates: Requirements 4.4**

  - [x] 3.6 Write property test for Voucher code uniqueness
    - **Property 7: Voucher Code Uniqueness**
    - **Validates: Requirements 4.7, 7.5**

- [x] 4. Checkpoint - Ensure repository and service tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement Authentication
  - [x] 5.1 Create Admin repository
    - Implement findByUsername, findById, create methods
    - _Requirements: 7.3, 7.5_

  - [x] 5.2 Create Auth service with JWT and bcrypt
    - Implement authenticate, verifyToken, hashPassword, comparePassword methods
    - Configure JWT secret and expiration
    - _Requirements: 2.1, 2.2, 2.4, 2.5_

  - [x] 5.3 Write property test for Authentication correctness
    - **Property 8: Authentication Correctness**
    - **Validates: Requirements 2.1, 2.2**

  - [x] 5.4 Write property test for Password hash security
    - **Property 9: Password Hash Security**
    - **Validates: Requirements 2.5**

  - [x] 5.5 Create Auth middleware for protected routes
    - Implement JWT verification middleware
    - Return 401 for missing/invalid/expired tokens
    - _Requirements: 2.3, 2.4, 6.1_

  - [x] 5.6 Write property test for Protected route authorization
    - **Property 11: Protected Route Authorization**
    - **Validates: Requirements 2.3, 6.1**

  - [x] 5.7 Write property test for Token expiration
    - **Property 12: Token Expiration Rejection**
    - **Validates: Requirements 2.4**

- [x] 6. Implement API Controllers and Routes
  - [x] 6.1 Create Package controller
    - Implement getAll, getActive, getById, create, update, delete handlers
    - Add input validation and error handling
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 6.2 Create Voucher controller
    - Implement getAll, getById, create, update, delete handlers
    - Add input validation and error handling
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 6.3 Create Auth controller
    - Implement login and me handlers
    - _Requirements: 2.1, 2.2_

  - [x] 6.4 Set up Express routes and middleware
    - Configure public routes: GET /api/packages/active
    - Configure protected routes: /api/packages, /api/vouchers, /api/auth/me
    - Add CORS, helmet, JSON body parser
    - _Requirements: 1.3, 6.1, 6.2_

  - [x] 6.5 Write property test for Active package filtering
    - **Property 10: Active Package Filtering**
    - **Validates: Requirements 1.3, 1.5**

  - [x] 6.6 Write property test for Validation error responses
    - **Property 13: Validation Error Response**
    - **Validates: Requirements 3.6, 4.6, 6.3**

  - [x] 6.7 Write property test for SQL injection prevention
    - **Property 14: SQL Injection Prevention**
    - **Validates: Requirements 6.2, 6.4**

- [x] 7. Checkpoint - Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement Frontend API Client and Auth Context
  - [x] 8.1 Create API client module
    - Implement axios instance with base URL and interceptors
    - Add methods for all API endpoints
    - Handle JWT token in Authorization header
    - _Requirements: 1.3, 2.3_

  - [x] 8.2 Create Auth context and provider
    - Implement login, logout, token storage
    - Add protected route wrapper component
    - _Requirements: 2.1, 2.3_

- [x] 9. Implement Public Index Page
  - [x] 9.1 Create Index page component
    - Display RAF NET branding and logo
    - Display coverage areas (Ds. Dander, Ds. Tanjungharjo)
    - Display contact information
    - _Requirements: 1.1, 1.2, 1.4_

  - [x] 9.2 Create Package display component
    - Fetch and display active packages from API
    - Show name, speed, price, description for each package
    - _Requirements: 1.3, 1.5_

- [-] 10. Implement Admin Dashboard
  - [x] 10.1 Create Admin login page
    - Implement login form with username/password
    - Handle authentication and redirect to dashboard
    - Display error messages for failed login
    - _Requirements: 2.1, 2.2_

  - [x] 10.2 Create Admin dashboard layout
    - Implement navigation menu for packages and vouchers
    - Add logout functionality
    - _Requirements: 5.1_

  - [x] 10.3 Create Package management components
    - Implement package table with edit/delete actions
    - Implement package form for create/edit
    - Display validation errors inline
    - _Requirements: 5.2, 5.4, 5.6_

  - [x] 10.4 Create Voucher management components
    - Implement voucher table with edit/delete actions
    - Implement voucher form for create/edit
    - Display validation errors inline
    - _Requirements: 5.3, 5.5, 5.6_

- [x] 11. Set up routing and integration
  - [x] 11.1 Configure React Router
    - Set up routes: /, /admin, /admin/login, /admin/packages, /admin/vouchers
    - Implement protected route guards
    - _Requirements: 2.3, 5.1_

  - [x] 11.2 Create seed script for initial admin user
    - Create script to seed default admin user with hashed password
    - _Requirements: 2.5, 7.3_

- [x] 12. Final checkpoint - Full integration testing
  - Ensure all tests pass, ask the user if questions arise.
  - Verify frontend connects to backend correctly
  - Test complete user flows: public page viewing, admin login, CRUD operations

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using fast-check
- Unit tests validate specific examples and edge cases
