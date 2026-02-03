# Local Development Setup Guide - ZIP Platform

## Overview

This guide helps you set up and run the ZIP compression platform on your local machine (Windows, macOS, or Linux) for development and testing before deploying to Hetzner VPS.

---

## Prerequisites

### 1. Install Node.js 20
**macOS:**
```bash
brew install node@20
```

**Windows:**
- Download from: https://nodejs.org/
- Run installer, choose LTS version (20.x)

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify:
```bash
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

### 2. Install MongoDB (Local)

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb-community
```

**Windows:**
- Download from: https://www.mongodb.com/try/download/community
- Run installer, choose "Complete" installation
- Install as Windows Service (auto-start)

**Linux (Ubuntu):**
```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

Verify:
```bash
mongosh  # Should connect to mongodb://localhost:27017
```

### 3. Install FFmpeg (Video/Audio Compression)

**macOS:**
```bash
brew install ffmpeg
```

**Windows:**
- Download from: https://www.gyan.dev/ffmpeg/builds/
- Extract to `C:\ffmpeg`
- Add `C:\ffmpeg\bin` to system PATH
- Restart terminal

**Linux:**
```bash
sudo apt install ffmpeg
```

Verify:
```bash
ffmpeg -version  # Should show FFmpeg version
```

### 4. Install Ghostscript (PDF Compression)

**macOS:**
```bash
brew install ghostscript
```

**Windows:**
- Download from: https://www.ghostscript.com/releases/gsdnld.html
- Run installer
- Add to PATH (usually: `C:\Program Files\gs\gs10.02.1\bin`)

**Linux:**
```bash
sudo apt install ghostscript
```

Verify:
```bash
gs --version  # Should show Ghostscript version
```

### 5. Install Git (If not already installed)
```bash
git --version
```
If not installed: https://git-scm.com/downloads

---

## Project Setup

### 1. Clone Repository
```bash
# Backend
git clone YOUR_BACKEND_REPO zip-backend
cd zip-backend

# Frontend (in separate terminal/folder)
git clone YOUR_FRONTEND_REPO zip-frontend
cd zip-frontend
```

### 2. Backend Setup

**Install Dependencies:**
```bash
cd zip-backend
npm install
```

**Create Local Environment File:**
```bash
# Create .env.local (for development)
touch .env.local  # macOS/Linux
# OR
type nul > .env.local  # Windows
```

**Edit .env.local:**
```bash
NODE_ENV=development
PORT=5000

# MongoDB (local - no auth needed for dev)
MONGODB_URI=mongodb://localhost:27017/zip-dev

# File paths (use relative paths for cross-platform)
UPLOAD_DIR=./temp/uploads
COMPRESSED_DIR=./temp/compressed

# File config
MAX_FILE_SIZE=2147483648
FILE_RETENTION_HOURS=2

# CORS (allow local frontend)
FRONTEND_URL=http://localhost:3000

# Logging
LOG_LEVEL=debug
```

**Create Temp Directories:**
```bash
# macOS/Linux
mkdir -p temp/uploads temp/compressed

# Windows
mkdir temp\uploads
mkdir temp\compressed
```

**Update package.json scripts:**
```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --env-file .env.local src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  }
}
```

**Start Backend:**
```bash
npm run dev
```

Should see:
```
🚀 Server running on port 5000
✅ MongoDB connected
```

### 3. Frontend Setup

**Install Dependencies:**
```bash
cd zip-frontend
npm install
```

**Create Local Environment File:**
```bash
# Create .env.local
touch .env.local  # macOS/Linux
# OR
type nul > .env.local  # Windows
```

**Edit .env.local:**
```bash
# Backend API URL (local)
NEXT_PUBLIC_API_URL=http://localhost:5000
```

**Start Frontend:**
```bash
npm run dev
```

Should see:
```
✓ Ready in 2.5s
○ Local: http://localhost:3000
```

---

## Development Workflow

### Running Both Services

**Option 1: Two Terminals**
```bash
# Terminal 1 - Backend
cd zip-backend
npm run dev

