import type { PlatformAPI } from './types';

export class WebDialog implements PlatformAPI.Dialog {
  async openFile(options?: {
    multiple?: boolean;
    filters?: Array<{ name: string; extensions: string[] }>;
  }): Promise<string | string[] | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = this.getAcceptString(options?.filters);
      input.multiple = options?.multiple || false;
      
      input.onchange = async (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (!files || files.length === 0) {
          resolve(null);
          return;
        }
        
        // Web端返回文件名数组
        const paths = Array.from(files).map(file => file.name);
        
        if (options?.multiple) {
          resolve(paths);
        } else {
          resolve(paths[0]);
        }
      };
      
      input.click();
    });
  }
  
  async saveFile(options?: {
    defaultPath?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
  }): Promise<string | null> {
    // Web端无法真正选择保存路径
    // 返回默认文件名，实际保存时使用downloadFile
    return options?.defaultPath || 'untitled.md';
  }
  
  async message(
    message: string,
    options?: { title?: string; type?: 'info' | 'warning' | 'error' }
  ): Promise<void> {
    // 使用浏览器alert
    alert(message);
  }
  
  async ask(
    message: string,
    options?: { title?: string; type?: 'info' | 'warning' | 'error' }
  ): Promise<boolean> {
    // 使用浏览器confirm
    return window.confirm(message);
  }
  
  async confirm(
    message: string,
    options?: { title?: string; type?: 'info' | 'warning' | 'error' }
  ): Promise<boolean> {
    return window.confirm(message);
  }
  
  private getAcceptString(filters?: Array<{ name: string; extensions: string[] }>): string {
    if (!filters || filters.length === 0) {
      return '.md,.markdown,.txt';
    }
    
    const extensions = filters.flatMap(f => f.extensions.map(ext => `.${ext}`));
    return extensions.join(',');
  }
}

export const webDialog = new WebDialog();