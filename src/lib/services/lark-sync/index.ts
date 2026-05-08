export {
  larkSyncStore,
  authenticateLarkCli,
  scanKbFiles,
  syncFileToLark,
  fetchFileFromLark,
  listLarkFiles,
  triggerSync,
  firstSyncUpload,
  firstSyncDownload,
  startAutoSync,
  stopAutoSync,
} from './sync-service';

export type {
  LarkCliConfig,
  LarkSyncBinding,
  LarkSyncState,
  FileChange,
  SyncReport,
} from './types';