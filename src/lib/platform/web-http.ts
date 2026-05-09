import type { PlatformAPI } from './types';

export class WebHTTP implements PlatformAPI.HTTP {
  async fetch(url: string, options?: RequestInit): Promise<Response> {
    // Web端直接使用fetch
    // 注意CORS限制
    
    const defaultOptions: RequestInit = {
      mode: 'cors', // 跨域请求
      credentials: 'omit', // 不发送cookies
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    try {
      const response = await fetch(url, mergedOptions);
      return response;
    } catch (error) {
      // CORS错误处理
      if (error instanceof TypeError && error.message.includes('CORS')) {
        throw new Error(`CORS error: ${url}. Consider using a CORS proxy or server-side proxy.`);
      }
      
      throw error;
    }
  }
  
  async fetchWithProxy(
    url: string,
    options?: RequestInit,
    proxyUrl?: string
  ): Promise<Response> {
    // 使用CORS代理
    const proxy = proxyUrl || 'https://cors-anywhere.herokuapp.com/';
    const proxiedUrl = proxy + url;
    
    return await this.fetch(proxiedUrl, options);
  }
  
  async stream(
    url: string,
    options?: RequestInit,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    // 流式读取（AI对话等）
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