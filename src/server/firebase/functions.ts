import { getFunctions } from '@local/admin-shared';
import { isTest } from '~/utils/utils';

const defaultRegion = 'asia-northeast1';

type SyncAgentDrivePayload = {
  agentId: string;
};

type InitialSyncAgentDrivePayload = {
  agentId: string;
  driveSourceId: string;
};

type CleanupDriveSourcePayload = {
  agentId: string;
  driveSourceId: string;
};

const taskQueue = <T extends Record<string, unknown>>(name: string) => {
  // NOTE: Test environment returns empty function to avoid errors
  if (isTest()) {
    return { enqueue: () => Promise.resolve() };
  }
  return getFunctions().taskQueue<T>(`locations/${defaultRegion}/functions/${name}`);
};

export const taskQueues = () => ({
  initialSyncAgentDrive: taskQueue<InitialSyncAgentDrivePayload>('taskQueues-initialSyncAgentDrive'),
  syncAgentDrive: taskQueue<SyncAgentDrivePayload>('taskQueues-syncAgentDrive'),
  cleanupDriveSource: taskQueue<CleanupDriveSourcePayload>('taskQueues-cleanupDriveSource'),
});
