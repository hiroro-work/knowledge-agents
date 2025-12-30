import { agentsRef, getCollectionData } from '@local/admin-shared';
import { onSchedule, taskQueues } from '../utils/firebase/functions.js';

/**
 * Periodically enqueue differential sync tasks for initially synced agents to Cloud Tasks
 * Runs every hour
 */
export const scheduleAgentSync = onSchedule(
  {
    schedule: '0 * * * *',
    timeZone: 'Asia/Tokyo',
  },
  async () => {
    // Get all agents
    const agents = await getCollectionData(agentsRef());
    const { syncAgentDrive } = taskQueues();
    for (const agent of agents) {
      if (!agent.driveSources || Object.keys(agent.driveSources).length === 0) {
        continue;
      }
      const hasSyncableSource = Object.values(agent.driveSources).some(
        ({ googleDriveSyncPageToken }) => googleDriveSyncPageToken !== null,
      );
      if (!hasSyncableSource) {
        continue;
      }
      await syncAgentDrive.enqueue({ agentId: agent.id });
    }
  },
);
