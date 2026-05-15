<script lang="ts">
  import { cloudApi } from '$lib/api';

  let open = $state(false);
  let loading = $state(false);
  let status = $state<any>(null);
  let step = $state(1);
  let authUrl = $state('');
  let documentTitle = $state('');
  let documentContent = $state('');
  let result = $state<any>(null);

  export function show(title: string, content: string) {
    documentTitle = title;
    documentContent = content;
    open = true;
    checkStatus();
  }

  export function close() {
    open = false;
    authUrl = '';
    result = null;
  }

  async function checkStatus() {
    loading = true;
    try {
      const resp = await cloudApi.getStatus();
      if (resp.success && resp.data) {
        status = resp.data;
        if (resp.data.larkAuthenticated) {
          step = 2;
        } else {
          step = 1;
        }
      }
    } catch (e) {
      console.error(e);
    }
    loading = false;
  }

  async function startAuth() {
    loading = true;
    try {
      const resp = await cloudApi.startLarkAuth();
      if (resp.success && resp.data?.loginUrl) {
        authUrl = resp.data.loginUrl;
        window.open(authUrl, '_blank');
        step = 1.5;
      }
    } catch (e) {
      console.error(e);
    }
    loading = false;
  }

  async function verifyAuth() {
    loading = true;
    try {
      const resp = await cloudApi.getLarkAuthStatus();
      if (resp.success && resp.data?.authenticated) {
        authUrl = '';
        step = 2;
      } else {
        alert('认证未完成，请在浏览器完成飞书授权');
      }
    } catch (e) {
      console.error(e);
    }
    loading = false;
  }

  async function createDoc() {
    loading = true;
    try {
      const resp = await cloudApi.createDocument(documentTitle, documentContent);
      if (resp.success && resp.data) {
        result = resp.data;
        step = 3;
      } else {
        alert(resp.error || '创建失败');
      }
    } catch (e) {
      console.error(e);
    }
    loading = false;
  }
</script>

{#if open}
  <div class="modal">
    <div class="content">
      <h3>同步到飞书</h3>
      <button class="close" onclick={close}>×</button>

      {#if loading}
        <p>加载中...</p>

      {:else if step === 1}
        <p>飞书CLI已安装，需要认证</p>
        {#if status}<p>用户: {status.userName || '未认证'}</p>{/if}
        <button onclick={startAuth}>开始飞书认证</button>

      {:else if step === 1.5}
        <p>请在浏览器完成授权</p>
        {#if authUrl}<a href={authUrl} target="_blank">打开授权页面</a>{/if}
        <button onclick={verifyAuth}>验证认证</button>

      {:else if step === 2}
        <p>已认证: {status?.userName}</p>
        <p>文档: {documentTitle}</p>
        <button onclick={createDoc}>创建飞书文档</button>

      {:else if step === 3}
        <p class="success">文档已创建！</p>
        {#if result}
          <p>标题: {result.title}</p>
          <a href={result.url} target="_blank">打开飞书文档</a>
        {/if}
        <button onclick={close}>关闭</button>
      {/if}
    </div>
  </div>
{/if}

<style>
  .modal {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }
  .content {
    background: white;
    padding: 20px;
    border-radius: 8px;
    width: 300px;
    position: relative;
  }
  .close {
    position: absolute;
    top: 10px;
    right: 10px;
    background: none;
    border: none;
    font-size: 20px;
  }
  .success {
    color: green;
  }
  button {
    margin: 8px 0;
    padding: 8px 16px;
    background: #1976d2;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  button:hover {
    background: #1565c0;
  }
  a {
    color: #1976d2;
    display: block;
    margin: 8px 0;
  }
</style>