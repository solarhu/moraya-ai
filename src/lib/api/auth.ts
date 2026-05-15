import { httpClient } from './http-client';
import type { ApiResponse } from './http-client';

export interface User {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResult {
  user: User;
  token: string;
}

export const authApi = {
  async register(email: string, password: string): Promise<ApiResponse<AuthResult>> {
    const response = await httpClient.post<AuthResult>('/api/auth/register', {
      email,
      password,
    });

    if (response.success && response.data?.token) {
      httpClient.setToken(response.data.token);
    }

    return response as ApiResponse<AuthResult>;
  },

  async login(email: string, password: string): Promise<ApiResponse<AuthResult>> {
    const response = await httpClient.post<AuthResult>('/api/auth/login', {
      email,
      password,
    });

    if (response.success && response.data?.token) {
      httpClient.setToken(response.data.token);
    }

    return response as ApiResponse<AuthResult>;
  },

  async me(): Promise<ApiResponse<User>> {
    return httpClient.get<User>('/api/auth/me');
  },

  async verify(): Promise<ApiResponse<{ valid: boolean; user: any }>> {
    return httpClient.post<{ valid: boolean; user: any }>('/api/auth/verify');
  },

  logout(): void {
    httpClient.setToken(null);
  },

  isLoggedIn(): boolean {
    return httpClient.getToken() !== null;
  },
};