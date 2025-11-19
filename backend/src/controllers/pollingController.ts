import { Request, Response } from 'express';
import {
  submitPollResponse,
  getPublicPollData,
  getPollingTrends,
  getTopCandidatesByState,
  hasUserRespondedToPoll,
} from '../services/pollingService';
import { logger } from '../utils/logger';

/**
 * POST /api/polls/respond
 * Submit or update a poll response for a candidate
 */
export async function respondToPoll(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { candidateId, intentToVote, favorability } = req.body;

    // Validate required fields
    if (!candidateId || !intentToVote || favorability === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: candidateId, intentToVote, favorability',
      });
    }

    // Validate intent to vote
    const validIntents = ['definitely', 'likely', 'unlikely', 'definitely_not'];
    if (!validIntents.includes(intentToVote)) {
      return res.status(400).json({
        success: false,
        message: `Invalid intentToVote. Must be one of: ${validIntents.join(', ')}`,
      });
    }

    // Validate favorability
    if (favorability < 1 || favorability > 5) {
      return res.status(400).json({
        success: false,
        message: 'Favorability must be between 1 and 5',
      });
    }

    await submitPollResponse(userId, candidateId, intentToVote, favorability);

    res.json({
      success: true,
      message: 'Poll response saved',
      data: {
        candidateId,
        intentToVote,
        favorability,
      },
    });
  } catch (error: any) {
    logger.error('Error in respondToPoll:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to save poll response',
    });
  }
}

/**
 * GET /api/polls/aggregate/:candidateId
 * Get public aggregated poll data for a candidate
 * Only returns data if minimum response threshold is met (k-anonymity)
 */
export async function getAggregatePollData(req: Request, res: Response) {
  try {
    const { candidateId } = req.params;

    if (!candidateId) {
      return res.status(400).json({
        success: false,
        message: 'Candidate ID is required',
      });
    }

    const pollData = await getPublicPollData(candidateId);

    if (!pollData) {
      return res.json({
        success: true,
        message: 'Insufficient responses for public display (minimum 100 required)',
        data: null,
      });
    }

    res.json({
      success: true,
      data: pollData,
    });
  } catch (error: any) {
    logger.error('Error in getAggregatePollData:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch poll data',
    });
  }
}

/**
 * GET /api/polls/trends/:candidateId
 * Get polling trends over time for a candidate (admin only)
 */
export async function getTrends(req: Request, res: Response) {
  try {
    const userRole = req.user?.role;
    const { candidateId } = req.params;
    const days = parseInt(req.query.days as string) || 30;

    // Check admin access
    if (userRole !== 'ADMIN' && userRole !== 'MODERATOR') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Admin access required',
      });
    }

    if (!candidateId) {
      return res.status(400).json({
        success: false,
        message: 'Candidate ID is required',
      });
    }

    if (days < 1 || days > 365) {
      return res.status(400).json({
        success: false,
        message: 'Days must be between 1 and 365',
      });
    }

    const trends = await getPollingTrends(candidateId, days);

    res.json({
      success: true,
      data: {
        candidateId,
        period: `${days} days`,
        trends,
      },
    });
  } catch (error: any) {
    logger.error('Error in getTrends:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch polling trends',
    });
  }
}

/**
 * GET /api/polls/top/:state
 * Get top candidates by polling data for a specific state
 */
export async function getTopCandidates(req: Request, res: Response) {
  try {
    const { state } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!state) {
      return res.status(400).json({
        success: false,
        message: 'State is required',
      });
    }

    if (limit < 1 || limit > 50) {
      return res.status(400).json({
        success: false,
        message: 'Limit must be between 1 and 50',
      });
    }

    const topCandidates = await getTopCandidatesByState(state, limit);

    res.json({
      success: true,
      data: {
        state,
        count: topCandidates.length,
        candidates: topCandidates,
      },
    });
  } catch (error: any) {
    logger.error('Error in getTopCandidates:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch top candidates',
    });
  }
}

/**
 * GET /api/polls/check/:candidateId
 * Check if user has already responded to poll for a candidate
 */
export async function checkUserResponse(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { candidateId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (!candidateId) {
      return res.status(400).json({
        success: false,
        message: 'Candidate ID is required',
      });
    }

    const hasResponded = await hasUserRespondedToPoll(userId, candidateId);

    res.json({
      success: true,
      data: {
        candidateId,
        hasResponded,
      },
    });
  } catch (error: any) {
    logger.error('Error in checkUserResponse:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check poll response',
    });
  }
}

/**
 * GET /api/polls/user-responses
 * Get all of the current user's poll responses
 */
export async function getUserResponses(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Import prisma to query user's responses
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const responses = await prisma.pollResponse.findMany({
      where: { userId },
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
        createdAt: 'desc',
      },
    });

    await prisma.$disconnect();

    res.json({
      success: true,
      data: {
        count: responses.length,
        responses: responses.map((r) => ({
          candidate: r.candidate,
          intentToVote: r.intentToVote,
          favorability: r.favorability,
          respondedAt: r.createdAt,
        })),
      },
    });
  } catch (error: any) {
    logger.error('Error in getUserResponses:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch user responses',
    });
  }
}
