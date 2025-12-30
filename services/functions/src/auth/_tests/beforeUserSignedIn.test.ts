import { createUser, userRef } from '@local/admin-shared';
import { vi, describe, afterAll, afterEach, it, expect } from 'vitest';
import { firebaseFunctionsTest, clear } from '../../../tests/utils.js';

const test = firebaseFunctionsTest();

describe('beforeUserSignedIn', async () => {
  const { beforeUserSignedIn } = await import('../beforeUserSignedIn.js');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wrapped = test.wrap(beforeUserSignedIn as any);

  afterEach(async () => {
    vi.clearAllMocks();
    await clear();
  });

  afterAll(() => {
    test.cleanup();
  });

  it('allows sign in for users registered in Firestore', async () => {
    // Create user in Firestore first (simulating admin registration)
    await createUser(userRef('test-uid'), { email: 'test@example.com', role: 'user' });

    await expect(
      wrapped({
        data: { uid: 'test-uid', email: 'test@example.com' },
      }),
    ).resolves.toEqual({});
  });

  it('blocks sign in for users not registered in Firestore', async () => {
    await expect(
      wrapped({
        data: { uid: 'unregistered-uid', email: 'test@example.com' },
      }),
    ).rejects.toThrow('Unregistered user.');
  });

  it('blocks sign in when uid is missing', async () => {
    await expect(
      wrapped({
        data: { email: 'test@example.com' },
      }),
    ).rejects.toThrow('Invalid user data.');
  });

  it('blocks sign in when email is missing', async () => {
    await expect(
      wrapped({
        data: { uid: 'test-uid' },
      }),
    ).rejects.toThrow('Invalid user data.');
  });
});
