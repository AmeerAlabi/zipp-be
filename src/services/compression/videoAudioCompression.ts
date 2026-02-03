import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import path from 'path';
import { config } from '../../config/env';
import { ensureDirectoryExists } from '../../utils/fileUtils';
import logger from '../../config/logger';
import { promisify } from 'util';
import { exec } from 'child_process';

// Set FFmpeg path from the bundled installer
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
logger.info(`FFmpeg path set to: ${ffmpegInstaller.path}`);

const execAsync = promisify(exec);

export interface VideoAudioCompressionOptions {
  quality?: number; // 0-51 for video (lower is better), 0-9 for audio (lower is better)
  bitrate?: string; // e.g., '1M' for 1 Mbps
  codec?: string; // e.g., 'libx264' for video, 'libmp3lame' for audio
}

export const compressVideo = async (
  inputPath: string,
  outputPath: string,
  options: VideoAudioCompressionOptions = {}
): Promise<{ outputPath: string; originalSize: number; compressedSize: number }> => {
  return new Promise((resolve, reject) => {
    try {
      ensureDirectoryExists(path.dirname(outputPath));
      
      const originalSize = require('fs').statSync(inputPath).size;
      
      const quality = options.quality || 23; // CRF 23 is a good default (0-51 scale)
      const bitrate = options.bitrate || '1M';
      
      let command = ffmpeg(inputPath)
        .outputOptions([
          '-c:v libx264',
          `-crf ${quality}`,
          `-b:v ${bitrate}`,
          '-preset medium',
          '-c:a aac',
          '-b:a 128k',
          '-movflags +faststart', // Web optimization
        ])
        .output(outputPath)
        .on('start', (commandLine) => {
          logger.info(`FFmpeg command: ${commandLine}`);
        })
        .on('progress', (progress) => {
          logger.info(`Video compression progress: ${Math.round(progress.percent || 0)}%`);
        })
        .on('end', () => {
          const compressedSize = require('fs').statSync(outputPath).size;
          logger.info(`Video compressed: ${originalSize} -> ${compressedSize} bytes`);
          resolve({
            outputPath,
            originalSize,
            compressedSize,
          });
        })
        .on('error', (err) => {
          logger.error('Video compression error:', err);
          reject(new Error(`Video compression failed: ${err.message}`));
        });
      
      command.run();
    } catch (error) {
      logger.error('Video compression setup error:', error);
      reject(new Error(`Video compression failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });
};

export const compressAudio = async (
  inputPath: string,
  outputPath: string,
  options: VideoAudioCompressionOptions = {}
): Promise<{ outputPath: string; originalSize: number; compressedSize: number }> => {
  return new Promise((resolve, reject) => {
    try {
      ensureDirectoryExists(path.dirname(outputPath));
      
      const originalSize = require('fs').statSync(inputPath).size;
      
      const quality = options.quality || 4; // 0-9 scale, 4 is good default
      const bitrate = options.bitrate || '128k';
      
      let command = ffmpeg(inputPath)
        .audioCodec('libmp3lame')
        .audioBitrate(bitrate)
        .audioQuality(quality)
        .output(outputPath)
        .on('start', (commandLine) => {
          logger.info(`FFmpeg command: ${commandLine}`);
        })
        .on('progress', (progress) => {
          logger.info(`Audio compression progress: ${Math.round(progress.percent || 0)}%`);
        })
        .on('end', () => {
          const compressedSize = require('fs').statSync(outputPath).size;
          logger.info(`Audio compressed: ${originalSize} -> ${compressedSize} bytes`);
          resolve({
            outputPath,
            originalSize,
            compressedSize,
          });
        })
        .on('error', (err) => {
          logger.error('Audio compression error:', err);
          reject(new Error(`Audio compression failed: ${err.message}`));
        });
      
      command.run();
    } catch (error) {
      logger.error('Audio compression setup error:', error);
      reject(new Error(`Audio compression failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });
};

