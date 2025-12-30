import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Timestamp } from '@local/admin-shared';
import type { Agent } from '@local/shared';

vi.mock('@local/admin-shared', () => ({
  verifyAuthToken: vi.fn(),
}));

vi.mock('~/server/logging', () => ({
  logger: {
    info: vi.fn().mockResolvedValue(undefined),
    warn: vi.fn().mockResolvedValue(undefined),
    error: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('~/server/utils/gemini', () => ({
  queryKnowledgeBase: vi.fn(),
}));

vi.mock('~/server/firebase/secret', () => ({
  getSecret: vi.fn(),
}));

describe('mcpHandler', () => {
  const mockAgent: Agent = {
    id: 'test-agent',
    name: 'Test Agent',
    description: 'Test description',
    geminiModel: 'gemini-2.5-flash',
    createdBy: 'user-1',
    authTokenEncrypted: 'encrypted-token',
    geminiFileSearchStoreId: 'store-id',
    driveSources: {
      'drive-source-1': {
        googleDriveType: 'sharedDrive',
        googleDriveId: 'drive-id',
        googleDriveFolderId: 'folder-id',
        googleDriveSyncPageToken: null,
        syncStatus: 'synced',
        lastSyncedAt: null,
        syncErrorMessage: null,
        displayName: 'Test Agent',
        createdAt: new Date() as unknown as Timestamp,
      },
    },
    createdAt: new Date() as unknown as Timestamp,
    updatedAt: new Date() as unknown as Timestamp,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('buildMcpHandler', () => {
    it('can create handler', async () => {
      const { buildMcpHandler } = await import('../mcpHandler');
      const handler = buildMcpHandler(mockAgent);

      expect(handler).toBeDefined();
      expect(typeof handler).toBe('function');
    });

    it('can create handler for agent without authTokenEncrypted', async () => {
      const agentWithoutToken: Agent = {
        ...mockAgent,
        authTokenEncrypted: null,
      };

      const { buildMcpHandler } = await import('../mcpHandler');
      const handler = buildMcpHandler(agentWithoutToken);

      expect(handler).toBeDefined();
      expect(typeof handler).toBe('function');
    });

    it('can create handler for agent without geminiFileSearchStoreId', async () => {
      const agentWithoutStore: Agent = {
        ...mockAgent,
        geminiFileSearchStoreId: null,
      };

      const { buildMcpHandler } = await import('../mcpHandler');
      const handler = buildMcpHandler(agentWithoutStore);

      expect(handler).toBeDefined();
      expect(typeof handler).toBe('function');
    });
  });
});
