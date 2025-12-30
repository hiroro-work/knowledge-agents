import type { Timestamp, WithId } from '../firebase.js';

export type AgentFileDocumentData = {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  driveSourceId: string;
  googleDriveFileId: string;
  geminiFileSearchFileId: string;
  fileName: string;
  mimeType: string;
  fileSize: number | null;
  md5Checksum: string | null;
  modifiedTime: Timestamp;
};

export type AgentFile = WithId<AgentFileDocumentData>;
