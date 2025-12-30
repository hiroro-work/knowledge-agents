import { createAuthUser, createUser, getUserByEmail, userRef } from '@local/admin-shared';
import { apiHandler } from '~/server/api/handler';
import { initializeApp } from '~/server/firebase/app';
import type { UserRole } from '@local/shared';
import type { ApiHandlerFunction } from '~/server/api/handler';

initializeApp();

type CreateUserRequest = {
  email: string;
  role: UserRole;
};

type CreateUserResponse = {
  success: boolean;
  userId: string;
};

/**
 * Create a new user
 * - Creates Firebase Auth user
 * - Creates Firestore user document
 * (Admin only)
 */
const createUserHandler: ApiHandlerFunction<CreateUserRequest, CreateUserResponse> = async ({ data, auth, logger }) => {
  const { email, role } = data;
  if (!auth) {
    throw new Response('Unauthorized', { status: 401 });
  }
  if (auth.role !== 'admin') {
    throw new Response('Forbidden', { status: 403 });
  }
  if (!email) {
    throw new Response('Email is required', { status: 400 });
  }
  if (!role) {
    throw new Response('Role is required', { status: 400 });
  }

  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new Response('User already exists', { status: 409 });
  }

  const authUser = await createAuthUser(email, role);
  const ref = userRef(authUser.uid);
  await createUser(ref, {
    email,
    role,
  });

  await logger.info('User created', { userId: ref.id, email, role });

  return {
    success: true,
    userId: ref.id,
  };
};

export const POST = apiHandler(createUserHandler);
