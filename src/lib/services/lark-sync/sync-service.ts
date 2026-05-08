import { invoke } from '@tauri-apps/api/core';
import { writable, get } from 'svelte/store';
import type { KnowledgeBase } from '$lib/stores/files-store';

export interface LarkCliConfig {
  cliPath: string;
  folderToken: string;
  syncMode: 'docs' | 'drive' | 'markdown';
  autoSync: boolean;
  syncInterval?: number;
}

export interface LarkSyncBinding {
  localKbId: string;
  config: LarkCliConfig;
  lastSyncAt?: number;
  status: 'idle' | 'syncing' | 'error' | 'success';
  lastError?: string;
  syncedFiles: number;
  pendingFiles: number;
}

export interface LarkSyncState {
  bindings: Map<string, LarkSyncBinding>;
}

export interface FileChange {
  type: 'create' | 'update' | 'delete';
  path: string;
  name: string;
  timestamp: number;
}

export interface SyncReport {
  success: boolean;
  syncedFiles: number;
  failedFiles: number;
  errors: string[];
  duration: number;
}

function createLarkSyncStore() {
  const { subscribe, update, set } = writable<LarkSyncState>({
    bindings: new Map(),
  });

  return {
    subscribe,
    addBinding(kbId: string, config: LarkCliConfig) {
      update(state => {
        const bindings = new Map(state.bindings);
        bindings.set(kbId, {
          localKbId: kbId,
          config,
          status: 'idle',
          syncedFiles: 0,
          pendingFiles: 0,
        });
        return { bindings };
      });
    },
    removeBinding(kbId: string) {
      update(state => {
        const bindings = new Map(state.bindings);
        bindings.delete(kbId);
        return { bindings };
      });
    },
    updateBinding(kbId: string, partial: Partial<LarkSyncBinding>) {
      update(state => {
        const bindings = new Map(state.bindings);
        const existing = bindings.get(kbId);
        if (existing) {
          bindings.set(kbId, { ...existing, ...partial });
        }
        return { bindings };
      });
    },
    getBinding(kbId: string): LarkSyncBinding | undefined {
      const state = get({ subscribe });
      return state.bindings.get(kbId);
    },
  };
}

export const larkSyncStore = createLarkSyncStore();

const syncIntervals = new Map<string, ReturnType<typeof setInterval>>();

export function startAutoSync(kbId: string, intervalSeconds: number = 60) {
  stopAutoSync(kbId);
  
  const id = setInterval(async () => {
    const binding = larkSyncStore.getBinding(kbId);
    if (binding && binding.config.autoSync) {
      await triggerSync(kbId);
    }
  }, intervalSeconds * 1000);
  
  syncIntervals.set(kbId, id);
}

export function stopAutoSync(kbId: string) {
  const id = syncIntervals.get(kbId);
  if (id) {
    clearInterval(id);
    syncIntervals.delete(kbId);
  }
}

export async function authenticateLarkCli(config: LarkCliConfig): Promise<boolean> {
  try {
    const result = await invoke<string>('lark_cli_auth_login', {
      cliPath: config.cliPath,
      domain: config.syncMode,
    });
    
    return true;
  } catch (error) {
    console.error('lark-cli auth failed:', error);
    return false;
  }
}

export async function scanKbFiles(kbPath: string): Promise<string[]> {
  try {
    const files = await invoke<string[]>('kb_scan_files', {
      kbPath,
    });
    return files;
  } catch (error) {
    console.error('KB scan failed:', error);
    return [];
  }
}

export async function syncFileToLark(
  filePath: string,
  config: LarkCliConfig,
): Promise<{ success: boolean; documentId?: string; error?: string }> {
  try {
    const fileName = filePath.split('/').pop() || 'Untitled';
    const title = fileName.replace('.md', '');
    
    if (config.syncMode === 'docs') {
      const result = await invoke<{ document_id: string; success: boolean }>('lark_cli_docs_create', {
        cliPath: config.cliPath,
        title,
        markdownFile: filePath,
        folderToken: config.folderToken,
      });
      
      return { success: true, documentId: result.document_id };
    } else if (config.syncMode === 'markdown') {
      const result = await invoke<string>('lark_cli_markdown_create', {
        cliPath: config.cliPath,
        markdownFile: filePath,
        folderToken: config.folderToken,
      });
      
      return { success: true };
    } else {
      const result = await invoke<string>('lark_cli_drive_upload', {
        cliPath: config.cliPath,
        filePath,
        folderToken: config.folderToken,
      });
      
      return { success: true };
    }
  } catch (error) {
    console.error('File sync failed:', error);
    return { success: false, error: String(error) };
  }
}

