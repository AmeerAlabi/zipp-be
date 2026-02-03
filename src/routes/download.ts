import { Router, Request, Response } from 'express';
import { Job } from '../models/Job';
import path from 'path';
import fs from 'fs';
import logger from '../config/logger';

const router = Router();

/**
 * @swagger
 * /api/download/{fileId}:
 *   get:
 *     summary: Download compressed file
 *     description: |
 *       Download the compressed file after compression is complete.
 *       
 *       **Note:** Only works when job status is `completed`. Check status first!
 *     tags:
 *       - Download
 *     parameters:
 *       - name: fileId
 *         in: path
 *         required: true
 *         description: The fileId from upload
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *     responses:
 *       200:
 *         description: Compressed file binary
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Compression not completed yet
 *       404:
 *         description: Job or file not found
 *       500:
 *         description: Server error
 */
router.get('/:fileId', async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    
    const job = await Job.findOne({ fileId }).sort({ createdAt: -1 });
    
    if (!job) {
      return res.status(404).json({
        error: 'Job not found',
      });
    }
    
    if (job.status !== 'completed') {
      return res.status(400).json({
        error: 'Compression not completed',
        status: job.status,
      });
    }
    
    if (!job.compressedPath || !fs.existsSync(job.compressedPath)) {
      return res.status(404).json({
        error: 'Compressed file not found',
      });
    }
    
    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${job.fileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // Stream the file
    const fileStream = fs.createReadStream(job.compressedPath);
    fileStream.pipe(res);
    
    fileStream.on('error', (error) => {
      logger.error('Error streaming file:', error);
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Error streaming file',
        });
      }
    });
  } catch (error) {
    logger.error('Error downloading file:', error);
    res.status(500).json({
      error: 'Failed to download file',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

