import {
  agentRef as _agentRef,
  serverTimestamp,
  syncSessionRef as _syncSessionRef,
  updateAgent,
  updateSyncSession,
} from '@local/admin-shared';
import { logger, onDocumentUpdated } from '../../../utils/firebase/functions.js';
import type { SyncSession } from '@local/shared';

export const handleSyncSessionUpdate = async (
  agentId: string,
  before: SyncSession,
  after: SyncSession,
): Promise<void> => {
  if (after.status === 'completed') return;
  if (before.processedFiles === after.processedFiles) return;
  if (after.processedFiles < after.totalFiles) return;

  const hasFailures = after.failedFiles > 0;
  logger.info('All files processed, finalizing sync', {
    agentId,
    sessionId: after.id,
    totalFiles: after.totalFiles,
    successFiles: after.successFiles,
    failedFiles: after.failedFiles,
    skippedFiles: after.skippedFiles,
    hasFailures,
  });

  const agentRef = _agentRef(agentId);
  const sessionRef = _syncSessionRef(after.id, { parent: agentRef });

  await updateSyncSession(sessionRef, {
    status: 'completed',
  });
  const { driveSourceId } = after;
  if (!driveSourceId) {
    logger.error('driveSourceId is required but missing', { agentId, sessionId: after.id });
    return;
  }

  // Mark sync as completed even if there are failed files
  // Failed file info is recorded in syncSession and will be reprocessed in next incremental sync when user updates in Drive
  const syncErrorMessage = hasFailures ? `Sync failed for ${after.failedFiles} file(s)` : null;
  await updateAgent(agentRef, {
    [`driveSources.${driveSourceId}.syncStatus`]: 'synced',
    [`driveSources.${driveSourceId}.lastSyncedAt`]: serverTimestamp(),
    ...(after.pageToken ? { [`driveSources.${driveSourceId}.googleDriveSyncPageToken`]: after.pageToken } : {}),
    [`driveSources.${driveSourceId}.syncErrorMessage`]: syncErrorMessage,
  });

  logger.info('Sync finalized', {
    agentId,
    sessionId: after.id,
    driveSourceId,
    hasFailures,
    syncErrorMessage,
  });
};

export const onUpdated = onDocumentUpdated(
  {
    document: 'agents/{agentId}/syncSessions/{sessionId}',
  },
  async (event) => {
    const change = event.data;
    if (!change) return;

    const before = { id: change.before.id, ...change.before.data() } as SyncSession;
    const after = { id: change.after.id, ...change.after.data() } as SyncSession;
    const agentId = event.params.agentId as string;

    await handleSyncSessionUpdate(agentId, before, after);
  },
);
