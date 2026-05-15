import express, { Response } from 'express';
import { UserAuthService, userAuthService } from '../auth/user-auth';
import { createAuthMiddleware, AuthRequest } from '../middleware/auth';

export function createAuthRoutes(authService: UserAuthService, jwtSecret?: string): express.Router {
  const router = express.Router();
  const authMiddleware = createAuthMiddleware(jwtSecret);

  router.post('/register', async (req, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          error: 'Email and password are required',
          code: 'MISSING_CREDENTIALS',
        });
        return;
      }

      const result = await authService.register(email, password);

      res.status(201).json({
        success: true,
        user: result.user,
        token: result.token,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      const status = message.includes('already exists') ? 409 : 400;

      res.status(status).json({
        error: message,
        code: 'REGISTRATION_FAILED',
      });
    }
  });

  router.post('/login', async (req, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          error: 'Email and password are required',
          code: 'MISSING_CREDENTIALS',
        });
        return;
      }

      const result = await authService.login(email, password);

      res.json({
        success: true,
        user: result.user,
        token: result.token,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';

      res.status(401).json({
        error: message,
        code: 'LOGIN_FAILED',
      });
    }
  });

  router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: 'Not authenticated',
          code: 'NOT_AUTHENTICATED',
        });
        return;
      }

      const user = await authService.getUserById(req.user.userId);

      if (!user) {
        res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND',
        });
        return;
      }

      res.json({
        success: true,
        user,
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to get user',
        code: 'GET_USER_FAILED',
      });
    }
  });

  router.post('/verify', authMiddleware, async (req: AuthRequest, res: Response) => {
    res.json({
      success: true,
      valid: true,
      user: req.user,
    });
  });

  return router;
}