import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

const MINIMUM_RESPONSES_FOR_PUBLIC_DISPLAY = 100;

export interface PollResponseData {
  candidateId: string;
  intentToVote: 'definitely' | 'likely' | 'unlikely' | 'definitely_not';
  favorability: 1 | 2 | 3 | 4 | 5;
}

export interface AggregatedPollResult {
  candidateId: string;
  candidate: {
    id: string;
    name: string;
    office: string;
    district: string | null;
    state: string;
  };
  intentPercentage: number;
  favorabilityAvg: number;
  responseCount: number;
  lastCalculated: Date;
  breakdown: {
    intent: {
      definitely: number;
      likely: number;
      unlikely: number;
      definitely_not: number;
    };
    favorability: {
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
    };
  };
}

/**
 * Submit or update a user's poll response for a candidate
 */
export async function submitPollResponse(
  userId: string,
  candidateId: string,
  intentToVote: string,
  favorability: number
): Promise<void> {
  try {
    // Validate inputs
    if (favorability < 1 || favorability > 5) {
      throw new Error('Favorability must be between 1 and 5');
    }

    const validIntents = ['definitely', 'likely', 'unlikely', 'definitely_not'];
    if (!validIntents.includes(intentToVote)) {
      throw new Error('Invalid intent to vote value');
    }

    // Verify candidate exists
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      throw new Error('Candidate not found');
    }

    // Upsert poll response
    await prisma.pollResponse.upsert({
      where: {
        userId_candidateId: {
          userId,
          candidateId,
        },
      },
      update: {
        intentToVote,
        favorability,
      },
      create: {
        userId,
        candidateId,
        intentToVote,
        favorability,
      },
    });

    // Trigger aggregation update (async)
    updateAggregatedPollData(candidateId).catch((error) => {
      logger.error('Error updating aggregated poll data:', error);
    });

    logger.info(`Poll response saved for user ${userId}, candidate ${candidateId}`);
  } catch (error) {
    logger.error('Error submitting poll response:', error);
    throw error;
  }
}

/**
 * Calculate and update aggregated poll data for a candidate
 */
