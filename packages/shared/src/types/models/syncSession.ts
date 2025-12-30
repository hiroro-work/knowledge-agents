import type { Timestamp, WithId } from '../firebase.js';

export type SyncSessionFileResult = {
  fileId: string;
  fileName: string;
  mimeType: string;
  status: 'success' | 'failed' | 'skipped';
  errorMessage?: string;
  processedAt: Timestamp;
};

export type SyncSessionDocumentData = {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  driveSourceId: string;
  syncType: 'initial' | 'incremental';
  totalFiles: number;
  processedFiles: number;
  successFiles: number;
  failedFiles: number;
  skippedFiles: number;
  status: 'in_progress' | 'completed';
  pageToken: string | null;
  failedFileDetails: SyncSessionFileResult[];
};

export type SyncSession = WithId<SyncSessionDocumentData>;
