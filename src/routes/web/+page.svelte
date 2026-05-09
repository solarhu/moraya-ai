<script lang="ts">
  import { onMount } from 'svelte';
  import { platform, platformInfo } from '$lib/platform';
  import { webFileSystem } from '$lib/platform/web-filesystem';
  import { webDialog } from '$lib/platform/web-dialog';
  import { webStorage } from '$lib/platform/web-storage';
  import { t } from '$lib/i18n';
  
  let mounted = $state(false);
  let currentFile = $state<string | null>(null);
  let fileContent = $state<string>('# Hello Moraya Web\n\n欢迎使用Moraya Web版！\n\n这是一个简单的Markdown编辑器演示。\n');
  let saving = $state(false);
  let files = $state<any[]>([]);
  
  onMount(async () => {
    mounted = true;
    
    // 初始化IndexedDB文件系统
    await webFileSystem.init();
    
    // 加载文件列表
    files = await webFileSystem.listFiles();
    
    // 尝试加载上次打开的文件
    const lastFile = await webStorage.get<string>('last-file');
    if (lastFile) {
      try {
        const content = await webFileSystem.readFile(lastFile);
        currentFile = lastFile;
        fileContent = content;
      } catch (e) {
        // 文件不存在，忽略
      }
    }
  });
  
  async function handleOpenFile() {
    try {
      const result = await webFileSystem.pickFile();
      if (result) {
        currentFile = result.name;
        fileContent = result.content || '';
        
        // 保存到IndexedDB
        await webFileSystem.writeFile(result.name, fileContent);
        
        // 记录上次打开的文件
        await webStorage.set('last-file', result.name);
        
        // 更新文件列表
        files = await webFileSystem.listFiles();
      }
    } catch (e) {
      console.error('Open file failed:', e);
    }
  }
  
  async function handleSaveFile() {
    if (!currentFile) {
      // 新文件，提示输入文件名
      const filename = await webDialog.saveFile({ defaultPath: 'untitled.md' });
      if (filename) {
        currentFile = filename;
      } else {
        return;
      }
    }
    
    saving = true;
    
    try {
      await webFileSystem.writeFile(currentFile, fileContent);
      await webStorage.set('last-file', currentFile);
      
      // 更新文件列表
      files = await webFileSystem.listFiles();
    } catch (e) {
      console.error('Save file failed:', e);
      await webDialog.message('保存失败：' + String(e));
    }
    
    saving = false;
  }
  
  async function handleDownloadFile() {
    if (!currentFile) {
      await webDialog.message('请先打开或创建文件');
      return;
    }
    
    await webFileSystem.downloadFile(currentFile, fileContent);
  }
  
  async function handleNewFile() {
    const filename = await webDialog.saveFile({ defaultPath: 'untitled.md' });
    if (filename) {
      currentFile = filename;
      fileContent = '';
      await webFileSystem.writeFile(filename, fileContent);
      await webStorage.set('last-file', filename);
      
      // 更新文件列表
      files = await webFileSystem.listFiles();
    }
  }
  
  async function handleDeleteFile(filename: string) {
    const confirmed = await webDialog.confirm('确认删除文件：' + filename);
    if (confirmed) {
      await webFileSystem.deleteFile(filename);
      files = await webFileSystem.listFiles();
      
      if (currentFile === filename) {
        currentFile = null;
        fileContent = '';
      }
    }
  }
  
  async function handleLoadFile(filename: string) {
    try {
      const content = await webFileSystem.readFile(filename);
      currentFile = filename;
      fileContent = content;
      await webStorage.set('last-file', filename);
    } catch (e) {
      await webDialog.message('加载失败：' + String(e));
    }
  }
</script>

<svelte:head>
  <title>Moraya Web - Markdown Editor</title>
  <meta name="description" content="Web版Markdown编辑器" />
</svelte:head>

