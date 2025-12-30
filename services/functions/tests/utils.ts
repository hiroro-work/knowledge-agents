import _firebaseFunctionsTest from 'firebase-functions-test';
import { initializeApp } from '../src/utils/firebase/app.js';
import type { Timestamp } from 'firebase-admin/firestore';

export const firebaseFunctionsTest = (projectId = 'demo-functions') => {
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
  process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
  initializeApp();

  return _firebaseFunctionsTest({ projectId });
};

export const clearFirestore = async () => {
  return fetch('http://127.0.0.1:8080/emulator/v1/projects/demo-functions/databases/(default)/documents', {
    method: 'DELETE',
  });
};

export const clearAuth = async () => {
  return fetch('http://127.0.0.1:9099/emulator/v1/projects/demo-functions/accounts', {
    method: 'DELETE',
  });
};

export const clear = async () => {
  return await Promise.all([clearFirestore(), clearAuth()]);
};

export const timestamp = (date: Date) => date as unknown as Timestamp;
