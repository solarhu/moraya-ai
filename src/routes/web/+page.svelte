<script lang="ts">
  import { onMount } from 'svelte';
  import { webFileSystem } from '$lib/platform/web-filesystem';
  import WebWysiwygEditor from '$lib/components/WebWysiwygEditor.svelte';
  import LarkSyncDialog from '$lib/components/LarkSyncDialog.svelte';
  
  let mounted = $state(false);
  let files = $state<Array<{ path: string; name: string; size: number; lastModified: number }>>([]);
  let currentFile = $state<string | null>(null);
  let isNewFile = $state(false);
  let newFileName = $state('');
  let showNewFileDialog = $state(false);
  let editorRef: WebWysiwygEditor;
  let larkDialogRef: LarkSyncDialog;
  
  onMount(async () => {
    mounted = true;
    await loadFiles();
  });
  
  async function loadFiles() {
    try {
      await webFileSystem.init();
      const fileList = await webFileSystem.listFiles();
      files = fileList.map(f => ({
        path: f.path,
        name: f.name || f.path.split('/').pop() || f.path,
        size: f.size || 0,
        lastModified: f.lastModified || Date.now(),
      }));
    } catch (e) {
      console.error('加载文件列表失败:', e);
    }
  }
  
  async function openFile(path: string) {
    try {
      const content = await webFileSystem.readFile(path);
      currentFile = path;
      if (editorRef) {
        editorRef.setContent(content);
      }
      isNewFile = false;
    } catch (e) {
      console.error('打开文件失败:', e);
    }
  }
  
  async function saveCurrentFile() {
    if (!currentFile || !editorRef) return;
    
    try {
      const content = editorRef.getContent();
      await webFileSystem.writeFile(currentFile, content);
      await loadFiles();
    } catch (e) {
      console.error('保存失败:', e);
    }
  }
  
  async function createNewFile() {
    if (!newFileName.trim()) return;
    
    const path = newFileName.endsWith('.md') ? newFileName : `${newFileName}.md`;
    const initialContent = '# ' + newFileName + '\n\n在这里开始编辑...\n';
    
    currentFile = path;
    isNewFile = true;
    showNewFileDialog = false;
    newFileName = '';
    
    await webFileSystem.writeFile(path, initialContent);
    if (editorRef) {
      editorRef.setContent(initialContent);
    }
    await loadFiles();
  }
  
  async function deleteFile(path: string) {
    if (!confirm(`确定删除 ${path}?`)) return;
    
    try {
      await webFileSystem.deleteFile(path);
      if (currentFile === path) {
        currentFile = null;
        if (editorRef) {
          editorRef.setContent('');
        }
      }
      await loadFiles();
    } catch (e) {
      console.error('删除失败:', e);
    }
  }
  
  async function uploadFile() {
    try {
      const file = await webFileSystem.pickFile();
      if (file) {
        currentFile = file.path;
        if (editorRef) {
          editorRef.setContent(file.content || '');
        }
        await loadFiles();
      }
    } catch (e) {
      console.error('上传失败:', e);
    }
  }
  
  async function downloadCurrentFile() {
    if (!currentFile || !editorRef) return;
    const content = editorRef.getContent();
    await webFileSystem.downloadFile(currentFile, content);
  }
  
  function formatSize(size: number): string {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  }
</script>

<svelte:head>
  <title>Moraya Web - 所见即所得Markdown编辑器</title>
</svelte:head>

