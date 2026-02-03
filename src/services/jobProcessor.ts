import { Job, IJob } from '../models/Job';
import { compressFile, CompressionOptions } from './compression';
import { getFileSize, deleteFile } from '../utils/fileUtils';
import logger from '../config/logger';
import path from 'path';

export const processCompressionJob = async (jobId: string): Promise<void> => {
  try {
    const job = await Job.findById(jobId);
    
    if (!job) {
      logger.error(`Job not found: ${jobId}`);
      return;
    }
    
    if (job.status !== 'pending') {
      logger.warn(`Job ${jobId} is not in pending status: ${job.status}`);
      return;
    }
    
    // Update status to processing
    job.status = 'processing';
    await job.save();
    
    logger.info(`Processing compression job: ${jobId} for file: ${job.fileName}`);
    
    try {
      // Compress the file
      const result = await compressFile(
        job.filePath,
        job.fileName,
        job.options as CompressionOptions
      );
      
      // Update job with results
      job.compressedPath = result.outputPath;
      job.compressedSize = result.compressedSize;
      job.status = 'completed';
      await job.save();
      
      logger.info(`Compression completed for job ${jobId}: ${result.originalSize} -> ${result.compressedSize} bytes`);
    } catch (error) {
      // Mark job as failed
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      await job.save();
      
      logger.error(`Compression failed for job ${jobId}:`, error);
    }
  } catch (error) {
    logger.error(`Error processing job ${jobId}:`, error);
  }
};

// Process jobs in the background
export const processPendingJobs = async (): Promise<void> => {
  try {
    const pendingJobs = await Job.find({ status: 'pending' }).limit(5); // Process 5 at a time
    
    if (pendingJobs.length === 0) {
      return;
    }
    
    logger.info(`Processing ${pendingJobs.length} pending jobs`);
    
    // Process jobs in parallel (but limit concurrency)
    await Promise.all(
      pendingJobs.map(job => processCompressionJob(job._id.toString()))
    );
  } catch (error) {
    logger.error('Error processing pending jobs:', error);
  }
};

