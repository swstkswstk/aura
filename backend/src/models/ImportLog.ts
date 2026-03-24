import mongoose, { Document, Schema } from 'mongoose';

export interface IImportLog extends Document {
  uploadedBy?: string;
  fileName?: string;
  createdAt: Date;
  summary: {
    created: number;
    updated: number;
    errors: number;
    rawErrors?: string[];
  };
}

const importLogSchema = new Schema<IImportLog>(
  {
    uploadedBy: { type: String },
    fileName: { type: String },
    summary: {
      created: { type: Number, default: 0 },
      updated: { type: Number, default: 0 },
      errors: { type: Number, default: 0 },
      rawErrors: { type: [String], default: [] },
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const ImportLog = mongoose.model<IImportLog>('ImportLog', importLogSchema);
export default ImportLog;
