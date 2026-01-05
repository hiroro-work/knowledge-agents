// NOTE: mcp-handler requires zod v3
// https://github.com/vercel/mcp-handler/issues/93
import { createMcpHandler, withMcpAuth } from 'mcp-handler';
import { z } from 'zod3';
import { verifyAuthToken } from '@local/admin-shared';
import { getErrorMessage } from '@local/shared';
import { getSecret } from '~/server/firebase/secret';
import { logger } from '~/server/logging';
import { queryKnowledgeBase } from '~/server/utils/gemini';
import type { Agent } from '@local/shared';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

/**
 * Tool handler for querying the agent's knowledge base
 */
const queryKnowledgeToolHandler = async (agent: Agent, question: string): Promise<CallToolResult> => {
  try {
    await logger.info('query-knowledge', { agentId: agent.id, question });

    if (!agent.geminiFileSearchStoreId) {
      return {
        content: [
          {
            type: 'text',
            text: "This agent's knowledge base is not ready yet. Please wait for the sync to complete.",
          },
        ],
      };
    }

    const answer = await queryKnowledgeBase(agent.geminiFileSearchStoreId, question, [], agent.geminiModel);
    return {
      content: [{ type: 'text', text: answer }],
    };
  } catch (error) {
    await logger.error('query-knowledge-error', {
      agentId: agent.id,
      error: getErrorMessage(error),
    });
    return {
      content: [
        {
          type: 'text',
          text: 'An error occurred while querying the knowledge base. Please try again later.',
        },
      ],
    };
  }
};

/**
 * Create token verification function
 */
const createVerifyToken = (agent: Agent) => {
  return async (_req: Request, bearerToken?: string): Promise<AuthInfo | undefined> => {
    if (!bearerToken) {
      await logger.warn('Missing bearer token', { agentId: agent.id });
      return undefined;
    }

    if (!agent.authTokenEncrypted) {
      await logger.warn('Agent does not have auth token configured', { agentId: agent.id });
      return undefined;
    }

    const encryptionKeyHex = await getSecret('AUTH_TOKEN_ENCRYPTION_KEY');
    if (!encryptionKeyHex) {
      await logger.warn('AUTH_TOKEN_ENCRYPTION_KEY is not configured', { agentId: agent.id });
      return undefined;
    }

    const encryptionKey = Buffer.from(encryptionKeyHex, 'hex');
    const isValid = verifyAuthToken(bearerToken, agent.authTokenEncrypted, encryptionKey);
    if (!isValid) {
      await logger.warn('Invalid auth token', { agentId: agent.id });
      return undefined;
    }

    return {
      token: bearerToken,
      clientId: agent.id,
      scopes: [],
      extra: { agent },
    };
  };
};

const buildBasePath = (agentId: string): string => {
  return `/api/agents/${agentId}`;
};

/**
 * Build agent-specific MCP handler with authentication
 * @param agent - Agent information
 */
export const buildMcpHandler = (agent: Agent) => {
  const basePath = buildBasePath(agent.id);
  const handler = createMcpHandler(
    (server) => {
      server.registerTool(
        'query_knowledge',
        {
          description: `Query the ${agent.name} (${agent.description || 'knowledge base'}) for information.`,
          inputSchema: {
            question: z.string().min(1).describe('Question to ask the knowledge base'),
          },
        },
        async ({ question }) => queryKnowledgeToolHandler(agent, question),
      );
    },
    {},
    {
      basePath,
    },
  );

  return withMcpAuth(handler, createVerifyToken(agent), { required: true });
};
