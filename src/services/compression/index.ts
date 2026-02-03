import { compressImage, ImageCompressionOptions } from './imageCompression';
import { compressPDF, PDFCompressionOptions } from './pdfCompression';
import { compressVideo, compressAudio, VideoAudioCompressionOptions } from './videoAudioCompression';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config/env';
import { getFileType } from '../../utils/fileUtils';
import logger from '../../config/logger';

export interface CompressionOptions {
  quality?: number;
  format?: string;
  width?: number;
  height?: number;
  bitrate?: string;
  codec?: string;
  [key: string]: any;
}

export const compressFile = async (
  inputPath: string,
  fileName: string,
  options: CompressionOptions = {}
): Promise<{ outputPath: string; originalSize: number; compressedSize: number }> => {
  const fileType = getFileType(fileName);
  const fileId = uuidv4();
  const ext = path.extname(fileName);
  const outputFileName = `${fileId}${ext}`;
  const outputPath = path.join(config.paths.compressedDir, outputFileName);
  
  logger.info(`Starting compression for ${fileType}: ${fileName}`);
  
  try {
    let result;
    
    switch (fileType) {
      case 'image':
        result = await compressImage(inputPath, outputPath, {
          quality: options.quality,
          format: options.format as 'jpeg' | 'png' | 'webp',
          width: options.width,
          height: options.height,
        });
        break;
        
      case 'pdf':
        // PDF quality can be a string or number (map number to quality preset)
        let pdfQuality: 'screen' | 'ebook' | 'printer' | 'prepress' = 'ebook';
        if (typeof options.quality === 'string') {
          pdfQuality = options.quality as 'screen' | 'ebook' | 'printer' | 'prepress';
        } else if (typeof options.quality === 'number') {
          // Map numeric quality to preset (optional enhancement)
          pdfQuality = 'ebook'; // Default
        }
        result = await compressPDF(inputPath, outputPath, {
          quality: pdfQuality,
          dpi: options.dpi,
        });
        break;
        
      case 'video':
        result = await compressVideo(inputPath, outputPath, {
          quality: options.quality,
          bitrate: options.bitrate,
          codec: options.codec,
        });
        break;
        
      case 'audio':
        result = await compressAudio(inputPath, outputPath, {
          quality: options.quality,
          bitrate: options.bitrate,
          codec: options.codec,
        });
        break;
        
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
    
    return result;
  } catch (error) {
    logger.error(`Compression failed for ${fileName}:`, error);
    throw error;
  }
};

