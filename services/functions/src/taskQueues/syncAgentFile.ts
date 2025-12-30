import {
  agentFilesRef,
  agentRef as _agentRef,
  createAgentFile,
  getCollectionData,
  recordSyncResult,
  serverTimestamp,
  syncSessionRef,
  Timestamp,
} from '@local/admin-shared';
import { deleteAgentFileCompletely } from '../utils/agentFile.js';
import { logger, onTaskDispatched } from '../utils/firebase/functions.js';
import {
  getGeminiClient,
  resolveUploadMimeType,
  isMimeTypeSupported,
  isFileSizeWithinLimit,
  uploadFileToStore,
} from '../utils/gemini.js';
import { downloadFile, getDriveClient } from '../utils/googleDrive.js';
import type { AgentFileDocumentData, SyncSessionFileResult } from '@local/shared';

export type SyncAgentFilePayload = {
  agentId: string;
  driveSourceId: string;
  storeId: string;
  isSharedDrive: boolean;
  syncSessionId: string;
  file: {
    id: string;
    name: string;
    mimeType: string;
    size: string | null;
    md5Checksum: string | null;
    modifiedTime: string | null;
  };
  removed?: boolean;
  movedOutOfTarget?: boolean;
};

const parseFileSize = (size: string | null): number | null => {
  if (!size) return null;
  const parsed = parseInt(size, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

type ValidationResult = Readonly<
  { valid: true; uploadMimeType: string; fileSize: number | null } | { valid: false; reason: string }
>;
const validateFile = (file: SyncAgentFilePayload['file']): ValidationResult => {
  const uploadMimeType = resolveUploadMimeType(file.mimeType);
  if (!uploadMimeType || !isMimeTypeSupported(uploadMimeType)) {
    return { valid: false, reason: `Unsupported file format: ${file.mimeType}` };
  }

  const fileSize = parseFileSize(file.size);
  if (!isFileSizeWithinLimit(fileSize)) {
    const fileSizeMB = fileSize !== null ? Math.round(fileSize / 1024 / 1024) : 'unknown';
    return { valid: false, reason: `File size exceeds limit (${fileSizeMB}MB, max 100MB)` };
  }

  return { valid: true, uploadMimeType, fileSize };
};

/**
 * Check if file has changed (idempotency)
 * - No change if MD5 checksum matches
 * - For files without MD5 (Google Workspace), use modifiedTime for comparison
 */
const hasFileChanged = (
  file: SyncAgentFilePayload['file'],
  existing: { data: AgentFileDocumentData } | null,
): boolean => {
  if (!existing) return true;

  if (file.md5Checksum && existing.data.md5Checksum) {
    return file.md5Checksum !== existing.data.md5Checksum;
  }

  if (file.modifiedTime && existing.data.modifiedTime) {
    const newModifiedTime = new Date(file.modifiedTime).getTime();
    const existingModifiedTime = existing.data.modifiedTime.toDate().getTime();
    return newModifiedTime > existingModifiedTime;
  }

  return true;
};

/**
 * Record sync result to session
 */
const recordResult = async (
  agentId: string,
  syncSessionId: string,
  result: 'success' | 'failed' | 'skipped',
  file: SyncAgentFilePayload['file'],
  reasonOrError?: string,
) => {
  const agentRef = _agentRef(agentId);
  const sessionRef = syncSessionRef(syncSessionId, { parent: agentRef });
  const fileDetail: SyncSessionFileResult | undefined =
    result === 'failed' || result === 'skipped'
      ? {
          fileId: file.id,
          fileName: file.name,
          mimeType: file.mimeType,
          status: result,
          ...(reasonOrError && { errorMessage: reasonOrError }),
          processedAt: Timestamp.now(),
        }
      : undefined;

  await recordSyncResult(sessionRef, result, fileDetail);
};

/**
 * Per-file sync task
 * Called from both initial sync and incremental sync
 */
export const syncAgentFile = onTaskDispatched<SyncAgentFilePayload>(
  {
    secrets: ['GEMINI_API_KEY'],
    timeoutSeconds: 600,
    retryConfig: {
      maxAttempts: 3,
      maxBackoffSeconds: 60,
    },
    rateLimits: {
      maxConcurrentDispatches: 5,
    },
    onRetryOver: async (data, error) => {
      const { agentId, syncSessionId, file } = data;
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('syncAgentFile task retry over', {
        agentId,
        syncSessionId,
        fileName: file.name,
        fileId: file.id,
        mimeType: file.mimeType,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });
      await recordResult(agentId, syncSessionId, 'failed', file, errorMessage);
    },
  },
  async ({
    data: { agentId, driveSourceId, storeId, isSharedDrive, syncSessionId, file, removed, movedOutOfTarget },
  }) => {
    const agentRef = _agentRef(agentId);
    const filesRef = agentFilesRef({ parent: agentRef });

    const logContext = {
      agentId,
      syncSessionId,
      fileName: file.name,
      fileId: file.id,
      mimeType: file.mimeType,
    };

    logger.info('Processing file sync task', {
      ...logContext,
      removed,
      movedOutOfTarget,
    });

    try {
      const existingFiles = await getCollectionData(filesRef.where('googleDriveFileId', '==', file.id).limit(1));
      const existing =
        existingFiles.length > 0
          ? {
              ref: filesRef.doc(existingFiles[0]!.id),
              data: existingFiles[0] as AgentFileDocumentData & { id: string },
            }
          : null;

      if (removed || movedOutOfTarget) {
        if (existing) {
          const ai = getGeminiClient();
          await deleteAgentFileCompletely(ai, existing.data.geminiFileSearchFileId, existing.ref);
          logger.info('File deleted from store', logContext);
        }
        await recordResult(agentId, syncSessionId, 'success', file);
        return;
      }

      if (!hasFileChanged(file, existing)) {
        logger.info('File already synced and unchanged, skipping', logContext);
        await recordResult(agentId, syncSessionId, 'skipped', file);
        return;
      }

      const validation = validateFile(file);
      if (!validation.valid) {
        logger.warn('File validation failed, skipping', { ...logContext, reason: validation.reason });
        await recordResult(agentId, syncSessionId, 'skipped', file, validation.reason);
        return;
      }

      const drive = getDriveClient();
      const fileBuffer = await downloadFile(drive, file.id, file.mimeType, isSharedDrive);
      if (!fileBuffer) {
        const reason = 'Failed to download file';
        logger.warn('File download returned null, skipping', logContext);
        await recordResult(agentId, syncSessionId, 'skipped', file, reason);
        return;
      }

      const ai = getGeminiClient();
      const uploadedFile = await uploadFileToStore(ai, storeId, fileBuffer, file.name, validation.uploadMimeType);
      if (existing) {
        await deleteAgentFileCompletely(ai, existing.data.geminiFileSearchFileId, existing.ref);
        logger.info('Existing file deleted for update', logContext);
      }
      await createAgentFile(filesRef.doc(), {
        driveSourceId,
        googleDriveFileId: file.id,
        geminiFileSearchFileId: uploadedFile.name,
        fileName: file.name,
        mimeType: file.mimeType,
        fileSize: validation.fileSize,
        md5Checksum: file.md5Checksum,
        modifiedTime: file.modifiedTime ? Timestamp.fromDate(new Date(file.modifiedTime)) : serverTimestamp(),
      });

      logger.info('File synced successfully', logContext);
      await recordResult(agentId, syncSessionId, 'success', file);
    } catch (error) {
      logger.error('File sync failed', {
        ...logContext,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  },
);
