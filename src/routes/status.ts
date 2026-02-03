import { Router, Request, Response } from 'express';
import { Job } from '../models/Job';

const router = Router();

/**
 * @swagger
 * /api/status/{fileId}:
 *   get:
 *     summary: Check compression status
 *     description: |
 *       Get the current status of a compression job.
 *       
 *       **Status values:**
 *       - `pending` - Job is queued
 *       - `processing` - Compression in progress
 *       - `completed` - Done! Ready to download
 *       - `failed` - Error occurred
 *       
 *       Poll this endpoint until status is `completed`, then use `/api/download/{fileId}` to get the compressed file.
 *     tags:
 *       - Status
 *     parameters:
 *       - name: fileId
 *         in: path
 *         required: true
 *         description: The fileId from the upload/compress response
 *         schema:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *     responses:
 *       200:
 *         description: Job status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobId:
 *                   type: string
 *                 fileId:
 *                   type: string
 *                 fileName:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [pending, processing, completed, failed]
 *                 originalSize:
 *                   type: number
 *                   description: Original file size in bytes
 *                 compressedSize:
 *                   type: number
 *                   description: Compressed size (only when completed)
 *                 compressionRatio:
 *                   type: string
 *                   description: Percentage saved (only when completed)
 *                 error:
 *                   type: string
 *                   description: Error message (only when failed)
 *             examples:
 *               processing:
 *                 summary: Still processing
 *                 value:
 *                   jobId: "507f1f77bcf86cd799439011"
 *                   fileId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                   fileName: "photo.jpg"
 *                   status: "processing"
 *                   originalSize: 5242880
 *               completed:
 *                 summary: Compression completed
 *                 value:
 *                   jobId: "507f1f77bcf86cd799439011"
 *                   fileId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                   fileName: "photo.jpg"
 *                   status: "completed"
 *                   originalSize: 5242880
 *                   compressedSize: 1048576
 *                   compressionRatio: "80.00%"
 *       404:
 *         description: Job not found
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
    
    const response: any = {
      jobId: job._id.toString(),
      fileId: job.fileId,
      fileName: job.fileName,
      status: job.status,
      originalSize: job.originalSize,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
    
    if (job.status === 'completed') {
      response.compressedSize = job.compressedSize;
      response.compressionRatio = job.compressedSize && job.originalSize
        ? ((1 - job.compressedSize / job.originalSize) * 100).toFixed(2) + '%'
        : null;
    }
    
    if (job.status === 'failed') {
      response.error = job.error;
    }
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get job status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

