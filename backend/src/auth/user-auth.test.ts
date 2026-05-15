import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UserAuthService } from './user-auth';
import { FileDatabase } from '../db/file-db';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import jwt from 'jsonwebtoken';

describe('UserAuthService', () => {
  let authService: UserAuthService;
  let db: FileDatabase;
  let tempDir: string;
  let dbPath: string;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `moraya-auth-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    dbPath = path.join(tempDir, 'db.json');
    await fs.mkdir(tempDir, { recursive: true });
    
    process.env.JWT_SECRET = 'test-secret-key';
    
    db = new FileDatabase(dbPath);
    authService = new UserAuthService(db, 'test-secret-key');
    
    await db.init();
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
    delete process.env.JWT_SECRET;
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const result = await authService.register('test@example.com', 'password123');
      
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.id).toBeDefined();
      expect(result.token).toBeDefined();
    });

    it('should throw error if email is missing', async () => {
      await expect(authService.register('', 'password123')).rejects.toThrow('Email and password are required');
    });

    it('should throw error if password is missing', async () => {
      await expect(authService.register('test@example.com', '')).rejects.toThrow('Email and password are required');
    });

    it('should throw error if password is too short', async () => {
      await expect(authService.register('test@example.com', '12345')).rejects.toThrow('Password must be at least 6 characters');
    });

    it('should throw error if user already exists', async () => {
      await authService.register('existing@example.com', 'password123');
      
      await expect(authService.register('existing@example.com', 'password456')).rejects.toThrow('User already exists');
    });

    it('should generate valid JWT token', async () => {
      const result = await authService.register('jwt@example.com', 'password123');
      
      const decoded = jwt.verify(result.token, 'test-secret-key') as { userId: string; email: string };
      
      expect(decoded.userId).toBe(result.user.id);
      expect(decoded.email).toBe('jwt@example.com');
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await authService.register('login@example.com', 'password123');
    });

    it('should login with correct credentials', async () => {
      const result = await authService.login('login@example.com', 'password123');
      
      expect(result.user.email).toBe('login@example.com');
      expect(result.token).toBeDefined();
    });

    it('should throw error if email is missing', async () => {
      await expect(authService.login('', 'password123')).rejects.toThrow('Email and password are required');
    });

    it('should throw error if password is missing', async () => {
      await expect(authService.login('login@example.com', '')).rejects.toThrow('Email and password are required');
    });

    it('should throw error if user not found', async () => {
      await expect(authService.login('nonexistent@example.com', 'password123')).rejects.toThrow('Invalid email or password');
    });

    it('should throw error if password is wrong', async () => {
      await expect(authService.login('login@example.com', 'wrongpassword')).rejects.toThrow('Invalid email or password');
    });

    it('should generate valid JWT token on login', async () => {
      const result = await authService.login('login@example.com', 'password123');
      
      const decoded = jwt.verify(result.token, 'test-secret-key') as { userId: string; email: string };
      
      expect(decoded.email).toBe('login@example.com');
    });
  });

  describe('verifyToken', () => {
    let validToken: string;
    let userId: string;

    beforeEach(async () => {
      const result = await authService.register('verify@example.com', 'password123');
      validToken = result.token;
      userId = result.user.id;
    });

    it('should verify valid token', async () => {
      const payload = await authService.verifyToken(validToken);
      
      expect(payload.userId).toBe(userId);
      expect(payload.email).toBe('verify@example.com');
    });

    it('should throw error for invalid token', async () => {
      await expect(authService.verifyToken('invalid-token')).rejects.toThrow('Invalid or expired token');
    });

    it('should throw error for expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: 'test', email: 'test@example.com' },
        'test-secret-key',
        { expiresIn: '-1s' }
      );
      
      await expect(authService.verifyToken(expiredToken)).rejects.toThrow('Invalid or expired token');
    });

    it('should throw error for token with wrong secret', async () => {
      const wrongSecretToken = jwt.sign(
        { userId: 'test', email: 'test@example.com' },
        'wrong-secret',
        { expiresIn: '1h' }
      );
      
      await expect(authService.verifyToken(wrongSecretToken)).rejects.toThrow('Invalid or expired token');
    });
  });

  describe('getUserById', () => {
    let userId: string;

    beforeEach(async () => {
      const result = await authService.register('getuser@example.com', 'password123');
      userId = result.user.id;
    });

    it('should get user by id', async () => {
      const user = await authService.getUserById(userId);
      
      expect(user).toBeDefined();
      expect(user?.email).toBe('getuser@example.com');
    });

    it('should return undefined for nonexistent user', async () => {
      const user = await authService.getUserById('nonexistent-id');
      
      expect(user).toBeUndefined();
    });
  });
});