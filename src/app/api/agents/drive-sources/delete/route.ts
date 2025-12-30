import { getAgent } from '@local/admin-shared';
import { apiHandler } from '~/server/api/handler';
import { initializeApp } from '~/server/firebase/app';
import { deleteDriveSourceFromAgent } from '~/server/utils/driveSource';
import type { ApiHandlerFunction } from '~/server/api/handler';

initializeApp();

type DeleteDriveSourceRequest = {
  agentId: string;
  driveSourceId: string;
};

type DeleteDriveSourceResponse = {
  success: boolean;
};

/**
 * DriveSource delete API
 * Removes Google Drive folder from agent and enqueues cleanup task
 */
const deleteDriveSourceHandler: ApiHandlerFunction<DeleteDriveSourceRequest, DeleteDriveSourceResponse> = async ({
  data,
  auth,
  logger,
}) => {
  if (!auth) {
    throw new Response('Unauthorized', { status: 401 });
  }

  const { agentId, driveSourceId } = data;
  if (!agentId) {
    throw new Response('Agent ID is required', { status: 400 });
  }
  if (!driveSourceId) {
    throw new Response('DriveSource ID is required', { status: 400 });
  }

  const agent = await getAgent(agentId);
  if (!agent) {
    await logger.warn('Agent not found', { agentId });
    throw new Response('Agent not found', { status: 404 });
  }

  const isCreator = auth.uid === agent.createdBy;
  const isAdmin = auth.role === 'admin';
  if (!isCreator && !isAdmin) {
    await logger.warn('User is not authorized to delete drive source', { agentId, userId: auth.uid });
    throw new Response('Forbidden', { status: 403 });
  }

  await deleteDriveSourceFromAgent({ agent, driveSourceId }, logger);

  return { success: true };
};

export const POST = apiHandler(deleteDriveSourceHandler);
