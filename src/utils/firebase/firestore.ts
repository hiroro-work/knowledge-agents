/* eslint-disable @typescript-eslint/no-restricted-imports */
import {
  addDoc as _addDoc,
  collection,
  deleteDoc as _deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  queryEqual,
  refEqual,
  serverTimestamp as _serverTimestamp,
  setDoc as _setDoc,
  updateDoc as _updateDoc,
  where,
  waitForPendingWrites,
  Timestamp,
} from 'firebase/firestore';
import type { WithId } from '@local/shared';
import type {
  CollectionReference,
  DocumentData,
  DocumentReference,
  FieldPath,
  FirestoreDataConverter,
  Query,
  SetOptions,
  UpdateData,
  WithFieldValue,
} from 'firebase/firestore';

const getCollectionData = async <T>(query: Query<T>) => {
  const snapshot = await getDocs(query);
  return snapshot.docs.map((doc) => doc.data());
};

const getDocumentData = async <T>(ref: DocumentReference<T>) => {
  const snapshot = await getDoc(ref);
  return snapshot.data();
};

const getConverter = <T extends DocumentData>(): FirestoreDataConverter<WithId<T>, T> => ({
  toFirestore: (data) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...rest } = data;
    return rest as WithFieldValue<T>;
  },
  fromFirestore: (snapshot, options): WithId<T> => {
    return { id: snapshot.id, ...snapshot.data(options) } as WithId<T>;
  },
});

const serverTimestamp = _serverTimestamp as unknown as () => Timestamp;

const addDoc = async <T>(ref: CollectionReference<T>, data: T) => {
  const res = await _addDoc(ref, data);
  await waitForPendingWrites(getFirestore());
  return res;
};

const setDoc = async <T>(ref: DocumentReference<T>, data: WithFieldValue<T>, options?: SetOptions) => {
  const res = await (options ? _setDoc(ref, data, options!) : _setDoc(ref, data));
  await waitForPendingWrites(getFirestore());
  return res;
};

type UpdateDocParamsDataObject<AppType, DbType extends DocumentData> = [
  reference: DocumentReference<AppType, DbType>,
  data: UpdateData<DbType>,
];
type UpdateDocParamsFieldAndValue<AppType, DbType extends DocumentData> = [
  reference: DocumentReference<AppType, DbType>,
  field: string | FieldPath,
  value: unknown,
  ...moreFieldsAndValues: unknown[],
];
type UpdateDocParams<AppType, DbType extends DocumentData> =
  | UpdateDocParamsDataObject<AppType, DbType>
  | UpdateDocParamsFieldAndValue<AppType, DbType>;

const updateDoc = async <AppType, DbType extends DocumentData>(...args: UpdateDocParams<AppType, DbType>) => {
  const res = await (args.length === 2
    ? _updateDoc(...(args as UpdateDocParamsDataObject<AppType, DbType>))
    : _updateDoc(...(args as UpdateDocParamsFieldAndValue<AppType, DbType>)));
  await waitForPendingWrites(getFirestore());
  return res;
};

const deleteDoc = async <T>(ref: DocumentReference<T>) => {
  const res = await _deleteDoc(ref);
  await waitForPendingWrites(getFirestore());
  return res;
};

export type * from 'firebase/firestore';
export {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCollectionData,
  getConverter,
  getDoc,
  getDocs,
  getDocumentData,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  queryEqual,
  refEqual,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  Timestamp,
};
