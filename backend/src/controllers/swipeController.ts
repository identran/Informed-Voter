import { Request, Response } from 'express';
import {
  getSwipeDeck,
  recordSwipeAction,
  getUserShortlist,
  removeFromShortlist,
  updateShortlistNotes,
  getCandidateSwipeAnalytics,
} from '../services/swipeService';
import { logger } from '../utils/logger';

/**
 * GET /api/swipe/deck
 * Get candidates for swiping
 */
export async function getDeck(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const deck = await getSwipeDeck(userId, limit);

    res.json({
      success: true,
      data: {
        candidates: deck,
        count: deck.length,
      },
    });
  } catch (error: any) {
    logger.error('Error in getDeck:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch swipe deck',
    });
  }
}

/**
 * POST /api/swipe/action
 * Record a swipe action
 */
export async function recordAction(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { candidateId, action } = req.body;

    if (!candidateId || !action) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: candidateId, action',
      });
    }

    if (!['right', 'left', 'up', 'down'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be: right, left, up, or down',
      });
    }

    await recordSwipeAction(userId, candidateId, action);

    res.json({
      success: true,
      data: {
        recorded: true,
        action,
        addedToShortlist: action === 'right',
      },
    });
  } catch (error: any) {
    logger.error('Error in recordAction:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to record swipe action',
    });
  }
}

/**
 * GET /api/swipe/shortlist
 * Get user's shortlisted candidates
 */
export async function getShortlist(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const shortlist = await getUserShortlist(userId);

    res.json({
      success: true,
      data: {
        candidates: shortlist,
        count: shortlist.length,
      },
    });
  } catch (error: any) {
    logger.error('Error in getShortlist:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch shortlist',
    });
  }
}

/**
 * DELETE /api/swipe/shortlist/:candidateId
 * Remove candidate from shortlist
 */
export async function removeFromShort (req: Request, res: Response) {
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

    await removeFromShortlist(userId, candidateId);

    res.json({
      success: true,
      message: 'Candidate removed from shortlist',
    });
  } catch (error: any) {
    logger.error('Error in removeFromShortlist:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to remove from shortlist',
    });
  }
}

/**
 * PUT /api/swipe/shortlist/:candidateId/notes
 * Update notes on a shortlisted candidate
 */
export async function updateNotes(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { candidateId } = req.params;
    const { notes } = req.body;

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

    await updateShortlistNotes(userId, candidateId, notes || '');

    res.json({
      success: true,
      message: 'Notes updated',
    });
  } catch (error: any) {
    logger.error('Error in updateNotes:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update notes',
    });
  }
}

/**
 * GET /api/swipe/analytics/:candidateId
 * Get swipe analytics for a candidate (admin only)
 */
export async function getAnalytics(req: Request, res: Response) {
  try {
    const userRole = req.user?.role;
    const { candidateId } = req.params;

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

    const analytics = await getCandidateSwipeAnalytics(candidateId);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    logger.error('Error in getAnalytics:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch analytics',
    });
  }
}
