import { afterEach, describe, expect, it, vi } from 'vitest';
import { clear } from '../../../tests/utils.js';

describe('utils', () => {
  describe('isTest', async () => {
    const { isTest } = await import('../utils.js');

    afterEach(async () => {
      vi.clearAllMocks();
      await clear();
    });

    it('returns true in test environment', () => expect(isTest()).toBeTruthy());
  });
});
