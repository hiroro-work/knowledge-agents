import { agentRef, createAuthTokenWithEncryption, getAgent, updateAgent } from '@local/admin-shared';
import { apiHandler } from '~/server/api/handler';
import { initializeApp } from '~/server/firebase/app';
import { getSecret } from '~/server/firebase/secret';
import type { ApiHandlerFunction } from '~/server/api/handler';

initializeApp();

type RegenerateTokenRequest = {
  agentId: string;
};

type RegenerateTokenResponse = {
  token: string;
  message: string;
};

/**
 * MCP Token regeneration API
 * Generates a new token, encrypts and saves to Firestore
 * Returns plaintext token in response
 */
const regenerateToken: ApiHandlerFunction<RegenerateTokenRequest, RegenerateTokenResponse> = async ({
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

  const isCreator = auth.uid === agent.createdBy;
  const isAdmin = auth.role === 'admin';
  if (!isCreator && !isAdmin) {
    await logger.warn('User is not authorized to regenerate token', { agentId, userId: auth.uid });
    throw new Response('Forbidden', { status: 403 });
  }

  const encryptionKeyHex = await getSecret('AUTH_TOKEN_ENCRYPTION_KEY');
  if (!encryptionKeyHex) {
    await logger.error('AUTH_TOKEN_ENCRYPTION_KEY is not configured');
    throw new Response('Internal Server Error', { status: 500 });
  }
  const encryptionKey = Buffer.from(encryptionKeyHex, 'hex');
  const { token, encrypted } = createAuthTokenWithEncryption(encryptionKey);
  await updateAgent(agentRef(agentId), {
    authTokenEncrypted: encrypted,
  });
  await logger.info('Auth token regenerated', { agentId });

  return {
    token,
    message: 'Token has been regenerated.',
  };
};

export const POST = apiHandler(regenerateToken);
