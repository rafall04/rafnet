/**
 * Seed Script for Initial Admin User
 * Creates a default admin user with hashed password
 * Requirements: 2.5, 7.3
 * 
 * Usage: npx ts-node src/scripts/seed-admin.ts
 * 
 * Default credentials:
 *   Username: admin
 *   Password: admin123
 * 
 * You can override these with environment variables:
 *   ADMIN_USERNAME=myuser ADMIN_PASSWORD=mypass npx ts-node src/scripts/seed-admin.ts
 */

import bcrypt from 'bcrypt';
import { initializeDatabase, closeDatabase } from '../database';
import { AdminRepository } from '../repositories/admin.repository';

const SALT_ROUNDS = 10;

// Default admin credentials (can be overridden via environment variables)
const DEFAULT_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const DEFAULT_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

async function seedAdmin(): Promise<void> {
  console.log('🌱 Starting admin seed script...\n');

  try {
    // Initialize database
    const db = initializeDatabase();
    console.log('✅ Database initialized');

    const adminRepository = new AdminRepository(db);

    // Check if admin already exists
    const existingAdmin = adminRepository.findByUsername(DEFAULT_USERNAME);
    
    if (existingAdmin) {
      console.log(`⚠️  Admin user "${DEFAULT_USERNAME}" already exists (ID: ${existingAdmin.id})`);
      console.log('   Skipping creation to avoid duplicates.\n');
      closeDatabase();
      return;
    }

    // Hash the password
    console.log('🔐 Hashing password...');
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

    // Create admin user
    const admin = adminRepository.create({
      username: DEFAULT_USERNAME,
      passwordHash: passwordHash,
      role: 'admin'
    });

    console.log(`✅ Admin user created successfully!`);
    console.log(`   ID: ${admin.id}`);
    console.log(`   Username: ${admin.username}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Created at: ${admin.created_at}\n`);

    console.log('📝 Login credentials:');
    console.log(`   Username: ${DEFAULT_USERNAME}`);
    console.log(`   Password: ${DEFAULT_PASSWORD}`);
    console.log('\n⚠️  Please change the default password in production!\n');

    closeDatabase();
    console.log('✅ Database connection closed');
    console.log('🎉 Seed completed successfully!\n');

  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    closeDatabase();
    process.exit(1);
  }
}

// Run the seed function
seedAdmin();
