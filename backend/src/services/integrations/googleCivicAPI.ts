import axios from 'axios';

/**
 * Google Civic Information API Integration
 *
 * Provides voter information including:
 * - Election data
 * - Polling locations
 * - Ballot information
 * - Voter registration status
 * - Early voting locations
 *
 * API Docs: https://developers.google.com/civic-information
 */

const GOOGLE_CIVIC_API_KEY = process.env.GOOGLE_CIVIC_API_KEY || '';
const BASE_URL = 'https://www.googleapis.com/civicinfo/v2';

interface Address {
  line1?: string;
  line2?: string;
  line3?: string;
  city?: string;
  state?: string;
  zip?: string;
}

interface PollingLocation {
  address: Address;
  pollingHours?: string;
  name?: string;
  voterServices?: string;
  startDate?: string;
  endDate?: string;
  sources?: Array<{
    name: string;
    official: boolean;
  }>;
}

interface Contest {
  type: string;
  office: string;
  district?: {
    name: string;
    scope: string;
  };
  level?: string[];
  roles?: string[];
  candidates?: Array<{
    name: string;
    party?: string;
    candidateUrl?: string;
    channels?: Array<{
      type: string;
      id: string;
    }>;
  }>;
  referendumTitle?: string;
  referendumSubtitle?: string;
  referendumBrief?: string;
  referendumUrl?: string;
}

interface Election {
  id: string;
  name: string;
  electionDay: string;
  ocdDivisionId: string;
}

interface VoterInfoResponse {
  kind: string;
  election: Election;
  normalizedInput?: Address;
  pollingLocations?: PollingLocation[];
  earlyVoteSites?: PollingLocation[];
  dropOffLocations?: PollingLocation[];
  contests?: Contest[];
  state?: Array<{
    name: string;
    electionAdministrationBody?: {
      name?: string;
      electionInfoUrl?: string;
      electionRegistrationUrl?: string;
      electionRegistrationConfirmationUrl?: string;
      absenteeVotingInfoUrl?: string;
      votingLocationFinderUrl?: string;
      ballotInfoUrl?: string;
      correspondenceAddress?: Address;
    };
    local_jurisdiction?: {
      name: string;
      electionAdministrationBody?: any;
    };
  }>;
}

interface ElectionsResponse {
  kind: string;
  elections: Election[];
}

interface RepresentativesResponse {
  kind: string;
  normalizedInput?: Address;
  divisions: Record<string, {
    name: string;
    officeIndices?: number[];
  }>;
  offices: Array<{
    name: string;
    divisionId: string;
    levels?: string[];
    roles?: string[];
    officialIndices: number[];
  }>;
  officials: Array<{
    name: string;
    address?: Address[];
    party?: string;
    phones?: string[];
    urls?: string[];
    photoUrl?: string;
    channels?: Array<{
      type: string;
      id: string;
    }>;
  }>;
}

/**
 * Get list of available elections
 */
export async function getElections(): Promise<Election[]> {
  try {
    const response = await axios.get<ElectionsResponse>(
      `${BASE_URL}/elections`,
      {
        params: {
          key: GOOGLE_CIVIC_API_KEY,
        },
      }
    );

    return response.data.elections || [];
  } catch (error: any) {
    console.error('Error fetching elections from Google Civic API:', error);
    throw new Error('Failed to fetch elections');
  }
}

/**
 * Get voter information for a specific address and election
 *
 * @param address - Full address string or structured address
 * @param electionId - Optional election ID (defaults to upcoming election)
 * @param officialOnly - Only return official data (default: false)
 */
export async function getVoterInfo(
  address: string,
  electionId?: string,
  officialOnly: boolean = false
): Promise<VoterInfoResponse> {
  try {
    const params: any = {
      key: GOOGLE_CIVIC_API_KEY,
      address,
    };

    if (electionId) {
      params.electionId = electionId;
    }

    if (officialOnly) {
      params.officialOnly = 'true';
    }

    const response = await axios.get<VoterInfoResponse>(
      `${BASE_URL}/voterinfo`,
      { params }
    );

    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error('No voter information found for this address');
    }
    console.error('Error fetching voter info from Google Civic API:', error);
    throw new Error('Failed to fetch voter information');
  }
}

/**
 * Get representatives for a specific address
 *
 * @param address - Full address string
 * @param levels - Filter by government levels (e.g., 'country', 'administrativeArea1', 'locality')
 * @param roles - Filter by roles (e.g., 'legislatorUpperBody', 'legislatorLowerBody', 'headOfGovernment')
 */
