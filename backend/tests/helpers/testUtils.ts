import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

/**
 * Generate a JWT token for testing
 */
export function generateTestToken(userId: string, email: string, role: string = 'VOTER'): string {
  return jwt.sign(
    { userId, email, role },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
}

/**
 * Create a test user
 */
export async function createTestUser(overrides: any = {}) {
  const passwordHash = await bcrypt.hash('password123', 10);

  return prisma.user.create({
    data: {
      email: overrides.email || `test-${Date.now()}@example.com`,
      passwordHash,
      name: overrides.name || 'Test User',
      role: overrides.role || 'VOTER',
      location: overrides.location || 'CA',
      zipCode: overrides.zipCode || '90210',
    },
  });
}

/**
 * Create a test candidate
 */
export async function createTestCandidate(overrides: any = {}) {
  return prisma.candidate.create({
    data: {
      name: overrides.name || 'Test Candidate',
      email: overrides.email || `candidate-${Date.now()}@example.com`,
      office: overrides.office || 'US Senator',
      state: overrides.state || 'CA',
      district: overrides.district || null,
      bio: overrides.bio || 'Test bio for candidate',
      goals: overrides.goals || 'Test goals',
      reasonForRunning: overrides.reasonForRunning || 'Test reason',
      verificationStatus: overrides.verificationStatus || 'VERIFIED',
      isIncumbent: overrides.isIncumbent || false,
    },
  });
}

/**
 * Create a test stance
 */
export async function createTestStance(overrides: any = {}) {
  return prisma.stance.create({
    data: {
      category: overrides.category || 'Test Category',
      title: overrides.title || 'Test Stance',
      description: overrides.description || 'Test stance description',
      order: overrides.order || 1,
      isActive: overrides.isActive !== undefined ? overrides.isActive : true,
    },
  });
}

/**
 * Create a test survey question
 */
export async function createTestSurveyQuestion(stanceId: string, overrides: any = {}) {
  return prisma.surveyQuestion.create({
    data: {
      stanceId,
      text: overrides.text || 'Test question?',
      category: overrides.category || 'Test Category',
      scope: overrides.scope || 'national',
      responseType: overrides.responseType || 'support-oppose',
      options: overrides.options || [],
      order: overrides.order || 1,
      isActive: overrides.isActive !== undefined ? overrides.isActive : true,
    },
  });
}

/**
 * Create a test candidate stance
 */
export async function createTestCandidateStance(
  candidateId: string,
  stanceId: string,
  overrides: any = {}
) {
  return prisma.candidateStance.create({
    data: {
      candidateId,
      stanceId,
      position: overrides.position || 'I support this stance',
      sourceUrl: overrides.sourceUrl || 'https://example.com',
      priority: overrides.priority || 5,
    },
  });
}

/**
 * Clean up all test data
 */
export async function cleanupTestData() {
  // Delete in reverse order of dependencies
  await prisma.userSurveyResponse.deleteMany({});
  await prisma.candidateMatch.deleteMany({});
  await prisma.swipeAction.deleteMany({});
  await prisma.savedCandidate.deleteMany({});
  await prisma.pollResponse.deleteMany({});
  await prisma.aggregatedPollData.deleteMany({});
  await prisma.candidateStance.deleteMany({});
  await prisma.surveyQuestion.deleteMany({});
  await prisma.candidate.deleteMany({});
  await prisma.stance.deleteMany({});
  await prisma.user.deleteMany({
    where: {
      email: {
        contains: 'test',
      },
    },
  });
}

/**
 * Create a complete test setup with user, candidate, and stance
 */
export async function createCompleteTestSetup() {
  const user = await createTestUser();
  const candidate = await createTestCandidate();
  const stance = await createTestStance();
  const surveyQuestion = await createTestSurveyQuestion(stance.id);
  await createTestCandidateStance(candidate.id, stance.id);

  const token = generateTestToken(user.id, user.email, user.role);

  return {
    user,
    candidate,
    stance,
    surveyQuestion,
    token,
  };
}
