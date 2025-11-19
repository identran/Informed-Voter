import request from 'supertest';
import express from 'express';
import swipeRoutes from '../../src/routes/swipe';
import {
  createCompleteTestSetup,
  createTestUser,
  createTestCandidate,
  cleanupTestData,
  generateTestToken,
} from '../helpers/testUtils';

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/swipe', swipeRoutes);

describe('Swipe API', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('GET /api/swipe/deck', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/swipe/deck');

      expect(response.status).toBe(401);
    });

    it('should return shuffled candidate deck', async () => {
      const { token } = await createCompleteTestSetup();

      // Create additional candidates
      await createTestCandidate({ name: 'Candidate 2', email: 'cand2@test.com' });
      await createTestCandidate({ name: 'Candidate 3', email: 'cand3@test.com' });

      const response = await request(app)
        .get('/api/swipe/deck')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('candidates');
      expect(response.body.data).toHaveProperty('count');
      expect(Array.isArray(response.body.data.candidates)).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const { token } = await createCompleteTestSetup();

      // Create several candidates
      for (let i = 0; i < 10; i++) {
        await createTestCandidate({
          name: `Candidate ${i}`,
          email: `cand${i}@test.com`,
        });
      }

      const response = await request(app)
        .get('/api/swipe/deck')
        .set('Authorization', `Bearer ${token}`)
        .query({ limit: 5 });

      expect(response.status).toBe(200);
      expect(response.body.data.candidates.length).toBeLessThanOrEqual(5);
    });

    it('should exclude already-swiped candidates', async () => {
      const { token, candidate } = await createCompleteTestSetup();

      // Swipe the candidate
      await request(app)
        .post('/api/swipe/action')
        .set('Authorization', `Bearer ${token}`)
        .send({
          candidateId: candidate.id,
          action: 'left',
        });

      // Get deck - should not include the swiped candidate
      const response = await request(app)
        .get('/api/swipe/deck')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      const candidateIds = response.body.data.candidates.map((c: any) => c.id);
      expect(candidateIds).not.toContain(candidate.id);
    });
  });

  describe('POST /api/swipe/action', () => {
    it('should require authentication', async () => {
      const response = await request(app).post('/api/swipe/action');

      expect(response.status).toBe(401);
    });

    it('should record swipe right action', async () => {
      const { token, candidate } = await createCompleteTestSetup();

      const response = await request(app)
        .post('/api/swipe/action')
        .set('Authorization', `Bearer ${token}`)
        .send({
          candidateId: candidate.id,
          action: 'right',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.recorded).toBe(true);
      expect(response.body.data.addedToShortlist).toBe(true);
    });

    it('should record swipe left action', async () => {
      const { token, candidate } = await createCompleteTestSetup();

      const response = await request(app)
        .post('/api/swipe/action')
        .set('Authorization', `Bearer ${token}`)
        .send({
          candidateId: candidate.id,
          action: 'left',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.addedToShortlist).toBe(false);
    });

    it('should record swipe up action', async () => {
      const { token, candidate } = await createCompleteTestSetup();

      const response = await request(app)
        .post('/api/swipe/action')
        .set('Authorization', `Bearer ${token}`)
        .send({
          candidateId: candidate.id,
          action: 'up',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should record swipe down action', async () => {
      const { token, candidate } = await createCompleteTestSetup();

      const response = await request(app)
        .post('/api/swipe/action')
        .set('Authorization', `Bearer ${token}`)
        .send({
          candidateId: candidate.id,
          action: 'down',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject invalid action', async () => {
      const { token, candidate } = await createCompleteTestSetup();

      const response = await request(app)
        .post('/api/swipe/action')
        .set('Authorization', `Bearer ${token}`)
        .send({
          candidateId: candidate.id,
          action: 'invalid',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require candidateId and action', async () => {
      const { token } = await createCompleteTestSetup();

      const response = await request(app)
        .post('/api/swipe/action')
        .set('Authorization', `Bearer ${token}`)
        .send({
          action: 'right',
          // Missing candidateId
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/swipe/shortlist', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/swipe/shortlist');

      expect(response.status).toBe(401);
    });

    it('should return empty shortlist for new user', async () => {
      const { token } = await createCompleteTestSetup();

      const response = await request(app)
        .get('/api/swipe/shortlist')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.candidates).toEqual([]);
      expect(response.body.data.count).toBe(0);
    });

    it('should return shortlisted candidates', async () => {
      const { token, candidate } = await createCompleteTestSetup();

      // Swipe right to add to shortlist
      await request(app)
        .post('/api/swipe/action')
        .set('Authorization', `Bearer ${token}`)
        .send({
          candidateId: candidate.id,
          action: 'right',
        });

      const response = await request(app)
        .get('/api/swipe/shortlist')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.count).toBeGreaterThan(0);
      expect(response.body.data.candidates[0].id).toBe(candidate.id);
    });
  });

  describe('DELETE /api/swipe/shortlist/:candidateId', () => {
    it('should require authentication', async () => {
      const { candidate } = await createCompleteTestSetup();

      const response = await request(app).delete(
        `/api/swipe/shortlist/${candidate.id}`
      );

      expect(response.status).toBe(401);
    });

    it('should remove candidate from shortlist', async () => {
      const { token, candidate } = await createCompleteTestSetup();

      // Add to shortlist
      await request(app)
        .post('/api/swipe/action')
        .set('Authorization', `Bearer ${token}`)
        .send({
          candidateId: candidate.id,
          action: 'right',
        });

      // Remove from shortlist
      const response = await request(app)
        .delete(`/api/swipe/shortlist/${candidate.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify it's removed
      const shortlistResponse = await request(app)
        .get('/api/swipe/shortlist')
        .set('Authorization', `Bearer ${token}`);

      expect(shortlistResponse.body.data.count).toBe(0);
    });

    it('should require candidateId parameter', async () => {
      const { token } = await createCompleteTestSetup();

      const response = await request(app)
        .delete('/api/swipe/shortlist/') // Missing ID
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404); // Route not found
    });
  });

  describe('PUT /api/swipe/shortlist/:candidateId/notes', () => {
    it('should require authentication', async () => {
      const { candidate } = await createCompleteTestSetup();

      const response = await request(app).put(
        `/api/swipe/shortlist/${candidate.id}/notes`
      );

      expect(response.status).toBe(401);
    });

    it('should update notes on shortlisted candidate', async () => {
      const { token, candidate } = await createCompleteTestSetup();

      // Add to shortlist
      await request(app)
        .post('/api/swipe/action')
        .set('Authorization', `Bearer ${token}`)
        .send({
          candidateId: candidate.id,
          action: 'right',
        });

      // Update notes
      const response = await request(app)
        .put(`/api/swipe/shortlist/${candidate.id}/notes`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          notes: 'Great candidate for healthcare reform',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should allow empty notes', async () => {
      const { token, candidate } = await createCompleteTestSetup();

      // Add to shortlist
      await request(app)
        .post('/api/swipe/action')
        .set('Authorization', `Bearer ${token}`)
        .send({
          candidateId: candidate.id,
          action: 'right',
        });

      // Clear notes
      const response = await request(app)
        .put(`/api/swipe/shortlist/${candidate.id}/notes`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          notes: '',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/swipe/analytics/:candidateId', () => {
    it('should require authentication', async () => {
      const { candidate } = await createCompleteTestSetup();

      const response = await request(app).get(
        `/api/swipe/analytics/${candidate.id}`
      );

      expect(response.status).toBe(401);
    });

    it('should require admin role', async () => {
      const user = await createTestUser({ role: 'VOTER' });
      const token = generateTestToken(user.id, user.email, 'VOTER');
      const candidate = await createTestCandidate();

      const response = await request(app)
        .get(`/api/swipe/analytics/${candidate.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return analytics for admin', async () => {
      const user = await createTestUser({ role: 'ADMIN' });
      const token = generateTestToken(user.id, user.email, 'ADMIN');
      const candidate = await createTestCandidate();

      const response = await request(app)
        .get(`/api/swipe/analytics/${candidate.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('swipes');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('shortlistRate');
    });
  });
});
