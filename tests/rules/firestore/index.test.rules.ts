import { describe, beforeAll, afterAll, afterEach } from 'vitest';
import { initializeTestEnvironment, getTestEnv } from '../utils';
import { agentsTest } from './collections/agents';
import { usersTest } from './collections/users';

describe('firestore.rules', () => {
  beforeAll(async () => {
    await initializeTestEnvironment('demo-firestore-rules');
  });

  afterAll(async () => {
    await getTestEnv().cleanup();
  });

  afterEach(async () => {
    await getTestEnv().clearFirestore();
  });

  usersTest();
  agentsTest();
});
