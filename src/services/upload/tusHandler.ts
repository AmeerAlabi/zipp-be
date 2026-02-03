import { Server } from '@tus/server';
import { FileStore } from '@tus/file-store';
import path from 'path';
import { config } from '../../config/env';
import { ensureDirectoryExists } from '../../utils/fileUtils';
import logger from '../../config/logger';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response } from 'express';

ensureDirectoryExists(config.paths.uploadDir);

const fileStore = new FileStore({
  directory: config.paths.uploadDir,
});

export const tusServer = new Server({
  path: '/api/upload',
  datastore: fileStore,
  namingFunction: (req) => {
    // Generate unique filename
    const metadata = req.headers['upload-metadata'] as string;
    if (metadata) {
      const parts = metadata.split(',');
      for (const part of parts) {
        const [key, value] = part.split(' ');
        if (key === 'filename') {
          const filename = Buffer.from(value, 'base64').toString('utf-8');
          const ext = path.extname(filename);
          const uniqueId = uuidv4();
          return `${uniqueId}${ext}`;
        }
      }
    }
    return uuidv4();
  },
  onUploadFinish: async (req, res, upload) => {
    logger.info(`Upload finished: ${upload.id}, size: ${upload.size}`);
    return res;
  },
  onUploadCreate: async (req, res, upload) => {
    logger.info(`Upload created: ${upload.id}, size: ${upload.size}`);
    return res;
  },
});

// Export handler function for Express
export const tusHandler = (req: Request, res: Response) => {
  tusServer.handle(req, res);
};

