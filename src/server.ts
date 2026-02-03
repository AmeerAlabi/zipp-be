import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { connectDatabase } from './config/database';
import { config } from './config/env';
import logger from './config/logger';
import { corsMiddleware } from './middleware/cors';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import healthRouter from './routes/health';
import compressRouter from './routes/compress';
import statusRouter from './routes/status';
import downloadRouter from './routes/download';
import { startCleanupService } from './services/cleanup.service';
import { processPendingJobs } from './services/jobProcessor';
import { swaggerSpec } from './config/swagger';

const app = express();

// Middleware
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger UI Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  swaggerOptions: {
    persistAuthorization: true,
  },
}));

// API Routes
app.use('/api/health', healthRouter);
app.use('/api/compress', compressRouter);
app.use('/api/status', statusRouter);
app.use('/api/download', downloadRouter);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDatabase();
    
    // Start cleanup service
    startCleanupService();
    
    // Process pending jobs periodically (every 10 seconds)
    setInterval(() => {
      processPendingJobs().catch(err => {
        logger.error('Error in periodic job processing:', err);
      });
    }, 10000);
    
    // Start listening
    app.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer();

