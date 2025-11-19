import { Request, Response } from 'express';
import {
  getSurveyQuestions,
  saveSurveyResponse,
  saveBatchSurveyResponses,
  getUserSurveyResults,
  hasUserCompletedSurvey,
  clearUserSurveyResponses,
  getSurveyStatistics,
} from '../services/surveyService';
import {
  calculateAllMatches,
  getUserMatches,
  getMatchExplanation,
  refreshUserMatches,
} from '../services/matchingService';
import { logger } from '../utils/logger';

/**
 * GET /api/survey/questions
 * Get all active survey questions
 */
export async function getQuestions(req: Request, res: Response) {
  try {
    const { scope } = req.query;
    const questions = await getSurveyQuestions(scope as string);

    res.json({
      success: true,
      data: questions,
    });
  } catch (error) {
    logger.error('Error in getQuestions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch survey questions',
    });
  }
}

/**
 * POST /api/survey/start
 * Start a survey (returns questions and checks if user has existing responses)
 */
export async function startSurvey(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Get questions
    const questions = await getSurveyQuestions();

    // Check if user has existing responses
    const existingResults = await getUserSurveyResults(userId);

    res.json({
      success: true,
      data: {
        questions,
        hasExistingResponses: existingResults.answeredQuestions > 0,
        progress: {
          totalQuestions: existingResults.totalQuestions,
          answeredQuestions: existingResults.answeredQuestions,
          completionPercentage: existingResults.completionPercentage,
        },
      },
    });
  } catch (error) {
    logger.error('Error in startSurvey:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start survey',
    });
  }
}

/**
 * POST /api/survey/response
 * Save a single survey response
 */
export async function saveResponse(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { questionId, position, importance } = req.body;

    if (!questionId || !position || importance === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: questionId, position, importance',
      });
    }

    await saveSurveyResponse(userId, questionId, position, importance);

    // Check if survey is now complete
    const isComplete = await hasUserCompletedSurvey(userId);

    res.json({
      success: true,
      data: {
        saved: true,
        surveyComplete: isComplete,
      },
    });
  } catch (error: any) {
    logger.error('Error in saveResponse:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to save response',
    });
  }
}

/**
 * POST /api/survey/responses
 * Save multiple survey responses at once
 */
export async function saveBatchResponses(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { responses } = req.body;

    if (!responses || !Array.isArray(responses)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid responses format',
      });
    }

    await saveBatchSurveyResponses(userId, responses);

    // Check if survey is now complete
    const isComplete = await hasUserCompletedSurvey(userId);

    // If complete, trigger match calculation
    if (isComplete) {
      // Run this in background to not block the response
      calculateAllMatches(userId).catch((error) => {
        logger.error('Error calculating matches after survey completion:', error);
      });
    }

    res.json({
      success: true,
      data: {
        saved: responses.length,
        surveyComplete: isComplete,
      },
    });
  } catch (error: any) {
    logger.error('Error in saveBatchResponses:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to save responses',
    });
  }
}

/**
 * GET /api/survey/results
 * Get user's survey results
 */
export async function getResults(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const results = await getUserSurveyResults(userId);

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    logger.error('Error in getResults:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch survey results',
    });
  }
}

/**
 * POST /api/survey/retake
 * Clear user's responses to retake the survey
 */
export async function retakeSurvey(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    await clearUserSurveyResponses(userId);

    res.json({
      success: true,
      message: 'Survey responses cleared. You can retake the survey.',
    });
  } catch (error) {
    logger.error('Error in retakeSurvey:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear survey responses',
    });
  }
}

/**
 * GET /api/survey/statistics
 * Get survey statistics (admin only)
 */
export async function getStatistics(req: Request, res: Response) {
  try {
    const userRole = req.user?.role;

    if (userRole !== 'ADMIN' && userRole !== 'MODERATOR') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Admin access required',
      });
    }

    const stats = await getSurveyStatistics();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error in getStatistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch survey statistics',
    });
  }
}

/**
 * GET /api/matches
 * Get user's candidate matches
 */
export async function getMatches(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const limit = parseInt(req.query.limit as string) || 10;
    const matches = await getUserMatches(userId, limit);

    res.json({
      success: true,
      data: matches,
    });
  } catch (error) {
    logger.error('Error in getMatches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch candidate matches',
    });
  }
}

/**
 * GET /api/matches/:candidateId/explanation
 * Get detailed match explanation for a specific candidate
 */
export async function getMatchDetail(req: Request, res: Response) {
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

    const explanation = await getMatchExplanation(userId, candidateId);

    res.json({
      success: true,
      data: explanation,
    });
  } catch (error: any) {
    logger.error('Error in getMatchDetail:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch match explanation',
    });
  }
}

/**
 * POST /api/matches/refresh
 * Refresh user's matches (recalculate after survey changes)
 */
export async function refreshMatches(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Run in background
    refreshUserMatches(userId).catch((error) => {
      logger.error('Error refreshing matches:', error);
    });

    res.json({
      success: true,
      message: 'Match refresh initiated',
    });
  } catch (error) {
    logger.error('Error in refreshMatches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh matches',
    });
  }
}
