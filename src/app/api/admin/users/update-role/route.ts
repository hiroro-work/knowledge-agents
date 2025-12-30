import { getAuth, getUser, updateUser, userRef } from '@local/admin-shared';
import { apiHandler } from '~/server/api/handler';
import { initializeApp } from '~/server/firebase/app';
import type { UserRole } from '@local/shared';
import type { ApiHandlerFunction } from '~/server/api/handler';

initializeApp();

type UpdateUserRoleRequest = {
  userId: string;
  role: UserRole;
};

type UpdateUserRoleResponse = {
  success: boolean;
};

/**
 * Update user's system role
 * - Updates Firebase Auth Custom Claims
 * - Updates Firestore user document
 * (Admin only)
 */
const updateUserRoleHandler: ApiHandlerFunction<UpdateUserRoleRequest, UpdateUserRoleResponse> = async ({
  data,
  auth,
  logger,
}) => {
  const { userId, role } = data;
  if (!auth) {
    throw new Response('Unauthorized', { status: 401 });
  }
  if (auth.role !== 'admin') {
    throw new Response('Forbidden', { status: 403 });
  }
  if (!userId) {
    throw new Response('User ID is required', { status: 400 });
  }
  if (!role) {
    throw new Response('Role is required', { status: 400 });
  }

  const user = await getUser(userRef(userId));
  if (!user) {
    throw new Response('User not found', { status: 404 });
  }

  await getAuth().setCustomUserClaims(userId, { role });
  await updateUser(userRef(userId), { role });

  await logger.info('User role updated', { userId, role, previousRole: user.role });

  return {
    success: true,
  };
};

export const POST = apiHandler(updateUserRoleHandler);
