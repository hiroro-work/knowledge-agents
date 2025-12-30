import { getAgent } from '@local/admin-shared';
import { apiHandler } from '~/server/api/handler';
import { initializeApp } from '~/server/firebase/app';
import { taskQueues } from '~/server/firebase/functions';
import type { ApiHandlerFunction } from '~/server/api/handler';

initializeApp();

type SyncAgentRequest = {
  agentId: string;
};

/**
 * Agent manual sync API
 * Triggers immediate sync of Google Drive changes to Gemini File Search Store
 */
const syncAgent: ApiHandlerFunction<SyncAgentRequest> = async ({ data, auth, logger }) => {
  if (!auth) {
    throw new Response('Unauthorized', { status: 401 });
  }

  const { agentId } = data;
  if (!agentId) {
    throw new Response('Agent ID is required', { status: 400 });
  }

  const agent = await getAgent(agentId);
  if (!agent) {
    await logger.warn('Agent not found', { agentId });
    throw new Response('Agent not found', { status: 404 });
  }

  const isCreator = auth.uid === agent.createdBy;
  const isAdmin = auth.role === 'admin';
  if (!isCreator && !isAdmin) {
    await logger.warn('User is not authorized to sync agent', { agentId, userId: auth.uid });
    throw new Response('Forbidden', { status: 403 });
  }

  if (!agent.driveSources || Object.keys(agent.driveSources).length === 0) {
    throw new Response('Agent does not have Google Drive configured', { status: 400 });
  }

  if (!agent.geminiFileSearchStoreId) {
    throw new Response('Agent does not have Gemini File Search Store configured', { status: 400 });
  }

  const isSyncing = Object.values(agent.driveSources).some(({ syncStatus }) => syncStatus === 'syncing');
  if (isSyncing) {
    throw new Response('Agent is already syncing', { status: 409 });
  }

  const needsInitialSync = Object.values(agent.driveSources).some(
    ({ googleDriveSyncPageToken }) => !googleDriveSyncPageToken,
  );
  if (needsInitialSync) {
    const { initialSyncAgentDrive } = taskQueues();
    for (const [driveSourceId, driveSource] of Object.entries(agent.driveSources)) {
      if (driveSource.googleDriveSyncPageToken) continue;

      await initialSyncAgentDrive.enqueue({ agentId, driveSourceId });
      await logger.info('Initial sync (retry) triggered for driveSource', { agentId, driveSourceId });
    }
  } else {
    const { syncAgentDrive } = taskQueues();
    await syncAgentDrive.enqueue({ agentId });
    await logger.info('Manual sync triggered', { agentId });
  }

  return { success: true };
};

export const POST = apiHandler(syncAgent);
