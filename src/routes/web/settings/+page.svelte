<script lang="ts">
  import { onMount } from 'svelte';
  import { webStorage } from '$lib/platform/web-storage';
  
  let mounted = $state(false);
  let apiKey = $state('');
  let apiEndpoint = $state('https://api.openai.com/v1');
  let model = $state('gpt-3.5-turbo');
  let saved = $state(false);
  
  const models = [
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    { id: 'gpt-4', name: 'GPT-4' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
    { id: 'claude-3-opus', name: 'Claude 3 Opus' },
    { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet' },
    { id: 'claude-3-haiku', name: 'Claude 3 Haiku' },
  ];
  
  onMount(async () => {
    mounted = true;
    
    apiKey = await webStorage.get('ai-api-key') || '';
    apiEndpoint = await webStorage.get('ai-endpoint') || 'https://api.openai.com/v1';
    model = await webStorage.get('ai-model') || 'gpt-3.5-turbo';
  });
  
  async function saveSettings() {
    await webStorage.set('ai-api-key', apiKey);
    await webStorage.set('ai-endpoint', apiEndpoint);
    await webStorage.set('ai-model', model);
    
    saved = true;
    setTimeout(() => saved = false, 2000);
  }
  
  async function clearSettings() {
    await webStorage.delete('ai-api-key');
    await webStorage.delete('ai-endpoint');
    await webStorage.delete('ai-model');
    
    apiKey = '';
    apiEndpoint = 'https://api.openai.com/v1';
    model = 'gpt-3.5-turbo';
  }
</script>

<svelte:head>
  <title>Moraya Web - 设置</title>
</svelte:head>

<div class="settings-page">
  <header class="header">
    <h1>设置</h1>
    <a href="/web" class="back-link">← 返回编辑器</a>
  </header>
  
  {#if !mounted}
    <div class="loading">加载中...</div>
  {:else}
    <div class="settings-container">
      <section class="settings-section">
        <h2>AI对话配置</h2>
        
        <div class="setting-item">
          <label>API Key</label>
          <input
            type="password"
            bind:value={apiKey}
            placeholder="输入你的API Key"
            class="input"
          />
          <p class="hint">API Key将保存在浏览器本地存储中</p>
        </div>
        
        <div class="setting-item">
          <label>API Endpoint</label>
          <input
            type="text"
            bind:value={apiEndpoint}
            placeholder="https://api.openai.com/v1"
            class="input"
          />
          <p class="hint">支持OpenAI、Claude或其他兼容API</p>
        </div>
        
        <div class="setting-item">
          <label>模型</label>
          <select bind:value={model} class="select">
            {#each models as m}
              <option value={m.id}>{m.name}</option>
            {/each}
          </select>
        </div>
        
        <div class="actions">
          <button class="btn-primary" onclick={saveSettings}>
            {#if saved}
              ✓ 已保存
            {:else}
              保存设置
            {/if}
          </button>
          <button class="btn" onclick={clearSettings}>清除设置</button>
        </div>
      </section>
      
      <section class="settings-section">
        <h2>数据管理</h2>
        
        <div class="setting-item">
          <label>IndexedDB存储</label>
          <p class="hint">所有文件和设置保存在浏览器IndexedDB中</p>
          <button class="btn-danger" onclick={() => {
            if (confirm('确定清除所有数据？这将删除所有文件和设置！')) {
              indexedDB.deleteDatabase('moraya-web');
              location.reload();
            }
          }}>清除所有数据</button>
        </div>
      </section>
      
      <section class="settings-section">
        <h2>关于</h2>
        <p class="about-text">
          Moraya Web 是 Moraya 多终端AI协同Markdown平台的浏览器版本。
          所有数据保存在本地，无需服务器。
        </p>
        <p class="version">版本: v0.3</p>
      </section>
    </div>
  {/if}
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    background: #f5f5f5;
  }
  
  .settings-page {
    min-height: 100vh;
  }
  
  .header {
    background: #2c3e50;
    color: white;
    padding: 1rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .header h1 {
    margin: 0;
    font-size: 1.5rem;
  }
  
  .back-link {
    color: white;
    text-decoration: none;
    opacity: 0.8;
  }
  
  .back-link:hover {
    opacity: 1;
  }
  
  .loading {
    padding: 2rem;
    text-align: center;
    color: #666;
  }
  
  .settings-container {
    max-width: 600px;
    margin: 2rem auto;
    padding: 0 1rem;
  }
  
  .settings-section {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .settings-section h2 {
    margin: 0 0 1.5rem 0;
    color: #2c3e50;
    font-size: 1.2rem;
    border-bottom: 2px solid #3498db;
    padding-bottom: 0.5rem;
  }
  
  .setting-item {
    margin-bottom: 1.5rem;
  }
  
  .setting-item label {
    display: block;
    font-weight: 500;
    color: #333;
    margin-bottom: 0.5rem;
  }
  
  .input, .select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.9rem;
  }
  
  .input:focus, .select:focus {
    outline: none;
    border-color: #3498db;
  }
  
  .hint {
    color: #999;
    font-size: 0.85rem;
    margin-top: 0.5rem;
  }
  
  .actions {
    display: flex;
    gap: 1rem;
  }
  
  .btn {
    padding: 0.75rem 1.5rem;
    background: #95a5a6;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
  }
  
  .btn:hover {
    background: #7f8c8d;
  }
  
  .btn-primary {
    padding: 0.75rem 1.5rem;
    background: #3498db;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
  }
  
  .btn-primary:hover {
    background: #2980b9;
  }
  
  .btn-danger {
    padding: 0.75rem 1.5rem;
    background: #e74c3c;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
  }
  
  .btn-danger:hover {
    background: #c0392b;
  }
  
  .about-text {
    color: #666;
    line-height: 1.6;
  }
  
  .version {
    color: #999;
    font-size: 0.85rem;
    margin-top: 1rem;
  }
</style>