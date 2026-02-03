import mongoose, { Schema, Document } from 'mongoose';

export interface IJob extends Document {
  fileId: string;
  fileName: string;
  filePath: string;
  fileType: 'image' | 'pdf' | 'video' | 'audio';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  options: {
    quality?: number;
    [key: string]: any;
  };
  compressedPath?: string;
  originalSize: number;
  compressedSize?: number;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJob>(
  {
    fileId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: ['image', 'pdf', 'video', 'audio'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    options: {
      type: Schema.Types.Mixed,
      default: {},
    },
    compressedPath: {
      type: String,
    },
    originalSize: {
      type: Number,
      required: true,
    },
    compressedSize: {
      type: Number,
    },
    error: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for cleanup queries
JobSchema.index({ createdAt: 1 });
JobSchema.index({ status: 1 });

export const Job = mongoose.model<IJob>('Job', JobSchema);

