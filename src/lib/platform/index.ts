import type { PlatformAdapter } from './types';
import { platform } from './platform-detector';
import { tauriAdapter } from './tauri-adapter';
import { webFileSystem } from './web-filesystem';
import { webDialog } from './web-dialog';
import { webStorage } from './web-storage';
import { webHTTP } from './web-http';

export const platformAdapter: PlatformAdapter = platform === 'tauri'
  ? tauriAdapter
  : {
      platform: 'web',
      fs: webFileSystem,
      dialog: webDialog,
      storage: webStorage,
      http: webHTTP,
    };

// 导出统一API
export const fs = platformAdapter.fs;
export const dialog = platformAdapter.dialog;
export const storage = platformAdapter.storage;
export const http = platformAdapter.http;

// 导出平台信息
export { platform, platformInfo, type Platform, type PlatformInfo } from './platform-detector';
export { type PlatformAPI, type PlatformAdapter } from './types';