import { apiClient } from './client';
import type { VotingRecord, StanceComparison } from '@/types';

export const votingRecordsAPI = {
  getByCandidate: (candidateId: string) => {
    return apiClient.get<{ success: boolean; data: VotingRecord[] }>(
      `/voting-records/candidate/${candidateId}`
    );
  },

  getComparison: (candidateId: string, stanceId: string) => {
    return apiClient.get<{ success: boolean; data: StanceComparison }>(
      `/voting-records/comparison/${candidateId}/${stanceId}`
    );
  },

  getAllComparisons: (candidateId: string) => {
    return apiClient.get<{ success: boolean; data: StanceComparison[] }>(
      `/voting-records/comparison/${candidateId}`
    );
  },
};
