import type { Timestamp, WithId } from '../firebase.js';

export const driveSourceSyncStatuses = [
  { label: 'Pending', value: 'pending' },
  { label: 'Syncing', value: 'syncing' },
  { label: 'Synced', value: 'synced' },
  { label: 'Error', value: 'error' },
] as const;
export type DriveSourceSyncStatus = (typeof driveSourceSyncStatuses)[number]['value'];
export const defaultDriveSourceSyncStatus = 'pending' as DriveSourceSyncStatus;

export const googleDriveTypes = [
  { label: 'My Drive', value: 'myDrive' },
  { label: 'Shared Drive', value: 'sharedDrive' },
] as const;
export type GoogleDriveType = (typeof googleDriveTypes)[number]['value'];
export const defaultGoogleDriveType = 'myDrive' as GoogleDriveType;

export const geminiModelValues = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro',
  'gemini-3-pro-preview',
  'gemini-3-flash-preview',
] as const;
export type GeminiModel = (typeof geminiModelValues)[number];
export const geminiModels = [
  { label: 'Gemini 2.5 Flash', value: 'gemini-2.5-flash' },
  { label: 'Gemini 2.5 Flash Lite', value: 'gemini-2.5-flash-lite' },
  { label: 'Gemini 2.5 Pro', value: 'gemini-2.5-pro' },
  { label: 'Gemini 3 Pro (Preview)', value: 'gemini-3-pro-preview' },
  { label: 'Gemini 3 Flash (Preview)', value: 'gemini-3-flash-preview' },
] as const satisfies readonly { label: string; value: GeminiModel }[];
export const defaultGeminiModel = 'gemini-2.5-flash' as GeminiModel;

export type DriveSource = {
  googleDriveType: GoogleDriveType;
  googleDriveId: string | null;
  googleDriveFolderId: string;
  googleDriveSyncPageToken: string | null;
  syncStatus: DriveSourceSyncStatus;
  lastSyncedAt: Timestamp | null;
  syncErrorMessage: string | null;
  displayName: string;
  createdAt: Timestamp;
};

export type AgentDocumentData = {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  name: string;
  description: string;
  geminiFileSearchStoreId: string | null;
  geminiModel: GeminiModel;
  authTokenEncrypted: string | null;
  driveSources: Record<string, DriveSource>;
};

export type Agent = WithId<AgentDocumentData>;
