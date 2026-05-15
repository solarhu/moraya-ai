import { httpClient } from './http-client';
import type { ApiResponse } from './http-client';

export interface CloudStatus {
  larkCliInstalled: boolean;
  larkAuthenticated: boolean;
  userName?: string;
  expiresAt?: string;
}

export interface LarkDocument {
  id: string;
  title: string;
  url?: string;
  content?: string;
}

export interface LarkAuthResult {
  loginUrl?: string;
  message: string;
}

export const cloudApi = {
  async getStatus(): Promise<ApiResponse<CloudStatus>> {
    return httpClient.get<CloudStatus>('/api/cloud/status');
  },

  async startLarkAuth(): Promise<ApiResponse<LarkAuthResult>> {
    return httpClient.post<LarkAuthResult>('/api/cloud/lark/auth');
  },

  async getLarkAuthStatus(): Promise<ApiResponse<{ authenticated: boolean; userName?: string; expiresAt?: string }>> {
    return httpClient.get<{ authenticated: boolean; userName?: string; expiresAt?: string }>('/api/cloud/lark/auth/status');
  },

  async logoutLark(): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return httpClient.post<{ success: boolean; message: string }>('/api/cloud/lark/auth/logout');
  },

  async createDocument(title: string, content: string, folderToken?: string): Promise<ApiResponse<LarkDocument>> {
    return httpClient.post<LarkDocument>('/api/cloud/lark/documents', {
      title,
      content,
      folderToken,
    });
  },

  async fetchDocument(docToken: string): Promise<ApiResponse<LarkDocument>> {
    return httpClient.get<LarkDocument>(`/api/cloud/lark/documents/${docToken}`);
  },

  async updateDocument(docToken: string, content: string, mode?: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return httpClient.put<{ success: boolean; message: string }>(`/api/cloud/lark/documents/${docToken}`, {
      content,
      mode,
    });
  },

  async deleteDocument(docToken: string, type?: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    const typeParam = type ? `?type=${type}` : '';
    return httpClient.delete<{ success: boolean; message: string }>(`/api/cloud/lark/documents/${docToken}${typeParam}`);
  },

  async searchDocuments(query: string): Promise<ApiResponse<{ documents: LarkDocument[] }>> {
    return httpClient.get<{ documents: LarkDocument[] }>(`/api/cloud/lark/search?query=${encodeURIComponent(query)}`);
  },

  async uploadFile(filePath: string, folderToken?: string): Promise<ApiResponse<{ token: string; name: string; type: string }>> {
    return httpClient.post<{ token: string; name: string; type: string }>('/api/cloud/lark/files/upload', {
      filePath,
      folderToken,
    });
  },

  async downloadFile(fileToken: string, outputPath: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return httpClient.post<{ success: boolean; message: string }>('/api/cloud/lark/files/download', {
      fileToken,
      outputPath,
    });
  },
};