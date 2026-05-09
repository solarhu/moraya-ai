<script lang="ts">
  import { onMount } from 'svelte';
  
  let mounted = $state(false);
  let message = $state('正在初始化...');
  let currentFile = $state<string | null>(null);
  let fileContent = $state<string>('# Hello Moraya Web\n\n欢迎使用Moraya Web版！\n');
  
  onMount(async () => {
    mounted = true;
    message = '页面加载成功！';
    
    try {
      // 测试IndexedDB是否可用
      const { webFileSystem } = await import('$lib/platform/web-filesystem');
      await webFileSystem.init();
      message = 'IndexedDB初始化成功！';
      
      // 尝试加载测试文件
      try {
        await webFileSystem.writeFile('test.md', '# Test File\n\nThis is a test.');
        const content = await webFileSystem.readFile('test.md');
        currentFile = 'test.md';
        fileContent = content;
        message = '测试文件读写成功！';
      } catch (e) {
        message = '文件操作测试失败：' + String(e);
      }
    } catch (e) {
      message = 'IndexedDB初始化失败：' + String(e);
    }
  });
  
  async function handleDownload() {
    const blob = new Blob([fileContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile || 'document.md';
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<svelte:head>
  <title>Moraya Web Test</title>
</svelte:head>

<div class="simple-page">
  <h1>Moraya Web 简化测试页</h1>
  
  <div class="status">
    <p>{message}</p>
  </div>
  
  {#if mounted}
    <div class="editor-area">
      <h3>Markdown内容：</h3>
      <textarea bind:value={fileContent} rows="10" cols="50"></textarea>
      
      <div class="actions">
        <button onclick={handleDownload}>下载文件</button>
      </div>
    </div>
  {:else}
    <p>加载中...</p>
  {/if}
</div>

<style>
  .simple-page {
    padding: 2rem;
    max-width: 800px;
    margin: 0 auto;
  }
  
  h1 {
    color: #333;
  }
  
  .status {
    padding: 1rem;
    background: #f0f0f0;
    border-radius: 8px;
    margin: 1rem 0;
  }
  
  .editor-area {
    margin-top: 2rem;
  }
  
  textarea {
    width: 100%;
    padding: 1rem;
    font-family: monospace;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  
  .actions {
    margin-top: 1rem;
  }
  
  button {
    padding: 0.5rem 1rem;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  button:hover {
    background: #45a049;
  }
</style>