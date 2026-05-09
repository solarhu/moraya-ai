import type { PlatformAPI } from './types';

export class WebStorage implements PlatformAPI.Storage {
  private prefix = 'moraya:';
  
  async get<T = any>(key: string): Promise<T | null> {
    const fullKey = this.prefix + key;
    const value = localStorage.getItem(fullKey);
    
    if (value === null) {
      return null;
    }
    
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }
  
  async set<T>(key: string, value: T): Promise<void> {
    const fullKey = this.prefix + key;
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    
    localStorage.setItem(fullKey, serialized);
  }
  
  async delete(key: string): Promise<void> {
    const fullKey = this.prefix + key;
    localStorage.removeItem(fullKey);
  }
  
  async clear(): Promise<void> {
    // 只清除moraya:前缀的项
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
  
  async list(): Promise<string[]> {
    const keys: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keys.push(key.substring(this.prefix.length));
      }
    }
    
    return keys;
  }
  
  // IndexedDB存储（大文件）
  async getLarge<T = any>(key: string): Promise<T | null> {
    // 使用IndexedDB存储大数据
    // 后续实现
    return null;
  }
  
  async setLarge<T>(key: string, value: T): Promise<void> {
    // 使用IndexedDB存储大数据
    // 后续实现
  }
}

export const webStorage = new WebStorage();