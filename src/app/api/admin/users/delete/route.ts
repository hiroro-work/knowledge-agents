import { deleteUser, getAuth, getUser, userRef } from '@local/admin-shared';
import { apiHandler } from '~/server/api/handler';
import { initializeApp } from '~/server/firebase/app';
import type { ApiHandlerFunction } from '~/server/api/handler';

initializeApp();

type DeleteUserRequest = {
  userId: string;
};

type DeleteUserResponse = {
  success: boolean;
};

/**
 * Delete a user
 * - Deletes Firebase Auth user
 * - Deletes Firestore user document
 * (Admin only)
 */
const deleteUserHandler: ApiHandlerFunction<DeleteUserRequest, DeleteUserResponse> = async ({ data, auth, logger }) => {
  const { userId } = data;
  if (!auth) {
    throw new Response('Unauthorized', { status: 401 });
  }
  if (auth.role !== 'admin') {
    throw new Response('Forbidden', { status: 403 });
  }
  if (!userId) {
    throw new Response('User ID is required', { status: 400 });
  }

  const user = await getUser(userRef(userId));
  if (!user) {
    throw new Response('User not found', { status: 404 });
  }

  // Delete Firestore first, then Auth - if Firestore fails, Auth user remains for retry
  const ref = userRef(userId);
  await deleteUser(ref);
  await getAuth().deleteUser(userId);

  await logger.info('User deleted', { userId, email: user.email });

  return {
    success: true,
  };
};

export const POST = apiHandler(deleteUserHandler);
