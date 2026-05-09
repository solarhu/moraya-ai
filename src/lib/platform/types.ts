export interface FileSystemAPI {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  listFiles(directory?: string): Promise<any[]>;
  pickFile(): Promise<any | null>;
  downloadFile(path: string, content?: string): Promise<void>;
}

export interface DialogAPI {
  openFile(options?: {
    multiple?: boolean;
    filters?: Array<{ name: string; extensions: string[] }>;
  }): Promise<string | string[] | null>;
  saveFile(options?: {
    defaultPath?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
  }): Promise<string | null>;
  message(
    message: string,
    options?: { title?: string; type?: 'info' | 'warning' | 'error' }
  ): Promise<void>;
  ask(
    message: string,
    options?: { title?: string; type?: 'info' | 'warning' | 'error' }
  ): Promise<boolean>;
  confirm(
    message: string,
    options?: { title?: string; type?: 'info' | 'warning' | 'error' }
  ): Promise<boolean>;
}

export interface StorageAPI {
  get<T = any>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  list(): Promise<string[]>;
}

export interface HTTPAPI {
  fetch(url: string, options?: RequestInit): Promise<Response>;
  fetchWithProxy?(url: string, proxyUrl: string, options?: RequestInit): Promise<Response>;
  stream?(url: string, onChunk: (chunk: string) => void, options?: RequestInit): Promise<void>;
}

export interface PlatformAdapter {
  platform: 'tauri' | 'web';
  fs: FileSystemAPI;
  dialog: DialogAPI;
  storage: StorageAPI;
  http: HTTPAPI;
}

export type PlatformAPI = PlatformAdapter;