export async function updateAggregatedPollData(
  candidateId: string
): Promise<void> {
  try {
    // Get all poll responses for this candidate
    const responses = await prisma.pollResponse.findMany({
      where: { candidateId },
    });

    if (responses.length === 0) {
      // No responses yet, delete aggregated data if exists
      await prisma.aggregatedPollData.deleteMany({
        where: { candidateId },
      });
      return;
    }

    // Calculate intent percentage (definitely + likely)
    const intentCounts = responses.reduce(
      (acc, r) => {
        acc[r.intentToVote] = (acc[r.intentToVote] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const positiveIntent =
      (intentCounts['definitely'] || 0) + (intentCounts['likely'] || 0);
    const intentPercentage =
      responses.length > 0 ? (positiveIntent / responses.length) * 100 : 0;

    // Calculate average favorability
    const totalFavorability = responses.reduce((sum, r) => sum + r.favorability, 0);
    const favorabilityAvg =
      responses.length > 0 ? totalFavorability / responses.length : 0;

    // Upsert aggregated data
    await prisma.aggregatedPollData.upsert({
      where: { candidateId },
      update: {
        intentPercentage,
        favorabilityAvg,
        responseCount: responses.length,
        lastCalculated: new Date(),
      },
      create: {
        candidateId,
        intentPercentage,
        favorabilityAvg,
        responseCount: responses.length,
      },
    });

    logger.info(
      `Updated aggregated poll data for candidate ${candidateId}: ` +
        `${responses.length} responses, ${intentPercentage.toFixed(1)}% intent`
    );
  } catch (error) {
    logger.error(
      `Error updating aggregated poll data for candidate ${candidateId}:`,
      error
    );
    throw error;
  }
}

/**
 * Get public aggregated poll data for a candidate
 * Only returns data if minimum response threshold is met (k-anonymity)
 */
export async function getPublicPollData(
  candidateId: string
): Promise<AggregatedPollResult | null> {
  try {
    const aggregated = await prisma.aggregatedPollData.findUnique({
      where: { candidateId },
      include: {
        candidate: {
          select: {
            id: true,
            name: true,
            office: true,
            district: true,
            state: true,
          },
        },
      },
    });

    if (!aggregated) {
      return null;
    }

    // Enforce minimum response threshold for privacy (k-anonymity)
    if (aggregated.responseCount < MINIMUM_RESPONSES_FOR_PUBLIC_DISPLAY) {
      logger.info(
        `Candidate ${candidateId} does not meet minimum response threshold ` +
          `(${aggregated.responseCount}/${MINIMUM_RESPONSES_FOR_PUBLIC_DISPLAY})`
      );
      return null;
    }

    // Get detailed breakdown
    const responses = await prisma.pollResponse.findMany({
      where: { candidateId },
    });

    // Calculate intent breakdown
    const intentBreakdown = {
      definitely: 0,
      likely: 0,
      unlikely: 0,
      definitely_not: 0,
    };

    responses.forEach((r) => {
      intentBreakdown[r.intentToVote as keyof typeof intentBreakdown]++;
    });

    // Calculate favorability breakdown
    const favorabilityBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    responses.forEach((r) => {
      favorabilityBreakdown[r.favorability as keyof typeof favorabilityBreakdown]++;
    });

    return {
      candidateId: aggregated.candidateId,
      candidate: aggregated.candidate,
      intentPercentage: Math.round(aggregated.intentPercentage),
      favorabilityAvg: Math.round(aggregated.favorabilityAvg * 10) / 10,
      responseCount: aggregated.responseCount,
      lastCalculated: aggregated.lastCalculated,
      breakdown: {
        intent: intentBreakdown,
        favorability: favorabilityBreakdown,
      },
    };
  } catch (error) {
    logger.error(
      `Error getting public poll data for candidate ${candidateId}:`,
      error
    );
    throw error;
  }
}

/**
 * Get polling trends for a candidate over time (admin only)
 */
export async function getPollingTrends(
  candidateId: string,
  days: number = 30
): Promise<any> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get responses grouped by date
    const responses = await prisma.pollResponse.findMany({
      where: {
        candidateId,
        createdAt: {
          gte: cutoffDate,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by day
    const trendsByDay: Record<string, any> = {};

    responses.forEach((response) => {
      const dateKey = response.createdAt.toISOString().split('T')[0];

      if (!trendsByDay[dateKey]) {
        trendsByDay[dateKey] = {
          date: dateKey,
          responses: [],
        };
      }

      trendsByDay[dateKey].responses.push(response);
    });

    // Calculate daily averages
    const trends = Object.values(trendsByDay).map((day: any) => {
      const positiveIntent = day.responses.filter(
        (r: any) => r.intentToVote === 'definitely' || r.intentToVote === 'likely'
      ).length;
      const intentPercentage =
        (positiveIntent / day.responses.length) * 100;

      const avgFavorability =
        day.responses.reduce((sum: number, r: any) => sum + r.favorability, 0) /
        day.responses.length;

      return {
        date: day.date,
        intentPercentage: Math.round(intentPercentage),
        favorabilityAvg: Math.round(avgFavorability * 10) / 10,
        responseCount: day.responses.length,
      };
    });

    return trends;
  } catch (error) {
    logger.error(
      `Error getting polling trends for candidate ${candidateId}:`,
      error
    );
    throw error;
  }
}

/**
 * Get top polling candidates by state
 */
export async function getTopCandidatesByState(
  state: string,
  limit: number = 10
): Promise<AggregatedPollResult[]> {
  try {
    const candidates = await prisma.aggregatedPollData.findMany({
      where: {
        responseCount: {
          gte: MINIMUM_RESPONSES_FOR_PUBLIC_DISPLAY,
        },
        candidate: {
          state,
          verificationStatus: 'VERIFIED',
        },
      },
      include: {
        candidate: {
          select: {
            id: true,
            name: true,
            office: true,
            district: true,
            state: true,
          },
        },
      },
      orderBy: {
        intentPercentage: 'desc',
      },
      take: limit,
    });

    // For each, get detailed breakdown
    const results: AggregatedPollResult[] = [];
    for (const agg of candidates) {
      const detailed = await getPublicPollData(agg.candidateId);
      if (detailed) {
        results.push(detailed);
      }
    }

    return results;
  } catch (error) {
    logger.error(`Error getting top candidates for state ${state}:`, error);
    throw error;
  }
}

/**
 * Check if user has responded to poll for a candidate
 */
export async function hasUserRespondedToPoll(
  userId: string,
  candidateId: string
): Promise<boolean> {
  try {
    const response = await prisma.pollResponse.findUnique({
      where: {
        userId_candidateId: {
          userId,
          candidateId,
        },
      },
    });

    return !!response;
  } catch (error) {
    logger.error('Error checking poll response:', error);
    return false;
  }
}
