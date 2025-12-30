import { agentFilesRef, agentRef as _agentRef, getFirestore, syncSessionsRef } from '@local/admin-shared';
import { logger, onDocumentDeleted } from '../../utils/firebase/functions.js';
import { deleteFileSearchStore, getGeminiClient } from '../../utils/gemini.js';
import type { Agent } from '@local/shared';

export const cleanupAgentResources = async (agent: Agent): Promise<void> => {
  const { id: agentId, geminiFileSearchStoreId } = agent;
  logger.info('Cleaning up agent resources', { agentId, geminiFileSearchStoreId });
  if (geminiFileSearchStoreId) {
    try {
      const ai = getGeminiClient();
      await deleteFileSearchStore(ai, geminiFileSearchStoreId);
      logger.info('FileSearchStore deleted', { agentId, storeId: geminiFileSearchStoreId });
    } catch (error) {
      logger.error('Failed to delete FileSearchStore', {
        agentId,
        storeId: geminiFileSearchStoreId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const agentRef = _agentRef(agentId);
  try {
    const filesRef = agentFilesRef({ parent: agentRef });
    await getFirestore().recursiveDelete(filesRef);
    logger.info('Files subcollection deleted', { agentId });
  } catch (error) {
    logger.error('Failed to delete files subcollection', {
      agentId,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    const sessionsRef = syncSessionsRef({ parent: agentRef });
    await getFirestore().recursiveDelete(sessionsRef);
    logger.info('SyncSessions subcollection deleted', { agentId });
  } catch (error) {
    logger.error('Failed to delete syncSessions subcollection', {
      agentId,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  logger.info('Agent cleanup completed', { agentId });
};

export const onDeleted = onDocumentDeleted(
  {
    document: 'agents/{agentId}',
    secrets: ['GEMINI_API_KEY'],
  },
  async (event) => {
    const snapshot = event.data!;
    const agent = { id: snapshot.id, ...snapshot.data() } as Agent;
    await cleanupAgentResources(agent);
  },
);
