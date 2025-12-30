import { agentRef, deleteAgent, getAgent } from '@local/admin-shared';
import { apiHandler } from '~/server/api/handler';
import { initializeApp } from '~/server/firebase/app';
import type { ApiHandlerFunction } from '~/server/api/handler';

initializeApp();

type DeleteAgentRequest = {
  agentId: string;
};

type DeleteAgentResponse = {
  success: boolean;
};

/**
 * Agent delete API
 * Deletes an agent (cleanup is handled by Firestore trigger)
 */
const deleteAgentHandler: ApiHandlerFunction<DeleteAgentRequest, DeleteAgentResponse> = async ({
  data,
  auth,
  logger,
}) => {
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

  // Only creator or admin can delete
  const isCreator = auth.uid === agent.createdBy;
  const isAdmin = auth.role === 'admin';
  if (!isCreator && !isAdmin) {
    await logger.warn('User is not authorized to delete agent', { agentId, userId: auth.uid });
    throw new Response('Forbidden', { status: 403 });
  }

  const ref = agentRef(agentId);
  await deleteAgent(ref);
  await logger.info('Agent deleted', { agentId });

  return { success: true };
};

export const POST = apiHandler(deleteAgentHandler);
