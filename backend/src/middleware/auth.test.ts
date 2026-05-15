import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createAuthMiddleware, createOptionalAuthMiddleware, AuthRequest } from './auth';
import { UserAuthService } from '../auth/user-auth';
import { FileDatabase } from '../db/file-db';
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('Auth Middleware', () => {
  let authService: UserAuthService;
  let db: FileDatabase;
  let tempDir: string;
  let dbPath: string;
  let validToken: string;
  let userId: string;
  let authMiddleware: express.RequestHandler;
  let optionalAuthMiddleware: express.RequestHandler;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `moraya-middleware-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    dbPath = path.join(tempDir, 'db.json');
    await fs.mkdir(tempDir, { recursive: true });
    
    db = new FileDatabase(dbPath);
    authService = new UserAuthService(db, 'test-secret-key');
    
    await db.init();
    
    const result = await authService.register('middleware@example.com', 'password123');
    validToken = result.token;
    userId = result.user.id;

    authMiddleware = createAuthMiddleware('test-secret-key');
    optionalAuthMiddleware = createOptionalAuthMiddleware('test-secret-key');
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  });

  describe('authMiddleware', () => {
    it('should pass with valid token', async () => {
      const req = {
        headers: { authorization: `Bearer ${validToken}` },
      } as express.Request;
      
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as express.Response;
      
      const next = vi.fn();
      
      await authMiddleware(req as AuthRequest, res, next);
      
      expect(next).toHaveBeenCalled();
      expect((req as AuthRequest).user).toBeDefined();
      expect((req as AuthRequest).user?.userId).toBe(userId);
      expect((req as AuthRequest).user?.email).toBe('middleware@example.com');
    });

    it('should reject without authorization header', async () => {
      const req = {
        headers: {},
      } as express.Request;
      
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as express.Response;
      
      const next = vi.fn();
      
      await authMiddleware(req as AuthRequest, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authorization header is required',
        code: 'MISSING_AUTH_HEADER',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject with invalid format', async () => {
      const req = {
        headers: { authorization: 'InvalidFormat token' },
      } as express.Request;
      
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as express.Response;
      
      const next = vi.fn();
      
      await authMiddleware(req as AuthRequest, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid authorization header format. Use: Bearer <token>',
        code: 'INVALID_AUTH_FORMAT',
      });
    });

    it('should reject with invalid token', async () => {
      const req = {
        headers: { authorization: 'Bearer invalid-token' },
      } as express.Request;
      
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as express.Response;
      
      const next = vi.fn();
      
      await authMiddleware(req as AuthRequest, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        code: 'AUTH_FAILED',
      }));
    });

    it('should reject without Bearer prefix', async () => {
      const req = {
        headers: { authorization: validToken },
      } as express.Request;
      
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as express.Response;
      
      const next = vi.fn();
      
      await authMiddleware(req as AuthRequest, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('optionalAuthMiddleware', () => {
    it('should pass with valid token and set user', async () => {
      const req = {
        headers: { authorization: `Bearer ${validToken}` },
      } as express.Request;
      
      const res = {} as express.Response;
      const next = vi.fn();
      
      await new Promise<void>((resolve) => {
        optionalAuthMiddleware(req as AuthRequest, res, () => {
          next();
          resolve();
        });
      });
      
      expect(next).toHaveBeenCalled();
      expect((req as AuthRequest).user).toBeDefined();
    });

    it('should pass without authorization header', async () => {
      const req = {
        headers: {},
      } as express.Request;
      
      const res = {} as express.Response;
      const next = vi.fn();
      
      optionalAuthMiddleware(req as AuthRequest, res, next);
      
      expect(next).toHaveBeenCalled();
      expect((req as AuthRequest).user).toBeUndefined();
    });

    it('should pass with invalid token (without setting user)', async () => {
      const req = {
        headers: { authorization: 'Bearer invalid-token' },
      } as express.Request;
      
      const res = {} as express.Response;
      const next = vi.fn();
      
      await new Promise<void>((resolve) => {
        optionalAuthMiddleware(req as AuthRequest, res, () => {
          next();
          resolve();
        });
      });
      
      expect(next).toHaveBeenCalled();
      expect((req as AuthRequest).user).toBeUndefined();
    });

    it('should pass with wrong format', async () => {
      const req = {
        headers: { authorization: 'WrongFormat token' },
      } as express.Request;
      
      const res = {} as express.Response;
      const next = vi.fn();
      
      optionalAuthMiddleware(req as AuthRequest, res, next);
      
      expect(next).toHaveBeenCalled();
    });
  });
});