export async function fetchFileFromLark(
  fileToken: string,
  outputPath: string,
  config: LarkCliConfig,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (config.syncMode === 'markdown') {
      const content = await invoke<string>('lark_cli_markdown_fetch', {
        cliPath: config.cliPath,
        fileToken,
      });
      
      await invoke('kb_write_file', {
        kbPath: outputPath,
        content,
      });
      
      return { success: true };
    } else {
      await invoke<string>('lark_cli_drive_download', {
        cliPath: config.cliPath,
        fileToken,
        outputPath,
      });
      
      return { success: true };
    }
  } catch (error) {
    console.error('File fetch failed:', error);
    return { success: false, error: String(error) };
  }
}

export async function listLarkFiles(config: LarkCliConfig): Promise<{ success: boolean; files?: any[]; error?: string }> {
  try {
    const files = await invoke<any[]>('lark_cli_drive_list', {
      cliPath: config.cliPath,
      folderToken: config.folderToken,
    });
    
    return { success: true, files };
  } catch (error) {
    console.error('List files failed:', error);
    return { success: false, error: String(error) };
  }
}

export async function triggerSync(kbId: string): Promise<SyncReport> {
  const binding = larkSyncStore.getBinding(kbId);
  if (!binding) {
    return { success: false, syncedFiles: 0, failedFiles: 0, errors: ['No binding found'], duration: 0 };
  }
  
  const kb = await getKbById(kbId);
  if (!kb) {
    return { success: false, syncedFiles: 0, failedFiles: 0, errors: ['KB not found'], duration: 0 };
  }
  
  larkSyncStore.updateBinding(kbId, { status: 'syncing' });
  
  const startTime = Date.now();
  const errors: string[] = [];
  let syncedFiles = 0;
  let failedFiles = 0;
  
  try {
    const files = await scanKbFiles(kb.path);
    
    for (const file of files) {
      const result = await syncFileToLark(file, binding.config);
      
      if (result.success) {
        syncedFiles++;
      } else {
        failedFiles++;
        errors.push(`${file}: ${result.error}`);
      }
    }
    
    larkSyncStore.updateBinding(kbId, {
      status: 'success',
      lastSyncAt: startTime,
      syncedFiles,
      pendingFiles: 0,
    });
    
    return { success: true, syncedFiles, failedFiles, errors, duration: Date.now() - startTime };
  } catch (error) {
    larkSyncStore.updateBinding(kbId, {
      status: 'error',
      lastError: String(error),
    });
    
    return { success: false, syncedFiles, failedFiles, errors: [String(error)], duration: Date.now() - startTime };
  }
}

async function getKbById(kbId: string): Promise<KnowledgeBase | null> {
  const { filesStore } = await import('$lib/stores/files-store');
  const state = filesStore.getState();
  const kb = state.knowledgeBases.find(k => k.id === kbId);
  return kb || null;
}

export async function firstSyncUpload(kbId: string): Promise<SyncReport> {
  return triggerSync(kbId);
}

export async function firstSyncDownload(kbId: string): Promise<SyncReport> {
  const binding = larkSyncStore.getBinding(kbId);
  if (!binding) {
    return { success: false, syncedFiles: 0, failedFiles: 0, errors: ['No binding found'], duration: 0 };
  }
  
  const kb = await getKbById(kbId);
  if (!kb) {
    return { success: false, syncedFiles: 0, failedFiles: 0, errors: ['KB not found'], duration: 0 };
  }
  
  larkSyncStore.updateBinding(kbId, { status: 'syncing' });
  
  const startTime = Date.now();
  const errors: string[] = [];
  let syncedFiles = 0;
  let failedFiles = 0;
  
  try {
    const result = await listLarkFiles(binding.config);
    
    if (!result.success || !result.files) {
      throw new Error(result.error || 'Failed to list files');
    }
    
    for (const file of result.files) {
      const outputPath = `${kb.path}/${file.name}`;
      const fetchResult = await fetchFileFromLark(file.file_token, outputPath, binding.config);
      
      if (fetchResult.success) {
        syncedFiles++;
      } else {
        failedFiles++;
        errors.push(`${file.name}: ${fetchResult.error}`);
      }
    }
    
    larkSyncStore.updateBinding(kbId, {
      status: 'success',
      lastSyncAt: startTime,
      syncedFiles,
      pendingFiles: 0,
    });
    
    return { success: true, syncedFiles, failedFiles, errors, duration: Date.now() - startTime };
  } catch (error) {
    larkSyncStore.updateBinding(kbId, {
      status: 'error',
      lastError: String(error),
    });
    
    return { success: false, syncedFiles, failedFiles, errors: [String(error)], duration: Date.now() - startTime };
  }
}