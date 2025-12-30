import { getAuth } from '~/utils/firebase/auth';
import type { GeminiModel, GoogleDriveType } from '@local/shared';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const createApiFunction = <Request = object | void, Response = object | null>(url: string) => {
  return async (data: Request) => {
    const auth = getAuth();
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(data ?? null),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Unknown error' }));
      throw new ApiError(error || 'Unknown error', res.status);
    }
    const responseData = await res.json();
    return responseData as Response;
  };
};

const parseSSEData = (data: string): { text?: string; error?: string } | null => {
  if (data === '[DONE]') return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

const SSE_DATA_PREFIX = 'data: ';
async function* readSSEStream(body: ReadableStream<Uint8Array>) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (line.startsWith(SSE_DATA_PREFIX)) {
          yield line.slice(SSE_DATA_PREFIX.length);
        }
      }
    }
    buffer += decoder.decode();
    if (buffer.startsWith(SSE_DATA_PREFIX)) {
      yield buffer.slice(SSE_DATA_PREFIX.length);
    }
  } finally {
    reader.releaseLock();
  }
}

const createStreamingApiFunction = <Request = object | void>(url: string) => {
  return async (payload: Request, onChunk: (text: string) => void): Promise<void> => {
    const auth = getAuth();
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(payload ?? null),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
      throw new ApiError(errorData.error || 'Unknown error', res.status);
    }
    if (!res.body) {
      throw new ApiError('Response body is not readable', 500);
    }
    for await (const chunk of readSSEStream(res.body)) {
      const parsed = parseSSEData(chunk);
      if (!parsed) continue;
      if (parsed.error) {
        throw new ApiError(parsed.error, 500);
      }
      if (parsed.text) {
        onChunk(parsed.text);
      }
    }
  };
};

// Agent APIs
type CreateAgentRequest = {
  slug: string;
  name: string;
  description: string;
  googleDriveType: GoogleDriveType;
  googleDriveId: string | null;
  googleDriveFolderId: string;
  geminiModel?: GeminiModel;
};
type CreateAgentResponse = { agentId: string; token: string };
export const createAgent = createApiFunction<CreateAgentRequest, CreateAgentResponse>('/api/agents/create');

type UpdateAgentRequest = {
  agentId: string;
  name?: string;
  description?: string;
  geminiModel?: GeminiModel;
};
type UpdateAgentResponse = { success: boolean };
export const updateAgentApi = createApiFunction<UpdateAgentRequest, UpdateAgentResponse>('/api/agents/update');

type DeleteAgentRequest = { agentId: string };
type DeleteAgentResponse = { success: boolean };
export const deleteAgentApi = createApiFunction<DeleteAgentRequest, DeleteAgentResponse>('/api/agents/delete');

type SyncAgentRequest = { agentId: string };
export const syncAgent = createApiFunction<SyncAgentRequest>('/api/agents/sync');

// Token APIs
type GetTokenRequest = { agentId: string };
type GetTokenResponse = { token: string | null; hasToken: boolean };
export const getMcpToken = createApiFunction<GetTokenRequest, GetTokenResponse>('/api/agents/get-token');

type RegenerateTokenRequest = { agentId: string };
type RegenerateTokenResponse = { token: string; message: string };
export const regenerateMcpToken = createApiFunction<RegenerateTokenRequest, RegenerateTokenResponse>(
  '/api/agents/regenerate-token',
);

// DriveSource APIs
type AddDriveSourceRequest = {
  agentId: string;
  googleDriveType: GoogleDriveType;
  googleDriveId: string | null;
  googleDriveFolderId: string;
  displayName?: string;
};
type AddDriveSourceResponse = { driveSourceId: string };
export const addDriveSource = createApiFunction<AddDriveSourceRequest, AddDriveSourceResponse>(
  '/api/agents/drive-sources/add',
);

type DeleteDriveSourceRequest = { agentId: string; driveSourceId: string };
type DeleteDriveSourceResponse = { success: boolean };
export const deleteDriveSource = createApiFunction<DeleteDriveSourceRequest, DeleteDriveSourceResponse>(
  '/api/agents/drive-sources/delete',
);

// Chat APIs (for Phase 5)
export type ChatMessage = { role: 'user' | 'model'; content: string };
type ChatRequest = { agentId: string; message: string; history?: ChatMessage[] };
export const chatWithAgentStream = createStreamingApiFunction<ChatRequest>('/api/agents/chat');

// User APIs (Admin)
type CreateUserRequest = { email: string; role: 'user' | 'admin' };
type CreateUserResponse = { success: boolean; userId: string };
export const createUser = createApiFunction<CreateUserRequest, CreateUserResponse>('/api/admin/users/create');

type UpdateUserRoleRequest = { userId: string; role: 'user' | 'admin' };
type UpdateUserRoleResponse = { success: boolean };
export const updateUserRole = createApiFunction<UpdateUserRoleRequest, UpdateUserRoleResponse>(
  '/api/admin/users/update-role',
);

type DeleteUserRequest = { userId: string };
type DeleteUserResponse = { success: boolean };
export const deleteUser = createApiFunction<DeleteUserRequest, DeleteUserResponse>('/api/admin/users/delete');
