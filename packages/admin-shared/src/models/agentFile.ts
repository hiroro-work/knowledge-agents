import { agentFileDefaultData } from '@local/shared';
import { getConverter, serverTimestamp } from '../firebase/firestore.js';
import type { PartialWithFieldValue, SetOptions, UpdateData } from '../firebase/firestore.js';
import type { AgentFile, AgentFileDocumentData } from '@local/shared';
import type { DocumentReference } from 'firebase-admin/firestore';

export const agentFileConverter = getConverter<AgentFileDocumentData>();

export const agentFilesRef = ({ parent }: { parent: DocumentReference }) =>
  parent.collection('files').withConverter(agentFileConverter);

export const agentFileRef = (id: string, { parent }: { parent: DocumentReference }) =>
  agentFilesRef({ parent }).doc(id);

export const createAgentFile = async (
  ref: DocumentReference<AgentFileDocumentData>,
  data: Partial<AgentFileDocumentData>,
) => {
  await ref.create({
    ...agentFileDefaultData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...data,
  } as AgentFile);
};

export const updateAgentFile = async (
  ref: DocumentReference<AgentFileDocumentData>,
  data: UpdateData<AgentFileDocumentData>,
) => ref.update({ updatedAt: serverTimestamp(), ...data });

export const setAgentFile = async (
  ref: DocumentReference<AgentFileDocumentData>,
  data: PartialWithFieldValue<AgentFileDocumentData>,
  options: { merge: boolean } & Omit<SetOptions, 'merge'>,
) => {
  await ref.set(
    {
      ...data,
      updatedAt: serverTimestamp(),
    },
    options,
  );
};

export const deleteAgentFile = async (ref: DocumentReference<AgentFileDocumentData>) => ref.delete();
