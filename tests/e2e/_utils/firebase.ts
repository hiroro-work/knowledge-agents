import { exec } from 'child_process';
import { getApps, initializeApp } from '@local/admin-shared';

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const host = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST;
const firestorePort = process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_PORT;
const authPort = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT;
process.env.FIRESTORE_EMULATOR_HOST = `${host}:${firestorePort}`;
process.env.FIREBASE_AUTH_EMULATOR_HOST = `${host}:${authPort}`;

if (getApps().length === 0) {
  initializeApp({ projectId });
}

const clearFirestore = async () => {
  await new Promise((resolve, reject) =>
    exec(
      `curl -v -X DELETE "http://${host}:${firestorePort}/emulator/v1/projects/${projectId}/databases/(default)/documents"`,
      (error, stdout) => (error ? reject(error) : resolve(stdout)),
    ),
  );
};

const clearAuth = async () => {
  await new Promise((resolve, reject) =>
    exec(
      `curl -H "Authorization: Bearer owner" -X DELETE "http://${host}:${authPort}/emulator/v1/projects/${projectId}/accounts"`,
      (error, stdout) => (error ? reject(error) : resolve(stdout)),
    ),
  );
};

const clearFirebase = async () => {
  await Promise.all([clearFirestore(), clearAuth()]);
};

export { clearAuth, clearFirebase, clearFirestore };
