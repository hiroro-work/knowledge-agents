import { FieldValue, getFirestore as _getFirestore, Timestamp } from 'firebase-admin/firestore';
import type { VectorQuery } from '@google-cloud/firestore';
import type { WithId } from '@local/shared';
import type {
  DocumentData,
  FirestoreDataConverter,
  Firestore,
  WithFieldValue,
  CollectionReference,
  DocumentReference,
  Query,
  UpdateData,
} from 'firebase-admin/firestore';

let firestore: Firestore;
const getFirestore = () => {
  if (firestore) return firestore;

  firestore = _getFirestore();
  firestore.settings({
    preferRest:
      ['test', 'development'].includes(process.env.ENVIRONMENT!) ||
      ['test', 'development'].includes(process.env.NEXT_PUBLIC_ENVIRONMENT!) ||
      process.env.FUNCTIONS_EMULATOR === 'true'
        ? false
        : true,
    timestampsInSnapshots: true,
  });
  return firestore;
};

const { serverTimestamp: _severTimestamp, arrayRemove, arrayUnion } = FieldValue;

const serverTimestamp = () => _severTimestamp() as Timestamp;

const getConverter = <T extends DocumentData>(): FirestoreDataConverter<WithId<T>, T> => ({
  toFirestore: (data) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...rest } = data;
    return rest as WithFieldValue<T>;
  },
  fromFirestore: (snapshot) => {
    return { id: snapshot.id, ...snapshot.data() } as WithId<T>;
  },
});

const getDocumentData = async <T>(ref: DocumentReference<T>) =>
  ref.get().then((doc) => ({ data: { id: doc.id, ...doc.data() } as WithId<T>, exists: doc.exists }));

type WithRef<T, Boolean extends boolean | undefined> = Boolean extends true
  ? WithId<T> & { ref: DocumentReference<T> }
  : WithId<T>;
const getCollectionData = async <T, Boolean extends boolean | undefined>(
  query: CollectionReference<T> | Query<T> | VectorQuery<T>,
  { withRef = false }: { withRef?: Boolean } = {},
) =>
  query
    .get()
    .then(({ docs }) =>
      docs.map(
        (doc) =>
          (withRef ? { id: doc.id, ref: doc.ref, ...doc.data() } : { id: doc.id, ...doc.data() }) as WithRef<
            T,
            Boolean
          >,
      ),
    );

/**
 * Extended UpdateData type that allows dot notation for nested paths
 */
type UpdateDataWithNestedPaths<T> = UpdateData<T> | Record<`${string}.${string}`, unknown>;

export type * from 'firebase-admin/firestore';
export {
  serverTimestamp,
  getConverter,
  getFirestore,
  getDocumentData,
  getCollectionData,
  arrayRemove,
  arrayUnion,
  Timestamp,
  FieldValue,
};
export type { UpdateDataWithNestedPaths };
