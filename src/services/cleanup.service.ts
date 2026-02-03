import cron from 'node-cron';
import { Job } from '../models/Job';
import { deleteFile } from '../utils/fileUtils';
import { config } from '../config/env';
import logger from '../config/logger';
import fs from 'fs';
import path from 'path';

const cleanupOldFiles = async (): Promise<void> => {
  try {
    const retentionHours = config.file.retentionHours;
    const cutoffTime = new Date(Date.now() - retentionHours * 60 * 60 * 1000);
    
    logger.info(`Starting cleanup: deleting files older than ${retentionHours} hours`);
    
    // Find old jobs
    const oldJobs = await Job.find({
      createdAt: { $lt: cutoffTime },
    });
    
    logger.info(`Found ${oldJobs.length} old jobs to clean up`);
    
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const job of oldJobs) {
      try {
        // Delete original file
        if (job.filePath && fs.existsSync(job.filePath)) {
          deleteFile(job.filePath);
        }
        
        // Delete compressed file
        if (job.compressedPath && fs.existsSync(job.compressedPath)) {
          deleteFile(job.compressedPath);
        }
        
        // Delete job from database
        await Job.findByIdAndDelete(job._id);
        
        deletedCount++;
      } catch (error) {
        logger.error(`Error cleaning up job ${job._id}:`, error);
        errorCount++;
      }
    }
    
    // Also clean up orphaned files in upload and compressed directories
    const uploadDir = config.paths.uploadDir;
    const compressedDir = config.paths.compressedDir;
    
    [uploadDir, compressedDir].forEach(dir => {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          try {
            const stats = fs.statSync(filePath);
            if (stats.mtime < cutoffTime) {
              deleteFile(filePath);
              logger.info(`Deleted orphaned file: ${filePath}`);
            }
          } catch (error) {
            logger.error(`Error checking file ${filePath}:`, error);
          }
        }
      }
    });
    
    logger.info(`Cleanup completed: ${deletedCount} jobs deleted, ${errorCount} errors`);
  } catch (error) {
    logger.error('Cleanup service error:', error);
  }
};

// Run cleanup every hour in production, every 30 minutes in development
export const startCleanupService = (): void => {
  // Schedule: every hour at minute 0
  const schedule = config.nodeEnv === 'production' ? '0 * * * *' : '*/30 * * * *';
  
  logger.info(`Starting cleanup service with schedule: ${schedule}`);
  
  cron.schedule(schedule, cleanupOldFiles);
  
  // Run once on startup (optional, for immediate cleanup)
  // cleanupOldFiles();
};

