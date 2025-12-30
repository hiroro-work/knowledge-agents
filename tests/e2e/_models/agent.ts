import { createAgent as createFirestoreAgent, agentsRef } from '@local/admin-shared';
import { agentDataFactory } from '@local/test-shared';
import type { AgentDocumentData } from '@local/shared';

type CreateAgentParams = Partial<AgentDocumentData> & {
  id?: string;
};

const createAgent = async ({ id, ...overrides }: CreateAgentParams) => {
  const ref = id ? agentsRef().doc(id) : agentsRef().doc();
  const data = agentDataFactory.build(overrides);
  await createFirestoreAgent(ref, data);
  return { id: ref.id };
};

export { createAgent };
