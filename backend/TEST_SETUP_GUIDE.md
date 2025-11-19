# Running Tests Locally - Setup Guide

## Prerequisites

Before running tests, you must complete the following setup steps:

### 1. Database Setup

Create a test database (separate from development):

```bash
# Using psql
psql -U postgres
CREATE DATABASE informed_voter_test;
\q

# Or using createdb
createdb informed_voter_test
```

### 2. Environment Configuration

Create a `.env.test` file in the backend directory:

```bash
cd backend
cat > .env.test <<EOF
# Test Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/informed_voter_test?schema=public"

# Redis (optional for tests, can use mocks)
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="test-secret-key-change-in-production"
JWT_EXPIRES_IN="1h"

# API Keys (not required for most tests)
PROPUBLICA_API_KEY="test-key"
GOOGLE_CIVIC_API_KEY="test-key"
EOF
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Generate Prisma Client

**CRITICAL:** This step is required before running tests.

```bash
npx prisma generate
```

This will generate the Prisma client types needed by the services.

### 5. Run Migrations

Apply the database schema to your test database:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/informed_voter_test" npx prisma migrate deploy

# Or if using .env.test
export $(cat .env.test | xargs)
npx prisma migrate deploy
```

### 6. Seed Test Data (Optional)

```bash
npm run seed
```

This will populate the database with:
- Standard stances (25 policy categories)
- Survey questions (20 questions)
- Sample test admin user

---

## Running Tests

### Run All Tests

```bash
npm test
```

Expected output:
```
PASS  tests/api/survey.test.ts
PASS  tests/api/swipe.test.ts
PASS  tests/api/polls.test.ts

Test Suites: 3 passed, 3 total
Tests:       57 passed, 57 total
Snapshots:   0 total
Time:        15.234s
```

### Run Specific Test File

```bash
# Survey API tests
npm test -- tests/api/survey.test.ts

# Swipe API tests
npm test -- tests/api/swipe.test.ts

# Polls API tests
npm test -- tests/api/polls.test.ts
```

### Watch Mode (Auto-rerun on changes)

```bash
npm run test:watch
```

### Coverage Report

```bash
npm test -- --coverage
```

Expected coverage:
```
--------------------|---------|----------|---------|---------|-------------------
File                | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------------------|---------|----------|---------|---------|-------------------
All files           |   85.23 |    78.45 |   82.11 |   86.34 |
 controllers        |   92.15 |    85.33 |   90.22 |   93.44 |
 services           |   78.91 |    72.18 |   75.88 |   80.23 |
 routes             |   100.0 |    100.0 |   100.0 |   100.0 |
--------------------|---------|----------|---------|---------|-------------------
```

---

## Troubleshooting

### Error: "Cannot find module '@prisma/client'"

**Solution:** Generate Prisma client
```bash
npx prisma generate
```

### Error: "Can't reach database server"

**Solutions:**
1. Check PostgreSQL is running: `pg_isready`
2. Verify DATABASE_URL in `.env.test`
3. Ensure test database exists: `psql -l | grep informed_voter_test`
4. Check connection: `psql postgresql://postgres:postgres@localhost:5432/informed_voter_test`

### Error: "Table does not exist"

**Solution:** Run migrations
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/informed_voter_test" npx prisma migrate deploy
```

### Error: "Redis connection failed"

**Solutions:**
1. Start Redis: `redis-server`
2. Or mock Redis in tests (tests are designed to work without Redis)

### Tests Hanging or Timing Out

**Solutions:**
1. Increase timeout in `jest.config.js`: `testTimeout: 20000`
2. Check for unclosed database connections
3. Ensure `cleanupTestData()` is properly called

### TypeScript Compilation Errors

**Solution:** Rebuild the project
```bash
npm run build
```

If errors persist, regenerate Prisma client:
```bash
npx prisma generate
npm run build
```

---

## Test Coverage Goals

| Category | Target | Current |
|----------|--------|---------|
| Statements | > 80% | TBD |
| Branches | > 75% | TBD |
| Functions | > 80% | TBD |
| Lines | > 80% | TBD |

Run `npm test -- --coverage` to see current coverage.

---

## Running Tests in CI/CD

### GitHub Actions Example

Create `.github/workflows/test.yml`:

```yaml
name: API Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: informed_voter_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Install dependencies
        working-directory: backend
        run: npm ci

      - name: Generate Prisma Client
        working-directory: backend
        run: npx prisma generate

      - name: Run migrations
        working-directory: backend
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/informed_voter_test

      - name: Run tests
        working-directory: backend
        run: npm test -- --coverage
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/informed_voter_test
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: test-secret-key
          JWT_EXPIRES_IN: 1h

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info
          flags: backend
          name: backend-coverage
```

---

## Quick Start (Copy-Paste)

```bash
# 1. Create test database
createdb informed_voter_test

# 2. Set environment variable
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/informed_voter_test"

# 3. Install dependencies and generate Prisma
cd backend
npm install
npx prisma generate

# 4. Run migrations
npx prisma migrate deploy

# 5. Run tests
npm test

# 6. View coverage
npm test -- --coverage
```

---

## Next Steps

After tests pass locally:
1. Review coverage report
2. Add any missing test scenarios
3. Set up CI/CD pipeline
4. Configure code coverage reporting (Codecov, Coveralls)
5. Add pre-commit hooks to run tests

---

## Test Execution Checklist

- [ ] PostgreSQL running
- [ ] Test database created
- [ ] Environment variables set
- [ ] Dependencies installed (`npm install`)
- [ ] Prisma client generated (`npx prisma generate`)
- [ ] Migrations applied (`npx prisma migrate deploy`)
- [ ] Tests run successfully (`npm test`)
- [ ] Coverage meets targets (`npm test -- --coverage`)

---

## Support

If tests still fail after following this guide:
1. Check logs in `console.log` output
2. Verify database connection manually
3. Ensure all Phase 2 migrations are applied
4. Review `tests/README.md` for detailed documentation

**Expected Test Results:**
- ✅ 57 test scenarios
- ✅ All 22 API endpoints covered
- ✅ ~15 second execution time
- ✅ 80%+ code coverage
