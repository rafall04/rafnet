# Project Structure

## Architecture Pattern
Backend follows a **layered architecture** with dependency injection:
```
Controllers → Services → Repositories → Database
```

## Backend (`/backend`)
```
src/
├── index.ts              # Express app entry, DI wiring, server startup
├── controllers/          # HTTP request handlers, input parsing, response formatting
│   └── __tests__/        # Controller integration tests
├── services/             # Business logic, validation, entity mapping
├── repositories/         # Data access layer, SQL queries
├── middleware/           # Express middleware (auth)
├── routes/               # Route definitions, endpoint grouping
├── database/             # Database initialization, schema
│   └── __tests__/        # Database tests
└── scripts/              # Utility scripts (seed-admin)
data/
└── rafnet.db             # SQLite database file
```

## Frontend (`/frontend`)
```
src/
├── main.tsx              # React entry point
├── App.tsx               # Root component, routing setup
├── api/                  # API client, types, axios configuration
├── components/           # Reusable UI components
├── contexts/             # React contexts (AuthContext)
└── pages/                # Page components (route targets)
```

## Conventions
- **Backend entities**: snake_case in database, camelCase in TypeScript
- **Tests**: Co-located with source (`*.test.ts`) or in `__tests__/` folders
- **CSS**: Component-specific CSS files alongside components
- **Exports**: Index files (`index.ts`) for clean imports from folders
- **API responses**: Consistent error format with `status`, `message`, `errors[]`
