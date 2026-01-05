import {
  agentRef,
  createAgent,
  createAuthTokenWithEncryption,
  getDocumentData,
  serverTimestamp,
  updateAgent,
} from '@local/admin-shared';
import { defaultDriveSourceSyncStatus, defaultGeminiModel, geminiModels } from '@local/shared';
import { taskQueues } from '~/server/firebase/functions';
import { getSecret } from '~/server/firebase/secret';
import { validateDriveSourceParams } from '~/server/utils/driveSource';
import { createFileSearchStore } from '~/server/utils/gemini';
import type { GeminiModel, GoogleDriveType } from '@local/shared';
import type { logger as loggerType } from '~/server/logging';

type Logger = typeof loggerType;

export type CreateAgentParams = {
  slug: string;
  name: string;
  description: string;
  googleDriveType: GoogleDriveType;
  googleDriveId: string | null;
  googleDriveFolderId: string;
  geminiModel?: GeminiModel;
  createdBy: string;
};

export type CreateAgentResult = {
  agentId: string;
  token: string;
};

/**
 * Validate agent creation parameters
 */
export const validateCreateAgentParams = (params: CreateAgentParams): void => {
  const { slug, name, googleDriveType, googleDriveId, googleDriveFolderId, geminiModel } = params;

  if (!slug) {
    throw new Response('Slug is required', { status: 400 });
  }
  if (slug.length < 1 || slug.length > 64) {
    throw new Response('Slug must be between 1 and 64 characters', { status: 400 });
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    throw new Response('Slug must contain only lowercase alphanumeric characters and hyphens', { status: 400 });
  }
  if (!name) {
    throw new Response('Agent name is required', { status: 400 });
  }
  if (geminiModel) {
    const validGeminiModels = geminiModels.map((m) => m.value);
    if (!validGeminiModels.includes(geminiModel)) {
      throw new Response(`Gemini model must be one of: ${validGeminiModels.join(', ')}`, { status: 400 });
    }
  }

  validateDriveSourceParams({ googleDriveType, googleDriveId, googleDriveFolderId });
};

/**
 * Create agent with File Search Store and enqueue initial sync task
 */
export const createAgentWithStore = async (params: CreateAgentParams, logger: Logger): Promise<CreateAgentResult> => {
  const {
    slug,
    name,
    description,
    googleDriveType,
    googleDriveId,
    googleDriveFolderId,
    geminiModel = defaultGeminiModel,
    createdBy,
  } = params;

  const agentId = slug;
  const ref = agentRef(agentId);
  const { exists } = await getDocumentData(ref);
  if (exists) {
    throw new Response('Agent with this slug already exists', { status: 409 });
  }

  const encryptionKeyHex = await getSecret('AUTH_TOKEN_ENCRYPTION_KEY');
  if (!encryptionKeyHex) {
    throw new Response('AUTH_TOKEN_ENCRYPTION_KEY is not configured', { status: 500 });
  }
  const encryptionKey = Buffer.from(encryptionKeyHex, 'hex');
  const { token, encrypted } = createAuthTokenWithEncryption(encryptionKey);

  // Use folder ID or drive ID for shared drive sync
  const folderId = googleDriveFolderId || googleDriveId || '';
  const driveSourceId = folderId;
  const initialDriveSource = {
    googleDriveType,
    googleDriveId,
    googleDriveFolderId: folderId,
    googleDriveSyncPageToken: null,
    syncStatus: defaultDriveSourceSyncStatus,
    lastSyncedAt: null,
    syncErrorMessage: null,
    displayName: name,
    createdAt: serverTimestamp(),
  };

  await createAgent(ref, {
    name,
    description,
    geminiModel,
    createdBy,
    authTokenEncrypted: encrypted,
    geminiFileSearchStoreId: null,
    driveSources: { [driveSourceId]: initialDriveSource },
  });
  await logger.info('Agent created with auth token', { agentId, driveSourceId });

  const storeName = `agent-${agentId}`;
  const geminiFileSearchStoreId = await createFileSearchStore(storeName);
  await logger.info('FileSearchStore created', { agentId, storeId: geminiFileSearchStoreId });
  await updateAgent(ref, { geminiFileSearchStoreId });
  await logger.info('Agent updated with FileSearchStore ID', { agentId, storeId: geminiFileSearchStoreId });

  await taskQueues().initialSyncAgentDrive.enqueue({ agentId, driveSourceId });
  await logger.info('Initial sync task enqueued', { agentId, driveSourceId });

  return {
    agentId,
    token,
  };
};
