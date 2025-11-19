export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  office: string;
  district?: string;
  state: string;
  city?: string;
  county?: string;
  electionDate?: Date;
  bio: string;
  goals: string;
  reasonForRunning: string;
  contactInfo?: string;
  verificationStatus: 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';
  verifiedAt?: Date;
  isIncumbent: boolean;
  bioguideId?: string;
  stateLegiId?: string;
  localGovId?: string;
  stances?: CandidateStance[];
  votingRecords?: VotingRecord[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Stance {
  id: string;
  category: string;
  title: string;
  description: string;
  order: number;
  isActive: boolean;
}

export interface CandidateStance {
  id: string;
  position: string;
  sourceUrl?: string;
  priority?: number;
  stance: Stance;
}

export interface Bill {
  id: string;
  billNumber: string;
  title: string;
  summary?: string;
  fullText?: string;
  chamber: 'HOUSE' | 'SENATE' | 'STATE_HOUSE' | 'STATE_SENATE' | 'CITY_COUNCIL' | 'COUNTY_BOARD' | 'OTHER';
  congress?: number;
  session?: string;
  legislativeBody: string;
  state?: string;
  introducedDate: Date;
  lastActionDate?: Date;
  status: 'INTRODUCED' | 'IN_COMMITTEE' | 'PASSED_CHAMBER' | 'PASSED_BOTH' | 'SENT_TO_EXECUTIVE' | 'SIGNED' | 'VETOED' | 'FAILED';
  sourceUrl: string;
  fullTextUrl?: string;
}

export interface VotingRecord {
  id: string;
  vote: 'YES' | 'NO' | 'ABSTAIN' | 'ABSENT' | 'PRESENT' | 'NOT_VOTING';
  voteDate: Date;
  rollCallNum?: string;
  sourceUrl: string;
  bill: Bill;
}

export interface StanceComparison {
  stance: Stance;
  statedPosition?: string;
  sourceUrl?: string;
  votes: {
    bill: Bill;
    vote: VotingRecord;
    relevance: number;
    notes?: string;
  }[];
}

export interface CandidateSearchQuery {
  zipCode?: string;
  city?: string;
  state?: string;
  county?: string;
  office?: string;
  district?: string;
  isIncumbent?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
