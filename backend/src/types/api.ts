import { Candidate, Stance, VotingRecord, Bill, User } from '@prisma/client';

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Candidate types
export interface CandidateWithRelations extends Candidate {
  stances?: CandidateStanceWithStance[];
  votingRecords?: VotingRecordWithBill[];
}

export interface CandidateStanceWithStance {
  id: string;
  position: string;
  sourceUrl?: string;
  priority?: number;
  stance: Stance;
}

export interface VotingRecordWithBill extends VotingRecord {
  bill: Bill;
}

// Search types
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

// Comparison types
export interface StanceComparison {
  stance: Stance;
  statedPosition?: string;
  votes: {
    bill: Bill;
    vote: string;
    voteDate: Date;
    alignment: 'consistent' | 'inconsistent' | 'unclear';
  }[];
  consistencyScore: number;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
  zipCode?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name?: string;
    role: string;
  };
}
