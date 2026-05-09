import { readTextFile, writeTextFile, exists, readDir } from '@tauri-apps/plugin-fs';
import { open, save, ask, message } from '@tauri-apps/plugin-dialog';
import { fetch } from '@tauri-apps/plugin-http';
import type { PlatformAPI, PlatformAdapter } from './types';

class TauriFileSystem implements PlatformAPI.FileSystem {
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
    return await exists(path);
  }
  
  async listFiles(directory?: string): Promise<any[]> {
    if (!directory) return [];
    
    const entries = await readDir(directory);
    return entries.map(entry => ({
      path: entry.path,
      name: entry.name,
      isDirectory: entry.isDirectory,
    }));
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

class TauriDialog implements PlatformAPI.Dialog {
  async openFile(options?: {
    multiple?: boolean;
    filters?: Array<{ name: string; extensions: string[] }>;
  }): Promise<string | string[] | null> {
    const result = await open({
      multiple: options?.multiple || false,
      filters: options?.filters || [
        { name: 'Markdown', extensions: ['md', 'markdown', 'txt'] },
      ],
    });
    
    return result;
  }
  
  async saveFile(options?: {
    defaultPath?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
  }): Promise<string | null> {
    const result = await save({
      defaultPath: options?.defaultPath,
      filters: options?.filters || [
        { name: 'Markdown', extensions: ['md', 'markdown'] },
      ],
    });
    
    return result;
  }
  
  async message(
    messageText: string,
    options?: { title?: string; type?: 'info' | 'warning' | 'error' }
  ): Promise<void> {
    await message(messageText, {
      title: options?.title,
      kind: options?.type || 'info',
    });
  }
  
  async ask(
    messageText: string,
    options?: { title?: string; type?: 'info' | 'warning' | 'error' }
  ): Promise<boolean> {
    return await ask(messageText, {
      title: options?.title,
      kind: options?.type || 'info',
    });
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

class TauriStorage implements PlatformAPI.Storage {
  private store: any;
  private initialized = false;
  
  async init(): Promise<void> {
    if (this.initialized) return;
    
    const { Store } = await import('@tauri-apps/plugin-store');
    this.store = new Store('moraya-settings.json');
    this.initialized = true;
  }
  
  async get<T = any>(key: string): Promise<T | null> {
    await this.init();
    return await this.store.get(key);
  }
  
  async set<T>(key: string, value: T): Promise<void> {
    await this.init();
    await this.store.set(key, value);
    await this.store.save();
  }
  
  async delete(key: string): Promise<void> {
    await this.init();
    await this.store.delete(key);
    await this.store.save();
  }
  
  async clear(): Promise<void> {
    await this.init();
    const entries = await this.store.entries();
    for (const [key] of entries) {
      await this.store.delete(key);
    }
    await this.store.save();
  }
  
  async list(): Promise<string[]> {
    await this.init();
    const entries = await this.store.entries();
    return entries.map(([key]) => key);
  }
}

class TauriHTTP implements PlatformAPI.HTTP {
  async fetch(url: string, options?: RequestInit): Promise<Response> {
    return await fetch(url, options);
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