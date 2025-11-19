import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface CandidateMatchResult {
  candidateId: string;
  candidate: {
    id: string;
    name: string;
    office: string;
    district: string | null;
    state: string;
    isIncumbent: boolean;
  };
  alignmentScore: number;
  matchedStances: number;
  totalStances: number;
  breakdown: Array<{
    stanceId: string;
    stanceTitle: string;
    userPosition: string;
    candidatePosition: string;
    aligned: boolean;
    importance: number;
  }>;
}

/**
 * Calculate position similarity
 * Returns a score between 0-1 where 1 is perfect alignment
 */
function calculatePositionSimilarity(
  userPosition: string,
  candidatePosition: string
): number {
  // Normalize positions to support/oppose/neutral
  const normalizePosition = (pos: string): string => {
    const lower = pos.toLowerCase();
    if (lower.includes('support') || lower.includes('yes') || lower.includes('favor')) {
      return 'support';
    } else if (lower.includes('oppose') || lower.includes('no') || lower.includes('against')) {
      return 'oppose';
    } else {
      return 'neutral';
    }
  };

  const userPos = normalizePosition(userPosition);
  const candidatePos = normalizePosition(candidatePosition);

  // Perfect match
  if (userPos === candidatePos) {
    return 1.0;
  }

  // Partial match (both not neutral but different)
  if (userPos === 'neutral' || candidatePos === 'neutral') {
    return 0.5;
  }

  // Complete mismatch (support vs oppose)
  return 0.0;
}

/**
 * Calculate alignment score between a user and a candidate
 */
export async function calculateCandidateMatch(
  userId: string,
  candidateId: string
): Promise<CandidateMatchResult> {
  try {
    // Get user's survey responses
    const userResponses = await prisma.userSurveyResponse.findMany({
      where: { userId },
      include: {
        question: {
          include: {
            stance: true,
          },
        },
      },
    });

    if (userResponses.length === 0) {
      throw new Error('User has not completed survey');
    }

    // Get candidate's stances
    const candidateStances = await prisma.candidateStance.findMany({
      where: { candidateId },
      include: {
        stance: true,
      },
    });

    if (candidateStances.length === 0) {
      throw new Error('Candidate has no stances defined');
    }

    // Get candidate details
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      select: {
        id: true,
        name: true,
        office: true,
        district: true,
        state: true,
        isIncumbent: true,
      },
    });

    if (!candidate) {
      throw new Error('Candidate not found');
    }

    // Create a map of user responses by stance ID
    const userStanceMap = new Map(
      userResponses.map((response) => [
        response.question.stanceId,
        {
          position: response.position,
          importance: response.importance,
        },
      ])
    );

    // Calculate alignment for each stance
    let totalWeightedScore = 0;
    let totalWeight = 0;
    let matchedStances = 0;
    const breakdown: CandidateMatchResult['breakdown'] = [];

    for (const candidateStance of candidateStances) {
      const userStance = userStanceMap.get(candidateStance.stanceId);

      if (userStance) {
        const similarity = calculatePositionSimilarity(
          userStance.position,
          candidateStance.position
        );

        const aligned = similarity >= 0.75; // Consider 75%+ as aligned
        if (aligned) {
          matchedStances++;
        }

        // Weight by user's importance rating
        const weight = userStance.importance;
        totalWeightedScore += similarity * weight;
        totalWeight += weight;

        breakdown.push({
          stanceId: candidateStance.stanceId,
          stanceTitle: candidateStance.stance.title,
          userPosition: userStance.position,
          candidatePosition: candidateStance.position,
          aligned,
          importance: userStance.importance,
        });
      }
    }

    // Calculate final alignment score (0-100)
    const alignmentScore =
      totalWeight > 0 ? (totalWeightedScore / totalWeight) * 100 : 0;

    // Store the match result in database
    await prisma.candidateMatch.upsert({
      where: {
        userId_candidateId: {
          userId,
          candidateId,
        },
      },
      update: {
        alignmentScore: Math.round(alignmentScore * 100) / 100, // Round to 2 decimals
        calculatedAt: new Date(),
      },
      create: {
        userId,
        candidateId,
        alignmentScore: Math.round(alignmentScore * 100) / 100,
      },
    });

    return {
      candidateId,
      candidate,
      alignmentScore: Math.round(alignmentScore),
      matchedStances,
      totalStances: candidateStances.length,
      breakdown,
    };
  } catch (error) {
    logger.error(
      `Error calculating match for user ${userId} and candidate ${candidateId}:`,
      error
    );
    throw error;
  }
}

