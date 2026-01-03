import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import pLimit from 'p-limit';
import type { DriveSource } from '@local/shared';
import type { drive_v3 } from 'googleapis';

// Rate limiting for Google Drive API (limit concurrent requests)
const DRIVE_API_CONCURRENCY = 50;

/**
 * Get Google Drive API client
 */
export const getDriveClient = (): drive_v3.Drive => {
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return google.drive({ version: 'v3', auth: auth as any });
};

// Common parameters for Shared Drive
const SHARED_DRIVE_LIST_PARAMS = {
  includeItemsFromAllDrives: true,
  supportsAllDrives: true,
  corpora: 'drive' as const,
} as const;

const SHARED_DRIVE_CHANGES_PARAMS = {
  includeItemsFromAllDrives: true,
  supportsAllDrives: true,
} as const;

const getSharedDriveListParams = (isSharedDrive: boolean, driveId?: string) =>
  isSharedDrive && driveId ? { driveId, ...SHARED_DRIVE_LIST_PARAMS } : {};

const getSharedDriveChangesParams = (isSharedDrive: boolean, driveId?: string) =>
  isSharedDrive && driveId ? { driveId, ...SHARED_DRIVE_CHANGES_PARAMS } : {};

/**
 * Get all subfolder IDs under specified folder (recursive)
 */
export const getAllSubfolderIds = async (
  drive: drive_v3.Drive,
  parentFolderIds: string[],
  isSharedDrive: boolean,
  driveId?: string,
): Promise<readonly string[]> => {
  if (parentFolderIds.length === 0) return [];

  const sharedDriveParams = getSharedDriveListParams(isSharedDrive, driveId);
  const fetchSubfolders = async (parentId: string, pageToken?: string): Promise<readonly string[]> => {
    const response = await drive.files.list({
      q: `'${parentId}' in parents and trashed = false and mimeType = 'application/vnd.google-apps.folder'`,
      fields: 'nextPageToken,files(id)',
      pageSize: 1000,
      pageToken,
      ...sharedDriveParams,
    });

    const ids = (response.data.files ?? []).map((f) => f.id).filter((id): id is string => !!id);
    if (!response.data.nextPageToken) return ids;

    const moreIds = await fetchSubfolders(parentId, response.data.nextPageToken);
    return [...ids, ...moreIds];
  };

  // Fetch subfolders from all parent folders in parallel (with rate limiting)
  const limit = pLimit(DRIVE_API_CONCURRENCY);
  const results = await Promise.all(parentFolderIds.map((parentId) => limit(() => fetchSubfolders(parentId))));
  const allSubfolderIds = results.flat();

  // Recursively fetch deeper subfolders
  if (allSubfolderIds.length > 0) {
    const deeperSubfolderIds = await getAllSubfolderIds(drive, allSubfolderIds, isSharedDrive, driveId);
    return [...new Set([...allSubfolderIds, ...deeperSubfolderIds])];
  }

  return allSubfolderIds;
};

/**
 * Get all files using Google Drive Files API (for initial sync, with pagination, including subfolders)
 */
