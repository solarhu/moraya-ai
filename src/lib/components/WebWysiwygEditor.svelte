<script lang="ts">
  import { onMount } from 'svelte';
  
  let textarea: HTMLTextAreaElement;
  let previewElement: HTMLDivElement;
  let content = $state('');
  let isPreviewMode = $state(false);
  
  const DANGEROUS_PROTOCOLS = /^(javascript:|data:|vbscript:|file:)/i;
  
  export function setContent(md: string) {
    content = md;
    if (previewElement) {
      previewElement.innerHTML = markdownToHtml(md);
    }
  }
  
  export function getContent(): string {
    return content;
  }
  
  function escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  
  function markdownToHtml(md: string): string {
    const placeholders: string[] = [];
    function ph(content: string): string {
      const idx = placeholders.length;
      placeholders.push(content);
      return `\x00PH${idx}\x00`;
    }
    
    let html = md;
    
    // 1. Code blocks
    html = html.replace(/```([\w-]*)\n([\s\S]*?)```/g, (_m, lang, code) => {
      const escaped = escapeHtml(code.trimEnd());
      const langAttr = lang ? ` class="language-${lang}"` : '';
      return ph(`<pre><code${langAttr}>${escaped}</code></pre>`);
    });
    
    // 2. Math blocks
    html = html.replace(/\$\$([\s\S]*?)\$\$/g, (_m, tex) => {
      return ph(`<div class="math-block">${escapeHtml(tex.trim())}</div>`);
    });
    
    // 3. Inline math
    html = html.replace(/\$([^\$\n]+?)\$/g, (_m, tex) => {
      return ph(`<code class="math-inline">${escapeHtml(tex.trim())}</code>`);
    });
    
    // 4. Inline code
    html = html.replace(/`([^`]+)`/g, (_m, code) => {
      return ph(`<code>${escapeHtml(code)}</code>`);
    });
    
    // 5. Headers
    html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
    html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
    html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
    
    // 6. Bold & Italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // 7. Strikethrough
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
    
    // 8. Images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt, src) => {
      if (DANGEROUS_PROTOCOLS.test(src)) return '';
      return ph(`<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}">`);
    });
    
    // 9. Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text, href) => {
      if (DANGEROUS_PROTOCOLS.test(href)) return escapeHtml(text);
      return `<a href="${escapeHtml(href)}" target="_blank">${text}</a>`;
    });
    
    // 10. Horizontal rules
    html = html.replace(/^---$/gm, '<hr>');
    html = html.replace(/^\*\*\*$/gm, '<hr>');
    
    // 11. Blockquotes
    html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');
    
    // 12. Task list
    html = html.replace(/^(\s*)[-*]\s+\[x\]\s+(.+)$/gm, (_m, _indent, text) => {
      return ph(`<li class="task-item checked"><span class="task-checkbox">✓</span>${text}</li>`);
    });
    html = html.replace(/^(\s*)[-*]\s+\[ \]\s+(.+)$/gm, (_m, _indent, text) => {
      return ph(`<li class="task-item"><span class="task-checkbox">☐</span>${text}</li>`);
    });
    
    // 13. Lists
    html = html.replace(/^(\s*)[-*]\s+(.+)$/gm, '<li>$2</li>');
    html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');
    html = html.replace(/^(\s*)(\d+)\.\s+(.+)$/gm, '<li>$3</li>');
    html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, (match) => {
      if (match.includes('<ul>')) return match;
      return `<ol>${match}</ol>`;
    });
    
    // 14. Paragraphs
    html = html.replace(/^(?!<[a-zA-Z/]|\x00)(.+)$/gm, (match) => {
      const trimmed = match.trim();
      if (trimmed) {
        return `<p>${trimmed}</p>`;
      }
      return match;
    });
    
    // Restore placeholders
    for (let i = 0; i < placeholders.length; i++) {
      html = html.split(`\x00PH${i}\x00`).join(placeholders[i]);
    }
    
    // Clean up
    html = html.replace(/\n{3,}/g, '\n\n');
    
    return html;
  }
  
  function handleInput() {
    if (!textarea || !previewElement) return;
    
    content = textarea.value;
    previewElement.innerHTML = markdownToHtml(content);
  }
  
  onMount(() => {
    if (previewElement && content) {
      previewElement.innerHTML = markdownToHtml(content);
    }
  });
  
  function togglePreview() {
    isPreviewMode = !isPreviewMode;
  }
