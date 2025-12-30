'use client';

import { useCollectionData } from '~/hooks/firebase/useCollectionData';
import { useDocumentData } from '~/hooks/firebase/useDocumentData';
import { useDocumentsData } from '~/hooks/firebase/useDocumentsData';
import { usePaginatedCollectionData } from '~/hooks/firebase/usePaginatedCollectionData';
import {
  collection,
  deleteDoc,
  doc,
  getConverter,
  getFirestore,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from '~/utils/firebase/firestore';
import type { Agent, AgentDocumentData } from '@local/shared';
import type { DocumentReference, Firestore, UpdateData } from '~/utils/firebase/firestore';

export const agentConverter = getConverter<AgentDocumentData>();

export const agentsRef = ({ parent = getFirestore() }: { parent?: Firestore | DocumentReference } = {}) =>
  collection(parent as Firestore, 'agents').withConverter(agentConverter);

type RefOrNull<Id extends string | null | undefined> = Id extends string ? DocumentReference<Agent> : null;
export const agentRef = <Id extends string | null | undefined>(
  id: Id,
  { parent = getFirestore() }: { parent?: Firestore | DocumentReference } = {},
) => (id ? doc(agentsRef({ parent }), id) : null) as RefOrNull<Id>;

export const agentsQuery = ({ parent = getFirestore() }: { parent?: Firestore | DocumentReference } = {}) =>
  query(agentsRef({ parent }), orderBy('createdAt', 'asc'));

export const updateAgent = async (ref: DocumentReference<Agent>, data: UpdateData<AgentDocumentData>) =>
  updateDoc(ref, { updatedAt: serverTimestamp(), ...data });

export const deleteAgent = async (ref: DocumentReference<Agent>) => deleteDoc(ref);

export const useAgentCollection = useCollectionData<Agent>;
export const useAgentDocument = useDocumentData<Agent>;
export const useAgentDocuments = useDocumentsData<Agent>;
export const usePaginatedAgentCollection = usePaginatedCollectionData<Agent>;
