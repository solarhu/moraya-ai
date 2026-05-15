import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { createAuthRoutes } from './api/auth-routes';
import { createCloudRoutes } from './api/cloud-routes';
import { userAuthService } from './auth/user-auth';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'moraya-secret-key-change-in-production';

// 中间件
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:15173',
  credentials: true,
}));
app.use(express.json());

// 路由
app.use('/api/auth', createAuthRoutes(userAuthService, JWT_SECRET));
app.use('/api/cloud', createCloudRoutes());

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
  });
});

// 错误处理
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({
    error: err.message,
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Moraya Backend running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export default app;