<div class="web-editor">
  <header class="header">
    <div class="header-left">
      <h1>Moraya Web</h1>
      <p>所见即所得Markdown编辑器</p>
    </div>
    <a href="/web/settings" class="settings-link">设置</a>
  </header>
  
  {#if !mounted}
    <div class="loading">加载中...</div>
  {:else}
    <div class="main-container">
      <aside class="sidebar">
        <div class="sidebar-header">
          <h3>文件列表</h3>
          <button class="btn-icon" onclick={() => showNewFileDialog = true}>+</button>
        </div>
        
        <div class="file-actions">
          <button class="btn-sm" onclick={uploadFile}>上传文件</button>
        </div>
        
        <ul class="file-list">
          {#each files as file (file.path)}
            <li class="file-item" class:active={currentFile === file.path}>
              <div class="file-info" onclick={() => openFile(file.path)}>
                <span class="file-name">{file.name}</span>
                <span class="file-meta">{formatSize(file.size)}</span>
              </div>
              <button class="btn-delete" onclick={() => deleteFile(file.path)}>×</button>
            </li>
          {:else}
            <li class="empty">暂无文件</li>
          {/each}
        </ul>
      </aside>
      
      <main class="editor-area">
        {#if currentFile}
<div class="editor-header">
              <span class="current-file">{currentFile}</span>
              <div class="editor-actions">
                <button class="btn btn-lark" onclick={() => {
                  const fileName = currentFile?.split('/').pop() || '未命名文档';
                  const content = editorRef?.getContent() || '';
                  if (larkDialogRef) {
                    larkDialogRef.show(fileName, content);
                  }
                }}>飞书</button>
                <button class="btn" onclick={saveCurrentFile}>保存 (Ctrl+S)</button>
                <button class="btn" onclick={downloadCurrentFile}>下载</button>
              </div>
            </div>
          
          <WebWysiwygEditor bind:this={editorRef} />
        {:else}
          <div class="welcome">
            <h2>欢迎使用 Moraya Web</h2>
            <p>所见即所得的Markdown编辑器，实时渲染你的内容</p>
            <div class="quick-actions">
              <button class="btn" onclick={() => showNewFileDialog = true}>新建文件</button>
              <button class="btn" onclick={uploadFile}>上传文件</button>
            </div>
          </div>
        {/if}
      </main>
    </div>
  {/if}
  
  {#if showNewFileDialog}
    <div class="dialog-overlay" onclick={() => showNewFileDialog = false}>
      <div class="dialog" onclick={(e) => e.stopPropagation()}>
        <h3>新建文件</h3>
        <input
          type="text"
          bind:value={newFileName}
          placeholder="文件名（自动添加.md后缀）"
          class="input"
        />
        <div class="dialog-actions">
          <button class="btn" onclick={() => showNewFileDialog = false}>取消</button>
          <button class="btn-primary" onclick={createNewFile}>创建</button>
        </div>
      </div>
    </div>
  {/if}
  
  <LarkSyncDialog bind:this={larkDialogRef} />
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    background: #f5f5f5;
  }
  
  .web-editor {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  
  .header {
    background: #2c3e50;
    color: white;
    padding: 1rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .header-left h1 {
    margin: 0;
    font-size: 1.5rem;
  }
  
  .header-left p {
    margin: 0.5rem 0 0 0;
    font-size: 0.9rem;
    opacity: 0.8;
  }
  
  .settings-link {
    color: white;
    text-decoration: none;
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    font-size: 0.9rem;
  }
  
  .settings-link:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  .loading {
    padding: 2rem;
    text-align: center;
    color: #666;
  }
  
  .main-container {
    display: flex;
    flex: 1;
    height: calc(100vh - 80px);
  }
  
  .sidebar {
    width: 250px;
    background: white;
    border-right: 1px solid #ddd;
    display: flex;
    flex-direction: column;
  }
  
  .sidebar-header {
    padding: 1rem;
    border-bottom: 1px solid #ddd;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .sidebar-header h3 {
    margin: 0;
    font-size: 1rem;
  }
  
  .file-actions {
    padding: 0.5rem 1rem;
  }
  
  .file-list {
    list-style: none;
    padding: 0;
    margin: 0;
    overflow-y: auto;
    flex: 1;
  }
  
  .file-item {
    display: flex;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #eee;
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .file-item:hover {
    background: #f8f8f8;
  }
  
  .file-item.active {
    background: #e8f4f8;
    border-left: 3px solid #3498db;
  }
  
  .file-info {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  
  .file-name {
    font-size: 0.9rem;
    color: #333;
  }
  
  .file-meta {
    font-size: 0.75rem;
    color: #999;
    margin-top: 0.25rem;
  }
  
  .btn-delete {
    background: transparent;
    border: none;
    color: #e74c3c;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0.25rem;
    opacity: 0.5;
  }
  
  .btn-delete:hover {
    opacity: 1;
  }
  
  .empty {
    padding: 1rem;
    color: #999;
    text-align: center;
  }
  
  .editor-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: white;
  }
  
  .editor-header {
    padding: 1rem;
    border-bottom: 1px solid #ddd;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .current-file {
    font-weight: 500;
    color: #2c3e50;
  }
  
  .editor-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .welcome {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    color: #666;
  }
  
  .welcome h2 {
    margin-bottom: 1rem;
    color: #2c3e50;
  }
  
  .welcome p {
    margin-bottom: 2rem;
  }
  
  .quick-actions {
    display: flex;
    gap: 1rem;
  }
  
  .btn {
    padding: 0.5rem 1rem;
    background: #3498db;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
  }
  
  .btn:hover {
    background: #2980b9;
  }
  
  .btn-lark {
    background: #ff6b35;
  }
  
  .btn-lark:hover {
    background: #e55a2b;
  }
  
  .btn-primary {
    padding: 0.5rem 1rem;
    background: #27ae60;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
  }
  
  .btn-primary:hover {
    background: #229954;
  }
  
  .btn-sm {
    padding: 0.35rem 0.75rem;
    background: #95a5a6;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;
  }
  
  .btn-sm:hover {
    background: #7f8c8d;
  }
  
  .btn-icon {
    background: transparent;
    border: none;
    color: #3498db;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
  }
  
  .btn-icon:hover {
    color: #2980b9;
  }
  
  .dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .dialog {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    min-width: 300px;
  }
  
  .dialog h3 {
    margin: 0 0 1rem 0;
  }
  
  .input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.9rem;
    margin-bottom: 1rem;
  }
  
  .dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }
</style>