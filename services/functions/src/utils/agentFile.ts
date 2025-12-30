import { deleteAgentFile } from '@local/admin-shared';
import { deleteFileFromStore } from './gemini.js';
import type { getGeminiClient } from './gemini.js';
import type { DocumentReference } from '@local/admin-shared';
import type { AgentFileDocumentData } from '@local/shared';

/**
 * Delete AgentFile from both Gemini File Store and Firestore
 */
export const deleteAgentFileCompletely = async (
  ai: ReturnType<typeof getGeminiClient>,
  geminiFileSearchFileId: string,
  ref: DocumentReference<AgentFileDocumentData>,
): Promise<void> => {
  await deleteFileFromStore(ai, geminiFileSearchFileId);
  await deleteAgentFile(ref);
};
