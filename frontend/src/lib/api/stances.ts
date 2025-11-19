import { apiClient } from './client';
import type { Stance } from '@/types';

export const stancesAPI = {
  getAll: () => {
    return apiClient.get<{ success: boolean; data: Stance[] }>('/stances');
  },

  getByCategory: (category: string) => {
    return apiClient.get<{ success: boolean; data: Stance[] }>(`/stances/category/${category}`);
  },

  getCategories: () => {
    return apiClient.get<{ success: boolean; data: { category: string; count: number }[] }>('/stances/categories');
  },
};
