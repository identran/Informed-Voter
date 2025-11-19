import { prisma } from '../config/database';
import * as googleCivicAPI from './integrations/googleCivicAPI';

/**
 * Ballot Service
 *
 * Handles ballot preview functionality:
 * - Fetch ballot information from Google Civic API
 * - Save/retrieve ballot previews
 * - Manage election reminders
 * - Generate ballot guides
 */

interface BallotPreviewData {
  election: {
    id: string;
    name: string;
    date: string;
  };
  pollingLocation?: {
    address: string;
    hours?: string;
    name?: string;
  };
  earlyVoting?: Array<{
    address: string;
    hours?: string;
    name?: string;
  }>;
  dropOffLocations?: Array<{
    address: string;
    hours?: string;
    name?: string;
  }>;
  contests: {
    federal: any[];
    state: any[];
    local: any[];
    judicial: any[];
    referendums: any[];
  };
  electionAdministration?: {
    name?: string;
    electionInfoUrl?: string;
    registrationUrl?: string;
    absenteeVotingUrl?: string;
    ballotInfoUrl?: string;
  };
  registrationStatus?: 'registered' | 'not_registered' | 'unknown';
}

/**
 * Fetch ballot preview for user's address
 */
export async function getBallotPreview(
  address: string,
  electionId?: string
): Promise<BallotPreviewData> {
  // Validate address
  if (!googleCivicAPI.validateAddress(address)) {
    throw new Error('Invalid address format. Please provide a complete address with city/state or ZIP code.');
  }

  // Check if API is configured
  if (!googleCivicAPI.isConfigured()) {
    throw new Error('Google Civic Information API is not configured. Please add GOOGLE_CIVIC_API_KEY to environment variables.');
  }

  try {
    // Fetch voter information from Google Civic API
    const voterInfo = await googleCivicAPI.getVoterInfo(address, electionId);

    // Extract polling locations
    const locations = googleCivicAPI.extractPollingLocations(voterInfo);

    // Extract election administration info
    const adminInfo = googleCivicAPI.extractElectionAdminInfo(voterInfo);

    // Categorize contests by type
    const contests = googleCivicAPI.categorizeContests(voterInfo);

    // Format polling location
    const pollingLocation = locations.pollingLocations[0];
    const formattedPollingLocation = pollingLocation
      ? {
          address: formatAddress(pollingLocation.address),
          hours: pollingLocation.pollingHours,
          name: pollingLocation.name,
        }
      : undefined;

    // Format early voting locations
    const earlyVoting = locations.earlyVoteSites.map((site) => ({
      address: formatAddress(site.address),
      hours: site.pollingHours,
      name: site.name,
    }));

    // Format drop-off locations
    const dropOffLocations = locations.dropOffLocations.map((loc) => ({
      address: formatAddress(loc.address),
      hours: loc.pollingHours,
      name: loc.name,
    }));

    return {
      election: {
        id: voterInfo.election.id,
        name: voterInfo.election.name,
        date: voterInfo.election.electionDay,
      },
      pollingLocation: formattedPollingLocation,
      earlyVoting,
      dropOffLocations,
      contests,
      electionAdministration: adminInfo,
      registrationStatus: 'unknown', // Google API doesn't provide this directly
    };
  } catch (error: any) {
    console.error('Error fetching ballot preview:', error);
    throw new Error(error.message || 'Failed to fetch ballot preview');
  }
}

/**
 * Save ballot preview to database
 */
export async function saveBallotPreview(
  userId: string,
  address: string,
  electionId: string
): Promise<string> {
  try {
    // Fetch ballot data
    const ballotData = await getBallotPreview(address, electionId);

    // Check if ballot preview already exists for this user and election
    const existing = await prisma.ballotPreview.findFirst({
      where: {
        userId,
        electionId,
      },
    });

    if (existing) {
      // Update existing preview
      await prisma.ballotPreview.update({
        where: { id: existing.id },
        data: {
          address,
          ballotData: ballotData as any,
          updatedAt: new Date(),
        },
      });
      return existing.id;
    } else {
      // Create new preview
      const preview = await prisma.ballotPreview.create({
        data: {
          userId,
          electionId,
          address,
          ballotData: ballotData as any,
        },
      });
      return preview.id;
    }
  } catch (error: any) {
    console.error('Error saving ballot preview:', error);
    throw new Error('Failed to save ballot preview');
  }
}

/**
 * Get saved ballot previews for user
 */
export async function getUserBallotPreviews(userId: string): Promise<any[]> {
  try {
    const previews = await prisma.ballotPreview.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return previews;
  } catch (error: any) {
    console.error('Error fetching user ballot previews:', error);
    throw new Error('Failed to fetch ballot previews');
  }
}

/**
 * Get specific ballot preview
 */
export async function getBallotPreviewById(
  previewId: string,
  userId: string
): Promise<any> {
  try {
    const preview = await prisma.ballotPreview.findFirst({
      where: {
        id: previewId,
        userId,
      },
    });

    if (!preview) {
      throw new Error('Ballot preview not found');
    }

    return preview;
  } catch (error: any) {
    console.error('Error fetching ballot preview:', error);
    throw new Error('Failed to fetch ballot preview');
  }
}

/**
 * Delete ballot preview
 */
export async function deleteBallotPreview(
  previewId: string,
  userId: string
): Promise<void> {
  try {
    const preview = await prisma.ballotPreview.findFirst({
      where: {
        id: previewId,
        userId,
      },
    });

    if (!preview) {
      throw new Error('Ballot preview not found');
    }

    await prisma.ballotPreview.delete({
      where: { id: previewId },
    });
  } catch (error: any) {
    console.error('Error deleting ballot preview:', error);
    throw new Error('Failed to delete ballot preview');
  }
}

