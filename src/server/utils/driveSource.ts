import { agentRef, FieldValue, serverTimestamp, updateAgent } from '@local/admin-shared';
import { defaultDriveSourceSyncStatus } from '@local/shared';
import { taskQueues } from '~/server/firebase/functions';
import type { Agent, GoogleDriveType } from '@local/shared';
import type { logger as loggerType } from '~/server/logging';

type Logger = typeof loggerType;

export type AddDriveSourceParams = {
  agent: Agent;
  googleDriveType: GoogleDriveType;
  googleDriveId: string | null;
  googleDriveFolderId: string;
  displayName?: string;
};

export type AddDriveSourceResult = {
  driveSourceId: string;
};

export type DeleteDriveSourceParams = {
  agent: Agent;
  driveSourceId: string;
};

/**
 * Validate DriveSource parameters
 */
export const validateDriveSourceParams = (params: {
  googleDriveType: GoogleDriveType;
  googleDriveId: string | null;
  googleDriveFolderId: string;
}): void => {
  const { googleDriveType, googleDriveId, googleDriveFolderId } = params;
  if (googleDriveType === 'sharedDrive' && !googleDriveId) {
    throw new Response('Google Drive ID is required for shared drive', { status: 400 });
  }
  if (googleDriveType === 'myDrive' && !googleDriveFolderId) {
    throw new Response('Google Drive Folder ID is required for My Drive', { status: 400 });
  }
  if (googleDriveType !== 'myDrive' && googleDriveType !== 'sharedDrive') {
    throw new Response('Google Drive Type must be either "myDrive" or "sharedDrive"', { status: 400 });
  }
};

/**
 * Add driveSource to agent
 */
export const addDriveSourceToAgent = async (
  params: AddDriveSourceParams,
  logger: Logger,
): Promise<AddDriveSourceResult> => {
  const { agent, googleDriveType, googleDriveId, googleDriveFolderId, displayName } = params;
  const agentId = agent.id;
  const folderId = googleDriveFolderId || googleDriveId || '';
  const driveSourceId = folderId;

  // Check for duplicates
  const existingDriveSources = Object.values(agent.driveSources);
  const isDuplicate = existingDriveSources.some(({ googleDriveFolderId }) => googleDriveFolderId === folderId);
  if (isDuplicate) {
    throw new Response('This folder is already added', { status: 409 });
  }

  const newDriveSource = {
    googleDriveType,
    googleDriveId,
    googleDriveFolderId: folderId,
    googleDriveSyncPageToken: null,
    syncStatus: defaultDriveSourceSyncStatus,
    lastSyncedAt: null,
    syncErrorMessage: null,
    displayName: displayName || folderId,
    createdAt: serverTimestamp(),
  };

  await updateAgent(agentRef(agentId), {
    [`driveSources.${driveSourceId}`]: newDriveSource,
  });
  await logger.info('DriveSource added to agent', { agentId, driveSourceId });

  await taskQueues().initialSyncAgentDrive.enqueue({ agentId, driveSourceId });
  await logger.info('Initial sync task enqueued for new driveSource', { agentId, driveSourceId });

  return { driveSourceId };
};

/**
 * Delete driveSource from agent
 */
export const deleteDriveSourceFromAgent = async (params: DeleteDriveSourceParams, logger: Logger): Promise<void> => {
  const { agent, driveSourceId } = params;
  const agentId = agent.id;

  // Check if driveSource exists
  const driveSource = agent.driveSources[driveSourceId];
  if (!driveSource) {
    throw new Response('DriveSource not found', { status: 404 });
  }

  // Cannot delete while syncing
  if (driveSource.syncStatus === 'syncing') {
    throw new Response('Cannot delete drive source while syncing', { status: 409 });
  }

  // Cannot delete the last driveSource
  if (Object.keys(agent.driveSources).length === 1) {
    throw new Response('Cannot delete the last drive source', { status: 400 });
  }

  await updateAgent(agentRef(agentId), {
    [`driveSources.${driveSourceId}`]: FieldValue.delete(),
  });
  await logger.info('DriveSource deleted from agent', { agentId, driveSourceId });

  await taskQueues().cleanupDriveSource.enqueue({ agentId, driveSourceId });
  await logger.info('Cleanup task enqueued for deleted driveSource', { agentId, driveSourceId });
};
