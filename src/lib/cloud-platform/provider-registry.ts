/**
 * 云平台适配器注册表
 * 
 * 管理所有云平台适配器，提供统一注册和获取接口。
 */

import type { CloudProviderAPI, CloudProvider, CloudEventListener, CloudEvent } from './types';

class CloudProviderRegistry {
  private providers: Map<CloudProvider, CloudProviderAPI> = new Map();
  private listeners: Set<CloudEventListener> = new Set();
  
  /**
   * 注册云平台适配器
   */
  register(provider: CloudProviderAPI): void {
    if (this.providers.has(provider.provider)) {
      console.warn(`Provider ${provider.provider} already registered, will be replaced`);
    }
    
    this.providers.set(provider.provider, provider);
    this.emit({ type: 'auth-changed', status: 'registered' });
  }
  
  /**
   * 获取指定云平台适配器
   */
  get(providerId: CloudProvider): CloudProviderAPI | undefined {
    return this.providers.get(providerId);
  }
  
  /**
   * 获取所有已注册的云平台
   */
  list(): CloudProviderAPI[] {
    return Array.from(this.providers.values());
  }
  
  /**
   * 获取所有可用的云平台（支持Markdown的）
   */
  getAvailable(): CloudProviderAPI[] {
    return this.list().filter(p => p.getCapabilities().supportsMarkdown);
  }
  
  /**
   * 获取已认证的云平台
   */
  async getAuthenticated(): Promise<CloudProviderAPI[]> {
    const providers = this.getAvailable();
    const authenticated = await Promise.all(
      providers.map(async p => {
        const isAuth = await p.isAuthenticated();
        return isAuth ? p : null;
      })
    );
    
    return authenticated.filter((p): p is CloudProviderAPI => p !== null);
  }
  
  /**
   * 检查云平台是否已注册
   */
  has(providerId: CloudProvider): boolean {
    return this.providers.has(providerId);
  }
  
  /**
   * 移除云平台适配器
   */
  unregister(providerId: CloudProvider): void {
    this.providers.delete(providerId);
  }
  
  /**
   * 清空所有注册
   */
  clear(): void {
    this.providers.clear();
    this.listeners.clear();
  }
  
  /**
   * 添加事件监听器
   */
  addEventListener(listener: CloudEventListener): void {
    this.listeners.add(listener);
  }
  
  /**
   * 移除事件监听器
   */
  removeEventListener(listener: CloudEventListener): void {
    this.listeners.delete(listener);
  }
  
  /**
   * 发送事件
   */
  private emit(event: CloudEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Cloud event listener error:', error);
      }
    });
  }
  
  /**
   * 获取推荐的云平台（按优先级）
   */
  getRecommended(): CloudProviderAPI[] {
    const priority: CloudProvider[] = ['lark', 'local', 'notion', 'obsidian', 'git'];
    
    return priority
      .map(id => this.get(id))
      .filter((p): p is CloudProviderAPI => p !== undefined && p.getCapabilities().supportsMarkdown);
  }
  
  /**
   * 获取云平台统计信息
   */
  getStats(): {
    total: number;
    available: number;
    authenticated: number;
  } {
    return {
      total: this.providers.size,
      available: this.getAvailable().length,
      authenticated: 0, // 需要异步获取
    };
  }
}

export const cloudProviderRegistry = new CloudProviderRegistry();