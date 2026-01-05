import {
  agentRef as _agentRef,
  createSyncSession,
  getDocumentData,
  serverTimestamp,
  syncSessionsRef,
  updateAgent,
} from '@local/admin-shared';
import { getErrorMessage } from '@local/shared';
import { logger, onTaskDispatched, taskQueues } from '../utils/firebase/functions.js';
import { getAllSubfolderIds, getChanges, getDriveClient } from '../utils/googleDrive.js';
import type { SyncAgentFilePayload } from './syncAgentFile.js';
import type { DocumentReference } from '@local/admin-shared';
import type { AgentDocumentData, DriveSource } from '@local/shared';

type FileSyncTask = Readonly<{
  file: SyncAgentFilePayload['file'];
  removed?: boolean;
  movedOutOfTarget?: boolean;
}>;

type Change = Awaited<ReturnType<typeof getChanges>>['changes'][number];

const toFileSyncTask = (change: Change, targetFolderIds: Set<string>): FileSyncTask => {
  const file = change.file;
  const fileData: SyncAgentFilePayload['file'] = {
    id: file?.id ?? change.fileId!,
    name: file?.name ?? 'unknown',
    mimeType: file?.mimeType ?? '',
    size: file?.size ?? null,
    md5Checksum: file?.md5Checksum ?? null,
    modifiedTime: file?.modifiedTime ?? null,
  };

  if (change.removed) {
    return { file: fileData, removed: true };
  }

  const isInTarget = file?.parents?.some((parentId) => targetFolderIds.has(parentId)) ?? false;
  if (!isInTarget) {
    return { file: fileData, movedOutOfTarget: true };
  }

  return { file: fileData };
};

const syncDriveSource = async (
  agentRef: DocumentReference<AgentDocumentData>,
  driveSourceId: string,
  driveSource: DriveSource,
  drive: ReturnType<typeof getDriveClient>,
  storeId: string,
) => {
  const isSharedDrive = driveSource.googleDriveType === 'sharedDrive';
  const targetFolderId = driveSource.googleDriveFolderId;
  const agentId = agentRef.id;

  await updateAgent(agentRef, {
    [`driveSources.${driveSourceId}.syncStatus`]: 'syncing',
    [`driveSources.${driveSourceId}.syncErrorMessage`]: null,
  });

  try {
    const subfolderIds = await getAllSubfolderIds(
      drive,
      [targetFolderId],
      isSharedDrive,
      driveSource.googleDriveId ?? undefined,
    );
    const targetFolderIds = new Set([targetFolderId, ...subfolderIds]);
    logger.info('Target folder IDs for sync', { agentId, driveSourceId, count: targetFolderIds.size });

    logger.info('Incremental sync started - fetching changes', { agentId, driveSourceId });
    const result = await getChanges(drive, driveSource);
    logger.info(`Fetched ${result.changes.length} changes`, { agentId, driveSourceId });

    const pageToken = result.newStartPageToken ?? driveSource.googleDriveSyncPageToken!;
    const fileChanges = result.changes
      .filter((change) => change.fileId && (change.removed || change.file?.id))
      .map((change) => toFileSyncTask(change, targetFolderIds));
    if (fileChanges.length === 0) {
      await updateAgent(agentRef, {
        [`driveSources.${driveSourceId}.syncStatus`]: 'synced',
        [`driveSources.${driveSourceId}.lastSyncedAt`]: serverTimestamp(),
        [`driveSources.${driveSourceId}.googleDriveSyncPageToken`]: pageToken,
        [`driveSources.${driveSourceId}.syncErrorMessage`]: null,
      });
      logger.info('No changes to sync', { agentId, driveSourceId });
      return;
    }

    const sessionsRef = syncSessionsRef({ parent: agentRef });
    const sessionRef = sessionsRef.doc();
    const syncSessionId = sessionRef.id;
    await createSyncSession(sessionRef, {
      driveSourceId,
      syncType: 'incremental',
      totalFiles: fileChanges.length,
      processedFiles: 0,
      successFiles: 0,
      failedFiles: 0,
      skippedFiles: 0,
      status: 'in_progress',
      pageToken,
      failedFileDetails: [],
    });

    logger.info('Sync session created', { agentId, driveSourceId, syncSessionId, totalFiles: fileChanges.length });

    const queues = taskQueues();
    for (const fileChange of fileChanges) {
      await queues.syncAgentFile.enqueue({
        agentId,
        driveSourceId,
        storeId,
        isSharedDrive,
        syncSessionId,
        file: fileChange.file,
        removed: fileChange.removed,
        movedOutOfTarget: fileChange.movedOutOfTarget,
      });
    }

    logger.info('Incremental sync tasks dispatched', {
      agentId,
      driveSourceId,
      syncSessionId,
      fileCount: fileChanges.length,
    });
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    logger.error('syncDriveSource failed', { agentId, driveSourceId, error: errorMessage });
    await updateAgent(agentRef, {
      [`driveSources.${driveSourceId}.syncStatus`]: 'error',
      [`driveSources.${driveSourceId}.syncErrorMessage`]: errorMessage,
    });
    // Don't re-throw error to continue processing other drive sources
  }
};

export type SyncAgentDrivePayload = {
  agentId: string;
};

/**
 * Cloud Tasks handler for incremental sync
 * Executed periodically via scheduled jobs
 * Fetches changed files and enqueues sync tasks for each file
 */
export const syncAgentDrive = onTaskDispatched<SyncAgentDrivePayload>(
  {
    timeoutSeconds: 600,
    retryConfig: {
      maxAttempts: 3,
      maxBackoffSeconds: 300,
    },
    rateLimits: {
      maxConcurrentDispatches: 1,
    },
    onRetryOver: async ({ agentId }, error) => {
      logger.error('syncAgentDrive task retry over', {
        agentId,
        error: getErrorMessage(error),
      });
    },
  },
  async ({ data: { agentId } }) => {
    const agentRef = _agentRef(agentId);
    const { data: agent, exists } = await getDocumentData(agentRef);
    if (!exists) {
      throw new Error(`Agent ${agentId} not found`);
    }
    if (!agent.geminiFileSearchStoreId) {
      throw new Error(`Agent ${agentId} does not have geminiFileSearchStoreId`);
    }

    const drive = getDriveClient();
    const storeId = agent.geminiFileSearchStoreId;

    if (!agent.driveSources || Object.keys(agent.driveSources).length === 0) {
      logger.warn('Agent has no driveSources, skipping', { agentId });
      return;
    }

    for (const [driveSourceId, driveSource] of Object.entries(agent.driveSources)) {
      if (!driveSource.googleDriveSyncPageToken) {
        logger.info('DriveSource does not have sync token, skipping', { agentId, driveSourceId });
        continue;
      }
      if (driveSource.syncStatus === 'syncing') {
        logger.info('DriveSource is already syncing, skipping', { agentId, driveSourceId });
        continue;
      }
      await syncDriveSource(agentRef, driveSourceId, driveSource, drive, storeId);
    }
  },
);