export async function getRepresentatives(
  address: string,
  levels?: string[],
  roles?: string[]
): Promise<RepresentativesResponse> {
  try {
    const params: any = {
      key: GOOGLE_CIVIC_API_KEY,
      address,
    };

    if (levels && levels.length > 0) {
      params.levels = levels.join(',');
    }

    if (roles && roles.length > 0) {
      params.roles = roles.join(',');
    }

    const response = await axios.get<RepresentativesResponse>(
      `${BASE_URL}/representatives`,
      { params }
    );

    return response.data;
  } catch (error: any) {
    console.error('Error fetching representatives from Google Civic API:', error);
    throw new Error('Failed to fetch representatives');
  }
}

/**
 * Parse and extract polling location information
 */
export function extractPollingLocations(voterInfo: VoterInfoResponse): {
  pollingLocations: PollingLocation[];
  earlyVoteSites: PollingLocation[];
  dropOffLocations: PollingLocation[];
} {
  return {
    pollingLocations: voterInfo.pollingLocations || [],
    earlyVoteSites: voterInfo.earlyVoteSites || [],
    dropOffLocations: voterInfo.dropOffLocations || [],
  };
}

/**
 * Parse and extract election administration information
 */
export function extractElectionAdminInfo(voterInfo: VoterInfoResponse): {
  name?: string;
  electionInfoUrl?: string;
  registrationUrl?: string;
  registrationConfirmationUrl?: string;
  absenteeVotingUrl?: string;
  votingLocationFinderUrl?: string;
  ballotInfoUrl?: string;
} {
  const state = voterInfo.state?.[0];
  const admin = state?.electionAdministrationBody;

  if (!admin) {
    return {};
  }

  return {
    name: admin.name,
    electionInfoUrl: admin.electionInfoUrl,
    registrationUrl: admin.electionRegistrationUrl,
    registrationConfirmationUrl: admin.electionRegistrationConfirmationUrl,
    absenteeVotingUrl: admin.absenteeVotingInfoUrl,
    votingLocationFinderUrl: admin.votingLocationFinderUrl,
    ballotInfoUrl: admin.ballotInfoUrl,
  };
}

/**
 * Parse contests and separate by type
 */
export function categorizeContests(voterInfo: VoterInfoResponse): {
  federal: Contest[];
  state: Contest[];
  local: Contest[];
  judicial: Contest[];
  referendums: Contest[];
} {
  const contests = voterInfo.contests || [];

  const federal: Contest[] = [];
  const state: Contest[] = [];
  const local: Contest[] = [];
  const judicial: Contest[] = [];
  const referendums: Contest[] = [];

  contests.forEach((contest) => {
    // Referendums/ballot measures
    if (contest.referendumTitle) {
      referendums.push(contest);
      return;
    }

    // Judicial races
    if (contest.office.toLowerCase().includes('judge') ||
        contest.office.toLowerCase().includes('justice')) {
      judicial.push(contest);
      return;
    }

    // Federal races
    if (contest.level?.includes('country') ||
        contest.office.toLowerCase().includes('president') ||
        contest.office.toLowerCase().includes('u.s. senate') ||
        contest.office.toLowerCase().includes('u.s. house')) {
      federal.push(contest);
      return;
    }

    // State races
    if (contest.level?.includes('administrativeArea1') ||
        contest.office.toLowerCase().includes('governor') ||
        contest.office.toLowerCase().includes('state senate') ||
        contest.office.toLowerCase().includes('state house') ||
        contest.office.toLowerCase().includes('state assembly')) {
      state.push(contest);
      return;
    }

    // Everything else is local
    local.push(contest);
  });

  return {
    federal,
    state,
    local,
    judicial,
    referendums,
  };
}

/**
 * Check if Google Civic API is properly configured
 */
export function isConfigured(): boolean {
  return Boolean(GOOGLE_CIVIC_API_KEY);
}

/**
 * Validate address format
 */
export function validateAddress(address: string): boolean {
  // Basic validation - should have at least city and state or zip
  const hasZip = /\d{5}(-\d{4})?/.test(address);
  const hasState = /\b[A-Z]{2}\b/.test(address);

  return hasZip || hasState;
}

export type {
  Address,
  PollingLocation,
  Contest,
  Election,
  VoterInfoResponse,
  ElectionsResponse,
  RepresentativesResponse,
};
