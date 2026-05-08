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