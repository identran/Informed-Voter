import { Request, Response } from 'express';
import * as ballotService from '../services/ballotService';

/**
 * Ballot Controller
 *
 * Endpoints:
 * - GET /api/ballot/preview - Get ballot preview for address
 * - POST /api/ballot/save - Save ballot preview
 * - GET /api/ballot/saved - Get user's saved ballot previews
 * - GET /api/ballot/saved/:id - Get specific ballot preview
 * - DELETE /api/ballot/saved/:id - Delete ballot preview
 * - GET /api/ballot/elections - Get upcoming elections
 * - POST /api/ballot/reminder - Create election reminder
 * - GET /api/ballot/reminders - Get user's election reminders
 * - DELETE /api/ballot/reminder/:id - Delete election reminder
 * - GET /api/ballot/guide/:id - Get ballot guide summary for export
 */

/**
 * GET /api/ballot/preview
 * Get ballot preview for a specific address
 *
 * Query params:
 * - address: Full address string (required)
 * - electionId: Optional election ID
 *
 * No authentication required (public endpoint)
 */
export async function getBallotPreview(req: Request, res: Response) {
  try {
    const { address, electionId } = req.query;

    if (!address || typeof address !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Address is required',
      });
    }

    const ballotData = await ballotService.getBallotPreview(
      address,
      electionId as string | undefined
    );

    res.json({
      success: true,
      data: ballotData,
    });
  } catch (error: any) {
    console.error('Error in getBallotPreview:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch ballot preview',
    });
  }
}

/**
 * POST /api/ballot/save
 * Save ballot preview for user
 *
 * Body:
 * - address: Full address string (required)
 * - electionId: Election ID (required)
 *
 * Requires authentication
 */
export async function saveBallotPreview(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { address, electionId } = req.body;

    if (!address || !electionId) {
      return res.status(400).json({
        success: false,
        message: 'Address and electionId are required',
      });
    }

    const previewId = await ballotService.saveBallotPreview(
      userId,
      address,
      electionId
    );

    res.json({
      success: true,
      data: { previewId },
      message: 'Ballot preview saved successfully',
    });
  } catch (error: any) {
    console.error('Error in saveBallotPreview:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to save ballot preview',
    });
  }
}

/**
 * GET /api/ballot/saved
 * Get all saved ballot previews for user
 *
 * Requires authentication
 */
export async function getSavedBallotPreviews(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const previews = await ballotService.getUserBallotPreviews(userId);

    res.json({
      success: true,
      data: previews,
    });
  } catch (error: any) {
    console.error('Error in getSavedBallotPreviews:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch saved ballot previews',
    });
  }
}

/**
 * GET /api/ballot/saved/:id
 * Get specific ballot preview
 *
 * Requires authentication
 */
export async function getBallotPreviewById(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Preview ID is required',
      });
    }

    const preview = await ballotService.getBallotPreviewById(id, userId);

    res.json({
      success: true,
      data: preview,
    });
  } catch (error: any) {
    console.error('Error in getBallotPreviewById:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Ballot preview not found',
    });
  }
}

/**
 * DELETE /api/ballot/saved/:id
 * Delete saved ballot preview
 *
 * Requires authentication
 */
export async function deleteBallotPreview(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Preview ID is required',
      });
    }

    await ballotService.deleteBallotPreview(id, userId);

    res.json({
      success: true,
      message: 'Ballot preview deleted successfully',
    });
  } catch (error: any) {
    console.error('Error in deleteBallotPreview:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Failed to delete ballot preview',
    });
  }
}

/**
 * GET /api/ballot/elections
 * Get list of upcoming elections
 *
 * No authentication required (public endpoint)
 */
export async function getUpcomingElections(req: Request, res: Response) {
  try {
    const elections = await ballotService.getUpcomingElections();

    res.json({
      success: true,
      data: elections,
    });
  } catch (error: any) {
    console.error('Error in getUpcomingElections:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch upcoming elections',
    });
  }
}

/**
 * POST /api/ballot/reminder
 * Create election reminder for user
 *
 * Body:
 * - electionId: Election ID (required)
 * - reminderDate: ISO date string (required)
 *
 * Requires authentication
 */
export async function createElectionReminder(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { electionId, reminderDate } = req.body;

    if (!electionId || !reminderDate) {
      return res.status(400).json({
        success: false,
        message: 'electionId and reminderDate are required',
      });
    }

    // Validate date
    const date = new Date(reminderDate);
    if (isNaN(date.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reminderDate format',
      });
    }

    // Check if reminder date is in the future
    if (date <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'reminderDate must be in the future',
      });
    }

    const reminderId = await ballotService.createElectionReminder(
      userId,
      electionId,
      date
    );

    res.json({
      success: true,
      data: { reminderId },
      message: 'Election reminder created successfully',
    });
  } catch (error: any) {
    console.error('Error in createElectionReminder:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create election reminder',
    });
  }
}

/**
 * GET /api/ballot/reminders
 * Get user's election reminders
 *
 * Requires authentication
 */
export async function getElectionReminders(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const reminders = await ballotService.getUserElectionReminders(userId);

    res.json({
      success: true,
      data: reminders,
    });
  } catch (error: any) {
    console.error('Error in getElectionReminders:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch election reminders',
    });
  }
}

/**
 * DELETE /api/ballot/reminder/:id
 * Delete election reminder
 *
 * Requires authentication
 */
export async function deleteElectionReminder(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Reminder ID is required',
      });
    }

    await ballotService.deleteElectionReminder(id, userId);

    res.json({
      success: true,
      message: 'Election reminder deleted successfully',
    });
  } catch (error: any) {
    console.error('Error in deleteElectionReminder:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Failed to delete election reminder',
    });
  }
}

/**
 * GET /api/ballot/guide/:id
 * Get ballot guide summary for export
 *
 * Includes:
 * - Ballot preview data
 * - User's candidate matches
 * - User's notes on candidates
 * - Summary statistics
 *
 * Requires authentication
 */
export async function getBallotGuide(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Preview ID is required',
      });
    }

    const guide = await ballotService.generateBallotGuideSummary(id, userId);

    res.json({
      success: true,
      data: guide,
    });
  } catch (error: any) {
    console.error('Error in getBallotGuide:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Failed to generate ballot guide',
    });
  }
}
