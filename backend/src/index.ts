// Load environment variables from .env file
import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { initializeDatabase, closeDatabase, getDatabase } from './database';
import { PackageRepository } from './repositories/package.repository';
import { VoucherRepository } from './repositories/voucher.repository';
import { AdminRepository } from './repositories/admin.repository';
import { PackageService } from './services/package.service';
import { VoucherService } from './services/voucher.service';
import { AuthService } from './services/auth.service';
import { PackageController } from './controllers/package.controller';
import { VoucherController } from './controllers/voucher.controller';
import { AuthController } from './controllers/auth.controller';
import { createAuthMiddleware } from './middleware/auth.middleware';
import { createApiRoutes } from './routes';

const app = express();
const PORT = process.env.PORT || 810;

// Middleware - relaxed helmet for serving static files
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Initialize and wire up dependencies
function setupRoutes(): void {
  const db = getDatabase();

  // Repositories
  const packageRepository = new PackageRepository(db);
  const voucherRepository = new VoucherRepository(db);
  const adminRepository = new AdminRepository(db);

  // Services
  const packageService = new PackageService(packageRepository);
  const voucherService = new VoucherService(voucherRepository);
  const authService = new AuthService(adminRepository);

  // Controllers
  const packageController = new PackageController(packageService);
  const voucherController = new VoucherController(voucherService);
  const authController = new AuthController(authService);

  // Middleware
  const authMiddleware = createAuthMiddleware(authService);

  // API Routes
  const apiRoutes = createApiRoutes({
    packageController,
    voucherController,
    authController,
    authMiddleware
  });

  app.use('/api', apiRoutes);

  // Serve frontend static files in production
  if (process.env.NODE_ENV === 'production') {
    const frontendPath = path.join(__dirname, '../../frontend/dist');
    
    // Serve static files
    app.use(express.static(frontendPath));
    
    // SPA fallback - all non-API routes go to index.html
    app.get('*', (_req, res) => {
      res.sendFile(path.join(frontendPath, 'index.html'));
    });
    
    console.log(`Serving frontend from: ${frontendPath}`);
  }
}

// Start server
if (require.main === module) {
  // Initialize database on startup
  initializeDatabase();
  console.log('Database initialized');

  // Setup routes after database is initialized
  setupRoutes();
  console.log('Routes configured');

  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down...');
    server.close(() => {
      closeDatabase();
      console.log('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down...');
    server.close(() => {
      closeDatabase();
      console.log('Server closed');
      process.exit(0);
    });
  });
}

export { app, setupRoutes };
