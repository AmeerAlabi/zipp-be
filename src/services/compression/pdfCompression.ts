import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { config } from '../../config/env';
import { ensureDirectoryExists } from '../../utils/fileUtils';
import logger from '../../config/logger';

const execAsync = promisify(exec);

export interface PDFCompressionOptions {
  quality?: 'screen' | 'ebook' | 'printer' | 'prepress'; // default: 'ebook'
  dpi?: number; // default: 150
}

export const compressPDF = async (
  inputPath: string,
  outputPath: string,
  options: PDFCompressionOptions = {}
): Promise<{ outputPath: string; originalSize: number; compressedSize: number }> => {
  try {
    const quality = options.quality || 'ebook';
    const dpi = options.dpi || 150;
    
    ensureDirectoryExists(path.dirname(outputPath));
    
    const originalSize = require('fs').statSync(inputPath).size;
    
    // Ghostscript compression settings
    const qualitySettings: Record<string, string> = {
      screen: '/screen', // 72 dpi, lowest quality
      ebook: '/ebook',   // 150 dpi, good for reading
      printer: '/printer', // 300 dpi, good for printing
      prepress: '/prepress', // 300 dpi, highest quality
    };
    
    const gsQuality = qualitySettings[quality] || '/ebook';
    
    // Ghostscript command for PDF compression (use gswin64c on Windows, gs on Linux/Mac)
    const gsExecutable = process.platform === 'win32' ? 'gswin64c' : 'gs';
    const gsCommand = `${gsExecutable} -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=${gsQuality} -dNOPAUSE -dQUIET -dBATCH -dDetectDuplicateImages=true -dCompressFonts=true -r${dpi} -sOutputFile="${outputPath}" "${inputPath}"`;
    
    logger.info(`Compressing PDF with Ghostscript: ${gsCommand}`);
    
    await execAsync(gsCommand);
    
    const compressedSize = require('fs').statSync(outputPath).size;
    
    logger.info(`PDF compressed: ${originalSize} -> ${compressedSize} bytes`);
    
    return {
      outputPath,
      originalSize,
      compressedSize,
    };
  } catch (error) {
    logger.error('PDF compression error:', error);
    throw new Error(`PDF compression failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

