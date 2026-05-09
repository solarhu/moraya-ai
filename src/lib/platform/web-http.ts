import type { HTTPAPI } from './types';

export class WebHTTP implements HTTPAPI {
  async fetch(url: string, options?: RequestInit): Promise<Response> {
    const defaultOptions: RequestInit = {
      mode: 'cors',
      credentials: 'omit',
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    try {
      const response = await fetch(url, mergedOptions);
      return response;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('CORS')) {
        throw new Error(`CORS error: ${url}. Consider using a CORS proxy or server-side proxy.`);
      }
      
      throw error;
    }
  }
  
  async fetchWithProxy(
    url: string,
    proxyUrl: string,
    options?: RequestInit
  ): Promise<Response> {
    const proxiedUrl = proxyUrl + url;
    return await this.fetch(proxiedUrl, options);
  }
  
  async stream(
    url: string,
    onChunk: (chunk: string) => void,
    options?: RequestInit
  ): Promise<void> {
    const response = await this.fetch(url, options);
    
    if (!response.body) {
      throw new Error('Response body is null');
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      onChunk(chunk);
    }
  }
}

export const webHTTP = new WebHTTP();