/**
 * Get list of upcoming elections
 */
export async function getUpcomingElections(): Promise<any[]> {
  try {
    if (!googleCivicAPI.isConfigured()) {
      throw new Error('Google Civic Information API is not configured');
    }

    const elections = await googleCivicAPI.getElections();
    return elections;
  } catch (error: any) {
    console.error('Error fetching elections:', error);
    throw new Error('Failed to fetch upcoming elections');
  }
}

/**
 * Create election reminder for user
 */
export async function createElectionReminder(
  userId: string,
  electionId: string,
  reminderDate: Date
): Promise<string> {
  try {
    // Check if reminder already exists
    const existing = await prisma.electionReminder.findFirst({
      where: {
        userId,
        electionId,
      },
    });

    if (existing) {
      // Update existing reminder
      await prisma.electionReminder.update({
        where: { id: existing.id },
        data: {
          reminderDate,
          sent: false,
        },
      });
      return existing.id;
    } else {
      // Create new reminder
      const reminder = await prisma.electionReminder.create({
        data: {
          userId,
          electionId,
          reminderDate,
        },
      });
      return reminder.id;
    }
  } catch (error: any) {
    console.error('Error creating election reminder:', error);
    throw new Error('Failed to create election reminder');
  }
}

/**
 * Get user's election reminders
 */
export async function getUserElectionReminders(userId: string): Promise<any[]> {
  try {
    const reminders = await prisma.electionReminder.findMany({
      where: {
        userId,
        sent: false,
      },
      orderBy: { reminderDate: 'asc' },
    });

    return reminders;
  } catch (error: any) {
    console.error('Error fetching election reminders:', error);
    throw new Error('Failed to fetch election reminders');
  }
}

/**
 * Delete election reminder
 */
export async function deleteElectionReminder(
  reminderId: string,
  userId: string
): Promise<void> {
  try {
    const reminder = await prisma.electionReminder.findFirst({
      where: {
        id: reminderId,
        userId,
      },
    });

    if (!reminder) {
      throw new Error('Election reminder not found');
    }

    await prisma.electionReminder.delete({
      where: { id: reminderId },
    });
  } catch (error: any) {
    console.error('Error deleting election reminder:', error);
    throw new Error('Failed to delete election reminder');
  }
}

/**
 * Get election reminders that need to be sent
 */
export async function getPendingReminders(): Promise<any[]> {
  try {
    const now = new Date();

    const reminders = await prisma.electionReminder.findMany({
      where: {
        sent: false,
        reminderDate: {
          lte: now,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return reminders;
  } catch (error: any) {
    console.error('Error fetching pending reminders:', error);
    throw new Error('Failed to fetch pending reminders');
  }
}

/**
 * Mark reminder as sent
 */
export async function markReminderAsSent(reminderId: string): Promise<void> {
  try {
    await prisma.electionReminder.update({
      where: { id: reminderId },
      data: {
        sent: true,
        sentAt: new Date(),
      },
    });
  } catch (error: any) {
    console.error('Error marking reminder as sent:', error);
    throw new Error('Failed to mark reminder as sent');
  }
}

/**
 * Generate ballot guide summary for export
 */
export async function generateBallotGuideSummary(
  previewId: string,
  userId: string
): Promise<any> {
  try {
    const preview = await getBallotPreviewById(previewId, userId);
    const ballotData = preview.ballotData as BallotPreviewData;

    // Get user's matches and notes for candidates in this election
    const contestCandidateNames = [
      ...ballotData.contests.federal,
      ...ballotData.contests.state,
      ...ballotData.contests.local,
      ...ballotData.contests.judicial,
    ].flatMap((contest) =>
      contest.candidates?.map((c: any) => c.name) || []
    );

    // Find matching candidates in our database
    const matchingCandidates = await prisma.candidate.findMany({
      where: {
        name: {
          in: contestCandidateNames,
        },
      },
      include: {
        stances: {
          include: {
            stance: true,
          },
        },
        savedBy: {
          where: {
            userId,
          },
        },
      },
    });

    // Get user's survey matches for these candidates
    const candidateIds = matchingCandidates.map((c) => c.id);
    const matches = await prisma.candidateMatch.findMany({
      where: {
        userId,
        candidateId: {
          in: candidateIds,
        },
      },
      orderBy: {
        matchScore: 'desc',
      },
    });

    return {
      preview,
      matchingCandidates,
      matches,
      summary: {
        totalRaces: Object.values(ballotData.contests).reduce(
          (sum, contests) => sum + contests.length,
          0
        ),
        federalRaces: ballotData.contests.federal.length,
        stateRaces: ballotData.contests.state.length,
        localRaces: ballotData.contests.local.length,
        judicialRaces: ballotData.contests.judicial.length,
        referendums: ballotData.contests.referendums.length,
      },
    };
  } catch (error: any) {
    console.error('Error generating ballot guide summary:', error);
    throw new Error('Failed to generate ballot guide summary');
  }
}

/**
 * Helper function to format address object into string
 */
function formatAddress(address: googleCivicAPI.Address): string {
  const parts = [
    address.line1,
    address.line2,
    address.line3,
    address.city,
    address.state,
    address.zip,
  ].filter(Boolean);

  return parts.join(', ');
}

export type { BallotPreviewData };
