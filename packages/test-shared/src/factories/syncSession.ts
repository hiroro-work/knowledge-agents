import { Factory } from 'fishery';
import { timestamp } from '../utils.js';
import type { SyncSession, SyncSessionDocumentData } from '@local/shared';

const syncSessionData = ({ sequence }: { sequence: number }) => ({
  createdAt: timestamp(new Date()),
  updatedAt: timestamp(new Date()),
  driveSourceId: `drive-source-${sequence}`,
  syncType: 'initial' as const,
  totalFiles: sequence * 10,
  processedFiles: 0,
  successFiles: 0,
  failedFiles: 0,
  skippedFiles: 0,
  status: 'in_progress' as const,
  pageToken: null,
  failedFileDetails: [],
});

export const syncSessionDataFactory = Factory.define<SyncSessionDocumentData>(({ sequence }) =>
  syncSessionData({ sequence }),
);

export const syncSessionFactory = Factory.define<SyncSession>(({ sequence }) => ({
  id: `sync-session-${sequence}`,
  ...syncSessionData({ sequence }),
}));
