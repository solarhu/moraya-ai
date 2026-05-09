export interface PlatformAPI {
  FileSystem: {
    readFile(path: string): Promise<string>;
    writeFile(path: string, content: string): Promise<void>;
    deleteFile(path: string): Promise<void>;
    exists(path: string): Promise<boolean>;
    listFiles(directory?: string): Promise<any[]>;
    pickFile(): Promise<any | null>;
    downloadFile(path: string, content?: string): Promise<void>;
  };
  
  Dialog: {
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
  };
  
  Storage: {
    get<T = any>(key: string): Promise<T | null>;
    set<T>(key: string, value: T): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
    list(): Promise<string[]>;
  };
  
  HTTP: {
    fetch(url: string, options?: RequestInit): Promise<Response>;
    fetchWithProxy?(url: string, options?: RequestInit, proxyUrl?: string): Promise<Response>;
    stream?(url: string, options?: RequestInit, onChunk: (chunk: string) => void): Promise<void>;
  };
}

export interface PlatformAdapter {
  platform: 'tauri' | 'web';
  fs: PlatformAPI.FileSystem;
  dialog: PlatformAPI.Dialog;
  storage: PlatformAPI.Storage;
  http: PlatformAPI.HTTP;
}