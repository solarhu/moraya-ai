const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export class HttpClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.loadToken();
  }

  private loadToken(): void {
    this.token = localStorage.getItem('moraya_token');
  }

  setToken(token: string | null): void {
    this.token = token;
    if (token) {
      localStorage.setItem('moraya_token', token);
    } else {
      localStorage.removeItem('moraya_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    path: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      body?: any;
      headers?: Record<string, string>;
    } = {}
  ): Promise<ApiResponse<T>> {
    const { method = 'GET', body, headers = {} } = options;

    const url = `${this.baseUrl}${path}`;
    
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (this.token) {
      requestHeaders['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
          code: data.code,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async get<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: 'GET' });
  }

  async post<T>(path: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: 'POST', body });
  }

  async put<T>(path: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: 'PUT', body });
  }

  async delete<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: 'DELETE' });
  }
}

export const httpClient = new HttpClient();