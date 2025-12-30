import { Factory } from 'fishery';
import { timestamp } from '../utils.js';
import type { AgentFile, AgentFileDocumentData } from '@local/shared';

const agentFileData = ({ sequence }: { sequence: number }) => ({
  createdAt: timestamp(new Date()),
  updatedAt: timestamp(new Date()),
  driveSourceId: `drive-source-${sequence}`,
  googleDriveFileId: `drive-file-${sequence}`,
  geminiFileSearchFileId: `gemini-file-${sequence}`,
  fileName: `test-file-${sequence}.pdf`,
  mimeType: 'application/pdf',
  fileSize: 1024 * sequence,
  md5Checksum: `md5-checksum-${sequence}`,
  modifiedTime: timestamp(new Date()),
});

export const agentFileDataFactory = Factory.define<AgentFileDocumentData>(({ sequence }) =>
  agentFileData({ sequence }),
);

export const agentFileFactory = Factory.define<AgentFile>(({ sequence }) => ({
  id: `agent-file-${sequence}`,
  ...agentFileData({ sequence }),
}));
