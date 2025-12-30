import { getAuth, userRef, createUser as createFirestoreUser, setCustomUserClaims } from '@local/admin-shared';
import { defaultUserRole } from '@local/shared';
import type { UserDocumentData } from '@local/shared';

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

export { createUser };
