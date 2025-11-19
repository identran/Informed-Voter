import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import crypto from 'crypto';

const prisma = new PrismaClient();

export interface SwipeDeckCandidate {
  id: string;
  name: string;
  office: string;
  district: string | null;
  state: string;
  isIncumbent: boolean;
  verificationStatus: string;
  topStances: Array<{
    id: string;
    title: string;
    position: string;
  }>;
  alignmentScore?: number;
}

/**
 * Generate a deterministic daily seed based on date and user ID
 * This ensures the same shuffle order for a user throughout the day
 */
function generateDailySeed(userId: string): string {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const combined = `${userId}-${today}`;
  return crypto.createHash('md5').update(combined).digest('hex');
}

/**
 * Shuffle array using seeded random (Fisher-Yates algorithm)
 */
function shuffleArray<T>(array: T[], seed: string): T[] {
  // Create a simple pseudo-random number generator from seed
  let seedNum = parseInt(seed.substring(0, 8), 16);

  const seededRandom = () => {
    seedNum = (seedNum * 9301 + 49297) % 233280;
    return seedNum / 233280;
  };

  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get swipe deck for a user
 * Returns candidates in a deterministic daily shuffle order
 */
export async function getSwipeDeck(
  userId: string,
  limit: number = 20
): Promise<SwipeDeckCandidate[]> {
  try {
    // Get user info for location filtering
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get candidates already swiped today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const swipedToday = await prisma.swipeAction.findMany({
      where: {
        userId,
        timestamp: {
          gte: today,
        },
      },
      select: {
        candidateId: true,
      },
    });

    const swipedCandidateIds = swipedToday.map((s) => s.candidateId);

    // Get candidates already in shortlist (right swipe)
    const shortlisted = await prisma.savedCandidate.findMany({
      where: { userId },
      select: { candidateId: true },
    });

    const shortlistedIds = shortlisted.map((s) => s.candidateId);

    // Combine excluded IDs
    const excludedIds = [...swipedCandidateIds, ...shortlistedIds];

    // Build candidate query
    const whereClause: any = {
      verificationStatus: 'VERIFIED',
      id: {
        notIn: excludedIds,
      },
    };

    // Filter by user's state if available
    if (user.location) {
      whereClause.state = user.location;
    }

    // Get pool of candidates
    const candidates = await prisma.candidate.findMany({
      where: whereClause,
      include: {
        stances: {
          include: {
            stance: true,
          },
          orderBy: {
            priority: 'desc',
          },
          take: 3, // Top 3 stances
        },
      },
    });

    // Get user's matches for alignment scores
    const userMatches = await prisma.candidateMatch.findMany({
      where: {
        userId,
        candidateId: {
          in: candidates.map((c) => c.id),
        },
      },
    });

    const matchScoreMap = new Map(
      userMatches.map((m) => [m.candidateId, Math.round(m.alignmentScore)])
    );

    // Transform to deck format
    const deckCandidates: SwipeDeckCandidate[] = candidates.map((c) => ({
      id: c.id,
      name: c.name,
      office: c.office,
      district: c.district,
      state: c.state,
      isIncumbent: c.isIncumbent,
      verificationStatus: c.verificationStatus,
      topStances: c.stances.map((cs) => ({
        id: cs.stance.id,
        title: cs.stance.title,
        position: cs.position.substring(0, 100), // Truncate for card display
      })),
      alignmentScore: matchScoreMap.get(c.id),
    }));

    // Shuffle using daily seed
    const seed = generateDailySeed(userId);
    const shuffled = shuffleArray(deckCandidates, seed);

    // Return limited number
    return shuffled.slice(0, limit);
  } catch (error) {
    logger.error(`Error getting swipe deck for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Record a swipe action
 */
export async function recordSwipeAction(
  userId: string,
  candidateId: string,
  action: 'right' | 'left' | 'up' | 'down'
): Promise<void> {
  try {
    // Validate candidate exists
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      throw new Error('Candidate not found');
    }

    // Record the swipe
    await prisma.swipeAction.create({
      data: {
        userId,
        candidateId,
        action,
      },
    });

    // If right swipe, add to shortlist
    if (action === 'right') {
      await prisma.savedCandidate.upsert({
        where: {
          userId_candidateId: {
            userId,
            candidateId,
          },
        },
        update: {},
        create: {
          userId,
          candidateId,
        },
      });
    }

    logger.info(
      `Recorded ${action} swipe for user ${userId} on candidate ${candidateId}`
    );
  } catch (error) {
    logger.error('Error recording swipe action:', error);
    throw error;
  }
}

/**
 * Get user's shortlist (candidates swiped right)
 */
export async function getUserShortlist(
  userId: string
): Promise<SwipeDeckCandidate[]> {
  try {
    const shortlist = await prisma.savedCandidate.findMany({
      where: { userId },
      include: {
        candidate: {
          include: {
            stances: {
              include: {
                stance: true,
              },
              orderBy: {
                priority: 'desc',
              },
              take: 3,
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get alignment scores
    const candidateIds = shortlist.map((s) => s.candidateId);
    const matches = await prisma.candidateMatch.findMany({
      where: {
        userId,
        candidateId: {
          in: candidateIds,
        },
      },
    });

    const matchScoreMap = new Map(
      matches.map((m) => [m.candidateId, Math.round(m.alignmentScore)])
    );

    return shortlist.map((s) => ({
      id: s.candidate.id,
      name: s.candidate.name,
      office: s.candidate.office,
      district: s.candidate.district,
      state: s.candidate.state,
      isIncumbent: s.candidate.isIncumbent,
      verificationStatus: s.candidate.verificationStatus,
      topStances: s.candidate.stances.map((cs) => ({
        id: cs.stance.id,
        title: cs.stance.title,
        position: cs.position.substring(0, 100),
      })),
      alignmentScore: matchScoreMap.get(s.candidate.id),
    }));
  } catch (error) {
    logger.error(`Error getting shortlist for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Remove candidate from shortlist
 */
export async function removeFromShortlist(
  userId: string,
  candidateId: string
): Promise<void> {
  try {
    await prisma.savedCandidate.delete({
      where: {
        userId_candidateId: {
          userId,
          candidateId,
        },
      },
    });

    logger.info(
      `Removed candidate ${candidateId} from shortlist for user ${userId}`
    );
  } catch (error) {
    logger.error('Error removing from shortlist:', error);
    throw error;
  }
}

/**
 * Update notes on a shortlisted candidate
 */
export async function updateShortlistNotes(
  userId: string,
  candidateId: string,
  notes: string
): Promise<void> {
  try {
    await prisma.savedCandidate.update({
      where: {
        userId_candidateId: {
          userId,
          candidateId,
        },
      },
      data: {
        notes,
      },
    });

    logger.info(
      `Updated notes for candidate ${candidateId} in user ${userId}'s shortlist`
    );
  } catch (error) {
    logger.error('Error updating shortlist notes:', error);
    throw error;
  }
}

/**
 * Get swipe analytics for a candidate (for admin/analytics)
 */
export async function getCandidateSwipeAnalytics(candidateId: string) {
  try {
    const allSwipes = await prisma.swipeAction.groupBy({
      by: ['action'],
      where: {
        candidateId,
      },
      _count: {
        action: true,
      },
    });

    const analytics: Record<string, number> = {
      right: 0,
      left: 0,
      up: 0,
      down: 0,
    };

    allSwipes.forEach((swipe) => {
      analytics[swipe.action] = swipe._count.action;
    });

    const total = Object.values(analytics).reduce((sum, count) => sum + count, 0);
    const shortlistRate = total > 0 ? (analytics.right / total) * 100 : 0;

    return {
      swipes: analytics,
      total,
      shortlistRate: Math.round(shortlistRate),
    };
  } catch (error) {
    logger.error(
      `Error getting swipe analytics for candidate ${candidateId}:`,
      error
    );
    throw error;
  }
}
