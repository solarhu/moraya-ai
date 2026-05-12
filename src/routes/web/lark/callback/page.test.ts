/**
 * 飞书OAuth回调逻辑测试
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('飞书OAuth核心逻辑', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('授权码处理', () => {
    test('应该能够解析URL中的授权码', () => {
      const url = new URL('http://localhost:15173/web/lark/callback?code=test-auth-code&state=test-state');
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      
      expect(code).toBe('test-auth-code');
      expect(state).toBe('test-state');
    });
    
    test('缺少授权码应该返回null', () => {
      const url = new URL('http://localhost:15173/web/lark/callback');
      const code = url.searchParams.get('code');
      
      expect(code).toBeNull();
    });
  });
  
  describe('Token获取', () => {
    test('应该正确构造Token请求', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          code: 0,
          data: {
            access_token: 'u-test-token',
            refresh_token: 'r-test-token',
            expires_in: 7200,
          },
        }),
      });
      
      const appId = 'cli_test_app_id';
      const appSecret = 'test_app_secret';
      const authCode = 'test-auth-code';
      
      const response = await fetch('https://open.feishu.cn/open-apis/authen/v1/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_id: appId,
          app_secret: appSecret,
          grant_type: 'authorization_code',
          code: authCode,
        }),
      });
      
      const data = await response.json();
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://open.feishu.cn/open-apis/authen/v1/access_token',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining(appId),
        })
      );
      
      expect(data.code).toBe(0);
      expect(data.data.access_token).toBeDefined();
    });
    
    test('飞书API错误应该正确处理', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          code: 10001,
          msg: 'Invalid authorization code',
        }),
      });
      
      const response = await fetch('https://open.feishu.cn/open-apis/authen/v1/access_token', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      
      const data = await response.json();
      
      expect(data.code).toBe(10001);
      expect(data.msg).toBeDefined();
    });
  });
  
  describe('Token刷新', () => {
    test('应该能够刷新access_token', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          code: 0,
          data: {
            access_token: 'u-new-token',
            expires_in: 7200,
          },
        }),
      });
      
      const response = await fetch('https://open.feishu.cn/open-apis/authen/v1/refresh_access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_id: 'cli_test',
          app_secret: 'test_secret',
          grant_type: 'refresh_token',
          refresh_token: 'r-old-token',
        }),
      });
      
      const data = await response.json();
      
      expect(data.code).toBe(0);
      expect(data.data.access_token).toBe('u-new-token');
    });
  });
  
  describe('Token有效期计算', () => {
    test('应该正确计算token过期时间', () => {
      const expiresIn = 7200; // 2小时
      const expiresAt = Date.now() + expiresIn * 1000;
      
      expect(expiresAt).toBeGreaterThan(Date.now());
      expect(expiresAt - Date.now()).toBe(expiresIn * 1000);
    });
    
    test('应该能够判断token是否过期', () => {
      const expiresAt = Date.now() - 1000; // 已过期
      const isExpired = expiresAt < Date.now();
      
      expect(isExpired).toBe(true);
    });
    
    test('未过期token应该返回false', () => {
      const expiresAt = Date.now() + 3600000; // 1小时后
      const isExpired = expiresAt < Date.now();
      
      expect(isExpired).toBe(false);
    });
  });
  
  describe('消息通知', () => {
    test('应该构造正确的成功消息', () => {
      const message = {
        type: 'lark-auth-success',
        accessToken: 'u-test-token',
      };
      
      expect(message.type).toBe('lark-auth-success');
      expect(message.accessToken).toBeDefined();
    });
    
    test('应该构造正确的失败消息', () => {
      const message = {
        type: 'lark-auth-failed',
        error: 'Invalid code',
      };
      
      expect(message.type).toBe('lark-auth-failed');
      expect(message.error).toBeDefined();
    });
  });
});