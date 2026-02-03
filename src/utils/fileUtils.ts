import fs from 'fs';
import path from 'path';
import { config } from '../config/env';

export const ensureDirectoryExists = (dirPath: string): void => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

export const getFileExtension = (filename: string): string => {
  return path.extname(filename).toLowerCase().slice(1);
};

export const getFileType = (filename: string): 'image' | 'pdf' | 'video' | 'audio' => {
  const ext = getFileExtension(filename);
  
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff'];
  const videoExts = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'];
  const audioExts = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a'];
  
  if (imageExts.includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  if (videoExts.includes(ext)) return 'video';
  if (audioExts.includes(ext)) return 'audio';
  
  throw new Error(`Unsupported file type: ${ext}`);
};

export const getFileSize = (filePath: string): number => {
  return fs.statSync(filePath).size;
};

export const deleteFile = (filePath: string): void => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error(`Error deleting file ${filePath}:`, error);
  }
};

// Initialize directories on import
ensureDirectoryExists(config.paths.uploadDir);
ensureDirectoryExists(config.paths.compressedDir);

