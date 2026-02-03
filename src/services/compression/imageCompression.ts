import sharp from 'sharp';
import path from 'path';
import { config } from '../../config/env';
import { ensureDirectoryExists } from '../../utils/fileUtils';
import logger from '../../config/logger';

export interface ImageCompressionOptions {
  quality?: number; // 1-100, default 80
  format?: 'jpeg' | 'png' | 'webp';
  width?: number;
  height?: number;
}

export const compressImage = async (
  inputPath: string,
  outputPath: string,
  options: ImageCompressionOptions = {}
): Promise<{ outputPath: string; originalSize: number; compressedSize: number }> => {
  try {
    const quality = options.quality || 80;
    const format = options.format || 'jpeg';
    
    ensureDirectoryExists(path.dirname(outputPath));
    
    const originalSize = require('fs').statSync(inputPath).size;
    
    let sharpInstance = sharp(inputPath);
    
    // Resize if dimensions provided
    if (options.width || options.height) {
      sharpInstance = sharpInstance.resize(options.width, options.height, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }
    
    // Apply compression based on format
    if (format === 'jpeg') {
      await sharpInstance
        .jpeg({ quality, mozjpeg: true })
        .toFile(outputPath);
    } else if (format === 'png') {
      await sharpInstance
        .png({ quality, compressionLevel: 9 })
        .toFile(outputPath);
    } else if (format === 'webp') {
      await sharpInstance
        .webp({ quality })
        .toFile(outputPath);
    } else {
      // Default to JPEG
      await sharpInstance
        .jpeg({ quality, mozjpeg: true })
        .toFile(outputPath);
    }
    
    const compressedSize = require('fs').statSync(outputPath).size;
    
    logger.info(`Image compressed: ${originalSize} -> ${compressedSize} bytes`);
    
    return {
      outputPath,
      originalSize,
      compressedSize,
    };
  } catch (error) {
    logger.error('Image compression error:', error);
    throw new Error(`Image compression failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

