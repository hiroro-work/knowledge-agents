import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { initializeTestEnvironment as _initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc } from 'firebase/firestore';
import { getConverter } from '~/utils/firebase/firestore';
import type { RulesTestContext, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import type { WithId } from '@local/shared';
import type { CollectionReference, DocumentData, Firestore, Timestamp } from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let testEnv: RulesTestEnvironment;

export const initializeTestEnvironment = async (projectId: string) => {
  process.env.FIRESTORE_EMULATOR_HOST =
    process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST! + ':' + process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_PORT!;
  testEnv = await _initializeTestEnvironment({
    projectId,
    firestore: {
      rules: readFileSync(join(__dirname, '../../firestore.rules'), 'utf8'),
    },
  });
  return testEnv;
};

export const getTestEnv = () => testEnv;

export const setCollection = <T extends DocumentData>(ref: CollectionReference, instances: WithId<T>[]) =>
  Promise.all(instances.map((data) => setDoc(doc(ref.withConverter(getConverter<T>()), data.id), data)));

// NOTE: Using Timestamp or serverTimestamp causes errors, so we use Date instead
// https://github.com/firebase/firebase-js-sdk/issues/6077
export const timestamp = (date: Date) => date as unknown as Timestamp;

export const firestore = (context: RulesTestContext) => context.firestore() as unknown as Firestore;

export const clearAll = async () => testEnv.clearFirestore();
