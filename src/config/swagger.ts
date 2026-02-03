import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ZIPP - File Compression API',
      version: '1.0.0',
      description: `
## File Compression Platform

Upload and compress files in one simple step!

### 📷 Images (JPG, PNG, GIF, WebP, BMP, TIFF)
### 🎬 Videos (MP4, AVI, MKV, MOV, WMV, FLV, WebM)
### 🎵 Audio (MP3, WAV, OGG, FLAC, AAC, M4A)
### 📄 PDF

---

## Simple Workflow

1. **Compress** → POST \`/api/compress\` (upload file + start compression)
2. **Check Status** → GET \`/api/status/{fileId}\` (poll until completed)
3. **Download** → GET \`/api/download/{fileId}\` (get compressed file)
      `,
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local Development Server',
      },
    ],
    tags: [
      { name: 'Compress', description: 'Upload and compress files' },
      { name: 'Status', description: 'Check compression status' },
      { name: 'Download', description: 'Download compressed files' },
      { name: 'Health', description: 'Health check' },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