export const getAllFiles = async (
  drive: drive_v3.Drive,
  driveSource: DriveSource,
): Promise<readonly drive_v3.Schema$File[]> => {
  const isSharedDrive = driveSource.googleDriveType === 'sharedDrive';
  const targetFolderId = driveSource.googleDriveFolderId;
  const sharedDriveParams = getSharedDriveListParams(isSharedDrive, driveSource.googleDriveId ?? undefined);

  // Get all subfolder IDs
  const subfolderIds = await getAllSubfolderIds(
    drive,
    [targetFolderId],
    isSharedDrive,
    driveSource.googleDriveId ?? undefined,
  );
  const allFolderIds = [targetFolderId, ...subfolderIds];

  const fetchFilesFromFolder = async (
    folderId: string,
    pageToken?: string,
  ): Promise<readonly drive_v3.Schema$File[]> => {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false and mimeType != 'application/vnd.google-apps.folder'`,
      fields: 'nextPageToken,files(id,name,mimeType,modifiedTime,md5Checksum,size)',
      pageSize: 1000,
      pageToken,
      ...sharedDriveParams,
    });

    const files = response.data.files ?? [];
    if (!response.data.nextPageToken) return files;

    const moreFiles = await fetchFilesFromFolder(folderId, response.data.nextPageToken);
    return [...files, ...moreFiles];
  };

  // Fetch files from all folders in parallel (with rate limiting)
  const limit = pLimit(DRIVE_API_CONCURRENCY);
  const results = await Promise.all(allFolderIds.map((folderId) => limit(() => fetchFilesFromFolder(folderId))));
  return results.flat();
};

type ChangesResult = {
  readonly changes: readonly drive_v3.Schema$Change[];
  readonly newStartPageToken: string | null;
};

type SharedDriveChangesParams = ReturnType<typeof getSharedDriveChangesParams>;

/**
 * Fetch all changes using pagination
 */
const fetchChanges = async (
  drive: drive_v3.Drive,
  initialPageToken: string,
  sharedDriveParams: SharedDriveChangesParams,
): Promise<ChangesResult> => {
  const allChanges: drive_v3.Schema$Change[] = [];
  let currentPageToken: string | null = initialPageToken;
  let newStartPageToken: string | null = null;

  while (currentPageToken) {
    const response: { data: drive_v3.Schema$ChangeList } = await drive.changes.list({
      pageToken: currentPageToken,
      pageSize: 1000,
      includeRemoved: true,
      fields:
        'newStartPageToken,nextPageToken,changes(fileId,removed,file(id,name,mimeType,modifiedTime,md5Checksum,size,parents))',
      ...sharedDriveParams,
    });

    allChanges.push(...(response.data.changes ?? []));
    newStartPageToken = response.data.newStartPageToken ?? newStartPageToken;
    currentPageToken = response.data.nextPageToken ?? null;
  }

  return {
    changes: allChanges,
    newStartPageToken,
  };
};

/**
 * Get changes using Google Drive Changes API (with pagination)
 */
export const getChanges = async (drive: drive_v3.Drive, driveSource: DriveSource): Promise<ChangesResult> => {
  const initialPageToken = driveSource.googleDriveSyncPageToken;

  if (!initialPageToken) {
    throw new Error('googleDriveSyncPageToken is not set. Use getAllFiles for initial sync.');
  }

  const isSharedDrive = driveSource.googleDriveType === 'sharedDrive';
  const sharedDriveParams = getSharedDriveChangesParams(isSharedDrive, driveSource.googleDriveId ?? undefined);

  return fetchChanges(drive, initialPageToken, sharedDriveParams);
};

/**
 * Get page token for initial sync
 */
export const getStartPageToken = async (drive: drive_v3.Drive, driveSource: DriveSource): Promise<string> => {
  const isSharedDrive = driveSource.googleDriveType === 'sharedDrive';

  if (isSharedDrive && driveSource.googleDriveId) {
    const response = await drive.changes.getStartPageToken({
      driveId: driveSource.googleDriveId,
      supportsAllDrives: true,
    });
    const token = response.data.startPageToken;
    if (!token) {
      throw new Error('Failed to get start page token');
    }
    return token;
  } else {
    const response = await drive.changes.getStartPageToken();
    const token = response.data.startPageToken;
    if (!token) {
      throw new Error('Failed to get start page token');
    }
    return token;
  }
};

/**
 * Check if MIME type is Google Workspace type
 */
export const isGoogleWorkspaceFile = (mimeType: string): boolean => {
  return mimeType.startsWith('application/vnd.google-apps.');
};

/**
 * Convert Google Workspace MIME type to export format
 * Returns null for unsupported Google Workspace formats
 */
export const getExportMimeType = (mimeType: string): string | null => {
  const exportMap: Record<string, string> = {
    'application/vnd.google-apps.document': 'application/pdf',
    'application/vnd.google-apps.spreadsheet': 'application/pdf',
    'application/vnd.google-apps.presentation': 'application/pdf',
    'application/vnd.google-apps.drawing': 'application/pdf',
  };
  return exportMap[mimeType] ?? null;
};

/**
 * Export Google Workspace file
 */
const exportWorkspaceFile = async (
  drive: drive_v3.Drive,
  fileId: string,
  mimeType: string,
  isSharedDrive: boolean,
): Promise<Buffer | null> => {
  const exportMimeType = getExportMimeType(mimeType);
  if (!exportMimeType) return null;

  const params: drive_v3.Params$Resource$Files$Export = {
    fileId,
    mimeType: exportMimeType,
    ...(isSharedDrive ? { supportsAllDrives: true } : {}),
  };

  const response = await drive.files.export(params, {
    responseType: 'arraybuffer',
  });

  return Buffer.from(response.data as ArrayBuffer);
};

/**
 * Download regular file
 */
const downloadRegularFile = async (drive: drive_v3.Drive, fileId: string, isSharedDrive: boolean): Promise<Buffer> => {
  const params: drive_v3.Params$Resource$Files$Get = {
    fileId,
    alt: 'media',
    ...(isSharedDrive ? { supportsAllDrives: true } : {}),
  };

  const response = await drive.files.get(params, {
    responseType: 'arraybuffer',
  });

  return Buffer.from(response.data as ArrayBuffer);
};

/**
 * Download file from Google Drive and return as Buffer
 * Google Workspace files are exported as PDF
 */
export const downloadFile = async (
  drive: drive_v3.Drive,
  fileId: string,
  mimeType: string,
  isSharedDrive: boolean,
): Promise<Buffer | null> => {
  if (isGoogleWorkspaceFile(mimeType)) {
    return exportWorkspaceFile(drive, fileId, mimeType, isSharedDrive);
  }

  return downloadRegularFile(drive, fileId, isSharedDrive);
};
