import { agentDefaultData } from '@local/shared';
import {
  getConverter,
  getFirestore,
  serverTimestamp,
  getDocumentData,
  getCollectionData,
} from '../firebase/firestore.js';
import type { PartialWithFieldValue, SetOptions, UpdateDataWithNestedPaths } from '../firebase/firestore.js';
import type { Agent, AgentDocumentData } from '@local/shared';
import type { DocumentReference, Firestore } from 'firebase-admin/firestore';

export const agentConverter = getConverter<AgentDocumentData>();

export const agentsRef = ({ parent = getFirestore() }: { parent?: Firestore | DocumentReference } = {}) =>
  (parent as Firestore).collection('agents').withConverter(agentConverter);

export const agentRef = (id: string, { parent = getFirestore() }: { parent?: Firestore | DocumentReference } = {}) =>
  agentsRef({ parent }).doc(id);

export const createAgent = async (ref: DocumentReference<AgentDocumentData>, data: Partial<AgentDocumentData>) => {
  await ref.create({
    ...agentDefaultData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...data,
  } as Agent);
};

export const updateAgent = async (
  ref: DocumentReference<AgentDocumentData>,
  data: UpdateDataWithNestedPaths<AgentDocumentData>,
) => ref.update({ updatedAt: serverTimestamp(), ...data });

export const setAgent = async (
  ref: DocumentReference<AgentDocumentData>,
  data: PartialWithFieldValue<AgentDocumentData>,
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

export const deleteAgent = async (ref: DocumentReference<AgentDocumentData>) => ref.delete();

export const getAgent = async (id: string) => {
  const { data, exists } = await getDocumentData(agentRef(id));
  return exists ? data : null;
};

export const getAgents = async () => getCollectionData(agentsRef());
