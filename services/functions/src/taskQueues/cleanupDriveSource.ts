import { agentFilesRef, agentRef as _agentRef, getCollectionData } from '@local/admin-shared';
import { deleteAgentFileCompletely } from '../utils/agentFile.js';
import { logger, onTaskDispatched } from '../utils/firebase/functions.js';
import { getGeminiClient } from '../utils/gemini.js';
export type CleanupDriveSourcePayload = {
  agentId: string;
  driveSourceId: string;
};

/**
 * Cleanup task for DriveSource deletion
 * Deletes agentFiles and Gemini FileSearchStore files associated with the driveSource
 */
export const cleanupDriveSource = onTaskDispatched<CleanupDriveSourcePayload>(
  {
    secrets: ['GEMINI_API_KEY'],
    timeoutSeconds: 600,
    retryConfig: {
      maxAttempts: 3,
      maxBackoffSeconds: 300,
    },
    rateLimits: {
      maxConcurrentDispatches: 1,
    },
    onRetryOver: async (data, error) => {
      const { agentId, driveSourceId } = data;
      logger.error('cleanupDriveSource task retry over', {
        agentId,
        driveSourceId,
        error: error instanceof Error ? error.message : String(error),
      });
    },
  },
  async ({ data }) => {
    const { agentId, driveSourceId } = data;
    const agentRef = _agentRef(agentId);
    const filesRef = agentFilesRef({ parent: agentRef });

    logger.info('Starting driveSource cleanup', { agentId, driveSourceId });

    const files = await getCollectionData(filesRef.where('driveSourceId', '==', driveSourceId), { withRef: true });

    if (files.length === 0) {
      logger.info('No files to cleanup', { agentId, driveSourceId });
      return;
    }

    const ai = getGeminiClient();
    const results = await Promise.allSettled(
      files.map(({ ref, geminiFileSearchFileId }) => deleteAgentFileCompletely(ai, geminiFileSearchFileId, ref)),
    );
    const rejectedResults = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
    const successCount = results.length - rejectedResults.length;
    const errorCount = rejectedResults.length;

    // Treat task as success even with partial failures (retrying would just fail the same files again)
    if (errorCount > 0) {
      const errors = rejectedResults.map(({ reason }) => (reason instanceof Error ? reason.message : String(reason)));
      logger.warn('DriveSource cleanup completed with errors', {
        agentId,
        driveSourceId,
        totalFiles: files.length,
        successCount,
        errorCount,
        errors,
      });
    } else {
      logger.info('DriveSource cleanup completed', { agentId, driveSourceId, totalFiles: files.length });
    }
  },
);
