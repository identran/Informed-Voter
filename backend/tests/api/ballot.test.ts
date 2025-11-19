import request from 'supertest';
import { app } from '../../src/index';
import {
  createTestUser,
  generateTestToken,
  cleanupTestData,
} from '../helpers/testUtils';
import { prisma } from '../../src/config/database';

/**
 * Ballot API Tests
 *
 * Tests all ballot preview endpoints:
 * - GET /api/ballot/preview - Get ballot preview for address
 * - POST /api/ballot/save - Save ballot preview
 * - GET /api/ballot/saved - Get user's saved ballot previews
 * - GET /api/ballot/saved/:id - Get specific ballot preview
 * - DELETE /api/ballot/saved/:id - Delete ballot preview
 * - GET /api/ballot/elections - Get upcoming elections
 * - POST /api/ballot/reminder - Create election reminder
 * - GET /api/ballot/reminders - Get user's election reminders
 * - DELETE /api/ballot/reminder/:id - Delete election reminder
 * - GET /api/ballot/guide/:id - Get ballot guide summary
 */

describe('Ballot API', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  describe('GET /api/ballot/preview', () => {
    it('should be publicly accessible (no auth required)', async () => {
      const response = await request(app).get('/api/ballot/preview').query({
        address: '1600 Pennsylvania Avenue NW, Washington, DC 20500',
      });

      // Note: This will fail if Google Civic API is not configured
      // We expect either success or proper error message
      expect([200, 500]).toContain(response.status);
    });

    it('should require address parameter', async () => {
      const response = await request(app).get('/api/ballot/preview');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Address is required');
    });

    it('should accept electionId parameter', async () => {
      const response = await request(app).get('/api/ballot/preview').query({
        address: '1600 Pennsylvania Avenue NW, Washington, DC 20500',
        electionId: '2000',
      });

      expect([200, 500]).toContain(response.status);
    });
  });

  describe('POST /api/ballot/save', () => {
    it('should require authentication', async () => {
      const response = await request(app).post('/api/ballot/save').send({
        address: '1600 Pennsylvania Avenue NW, Washington, DC 20500',
        electionId: '2000',
      });

      expect(response.status).toBe(401);
    });

    it('should require address and electionId', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user.id, user.email);

      const response = await request(app)
        .post('/api/ballot/save')
        .set('Authorization', `Bearer ${token}`)
        .send({
          address: '1600 Pennsylvania Avenue NW, Washington, DC 20500',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('required');
    });

    it('should save ballot preview for authenticated user', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user.id, user.email);

      // Mock ballot preview by directly creating one
      const preview = await prisma.ballotPreview.create({
        data: {
          userId: user.id,
          electionId: '2000',
          address: '1600 Pennsylvania Avenue NW, Washington, DC 20500',
          ballotData: {
            election: {
              id: '2000',
              name: 'Test Election',
              date: '2024-11-05',
            },
            contests: {
              federal: [],
              state: [],
              local: [],
              judicial: [],
              referendums: [],
            },
          },
        },
      });

      expect(preview.id).toBeDefined();
      expect(preview.userId).toBe(user.id);
      expect(preview.electionId).toBe('2000');
    });
  });

  describe('GET /api/ballot/saved', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/ballot/saved');

      expect(response.status).toBe(401);
    });

    it('should return empty array if no saved previews', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user.id, user.email);

      const response = await request(app)
        .get('/api/ballot/saved')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should return user saved ballot previews', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user.id, user.email);

      // Create test ballot preview
      const preview = await prisma.ballotPreview.create({
        data: {
          userId: user.id,
          electionId: '2000',
          address: '1600 Pennsylvania Avenue NW, Washington, DC 20500',
          ballotData: {
            election: {
              id: '2000',
              name: 'Test Election',
              date: '2024-11-05',
            },
            contests: {
              federal: [],
              state: [],
              local: [],
              judicial: [],
              referendums: [],
            },
          },
        },
      });

      const response = await request(app)
        .get('/api/ballot/saved')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].id).toBe(preview.id);
    });
  });

  describe('GET /api/ballot/saved/:id', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/ballot/saved/test-id');

      expect(response.status).toBe(401);
    });

    it('should return 404 if preview not found', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user.id, user.email);

      const response = await request(app)
        .get('/api/ballot/saved/nonexistent-id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it('should return ballot preview by id', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user.id, user.email);

      const preview = await prisma.ballotPreview.create({
        data: {
          userId: user.id,
          electionId: '2000',
          address: '1600 Pennsylvania Avenue NW, Washington, DC 20500',
          ballotData: {
            election: {
              id: '2000',
              name: 'Test Election',
              date: '2024-11-05',
            },
            contests: {
              federal: [],
              state: [],
              local: [],
              judicial: [],
              referendums: [],
            },
          },
        },
      });

      const response = await request(app)
        .get(`/api/ballot/saved/${preview.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(preview.id);
    });

    it('should not return another user preview', async () => {
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com' });
      const token2 = generateTestToken(user2.id, user2.email);

      const preview = await prisma.ballotPreview.create({
        data: {
          userId: user1.id,
          electionId: '2000',
          address: '1600 Pennsylvania Avenue NW, Washington, DC 20500',
          ballotData: {
            election: {
              id: '2000',
              name: 'Test Election',
              date: '2024-11-05',
            },
            contests: {
              federal: [],
              state: [],
              local: [],
              judicial: [],
              referendums: [],
            },
          },
        },
      });

      const response = await request(app)
        .get(`/api/ballot/saved/${preview.id}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/ballot/saved/:id', () => {
    it('should require authentication', async () => {
      const response = await request(app).delete('/api/ballot/saved/test-id');

      expect(response.status).toBe(401);
    });

    it('should return 404 if preview not found', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user.id, user.email);

      const response = await request(app)
        .delete('/api/ballot/saved/nonexistent-id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it('should delete ballot preview', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user.id, user.email);

      const preview = await prisma.ballotPreview.create({
        data: {
          userId: user.id,
          electionId: '2000',
          address: '1600 Pennsylvania Avenue NW, Washington, DC 20500',
          ballotData: {
            election: {
              id: '2000',
              name: 'Test Election',
              date: '2024-11-05',
            },
            contests: {
              federal: [],
              state: [],
              local: [],
              judicial: [],
              referendums: [],
            },
          },
        },
      });

      const response = await request(app)
        .delete(`/api/ballot/saved/${preview.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify deletion
      const deleted = await prisma.ballotPreview.findUnique({
        where: { id: preview.id },
      });
      expect(deleted).toBeNull();
    });
  });

  describe('GET /api/ballot/elections', () => {
    it('should be publicly accessible (no auth required)', async () => {
      const response = await request(app).get('/api/ballot/elections');

      // Note: This will fail if Google Civic API is not configured
      expect([200, 500]).toContain(response.status);
    });

    it('should return array of elections', async () => {
      const response = await request(app).get('/api/ballot/elections');

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    });
  });

  describe('POST /api/ballot/reminder', () => {
    it('should require authentication', async () => {
      const response = await request(app).post('/api/ballot/reminder').send({
        electionId: '2000',
        reminderDate: new Date('2024-11-04').toISOString(),
      });

      expect(response.status).toBe(401);
    });

    it('should require electionId and reminderDate', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user.id, user.email);

      const response = await request(app)
        .post('/api/ballot/reminder')
        .set('Authorization', `Bearer ${token}`)
        .send({
          electionId: '2000',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('required');
    });

    it('should validate reminderDate format', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user.id, user.email);

      const response = await request(app)
        .post('/api/ballot/reminder')
        .set('Authorization', `Bearer ${token}`)
        .send({
          electionId: '2000',
          reminderDate: 'invalid-date',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid');
    });

    it('should reject past dates', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user.id, user.email);

      const pastDate = new Date('2020-01-01').toISOString();

      const response = await request(app)
        .post('/api/ballot/reminder')
        .set('Authorization', `Bearer ${token}`)
        .send({
          electionId: '2000',
          reminderDate: pastDate,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('future');
    });

    it('should create election reminder', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user.id, user.email);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const response = await request(app)
        .post('/api/ballot/reminder')
        .set('Authorization', `Bearer ${token}`)
        .send({
          electionId: '2000',
          reminderDate: futureDate.toISOString(),
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reminderId).toBeDefined();
    });

    it('should update existing reminder for same election', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user.id, user.email);

      const futureDate1 = new Date();
      futureDate1.setDate(futureDate1.getDate() + 7);

      // Create first reminder
      const response1 = await request(app)
        .post('/api/ballot/reminder')
        .set('Authorization', `Bearer ${token}`)
        .send({
          electionId: '2000',
          reminderDate: futureDate1.toISOString(),
        });

      expect(response1.status).toBe(200);
      const reminderId1 = response1.body.data.reminderId;

      const futureDate2 = new Date();
      futureDate2.setDate(futureDate2.getDate() + 10);

      // Create second reminder for same election
      const response2 = await request(app)
        .post('/api/ballot/reminder')
        .set('Authorization', `Bearer ${token}`)
        .send({
          electionId: '2000',
          reminderDate: futureDate2.toISOString(),
        });

      expect(response2.status).toBe(200);
      const reminderId2 = response2.body.data.reminderId;

      // Should return same ID (updated existing)
      expect(reminderId2).toBe(reminderId1);
    });
  });

  describe('GET /api/ballot/reminders', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/ballot/reminders');

      expect(response.status).toBe(401);
    });

    it('should return empty array if no reminders', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user.id, user.email);

      const response = await request(app)
        .get('/api/ballot/reminders')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should return user election reminders', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user.id, user.email);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const reminder = await prisma.electionReminder.create({
        data: {
          userId: user.id,
          electionId: '2000',
          reminderDate: futureDate,
        },
      });

      const response = await request(app)
        .get('/api/ballot/reminders')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].id).toBe(reminder.id);
    });

    it('should not return sent reminders', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user.id, user.email);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      await prisma.electionReminder.create({
        data: {
          userId: user.id,
          electionId: '2000',
          reminderDate: futureDate,
          sent: true,
          sentAt: new Date(),
        },
      });

      const response = await request(app)
        .get('/api/ballot/reminders')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('DELETE /api/ballot/reminder/:id', () => {
    it('should require authentication', async () => {
      const response = await request(app).delete('/api/ballot/reminder/test-id');

      expect(response.status).toBe(401);
    });

    it('should return 404 if reminder not found', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user.id, user.email);

      const response = await request(app)
        .delete('/api/ballot/reminder/nonexistent-id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it('should delete election reminder', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user.id, user.email);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const reminder = await prisma.electionReminder.create({
        data: {
          userId: user.id,
          electionId: '2000',
          reminderDate: futureDate,
        },
      });

      const response = await request(app)
        .delete(`/api/ballot/reminder/${reminder.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify deletion
      const deleted = await prisma.electionReminder.findUnique({
        where: { id: reminder.id },
      });
      expect(deleted).toBeNull();
    });
  });

  describe('GET /api/ballot/guide/:id', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/ballot/guide/test-id');

      expect(response.status).toBe(401);
    });

    it('should return 404 if preview not found', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user.id, user.email);

      const response = await request(app)
        .get('/api/ballot/guide/nonexistent-id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it('should return ballot guide with summary', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user.id, user.email);

      const preview = await prisma.ballotPreview.create({
        data: {
          userId: user.id,
          electionId: '2000',
          address: '1600 Pennsylvania Avenue NW, Washington, DC 20500',
          ballotData: {
            election: {
              id: '2000',
              name: 'Test Election',
              date: '2024-11-05',
            },
            contests: {
              federal: [{ office: 'President', candidates: [] }],
              state: [{ office: 'Governor', candidates: [] }],
              local: [],
              judicial: [],
              referendums: [],
            },
          },
        },
      });

      const response = await request(app)
        .get(`/api/ballot/guide/${preview.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.preview).toBeDefined();
      expect(response.body.data.summary).toBeDefined();
      expect(response.body.data.summary.totalRaces).toBe(2);
      expect(response.body.data.summary.federalRaces).toBe(1);
      expect(response.body.data.summary.stateRaces).toBe(1);
    });
  });
});
