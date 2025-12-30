import type { ModelFields } from '../types/index.js';

export const agentFileFields: ModelFields = {
  createdAt: {
    default: null,
    label: 'Created At',
  },
  updatedAt: {
    default: null,
    label: 'Updated At',
  },
  driveSourceId: {
    default: '',
    label: 'Drive Source ID',
  },
  googleDriveFileId: {
    default: '',
    label: 'Google Drive File ID',
  },
  geminiFileSearchFileId: {
    default: '',
    label: 'Gemini File Search File ID',
  },
  fileName: {
    default: '',
    label: 'File Name',
  },
  mimeType: {
    default: '',
    label: 'MIME Type',
  },
  fileSize: {
    default: null,
    label: 'File Size',
  },
  md5Checksum: {
    default: null,
    label: 'MD5 Checksum',
  },
  modifiedTime: {
    default: null,
    label: 'Modified Time',
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const agentFileDefaultData: { [key: string]: any } = Object.entries(agentFileFields).reduce(
  (defaults, [key, value]) => ({ ...defaults, [key]: value.default }),
  {},
);

export const agentFileFieldLabels: { [key: string]: string } = Object.entries(agentFileFields).reduce(
  (labels, [key, value]) => ({ ...labels, [key]: value.label }),
  {},
);
