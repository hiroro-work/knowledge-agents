import {
  getAuth,
  getDocumentData,
  userRef,
  createUser as createFirestoreUser,
  setCustomUserClaims,
} from '@local/admin-shared';
import { defaultUserRole } from '@local/shared';
import type { UserDocumentData } from '@local/shared';

const createAdminUser = async ({ email, password }: { email: string; password?: string }) => {
  const auth = getAuth();
  const user = await auth.createUser({ email, emailVerified: true, ...(password ? { password } : {}) });
  await setCustomUserClaims(user.uid, { role: 'admin' });
  await createFirestoreUser(userRef(user.uid), { email, role: 'admin' });
  return { uid: user.uid };
};

const createUser = async ({
  uid,
  email,
  role = defaultUserRole,
  password,
}: Partial<UserDocumentData> & { uid?: string; password: string }) => {
  const auth = getAuth();
  const user = await auth.createUser({ email, password, emailVerified: true, ...(uid && { uid }) });
  await setCustomUserClaims(user.uid, { role });
  await createFirestoreUser(userRef(user.uid), { email, role });
  return { uid: user.uid };
};

const getAuthUserByUid = async ({ uid }: { uid: string }) => {
  const auth = getAuth();
  return await auth.getUser(uid);
};

const getAuthUserByEmail = async ({ email }: { email: string }) => {
  const auth = getAuth();
  return await auth.getUserByEmail(email);
};

const getAuthUser = async ({ uid, email }: { uid?: string; email?: string }) => {
  if (uid) return await getAuthUserByUid({ uid });
  if (email) return await getAuthUserByEmail({ email });
  throw new Error('uid or email is required');
};

const getUser = async ({ uid }: { uid: string }) => {
  const { data } = await getDocumentData(userRef(uid));
  return data;
};

export { createAdminUser, createUser, getAuthUserByUid, getAuthUserByEmail, getAuthUser, getUser };