/**
 * Calculate matches for a user with all candidates in their area
 */
export async function calculateAllMatches(
  userId: string,
  state?: string,
  district?: string
): Promise<CandidateMatchResult[]> {
  try {
    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Build candidate filter
    const candidateFilter: any = {
      verificationStatus: 'VERIFIED',
    };

    if (state) {
      candidateFilter.state = state;
    } else if (user.location) {
      // Try to parse state from user location
      candidateFilter.state = user.location;
    }

    if (district) {
      candidateFilter.district = district;
    }

    // Get relevant candidates
    const candidates = await prisma.candidate.findMany({
      where: candidateFilter,
      select: { id: true },
    });

    if (candidates.length === 0) {
      logger.warn(`No candidates found for user ${userId}`);
      return [];
    }

    // Calculate matches for all candidates
    const matches: CandidateMatchResult[] = [];
    for (const candidate of candidates) {
      try {
        const match = await calculateCandidateMatch(userId, candidate.id);
        matches.push(match);
      } catch (error) {
        // Skip candidates that can't be matched (e.g., no stances defined)
        logger.warn(
          `Could not calculate match for candidate ${candidate.id}:`,
          error
        );
      }
    }

    // Sort by alignment score (highest first)
    matches.sort((a, b) => b.alignmentScore - a.alignmentScore);

    return matches;
  } catch (error) {
    logger.error(`Error calculating all matches for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Get stored matches for a user
 */
export async function getUserMatches(
  userId: string,
  limit: number = 10
): Promise<CandidateMatchResult[]> {
  try {
    const storedMatches = await prisma.candidateMatch.findMany({
      where: { userId },
      include: {
        candidate: {
          select: {
            id: true,
            name: true,
            office: true,
            district: true,
            state: true,
            isIncumbent: true,
          },
        },
      },
      orderBy: {
        alignmentScore: 'desc',
      },
      take: limit,
    });

    // For stored matches, we don't have the detailed breakdown
    // If detailed breakdown is needed, call calculateCandidateMatch
    return storedMatches.map((match) => ({
      candidateId: match.candidateId,
      candidate: match.candidate,
      alignmentScore: Math.round(match.alignmentScore),
      matchedStances: 0, // Would need to recalculate for this
      totalStances: 0, // Would need to recalculate for this
      breakdown: [], // Would need to recalculate for this
    }));
  } catch (error) {
    logger.error(`Error fetching user matches for ${userId}:`, error);
    throw error;
  }
}

/**
 * Get match explanation for a specific user-candidate pair
 */
export async function getMatchExplanation(
  userId: string,
  candidateId: string
): Promise<CandidateMatchResult> {
  try {
    // Check if match exists in database
    const storedMatch = await prisma.candidateMatch.findUnique({
      where: {
        userId_candidateId: {
          userId,
          candidateId,
        },
      },
    });

    // If match exists and is recent (< 7 days old), recalculate for fresh breakdown
    // Otherwise calculate fresh match
    if (storedMatch &&
        Date.now() - storedMatch.calculatedAt.getTime() < 7 * 24 * 60 * 60 * 1000) {
      // Less than 7 days old, recalculate for detailed breakdown
      return await calculateCandidateMatch(userId, candidateId);
    }

    // Calculate fresh match
    return await calculateCandidateMatch(userId, candidateId);
  } catch (error) {
    logger.error(
      `Error getting match explanation for user ${userId} and candidate ${candidateId}:`,
      error
    );
    throw error;
  }
}

/**
 * Refresh all matches for a user (call this when user updates survey)
 */
export async function refreshUserMatches(userId: string): Promise<void> {
  try {
    // Delete old matches
    await prisma.candidateMatch.deleteMany({
      where: { userId },
    });

    // Recalculate matches
    await calculateAllMatches(userId);

    logger.info(`Refreshed matches for user ${userId}`);
  } catch (error) {
    logger.error(`Error refreshing matches for user ${userId}:`, error);
    throw error;
  }
}
