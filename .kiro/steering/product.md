# RAF NET ISP Website

## Overview
Web application for RAF NET, an Internet Service Provider serving Ds. Dander and Ds. Tanjungharjo coverage areas.

## Core Features
- **Public Landing Page**: Displays branding, coverage areas, active internet packages, and contact information
- **Admin Dashboard**: Protected interface for managing internet packages and voucher pricing
- **Authentication**: JWT-based admin authentication with secure password hashing

## Domain Entities
- **Monthly Package**: Internet subscription plan (name, speed, price, description, active status)
- **Voucher**: Prepaid internet access code (code, duration, price, active status)
- **Admin User**: Authenticated administrator (username, password_hash, role)

## Business Rules
- Only active packages are displayed on the public landing page
- Voucher codes must be unique
- All admin operations require valid JWT authentication
- Passwords are hashed before storage (bcrypt)
