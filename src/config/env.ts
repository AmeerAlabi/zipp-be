// Environment config - dotenv is loaded in server.ts before this file is imported

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/zip-dev',
  },
  
  paths: {
    uploadDir: process.env.UPLOAD_DIR || './temp/uploads',
    compressedDir: process.env.COMPRESSED_DIR || './temp/compressed',
  },
  
  file: {
    maxSize: parseInt(process.env.MAX_FILE_SIZE || '2147483648', 10), // 2GB default
    retentionHours: parseInt(process.env.FILE_RETENTION_HOURS || '2', 10),
  },
  
  cors: {
    frontendUrl: (process.env.FRONTEND_URL || 'https://www.zipfast.app').replace(/\/$/, ''), // Remove trailing slash
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

