import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FileDatabase } from './file-db';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('FileDatabase', () => {
  let db: FileDatabase;
  let tempDir: string;
  let dbPath: string;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `moraya-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    dbPath = path.join(tempDir, 'db.json');
    await fs.mkdir(tempDir, { recursive: true });
    
    db = new FileDatabase(dbPath);
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  });

  describe('init', () => {
    it('should create empty database when file does not exist', async () => {
      await db.init();
      
      const content = await fs.readFile(dbPath, 'utf-8');
      const data = JSON.parse(content);
      
      expect(data.users).toEqual([]);
      expect(data.larkCredentials).toEqual([]);
    });

    it('should load existing database', async () => {
      const existingData = {
        users: [{ id: '1', email: 'test@example.com', passwordHash: 'hash', createdAt: '2024-01-01', updatedAt: '2024-01-01' }],
        larkCredentials: [],
      };
      await fs.writeFile(dbPath, JSON.stringify(existingData));
      
      await db.init();
      
      const user = await db.findUserById('1');
      expect(user).toBeDefined();
      expect(user?.email).toBe('test@example.com');
    });

    it('should not reinitialize if already initialized', async () => {
      await db.init();
      await db.init();
      
      const user = await db.createUser('test@example.com', 'hash');
      expect(user.email).toBe('test@example.com');
    });
  });

  describe('User operations', () => {
    beforeEach(async () => {
      await db.init();
    });

    describe('createUser', () => {
      it('should create a new user', async () => {
        const user = await db.createUser('new@example.com', 'passwordHash');
        
        expect(user.id).toBeDefined();
        expect(user.email).toBe('new@example.com');
        expect(user.passwordHash).toBe('passwordHash');
        expect(user.createdAt).toBeDefined();
        expect(user.updatedAt).toBeDefined();
      });

      it('should throw error if user already exists', async () => {
        await db.createUser('existing@example.com', 'hash1');
        
        await expect(db.createUser('existing@example.com', 'hash2')).rejects.toThrow('User already exists');
      });

      it('should save user to file', async () => {
        await db.createUser('saved@example.com', 'hash');
        
        const content = await fs.readFile(dbPath, 'utf-8');
        const data = JSON.parse(content);
        
        expect(data.users.length).toBe(1);
        expect(data.users[0].email).toBe('saved@example.com');
      });
    });

    describe('findUserByEmail', () => {
      it('should find user by email', async () => {
        await db.createUser('find@example.com', 'hash');
        
        const user = await db.findUserByEmail('find@example.com');
        
        expect(user).toBeDefined();
        expect(user?.email).toBe('find@example.com');
      });

      it('should return undefined if user not found', async () => {
        const user = await db.findUserByEmail('nonexistent@example.com');
        
        expect(user).toBeUndefined();
      });
    });

    describe('findUserById', () => {
      it('should find user by id', async () => {
        const created = await db.createUser('findbyid@example.com', 'hash');
        
        const user = await db.findUserById(created.id);
        
        expect(user).toBeDefined();
        expect(user?.id).toBe(created.id);
      });

      it('should return undefined if user not found', async () => {
        const user = await db.findUserById('nonexistent-id');
        
        expect(user).toBeUndefined();
      });
    });

    describe('updateUser', () => {
      it('should update user fields', async () => {
        const created = await db.createUser('update@example.com', 'hash');
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const updated = await db.updateUser(created.id, { passwordHash: 'newHash' });
        
        expect(updated).toBeDefined();
        expect(updated?.passwordHash).toBe('newHash');
        expect(updated?.updatedAt).toBeDefined();
      });

      it('should return undefined if user not found', async () => {
        const result = await db.updateUser('nonexistent-id', { passwordHash: 'newHash' });
        
        expect(result).toBeUndefined();
      });

      it('should save changes to file', async () => {
        const created = await db.createUser('updatesave@example.com', 'hash');
        await db.updateUser(created.id, { passwordHash: 'newHash' });
        
        const content = await fs.readFile(dbPath, 'utf-8');
        const data = JSON.parse(content);
        
        expect(data.users[0].passwordHash).toBe('newHash');
      });
    });
  });

  describe('Lark credentials operations', () => {
    beforeEach(async () => {
      await db.init();
    });

    describe('saveLarkCredentials', () => {
      it('should save new credentials', async () => {
        const credentials = await db.saveLarkCredentials({
          userId: 'user-1',
          accessToken: 'token-1',
          refreshToken: 'refresh-1',
          expiresAt: '2024-12-31',
          scope: 'doc:read',
        });
        
        expect(credentials.userId).toBe('user-1');
        expect(credentials.accessToken).toBe('token-1');
        expect(credentials.createdAt).toBeDefined();
        expect(credentials.updatedAt).toBeDefined();
      });

      it('should update existing credentials', async () => {
        await db.saveLarkCredentials({
          userId: 'user-1',
          accessToken: 'token-1',
          refreshToken: 'refresh-1',
          expiresAt: '2024-12-31',
          scope: 'doc:read',
        });
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const updated = await db.saveLarkCredentials({
          userId: 'user-1',
          accessToken: 'token-2',
          refreshToken: 'refresh-2',
          expiresAt: '2025-01-01',
          scope: 'doc:write',
        });
        
        expect(updated.accessToken).toBe('token-2');
        expect(updated.createdAt).toBeDefined();
        expect(updated.updatedAt).toBeDefined();
      });

      it('should save credentials to file', async () => {
        await db.saveLarkCredentials({
          userId: 'user-1',
          accessToken: 'token-1',
          refreshToken: 'refresh-1',
          expiresAt: '2024-12-31',
          scope: 'doc:read',
        });
        
        const content = await fs.readFile(dbPath, 'utf-8');
        const data = JSON.parse(content);
        
        expect(data.larkCredentials.length).toBe(1);
        expect(data.larkCredentials[0].userId).toBe('user-1');
      });
    });

    describe('getLarkCredentials', () => {
      it('should get credentials by userId', async () => {
        await db.saveLarkCredentials({
          userId: 'user-1',
          accessToken: 'token-1',
          refreshToken: 'refresh-1',
          expiresAt: '2024-12-31',
          scope: 'doc:read',
        });
        
        const credentials = await db.getLarkCredentials('user-1');
        
        expect(credentials).toBeDefined();
        expect(credentials?.accessToken).toBe('token-1');
      });

      it('should return undefined if credentials not found', async () => {
        const credentials = await db.getLarkCredentials('nonexistent-user');
        
        expect(credentials).toBeUndefined();
      });
    });

    describe('deleteLarkCredentials', () => {
      it('should delete credentials', async () => {
        await db.saveLarkCredentials({
          userId: 'user-1',
          accessToken: 'token-1',
          refreshToken: 'refresh-1',
          expiresAt: '2024-12-31',
          scope: 'doc:read',
        });
        
        const result = await db.deleteLarkCredentials('user-1');
        
        expect(result).toBe(true);
        
        const credentials = await db.getLarkCredentials('user-1');
        expect(credentials).toBeUndefined();
      });

      it('should return false if credentials not found', async () => {
        const result = await db.deleteLarkCredentials('nonexistent-user');
        
        expect(result).toBe(false);
      });
    });
  });
});