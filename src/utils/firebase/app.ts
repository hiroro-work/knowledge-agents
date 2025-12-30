/* eslint-disable @typescript-eslint/no-restricted-imports */
import { initializeApp as _initializeApp, getApps, getApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { isTest } from '~/utils/utils';
import { firebaseConfig } from './config';

const initializeApp = () => {
  if (getApps().length !== 0) return;

  _initializeApp(firebaseConfig);
  if (isTest()) {
    console.info('USE EMULATORS...');
    const host = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST!;
    const authPort = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT!;
    const firestorePort = Number(process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_PORT!);
    const functionsPort = Number(process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_EMULATOR_PORT!);
    connectAuthEmulator(getAuth(), `http://${host}:${authPort}`, {
      disableWarnings: true,
    });
    connectFirestoreEmulator(getFirestore(), host, firestorePort);
    connectFunctionsEmulator(getFunctions(getApp(), 'asia-northeast1'), host, functionsPort);
  }
};

export type * from 'firebase/app';
export { getApp, initializeApp };
