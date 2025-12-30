import { agentRef, createAgent, createSyncSession, getDocumentData, syncSessionRef } from '@local/admin-shared';
import { vi, describe, afterAll, afterEach, it, expect, beforeEach } from 'vitest';
import { firebaseFunctionsTest, clear, timestamp } from '../../../../../tests/utils.js';
import type { SyncSession } from '@local/shared';

const test = firebaseFunctionsTest();

const TEST_DRIVE_SOURCE_ID = 'test-drive-source-1';

describe('handleSyncSessionUpdate', async () => {
  const { handleSyncSessionUpdate } = await import('../onUpdated.js');

  afterEach(async () => {
    vi.clearAllMocks();
    await clear();
  });

  afterAll(() => {
    test.cleanup();
  });

  const createTestAgent = async (agentId: string) => {
    const ref = agentRef(agentId);
    await createAgent(ref, {
      name: 'Test Agent',
      createdBy: 'user-1',
      driveSources: {
        [TEST_DRIVE_SOURCE_ID]: {
          googleDriveType: 'myDrive',
          googleDriveId: null,
          googleDriveFolderId: 'test-folder-id',
          googleDriveSyncPageToken: null,
          syncStatus: 'syncing',
          lastSyncedAt: null,
          syncErrorMessage: null,
          displayName: 'Test Drive Source',
          createdAt: timestamp(new Date()),
        },
      },
    });
    return ref;
  };

  const createTestSyncSession = async (sessionId: string, agentId: string, data: Partial<SyncSession> = {}) => {
    const agentDocRef = agentRef(agentId);
    const sessionRef = syncSessionRef(sessionId, { parent: agentDocRef });
    await createSyncSession(sessionRef, {
      driveSourceId: TEST_DRIVE_SOURCE_ID,
      syncType: 'initial',
      totalFiles: 10,
      processedFiles: 0,
      successFiles: 0,
      failedFiles: 0,
      skippedFiles: 0,
      status: 'in_progress',
      pageToken: null,
      failedFileDetails: [],
      ...data,
    });
    return sessionRef;
  };

  const baseSyncSession: SyncSession = {
    id: 'session-1',
    createdAt: timestamp(new Date()),
    updatedAt: timestamp(new Date()),
    driveSourceId: TEST_DRIVE_SOURCE_ID,
    syncType: 'initial',
    totalFiles: 10,
    processedFiles: 0,
    successFiles: 0,
    failedFiles: 0,
    skippedFiles: 0,
    status: 'in_progress',
    pageToken: null,
    failedFileDetails: [],
  };

  describe('Early return cases', () => {
    const agentId = 'test-agent-1';

    beforeEach(async () => {
      await createTestAgent(agentId);
      await createTestSyncSession('session-1', agentId);
    });

    it('does not update anything when status is completed', async () => {
      const agentDocRef = agentRef(agentId);
      const { data: agentBefore } = await getDocumentData(agentDocRef);
      const driveSourceBefore = agentBefore.driveSources[TEST_DRIVE_SOURCE_ID]!;

      const before: SyncSession = { ...baseSyncSession, processedFiles: 9 };
      const after: SyncSession = { ...baseSyncSession, status: 'completed', processedFiles: 10 };

      await handleSyncSessionUpdate(agentId, before, after);

      const { data: agentAfter } = await getDocumentData(agentDocRef);
      const driveSourceAfter = agentAfter.driveSources[TEST_DRIVE_SOURCE_ID]!;
      expect(driveSourceAfter.syncStatus).toBe(driveSourceBefore.syncStatus);
      expect(driveSourceAfter.lastSyncedAt).toBe(driveSourceBefore.lastSyncedAt);

      const sessionRef = syncSessionRef('session-1', { parent: agentDocRef });
      const { data: session } = await getDocumentData(sessionRef);
      expect(session.status).toBe('in_progress');
    });

    it('does not update anything when processedFiles has not changed', async () => {
      const agentDocRef = agentRef(agentId);
      const { data: agentBefore } = await getDocumentData(agentDocRef);
      const driveSourceBefore = agentBefore.driveSources[TEST_DRIVE_SOURCE_ID]!;

      const before: SyncSession = { ...baseSyncSession, processedFiles: 5 };
      const after: SyncSession = { ...baseSyncSession, processedFiles: 5 };

      await handleSyncSessionUpdate(agentId, before, after);

      const { data: agentAfter } = await getDocumentData(agentDocRef);
      const driveSourceAfter = agentAfter.driveSources[TEST_DRIVE_SOURCE_ID]!;
      expect(driveSourceAfter.syncStatus).toBe(driveSourceBefore.syncStatus);
      expect(driveSourceAfter.lastSyncedAt).toBe(driveSourceBefore.lastSyncedAt);

      const sessionRef = syncSessionRef('session-1', { parent: agentDocRef });
      const { data: session } = await getDocumentData(sessionRef);
      expect(session.status).toBe('in_progress');
    });

    it('does not update anything when processedFiles < totalFiles', async () => {
      const agentDocRef = agentRef(agentId);
      const { data: agentBefore } = await getDocumentData(agentDocRef);
      const driveSourceBefore = agentBefore.driveSources[TEST_DRIVE_SOURCE_ID]!;

      const before: SyncSession = { ...baseSyncSession, processedFiles: 5 };
      const after: SyncSession = { ...baseSyncSession, processedFiles: 8 };

      await handleSyncSessionUpdate(agentId, before, after);

      const { data: agentAfter } = await getDocumentData(agentDocRef);
      const driveSourceAfter = agentAfter.driveSources[TEST_DRIVE_SOURCE_ID]!;
      expect(driveSourceAfter.syncStatus).toBe(driveSourceBefore.syncStatus);
      expect(driveSourceAfter.lastSyncedAt).toBe(driveSourceBefore.lastSyncedAt);

      const sessionRef = syncSessionRef('session-1', { parent: agentDocRef });
      const { data: session } = await getDocumentData(sessionRef);
      expect(session.status).toBe('in_progress');
    });
  });

  describe('When all files are processed', () => {
    const agentId = 'test-agent-2';

    beforeEach(async () => {
      await createTestAgent(agentId);
      await createTestSyncSession('session-1', agentId);
    });

    it('updates syncStatus to synced and sets syncErrorMessage to null when no failures', async () => {
      const before: SyncSession = { ...baseSyncSession, processedFiles: 9 };
      const after: SyncSession = {
        ...baseSyncSession,
        processedFiles: 10,
        successFiles: 10,
        failedFiles: 0,
      };

      await handleSyncSessionUpdate(agentId, before, after);

      const agentDocRef = agentRef(agentId);
      const { data: agent } = await getDocumentData(agentDocRef);
      const driveSource = agent.driveSources[TEST_DRIVE_SOURCE_ID]!;
      expect(driveSource.syncStatus).toBe('synced');
      expect(driveSource.syncErrorMessage).toBeNull();
      expect(driveSource.lastSyncedAt).toBeDefined();

      const sessionRef = syncSessionRef('session-1', { parent: agentDocRef });
      const { data: session } = await getDocumentData(sessionRef);
      expect(session.status).toBe('completed');
    });

    it('updates syncStatus to synced and includes failure count in syncErrorMessage when there are failures', async () => {
      const before: SyncSession = { ...baseSyncSession, processedFiles: 9 };
      const after: SyncSession = {
        ...baseSyncSession,
        processedFiles: 10,
        successFiles: 7,
        failedFiles: 3,
      };

      await handleSyncSessionUpdate(agentId, before, after);

      const agentDocRef = agentRef(agentId);
      const { data: agent } = await getDocumentData(agentDocRef);
      const driveSource = agent.driveSources[TEST_DRIVE_SOURCE_ID]!;
      expect(driveSource.syncStatus).toBe('synced');
      expect(driveSource.syncErrorMessage).toBe('Sync failed for 3 file(s)');
      expect(driveSource.lastSyncedAt).toBeDefined();
    });

    it('updates googleDriveSyncPageToken when pageToken exists', async () => {
      const before: SyncSession = { ...baseSyncSession, processedFiles: 9 };
      const after: SyncSession = {
        ...baseSyncSession,
        processedFiles: 10,
        successFiles: 10,
        failedFiles: 0,
        pageToken: 'new-page-token-123',
      };

      await handleSyncSessionUpdate(agentId, before, after);

      const agentDocRef = agentRef(agentId);
      const { data: agent } = await getDocumentData(agentDocRef);
      const driveSource = agent.driveSources[TEST_DRIVE_SOURCE_ID]!;
      expect(driveSource.googleDriveSyncPageToken).toBe('new-page-token-123');
    });

    it('does not update googleDriveSyncPageToken when pageToken is null', async () => {
      const agentDocRef = agentRef(agentId);
      await agentDocRef.update({
        [`driveSources.${TEST_DRIVE_SOURCE_ID}.googleDriveSyncPageToken`]: 'existing-token',
      });

      const before: SyncSession = { ...baseSyncSession, processedFiles: 9 };
      const after: SyncSession = {
        ...baseSyncSession,
        processedFiles: 10,
        successFiles: 10,
        failedFiles: 0,
        pageToken: null,
      };

      await handleSyncSessionUpdate(agentId, before, after);

      const { data: agent } = await getDocumentData(agentDocRef);
      const driveSource = agent.driveSources[TEST_DRIVE_SOURCE_ID]!;
      expect(driveSource.googleDriveSyncPageToken).toBe('existing-token');
    });
  });
});
