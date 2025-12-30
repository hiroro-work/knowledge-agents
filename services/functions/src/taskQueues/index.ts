import { cleanupDriveSource } from './cleanupDriveSource.js';
import { initialSyncAgentDrive } from './initialSyncAgentDrive.js';
import { syncAgentDrive } from './syncAgentDrive.js';
import { syncAgentFile } from './syncAgentFile.js';

export const taskQueues = {
  cleanupDriveSource,
  initialSyncAgentDrive,
  syncAgentDrive,
  syncAgentFile,
};
