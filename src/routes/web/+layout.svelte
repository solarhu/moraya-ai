<script lang="ts">
  import '../styles/global.css';
  import '../styles/editor.css';
  import 'katex/dist/katex.min.css';
  
  let { children } = $props();
</script>

<div class="web-app">
  <div class="web-container">
    {@render children?.()}
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    background: var(--bg-primary);
    color: var(--text-primary);
  }
  
  .web-app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  
  .web-container {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
</style>