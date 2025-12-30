import { getAgent } from '@local/admin-shared';
import { initializeApp } from '~/server/firebase/app';
import { buildMcpHandler } from '~/server/mcp/mcpHandler';
import type { NextRequest } from 'next/server';

initializeApp();

/**
 * MCP request handler for agents
 * Path: /api/agents/[agentId]/[transport]
 * Supports both SSE and HTTP transport methods
 */
const handler = async (request: NextRequest, { params }: { params: Promise<{ agentId: string }> }) => {
  const { agentId } = await params;

  const agent = await getAgent(agentId);
  if (!agent) {
    return new Response('Agent not found', { status: 404 });
  }

  const mcpHandler = buildMcpHandler(agent);
  return await mcpHandler(request);
};

export { handler as GET, handler as POST, handler as DELETE };