<div class="web-layout">
  <header class="web-header">
    <div class="header-title">
      <h1>Moraya Web</h1>
      <span class="platform-badge">{platformInfo.browser || 'Web'} {platformInfo.isMobile ? '📱' : '🖥️'}</span>
    </div>
    
    <div class="header-actions">
      <button class="btn btn-primary" onclick={handleNewFile}>
        新建 📄
      </button>
      
      <button class="btn btn-secondary" onclick={handleOpenFile}>
        打开 📂
      </button>
      
      <button class="btn btn-secondary" onclick={handleSaveFile} disabled={saving}>
        {saving ? '保存中...' : '保存'} 💾
      </button>
      
      <button class="btn btn-secondary" onclick={handleDownloadFile}>
        下载 ⬇️
      </button>
    </div>
  </header>
  
  <div class="web-sidebar">
    <h3>文件列表（IndexedDB）</h3>
    
    {#if files.length === 0}
      <p class="empty-hint">暂无文件，请打开或新建文件</p>
    {:else}
      <ul class="file-list">
        {#each files as file (file.path)}
          <li class:active={currentFile === file.path}>
            <span class="file-name" onclick={() => handleLoadFile(file.path)}>
              {file.name}
            </span>
            <button class="btn-delete" onclick={() => handleDeleteFile(file.path)}>🗑️</button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
  
  <main class="web-main">
    {#if mounted}
      <div class="editor-wrapper">
        <div class="current-file">
          {#if currentFile}
            <span>当前文件：{currentFile}</span>
          {:else}
            <span>未选择文件</span>
          {/if}
        </div>
        
        <textarea
          bind:value={fileContent}
          class="markdown-editor"
          placeholder="输入Markdown内容..."
        ></textarea>
      </div>
    {:else}
      <div class="loading">
        <p>正在初始化...</p>
      </div>
    {/if}
  </main>
  
  <footer class="web-footer">
    <p>平台：{platform} | 浏览器：{platformInfo.browser || 'unknown'} | 移动端：{platformInfo.isMobile ? '是' : '否'}</p>
  </footer>
</div>

<style>
  .web-layout {
    display: grid;
    grid-template-rows: auto 1fr auto;
    grid-template-columns: 250px 1fr;
    grid-template-areas:
      "header header"
      "sidebar main"
      "footer footer";
    height: 100vh;
    overflow: hidden;
  }
  
  .web-header {
    grid-area: header;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 1rem;
    background: var(--bg-primary);
    border-bottom: 1px solid var(--border-color);
    z-index: 10;
  }
  
  .header-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .header-title h1 {
    font-size: var(--font-size-lg);
    font-weight: 600;
    margin: 0;
  }
  
  .platform-badge {
    font-size: var(--font-size-xs);
    padding: 0.25rem 0.5rem;
    background: var(--bg-secondary);
    border-radius: 4px;
  }
  
  .header-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .btn {
    padding: 0.5rem 1rem;
    font-size: var(--font-size-sm);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .btn-primary {
    background: var(--accent-color);
    color: white;
    border: none;
  }
  
  .btn-primary:hover {
    opacity: 0.9;
  }
  
  .btn-secondary {
    background: var(--bg-secondary);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
  }
  
  .btn-secondary:hover {
    background: var(--bg-hover);
  }
  
  .btn-secondary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .web-sidebar {
    grid-area: sidebar;
    padding: 1rem;
    background: var(--bg-secondary);
    border-right: 1px solid var(--border-color);
    overflow-y: auto;
  }
  
  .web-sidebar h3 {
    margin-top: 0;
    font-size: var(--font-size-sm);
  }
  
  .empty-hint {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
  }
  
  .file-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .file-list li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .file-list li:hover {
    background: var(--bg-hover);
  }
  
  .file-list li.active {
    background: var(--accent-color);
    color: white;
  }
  
  .file-name {
    flex: 1;
    font-size: var(--font-size-sm);
  }
  
  .btn-delete {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
  }
  
  .web-main {
    grid-area: main;
    padding: 1rem;
    overflow-y: auto;
  }
  
  .editor-wrapper {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .current-file {
    font-size: var(--font-size-sm);
    color: var(--text-muted);
  }
  
  .markdown-editor {
    flex: 1;
    width: 100%;
    padding: 1rem;
    font-family: monospace;
    font-size: var(--font-size-base);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    resize: none;
    background: var(--bg-primary);
    color: var(--text-primary);
  }
  
  .markdown-editor:focus {
    outline: 2px solid var(--accent-color);
  }
  
  .web-footer {
    grid-area: footer;
    padding: 0.25rem 1rem;
    background: var(--bg-secondary);
    border-top: 1px solid var(--border-color);
    font-size: var(--font-size-xs);
  }
  
  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }
  
  @media (max-width: 768px) {
    .web-layout {
      grid-template-columns: 1fr;
      grid-template-areas:
        "header"
        "main"
        "footer";
    }
    
    .web-sidebar {
      display: none;
    }
    
    .web-header {
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .header-actions {
      width: 100%;
      justify-content: space-between;
    }
    
    .btn {
      padding: 0.4rem 0.8rem;
      font-size: var(--font-size-xs);
    }
  }
</style>