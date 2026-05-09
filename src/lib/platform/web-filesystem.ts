import { openDB } from 'idb';
import type { IDBPDatabase } from 'idb';
import type { PlatformAPI } from './types';

const DB_NAME = 'moraya-web';
const FILE_STORE = 'files';
const META_STORE = 'meta';

interface FileMeta {
  path: string;
  name: string;
  size: number;
  lastModified: number;
  content?: string;
}

export class WebFileSystem implements PlatformAPI.FileSystem {
  private db: IDBPDatabase | null = null;
  private initialized = false;
  
  async init(): Promise<void> {
    if (this.initialized) return;
    
    this.db = await openDB(DB_NAME, 1, {
      upgrade(db) {
        // 创建文件存储
        if (!db.objectStoreNames.contains(FILE_STORE)) {
          db.createObjectStore(FILE_STORE, { keyPath: 'path' });
        }
        
        // 创建元数据存储
        if (!db.objectStoreNames.contains(META_STORE)) {
          db.createObjectStore(META_STORE);
        }
      },
    });
    
    this.initialized = true;
  }
  
  async readFile(path: string): Promise<string> {
    await this.init();
    
    // 尝试从IndexedDB读取
    const meta = await this.db!.get(FILE_STORE, path);
    if (meta?.content) {
      return meta.content;
    }
    
    throw new Error(`File not found: ${path}`);
  }
  
  async writeFile(path: string, content: string): Promise<void> {
    await this.init();
    
    const meta: FileMeta = {
      path,
      name: this.getFileName(path),
      size: content.length,
      lastModified: Date.now(),
      content,
    };
    
    await this.db!.put(FILE_STORE, meta);
  }
  
  async deleteFile(path: string): Promise<void> {
    await this.init();
    await this.db!.delete(FILE_STORE, path);
  }
  
  async exists(path: string): Promise<boolean> {
    await this.init();
    const meta = await this.db!.get(FILE_STORE, path);
    return !!meta;
  }
  
  async listFiles(directory?: string): Promise<FileMeta[]> {
    await this.init();
    
    const allFiles = await this.db!.getAll(FILE_STORE);
    
    if (directory) {
      return allFiles.filter(file => file.path.startsWith(directory));
    }
    
    return allFiles;
  }
  
  async pickFile(): Promise<FileMeta | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.md,.markdown,.txt';
      input.multiple = false;
      
      input.onchange = async (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (!files || files.length === 0) {
          resolve(null);
          return;
        }
        
        const file = files[0];
        const content = await file.text();
        
        const meta: FileMeta = {
          path: file.name,
          name: file.name,
          size: file.size,
          lastModified: file.lastModified,
          content,
        };
        
        // 保存到IndexedDB
        await this.writeFile(file.name, content);
        
        resolve(meta);
      };
      
      input.click();
    });
  }
  
  async downloadFile(path: string, content?: string): Promise<void> {
    // 获取内容（如果未提供）
    if (!content) {
      content = await this.readFile(path);
    }
    
    // 创建Blob并下载
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = this.getFileName(path);
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    
    // 清理
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }
  
  private getFileName(path: string): string {
    return path.split('/').pop() || path;
  }
}

export const webFileSystem = new WebFileSystem();