# Terminal 2 - Frontend
cd zip-frontend
npm run dev
```

**Option 2: Using Concurrently (Recommended)**

In backend or frontend root, install:
```bash
npm install -D concurrently
```

Add to package.json:
```json
{
  "scripts": {
    "dev:all": "concurrently \"npm run dev --prefix ../zip-backend\" \"npm run dev\""
  }
}
```

Run both:
```bash
npm run dev:all
```

### Testing the API

**Test Health Endpoint:**
```bash
curl http://localhost:5000/api/health
```

**Test File Upload (using Postman or curl):**
```bash
# Upload a test image
curl -X POST http://localhost:5000/api/upload \
  -H "Upload-Length: 12345" \
  -H "Tus-Resumable: 1.0.0" \
  --data-binary @test-image.jpg
```

---

## Key Differences: Local vs Production

| Feature | Local Development | Production (VPS) |
|---------|-------------------|------------------|
| MongoDB | No authentication | Username/password auth |
| File Paths | Relative (./temp/) | Absolute (/tmp/) |
| CORS | http://localhost:3000 | https://yourapp.vercel.app |
| Logs | Console output | File logging (Winston) |
| Process Manager | None (Ctrl+C to stop) | PM2 (keeps running) |
| SSL | Not needed | Nginx + Let's Encrypt |
| Domain | localhost:5000 | api.yourdomain.com |
| Hot Reload | Yes (ts-node-dev) | No (PM2 restart needed) |

---

## Environment Files Structure

```
zip-backend/
├── .env.local          # Local development (gitignored)
├── .env.example        # Template for others
├── .env.production     # Production config (on VPS only, gitignored)
└── src/
```

**NEVER commit .env files to Git!**

**.gitignore:**
```
.env
.env.local
.env.production
temp/
node_modules/
dist/
logs/
```

---

## Common Local Development Issues

### Issue: MongoDB connection refused
**Solution:**
```bash
# Check if MongoDB is running
# macOS:
brew services list | grep mongodb

# Linux:
sudo systemctl status mongod

# Windows:
services.msc  # Check "MongoDB Server" is running
```

### Issue: Port 5000 already in use
**Solution:**
```bash
# Change PORT in .env.local to 5001
PORT=5001

# Update frontend .env.local:
NEXT_PUBLIC_API_URL=http://localhost:5001
```

### Issue: FFmpeg not found
**Solution:**
```bash
# Verify FFmpeg is in PATH
which ffmpeg  # macOS/Linux
where ffmpeg  # Windows

# If not found, reinstall and add to PATH
```

### Issue: Module not found errors
**Solution:**
```bash
# Delete and reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Issue: TypeScript compilation errors
**Solution:**
```bash
# Check TypeScript version
npm list typescript

# Rebuild
npm run build
```

### Issue: Cannot upload files (CORS error)
**Solution:**
- Check FRONTEND_URL in backend .env.local matches frontend URL
- Restart backend after changing .env.local
- Clear browser cache

---

## Database Management (Local)

### View Database Contents:
```bash
mongosh

use zip-dev
db.jobs.find().pretty()  # See all jobs
db.jobs.countDocuments()  # Count jobs
```

### Clear Database (Fresh Start):
```bash
mongosh

use zip-dev
db.jobs.deleteMany({})  # Delete all jobs
```

### Reset Everything:
```bash
# Stop backend (Ctrl+C)
# Delete temp files
rm -rf temp/uploads/* temp/compressed/*

# Clear database
mongosh zip-dev --eval "db.jobs.deleteMany({})"

# Restart backend
npm run dev
```

---

## Testing Compression Locally

### Prepare Test Files:
```
test-files/
├── test-image.jpg      # ~5MB image
├── test-pdf.pdf        # ~10MB PDF
├── test-video.mp4      # ~50MB video (not 2GB for faster testing)
└── test-audio.mp3      # ~5MB audio
```

### Test Each File Type:

**1. Test via Frontend:**
- Go to http://localhost:3000
- Drag and drop test file
- Select compression options
- Click "Compress"
- Wait for completion
- Download compressed file

