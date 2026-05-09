<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { detectPlatform } from '$lib/platform/platform-detector';
  
  let platform: 'tauri' | 'web' | null = null;
  
  onMount(() => {
    platform = detectPlatform();
    
    // 只在根路由时自动跳转到web端
    if (platform === 'web' && $page.url.pathname === '/') {
      goto('/web');
    }
  });
</script>

{#if platform === null && $page.url.pathname === '/'}
  <div class="platform-redirect">
    <p>正在检测平台...</p>
  </div>
{:else}
  <slot />
{/if}

<style>
  .platform-redirect {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    font-size: 1.2rem;
  }
</style>