import { GoogleGenAI } from '@google/genai';
import { defaultGeminiModel } from '@local/shared';
import { getSecret } from '~/server/firebase/secret';
import { isTest } from '~/utils/utils';

/**
 * Get Gemini API key from Secret Manager
 */
const getGeminiApiKey = async (): Promise<string> => {
  const apiKey = await getSecret('GEMINI_API_KEY');
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
  return apiKey;
};

/**
 * Get Gemini API client
 */
export const getGeminiClient = async (): Promise<GoogleGenAI> => {
  const apiKey = await getGeminiApiKey();
  return new GoogleGenAI({ apiKey });
};

/**
 * Create a File Search Store
 */
export const createFileSearchStore = async (agentId: string): Promise<string> => {
  // NOTE: Return dummy value without calling Gemini API in test environment
  if (isTest()) {
    return `test-store-${agentId}`;
  }

  const ai = await getGeminiClient();
  const fileSearchStore = await ai.fileSearchStores.create({
    config: { displayName: `agent-${agentId}` },
  });

  if (!fileSearchStore.name) {
    throw new Error('Failed to create File Search Store');
  }

  return fileSearchStore.name;
};

export type ChatMessage = {
  role: 'user' | 'model';
  content: string;
};

const KNOWLEDGE_BASE_SYSTEM_INSTRUCTION = `You are an assistant dedicated to the knowledge base. Please strictly follow the rules below:

## Information Sources for Answers
- Answers must be based only on information from documents retrieved through file search

## When Information Is Not in the Documents
- Clearly state "The provided documents do not contain that information"`;

/**
 * Query knowledge base using File Search Store
 */
export const queryKnowledgeBase = async (
  storeId: string,
  question: string,
  history: ChatMessage[] = [],
  model = defaultGeminiModel,
): Promise<string> => {
  // NOTE: Return dummy value without calling Gemini API in test environment
  if (isTest()) {
    return `Test environment - actual response not generated. Question: ${question}`;
  }

  const ai = await getGeminiClient();

  // Convert conversation history to Gemini API format
  const contents = [
    ...history.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    })),
    { role: 'user' as const, parts: [{ text: question }] },
  ];

  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      systemInstruction: KNOWLEDGE_BASE_SYSTEM_INSTRUCTION,
      tools: [
        {
          fileSearch: {
            fileSearchStoreNames: [storeId],
          },
        },
      ],
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('Failed to generate response from Gemini');
  }

  return text;
};

/**
 * Query knowledge base using File Search Store (streaming version)
 */
export async function* queryKnowledgeBaseStream(
  storeId: string,
  question: string,
  history: ChatMessage[] = [],
  model = defaultGeminiModel,
): AsyncGenerator<string, void, unknown> {
  // NOTE: Return dummy value without calling Gemini API in test environment
  if (isTest()) {
    yield `Test environment - actual response not generated. Question: ${question}`;
    return;
  }

  const ai = await getGeminiClient();

  // Convert conversation history to Gemini API format
  const contents = [
    ...history.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    })),
    { role: 'user' as const, parts: [{ text: question }] },
  ];

  const response = await ai.models.generateContentStream({
    model,
    contents,
    config: {
      systemInstruction: KNOWLEDGE_BASE_SYSTEM_INSTRUCTION,
      tools: [
        {
          fileSearch: {
            fileSearchStoreNames: [storeId],
          },
        },
      ],
    },
  });

  for await (const chunk of response) {
    if (chunk.text) {
      yield chunk.text;
    }
  }
}
