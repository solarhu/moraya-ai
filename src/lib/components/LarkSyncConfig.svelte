<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';
  import { larkSyncStore, authenticateLarkCli, triggerSync, firstSyncUpload, firstSyncDownload } from '$lib/services/lark-sync';
  import type { LarkCliConfig } from '$lib/services/lark-sync/types';
  import type { KnowledgeBase } from '$lib/stores/files-store';
  
  interface Props {
    kb: KnowledgeBase;
    onBind?: () => void;
    onCancel?: () => void;
  }
  
  let { kb, onBind, onCancel }: Props = $props();
  
  let cliPath = $state('/home/admin/.npm-global/bin/lark-cli');
  let folderToken = $state('');
  let syncMode = $state<'docs' | 'drive' | 'markdown'>('markdown');
  let autoSync = $state(false);
  let syncInterval = $state(60);
  let authStatus = $state<'idle' | 'authenticating' | 'success' | 'error'>('idle');
  let syncStatus = $state<'idle' | 'syncing' | 'success' | 'error'>('idle');
  let lastSyncReport = $state<any>(null);
  let errorMessage = $state('');
  
  async function testAuth() {
    authStatus = 'authenticating';
    errorMessage = '';
    
    try {
      const config: LarkCliConfig = {
        cliPath,
        folderToken,
        syncMode,
        autoSync,
        syncInterval,
      };
      
      const success = await authenticateLarkCli(config);
      
      if (success) {
        authStatus = 'success';
      } else {
        authStatus = 'error';
        errorMessage = '认证失败，请检查lark-cli是否已登录';
      }
    } catch (error) {
      authStatus = 'error';
      errorMessage = String(error);
    }
  }
  
  async function bindSync() {
    if (authStatus !== 'success') {
      errorMessage = '请先完成认证';
      return;
    }
    
    const config: LarkCliConfig = {
      cliPath,
      folderToken,
      syncMode,
      autoSync,
      syncInterval,
    };
    
    larkSyncStore.addBinding(kb.id, config);
    
    if (autoSync) {
      const { startAutoSync } = await import('$lib/services/lark-sync');
      startAutoSync(kb.id, syncInterval);
    }
    
    onBind?.();
  }
  
  async function testSyncUpload() {
    syncStatus = 'syncing';
    errorMessage = '';
    
    try {
      const report = await firstSyncUpload(kb.id);
      lastSyncReport = report;
      
      if (report.success) {
        syncStatus = 'success';
      } else {
        syncStatus = 'error';
        errorMessage = report.errors.join('\n');
      }
    } catch (error) {
      syncStatus = 'error';
      errorMessage = String(error);
    }
  }
  
  async function testSyncDownload() {
    syncStatus = 'syncing';
    errorMessage = '';
    
    try {
      const report = await firstSyncDownload(kb.id);
      lastSyncReport = report;
      
      if (report.success) {
        syncStatus = 'success';
      } else {
        syncStatus = 'error';
        errorMessage = report.errors.join('\n');
      }
    } catch (error) {
      syncStatus = 'error';
      errorMessage = String(error);
    }
  }
</script>

<div class="lark-sync-config">
  <h2>飞书云文档同步配置</h2>
  <p class="kb-name">知识库: {kb.name}</p>
  
  <div class="form-group">
    <label>lark-cli路径:</label>
    <input type="text" bind:value={cliPath} placeholder="/path/to/lark-cli" />
  </div>
  
  <div class="form-group">
    <label>飞书文件夹Token:</label>
    <input type="text" bind:value={folderToken} placeholder="fld_xxx" />
  </div>
  
  <div class="form-group">
    <label>同步模式:</label>
    <select bind:value={syncMode}>
      <option value="docs">飞书文档</option>
      <option value="markdown">Drive Markdown</option>
      <option value="drive">Drive文件</option>
    </select>
  </div>
  
  <div class="form-group">
    <label>
      <input type="checkbox" bind:checked={autoSync} />
      自动同步
    </label>
  </div>
  
  {#if autoSync}
    <div class="form-group">
      <label>同步间隔（秒）:</label>
      <input type="number" bind:value={syncInterval} min="10" max="3600" />
    </div>
  {/if}
  
  <div class="actions">
    <button class="btn-secondary" onclick={testAuth} disabled={authStatus === 'authenticating'}>
      {authStatus === 'authenticating' ? '认证中...' : '测试认证'}
    </button>
    
    <button class="btn-secondary" onclick={testSyncUpload} disabled={authStatus !== 'success' || syncStatus === 'syncing'}>
      测试上传
    </button>
    
    <button class="btn-secondary" onclick={testSyncDownload} disabled={authStatus !== 'success' || syncStatus === 'syncing'}>
      测试下载
    </button>
  </div>
  
  {#if authStatus === 'success'}
    <div class="status success">✓ lark-cli认证成功</div>
  {:else if authStatus === 'error'}
    <div class="status error">✗ {errorMessage}</div>
  {/if}
  
  {#if syncStatus === 'success' && lastSyncReport}
    <div class="status success">
      ✓ 同步成功<br>
      文件数: {lastSyncReport.syncedFiles}<br>
      失败数: {lastSyncReport.failedFiles}<br>
      耗时: {lastSyncReport.duration}ms
    </div>
  {:else if syncStatus === 'error'}
    <div class="status error">✗ {errorMessage}</div>
  {/if}
  
  <div class="footer">
    <button class="btn-cancel" onclick={onCancel}>取消</button>
    <button class="btn-primary" onclick={bindSync} disabled={authStatus !== 'success'}>绑定同步</button>
  </div>
</div>

<style>
  .lark-sync-config {
    padding: 1.5rem;
    max-width: 500px;
  }
  
  h2 {
    margin: 0 0 1rem 0;
    font-size: 1.25rem;
  }
  
  .kb-name {
    margin: 0 0 1.5rem 0;
    color: var(--text-muted);
    font-size: 0.9rem;
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }
  
  .form-group input[type="text"],
  .form-group input[type="number"],
  .form-group select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: 0.9rem;
  }
  
  .form-group input[type="checkbox"] {
    margin-right: 0.5rem;
  }
  
  .actions {
    margin-top: 1.5rem;
    display: flex;
    gap: 0.5rem;
  }
  
  .status {
    margin-top: 1rem;
    padding: 0.75rem;
    border-radius: 4px;
    font-size: 0.9rem;
  }
  
  .status.success {
    background-color: var(--bg-success);
    color: var(--text-success);
    border: 1px solid var(--border-success);
  }
  
  .status.error {
    background-color: var(--bg-error);
    color: var(--text-error);
    border: 1px solid var(--border-error);
  }
  
  .footer {
    margin-top: 2rem;
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }
  
  .btn-primary {
    padding: 0.5rem 1rem;
    background-color: var(--accent-color);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .btn-secondary {
    padding: 0.5rem 1rem;
    background-color: transparent;
    color: var(--text-color);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    cursor: pointer;
  }
  
  .btn-secondary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .btn-cancel {
    padding: 0.5rem 1rem;
    background-color: transparent;
    color: var(--text-muted);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    cursor: pointer;
  }
</style>