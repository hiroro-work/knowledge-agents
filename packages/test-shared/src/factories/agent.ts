import { defaultDriveSourceSyncStatus, defaultGeminiModel, defaultGoogleDriveType } from '@local/shared';
import { Factory } from 'fishery';
import { timestamp } from '../utils.js';
import type { Agent, AgentDocumentData, DriveSource } from '@local/shared';

const createDriveSource = (sequence: number): DriveSource => ({
  googleDriveType: defaultGoogleDriveType,
  googleDriveId: null,
  googleDriveFolderId: `folder-${sequence}`,
  googleDriveSyncPageToken: null,
  syncStatus: defaultDriveSourceSyncStatus,
  lastSyncedAt: null,
  syncErrorMessage: null,
  displayName: '',
  createdAt: timestamp(new Date()),
});

const agentData = ({ sequence }: { sequence: number }) => ({
  createdAt: timestamp(new Date()),
  updatedAt: timestamp(new Date()),
  createdBy: `user-${sequence}`,
  name: `Agent ${sequence}`,
  description: `Test agent ${sequence}`,
  geminiFileSearchStoreId: null,
  geminiModel: defaultGeminiModel,
  authTokenEncrypted: null,
  driveSources: {},
});

export const agentDataFactory = Factory.define<AgentDocumentData>(({ sequence }) => agentData({ sequence }));

export const agentFactory = Factory.define<Agent>(({ sequence }) => ({
  id: `agent-${sequence}`,
  ...agentData({ sequence }),
}));

export const driveSourceFactory = Factory.define<DriveSource>(({ sequence }) => createDriveSource(sequence));
