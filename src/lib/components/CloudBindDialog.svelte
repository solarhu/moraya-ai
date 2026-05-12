<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import { cloudProviderRegistry } from '$lib/cloud-platform';
  import { platformAdapter } from '$lib/platform';
  import type { CloudProviderAPI, CloudProvider, CloudBinding } from '$lib/cloud-platform/types';
  import { filesStore, type KnowledgeBase } from '$lib/stores/files-store';
  import { t } from '$lib/i18n';
  
  let { kb, onClose }: { kb: KnowledgeBase; onClose: () => void } = $props();
  
  // 步骤控制
  let step = $state(1);
  
  // 云平台选择
  let selectedProvider = $state<CloudProvider>('lark');
  let availableProviders = $state<CloudProviderAPI[]>([]);
  let currentProvider = $state<CloudProviderAPI | null>(null);
  
  // 飞书配置
  let cliPath = $state('/usr/bin/lark-cli');
  let folderToken = $state('');
  let syncMode = $state<'docs' | 'drive' | 'markdown'>('markdown');
  
  // Web环境配置
  let appId = $state('');
  let appSecret = $state('');
  
  // 通用配置
  let autoSync = $state(false);
  let syncInterval = $state(60);
  
  // 状态
  let authStatus = $state<'idle' | 'authenticating' | 'success' | 'error'>('idle');
  let syncDirection = $state<'upload' | 'download' | 'bidirectional'>('upload');
  let syncStatus = $state<'idle' | 'scanning' | 'syncing' | 'success' | 'error'>('idle');
  let errorMessage = $state('');
  let localFiles = $state<string[]>([]);
  let remoteFiles = $state<any[]>([]);
  let syncReport = $state<any>(null);
  let userConfirmed = $state(false);
  let submitting = $state(false);
  
  // 加载可用云平台
  onMounget(t)(async () => {
    availableProviders = cloudProviderRegistry.getAvailable();
    
    if (availableProviders.length > 0) {
      selectedProvider = availableProviders[0].provider;
      await selectProvider(selectedProvider);
    }
  });
  
  async function selectProvider(providerId: CloudProvider) {
    selectedProvider = providerId;
    currentProvider = cloudProviderRegistry.geget(t)(providerId);
    
    if (currentProvider) {
      // 初始化配置
      const config = currentProvider.getConfig();
      
      if (providerId === 'lark') {
        cliPath = config.cliPath || '/usr/bin/lark-cli';
        folderToken = config.folderToken || '';
        syncMode = config.syncMode || 'markdown';
      }
      
      appId = config.appId || '';
      appSecret = config.appSecret || '';
      autoSync = config.autoSync || false;
      syncInterval = config.syncInterval || 60;
    }
  }
  
  async function testAuth() {
    if (!currentProvider) return;
    
    authStatus = 'authenticating';
    errorMessage = '';
    
    try {
      // 设置配置
      const config = buildConfig();
      await currentProvider.setConfig(config);
      
      // 认证
      const success = await currentProvider.authenticate();
      authStatus = success ? 'success' : 'error';
      
      if (!success) {
        errorMessage = geget(t)(t)('larkSync.bindDialog.authFailed');
      }
    } catch (error) {
      authStatus = 'error';
      errorMessage = String(error);
    }
  }
  
  async function scanFiles() {
    if (!currentProvider) return;
    
    syncStatus = 'scanning';
    errorMessage = '';
    
    try {
      // 扫描本地文件
      localFiles = await scanLocalFiles(kb.path);
      
      // 扫描远程文件
      const files = await currentProvider.listFiles(folderToken);
      remoteFiles = files.map(f => ({
        name: f.name,
        size: f.size,
        lastModified: f.updatedAt,
      }));
      
      syncStatus = 'success';
    } catch (error) {
      syncStatus = 'error';
      errorMessage = String(error);
    }
  }
  
  async function performSync() {
    if (!currentProvider) return;
    
    submitting = true;
    syncStatus = 'syncing';
    errorMessage = '';
    
    try {
      const report = await currentProvider.sync({
        mode: syncDirection,
        localPath: kb.path,
        remoteFolderId: folderToken,
        conflictResolution: 'newer-wins',
      });
      
      syncReport = report;
      syncStatus = report.success ? 'success' : 'error';
      
      if (!report.success && report.errors.length > 0) {
        errorMessage = report.errors[0].error;
      }
      
      if (report.success) {
        step = 4;
      }
    } catch (error) {
      syncStatus = 'error';
      errorMessage = String(error);
    }
    
    submitting = false;
  }
  
  async function completeBinding() {
    if (!currentProvider) return;
    
    try {
      // 保存配置
      const config = buildConfig();
      await currentProvider.setConfig(config);
      
      // 添加绑定（可以扩展filesStore支持云平台绑定）
      // filesStore.addCloudBinding(kb.id, {
      //   provider: selectedProvider,
      //   remoteFolderId: folderToken,
      //   config,
      // });
      
      onClose();
    } catch (error) {
      errorMessage = String(error);
    }
  }
  
  function buildConfig(): Record<string, any> {
    if (selectedProvider === 'lark') {
      return platformAdapter.platform === 'tauri'
        ? { cliPath, folderToken, syncMode, autoSync, syncInterval }
        : { appId, appSecret, folderToken, syncMode, autoSync, syncInterval };
    }
    
    return { autoSync, syncInterval };
  }
  
  async function scanLocalFiles(path: string): Promise<string[]> {
    const files = await platformAdapter.fs.listFiles(path);
    return files.map(f => f.name || f.path);
  }
  
  function nextStep() {
    if (step < 3) step++;
  }
  
  function prevStep() {
    if (step > 1) step--;
  }
  
  function getProviderIcon(provider: CloudProvider): string {
    switch (provider) {
      case 'lark': return '飞书';
      case 'local': return '本地';
      case 'notion': return 'Notion';
      default: return provider;
    }
  }
