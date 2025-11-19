import { apiClient } from './client';

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

export const authAPI = {
  login: async (data: LoginRequest) => {
    const response = await apiClient.post<{ success: boolean; data: AuthResponse }>(
      '/auth/login',
      data
    );
    apiClient.setToken(response.data.token);
    return response;
  },

  register: async (data: RegisterRequest) => {
    const response = await apiClient.post<{ success: boolean; data: AuthResponse }>(
      '/auth/register',
      data
    );
    apiClient.setToken(response.data.token);
    return response;
  },

  logout: () => {
    apiClient.setToken(null);
  },

  getProfile: () => {
    return apiClient.get<{ success: boolean; data: any }>('/auth/profile');
  },
};
