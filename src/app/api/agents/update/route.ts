import { agentRef, getAgent, updateAgent } from '@local/admin-shared';
import { geminiModels } from '@local/shared';
import { apiHandler } from '~/server/api/handler';
import { initializeApp } from '~/server/firebase/app';
import type { GeminiModel } from '@local/shared';
import type { ApiHandlerFunction } from '~/server/api/handler';

initializeApp();

type UpdateAgentRequest = {
  agentId: string;
  name?: string;
  description?: string;
  geminiModel?: GeminiModel;
};

type UpdateAgentResponse = {
  success: boolean;
};

/**
 * Agent update API
 */
const updateAgentHandler: ApiHandlerFunction<UpdateAgentRequest, UpdateAgentResponse> = async ({
  data,
  auth,
  logger,
}) => {
  if (!auth) {
    throw new Response('Unauthorized', { status: 401 });
  }

  const { agentId, name, description, geminiModel } = data;
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
    await logger.warn('User is not authorized to update agent', { agentId, userId: auth.uid });
    throw new Response('Forbidden', { status: 403 });
  }

  if (geminiModel) {
    const validGeminiModels = geminiModels.map((m) => m.value);
    if (!validGeminiModels.includes(geminiModel)) {
      throw new Response(`Gemini model must be one of: ${validGeminiModels.join(', ')}`, { status: 400 });
    }
  }

  await updateAgent(agentRef(agentId), {
    ...(name !== undefined ? { name } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(geminiModel !== undefined ? { geminiModel } : {}),
  });
  await logger.info('Agent updated', { agentId });

  return { success: true };
};

export const POST = apiHandler(updateAgentHandler);
