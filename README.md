# ZIP Compression Platform - Backend

A Node.js/TypeScript backend for compressing images, PDFs, videos, and audio files.

## Features

- **TUS Protocol** for resumable file uploads
- **Multi-format compression**:
  - Images (JPEG, PNG, WebP) using Sharp
  - PDFs using Ghostscript
  - Videos using FFmpeg
  - Audio using FFmpeg
- **MongoDB** for job tracking
- **Automatic cleanup** of old files
- **RESTful API** for compression operations

## Prerequisites

- Node.js 20+
- MongoDB 7.0+
- FFmpeg (for video/audio compression)
- Ghostscript (for PDF compression)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file (see `.env.example` for template)

3. Ensure MongoDB is running

4. Start the server:
```bash
npm run dev
```

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/upload` - Upload file (TUS protocol)
- `POST /api/compress` - Start compression job
- `GET /api/status/:fileId` - Get job status
- `GET /api/download/:fileId` - Download compressed file

## Development

```bash
npm run dev    # Start with hot reload
npm run build  # Build for production
npm start      # Run production build
```

