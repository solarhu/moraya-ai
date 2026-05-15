import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CredentialsStore } from './credentials-store';
import { FileDatabase } from '../db/file-db';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('CredentialsStore', () => {
  let credentialsStore: CredentialsStore;
  let db: FileDatabase;
  let tempDir: string;
  let dbPath: string;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `moraya-creds-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    dbPath = path.join(tempDir, 'db.json');
    await fs.mkdir(tempDir, { recursive: true });
    
    db = new FileDatabase(dbPath);
    credentialsStore = new CredentialsStore(db);
    
    await db.init();
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  });

  describe('saveLarkCredentials', () => {
    it('should save credentials', async () => {
      const credentials = await credentialsStore.saveLarkCredentials({
        userId: 'user-1',
        accessToken: 'access-token-1',
        refreshToken: 'refresh-token-1',
        expiresIn: 3600,
        scope: 'doc:read doc:write',
      });
      
      expect(credentials.userId).toBe('user-1');
      expect(credentials.accessToken).toBe('access-token-1');
      expect(credentials.refreshToken).toBe('refresh-token-1');
      expect(credentials.scope).toBe('doc:read doc:write');
    });

    it('should calculate expiresAt correctly', async () => {
      const now = Date.now();
      const expiresIn = 7200;
      
      const credentials = await credentialsStore.saveLarkCredentials({
        userId: 'user-1',
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresIn,
      });
      
      const expiresAtTime = new Date(credentials.expiresAt).getTime();
      const expectedTime = now + expiresIn * 1000;
      
      expect(Math.abs(expiresAtTime - expectedTime)).toBeLessThan(1000);
    });

    it('should use default scope if not provided', async () => {
      const credentials = await credentialsStore.saveLarkCredentials({
        userId: 'user-1',
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresIn: 3600,
      });
      
      expect(credentials.scope).toBe('');
    });

    it('should update existing credentials', async () => {
      await credentialsStore.saveLarkCredentials({
        userId: 'user-1',
        accessToken: 'old-token',
        refreshToken: 'old-refresh',
        expiresIn: 3600,
      });
      
      const updated = await credentialsStore.saveLarkCredentials({
        userId: 'user-1',
        accessToken: 'new-token',
        refreshToken: 'new-refresh',
        expiresIn: 7200,
      });
      
      expect(updated.accessToken).toBe('new-token');
      expect(updated.refreshToken).toBe('new-refresh');
    });
  });

  describe('getLarkCredentials', () => {
    it('should get credentials', async () => {
      await credentialsStore.saveLarkCredentials({
        userId: 'user-1',
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresIn: 7200,
      });
      
      const credentials = await credentialsStore.getLarkCredentials('user-1');
      
      expect(credentials).toBeDefined();
      expect(credentials?.accessToken).toBe('token');
    });

    it('should return undefined if not found', async () => {
      const credentials = await credentialsStore.getLarkCredentials('nonexistent');
      
      expect(credentials).toBeUndefined();
    });

    it('should return undefined if credentials expired', async () => {
      await db.saveLarkCredentials({
        userId: 'user-1',
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresAt: new Date(Date.now() - 1000).toISOString(),
        scope: '',
      });
      
      const credentials = await credentialsStore.getLarkCredentials('user-1');
      
      expect(credentials).toBeUndefined();
    });

    it('should return credentials if not expired', async () => {
      await credentialsStore.saveLarkCredentials({
        userId: 'user-1',
        accessToken: 'valid-token',
        refreshToken: 'refresh',
        expiresIn: 3600,
      });
      
      const credentials = await credentialsStore.getLarkCredentials('user-1');
      
      expect(credentials).toBeDefined();
      expect(credentials?.accessToken).toBe('valid-token');
    });
  });

  describe('hasLarkCredentials', () => {
    it('should return true if valid credentials exist', async () => {
      await credentialsStore.saveLarkCredentials({
        userId: 'user-1',
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresIn: 3600,
      });
      
      const hasCredentials = await credentialsStore.hasLarkCredentials('user-1');
      
      expect(hasCredentials).toBe(true);
    });

    it('should return false if no credentials', async () => {
      const hasCredentials = await credentialsStore.hasLarkCredentials('nonexistent');
      
      expect(hasCredentials).toBe(false);
    });

    it('should return false if credentials expired', async () => {
      await db.saveLarkCredentials({
        userId: 'user-1',
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresAt: new Date(Date.now() - 1000).toISOString(),
        scope: '',
      });
      
      const hasCredentials = await credentialsStore.hasLarkCredentials('user-1');
      
      expect(hasCredentials).toBe(false);
    });
  });

  describe('deleteLarkCredentials', () => {
    it('should delete credentials', async () => {
      await credentialsStore.saveLarkCredentials({
        userId: 'user-1',
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresIn: 3600,
      });
      
      const result = await credentialsStore.deleteLarkCredentials('user-1');
      
      expect(result).toBe(true);
      
      const credentials = await credentialsStore.getLarkCredentials('user-1');
      expect(credentials).toBeUndefined();
    });

    it('should return false if credentials not found', async () => {
      const result = await credentialsStore.deleteLarkCredentials('nonexistent');
      
      expect(result).toBe(false);
    });
  });

  describe('getValidAccessToken', () => {
    it('should return access token if valid', async () => {
      await credentialsStore.saveLarkCredentials({
        userId: 'user-1',
        accessToken: 'valid-access-token',
        refreshToken: 'refresh',
        expiresIn: 3600,
      });
      
      const token = await credentialsStore.getValidAccessToken('user-1');
      
      expect(token).toBe('valid-access-token');
    });

    it('should return undefined if no credentials', async () => {
      const token = await credentialsStore.getValidAccessToken('nonexistent');
      
      expect(token).toBeUndefined();
    });

    it('should return undefined if expired', async () => {
      await db.saveLarkCredentials({
        userId: 'user-1',
        accessToken: 'expired-token',
        refreshToken: 'refresh',
        expiresAt: new Date(Date.now() - 1000).toISOString(),
        scope: '',
      });
      
      const token = await credentialsStore.getValidAccessToken('user-1');
      
      expect(token).toBeUndefined();
    });
  });
});