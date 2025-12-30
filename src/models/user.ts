import { userDefaultData } from '@local/shared';
import { useCollectionData } from '~/hooks/firebase/useCollectionData';
import { useDocumentData } from '~/hooks/firebase/useDocumentData';
import { useDocumentsData } from '~/hooks/firebase/useDocumentsData';
import { usePaginatedCollectionData } from '~/hooks/firebase/usePaginatedCollectionData';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getConverter,
  getFirestore,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from '~/utils/firebase/firestore';
import type { User, UserDocumentData } from '@local/shared';
import type { CollectionReference, DocumentReference, QueryConstraint, UpdateData } from '~/utils/firebase/firestore';

export const userConverter = getConverter<UserDocumentData>();

export const usersRef = () => collection(getFirestore(), 'users').withConverter(userConverter);

type RefOrNull<Id extends string | null | undefined> = Id extends string ? DocumentReference<User> : null;
export const userRef = <Id extends string | null | undefined>(id: Id) =>
  (id ? doc(usersRef(), id) : null) as RefOrNull<Id>;

export const usersQuery = ({ queryConstraints = [] }: { queryConstraints?: QueryConstraint[] } = {}) =>
  query(usersRef(), ...(queryConstraints.length === 0 ? [orderBy('createdAt', 'asc')] : queryConstraints));

export const usersQueryByEmail = (email: string) => query(usersRef(), where('email', '==', email));

export const addUser = async (ref: CollectionReference<User>, data: Partial<UserDocumentData>) =>
  addDoc(ref, {
    ...userDefaultData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...data,
  } as User);

export const updateUser = async (ref: DocumentReference<User>, data: UpdateData<UserDocumentData>) =>
  updateDoc(ref, { updatedAt: serverTimestamp(), ...data });

export const deleteUser = async (ref: DocumentReference<User>) => deleteDoc(ref);

export const useUserCollection = useCollectionData<User>;
export const useUserDocument = useDocumentData<User>;
export const useUserDocuments = useDocumentsData<User>;
export const usePaginatedUserCollection = usePaginatedCollectionData<User>;
