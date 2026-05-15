import express, { Response } from 'express';
import { larkCliAdapter } from '../adapters/lark-cli-adapter';

export function createCloudRoutes(): express.Router {
  const router = express.Router();

  router.get('/status', async (req: express.Request, res: Response) => {
    try {
      const installed = await larkCliAdapter.checkLarkCliInstalled();
      const authStatus = await larkCliAdapter.checkAuthStatus();

      res.json({
        success: true,
        larkCliInstalled: installed,
        larkAuthenticated: authStatus.authenticated,
        userName: authStatus.userName,
        expiresAt: authStatus.expiresAt,
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to get status',
        code: 'STATUS_CHECK_FAILED',
      });
    }
  });

  router.post('/lark/auth', async (req: express.Request, res: Response) => {
    try {
      const result = await larkCliAdapter.startAuth();

      if (result.success && result.loginUrl) {
        res.json({
          success: true,
          loginUrl: result.loginUrl,
          message: result.message,
        });
      } else if (result.success) {
        res.json({
          success: true,
          message: result.message,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.message,
          code: 'AUTH_FAILED',
        });
      }
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Authentication failed',
        code: 'AUTH_ERROR',
      });
    }
  });

  router.get('/lark/auth/status', async (req: express.Request, res: Response) => {
    try {
      const status = await larkCliAdapter.checkAuthStatus();

      res.json({
        success: true,
        authenticated: status.authenticated,
        userName: status.userName,
        expiresAt: status.expiresAt,
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to check auth status',
        code: 'AUTH_STATUS_FAILED',
      });
    }
  });

  router.post('/lark/auth/logout', async (req: express.Request, res: Response) => {
    try {
      const result = await larkCliAdapter.logout();

      res.json({
        success: result.success,
        message: result.message,
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Logout failed',
        code: 'LOGOUT_FAILED',
      });
    }
  });

  router.post('/lark/documents', async (req: express.Request, res: Response) => {
    try {
      const { title, content, folderToken, mode } = req.body;

      if (!title) {
        res.status(400).json({
          error: 'Title is required',
          code: 'MISSING_TITLE',
        });
        return;
      }

      const document = await larkCliAdapter.createDocument(
        title,
        content || '',
        folderToken
      );

      res.status(201).json({
        success: true,
        document,
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to create document',
        code: 'CREATE_DOCUMENT_FAILED',
      });
    }
  });

  router.get('/lark/documents/:token', async (req: express.Request, res: Response) => {
    try {
      const { token } = req.params;
      const document = await larkCliAdapter.fetchDocument(token);

      res.json({
        success: true,
        document,
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to get document',
        code: 'GET_DOCUMENT_FAILED',
      });
    }
  });

  router.put('/lark/documents/:token', async (req: express.Request, res: Response) => {
    try {
      const { token } = req.params;
      const { content, mode } = req.body;

      if (!content) {
        res.status(400).json({
          error: 'Content is required',
          code: 'MISSING_CONTENT',
        });
        return;
      }

      const success = await larkCliAdapter.updateDocument(token, content, mode || 'overwrite');

      res.json({
        success,
        message: success ? 'Document updated' : 'Failed to update document',
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to update document',
        code: 'UPDATE_DOCUMENT_FAILED',
      });
    }
  });

  router.delete('/lark/documents/:token', async (req: express.Request, res: Response) => {
    try {
      const { token } = req.params;
      const { type } = req.query;

      const success = await larkCliAdapter.deleteDocument(token, type as string || 'docx');

      res.json({
        success,
        message: success ? 'Document deleted' : 'Failed to delete document',
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to delete document',
        code: 'DELETE_DOCUMENT_FAILED',
      });
    }
  });

  router.get('/lark/search', async (req: express.Request, res: Response) => {
    try {
      const { query } = req.query;

      if (!query) {
        res.status(400).json({
          error: 'Query is required',
          code: 'MISSING_QUERY',
        });
        return;
      }

      const documents = await larkCliAdapter.searchDocuments(query as string);

      res.json({
        success: true,
        documents,
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to search documents',
        code: 'SEARCH_DOCUMENTS_FAILED',
      });
    }
  });

  router.post('/lark/files/upload', async (req: express.Request, res: Response) => {
    try {
      const { filePath, folderToken } = req.body;

      if (!filePath) {
        res.status(400).json({
          error: 'File path is required',
          code: 'MISSING_FILE_PATH',
        });
        return;
      }

      const file = await larkCliAdapter.uploadFile(filePath, folderToken);

      res.status(201).json({
        success: true,
        file,
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to upload file',
        code: 'UPLOAD_FILE_FAILED',
      });
    }
  });

  router.post('/lark/files/download', async (req: express.Request, res: Response) => {
    try {
      const { fileToken, outputPath } = req.body;

      if (!fileToken || !outputPath) {
        res.status(400).json({
          error: 'File token and output path are required',
          code: 'MISSING_PARAMETERS',
        });
        return;
      }

      const success = await larkCliAdapter.downloadFile(fileToken, outputPath);

      res.json({
        success,
        message: success ? 'File downloaded' : 'Failed to download file',
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to download file',
        code: 'DOWNLOAD_FILE_FAILED',
      });
    }
  });

  return router;
}