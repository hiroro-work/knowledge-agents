import { GoogleGenAI } from '@google/genai';
import { env } from './env.js';
import { getExportMimeType, isGoogleWorkspaceFile } from './googleDrive.js';

/**
 * Get Gemini API key
 */
const getGeminiApiKey = (): string => {
  return env('GEMINI_API_KEY');
};

/**
 * Get Gemini API client
 */
export const getGeminiClient = (): GoogleGenAI => {
  const apiKey = getGeminiApiKey();
  return new GoogleGenAI({ apiKey });
};

/**
 * Create a File Search Store
 */
export const createFileSearchStore = async (ai: GoogleGenAI, agentId: string): Promise<string> => {
  const fileSearchStore = await ai.fileSearchStores.create({
    config: { displayName: `agent-${agentId}` },
  });

  if (!fileSearchStore.name) {
    throw new Error('Failed to create File Search Store');
  }

  return fileSearchStore.name;
};

/**
 * Upload a file to File Search Store
 * Waits for completion (up to 5 minutes)
 */
export const uploadFileToStore = async (
  ai: GoogleGenAI,
  storeId: string,
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
): Promise<{ name: string }> => {
  // Convert Buffer to Uint8Array then to Blob
  const uint8Array = new Uint8Array(fileBuffer);
  const blob = new Blob([uint8Array], { type: mimeType });

  // Upload the file
  let operation = await ai.fileSearchStores.uploadToFileSearchStore({
    file: blob,
    fileSearchStoreName: storeId,
    config: {
      displayName: fileName,
      mimeType,
    },
  });

  // Wait for upload completion (up to 5 minutes = 60 retries x 5 seconds)
  const maxRetries = 60;
  let retries = 0;

  while (!operation.done) {
    if (retries >= maxRetries) {
      throw new Error(`Upload timeout for file: ${fileName}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));
    operation = await ai.operations.get({ operation });
    retries++;
  }

  const documentName = operation.response?.documentName;
  if (!documentName) {
    throw new Error('Failed to upload file to File Search Store');
  }

  return { name: documentName };
};

/**
 * Delete a document from File Search Store
 */
export const deleteFileFromStore = async (ai: GoogleGenAI, documentName: string): Promise<void> => {
  await ai.fileSearchStores.documents.delete({ name: documentName, config: { force: true } });
};

/**
 * Delete a File Search Store
 */
export const deleteFileSearchStore = async (ai: GoogleGenAI, storeId: string): Promise<void> => {
  await ai.fileSearchStores.delete({
    name: storeId,
    config: { force: true },
  });
};

/**
 * Maximum file size per file for Gemini File Search Store (100MB)
 * @see https://ai.google.dev/gemini-api/docs/file-search
 */
const MAX_FILE_SIZE = 100 * 1024 * 1024;

/**
 * application/* MIME types supported by Gemini File Search Store
 * text/* is fully allowed, image/video/audio/font/* are rejected
 * @see https://ai.google.dev/gemini-api/docs/file-search#supported-formats
 */
const SUPPORTED_APPLICATION_MIME_TYPES = new Set([
  'application/dart',
  'application/ecmascript',
  'application/json',
  'application/ms-java',
  'application/msword',
  'application/pdf',
  'application/sql',
  'application/typescript',
  'application/vnd.curl',
  'application/vnd.dart',
  'application/vnd.ibm.secure-container',
  'application/vnd.jupyter',
  'application/vnd.ms-excel',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
  'application/x-csh',
  'application/x-hwp',
  'application/x-hwp-v5',
  'application/x-latex',
  'application/x-php',
  'application/x-powershell',
  'application/x-sh',
  'application/x-shellscript',
  'application/x-tex',
  'application/x-zsh',
  'application/xml',
  'application/zip',
]);

/**
 * Check if file size is within limit
 */
export const isFileSizeWithinLimit = (fileSize: number | null): boolean => {
  if (fileSize === null) return true; // Allow if size is unknown (will error during upload)
  return fileSize <= MAX_FILE_SIZE;
};

/**
 * Resolve the actual MIME type for upload
 * Returns export format MIME (PDF) for Google Workspace files
 * Returns null for unsupported Google Workspace formats
 */
export const resolveUploadMimeType = (mimeType: string): string | null => {
  if (isGoogleWorkspaceFile(mimeType)) {
    return getExportMimeType(mimeType);
  }
  return mimeType;
};

/**
 * Check if MIME type is supported by Gemini File Search Store
 * - text/*: fully allowed
 * - application/*: allowed via whitelist
 * - image/video/audio/font/*: rejected
 * - empty string/others: rejected
 */
export const isMimeTypeSupported = (mimeType: string | null): boolean => {
  if (!mimeType) return false;
  if (mimeType.startsWith('text/')) return true;
  if (mimeType.startsWith('application/')) return SUPPORTED_APPLICATION_MIME_TYPES.has(mimeType);

  return false;
};
