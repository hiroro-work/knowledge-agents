import { getAgent } from '@local/admin-shared';
import { apiHandler } from '~/server/api/handler';
import { initializeApp } from '~/server/firebase/app';
import { addDriveSourceToAgent, validateDriveSourceParams } from '~/server/utils/driveSource';
import type { GoogleDriveType } from '@local/shared';
import type { ApiHandlerFunction } from '~/server/api/handler';

initializeApp();

type AddDriveSourceRequest = {
  agentId: string;
  googleDriveType: GoogleDriveType;
  googleDriveId: string | null;
  googleDriveFolderId: string;
  displayName?: string;
};

type AddDriveSourceResponse = {
  driveSourceId: string;
};

/**
 * DriveSource add API
 * Adds a new Google Drive folder to agent and enqueues initial sync task
 */
const addDriveSourceHandler: ApiHandlerFunction<AddDriveSourceRequest, AddDriveSourceResponse> = async ({
  data,
  auth,
  logger,
}) => {
  if (!auth) {
    throw new Response('Unauthorized', { status: 401 });
  }

  const { agentId, googleDriveType, googleDriveId, googleDriveFolderId, displayName } = data;
  if (!agentId) {
    throw new Response('Agent ID is required', { status: 400 });
  }

  validateDriveSourceParams({ googleDriveType, googleDriveId, googleDriveFolderId });

  const agent = await getAgent(agentId);
  if (!agent) {
    await logger.warn('Agent not found', { agentId });
    throw new Response('Agent not found', { status: 404 });
  }

  const isCreator = auth.uid === agent.createdBy;
  const isAdmin = auth.role === 'admin';
  if (!isCreator && !isAdmin) {
    await logger.warn('User is not authorized to add drive source', { agentId, userId: auth.uid });
    throw new Response('Forbidden', { status: 403 });
  }

  return addDriveSourceToAgent(
    {
      agent,
      googleDriveType,
      googleDriveId,
      googleDriveFolderId,
      displayName,
    },
    logger,
  );
};

export const POST = apiHandler(addDriveSourceHandler);
