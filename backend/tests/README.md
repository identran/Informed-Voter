# Informed Voter Platform - API Test Suite

## Overview
Comprehensive integration tests for all Phase 2A and Phase 2B API endpoints using Jest and Supertest.

## Test Coverage

### Survey API Tests (`tests/api/survey.test.ts`)
**10 endpoints tested:**
- ✅ GET `/api/survey/questions` - Get survey questions
- ✅ POST `/api/survey/start` - Start survey with progress
- ✅ POST `/api/survey/response` - Save single response
- ✅ POST `/api/survey/responses` - Batch save responses
- ✅ GET `/api/survey/results` - Get user results
- ✅ POST `/api/survey/retake` - Clear responses
- ✅ GET `/api/survey/statistics` - Admin statistics
- ✅ GET `/api/survey/matches` - Get candidate matches
- ✅ GET `/api/survey/matches/:id/explanation` - Match details
- ✅ POST `/api/survey/matches/refresh` - Refresh matches

**Test Scenarios:**
- Authentication requirements
- Authorization (admin-only endpoints)
- Input validation
- Data persistence
- Edge cases (invalid data, missing fields)

### Swipe API Tests (`tests/api/swipe.test.ts`)
**6 endpoints tested:**
- ✅ GET `/api/swipe/deck` - Get shuffled candidates
- ✅ POST `/api/swipe/action` - Record swipe
- ✅ GET `/api/swipe/shortlist` - Get shortlist
- ✅ DELETE `/api/swipe/shortlist/:candidateId` - Remove from shortlist
- ✅ PUT `/api/swipe/shortlist/:candidateId/notes` - Update notes
- ✅ GET `/api/swipe/analytics/:candidateId` - Admin analytics

**Test Scenarios:**
- All swipe actions (right, left, up, down)
- Deterministic shuffling
- Shortlist management
- Admin-only analytics
- Invalid action handling

### Polls API Tests (`tests/api/polls.test.ts`)
**6 endpoints tested:**
- ✅ POST `/api/polls/respond` - Submit poll response
- ✅ GET `/api/polls/aggregate/:candidateId` - Public poll data
- ✅ GET `/api/polls/top/:state` - Top candidates by state
- ✅ GET `/api/polls/check/:candidateId` - Check user response
- ✅ GET `/api/polls/user-responses` - Get user's responses
- ✅ GET `/api/polls/trends/:candidateId` - Admin trends

**Test Scenarios:**
- k-anonymity enforcement (100+ response threshold)
- Public vs protected endpoints
- All intentToVote values
- Favorability validation (1-5)
- Response updates
- Admin-only trends

### Ballot API Tests (`tests/api/ballot.test.ts`)
**10 endpoints tested:**
- ✅ GET `/api/ballot/preview` - Get ballot preview for address
- ✅ POST `/api/ballot/save` - Save ballot preview
- ✅ GET `/api/ballot/saved` - Get user's saved ballot previews
- ✅ GET `/api/ballot/saved/:id` - Get specific ballot preview
- ✅ DELETE `/api/ballot/saved/:id` - Delete ballot preview
- ✅ GET `/api/ballot/elections` - Get upcoming elections
- ✅ POST `/api/ballot/reminder` - Create election reminder
- ✅ GET `/api/ballot/reminders` - Get user's election reminders
- ✅ DELETE `/api/ballot/reminder/:id` - Delete election reminder
- ✅ GET `/api/ballot/guide/:id` - Get ballot guide summary

**Test Scenarios:**
- Google Civic API integration
- Public vs protected endpoints
- Address validation
- Ballot preview save/retrieve/delete
- Election reminders with date validation
- Ballot guide generation
- User isolation (can't access other users' data)

**Note:** Ballot tests require Google Civic Information API to be configured with `GOOGLE_CIVIC_API_KEY` environment variable. Some tests will gracefully handle API not being configured.

## Running Tests

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Specific Test File
```bash
npm test -- tests/api/survey.test.ts
npm test -- tests/api/swipe.test.ts
npm test -- tests/api/polls.test.ts
npm test -- tests/api/ballot.test.ts
```

### Run with Coverage
```bash
npm test -- --coverage
```

## Test Utilities

### Helper Functions (`tests/helpers/testUtils.ts`)
- `createTestUser(overrides)` - Create test user with optional overrides
- `createTestCandidate(overrides)` - Create test candidate
- `createTestStance(overrides)` - Create test stance
- `createTestSurveyQuestion(stanceId, overrides)` - Create survey question
- `createTestCandidateStance(candidateId, stanceId, overrides)` - Link candidate to stance
- `createCompleteTestSetup()` - Create full test environment
- `generateTestToken(userId, email, role)` - Generate JWT for testing
- `cleanupTestData()` - Clean up all test data

### Setup (`tests/setup.ts`)
- Configures Jest environment
- Sets test timeout (10 seconds)
- Mocks console methods to reduce noise
- Handles Prisma cleanup

## Environment Setup

