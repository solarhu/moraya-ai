import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import type { FileSystemAPI, DialogAPI, StorageAPI, HTTPAPI, PlatformAdapter } from './types';

class TauriFileSystem implements FileSystemAPI {
  async readFile(path: string): Promise<string> {
    return await readTextFile(path);
  }
  
  async writeFile(path: string, content: string): Promise<void> {
    await writeTextFile(path, content);
  }
  
  async deleteFile(path: string): Promise<void> {
    const { remove } = await import('@tauri-apps/plugin-fs');
    await remove(path);
  }
  
  async exists(path: string): Promise<boolean> {
    try {
      const { exists } = await import('@tauri-apps/plugin-fs');
      return await exists(path);
    } catch {
      return false;
    }
  }
  
  async listFiles(directory?: string): Promise<any[]> {
    if (!directory) return [];
    
    try {
      const { readDir } = await import('@tauri-apps/plugin-fs');
      const entries = await readDir(directory);
      return entries.map(entry => ({
        path: entry.name,
        name: entry.name,
        isDirectory: entry.isDirectory,
      }));
    } catch {
      return [];
    }
  }
  
  async pickFile(): Promise<any | null> {
    const result = await open({
      multiple: false,
      filters: [
        { name: 'Markdown', extensions: ['md', 'markdown', 'txt'] },
      ],
    });
    
    if (result) {
      return {
        path: result as string,
        name: (result as string).split('/').pop(),
      };
    }
    
    return null;
  }
  
  async downloadFile(path: string, content?: string): Promise<void> {
    // Tauri端不需要download，文件已在本地
    if (!content) {
      content = await this.readFile(path);
    }
    await this.writeFile(path, content);
  }
}

class TauriDialog implements DialogAPI {
  async openFile(options?: {
    multiple?: boolean;
    filters?: Array<{ name: string; extensions: string[] }>;
  }): Promise<string | string[] | null> {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const result = await open({
        multiple: options?.multiple || false,
        filters: options?.filters || [
          { name: 'Markdown', extensions: ['md', 'markdown', 'txt'] },
        ],
      });
      
      return result;
    } catch {
      return null;
    }
  }
  
  async saveFile(options?: {
    defaultPath?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
  }): Promise<string | null> {
    try {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const result = await save({
        defaultPath: options?.defaultPath,
        filters: options?.filters || [
          { name: 'Markdown', extensions: ['md', 'markdown'] },
        ],
      });
      
      return result;
    } catch {
      return null;
    }
  }
  
  async message(
    messageText: string,
    options?: { title?: string; type?: 'info' | 'warning' | 'error' }
  ): Promise<void> {
    try {
      const { message } = await import('@tauri-apps/plugin-dialog');
      await message(messageText, {
        title: options?.title,
        kind: options?.type || 'info',
      });
    } catch {
      // Fallback to console
      console.log(messageText);
    }
  }
  
  async ask(
    messageText: string,
    options?: { title?: string; type?: 'info' | 'warning' | 'error' }
  ): Promise<boolean> {
    try {
      const { ask } = await import('@tauri-apps/plugin-dialog');
      return await ask(messageText, {
        title: options?.title,
        kind: options?.type || 'info',
      });
    } catch {
      return false;
    }
  }
  
  async confirm(
    messageText: string,
    options?: { title?: string; type?: 'info' | 'warning' | 'error' }
  ): Promise<boolean> {
    return await ask(messageText, {
      title: options?.title,
      kind: options?.type || 'warning',
    });
  }
}

class TauriStorage implements StorageAPI {
  private store: any;
  private initialized = false;
  
  async init(): Promise<void> {
    if (this.initialized) return;
    
    try {
      const Store = (await import('@tauri-apps/plugin-store')).Store;
      this.store = new Store('moraya-settings.json');
      this.initialized = true;
    } catch {
      // Fallback to localStorage if Store not available
      console.warn('Tauri Store not available, using localStorage');
    }
  }
  
  async get<T = any>(key: string): Promise<T | null> {
    await this.init();
    
    if (this.store) {
      return await this.store.get(key);
    }
    
    // Fallback to localStorage
    const value = localStorage.getItem('moraya:' + key);
    return value ? JSON.parse(value) : null;
  }
  
  async set<T>(key: string, value: T): Promise<void> {
    await this.init();
    
    if (this.store) {
      await this.store.set(key, value);
      await this.store.save();
    } else {
      localStorage.setItem('moraya:' + key, JSON.stringify(value));
    }
  }
  
  async delete(key: string): Promise<void> {
    await this.init();
    
    if (this.store) {
      await this.store.delete(key);
      await this.store.save();
    } else {
      localStorage.removeItem('moraya:' + key);
    }
  }
  
  async clear(): Promise<void> {
    await this.init();
    
    if (this.store) {
      const entries = await this.store.entries();
      for (const [key] of entries) {
        await this.store.delete(key);
      }
      await this.store.save();
    } else {
      // Clear moraya: prefixed items
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('moraya:')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
  }
  
  async list(): Promise<string[]> {
    await this.init();
    
    if (this.store) {
      const entries = await this.store.entries();
      return entries.map(([key]) => key);
    } else {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('moraya:')) {
          keys.push(key.substring('moraya:'.length));
        }
      }
      return keys;
    }
  }
}

class TauriHTTP implements HTTPAPI {
  async fetch(url: string, options?: RequestInit): Promise<Response> {
    try {
      const { fetch } = await import('@tauri-apps/plugin-http');
      return await fetch(url, options);
    } catch {
      // Fallback to browser fetch
      return await window.fetch(url, options);
    }
  }
  
  async stream(
    url: string,
    options?: RequestInit,
    onChunk: (chunk: string) => void
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

export const tauriAdapter: PlatformAdapter = {
  platform: 'tauri',
  fs: new TauriFileSystem(),
  dialog: new TauriDialog(),
  storage: new TauriStorage(),
  http: new TauriHTTP(),
};