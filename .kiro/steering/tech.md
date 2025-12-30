# Tech Stack

## Monorepo Structure
- npm workspaces managing `backend` and `frontend` packages
- Root `package.json` provides workspace-level scripts

## Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: SQLite via better-sqlite3
- **Authentication**: JWT (jsonwebtoken) + bcrypt for password hashing
- **Security**: Helmet, CORS
- **Testing**: Jest + Supertest + fast-check (property-based testing)

## Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router DOM v7
- **HTTP Client**: Axios
- **Linting**: ESLint with TypeScript support

## Common Commands

### Root Level
```bash
npm run install:all        # Install all dependencies
npm run backend:dev        # Start backend dev server
npm run frontend:dev       # Start frontend dev server
npm run backend:test       # Run backend tests
```

### Backend
```bash
cd backend
npm run dev                # Start dev server (ts-node)
npm run build              # Compile TypeScript
npm run start              # Run compiled JS
npm test                   # Run tests (Jest)
npm run seed:admin         # Seed admin user
```

### Frontend
```bash
cd frontend
npm run dev                # Start Vite dev server
npm run build              # Build for production
npm run lint               # Run ESLint
npm run preview            # Preview production build
```

## Environment
- Backend runs on port 3000 by default (configurable via `PORT` env var)
- Frontend API URL configurable via `VITE_API_URL` env var
- Database path configurable via `DB_PATH` env var
