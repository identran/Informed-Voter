import { apiClient } from './client';
import type { Candidate, CandidateSearchQuery, PaginatedResponse } from '@/types';

export const candidatesAPI = {
  search: (params: CandidateSearchQuery) => {
    const queryString = new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v !== undefined) as [string, string][]
    ).toString();
    return apiClient.get<PaginatedResponse<Candidate>>(`/candidates?${queryString}`);
  },

  getById: (id: string) => {
    return apiClient.get<{ success: boolean; data: Candidate }>(`/candidates/${id}`);
  },

  create: (data: Partial<Candidate>) => {
    return apiClient.post<{ success: boolean; data: Candidate }>('/candidates', data);
  },

  update: (id: string, data: Partial<Candidate>) => {
    return apiClient.put<{ success: boolean; data: Candidate }>(`/candidates/${id}`, data);
  },

  addStance: (candidateId: string, stanceId: string, position: string, sourceUrl?: string) => {
    return apiClient.post(`/candidates/${candidateId}/stances`, {
      stanceId,
      position,
      sourceUrl,
    });
  },

  updateStance: (candidateId: string, stanceId: string, position: string, sourceUrl?: string) => {
    return apiClient.put(`/candidates/${candidateId}/stances/${stanceId}`, {
      position,
      sourceUrl,
    });
  },
};
