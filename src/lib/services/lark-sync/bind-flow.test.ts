import { describe, test, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import {
  larkSyncStore,
  authenticateLarkCli,
  scanKbFiles,
  listLarkFiles,
  triggerSync,
} from './sync-service';
import type { LarkCliConfig } from './types';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('$lib/stores/files-store', () => ({
  filesStore: {
    getState: vi.fn(() => ({
      knowledgeBases: [
        { id: 'kb-bind-test', name: 'Bind Test KB', path: '/tmp/bind-test' }
      ]
    }))
  }
}));

describe('Lark Bind Flow - Step 1: Authentication', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    const state = get(larkSyncStore);
    state.bindings.forEach((_, kbId) => {
      larkSyncStore.removeBinding(kbId);
    });
  });

  test('should authenticate successfully with valid config', async () => {
    const config: LarkCliConfig = {
      cliPath: '/usr/local/bin/lark-cli',
      folderToken: 'fld_bind_test',
      syncMode: 'markdown',
      autoSync: false,
    };

    vi.mocked(invoke).mockResolvedValue('登录成功');

    const result = await authenticateLarkCli(config);

    expect(result).toBe(true);
    expect(invoke).toHaveBeenCalledWith('lark_cli_auth_login', {
      cliPath: config.cliPath,
      domain: config.syncMode,
    });
  });

  test('should fail authentication with error', async () => {
    const config: LarkCliConfig = {
      cliPath: '/usr/local/bin/lark-cli',
      folderToken: 'fld_invalid',
      syncMode: 'markdown',
      autoSync: false,
    };

    vi.mocked(invoke).mockRejectedValue(new Error('认证失败'));

    const result = await authenticateLarkCli(config);

    expect(result).toBe(false);
  });

  test('should authenticate with docs mode', async () => {
    const config: LarkCliConfig = {
      cliPath: '/usr/local/bin/lark-cli',
      folderToken: 'fld_docs_test',
      syncMode: 'docs',
      autoSync: false,
    };

    vi.mocked(invoke).mockResolvedValue('登录成功');

    const result = await authenticateLarkCli(config);

    expect(result).toBe(true);
    expect(invoke).toHaveBeenCalledWith('lark_cli_auth_login', {
      cliPath: config.cliPath,
      domain: 'docs',
    });
  });

  test('should authenticate with drive mode', async () => {
    const config: LarkCliConfig = {
      cliPath: '/usr/local/bin/lark-cli',
      folderToken: 'fld_drive_test',
      syncMode: 'drive',
      autoSync: false,
    };

    vi.mocked(invoke).mockResolvedValue('登录成功');

    const result = await authenticateLarkCli(config);

    expect(result).toBe(true);
    expect(invoke).toHaveBeenCalledWith('lark_cli_auth_login', {
      cliPath: config.cliPath,
      domain: 'drive',
    });
  });
});

describe('Lark Bind Flow - Step 2: File Scanning', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    const state = get(larkSyncStore);
    state.bindings.forEach((_, kbId) => {
      larkSyncStore.removeBinding(kbId);
    });
  });

  test('should scan local KB files', async () => {
    vi.mocked(invoke).mockResolvedValue(['file1.md', 'file2.md', 'file3.md']);

    const result = await scanKbFiles('/tmp/bind-test');

    expect(result).toHaveLength(3);
    expect(result).toContain('file1.md');
    expect(invoke).toHaveBeenCalledWith('kb_scan_files', {
      kbPath: '/tmp/bind-test',
    });
  });

  test('should list remote Lark files', async () => {
    const config: LarkCliConfig = {
      cliPath: '/usr/local/bin/lark-cli',
      folderToken: 'fld_bind_test',
      syncMode: 'markdown',
      autoSync: false,
    };

    vi.mocked(invoke).mockResolvedValue([
      { name: 'remote1.md', token: 'doc_token_1' },
      { name: 'remote2.md', token: 'doc_token_2' },
    ]);

    const result = await listLarkFiles(config);

    expect(result.success).toBe(true);
    expect(result.files).toHaveLength(2);
    expect(invoke).toHaveBeenCalledWith('lark_cli_drive_list', {
      cliPath: config.cliPath,
      folderToken: config.folderToken,
    });
  });

  test('should handle empty KB', async () => {
    vi.mocked(invoke).mockResolvedValue([]);

    const result = await scanKbFiles('/tmp/empty-kb');

    expect(result).toHaveLength(0);
  });
});