</script>

<div class="cloud-bind-dialog">
  <div class="dialog-header">
    <h3>{get(t)('larkSync.bindDialog.title')}</h3>
    <button class="close-btn" onclick={onClose}>×</button>
  </div>
  
  <div class="dialog-content">
    {#if step === 1}
      <!-- 步骤1：选择云平台 -->
      <div class="step-section">
        <h4>{get(t)('larkSync.bindDialog.step1Title')}</h4>
        <p>{get(t)('larkSync.bindDialog.step1Desc')}</p>
        
        <div class="provider-list">
          {#each availableProviders as provider}
            <button
              class="provider-item"
              class:active={selectedProvider === provider.provider}
              onclick={() => selectProvider(provider.provider)}
            >
              <span class="provider-icon">{getProviderIcon(provider.provider)}</span>
              <span class="provider-name">{provider.displayName}</span>
              <small class="provider-desc">{provider.description}</small>
            </button>
          {/each}
        </div>
        
        {#if currentProvider}
          <div class="provider-capabilities">
            <h5>平台能力：</h5>
            <ul>
              {#if currentProvider.getCapabilities().supportsDocs}
                <li>✓ 飞书文档</li>
              {/if}
              {#if currentProvider.getCapabilities().supportsMarkdown}
                <li>✓ Markdown</li>
              {/if}
              {#if currentProvider.getCapabilities().supportsWiki}
                <li>✓ Wiki</li>
              {/if}
              {#if currentProvider.getCapabilities().supportsDrive}
                <li>✓ Drive文件</li>
              {/if}
            </ul>
          </div>
        {/if}
        
        <div class="step-actions">
          <button class="btn" onclick={onClose}>{get(t)('larkSync.bindDialog.cancel')}</button>
          <button class="btn-primary" onclick={nextStep}>{get(t)('larkSync.bindDialog.next')}</button>
        </div>
      </div>
    {:else if step === 2}
      <!-- 步骤2：配置与认证 -->
      <div class="step-section">
        <h4>{get(t)('larkSync.bindDialog.step2Title')}</h4>
        
        {#if selectedProvider === 'lark'}
          {#if platformAdapter.platform === 'tauri'}
            <!-- Tauri环境配置 -->
            <div class="config-form">
              <label>
                <span>{get(t)('larkSync.bindDialog.cliPath')}</span>
                <input type="text" bind:value={cliPath} placeholder="/usr/bin/lark-cli" />
              </label>
              
              <label>
                <span>{get(t)('larkSync.bindDialog.folderToken')}</span>
                <input type="text" bind:value={folderToken} placeholder="fldxxxxxxx" />
              </label>
              
              <label>
                <span>{get(t)('larkSync.bindDialog.syncMode')}</span>
                <select bind:value={syncMode}>
                  <option value="markdown">Markdown</option>
                  <option value="docs">飞书文档</option>
                  <option value="drive">Drive</option>
                </select>
              </label>
            </div>
          {:else}
            <!-- Web环境配置 -->
            <div class="config-form">
              <label>
                <span>飞书应用ID</span>
                <input type="text" bind:value={appId} placeholder="cli_xxxxxxxxxx" />
              </label>
              
              <label>
                <span>飞书应用密钥</span>
                <input type="password" bind:value={appSecret} placeholder="应用Secret" />
              </label>
              
              <label>
                <span>{get(t)('larkSync.bindDialog.folderToken')}</span>
                <input type="text" bind:value={folderToken} placeholder="fldxxxxxxx" />
              </label>
              
              <label>
                <span>{get(t)('larkSync.bindDialog.syncMode')}</span>
                <select bind:value={syncMode}>
                  <option value="markdown">Markdown</option>
                  <option value="docs">飞书文档</option>
                </select>
              </label>
            </div>
          {/if}
        {/if}
        
        <!-- 通用配置 -->
        <div class="config-form">
          <label>
            <span>{get(t)('larkSync.bindDialog.autoSync')}</span>
            <input type="checkbox" bind:checked={autoSync} />
          </label>
          
          {#if autoSync}
            <label>
              <span>{get(t)('larkSync.bindDialog.syncInterval')}</span>
              <input type="number" bind:value={syncInterval} min="10" max="600" />
              <small>分钟</small>
            </label>
          {/if}
        </div>
        
        <!-- 认证测试 -->
        <div class="auth-section">
          <button class="btn" onclick={testAuth}>
            {#if authStatus === 'authenticating'}
              {get(t)('larkSync.bindDialog.authenticating')}
            {:else}
              {get(t)('larkSync.bindDialog.testAuth')}
            {/if}
          </button>
          
          {#if authStatus === 'success'}
            <span class="auth-success">✓ {get(t)('larkSync.bindDialog.authSuccess')}</span>
          {:else if authStatus === 'error'}
            <span class="auth-error">✗ {errorMessage}</span>
          {/if}
        </div>
        
        <div class="step-actions">
          <button class="btn" onclick={prevStep}>{get(t)('larkSync.bindDialog.prev')}</button>
          <button class="btn-primary" onclick={nextStep} disabled={authStatus !== 'success'}>
            {get(t)('larkSync.bindDialog.next')}
          </button>
        </div>
      </div>
    {:else if step === 3}
      <!-- 步骤3：同步选择 -->
      <div class="step-section">
        <h4>{get(t)('larkSync.bindDialog.step3Title')}</h4>
        
        <div class="sync-direction">
          <label>
            <input type="radio" bind:group={syncDirection} value="upload" />
            <span>↑ {get(t)('larkSync.bindDialog.uploadMode')}</span>
            <small>本地文件上传到云端</small>
          </label>
          
          <label>
            <input type="radio" bind:group={syncDirection} value="download" />
            <span>↓ {get(t)('larkSync.bindDialog.downloadMode')}</span>
            <small>云端文件下载到本地</small>
          </label>
          
          <label>
            <input type="radio" bind:group={syncDirection} value="bidirectional" />
            <span>↔ 双向同步</span>
            <small>本地和云端双向同步</small>
          </label>
        </div>
        
        <button class="btn" onclick={scanFiles}>
          {#if syncStatus === 'scanning'}
            扫描中...
          {:else}
            扫描文件
          {/if}
        </button>
        
        {#if syncStatus === 'success'}
          <div class="file-preview">
            <div class="file-list-section">
              <h5>本地文件 ({localFiles.length})</h5>
              <ul>
                {#each localFiles.slice(0, 5) as file}
                  <li>{file}</li>
                {/each}
                {#if localFiles.length > 5}
                  <li>...还有 {localFiles.length - 5} 个文件</li>
                {/if}
              </ul>
            </div>
            
            <div class="file-list-section">
              <h5>云端文件 ({remoteFiles.length})</h5>
              <ul>
                {#each remoteFiles.slice(0, 5) as file}
                  <li>{file.name} ({file.size} bytes)</li>
                {/each}
                {#if remoteFiles.length > 5}
                  <li>...还有 {remoteFiles.length - 5} 个文件</li>
                {/if}
              </ul>
            </div>
          </div>
          
          <div class="confirm-section">
            <label>
              <input type="checkbox" bind:checked={userConfirmed} />
              <span>我确认执行同步操作</span>
            </label>
          </div>
        {/if}
        
        <div class="step-actions">
          <button class="btn" onclick={prevStep}>{get(t)('larkSync.bindDialog.prev')}</button>
          <button 
            class="btn-primary" 
            onclick={performSync}
            disabled={!userConfirmed || submitting}
          >
            {#if submitting}
              {get(t)('larkSync.bindDialog.syncing')}
            {:else}
              {get(t)('larkSync.bindDialog.startSync')}
            {/if}
          </button>
        </div>
      </div>
    {:else if step === 4}
      <!-- 步骤4：完成 -->
      <div class="step-section">
        <h4>{get(t)('larkSync.bindDialog.step4Title')}</h4>
        
        {#if syncReport}
          <div class="sync-report">
            <p class="success-message">✓ 同步完成！</p>
            
            <div class="report-stats">
              {#if syncDirection === 'upload' || syncDirection === 'bidirectional'}
                <div>上传文件：{syncReport.uploadedFiles} 个</div>
              {/if}
              {#if syncDirection === 'download' || syncDirection === 'bidirectional'}
                <div>下载文件：{syncReport.downloadedFiles} 个</div>
              {/if}
              <div>跳过文件：{syncReport.skippedFiles} 个</div>
              <div>失败文件：{syncReport.failedFiles} 个</div>
              <div>耗时：{(syncReport.duration / 1000).toFixed(1)} 秒</div>
            </div>
            
            {#if syncReport.errors.length > 0}
              <div class="error-list">
                <h5>错误详情：</h5>
                <ul>
                  {#each syncReport.errors as error}
                    <li>{error.file}: {error.error}</li>
                  {/each}
                </ul>
              </div>
            {/if}
          </div>
        {/if}
        
        <div class="step-actions">
          <button class="btn-primary" onclick={completeBinding}>
            {get(t)('larkSync.bindDialog.complete')}
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .cloud-bind-dialog {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 600px;
    max-width: 90vw;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    z-index: 1000;
  }
  
  .dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #eee;
  }
  
  .dialog-header h3 {
    margin: 0;
  }
  
  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #666;
  }
  
  .dialog-content {
    padding: 1.5rem;
  }
  
  .step-section h4 {
    margin: 0 0 1rem 0;
  }
  
  .provider-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin: 1rem 0;
  }
  
  .provider-item {
    display: flex;
    flex-direction: column;
    padding: 1rem;
    background: #f8f8f8;
    border: 2px solid #ddd;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .provider-item:hover {
    background: #f0f0f0;
  }
  
  .provider-item.active {
    border-color: #3498db;
    background: #e8f4f8;
  }
  
  .provider-icon {
    font-size: 1.2rem;
    font-weight: 600;
  }
  
  .provider-name {
    font-size: 0.9rem;
  }
  
  .provider-desc {
    color: #666;
    font-size: 0.8rem;
  }
  
  .config-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin: 1rem 0;
  }
  
  .config-form label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .config-form input,
  .config-form select {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  
  .auth-section {
    display: flex;
    gap: 1rem;
    align-items: center;
    margin: 1rem 0;
  }
  
  .auth-success {
    color: #27ae60;
  }
  
  .auth-error {
    color: #e74c3c;
  }
  
  .sync-direction {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin: 1rem 0;
  }
  
  .sync-direction label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .file-preview {
    display: flex;
    gap: 1rem;
    margin: 1rem 0;
    padding: 1rem;
    background: #f8f8f8;
    border-radius: 6px;
  }
  
  .file-list-section {
    flex: 1;
  }
  
  .file-list-section h5 {
    margin: 0 0 0.5rem 0;
  }
  
  .file-list-section ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .file-list-section li {
    padding: 0.25rem 0;
    color: #666;
  }
  
  .confirm-section {
    margin: 1rem 0;
  }
  
  .sync-report {
    margin: 1rem 0;
  }
  
  .success-message {
    color: #27ae60;
    font-size: 1.2rem;
    margin: 1rem 0;
  }
  
  .report-stats {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin: 1rem 0;
    padding: 1rem;
    background: #f8f8f8;
    border-radius: 6px;
  }
  
  .step-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1.5rem;
  }
  
  .btn {
    padding: 0.5rem 1rem;
    background: #95a5a6;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .btn:hover:noget(t)(:disabled) {
    background: #7f8c8d;
  }
  
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .btn-primary {
    padding: 0.5rem 1rem;
    background: #3498db;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .btn-primary:hover:noget(t)(:disabled) {
    background: #2980b9;
  }
  
  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>