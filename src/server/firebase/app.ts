import { getApps, initializeApp as _initializeApp } from '@local/admin-shared';
import { isDevelopment, isTest } from '~/utils/utils';

const initializeApp = () => {
  if (getApps().length) return;

  if (isDevelopment() || isTest()) {
    process.env.GOOGLE_CLOUD_PROJECT = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    process.env.GOOGLE_CLOUD_QUOTA_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  }
  if (isTest()) {
    process.env.FIRESTORE_EMULATOR_HOST =
      process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST! + ':' + process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_PORT!;
    process.env.FIREBASE_AUTH_EMULATOR_HOST =
      process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST! + ':' + process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT!;
  }
  return _initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
};

const getApp = () => {
  const [app] = getApps();
  if (app) return app;

  return initializeApp();
};

export { getApp, initializeApp };
