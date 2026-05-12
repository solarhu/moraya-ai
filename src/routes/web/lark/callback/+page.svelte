<script lang="ts">
  import { onMount } from 'svelte';
  import { platformAdapter } from '$lib/platform';
  import { cloudProviderRegistry } from '$lib/cloud-platform';
  
  let status = $state<'loading' | 'success' | 'error'>('loading');
  let errorMessage = $state('');
  
  onMount(async () => {
    try {
      // 从URL获取授权码
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      
      if (!code) {
        status = 'error';
        errorMessage = '未获取到授权码';
        return;
      }
      
      // 获取飞书适配器
      const larkProvider = cloudProviderRegistry.get('lark');
      if (!larkProvider) {
        status = 'error';
        errorMessage = '飞书适配器未注册';
        return;
      }
      
      // 获取配置
      const appId = await platformAdapter.storage.get('lark-app-id');
      const appSecret = await platformAdapter.storage.get('lark-app-secret');
      
      if (!appId || !appSecret) {
        status = 'error';
        errorMessage = '飞书应用配置缺失';
        return;
      }
      
      // 使用code换取access_token
      const tokenResponse = await fetch('https://open.feishu.cn/open-apis/authen/v1/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app_id: appId,
          app_secret: appSecret,
          grant_type: 'authorization_code',
          code: code,
        }),
      });
      
      const tokenData = await tokenResponse.json();
      
      if (tokenData.code !== 0) {
        status = 'error';
        errorMessage = `获取Token失败: ${tokenData.msg}`;
        return;
      }
      
      const accessToken = tokenData.data.access_token;
      const refreshToken = tokenData.data.refresh_token;
      const expiresIn = tokenData.data.expires_in;
      
      // 保存token到localStorage
      await platformAdapter.storage.set('lark-access-token', accessToken);
      await platformAdapter.storage.set('lark-refresh-token', refreshToken);
      await platformAdapter.storage.set('lark-token-expires', Date.now() + expiresIn * 1000);
      
      // 发送消息给父窗口
      if (window.opener) {
        window.opener.postMessage({
          type: 'lark-auth-success',
          accessToken: accessToken,
        }, window.location.origin);
        
        // 关闭窗口
        window.close();
      } else {
        // 没有父窗口，跳转到主页面
        status = 'success';
        setTimeout(() => {
          window.location.href = '/web';
        }, 2000);
      }
    } catch (error) {
      status = 'error';
      errorMessage = String(error);
    }
  });
</script>

<svelte:head>
  <title>飞书认证回调</title>
</svelte:head>

<div class="callback-page">
  {#if status === 'loading'}
    <div class="loading">
      <div class="spinner"></div>
      <p>正在处理飞书认证...</p>
    </div>
  {:else if status === 'success'}
    <div class="success">
      <div class="success-icon">✓</div>
      <h2>认证成功</h2>
      <p>正在跳转到主页面...</p>
    </div>
  {:else if status === 'error'}
    <div class="error">
      <div class="error-icon">✗</div>
      <h2>认证失败</h2>
      <p class="error-message">{errorMessage}</p>
      <button onclick={() => window.location.href = '/web/settings'}>
        返回设置页面
      </button>
    </div>
  {/if}
</div>

<style>
  .callback-page {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: #f5f5f5;
  }
  
  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .success, .error {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 2rem;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }
  
  .success-icon {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: #27ae60;
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 2rem;
  }
  
  .error-icon {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: #e74c3c;
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 2rem;
  }
  
  h2 {
    margin: 0;
  }
  
  .error-message {
    color: #666;
    margin: 0.5rem 0;
  }
  
  button {
    padding: 0.75rem 1.5rem;
    background: #3498db;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  button:hover {
    background: #2980b9;
  }
</style>