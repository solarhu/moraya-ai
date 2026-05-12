/**
 * 云平台适配层统一导出
 */

export { cloudProviderRegistry } from './provider-registry';
export type {
  CloudProvider,
  CloudFile,
  CloudFolder,
  CreateFileOptions,
  UpdateFileOptions,
  SyncOptions,
  SyncReport,
  SyncStatus,
  Permissions,
  ShareOptions,
  ShareResult,
  ProviderCapabilities,
  CloudProviderAPI,
  CloudProviderConfig,
  CloudBinding,
  CloudEvent,
  CloudEventListener,
  ListOptions,
  SearchOptions,
} from './types';