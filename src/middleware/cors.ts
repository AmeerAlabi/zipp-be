import cors from 'cors';
import { config } from '../config/env';

export const corsMiddleware = cors({
  origin: config.cors.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Upload-Length', 'Upload-Offset', 'Tus-Resumable', 'Upload-Metadata'],
});