describe('Lark Bind Flow - Step 3: Sync Strategy Selection', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    const state = get(larkSyncStore);
    state.bindings.forEach((_, kbId) => {
      larkSyncStore.removeBinding(kbId);
    });
  });

  test('should add binding to store', () => {
    const config: LarkCliConfig = {
      cliPath: '/usr/local/bin/lark-cli',
      folderToken: 'fld_bind_test',
      syncMode: 'markdown',
      autoSync: false,
    };

    larkSyncStore.addBinding('kb-bind-test', config);

    const state = get(larkSyncStore);
    expect(state.bindings.has('kb-bind-test')).toBe(true);

    const binding = state.bindings.get('kb-bind-test');
    expect(binding?.config.cliPath).toBe(config.cliPath);
    expect(binding?.config.folderToken).toBe(config.folderToken);
    expect(binding?.config.syncMode).toBe('markdown');
  });

  test('should support auto-sync configuration', () => {
    const config: LarkCliConfig = {
      cliPath: '/usr/local/bin/lark-cli',
      folderToken: 'fld_bind_test',
      syncMode: 'markdown',
      autoSync: true,
      syncInterval: 60,
    };

    larkSyncStore.addBinding('kb-bind-test', config);

    const state = get(larkSyncStore);
    const binding = state.bindings.get('kb-bind-test');
    expect(binding?.config.autoSync).toBe(true);
    expect(binding?.config.syncInterval).toBe(60);
  });

  test('should update existing binding', () => {
    const config1: LarkCliConfig = {
      cliPath: '/usr/local/bin/lark-cli',
      folderToken: 'fld_old',
      syncMode: 'markdown',
      autoSync: false,
    };

    larkSyncStore.addBinding('kb-bind-test', config1);

    const config2: LarkCliConfig = {
      cliPath: '/usr/local/bin/lark-cli',
      folderToken: 'fld_new',
      syncMode: 'docs',
      autoSync: true,
      syncInterval: 120,
    };

    larkSyncStore.addBinding('kb-bind-test', config2);

    const state = get(larkSyncStore);
    const binding = state.bindings.get('kb-bind-test');
    expect(binding?.config.folderToken).toBe('fld_new');
    expect(binding?.config.syncMode).toBe('docs');
    expect(binding?.config.syncInterval).toBe(120);
  });

  test('should remove binding', () => {
    const config: LarkCliConfig = {
      cliPath: '/usr/local/bin/lark-cli',
      folderToken: 'fld_bind_test',
      syncMode: 'markdown',
      autoSync: false,
    };

    larkSyncStore.addBinding('kb-bind-test', config);

    larkSyncStore.removeBinding('kb-bind-test');

    const state = get(larkSyncStore);
    expect(state.bindings.has('kb-bind-test')).toBe(false);
  });
});

describe('Lark Bind Flow - Step 4: Sync Execution', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    const state = get(larkSyncStore);
    state.bindings.forEach((_, kbId) => {
      larkSyncStore.removeBinding(kbId);
    });
  });

  test('should perform sync with binding', async () => {
    const config: LarkCliConfig = {
      cliPath: '/usr/local/bin/lark-cli',
      folderToken: 'fld_bind_test',
      syncMode: 'markdown',
      autoSync: false,
    };

    larkSyncStore.addBinding('kb-bind-test', config);

    vi.mocked(invoke)
      .mockResolvedValueOnce(['file1.md', 'file2.md'])
      .mockResolvedValueOnce({ document_id: 'doc_1', success: true })
      .mockResolvedValueOnce({ document_id: 'doc_2', success: true });

    const report = await triggerSync('kb-bind-test');

    expect(report.success).toBe(true);
    expect(report.syncedFiles).toBe(2);
    expect(report.failedFiles).toBe(0);
  });

  test('should handle sync without binding', async () => {
    const report = await triggerSync('kb-no-binding');

    expect(report.success).toBe(false);
    expect(report.errors).toContain('No binding found');
  });

  test('should handle partial sync failure', async () => {
    const config: LarkCliConfig = {
      cliPath: '/usr/local/bin/lark-cli',
      folderToken: 'fld_bind_test',
      syncMode: 'markdown',
      autoSync: false,
    };

    larkSyncStore.addBinding('kb-bind-test', config);

    vi.mocked(invoke)
      .mockResolvedValueOnce(['file1.md', 'file2.md', 'file3.md'])
      .mockResolvedValueOnce({ document_id: 'doc_1', success: true })
      .mockRejectedValueOnce(new Error('upload failed'))
      .mockResolvedValueOnce({ document_id: 'doc_3', success: true });

    const report = await triggerSync('kb-bind-test');

    expect(report.success).toBe(true);
    expect(report.syncedFiles).toBe(2);
    expect(report.failedFiles).toBe(1);
    expect(report.errors.length).toBeGreaterThan(0);
  });
});