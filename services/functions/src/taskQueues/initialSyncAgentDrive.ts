import {
  agentRef as _agentRef,
  createSyncSession,
  getDocumentData,
  serverTimestamp,
  syncSessionsRef,
  updateAgent,
} from '@local/admin-shared';
import { logger, onTaskDispatched, taskQueues } from '../utils/firebase/functions.js';
import { getAllFiles, getDriveClient, getStartPageToken } from '../utils/googleDrive.js';
import type { SyncAgentFilePayload } from './syncAgentFile.js';
import type { DocumentReference } from '@local/admin-shared';
import type { AgentDocumentData, DriveSource } from '@local/shared';

const syncDriveSource = async (
  agentRef: DocumentReference<AgentDocumentData>,
  driveSourceId: string,
  driveSource: DriveSource,
  drive: ReturnType<typeof getDriveClient>,
  storeId: string,
) => {
  const isSharedDrive = driveSource.googleDriveType === 'sharedDrive';
  const agentId = agentRef.id;

  // Start sync
  await updateAgent(agentRef, {
    [`driveSources.${driveSourceId}.syncStatus`]: 'syncing',
    [`driveSources.${driveSourceId}.syncErrorMessage`]: null,
  });

  logger.info('Initial sync started - fetching files', { agentId, driveSourceId });

  const startToken = await getStartPageToken(drive, driveSource);
  const files = await getAllFiles(drive, driveSource);
  const validFiles = files.filter((f) => f.id);

  logger.info(`Fetched ${validFiles.length} files`, { agentId, driveSourceId });

  // Complete immediately if no files to sync
  if (validFiles.length === 0) {
    await updateAgent(agentRef, {
      [`driveSources.${driveSourceId}.syncStatus`]: 'synced',
      [`driveSources.${driveSourceId}.lastSyncedAt`]: serverTimestamp(),
      [`driveSources.${driveSourceId}.googleDriveSyncPageToken`]: startToken,
      [`driveSources.${driveSourceId}.syncErrorMessage`]: null,
    });
    logger.info('No files to sync', { agentId, driveSourceId });
    return;
  }

  // Create sync session
  const sessionsRef = syncSessionsRef({ parent: agentRef });
  const sessionRef = sessionsRef.doc();
  const syncSessionId = sessionRef.id;

  await createSyncSession(sessionRef, {
    driveSourceId,
    syncType: 'initial',
    totalFiles: validFiles.length,
    processedFiles: 0,
    successFiles: 0,
    failedFiles: 0,
    skippedFiles: 0,
    status: 'in_progress',
    pageToken: startToken,
    failedFileDetails: [],
  });

  logger.info('Sync session created', {
    agentId,
    driveSourceId,
    syncSessionId,
    totalFiles: validFiles.length,
  });

  // Enqueue sync task for each file
  const queues = taskQueues();
  for (const file of validFiles) {
    const payload: SyncAgentFilePayload = {
      agentId,
      driveSourceId,
      storeId,
      isSharedDrive,
      syncSessionId,
      file: {
        id: file.id!,
        name: file.name ?? 'unknown',
        mimeType: file.mimeType ?? '',
        size: file.size ?? null,
        md5Checksum: file.md5Checksum ?? null,
        modifiedTime: file.modifiedTime ?? null,
      },
    };

    await queues.syncAgentFile.enqueue(payload);
  }

  logger.info('Initial sync tasks dispatched', {
    agentId,
    driveSourceId,
    syncSessionId,
    fileCount: validFiles.length,
  });
};

export type InitialSyncAgentDrivePayload = {
  agentId: string;
  driveSourceId: string;
};

/**
 * Cloud Tasks handler for initial sync
 * Executed for each drive source when an agent is created
 * Fetches file list and enqueues sync tasks for each file
 */
export const initialSyncAgentDrive = onTaskDispatched<InitialSyncAgentDrivePayload>(
  {
    timeoutSeconds: 600,
    retryConfig: {
      maxAttempts: 3,
      maxBackoffSeconds: 300,
    },
    rateLimits: {
      maxConcurrentDispatches: 1,
    },
    onRetryOver: async ({ agentId, driveSourceId }, error) => {
      logger.error('initialSyncAgentDrive task retry over', {
        agentId,
        driveSourceId,
        error: error instanceof Error ? error.message : String(error),
      });
      if (!driveSourceId) {
        logger.error('driveSourceId is required but missing in onRetryOver', { agentId });
        return;
      }
      const agentRef = _agentRef(agentId);
      const errorMessage = error instanceof Error ? error.message : String(error);

      await updateAgent(agentRef, {
        [`driveSources.${driveSourceId}.syncStatus`]: 'error',
        [`driveSources.${driveSourceId}.syncErrorMessage`]: errorMessage,
      });
    },
  },
  async ({ data: { agentId, driveSourceId } }) => {
    const agentRef = _agentRef(agentId);
    const { data: agent, exists } = await getDocumentData(agentRef);
    if (!exists) {
      throw new Error(`Agent ${agentId} not found`);
    }
    if (!agent.geminiFileSearchStoreId) {
      throw new Error(`Agent ${agentId} does not have geminiFileSearchStoreId`);
    }

    if (!driveSourceId) {
      throw new Error('driveSourceId is required');
    }
    const driveSource = agent.driveSources?.[driveSourceId];
    if (!driveSource) {
      throw new Error(`DriveSource ${driveSourceId} not found in agent ${agentId}`);
    }

    const drive = getDriveClient();
    const storeId = agent.geminiFileSearchStoreId;

    await syncDriveSource(agentRef, driveSourceId, driveSource, drive, storeId);
  },
);