### Required Environment Variables
Create a `.env.test` file:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/informed_voter_test?schema=public"
JWT_SECRET="test-secret-key"
JWT_EXPIRES_IN="1h"
```

### Test Database
Use a separate test database to avoid affecting development data:

```bash
# Create test database
psql -U postgres -c "CREATE DATABASE informed_voter_test;"

# Run migrations
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/informed_voter_test" npx prisma migrate deploy
```

## Test Structure

Each test file follows this structure:
```typescript
describe('API Name', () => {
  beforeEach(async () => {
    await cleanupTestData(); // Clean database before each test
  });

  afterAll(async () => {
    await cleanupTestData(); // Final cleanup
  });

  describe('GET /endpoint', () => {
    it('should test scenario', async () => {
      // Test implementation
    });
  });
});
```

## Authentication Testing

### Public Endpoints
No authentication required:
```typescript
const response = await request(app).get('/api/polls/aggregate/:candidateId');
```

### Protected Endpoints
Require valid JWT token:
```typescript
const { token } = await createCompleteTestSetup();
const response = await request(app)
  .get('/api/swipe/deck')
  .set('Authorization', `Bearer ${token}`);
```

### Admin Endpoints
Require admin role:
```typescript
const user = await createTestUser({ role: 'ADMIN' });
const token = generateTestToken(user.id, user.email, 'ADMIN');
const response = await request(app)
  .get('/api/survey/statistics')
  .set('Authorization', `Bearer ${token}`);
```

## Common Test Patterns

### Testing Authentication
```typescript
it('should require authentication', async () => {
  const response = await request(app).get('/api/protected/endpoint');
  expect(response.status).toBe(401);
});
```

### Testing Authorization
```typescript
it('should require admin role', async () => {
  const user = await createTestUser({ role: 'VOTER' });
  const token = generateTestToken(user.id, user.email, 'VOTER');

  const response = await request(app)
    .get('/api/admin/endpoint')
    .set('Authorization', `Bearer ${token}`);

  expect(response.status).toBe(403);
});
```

### Testing Input Validation
```typescript
it('should reject invalid input', async () => {
  const { token } = await createCompleteTestSetup();

  const response = await request(app)
    .post('/api/endpoint')
    .set('Authorization', `Bearer ${token}`)
    .send({
      invalidField: 'value',
    });

  expect(response.status).toBe(400);
  expect(response.body.success).toBe(false);
});
```

### Testing Data Persistence
```typescript
it('should persist data correctly', async () => {
  const { token, candidate } = await createCompleteTestSetup();

  // Create data
  await request(app)
    .post('/api/endpoint')
    .set('Authorization', `Bearer ${token}`)
    .send({ candidateId: candidate.id, action: 'right' });

  // Verify persisted
  const response = await request(app)
    .get('/api/endpoint')
    .set('Authorization', `Bearer ${token}`);

  expect(response.body.data).toContain(candidate.id);
});
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npx prisma migrate deploy
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v3
```

## Coverage Goals

**Target Coverage:**
- **Statements:** > 80%
- **Branches:** > 75%
- **Functions:** > 80%
- **Lines:** > 80%

**Current Coverage:** (Run `npm test -- --coverage` to see)

## Troubleshooting

### Tests Hanging
- Check for missing `await` in async functions
- Ensure Prisma connections are properly closed
- Increase test timeout if needed: `jest.setTimeout(15000)`

### Database Conflicts
- Ensure test database is separate from development
- Run `cleanupTestData()` in `beforeEach` and `afterAll`
- Check for orphaned connections: `ps aux | grep postgres`

### Authentication Errors
- Verify JWT_SECRET is set in environment
- Check token expiration time
- Ensure user exists before generating token

### Flaky Tests
- Avoid relying on specific timing
- Use deterministic test data
- Clean database state between tests
- Avoid parallel test execution if using shared resources

## Best Practices

1. **Isolation:** Each test should be independent
2. **Cleanup:** Always clean test data before/after tests
3. **Descriptive Names:** Use clear, specific test descriptions
4. **Arrange-Act-Assert:** Follow AAA pattern
5. **Single Responsibility:** One assertion per test (when possible)
6. **Edge Cases:** Test boundary conditions
7. **Error Paths:** Test failure scenarios
8. **Mock External Services:** Don't call real external APIs in tests

## Next Steps

### Unit Tests
Add unit tests for services:
- `surveyService.spec.ts`
- `matchingService.spec.ts`
- `swipeService.spec.ts`
- `pollingService.spec.ts`

### E2E Tests
Add end-to-end tests for full user flows:
- Complete survey → View matches
- Swipe candidates → Manage shortlist
- Submit polls → View public data

### Performance Tests
Add performance tests for:
- Matching algorithm with large datasets
- Swipe deck generation speed
- Poll aggregation efficiency

## Contributing

When adding new endpoints:
1. Create test file in `tests/api/`
2. Test all authentication/authorization scenarios
3. Test all input validation
4. Test success and error paths
5. Update this README with coverage info

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
- [Testing Best Practices](https://testingjavascript.com/)
