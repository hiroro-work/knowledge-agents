import { vi, describe, afterAll, afterEach, it, expect } from 'vitest';
import { firebaseFunctionsTest, clear } from '../../../tests/utils.js';

const test = firebaseFunctionsTest();

describe('beforeUserCreated', async () => {
  const { beforeUserCreated } = await import('../beforeUserCreated.js');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wrapped = test.wrap(beforeUserCreated as any);

  afterEach(async () => {
    vi.clearAllMocks();
    await clear();
  });

  afterAll(() => {
    test.cleanup();
  });

  it('blocks user creation from client side', async () => {
    await expect(
      wrapped({
        data: { uid: 'test-uid', email: 'test@example.com' },
      }),
    ).rejects.toThrow('User registration is not allowed. Please contact an administrator.');
  });

  it('blocks signup via Google auth', async () => {
    await expect(
      wrapped({
        data: { uid: 'test-uid', email: 'test@example.com' },
        eventType: 'providers/cloud.auth/eventTypes/user.beforeCreate:google.com',
      }),
    ).rejects.toThrow('User registration is not allowed. Please contact an administrator.');
  });
});
