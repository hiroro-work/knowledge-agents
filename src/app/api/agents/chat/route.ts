import { getAgent } from '@local/admin-shared';
import { streamingApiHandler } from '~/server/api/handler';
import { initializeApp } from '~/server/firebase/app';
import { queryKnowledgeBaseStream } from '~/server/utils/gemini';
import type { StreamingApiHandlerFunction } from '~/server/api/handler';
import type { ChatMessage } from '~/server/utils/gemini';

initializeApp();

type ChatRequest = {
  agentId: string;
  message: string;
  history?: ChatMessage[];
};

/**
 * Chat API with streaming response
 * Queries the knowledge base using Gemini File Search Store
 *
 * Access Policy: All authenticated users can chat with any agent.
 * This is intentional for a shared knowledge base system.
 * For agent management (edit, delete, token), separate authorization is required.
 */
const chatHandler: StreamingApiHandlerFunction<ChatRequest> = async function* ({ data, auth, logger }) {
  if (!auth) {
    throw new Response('Unauthorized', { status: 401 });
  }

  const { agentId, message, history = [] } = data;
  if (!agentId) {
    throw new Response('Agent ID is required', { status: 400 });
  }
  if (!message) {
    throw new Response('Message is required', { status: 400 });
  }

  const agent = await getAgent(agentId);
  if (!agent) {
    await logger.warn('Agent not found', { agentId });
    throw new Response('Agent not found', { status: 404 });
  }

  if (!agent.geminiFileSearchStoreId) {
    await logger.warn('Agent has no File Search Store', { agentId });
    throw new Response('Agent knowledge base is not ready', { status: 400 });
  }

  await logger.info('Chat request received', { agentId, userId: auth.uid });

  for await (const chunk of queryKnowledgeBaseStream(
    agent.geminiFileSearchStoreId,
    message,
    history,
    agent.geminiModel,
  )) {
    yield chunk;
  }

  await logger.info('Chat response completed', { agentId, userId: auth.uid });
};

export const POST = streamingApiHandler(chatHandler);
