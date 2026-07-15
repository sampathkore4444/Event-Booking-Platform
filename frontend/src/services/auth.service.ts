import { apiClient } from './api';
import type { User, LoginRequest, RegisterRequest, TokenResponse, UserUpdate } from '../types';

const TOKEN_KEYS = {
  ACCESS: 'access_token',
  REFRESH: 'refresh_token',
  USER: 'current_user',
} as const;

class AuthService {
  // Token management
  getAccessToken(): string | null {
    return localStorage.getItem(TOKEN_KEYS.ACCESS);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(TOKEN_KEYS.REFRESH);
  }

  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(TOKEN_KEYS.ACCESS, accessToken);
    localStorage.setItem(TOKEN_KEYS.REFRESH, refreshToken);
  }

  clearTokens(): void {
    localStorage.removeItem(TOKEN_KEYS.ACCESS);
    localStorage.removeItem(TOKEN_KEYS.REFRESH);
    localStorage.removeItem(TOKEN_KEYS.USER);
  }

  // User data
  setCurrentUser(user: User): void {
    localStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(user));
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem(TOKEN_KEYS.USER);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      this.clearTokens();
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  // API calls
  async login(data: LoginRequest): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>('/auth/login', data);
    this.setTokens(response.access_token, response.refresh_token);

    // Fetch and store user data
    const user = await this.getProfile();
    this.setCurrentUser(user);

    return response;
  }

  async register(data: RegisterRequest): Promise<User> {
    const user = await apiClient.post<User>('/auth/register', data);
    return user;
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore errors on logout
    } finally {
      this.clearTokens();
    }
  }

  async refreshToken(): Promise<TokenResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<TokenResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    this.setTokens(response.access_token, response.refresh_token);
    return response;
  }

  async getProfile(): Promise<User> {
    return apiClient.get<User>('/auth/me');
  }

  async updateProfile(data: UserUpdate): Promise<User> {
    const user = await apiClient.put<User>('/users/me', data);
    this.setCurrentUser(user);
    return user;
  }
}

export const authService = new AuthService();
