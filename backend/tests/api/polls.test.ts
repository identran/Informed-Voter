import request from 'supertest';
import express from 'express';
import pollRoutes from '../../src/routes/polls';
import {
  createCompleteTestSetup,
  createTestUser,
  createTestCandidate,
  cleanupTestData,
  generateTestToken,
} from '../helpers/testUtils';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/polls', pollRoutes);

describe('Polls API', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  describe('POST /api/polls/respond', () => {
    it('should require authentication', async () => {
      const response = await request(app).post('/api/polls/respond');

      expect(response.status).toBe(401);
    });

    it('should submit a poll response', async () => {
      const { token, candidate } = await createCompleteTestSetup();

      const response = await request(app)
        .post('/api/polls/respond')
        .set('Authorization', `Bearer ${token}`)
        .send({
          candidateId: candidate.id,
          intentToVote: 'likely',
          favorability: 4,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.intentToVote).toBe('likely');
      expect(response.body.data.favorability).toBe(4);
    });

    it('should update existing poll response', async () => {
      const { token, candidate } = await createCompleteTestSetup();

      // Submit first response
      await request(app)
        .post('/api/polls/respond')
        .set('Authorization', `Bearer ${token}`)
        .send({
          candidateId: candidate.id,
          intentToVote: 'likely',
          favorability: 4,
        });

      // Update response
      const response = await request(app)
        .post('/api/polls/respond')
        .set('Authorization', `Bearer ${token}`)
        .send({
          candidateId: candidate.id,
          intentToVote: 'definitely',
          favorability: 5,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject invalid intentToVote', async () => {
      const { token, candidate } = await createCompleteTestSetup();

      const response = await request(app)
        .post('/api/polls/respond')
        .set('Authorization', `Bearer ${token}`)
        .send({
          candidateId: candidate.id,
          intentToVote: 'invalid',
          favorability: 4,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid favorability', async () => {
      const { token, candidate } = await createCompleteTestSetup();

      const response = await request(app)
        .post('/api/polls/respond')
        .set('Authorization', `Bearer ${token}`)
        .send({
          candidateId: candidate.id,
          intentToVote: 'likely',
          favorability: 10, // Must be 1-5
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should accept all valid intentToVote values', async () => {
      const { token } = await createCompleteTestSetup();
      const validIntents = ['definitely', 'likely', 'unlikely', 'definitely_not'];

      for (const intent of validIntents) {
        const candidate = await createTestCandidate({
          email: `cand-${intent}@test.com`,
        });

        const response = await request(app)
          .post('/api/polls/respond')
          .set('Authorization', `Bearer ${token}`)
          .send({
            candidateId: candidate.id,
            intentToVote: intent,
            favorability: 3,
          });

        expect(response.status).toBe(200);
      }
    });

    it('should require all fields', async () => {
      const { token, candidate } = await createCompleteTestSetup();

      const response = await request(app)
        .post('/api/polls/respond')
        .set('Authorization', `Bearer ${token}`)
        .send({
          candidateId: candidate.id,
          // Missing intentToVote and favorability
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/polls/aggregate/:candidateId', () => {
    it('should be publicly accessible (no auth required)', async () => {
      const { candidate } = await createCompleteTestSetup();

      const response = await request(app).get(
        `/api/polls/aggregate/${candidate.id}`
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return null if insufficient responses', async () => {
      const { candidate } = await createCompleteTestSetup();

      const response = await request(app).get(
        `/api/polls/aggregate/${candidate.id}`
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeNull();
      expect(response.body.message).toContain('Insufficient responses');
    });

    it('should enforce k-anonymity (minimum 100 responses)', async () => {
      const { token, candidate } = await createCompleteTestSetup();

      // Submit 50 responses (below threshold)
      for (let i = 0; i < 50; i++) {
        const user = await createTestUser({ email: `user${i}@test.com` });
        const userToken = generateTestToken(user.id, user.email);

        await request(app)
          .post('/api/polls/respond')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            candidateId: candidate.id,
            intentToVote: 'likely',
            favorability: 4,
          });
      }

      // Should still return null (< 100 responses)
      const response = await request(app).get(
        `/api/polls/aggregate/${candidate.id}`
      );

      expect(response.status).toBe(200);
      expect(response.body.data).toBeNull();
    });
  });

  describe('GET /api/polls/top/:state', () => {
    it('should be publicly accessible', async () => {
      const response = await request(app).get('/api/polls/top/CA');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('state');
      expect(response.body.data).toHaveProperty('candidates');
    });

    it('should filter by state', async () => {
      const response = await request(app).get('/api/polls/top/CA');

      expect(response.status).toBe(200);
      expect(response.body.data.state).toBe('CA');
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/polls/top/CA')
        .query({ limit: 5 });

      expect(response.status).toBe(200);
      expect(response.body.data.candidates.length).toBeLessThanOrEqual(5);
    });

    it('should reject invalid limit', async () => {
      const response = await request(app)
        .get('/api/polls/top/CA')
        .query({ limit: 100 }); // Max is 50

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require state parameter', async () => {
      const response = await request(app).get('/api/polls/top/');

      expect(response.status).toBe(404); // Route not found
    });
  });

  describe('GET /api/polls/check/:candidateId', () => {
    it('should require authentication', async () => {
      const { candidate } = await createCompleteTestSetup();

      const response = await request(app).get(
        `/api/polls/check/${candidate.id}`
      );

      expect(response.status).toBe(401);
    });

    it('should return false for user without response', async () => {
      const { token, candidate } = await createCompleteTestSetup();

      const response = await request(app)
        .get(`/api/polls/check/${candidate.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.hasResponded).toBe(false);
    });

    it('should return true for user with response', async () => {
      const { token, candidate } = await createCompleteTestSetup();

      // Submit response
      await request(app)
        .post('/api/polls/respond')
        .set('Authorization', `Bearer ${token}`)
        .send({
          candidateId: candidate.id,
          intentToVote: 'likely',
          favorability: 4,
        });

      const response = await request(app)
        .get(`/api/polls/check/${candidate.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.hasResponded).toBe(true);
    });
  });

  describe('GET /api/polls/user-responses', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/polls/user-responses');

      expect(response.status).toBe(401);
    });

    it('should return empty array for user without responses', async () => {
      const { token } = await createCompleteTestSetup();

      const response = await request(app)
        .get('/api/polls/user-responses')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.count).toBe(0);
      expect(response.body.data.responses).toEqual([]);
    });

    it('should return user poll responses', async () => {
      const { token, candidate } = await createCompleteTestSetup();

      // Submit response
      await request(app)
        .post('/api/polls/respond')
        .set('Authorization', `Bearer ${token}`)
        .send({
          candidateId: candidate.id,
          intentToVote: 'likely',
          favorability: 4,
        });

      const response = await request(app)
        .get('/api/polls/user-responses')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.count).toBeGreaterThan(0);
      expect(response.body.data.responses[0]).toHaveProperty('candidate');
      expect(response.body.data.responses[0]).toHaveProperty('intentToVote');
      expect(response.body.data.responses[0]).toHaveProperty('favorability');
    });
  });

  describe('GET /api/polls/trends/:candidateId', () => {
    it('should require authentication', async () => {
      const { candidate } = await createCompleteTestSetup();

      const response = await request(app).get(
        `/api/polls/trends/${candidate.id}`
      );

      expect(response.status).toBe(401);
    });

    it('should require admin role', async () => {
      const user = await createTestUser({ role: 'VOTER' });
      const token = generateTestToken(user.id, user.email, 'VOTER');
      const candidate = await createTestCandidate();

      const response = await request(app)
        .get(`/api/polls/trends/${candidate.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return trends for admin', async () => {
      const user = await createTestUser({ role: 'ADMIN' });
      const token = generateTestToken(user.id, user.email, 'ADMIN');
      const candidate = await createTestCandidate();

      const response = await request(app)
        .get(`/api/polls/trends/${candidate.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('trends');
      expect(Array.isArray(response.body.data.trends)).toBe(true);
    });

    it('should respect days parameter', async () => {
      const user = await createTestUser({ role: 'ADMIN' });
      const token = generateTestToken(user.id, user.email, 'ADMIN');
      const candidate = await createTestCandidate();

      const response = await request(app)
        .get(`/api/polls/trends/${candidate.id}`)
        .set('Authorization', `Bearer ${token}`)
        .query({ days: 60 });

      expect(response.status).toBe(200);
      expect(response.body.data.period).toContain('60');
    });

    it('should reject invalid days parameter', async () => {
      const user = await createTestUser({ role: 'ADMIN' });
      const token = generateTestToken(user.id, user.email, 'ADMIN');
      const candidate = await createTestCandidate();

      const response = await request(app)
        .get(`/api/polls/trends/${candidate.id}`)
        .set('Authorization', `Bearer ${token}`)
        .query({ days: 500 }); // Max is 365

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
