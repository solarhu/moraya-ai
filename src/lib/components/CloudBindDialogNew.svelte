<script lang="ts">
  import { onMount } from 'svelte';
  import { authApi, cloudApi } from '$lib/api';
  import type { CloudStatus, LarkDocument } from '$lib/api';

  let { kb, onClose }: { kb: { id: string; name: string }; onClose: () => void } = $props();

  let step = $state(1);
  let status = $state<CloudStatus | null>(null);
  let errorMessage = $state('');
  let loading = $state(false);
  let authUrl = $state('');
  let createdDocument = $state<LarkDocument | null>(null);
  
  onMount(async () => {
    await checkStatus();
  });

  async function checkStatus() {
    loading = true;
    errorMessage = '';
    
    try {
      if (!authApi.isLoggedIn()) {
        step = 0;
        return;
      }

      const response = await cloudApi.getStatus();
      
      if (response.success && response.data) {
        status = response.data;
        if (response.data.larkAuthenticated) {
          step = 2;
        } else {
          step = 1;
        }
      } else {
        errorMessage = response.error || '获取状态失败';
      }
    } catch (error) {
      errorMessage = String(error);
    } finally {
      loading = false;
    }
  }

  async function startAuth() {
    loading = true;
    
    try {
      const response = await cloudApi.startLarkAuth();
      if (response.success && response.data?.loginUrl) {
        authUrl = response.data.loginUrl;
        step = 1.5;
      }
    } catch (error) {
      errorMessage = String(error);
    } finally {
      loading = false;
    }
  }

  async function verifyAuth() {
    loading = true;
    
    try {
      const response = await cloudApi.getLarkAuthStatus();
      if (response.success && response.data?.authenticated) {
        step = 2;
      } else {
        errorMessage = '认证未完成';
      }
    } catch (error) {
      errorMessage = String(error);
    } finally {
      loading = false;
    }
  }

  async function createDocument() {
    loading = true;
    
    try {
      const response = await cloudApi.createDocument(kb.name, `# ${kb.name}\n\n来自Moraya的文档`);
      if (response.success && response.data) {
        createdDocument = response.data;
        step = 3;
      } else {
        errorMessage = response.error || '创建失败';
      }
    } catch (error) {
      errorMessage = String(error);
    } finally {
      loading = false;
    }
  }

  async function register() {
    const email = prompt('邮箱:');
    const password = prompt('密码:');
    if (!email || !password) return;
    
    loading = true;
    try {
      await authApi.register(email, password);
      await checkStatus();
    } catch (error) {
      errorMessage = String(error);
    } finally {
      loading = false;
    }
  }
</script>

<div class="overlay" onclick={onClose}>
  <div class="dialog" onclick={(e) => e.stopPropagation()}>
    <h2>绑定飞书文档</h2>
    <button class="close" onclick={onClose}>×</button>

    {#if errorMessage}
      <p class="error">{errorMessage}</p>
    {/if}

    {#if step === 0}
      <p>需要登录Moraya账号</p>
      <button onclick={register} disabled={loading}>注册账号</button>

    {:else if step === 1}
      <p>飞书CLI已安装，需要认证</p>
      {#if status}<p>用户: {status.userName || '未认证'}</p>{/if}
      <button onclick={startAuth} disabled={loading}>开始认证</button>

    {:else if step === 1.5}
      <p>请在浏览器完成授权</p>
      {#if authUrl}<a href={authUrl} target="_blank">打开授权页面</a>{/if}
      <button onclick={verifyAuth} disabled={loading}>验证认证</button>

    {:else if step === 2}
      <p>已认证用户: {status?.userName}</p>
      <button onclick={createDocument} disabled={loading}>创建飞书文档</button>

    {:else if step === 3}
      <p>绑定成功!</p>
      {#if createdDocument}
        <p>文档ID: {createdDocument.id}</p>
        <a href={createdDocument.url} target="_blank">打开飞书文档</a>
      {/if}
      <button onclick={onClose}>关闭</button>
    {/if}
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .dialog {
    background: white;
    padding: 20px;
    border-radius: 8px;
    width: 300px;
  }
  .close {
    float: right;
  }
  .error {
    color: red;
  }
  button {
    margin: 8px 0;
    padding: 8px 16px;
  }
  a {
    display: block;
    margin: 8px 0;
  }
</style>