</script>

<div class="wysiwyg-container">
  <div class="mode-toggle">
    <button 
      class="toggle-btn" 
      class:active={!isPreviewMode}
      onclick={() => isPreviewMode = false}
    >
      编辑
    </button>
    <button 
      class="toggle-btn" 
      class:active={isPreviewMode}
      onclick={() => isPreviewMode = true}
    >
      预览
    </button>
  </div>
  
  {#if isPreviewMode}
    <div 
      bind:this={previewElement}
      class="preview-area"
    >
      {#if content}
        {@html markdownToHtml(content)}
      {:else}
        <div class="empty-hint">暂无内容</div>
      {/if}
    </div>
  {:else}
    <textarea
      bind:this={textarea}
      bind:value={content}
      oninput={handleInput}
      class="editor-textarea"
      placeholder="在此输入Markdown内容...

支持的语法：
# 标题
**粗体** *斜体*
- 列表
[链接](url)
![图片](url)
`代码`
```代码块```
> 引用"
    ></textarea>
  {/if}
</div>

<style>
  .wysiwyg-container {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  
  .mode-toggle {
    display: flex;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: #f5f5f5;
    border-bottom: 1px solid #ddd;
  }
  
  .toggle-btn {
    padding: 0.35rem 0.75rem;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;
  }
  
  .toggle-btn.active {
    background: #3498db;
    color: white;
    border-color: #3498db;
  }
  
  .editor-textarea {
    flex: 1;
    padding: 1rem;
    border: none;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
    font-size: 0.9rem;
    line-height: 1.6;
    resize: none;
    outline: none;
    background: white;
  }
  
  .preview-area {
    flex: 1;
    padding: 1rem;
    overflow-y: auto;
    background: white;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 0.9rem;
    line-height: 1.8;
  }
  
  .empty-hint {
    color: #999;
    text-align: center;
    padding: 2rem;
  }
  
  .preview-area :global(h1) {
    font-size: 2em;
    border-bottom: 1px solid #eee;
    padding-bottom: 0.3em;
    margin: 1em 0 0.5em 0;
  }
  
  .preview-area :global(h2) {
    font-size: 1.5em;
    margin: 1em 0 0.5em 0;
  }
  
  .preview-area :global(h3) {
    font-size: 1.25em;
    margin: 0.8em 0 0.4em 0;
  }
  
  .preview-area :global(code) {
    background: #f4f4f4;
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 0.85em;
  }
  
  .preview-area :global(pre) {
    background: #f4f4f4;
    padding: 1em;
    border-radius: 6px;
    overflow-x: auto;
    margin: 1em 0;
  }
  
  .preview-area :global(pre code) {
    background: none;
    padding: 0;
    font-size: 0.9em;
  }
  
  .preview-area :global(blockquote) {
    border-left: 3px solid #3498db;
    padding-left: 1em;
    color: #666;
    margin: 1em 0;
  }
  
  .preview-area :global(strong) {
    font-weight: 600;
  }
  
  .preview-area :global(em) {
    font-style: italic;
  }
  
  .preview-area :global(a) {
    color: #3498db;
    text-decoration: none;
  }
  
  .preview-area :global(a:hover) {
    text-decoration: underline;
  }
  
  .preview-area :global(ul) {
    padding-left: 2em;
    margin: 1em 0;
  }
  
  .preview-area :global(ol) {
    padding-left: 2em;
    margin: 1em 0;
  }
  
  .preview-area :global(li) {
    margin: 0.25em 0;
  }
  
  .preview-area :global(hr) {
    border: none;
    border-top: 1px solid #eee;
    margin: 2em 0;
  }
  
  .preview-area :global(img) {
    max-width: 100%;
    margin: 1em 0;
  }
  
  .preview-area :global(.task-item) {
    list-style: none;
    margin-left: -1.5em;
  }
  
  .preview-area :global(.task-checkbox) {
    display: inline-block;
    width: 1em;
    margin-right: 0.5em;
    font-family: monospace;
  }
  
  .preview-area :global(.math-block) {
    background: #f8f8f8;
    padding: 1em;
    text-align: center;
    margin: 1em 0;
    font-family: monospace;
  }
</style>