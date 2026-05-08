import { describe, test, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import {
  larkSyncStore,
  authenticateLarkCli,
  scanKbFiles,
  syncFileToLark,
  fetchFileFromLark,
  listLarkFiles,
  triggerSync,
  firstSyncUpload,
  firstSyncDownload,
} from './sync-service';
import type { LarkCliConfig } from './types';

// Mock invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

// Mock files-store
vi.mock('$lib/stores/files-store', () => ({
  filesStore: {
    getState: vi.fn(() => ({
      knowledgeBases: [
        { id: 'kb-1', name: 'Test KB', path: '/tmp/test-kb' }
      ]
    }))
  }
}));

describe('larkSyncStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('initial state should be empty', () => {
    const state = get(larkSyncStore);
    expect(state.bindings.size).toBe(0);
  });

  test('addBinding should add new binding', () => {
    const config: LarkCliConfig = {
      cliPath: '/usr/local/bin/lark-cli',
      folderToken: 'fld_test',
      syncMode: 'markdown',
      autoSync: false,
    };

    larkSyncStore.addBinding('kb-1', config);

    const state = get(larkSyncStore);
    const binding = state.bindings.get('kb-1');

    expect(binding).toBeDefined();
    expect(binding?.localKbId).toBe('kb-1');
    expect(binding?.config.cliPath).toBe('/usr/local/bin/lark-cli');
    expect(binding?.status).toBe('idle');
    expect(binding?.syncedFiles).toBe(0);
    expect(binding?.pendingFiles).toBe(0);
  });

  test('removeBinding should remove binding', () => {
    const config: LarkCliConfig = {
      cliPath: '/usr/local/bin/lark-cli',
      folderToken: 'fld_test',
      syncMode: 'markdown',
      autoSync: false,
    };

    larkSyncStore.addBinding('kb-1', config);
    larkSyncStore.removeBinding('kb-1');

    const state = get(larkSyncStore);
    expect(state.bindings.size).toBe(0);
  });

  test('updateBinding should update binding status', () => {
    const config: LarkCliConfig = {
      cliPath: '/usr/local/bin/lark-cli',
      folderToken: 'fld_test',
      syncMode: 'markdown',
      autoSync: false,
    };

    larkSyncStore.addBinding('kb-1', config);
    larkSyncStore.updateBinding('kb-1', { status: 'syncing' });

    const binding = larkSyncStore.getBinding('kb-1');
    expect(binding?.status).toBe('syncing');
  });

  test('updateBinding should update syncedFiles count', () => {
    const config: LarkCliConfig = {
      cliPath: '/usr/local/bin/lark-cli',
      folderToken: 'fld_test',
      syncMode: 'markdown',
      autoSync: false,
    };

    larkSyncStore.addBinding('kb-1', config);
    larkSyncStore.updateBinding('kb-1', { syncedFiles: 10, status: 'success' });

    const binding = larkSyncStore.getBinding('kb-1');
    expect(binding?.syncedFiles).toBe(10);
    expect(binding?.status).toBe('success');
  });

  test('getBinding should return undefined for non-existent binding', () => {
    const binding = larkSyncStore.getBinding('non-existent');
    expect(binding).toBeUndefined();
  });
});

describe('authenticateLarkCli', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should return true on successful auth', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    vi.mocked(invoke).mockResolvedValueOnce('Authentication successful');

    const config: LarkCliConfig = {
      cliPath: '/usr/local/bin/lark-cli',
      folderToken: 'fld_test',
      syncMode: 'docs',
      autoSync: false,
    };

    const result = await authenticateLarkCli(config);
    expect(result).toBe(true);
    expect(invoke).toHaveBeenCalledWith('lark_cli_auth_login', {
      cliPath: config.cliPath,
      domain: config.syncMode,
    });
  });

  test('should return false on failed auth', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    vi.mocked(invoke).mockRejectedValueOnce(new Error('Auth failed'));

    const config: LarkCliConfig = {
      cliPath: '/usr/local/bin/lark-cli',
      folderToken: 'fld_test',
      syncMode: 'docs',
      autoSync: false,
    };

    const result = await authenticateLarkCli(config);
    expect(result).toBe(false);
  });
});

