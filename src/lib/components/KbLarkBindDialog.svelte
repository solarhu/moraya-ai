<script lang="ts">
  import { onDestroy } from 'svelte';
  import { filesStore, type KnowledgeBase } from '$lib/stores/files-store';
  import { t } from '$lib/i18n';
  import {
    larkSyncStore,
    authenticateLarkCli,
    triggerSync,
    firstSyncUpload,
    firstSyncDownload,
    scanKbFiles,
    listLarkFiles,
  } from '$lib/services/lark-sync';
  import type { LarkCliConfig } from '$lib/services/lark-sync/types';

  let { kb, onClose }: { kb: KnowledgeBase; onClose: () => void } = $props();

  let step = $state(1);
  let cliPath = $state('/home/admin/.npm-global/bin/lark-cli');
  let folderToken = $state('');
  let syncMode = $state<'docs' | 'drive' | 'markdown'>('markdown');
  let autoSync = $state(false);
  let syncInterval = $state(60);
  let authStatus = $state<'idle' | 'authenticating' | 'success' | 'error'>('idle');
  let syncDirection = $state<'upload' | 'download' | 'none'>('none');
  let syncStatus = $state<'idle' | 'scanning' | 'syncing' | 'success' | 'error'>('idle');
  let errorMessage = $state('');
  let localFiles = $state<string[]>([]);
  let remoteFiles = $state<any[]>([]);
  let syncReport = $state<any>(null);
  let userConfirmed = $state(false);
  let submitting = $state(false);

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
      authStatus = success ? 'success' : 'error';
      
      if (!success) {
        errorMessage = '认证失败，请检查lark-cli是否已登录';
      }
    } catch (error) {
      authStatus = 'error';
      errorMessage = String(error);
    }
  }

  async function scanFiles() {
    syncStatus = 'scanning';
    errorMessage = '';

    try {
      localFiles = await scanKbFiles(kb.path);
      
      const config: LarkCliConfig = {
        cliPath,
        folderToken,
        syncMode,
        autoSync,
        syncInterval,
      };

      const result = await listLarkFiles(config);
      
      if (result.success && result.files) {
        remoteFiles = result.files;
      } else {
        remoteFiles = [];
      }

      syncStatus = 'success';
    } catch (error) {
      syncStatus = 'error';
      errorMessage = String(error);
    }
  }

  async function performSync() {
    submitting = true;
    syncStatus = 'syncing';
    errorMessage = '';

    try {
      const config: LarkCliConfig = {
        cliPath,
        folderToken,
        syncMode,
        autoSync,
        syncInterval,
      };

      larkSyncStore.addBinding(kb.id, config);

      if (syncDirection === 'upload') {
        syncReport = await firstSyncUpload(kb.id);
      } else if (syncDirection === 'download') {
        syncReport = await firstSyncDownload(kb.id);
      }

      if (syncReport?.success) {
        syncStatus = 'success';
        
        if (autoSync) {
          const { startAutoSync } = await import('$lib/services/lark-sync');
          startAutoSync(kb.id, syncInterval);
        }

        setTimeout(() => onClose(), 1500);
      } else {
        syncStatus = 'error';
        errorMessage = syncReport?.errors?.join('\n') || '同步失败';
      }
    } catch (error) {
      syncStatus = 'error';
      errorMessage = String(error);
    } finally {
      submitting = false;
    }
  }

  function nextStep() {
    if (step === 1 && authStatus === 'success') {
      step = 2;
    } else if (step === 2) {
      step = 3;
    } else if (step === 3 && syncDirection !== 'none' && userConfirmed) {
      step = 4;
      performSync();
    }
  }

  $effect(() => {
    if (step === 2) {
      scanFiles();
    }
  });
</script>

