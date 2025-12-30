# Requirements Document

## Introduction

RAF NET ISP Website is a web application consisting of a public-facing landing page for an Internet Service Provider (ISP) and an admin panel for managing internet packages and voucher pricing. The system serves customers in Ds. Dander and Ds. Tanjungharjo coverage areas.

## Glossary

- **Index_Page**: The public-facing landing page displaying RAF NET branding, coverage areas, internet packages, and contact information
- **Admin_Dashboard**: The protected administrative interface for managing packages and vouchers
- **Monthly_Package**: An internet subscription plan with name, speed, price, and description
- **Voucher**: A prepaid internet access code with duration and price
- **Admin_User**: An authenticated user with permissions to manage packages and vouchers
- **API_Server**: The Node.js REST API backend serving data and handling authentication
- **Database**: SQLite database storing packages, vouchers, and admin credentials

## Requirements

### Requirement 1: Public Landing Page Display

**User Story:** As a potential customer, I want to view RAF NET's internet packages and coverage information, so that I can decide which service to subscribe to.

#### Acceptance Criteria

1. WHEN a visitor accesses the Index_Page, THE Index_Page SHALL display the RAF NET branding and logo
2. WHEN a visitor accesses the Index_Page, THE Index_Page SHALL display coverage areas (Ds. Dander, Ds. Tanjungharjo)
3. WHEN a visitor accesses the Index_Page, THE Index_Page SHALL display all active Monthly_Packages with name, speed, price, and description
4. WHEN a visitor accesses the Index_Page, THE Index_Page SHALL display contact information for RAF NET
5. WHEN a Monthly_Package is marked as inactive, THE Index_Page SHALL NOT display that package

### Requirement 2: Admin Authentication

**User Story:** As an administrator, I want to securely log into the admin panel, so that I can manage packages and vouchers.

#### Acceptance Criteria

1. WHEN an Admin_User submits valid credentials, THE API_Server SHALL authenticate the user and return a JWT token
2. WHEN an Admin_User submits invalid credentials, THE API_Server SHALL reject the login and return an error message
3. WHILE an Admin_User has a valid JWT token, THE Admin_Dashboard SHALL allow access to protected routes
4. WHEN a JWT token expires, THE API_Server SHALL reject requests and require re-authentication
5. THE API_Server SHALL hash all passwords before storing in the Database

### Requirement 3: Monthly Package Management

**User Story:** As an administrator, I want to create, read, update, and delete internet packages, so that I can maintain current offerings.

#### Acceptance Criteria

1. WHEN an Admin_User creates a new Monthly_Package, THE API_Server SHALL validate required fields (name, speed, price) and store the package in the Database
2. WHEN an Admin_User requests all packages, THE API_Server SHALL return a list of all Monthly_Packages from the Database
3. WHEN an Admin_User updates a Monthly_Package, THE API_Server SHALL validate the input and update the record in the Database
4. WHEN an Admin_User deletes a Monthly_Package, THE API_Server SHALL remove the record from the Database
5. WHEN an Admin_User toggles a Monthly_Package active status, THE API_Server SHALL update the is_active field in the Database
6. IF an Admin_User submits invalid package data, THEN THE API_Server SHALL return a validation error with specific field errors

### Requirement 4: Voucher Management

**User Story:** As an administrator, I want to manage voucher codes and pricing, so that customers can purchase prepaid internet access.

#### Acceptance Criteria

1. WHEN an Admin_User creates a new Voucher, THE API_Server SHALL validate required fields (code, duration, price) and store the voucher in the Database
2. WHEN an Admin_User requests all vouchers, THE API_Server SHALL return a list of all Vouchers from the Database
3. WHEN an Admin_User updates a Voucher, THE API_Server SHALL validate the input and update the record in the Database
4. WHEN an Admin_User deletes a Voucher, THE API_Server SHALL remove the record from the Database
5. WHEN an Admin_User toggles a Voucher active status, THE API_Server SHALL update the is_active field in the Database
6. IF an Admin_User submits invalid voucher data, THEN THE API_Server SHALL return a validation error with specific field errors
7. THE API_Server SHALL ensure voucher codes are unique in the Database

### Requirement 5: Admin Dashboard Interface

**User Story:** As an administrator, I want a user-friendly dashboard interface, so that I can efficiently manage packages and vouchers.

#### Acceptance Criteria

1. WHEN an Admin_User accesses the Admin_Dashboard, THE Admin_Dashboard SHALL display a navigation menu for packages and vouchers
2. WHEN an Admin_User views the packages section, THE Admin_Dashboard SHALL display a table of all Monthly_Packages with edit and delete actions
3. WHEN an Admin_User views the vouchers section, THE Admin_Dashboard SHALL display a table of all Vouchers with edit and delete actions
4. WHEN an Admin_User clicks add package, THE Admin_Dashboard SHALL display a form to create a new Monthly_Package
5. WHEN an Admin_User clicks add voucher, THE Admin_Dashboard SHALL display a form to create a new Voucher
6. WHEN an Admin_User submits a form with errors, THE Admin_Dashboard SHALL display validation error messages

### Requirement 6: API Security and Validation

**User Story:** As a system administrator, I want the API to be secure and validate all inputs, so that the system is protected from attacks.

#### Acceptance Criteria

1. WHEN an unauthenticated request accesses a protected endpoint, THE API_Server SHALL return a 401 Unauthorized response
2. WHEN a request contains malicious input, THE API_Server SHALL sanitize the input before processing
3. THE API_Server SHALL validate all input data types and constraints before database operations
4. THE API_Server SHALL use parameterized queries to prevent SQL injection
5. WHEN an API error occurs, THE API_Server SHALL return appropriate HTTP status codes and error messages without exposing internal details

### Requirement 7: Database Schema and Persistence

**User Story:** As a developer, I want a well-structured database schema, so that data is stored reliably and can be queried efficiently.

#### Acceptance Criteria

1. THE Database SHALL store Monthly_Packages with fields: id, name, speed, price, description, is_active
2. THE Database SHALL store Vouchers with fields: id, code, duration, price, is_active
3. THE Database SHALL store Admin_Users with fields: id, username, password_hash, role
4. WHEN the API_Server starts, THE Database SHALL initialize tables if they do not exist
5. THE Database SHALL enforce unique constraints on voucher codes and admin usernames