describe('scanKbFiles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should return file list on success', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    const mockFiles = ['/tmp/test.md', '/tmp/test2.md'];
    vi.mocked(invoke).mockResolvedValueOnce(mockFiles);

    const result = await scanKbFiles('/tmp/test-kb');
    expect(result).toEqual(mockFiles);
    expect(invoke).toHaveBeenCalledWith('kb_scan_files', {
      kbPath: '/tmp/test-kb',
    });
  });

  test('should return empty array on error', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    vi.mocked(invoke).mockRejectedValueOnce(new Error('Scan failed'));

    const result = await scanKbFiles('/tmp/test-kb');
    expect(result).toEqual([]);
  });
});

describe('syncFileToLark', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should sync file with docs mode', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    vi.mocked(invoke).mockResolvedValueOnce({
      document_id: 'doc_test123',
      success: true,
    });

    const config: LarkCliConfig = {
      cliPath: '/usr/local/bin/lark-cli',
      folderToken: 'fld_test',
      syncMode: 'docs',
      autoSync: false,
    };

    const result = await syncFileToLark('/tmp/test.md', config);
    expect(result.success).toBe(true);
    expect(result.documentId).toBe('doc_test123');
    expect(invoke).toHaveBeenCalledWith('lark_cli_docs_create', {
      cliPath: config.cliPath,
      title: 'test',
      markdownFile: '/tmp/test.md',
      folderToken: config.folderToken,
    });
  });

  test('should sync file with markdown mode', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    vi.mocked(invoke).mockResolvedValueOnce('File created');

    const config: LarkCliConfig = {
      cliPath: '/usr/local/bin/lark-cli',
      folderToken: 'fld_test',
      syncMode: 'markdown',
      autoSync: false,
    };

    const result = await syncFileToLark('/tmp/test.md', config);
    expect(result.success).toBe(true);
    expect(invoke).toHaveBeenCalledWith('lark_cli_markdown_create', {
      cliPath: config.cliPath,
      markdownFile: '/tmp/test.md',
      folderToken: config.folderToken,
    });
  });

  test('should sync file with drive mode', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    vi.mocked(invoke).mockResolvedValueOnce('File uploaded');

    const config: LarkCliConfig = {
      cliPath: '/usr/local/bin/lark-cli',
      folderToken: 'fld_test',
      syncMode: 'drive',
      autoSync: false,
    };

    const result = await syncFileToLark('/tmp/test.md', config);
    expect(result.success).toBe(true);
    expect(invoke).toHaveBeenCalledWith('lark_cli_drive_upload', {
      cliPath: config.cliPath,
      filePath: '/tmp/test.md',
      folderToken: config.folderToken,
    });
  });

  test('should return error on sync failure', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    vi.mocked(invoke).mockRejectedValueOnce(new Error('Sync failed'));

    const config: LarkCliConfig = {
      cliPath: '/usr/local/bin/lark-cli',
      folderToken: 'fld_test',
      syncMode: 'docs',
      autoSync: false,
    };

    const result = await syncFileToLark('/tmp/test.md', config);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Sync failed');
  });
});

describe('fetchFileFromLark', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should fetch file with markdown mode', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    vi.mocked(invoke)
      .mockResolvedValueOnce('# Test content')
      .mockResolvedValueOnce('File written');

    const config: LarkCliConfig = {
      cliPath: '/usr/local/bin/lark-cli',
      folderToken: 'fld_test',
      syncMode: 'markdown',
      autoSync: false,
    };

    const result = await fetchFileFromLark('file_test', '/tmp/output.md', config);
    expect(result.success).toBe(true);
    expect(invoke).toHaveBeenCalledWith('lark_cli_markdown_fetch', {
      cliPath: config.cliPath,
      fileToken: 'file_test',
    });
  });

  test('should fetch file with drive mode', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    vi.mocked(invoke).mockResolvedValueOnce('File downloaded');

    const config: LarkCliConfig = {
      cliPath: '/usr/local/bin/lark-cli',
      folderToken: 'fld_test',
      syncMode: 'drive',
      autoSync: false,
    };

    const result = await fetchFileFromLark('file_test', '/tmp/output.md', config);
    expect(result.success).toBe(true);
    expect(invoke).toHaveBeenCalledWith('lark_cli_drive_download', {
      cliPath: config.cliPath,
      fileToken: 'file_test',
      outputPath: '/tmp/output.md',
    });
  });

  test('should return error on fetch failure', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    vi.mocked(invoke).mockRejectedValueOnce(new Error('Fetch failed'));

    const config: LarkCliConfig = {
      cliPath: '/usr/local/bin/lark-cli',
      folderToken: 'fld_test',
      syncMode: 'markdown',
      autoSync: false,
    };

    const result = await fetchFileFromLark('file_test', '/tmp/output.md', config);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Fetch failed');
  });
});

