import { syncSessionDefaultData } from '@local/shared';
import { getConverter, serverTimestamp, FieldValue } from '../firebase/firestore.js';
import type { SyncSession, SyncSessionDocumentData, SyncSessionFileResult } from '@local/shared';
import type { DocumentReference, UpdateData } from 'firebase-admin/firestore';

export const syncSessionConverter = getConverter<SyncSessionDocumentData>();

export const syncSessionsRef = ({ parent }: { parent: DocumentReference }) =>
  parent.collection('syncSessions').withConverter(syncSessionConverter);

export const syncSessionRef = (id: string, { parent }: { parent: DocumentReference }) =>
  syncSessionsRef({ parent }).doc(id);

export const createSyncSession = async (
  ref: DocumentReference<SyncSessionDocumentData>,
  data: Partial<SyncSessionDocumentData>,
) => {
  await ref.create({
    ...syncSessionDefaultData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...data,
  } as SyncSession);
};

export const updateSyncSession = async (
  ref: DocumentReference<SyncSessionDocumentData>,
  data: UpdateData<SyncSessionDocumentData>,
) => ref.update({ updatedAt: serverTimestamp(), ...data });

export const recordSyncResult = async (
  ref: DocumentReference<SyncSessionDocumentData>,
  result: 'success' | 'failed' | 'skipped',
  fileDetail?: SyncSessionFileResult,
) => {
  await ref.update({
    updatedAt: serverTimestamp(),
    processedFiles: FieldValue.increment(1),
    ...(result === 'success' && { successFiles: FieldValue.increment(1) }),
    ...(result === 'failed' && { failedFiles: FieldValue.increment(1) }),
    ...(result === 'skipped' && { skippedFiles: FieldValue.increment(1) }),
    ...(fileDetail && (result === 'failed' || result === 'skipped')
      ? { failedFileDetails: FieldValue.arrayUnion(fileDetail) }
      : {}),
  });
};

export const deleteSyncSession = async (ref: DocumentReference<SyncSessionDocumentData>) => ref.delete();
