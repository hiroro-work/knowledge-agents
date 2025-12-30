import {
  agentRef,
  agentFilesRef,
  agentFileRef,
  syncSessionsRef,
  syncSessionRef,
  getDocumentData,
  createAgent,
  createAgentFile,
  createSyncSession,
} from '@local/admin-shared';
import { vi, describe, afterAll, afterEach, it, expect, beforeEach } from 'vitest';
import { firebaseFunctionsTest, clear, timestamp } from '../../../../tests/utils.js';

const test = firebaseFunctionsTest();

const TEST_DRIVE_SOURCE_ID = 'test-drive-source-1';

vi.mock('../../../utils/gemini.js', () => ({
  getGeminiClient: vi.fn(),
  deleteFileSearchStore: vi.fn(),
}));

describe('cleanupAgentResources', async () => {
  const { cleanupAgentResources } = await import('../onDeleted.js');

  afterEach(async () => {
    vi.clearAllMocks();
    await clear();
  });

  afterAll(() => {
    test.cleanup();
  });

  describe('agents/{agentId} cleanup', () => {
    const agentId = 'test-agent-id';

    beforeEach(async () => {
      const agentDocRef = agentRef(agentId);
      await createAgent(agentDocRef, {
        name: 'Test Agent',
        createdBy: 'user-1',
        driveSources: {
          [TEST_DRIVE_SOURCE_ID]: {
            googleDriveType: 'myDrive',
            googleDriveId: null,
            googleDriveFolderId: 'test-folder-id',
            googleDriveSyncPageToken: null,
            syncStatus: 'synced',
            lastSyncedAt: null,
            syncErrorMessage: null,
            displayName: 'Test Drive Source',
            createdAt: timestamp(new Date()),
          },
        },
      });

      await createAgentFile(agentFileRef('file-1', { parent: agentDocRef }), {
        driveSourceId: TEST_DRIVE_SOURCE_ID,
        googleDriveFileId: 'drive-file-1',
        fileName: 'test-file-1.pdf',
      });
      await createAgentFile(agentFileRef('file-2', { parent: agentDocRef }), {
        driveSourceId: TEST_DRIVE_SOURCE_ID,
        googleDriveFileId: 'drive-file-2',
        fileName: 'test-file-2.pdf',
      });

      await createSyncSession(syncSessionRef('session-1', { parent: agentDocRef }), {
        driveSourceId: TEST_DRIVE_SOURCE_ID,
        syncType: 'initial',
      });
      await createSyncSession(syncSessionRef('session-2', { parent: agentDocRef }), {
        driveSourceId: TEST_DRIVE_SOURCE_ID,
        syncType: 'incremental',
      });
    });

    it('files subcollection is deleted', async () => {
      const agentDocRef = agentRef(agentId);
      const { data: agent } = await getDocumentData(agentDocRef);

      await cleanupAgentResources(agent);

      const filesSnapshot = await agentFilesRef({ parent: agentDocRef }).get();
      expect(filesSnapshot.docs.length).toBe(0);
    });

    it('syncSessions subcollection is deleted', async () => {
      const agentDocRef = agentRef(agentId);
      const { data: agent } = await getDocumentData(agentDocRef);

      await cleanupAgentResources(agent);

      const sessionsSnapshot = await syncSessionsRef({ parent: agentDocRef }).get();
      expect(sessionsSnapshot.docs.length).toBe(0);
    });

    it('does not throw error when subcollections do not exist', async () => {
      const emptyAgentId = 'empty-agent-id';
      const emptyAgentDocRef = agentRef(emptyAgentId);
      await createAgent(emptyAgentDocRef, {
        name: 'Empty Agent',
        createdBy: 'user-2',
        driveSources: {},
      });
      const { data: agent } = await getDocumentData(emptyAgentDocRef);

      await expect(cleanupAgentResources(agent)).resolves.not.toThrow();
    });
  });
});
