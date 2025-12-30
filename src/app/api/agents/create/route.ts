import { apiHandler } from '~/server/api/handler';
import { initializeApp } from '~/server/firebase/app';
import { createAgentWithStore, validateCreateAgentParams } from '~/server/utils/agent';
import type { GeminiModel, GoogleDriveType } from '@local/shared';
import type { ApiHandlerFunction } from '~/server/api/handler';

initializeApp();

type CreateAgentRequest = {
  slug: string;
  name: string;
  description: string;
  googleDriveType: GoogleDriveType;
  googleDriveId: string | null;
  googleDriveFolderId: string;
  geminiModel?: GeminiModel;
};

type CreateAgentResponse = {
  agentId: string;
  token: string;
};

/**
 * Agent creation API
 * Creates a new agent with FileSearchStore, generates auth token, and enqueues initial sync task
 */
const createAgentHandler: ApiHandlerFunction<CreateAgentRequest, CreateAgentResponse> = async ({
  data,
  auth,
  logger,
}) => {
  const { slug, name, description, googleDriveType, googleDriveId, googleDriveFolderId, geminiModel } = data;

  if (!auth) {
    throw new Response('Unauthorized', { status: 401 });
  }

  const params = {
    slug,
    name,
    description,
    googleDriveType,
    googleDriveId,
    googleDriveFolderId,
    geminiModel,
    createdBy: auth.uid,
  };

  validateCreateAgentParams(params);

  return createAgentWithStore(params, logger);
};

export const POST = apiHandler(createAgentHandler);
