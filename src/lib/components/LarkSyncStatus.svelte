<script lang="ts">
  import { larkSyncStore, triggerSync, startAutoSync, stopAutoSync } from '$lib/services/lark-sync';
  import type { KnowledgeBase } from '$lib/stores/files-store';
  
  interface Props {
    kb: KnowledgeBase;
  }
  
  let { kb }: Props = $props();
  
  let binding = $derived(larkSyncStore.getBinding(kb.id));
  let isSyncing = $derived(binding?.status === 'syncing');
  let hasError = $derived(binding?.status === 'error');
  
  async function handleSyncNow() {
    const report = await triggerSync(kb.id);
    console.log('Sync report:', report);
  }
  
  function handleToggleAutoSync() {
    if (!binding) return;
    
    if (binding.config.autoSync) {
      stopAutoSync(kb.id);
      larkSyncStore.updateBinding(kb.id, {
        config: { ...binding.config, autoSync: false }
      });
    } else {
      startAutoSync(kb.id, binding.config.syncInterval || 60);
      larkSyncStore.updateBinding(kb.id, {
        config: { ...binding.config, autoSync: true }
      });
    }
  }
</script>

{#if binding}
  <div class="lark-sync-status">
    <div class="status-header">
      <span class="status-icon">
        {#if isSyncing}
          <span class="icon syncing">🔄</span>
        {:else if hasError}
          <span class="icon error">❌</span>
        {:else}
          <span class="icon success">✓</span>
        {/if}
      </span>
      
      <span class="status-text">
        {#if isSyncing}
          同步中...
        {:else if hasError}
          同步失败
        {:else}
          已同步 ({binding.syncedFiles}个文件)
        {/if}
      </span>
    </div>
    
    <div class="status-actions">
      <button 
        class="btn-sync" 
        onclick={handleSyncNow}
        disabled={isSyncing}
      >
        {isSyncing ? '同步中...' : '立即同步'}
      </button>
      
      <button 
        class="btn-auto" 
        onclick={handleToggleAutoSync}
      >
        {binding.config.autoSync ? '关闭自动' : '开启自动'}
      </button>
    </div>
    
    {#if binding.lastSyncAt}
      <div class="last-sync">
        上次同步: {new Date(binding.lastSyncAt).toLocaleString()}
      </div>
    {/if}
    
    {#if hasError && binding.lastError}
      <div class="error-message">
        错误: {binding.lastError}
      </div>
    {/if}
  </div>
{/if}

<style>
  .lark-sync-status {
    padding: 0.5rem;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background-color: var(--bg-secondary);
  }
  
  .status-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  
  .status-icon {
    font-size: 1rem;
  }
  
  .icon.syncing {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .status-text {
    font-size: 0.9rem;
    color: var(--text-color);
  }
  
  .status-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .btn-sync,
  .btn-auto {
    padding: 0.25rem 0.5rem;
    font-size: 0.8rem;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    cursor: pointer;
    background-color: transparent;
    color: var(--text-color);
  }
  
  .btn-sync:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .last-sync {
    margin-top: 0.5rem;
    font-size: 0.8rem;
    color: var(--text-muted);
  }
  
  .error-message {
    margin-top: 0.5rem;
    font-size: 0.8rem;
    color: var(--text-error);
    padding: 0.25rem;
    background-color: var(--bg-error);
    border-radius: 2px;
  }
</style>