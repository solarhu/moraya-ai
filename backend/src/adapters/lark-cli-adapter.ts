import { spawn, ChildProcess } from 'child_process';

export interface LarkDocument {
  id: string;
  title: string;
  url?: string;
  content?: string;
}

export interface LarkFile {
  token: string;
  name: string;
  type: string;
}

export interface LarkAuthResult {
  success: boolean;
  message: string;
  loginUrl?: string;
}

const LARK_CLI_PATH = process.env.LARK_CLI_PATH || '/home/admin/.npm-global/bin/lark-cli';

export class LarkCliAdapter {
  private processes: Map<string, ChildProcess> = new Map();

  async executeCommand(args: string[], timeout = 30000): Promise<{ stdout: string; stderr: string; code: number }> {
    return new Promise((resolve, reject) => {
      const proc = spawn(LARK_CLI_PATH, args, {
        env: { ...process.env, LANG: 'en_US.UTF-8' },
      });

      let stdout = '';
      let stderr = '';
      let timeoutId: NodeJS.Timeout | undefined;

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (timeoutId) clearTimeout(timeoutId);
        resolve({ stdout, stderr, code: code || 0 });
      });

      proc.on('error', (err) => {
        if (timeoutId) clearTimeout(timeoutId);
        reject(err);
      });

      timeoutId = setTimeout(() => {
        proc.kill();
        reject(new Error(`Command timeout after ${timeout}ms`));
      }, timeout);
    });
  }

  async checkLarkCliInstalled(): Promise<boolean> {
    try {
      const result = await this.executeCommand(['--version']);
      return result.code === 0;
    } catch {
      return false;
    }
  }

  async checkAuthStatus(): Promise<{ authenticated: boolean; userName?: string; expiresAt?: string }> {
    try {
      const result = await this.executeCommand(['auth', 'status']);
      
      if (result.code !== 0) {
        return { authenticated: false };
      }

      try {
        const data = JSON.parse(result.stdout);
        return {
          authenticated: !!data.tokenStatus,
          userName: data.userName,
          expiresAt: data.expiresAt,
        };
      } catch {
        return { authenticated: false };
      }
    } catch {
      return { authenticated: false };
    }
  }

  async startAuth(): Promise<LarkAuthResult> {
    const installed = await this.checkLarkCliInstalled();
    if (!installed) {
      return {
        success: false,
        message: 'lark-cli is not installed. Please install it first.',
      };
    }

    return new Promise((resolve) => {
      const proc = spawn(LARK_CLI_PATH, ['auth', 'login', '--domain', 'all'], {
        env: { ...process.env, LANG: 'en_US.UTF-8' },
      });

      this.processes.set('auth', proc);

      let output = '';

      proc.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;

        const urlMatch = text.match(/https:\/\/[^\s]+/);
        if (urlMatch) {
          resolve({
            success: true,
            message: 'Please visit the URL to complete authentication',
            loginUrl: urlMatch[0],
          });
        }
      });

      proc.stderr.on('data', (data) => {
        output += data.toString();
      });

      proc.on('close', (code) => {
        this.processes.delete('auth');

        if (code === 0) {
          resolve({
            success: true,
            message: 'Authentication successful',
          });
        } else {
          resolve({
            success: false,
            message: `Authentication failed: ${output}`,
          });
        }
      });

      proc.on('error', (err) => {
        this.processes.delete('auth');
        resolve({
          success: false,
          message: `Failed to start auth process: ${err.message}`,
        });
      });

      setTimeout(() => {
        if (this.processes.has('auth')) {
          proc.kill();
          resolve({
            success: false,
            message: 'Authentication timeout',
          });
        }
      }, 300000);
    });
  }

  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.executeCommand(['auth', 'logout']);
      return {
        success: result.code === 0,
        message: result.code === 0 ? 'Logged out successfully' : `Logout failed: ${result.stderr}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Logout error: ${error}`,
      };
    }
  }

  async createDocument(title: string, markdown: string, folderToken?: string): Promise<LarkDocument> {
    const args = ['docs', '+create', '--title', title, '--markdown', markdown];
    
    if (folderToken) {
      args.push('--folder-token', folderToken);
    }

    const result = await this.executeCommand(args, 60000);
    
    if (result.code !== 0) {
      throw new Error(`Failed to create document: ${result.stderr || result.stdout}`);
    }

    try {
      const data = JSON.parse(result.stdout);
      return {
        id: data.data.doc_id,
        title: title,
        url: data.data.doc_url,
      };
    } catch {
      throw new Error(`Failed to parse create response: ${result.stdout}`);
    }
  }

  async fetchDocument(docToken: string): Promise<LarkDocument> {
    const result = await this.executeCommand(['docs', '+fetch', '--doc', docToken]);
    
    if (result.code !== 0) {
      throw new Error(`Failed to fetch document: ${result.stderr || result.stdout}`);
    }

    try {
      const data = JSON.parse(result.stdout);
      return {
        id: data.data.doc_id,
        title: data.data.title,
        content: data.data.markdown,
      };
    } catch {
      throw new Error(`Failed to parse fetch response: ${result.stdout}`);
    }
  }

  async updateDocument(docToken: string, markdown: string, mode = 'overwrite'): Promise<boolean> {
    const result = await this.executeCommand([
      'docs', '+update',
      '--doc', docToken,
      '--mode', mode,
      '--markdown', markdown,
    ], 60000);
    
    if (result.code !== 0) {
      throw new Error(`Failed to update document: ${result.stderr || result.stdout}`);
    }

    try {
      const data = JSON.parse(result.stdout);
      return data.ok === true;
    } catch {
      return false;
    }
  }

  async deleteDocument(docToken: string, type = 'docx'): Promise<boolean> {
    const result = await this.executeCommand([
      'drive', '+delete',
      '--file-token', docToken,
      '--type', type,
      '--yes',
    ]);
    
    if (result.code !== 0) {
      throw new Error(`Failed to delete document: ${result.stderr || result.stdout}`);
    }

    try {
      const data = JSON.parse(result.stdout);
      return data.data.deleted === true;
    } catch {
      return false;
    }
  }

  async searchDocuments(query: string): Promise<LarkDocument[]> {
    const result = await this.executeCommand(['docs', '+search', '--query', query]);
    
    if (result.code !== 0) {
      throw new Error(`Failed to search documents: ${result.stderr || result.stdout}`);
    }

    try {
      const data = JSON.parse(result.stdout);
      return data.data.results.map((item: any) => ({
        id: item.doc_info?.token || '',
        title: item.doc_info?.name || '',
      }));
    } catch {
      return [];
    }
  }

  async uploadFile(filePath: string, folderToken?: string): Promise<LarkFile> {
    const args = ['drive', '+upload', '--file', filePath];
    
    if (folderToken) {
      args.push('--folder-token', folderToken);
    }

    const result = await this.executeCommand(args, 120000);
    
    if (result.code !== 0) {
      throw new Error(`Failed to upload file: ${result.stderr || result.stdout}`);
    }

    try {
      const data = JSON.parse(result.stdout);
      return {
        token: data.data.file_token,
        name: data.data.name,
        type: data.data.type,
      };
    } catch {
      throw new Error(`Failed to parse upload response: ${result.stdout}`);
    }
  }

  async downloadFile(fileToken: string, outputPath: string): Promise<boolean> {
    const result = await this.executeCommand([
      'drive', '+download',
      '--file-token', fileToken,
      '--output', outputPath,
    ], 120000);
    
    return result.code === 0;
  }
}

export const larkCliAdapter = new LarkCliAdapter();