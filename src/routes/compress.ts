import { Router, Request, Response } from 'express';
import multer from 'multer';
import { Job } from '../models/Job';
import { getFileType, getFileSize, ensureDirectoryExists } from '../utils/fileUtils';
import { processCompressionJob } from '../services/jobProcessor';
import logger from '../config/logger';
import path from 'path';
import { config } from '../config/env';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Ensure upload directory exists
ensureDirectoryExists(config.paths.uploadDir);

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.paths.uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    // Store uniqueId in request for later use
    (req as any).generatedFileId = uniqueId;
    cb(null, `${uniqueId}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: config.file.maxSize, // 2GB max
  },
});

/**
 * @swagger
 * /api/compress:
 *   post:
 *     summary: Upload and compress a file
 *     description: |
 *       Upload a file and start compression in one step.
 *       
 *       **Supported file types:**
 *       - **Images:** jpg, jpeg, png, gif, webp, bmp, tiff
 *       - **Videos:** mp4, avi, mkv, mov, wmv, flv, webm
 *       - **Audio:** mp3, wav, ogg, flac, aac, m4a
 *       - **PDF:** pdf
 *       
 *       **Compression Options (optional form fields):**
 *       
 *       | Option | Type | Description |
 *       |--------|------|-------------|
 *       | quality | number | Image: 1-100 (default 80), Video: 0-51 (default 23), Audio: 0-9 (default 4), PDF: ignored |
 *       | format | string | Image output format: jpeg, png, webp |
 *       | width | number | Resize width (images only) |
 *       | height | number | Resize height (images only) |
 *       | bitrate | string | Video/Audio bitrate e.g. "1M", "128k" |
 *       | pdfQuality | string | PDF preset: screen, ebook, printer, prepress |
 *       | dpi | number | PDF resolution (default 150) |
 *       
 *       After upload, poll `/api/status/{fileId}` until status is `completed`, then download from `/api/download/{fileId}`.
 *     tags:
 *       - Compress
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to compress (image, video, audio, or PDF)
 *               quality:
 *                 type: number
 *                 description: "Quality level (images: 1-100, videos: 0-51, audio: 0-9)"
 *                 example: 80
 *               format:
 *                 type: string
 *                 description: Output format for images (jpeg, png, webp)
 *                 example: "webp"
 *               width:
 *                 type: number
 *                 description: Resize width (images only)
 *                 example: 1920
 *               height:
 *                 type: number
 *                 description: Resize height (images only)
 *                 example: 1080
 *               bitrate:
 *                 type: string
 *                 description: Bitrate for video/audio (e.g., "1M", "128k")
 *                 example: "1M"
 *               pdfQuality:
 *                 type: string
 *                 enum: [screen, ebook, printer, prepress]
 *                 description: PDF compression preset
 *                 example: "ebook"
 *               dpi:
 *                 type: number
 *                 description: PDF resolution
 *                 example: 150
 *     responses:
 *       200:
 *         description: File uploaded and compression started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 jobId:
 *                   type: string
 *                   example: "507f1f77bcf86cd799439011"
 *                 fileId:
 *                   type: string
 *                   example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                   description: Use this to check status and download
 *                 fileName:
 *                   type: string
 *                   example: "photo.jpg"
 *                 fileType:
 *                   type: string
 *                   enum: [image, video, audio, pdf]
 *                   example: "image"
 *                 originalSize:
 *                   type: number
 *                   example: 5242880
 *                   description: Original file size in bytes
 *                 status:
 *                   type: string
 *                   example: "processing"
 *                 message:
 *                   type: string
 *                   example: "File uploaded. Compression started. Check /api/status/{fileId} for progress."
 *       400:
 *         description: No file provided or unsupported file type
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "No file uploaded"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to process file"
 */
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
      });
    }

    const fileId = (req as any).generatedFileId || path.basename(req.file.filename, path.extname(req.file.filename));
    const fileName = req.file.originalname;
    const filePath = req.file.path;
    const fileType = getFileType(fileName);
    const fileSize = getFileSize(filePath);

    // Parse compression options from form fields based on file type
    const options: Record<string, any> = {};
    
    // Only apply relevant options based on file type
    if (fileType === 'image') {
      if (req.body.quality) options.quality = parseInt(req.body.quality, 10);
      if (req.body.format) options.format = req.body.format;
      if (req.body.width) options.width = parseInt(req.body.width, 10);
      if (req.body.height) options.height = parseInt(req.body.height, 10);
    } else if (fileType === 'video' || fileType === 'audio') {
      if (req.body.quality) options.quality = parseInt(req.body.quality, 10);
      if (req.body.bitrate) options.bitrate = req.body.bitrate;
    } else if (fileType === 'pdf') {
      if (req.body.pdfQuality) options.quality = req.body.pdfQuality; // PDF uses string preset
      if (req.body.dpi) options.dpi = parseInt(req.body.dpi, 10);
    }

    // Create compression job
    const job = new Job({
      fileId,
      fileName,
      filePath,
      fileType,
      status: 'pending',
      options,
      originalSize: fileSize,
    });

    await job.save();

    logger.info(`Created compression job: ${job._id} for file: ${fileName} (${fileType})`);

    // Process job in background
    processCompressionJob(job._id.toString()).catch(err => {
      logger.error('Background job processing error:', err);
    });

    res.json({
      success: true,
      jobId: job._id.toString(),
      fileId,
      fileName,
      fileType,
      originalSize: fileSize,
      status: 'processing',
      message: `File uploaded. Compression started. Check /api/status/${fileId} for progress.`,
    });
  } catch (error) {
    logger.error('Error processing compression:', error);
    res.status(500).json({
      error: 'Failed to process file',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