**2. Test via API (using curl/Postman):**
```bash
# 1. Upload file (tus protocol - simplified example)
# Use Postman with tus support or tus-js-client

# 2. Start compression
curl -X POST http://localhost:5000/api/compress \
  -H "Content-Type: application/json" \
  -d '{
    "fileId": "YOUR_FILE_ID",
    "fileName": "test-image.jpg",
    "options": { "quality": 80 }
  }'

# Response: { "jobId": "...", "fileId": "...", "status": "processing" }

# 3. Check status
curl http://localhost:5000/api/status/YOUR_FILE_ID

# 4. Download when completed
curl http://localhost:5000/api/download/YOUR_FILE_ID -o compressed.jpg
```

---

## Hot Reload Explained

**ts-node-dev** watches for file changes and auto-restarts the server.

**Files that trigger restart:**
- Any .ts file in src/
- .env.local changes (may need manual restart)

**What DOESN'T trigger restart:**
- Files in temp/ directory
- Files in node_modules/
- Log files

**To manually restart:**
- Type `rs` in terminal
- Or Ctrl+C and `npm run dev` again

---

## Performance Tips for Local Dev

### 1. Use Smaller Test Files
- Don't test with 2GB files locally
- Use 5-50MB files instead
- Compression is much faster

### 2. Reduce Cleanup Frequency
```bash
# In cleanup.service.ts, change cron schedule for dev:
# Instead of: '0 * * * *' (every hour)
# Use: '*/30 * * * *' (every 30 minutes)
# Or disable cleanup entirely for dev
```

### 3. Skip Type Checking in Dev Mode
```bash
# Add to tsconfig.json for faster startup:
{
  "compilerOptions": {
    "skipLibCheck": true
  }
}
```

### 4. Use MongoDB GUI (Optional)
- Install MongoDB Compass: https://www.mongodb.com/products/compass
- Connect to: mongodb://localhost:27017
- Visual interface for viewing/editing data

---

## Debugging

### Backend Debugging (VS Code)

Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "envFile": "${workspaceFolder}/.env.local",
      "console": "integratedTerminal"
    }
  ]
}
```

Set breakpoints in .ts files, press F5 to debug.

### Frontend Debugging (VS Code)

Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Debug Frontend",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}"
    }
  ]
}
```

### Log Everything in Dev:
```typescript
// In services, add console.logs liberally
console.log('Compressing image:', { inputPath, options });
console.log('Compression result:', result);
```

---

## Before Pushing to Production

### Checklist:
- [ ] All tests pass locally
- [ ] No console.log statements in production code (use logger instead)
- [ ] .env.local is in .gitignore
- [ ] All dependencies in package.json
- [ ] TypeScript compiles without errors (npm run build)
- [ ] MongoDB connections use environment variables (no hardcoded localhost)
- [ ] File paths use environment variables (no hardcoded ./temp/)
- [ ] CORS allows production frontend URL
- [ ] Tested all file types (image, PDF, video, audio)
- [ ] Verified cleanup service works
- [ ] No sensitive data in code (API keys, passwords)

---

## Quick Start Summary

**For Absolute Beginners:**

1. **Install prerequisites** (10 minutes):
   - Node.js 20
   - MongoDB
   - FFmpeg
   - Ghostscript

2. **Clone and setup** (5 minutes):
   ```bash
   git clone YOUR_REPO zip-backend
   cd zip-backend
   npm install
   cp .env.example .env.local
   mkdir -p temp/uploads temp/compressed
   ```

3. **Start MongoDB** (if not auto-started):
   ```bash
   # macOS: brew services start mongodb-community
   # Linux: sudo systemctl start mongod
   # Windows: Already running if installed as service
   ```

4. **Run backend** (1 minute):
   ```bash
   npm run dev
   ```

5. **Open new terminal, run frontend** (1 minute):
   ```bash
   cd ../zip-frontend
   npm install
   npm run dev
   ```

6. **Visit http://localhost:3000** ✅

---

**Total setup time: ~15 minutes**

Now you're ready to develop locally! 🚀