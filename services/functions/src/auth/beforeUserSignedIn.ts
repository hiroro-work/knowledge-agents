import { getUser, userRef } from '@local/admin-shared';
import { HttpsError, beforeUserSignedIn as _beforeUserSignedIn, logger } from '../utils/firebase/functions.js';

export const beforeUserSignedIn = _beforeUserSignedIn(async (event) => {
  const user = event.data;
  if (!user?.uid || !user?.email) {
    throw new HttpsError('permission-denied', 'Invalid user data.');
  }
  const existingUser = await getUser(userRef(user.uid));
  if (!existingUser) {
    logger.warn('Unregistered user tried to sign in', { user });
    throw new HttpsError('permission-denied', 'Unregistered user.');
  }

  return {};
});
