import { HttpsError, beforeUserCreated as _beforeUserCreated, logger } from '../utils/firebase/functions.js';

export const beforeUserCreated = _beforeUserCreated(async (event) => {
  const user = event.data;
  logger.warn('User creation blocked - users must be registered by admin', { user });
  throw new HttpsError('permission-denied', 'User registration is not allowed. Please contact an administrator.');
});