describe('listLarkFiles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should return file list on success', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    const mockFiles = [
      { file_token: 'file_1', name: 'test1.md' },
      { file_token: 'file_2', name: 'test2.md' },
    ];
    vi.mocked(invoke).mockResolvedValueOnce(mockFiles);

    const config: LarkCliConfig = {
      cliPath: '/usr/local/bin/lark-cli',
      folderToken: 'fld_test',
      syncMode: 'markdown',
      autoSync: false,
    };

    const result = await listLarkFiles(config);
    expect(result.success).toBe(true);
    expect(result.files).toEqual(mockFiles);
    expect(invoke).toHaveBeenCalledWith('lark_cli_drive_list', {
      cliPath: config.cliPath,
      folderToken: config.folderToken,
    });
  });

  test('should return error on list failure', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    vi.mocked(invoke).mockRejectedValueOnce(new Error('List failed'));

    const config: LarkCliConfig = {
      cliPath: '/usr/local/bin/lark-cli',
      folderToken: 'fld_test',
      syncMode: 'markdown',
      autoSync: false,
    };

    const result = await listLarkFiles(config);
    expect(result.success).toBe(false);
    expect(result.error).toContain('List failed');
  });
});

describe('triggerSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const state = get(larkSyncStore);
    state.bindings.clear();
  });

  test('should return error if no binding found', async () => {
    const result = await triggerSync('non-existent');
    expect(result.success).toBe(false);
    expect(result.errors).toContain('No binding found');
  });

  test('should sync files successfully', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    vi.mocked(invoke)
      .mockResolvedValueOnce(['/tmp/test1.md', '/tmp/test2.md'])
      .mockResolvedValueOnce({ document_id: 'doc_1', success: true })
      .mockResolvedValueOnce({ document_id: 'doc_2', success: true });

    const config: LarkCliConfig = {
      cliPath: '/usr/local/bin/lark-cli',
      folderToken: 'fld_test',
      syncMode: 'docs',
      autoSync: false,
    };

    larkSyncStore.addBinding('kb-1', config);

    const result = await triggerSync('kb-1');
    expect(result.success).toBe(true);
    expect(result.syncedFiles).toBe(2);
    expect(result.failedFiles).toBe(0);
  });

  test('should handle partial sync failure', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    vi.mocked(invoke)
      .mockResolvedValueOnce(['/tmp/test1.md', '/tmp/test2.md'])
      .mockResolvedValueOnce({ document_id: 'doc_1', success: true })
      .mockRejectedValueOnce(new Error('Sync failed'));

    const config: LarkCliConfig = {
      cliPath: '/usr/local/bin/lark-cli',
      folderToken: 'fld_test',
      syncMode: 'docs',
      autoSync: false,
    };

    larkSyncStore.addBinding('kb-1', config);

    const result = await triggerSync('kb-1');
    expect(result.success).toBe(true);
    expect(result.syncedFiles).toBe(1);
    expect(result.failedFiles).toBe(1);
    expect(result.errors.length).toBe(1);
  });
});

describe('firstSyncDownload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should return error if no binding found', async () => {
    const result = await firstSyncDownload('non-existent');
    expect(result.success).toBe(false);
    expect(result.errors).toContain('No binding found');
  });

  test('should download files successfully', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    const mockFiles = [
      { file_token: 'file_1', name: 'test1.md' },
      { file_token: 'file_2', name: 'test2.md' },
    ];
    
    vi.mocked(invoke)
      .mockResolvedValueOnce(mockFiles)
      .mockResolvedValueOnce('File downloaded')
      .mockResolvedValueOnce('File downloaded');

    const config: LarkCliConfig = {
      cliPath: '/usr/local/bin/lark-cli',
      folderToken: 'fld_test',
      syncMode: 'drive',
      autoSync: false,
    };

    larkSyncStore.addBinding('kb-1', config);

    const result = await firstSyncDownload('kb-1');
    expect(result.success).toBe(true);
    expect(result.syncedFiles).toBe(2);
    expect(result.failedFiles).toBe(0);
  });
});