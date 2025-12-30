import { defaultDriveSourceSyncStatus, defaultGeminiModel, defaultGoogleDriveType } from '../types/index.js';
import type { ModelFields } from '../types/index.js';

export const driveSourceFields: ModelFields = {
  googleDriveType: {
    default: defaultGoogleDriveType,
    label: 'Google Drive Type',
  },
  googleDriveId: {
    default: null,
    label: 'Shared Drive ID',
  },
  googleDriveFolderId: {
    default: '',
    label: 'Google Drive Folder ID',
  },
  googleDriveSyncPageToken: {
    default: null,
    label: 'Google Drive Sync Page Token',
  },
  syncStatus: {
    default: defaultDriveSourceSyncStatus,
    label: 'Sync Status',
  },
  lastSyncedAt: {
    default: null,
    label: 'Last Synced At',
  },
  syncErrorMessage: {
    default: null,
    label: 'Sync Error Message',
  },
  displayName: {
    default: '',
    label: 'Display Name',
  },
  createdAt: {
    default: null,
    label: 'Created At',
  },
};

export const driveSourceFieldLabels: { [key: string]: string } = Object.entries(driveSourceFields).reduce(
  (labels, [key, value]) => ({ ...labels, [key]: value.label }),
  {},
);

export const agentFields: ModelFields = {
  createdAt: {
    default: null,
    label: 'Created At',
  },
  updatedAt: {
    default: null,
    label: 'Updated At',
  },
  createdBy: {
    default: '',
    label: 'Created By',
  },
  name: {
    default: '',
    label: 'Agent Name',
  },
  description: {
    default: '',
    label: 'Description',
  },
  geminiFileSearchStoreId: {
    default: null,
    label: 'Gemini File Search Store ID',
  },
  geminiModel: {
    default: defaultGeminiModel,
    label: 'Gemini Model',
  },
  authTokenEncrypted: {
    default: null,
    label: 'Auth Token (Encrypted)',
  },
  driveSources: {
    default: {},
    label: 'Drive Sources',
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const agentDefaultData: { [key: string]: any } = Object.entries(agentFields).reduce(
  (defaults, [key, value]) => ({ ...defaults, [key]: value.default }),
  {},
);

export const agentFieldLabels: { [key: string]: string } = Object.entries(agentFields).reduce(
  (labels, [key, value]) => ({ ...labels, [key]: value.label }),
  {},
);
