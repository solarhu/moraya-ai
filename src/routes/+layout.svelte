<script lang="ts">
  import { platform } from '$lib/platform';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  
  onMount(() => {
    // 自动跳转到对应平台的页面
    if (platform === 'web') {
      goto('/web');
    } else {
      // Tauri端使用默认路由
    }
  });
</script>

<div class="platform-redirect">
  <p>正在检测平台...</p>
</div>

<style>
  .platform-redirect {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    font-size: var(--font-size-lg);
  }
</style>