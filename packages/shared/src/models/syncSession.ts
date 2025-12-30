import type { ModelFields } from '../types/index.js';

export const syncSessionFields: ModelFields = {
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
  syncType: {
    default: 'initial',
    label: 'Sync Type',
  },
  totalFiles: {
    default: 0,
    label: 'Total Files',
  },
  processedFiles: {
    default: 0,
    label: 'Processed Files',
  },
  successFiles: {
    default: 0,
    label: 'Success Files',
  },
  failedFiles: {
    default: 0,
    label: 'Failed Files',
  },
  skippedFiles: {
    default: 0,
    label: 'Skipped Files',
  },
  status: {
    default: 'in_progress',
    label: 'Status',
  },
  pageToken: {
    default: null,
    label: 'Page Token',
  },
  failedFileDetails: {
    default: [],
    label: 'Failed File Details',
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const syncSessionDefaultData: { [key: string]: any } = Object.entries(syncSessionFields).reduce(
  (defaults, [key, value]) => ({ ...defaults, [key]: value.default }),
  {},
);

export const syncSessionFieldLabels: { [key: string]: string } = Object.entries(syncSessionFields).reduce(
  (labels, [key, value]) => ({ ...labels, [key]: value.label }),
  {},
);
