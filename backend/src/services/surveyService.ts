import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface SurveyQuestionWithStance {
  id: string;
  text: string;
  category: string;
  scope: string;
  responseType: string;
  options: string[];
  order: number;
  stance: {
    id: string;
    title: string;
    description: string;
  };
}

export interface SurveyResponse {
  questionId: string;
  position: 'support' | 'oppose' | 'neutral';
  importance: 1 | 2 | 3 | 4 | 5;
}

export interface UserSurveyResults {
  totalQuestions: number;
  answeredQuestions: number;
  completionPercentage: number;
  responses: Array<{
    question: SurveyQuestionWithStance;
    position: string;
    importance: number;
  }>;
}

/**
 * Get all active survey questions
 */
export async function getSurveyQuestions(
  scope?: string
): Promise<SurveyQuestionWithStance[]> {
  try {
    const questions = await prisma.surveyQuestion.findMany({
      where: {
        isActive: true,
        ...(scope && { scope }),
      },
      include: {
        stance: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });

    return questions;
  } catch (error) {
    logger.error('Error fetching survey questions:', error);
    throw new Error('Failed to fetch survey questions');
  }
}

/**
 * Save a user's response to a survey question
 */
export async function saveSurveyResponse(
  userId: string,
  questionId: string,
  position: string,
  importance: number
): Promise<void> {
  try {
    // Validate importance is between 1-5
    if (importance < 1 || importance > 5) {
      throw new Error('Importance must be between 1 and 5');
    }

    // Validate question exists
    const question = await prisma.surveyQuestion.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new Error('Survey question not found');
    }

    // Upsert the response (create or update)
    await prisma.userSurveyResponse.upsert({
      where: {
        userId_questionId: {
          userId,
          questionId,
        },
      },
      update: {
        position,
        importance,
        updatedAt: new Date(),
      },
      create: {
        userId,
        questionId,
        position,
        importance,
      },
    });

    logger.info(`Saved survey response for user ${userId}, question ${questionId}`);
  } catch (error) {
    logger.error('Error saving survey response:', error);
    throw error;
  }
}

/**
 * Save multiple survey responses at once
 */
export async function saveBatchSurveyResponses(
  userId: string,
  responses: SurveyResponse[]
): Promise<void> {
  try {
    // Validate all responses
    for (const response of responses) {
      if (response.importance < 1 || response.importance > 5) {
        throw new Error('Importance must be between 1 and 5');
      }
    }

    // Save all responses in a transaction
    await prisma.$transaction(
      responses.map((response) =>
        prisma.userSurveyResponse.upsert({
          where: {
            userId_questionId: {
              userId,
              questionId: response.questionId,
            },
          },
          update: {
            position: response.position,
            importance: response.importance,
            updatedAt: new Date(),
          },
          create: {
            userId,
            questionId: response.questionId,
            position: response.position,
            importance: response.importance,
          },
        })
      )
    );

    logger.info(`Saved ${responses.length} survey responses for user ${userId}`);
  } catch (error) {
    logger.error('Error saving batch survey responses:', error);
    throw error;
  }
}

/**
 * Get a user's survey results
 */
export async function getUserSurveyResults(
  userId: string
): Promise<UserSurveyResults> {
  try {
    // Get total number of active questions
    const totalQuestions = await prisma.surveyQuestion.count({
      where: { isActive: true },
    });

    // Get user's responses with question details
    const responses = await prisma.userSurveyResponse.findMany({
      where: { userId },
      include: {
        question: {
          include: {
            stance: {
              select: {
                id: true,
                title: true,
                description: true,
              },
            },
          },
        },
      },
    });

    const answeredQuestions = responses.length;
    const completionPercentage =
      totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

    return {
      totalQuestions,
      answeredQuestions,
      completionPercentage: Math.round(completionPercentage),
      responses: responses.map((r) => ({
        question: r.question,
        position: r.position,
        importance: r.importance,
      })),
    };
  } catch (error) {
    logger.error('Error fetching user survey results:', error);
    throw new Error('Failed to fetch user survey results');
  }
}

/**
 * Check if user has completed the survey
 */
export async function hasUserCompletedSurvey(userId: string): Promise<boolean> {
  try {
    const results = await getUserSurveyResults(userId);
    return results.completionPercentage >= 80; // Consider 80% or more as "completed"
  } catch (error) {
    logger.error('Error checking survey completion:', error);
    return false;
  }
}

/**
 * Delete all of a user's survey responses (for retaking survey)
 */
export async function clearUserSurveyResponses(userId: string): Promise<void> {
  try {
    await prisma.userSurveyResponse.deleteMany({
      where: { userId },
    });

    logger.info(`Cleared all survey responses for user ${userId}`);
  } catch (error) {
    logger.error('Error clearing user survey responses:', error);
    throw new Error('Failed to clear survey responses');
  }
}

/**
 * Get survey statistics (for admin dashboard)
 */
export async function getSurveyStatistics() {
  try {
    const totalUsers = await prisma.user.count();
    const usersWithResponses = await prisma.userSurveyResponse.findMany({
      select: { userId: true },
      distinct: ['userId'],
    });

    const completionRate =
      totalUsers > 0
        ? (usersWithResponses.length / totalUsers) * 100
        : 0;

    // Get average completion percentage
    const allResults = await Promise.all(
      usersWithResponses.map((u) => getUserSurveyResults(u.userId))
    );

    const avgCompletion =
      allResults.length > 0
        ? allResults.reduce((sum: number, r: any) => sum + r.completionPercentage, 0) /
          allResults.length
        : 0;

    // Get question response counts
    const questionStats = await prisma.userSurveyResponse.groupBy({
      by: ['questionId'],
      _count: {
        questionId: true,
      },
    });

    return {
      totalUsers,
      usersStarted: usersWithResponses.length,
      completionRate: Math.round(completionRate),
      avgCompletion: Math.round(avgCompletion),
      questionResponseCounts: questionStats,
    };
  } catch (error) {
    logger.error('Error fetching survey statistics:', error);
    throw new Error('Failed to fetch survey statistics');
  }
}
