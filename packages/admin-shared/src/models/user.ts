import { userDefaultClaims, userDefaultData } from '@local/shared';
import { getAuth } from '../firebase/auth.js';
import { getConverter, getDocumentData, getFirestore, serverTimestamp } from '../firebase/firestore.js';
import type { PartialWithFieldValue, SetOptions } from '../firebase/firestore.js';
import type { Claims, User, UserDocumentData, UserRole } from '@local/shared';
import type { DocumentReference, UpdateData } from 'firebase-admin/firestore';

export const userConverter = getConverter<UserDocumentData>();

export const usersRef = () => getFirestore().collection('users').withConverter(userConverter);

export const userRef = (id: string) => usersRef().doc(id);

export const createUser = async (ref: DocumentReference<UserDocumentData>, data: Partial<UserDocumentData>) => {
  await ref.create({
    ...userDefaultData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...data,
  } as User);
};

export const updateUser = async (ref: DocumentReference<UserDocumentData>, data: UpdateData<UserDocumentData>) =>
  ref.update({ updatedAt: serverTimestamp(), ...data });

export const setUser = async (
  ref: DocumentReference<UserDocumentData>,
  data: PartialWithFieldValue<UserDocumentData>,
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

export const deleteUser = async (ref: DocumentReference<UserDocumentData>) => ref.delete();

export const getUser = async (ref: DocumentReference<UserDocumentData>) => {
  const { data, exists } = await getDocumentData(ref);
  return exists ? data : null;
};

export const setCustomUserClaims = async (uid: string, claims: Partial<Claims>) => {
  const auth = getAuth();
  await auth.setCustomUserClaims(uid, { ...userDefaultClaims, ...claims });
};

export const newUserRef = () => usersRef().doc();

export const getUserByEmail = async (email: string) => {
  const auth = getAuth();
  const user = await auth.getUserByEmail(email).catch(() => null);
  return user;
};

export const getUserRole = async (id: string): Promise<UserRole | null> => {
  const user = await getUser(userRef(id));
  return user?.role ?? null;
};

export const createAuthUser = async (email: string, role: UserRole) => {
  const auth = getAuth();
  const user = await auth.createUser({ email, emailVerified: true });
  await auth.setCustomUserClaims(user.uid, { role });
  return user;
};
