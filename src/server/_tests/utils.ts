import { getAuth } from '@local/admin-shared';
import type { Timestamp } from '@local/admin-shared';

export const clearFirestore = async () => {
  return fetch(
    `http://${process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST}:${process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_PORT}/emulator/v1/projects/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/databases/(default)/documents`,
    {
      method: 'DELETE',
    },
  );
};

export const clearAuth = async () => {
  return fetch(
    `http://${process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST}:${process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT}/emulator/v1/projects/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/accounts`,
    {
      method: 'DELETE',
    },
  );
};

export const clear = async () => {
  return await Promise.all([clearFirestore(), clearAuth()]);
};

export const timestamp = (date: Date) => date as unknown as Timestamp;

export const generateIdToken = async (uid: string): Promise<string> => {
  const auth = getAuth();
  const customToken = await auth.createCustomToken(uid);
  // Get ID token using custom token with Firebase Auth Emulator
  const response = await fetch(
    `http://${process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST}:${process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT}/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=fake-api-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: customToken,
        returnSecureToken: true,
      }),
    },
  );

  const { idToken } = await response.json();
  return idToken;
};