<div class="lark-bind-overlay" onclick={onClose}>
  <div class="lark-bind-dialog" onclick={(e) => e.stopPropagation()}>
    <div class="dialog-header">
      <h3>{$t('larkSync.bindDialog.title').replace('{name}', kb.name)}</h3>
      <button class="dialog-close" onclick={onClose}>&times;</button>
    </div>

    <div class="dialog-body">
      <div class="step-indicator">
        <span class="step-label">
          {$t('larkSync.bindDialog.step').replace('{current}', String(step)).replace('{total}', '4')}
        </span>
      </div>

      {#if step === 1}
        <div class="step-content">
          <h4>{$t('larkSync.bindDialog.step1Title')}</h4>
          <p class="hint-text">{$t('larkSync.bindDialog.installHint')}</p>
          
          <div class="form-group">
            <label>{$t('larkSync.bindDialog.cliPath')}</label>
            <input type="text" bind:value={cliPath} placeholder="/path/to/lark-cli" />
          </div>

          <div class="form-group">
            <label>{$t('larkSync.bindDialog.folderToken')}</label>
            <input type="text" bind:value={folderToken} placeholder="fld_xxx" />
          </div>

          <div class="form-group">
            <label>{$t('larkSync.bindDialog.syncMode')}</label>
            <select bind:value={syncMode}>
              <option value="docs">{$t('larkSync.bindDialog.modeDocs')}</option>
              <option value="markdown">{$t('larkSync.bindDialog.modeMarkdown')}</option>
              <option value="drive">{$t('larkSync.bindDialog.modeDrive')}</option>
            </select>
          </div>

          <button class="btn btn-primary" onclick={testAuth} disabled={authStatus === 'authenticating'}>
            {authStatus === 'authenticating' 
              ? $t('larkSync.bindDialog.authenticating') 
              : $t('larkSync.bindDialog.testAuth')}
          </button>

          {#if authStatus === 'success'}
            <div class="status success">✓ {$t('larkSync.bindDialog.authSuccess')}</div>
          {:else if authStatus === 'error'}
            <div class="status error">✗ {errorMessage}</div>
          {/if}
        </div>

      {:else if step === 2}
        <div class="step-content">
          <h4>{$t('larkSync.bindDialog.step2Title')}</h4>
          
          {#if syncStatus === 'scanning'}
            <p class="hint-text">{$t('larkSync.bindDialog.scanning')}</p>
          {:else if syncStatus === 'success'}
            <div class="scan-results">
              <div class="result-item">
                <span class="result-label">{$t('larkSync.bindDialog.localFiles')}</span>
                <span class="result-count">{localFiles.length}</span>
              </div>
              <div class="result-item">
                <span class="result-label">{$t('larkSync.bindDialog.remoteFiles')}</span>
                <span class="result-count">{remoteFiles.length}</span>
              </div>
            </div>
          {:else if syncStatus === 'error'}
            <div class="status error">✗ {errorMessage}</div>
          {/if}
        </div>

      {:else if step === 3}
        <div class="step-content">
          <h4>{$t('larkSync.bindDialog.step3Title')}</h4>
          
          <div class="sync-options">
            <div class="option-group">
              <label class="option-label">
                <input type="radio" value="upload" bind:group={syncDirection} />
                <span>{$t('larkSync.bindDialog.uploadToLark')}</span>
                <span class="option-desc">{$t('larkSync.bindDialog.uploadDesc')}</span>
              </label>
            </div>

            <div class="option-group">
              <label class="option-label">
                <input type="radio" value="download" bind:group={syncDirection} />
                <span>{$t('larkSync.bindDialog.downloadFromLark')}</span>
                <span class="option-desc">{$t('larkSync.bindDialog.downloadDesc')}</span>
              </label>
            </div>

            <div class="option-group">
              <label class="option-label">
                <input type="radio" value="none" bind:group={syncDirection} />
                <span>{$t('larkSync.bindDialog.noFirstSync')}</span>
                <span class="option-desc">{$t('larkSync.bindDialog.noFirstSyncDesc')}</span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>
              <input type="checkbox" bind:checked={autoSync} />
              {$t('larkSync.bindDialog.autoSync')}
            </label>
          </div>

          {#if autoSync}
            <div class="form-group">
              <label>{$t('larkSync.bindDialog.syncInterval')}</label>
              <input type="number" bind:value={syncInterval} min="10" max="3600" />
            </div>
          {/if}

          <div class="confirm-group">
            <label>
              <input type="checkbox" bind:checked={userConfirmed} />
              {$t('larkSync.bindDialog.confirmLabel')}
            </label>
          </div>
        </div>

      {:else if step === 4}
        <div class="step-content">
          <h4>{$t('larkSync.bindDialog.step4Title')}</h4>
          
          {#if submitting}
            <div class="sync-progress">
              <div class="progress-spinner"></div>
              <p>{$t('larkSync.bindDialog.syncing')}</p>
            </div>
          {:else if syncStatus === 'success'}
            <div class="sync-result">
              <div class="status success">✓ {$t('larkSync.bindDialog.syncSuccess')}</div>
              {#if syncReport}
                <div class="report-details">
                  <div>{$t('larkSync.bindDialog.syncedFiles')}: {syncReport.syncedFiles}</div>
                  <div>{$t('larkSync.bindDialog.failedFiles')}: {syncReport.failedFiles}</div>
                  <div>{$t('larkSync.bindDialog.duration')}: {syncReport.duration}ms</div>
                </div>
              {/if}
            </div>
          {:else if syncStatus === 'error'}
            <div class="status error">✗ {errorMessage}</div>
          {/if}
        </div>
      {/if}
    </div>

    <div class="dialog-footer">
      {#if step > 1 && step < 4}
        <button class="btn btn-ghost" onclick={() => { step -= 1; }}>
          {$t('larkSync.bindDialog.back')}
        </button>
      {/if}

      {#if step < 3}
        <button 
          class="btn btn-primary" 
          onclick={nextStep}
          disabled={step === 1 && authStatus !== 'success'}
        >
          {$t('larkSync.bindDialog.next')}
        </button>
      {:else if step === 3}
        <button 
          class="btn btn-primary" 
          onclick={nextStep}
          disabled={syncDirection === 'none' || !userConfirmed}
        >
          {submitting ? $t('larkSync.bindDialog.binding') : $t('larkSync.bindDialog.startSync')}
        </button>
      {:else if step === 4 && syncStatus === 'success'}
        <button class="btn btn-primary" onclick={onClose}>
          {$t('larkSync.bindDialog.done')}
        </button>
      {:else if step === 4 && syncStatus === 'error'}
        <button class="btn btn-ghost" onclick={() => { step = 3; syncStatus = 'idle'; }}>
          {$t('larkSync.bindDialog.retry')}
        </button>
      {/if}
    </div>
  </div>
</div>

<style>
  .lark-bind-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .lark-bind-dialog {
    background: var(--bg-color);
    border-radius: 8px;
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
  }

  .dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid var(--border-color);
  }

  .dialog-header h3 {
    margin: 0;
    font-size: 1.25rem;
  }

  .dialog-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--text-muted);
  }

  .dialog-body {
    padding: 1.5rem;
  }

  .step-indicator {
    margin-bottom: 1rem;
  }

  .step-label {
    font-size: 0.9rem;
    color: var(--text-muted);
  }

  .step-content {
    margin-top: 1rem;
  }

  .step-content h4 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
  }

  .hint-text {
    color: var(--text-muted);
    font-size: 0.85rem;
    margin-bottom: 1rem;
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

  .status {
    padding: 0.75rem;
    border-radius: 4px;
    margin-top: 1rem;
    font-size: 0.9rem;
  }

  .status.success {
    background: var(--bg-success);
    color: var(--text-success);
    border: 1px solid var(--border-success);
  }

  .status.error {
    background: var(--bg-error);
    color: var(--text-error);
    border: 1px solid var(--border-error);
  }

  .scan-results {
    margin-top: 1rem;
  }

  .result-item {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem;
    border-bottom: 1px solid var(--border-color);
  }

  .result-label {
    font-size: 0.9rem;
  }

  .result-count {
    font-weight: 500;
  }

  .sync-options {
    margin-top: 1rem;
  }

  .option-group {
    margin-bottom: 0.75rem;
  }

  .option-label {
    display: flex;
    align-items: flex-start;
    cursor: pointer;
  }

  .option-label input[type="radio"] {
    margin-right: 0.75rem;
    margin-top: 0.25rem;
  }

  .option-label span {
    display: block;
  }

  .option-desc {
    font-size: 0.85rem;
    color: var(--text-muted);
    margin-top: 0.25rem;
  }

  .confirm-group {
    margin-top: 1rem;
    padding: 1rem;
    background: var(--bg-secondary);
    border-radius: 4px;
  }

  .sync-progress {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
  }

  .progress-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border-color);
    border-top-color: var(--accent-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .sync-result {
    margin-top: 1rem;
  }

  .report-details {
    margin-top: 0.5rem;
    font-size: 0.85rem;
    color: var(--text-muted);
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    padding: 1rem;
    border-top: 1px solid var(--border-color);
  }

  .btn {
    padding: 0.5rem 1rem;
    border-radius: 4px;
    font-size: 0.9rem;
    cursor: pointer;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-primary {
    background: var(--accent-color);
    color: white;
    border: none;
  }

  .btn-ghost {
    background: transparent;
    color: var(--text-color);
    border: 1px solid var(--border-color);
  }
</style>