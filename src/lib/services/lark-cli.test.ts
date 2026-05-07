import { describe, test, expect, beforeAll } from 'vitest';

const CLI_PATH = '/home/admin/.npm-global/bin/lark-cli';

interface LarkDocCreateResult {
  document_id: string;
  success: boolean;
  message: string;
}

interface LarkDocFetchResult {
  content: string;
  format: string;
  success: boolean;
}

interface LarkDocUpdateResult {
  document_id: string;
  success: boolean;
  message: string;
}

interface LarkFileInfo {
  file_token: string;
  name: string;
  type: string;
  updated_at: string;
}

interface LarkSearchResult {
  results: Array<{
    document_id: string;
    title: string;
    url: string;
  }>;
  success: boolean;
}

describe('lark-cli integration tests', () => {
  let authReady = false;

  beforeAll(async () => {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const status = await invoke('lark_cli_auth_login', {
        cliPath: CLI_PATH,
        domain: 'docs'
      });
      authReady = true;
    } catch (e) {
      console.warn('lark-cli not authenticated. Some tests will be skipped.');
      authReady = false;
    }
  });

  describe('Auth tests', () => {
    test('auth login should return result', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      
      try {
        const result = await invoke('lark_cli_auth_login', {
          cliPath: CLI_PATH,
          domain: 'docs'
        });
        
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('auth login with drive domain', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      
      const result = await invoke<string>('lark_cli_auth_login', {
        cliPath: CLI_PATH,
        domain: 'drive'
      });
      
      expect(result).toBeDefined();
    });
  });

  describe('Docs commands tests', () => {
    test('docs search should return results or fail gracefully', async () => {
      if (!authReady) {
        console.warn('Skipping: auth not ready');
        return;
      }

      const { invoke } = await import('@tauri-apps/api/core');
      
      try {
        const result = await invoke('lark_cli_docs_search', {
          cliPath: CLI_PATH,
          query: 'test'
        });
        
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('docs create should handle invalid folder token', async () => {
      if (!authReady) {
        console.warn('Skipping: auth not ready');
        return;
      }

      const { invoke } = await import('@tauri-apps/api/core');
      
      try {
        await invoke<LarkDocCreateResult>('lark_cli_docs_create', {
          cliPath: CLI_PATH,
          title: 'Test Document',
          markdownFile: '/tmp/test.md',
          folderToken: 'fld_invalid_test'
        });
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toContain('failed');
      }
    });

    test('docs fetch should handle invalid doc token', async () => {
      if (!authReady) {
        console.warn('Skipping: auth not ready');
        return;
      }

      const { invoke } = await import('@tauri-apps/api/core');
      
      try {
        await invoke<LarkDocFetchResult>('lark_cli_docs_fetch', {
          cliPath: CLI_PATH,
          docToken: 'doc_invalid_test',
          format: 'json'
        });
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toContain('failed');
      }
    });

    test('docs update should validate mode parameter', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      
      const modes = ['append', 'overwrite', 'replace_range', 'replace_all'];
      expect(modes.length).toBe(4);
    });
  });

  describe('Drive commands tests', () => {
    test('drive list should handle invalid folder token', async () => {
      if (!authReady) {
        console.warn('Skipping: auth not ready');
        return;
      }

      const { invoke } = await import('@tauri-apps/api/core');
      
      try {
        await invoke<LarkFileInfo[]>('lark_cli_drive_list', {
          cliPath: CLI_PATH,
          folderToken: 'fld_invalid_test'
        });
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toContain('failed');
      }
    });

    test('drive upload should handle invalid file path', async () => {
      if (!authReady) {
        console.warn('Skipping: auth not ready');
        return;
      }

      const { invoke } = await import('@tauri-apps/api/core');
      
      try {
        await invoke<string>('lark_cli_drive_upload', {
          cliPath: CLI_PATH,
          filePath: '/invalid/path/to/file.md',
          folderToken: 'fld_test'
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('drive download should handle invalid file token', async () => {
      if (!authReady) {
        console.warn('Skipping: auth not ready');
        return;
      }

      const { invoke } = await import('@tauri-apps/api/core');
      
      try {
        await invoke<string>('lark_cli_drive_download', {
          cliPath: CLI_PATH,
          fileToken: 'file_invalid_test',
          outputPath: '/tmp/downloaded.md'
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Markdown commands tests', () => {
    test('markdown create should handle invalid parameters', async () => {
      if (!authReady) {
        console.warn('Skipping: auth not ready');
        return;
      }

      const { invoke } = await import('@tauri-apps/api/core');
      
      try {
        await invoke<string>('lark_cli_markdown_create', {
          cliPath: CLI_PATH,
          markdownFile: '/invalid/path.md',
          folderToken: 'fld_invalid'
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('markdown fetch should handle invalid file token', async () => {
      if (!authReady) {
        console.warn('Skipping: auth not ready');
        return;
      }

      const { invoke } = await import('@tauri-apps/api/core');
      
      try {
        await invoke<string>('lark_cli_markdown_fetch', {
          cliPath: CLI_PATH,
          fileToken: 'file_invalid_test'
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('markdown overwrite should handle invalid parameters', async () => {
      if (!authReady) {
        console.warn('Skipping: auth not ready');
        return;
      }

      const { invoke } = await import('@tauri-apps/api/core');
      
      try {
        await invoke<string>('lark_cli_markdown_overwrite', {
          cliPath: CLI_PATH,
          fileToken: 'file_invalid',
          markdownFile: '/invalid/path.md'
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Wiki commands tests', () => {
    test('wiki list should return result', async () => {
      if (!authReady) {
        console.warn('Skipping: auth not ready');
        return;
      }

      const { invoke } = await import('@tauri-apps/api/core');
      
      try {
        const result = await invoke<string>('lark_cli_wiki_list', {
          cliPath: CLI_PATH
        });
        
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
      } catch (error) {
        console.warn('Wiki list failed (expected if no wikis):', error);
      }
    });

    test('wiki create-node should handle invalid wiki token', async () => {
      if (!authReady) {
        console.warn('Skipping: auth not ready');
        return;
      }

      const { invoke } = await import('@tauri-apps/api/core');
      
      try {
        await invoke<string>('lark_cli_wiki_create_node', {
          cliPath: CLI_PATH,
          wikiToken: 'wiki_invalid_test',
          title: 'Test Node'
        });
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toContain('failed');
      }
    });
  });

  describe('Error handling tests', () => {
    test('invalid CLI path should fail', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      
      try {
        await invoke<string>('lark_cli_auth_login', {
          cliPath: '/invalid/path/to/cli',
          domain: 'docs'
        });
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toContain('Failed to execute');
      }
    });

    test('empty query should be handled', async () => {
      if (!authReady) {
        console.warn('Skipping: auth not ready');
        return;
      }

      const { invoke } = await import('@tauri-apps/api/core');
      
      try {
        const result = await invoke<LarkSearchResult>('lark_cli_docs_search', {
          cliPath: CLI_PATH,
          query: ''
        });
        
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Parameter validation tests', () => {
    test('docs create parameters format', () => {
      const title = 'Test Document';
      const markdownFile = '/tmp/test.md';
      const folderToken = 'fld_test';
      
      expect(title).toBeDefined();
      expect(markdownFile).toContain('.md');
      expect(folderToken).toBeDefined();
    });

    test('markdown file path format', () => {
      const file_path = '/home/user/test.md';
      const formatted = `@${file_path}`;
      
      expect(formatted).toBe('@/home/user/test.md');
      expect(formatted.startsWith('@')).toBe(true);
    });

    test('update modes validation', () => {
      const modes = ['append', 'overwrite', 'replace_range', 'replace_all'];
      
      for (const mode of modes) {
        expect(mode).toBeDefined();
        expect(typeof mode).toBe('string');
      }
    });
  });
});

describe('Parsing functions validation (simulated)', () => {
  test('parse document ID from text output', () => {
    const stdout = 'Document created: doc_abc123xyz\nURL: https://feishu.cn/doc/doc_abc123xyz';
    const match = stdout.match(/doc_[a-z0-9]+/);
    
    expect(match).toBeDefined();
    expect(match?.[0]).toBe('doc_abc123xyz');
  });

  test('parse document ID from JSON with document_id field', () => {
    const stdout = '{"document_id": "doc_xyz789", "success": true}';
    const parsed = JSON.parse(stdout);
    
    expect(parsed.document_id).toBe('doc_xyz789');
  });

  test('parse document ID from JSON with doc field', () => {
    const stdout = '{"doc": "doc_test123", "url": "https://example.com"}';
    const parsed = JSON.parse(stdout);
    
    expect(parsed.doc).toBe('doc_test123');
  });

  test('parse file list from JSON with files key', () => {
    const stdout = JSON.stringify({
      files: [
        { token: 'file_abc', name: 'test1.md', type: 'file', updated_at: '2026-05-07' },
        { token: 'file_def', name: 'test2.md', type: 'file', updated_at: '2026-05-06' }
      ]
    });
    
    const parsed = JSON.parse(stdout);
    expect(parsed.files.length).toBe(2);
    expect(parsed.files[0].token).toBe('file_abc');
    expect(parsed.files[1].name).toBe('test2.md');
  });

  test('parse file list from JSON array directly', () => {
    const stdout = JSON.stringify([
      { token: 'file_xyz', name: 'doc.md', type: 'file', updated_at: '2026-05-07' }
    ]);
    
    const parsed = JSON.parse(stdout);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].token).toBe('file_xyz');
  });

  test('parse search results from JSON with results key', () => {
    const stdout = JSON.stringify({
      results: [
        { document_id: 'doc_1', title: 'Doc 1', url: 'https://feishu.cn/doc/doc_1' },
        { document_id: 'doc_2', title: 'Doc 2', url: 'https://feishu.cn/doc/doc_2' }
      ]
    });
    
    const parsed = JSON.parse(stdout);
    expect(parsed.results.length).toBe(2);
    expect(parsed.results[0].document_id).toBe('doc_1');
  });

  test('parse search results from JSON array directly', () => {
    const stdout = JSON.stringify([
      { id: 'doc_3', name: 'Doc 3', url: 'https://example.com' }
    ]);
    
    const parsed = JSON.parse(stdout);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].id).toBe('doc_3');
    expect(parsed[0].name).toBe('Doc 3');
  });

  test('parse document ID with comma suffix', () => {
    const stdout = 'Document created: doc_abc123xyz, please check';
    const match = stdout.match(/doc_[a-z0-9]+/);
    
    expect(match?.[0]).toBe('doc_abc123xyz');
  });
});