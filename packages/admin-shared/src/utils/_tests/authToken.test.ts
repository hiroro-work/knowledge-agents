import { randomBytes } from 'crypto';
import { describe, expect, it } from 'vitest';
import {
  createAuthTokenWithEncryption,
  decryptAuthToken,
  encryptAuthToken,
  generateAuthToken,
  verifyAuthToken,
} from '../authToken.js';

describe('authToken', () => {
  const validKey = randomBytes(32);

  describe('generateAuthToken', () => {
    it('generates a 64-character hex string', () => {
      const token = generateAuthToken();
      expect(token).toHaveLength(64);
      expect(/^[0-9a-f]+$/.test(token)).toBe(true);
    });

    it('generates a different token each time', () => {
      const token1 = generateAuthToken();
      const token2 = generateAuthToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('encryptAuthToken / decryptAuthToken', () => {
    it('can encrypt and decrypt a token', () => {
      const token = 'test-token';
      const encrypted = encryptAuthToken(token, validKey);
      const decrypted = decryptAuthToken(encrypted, validKey);
      expect(decrypted).toBe(token);
    });

    it('produces different encrypted results each time for the same token (random IV)', () => {
      const token = 'test-token';
      const encrypted1 = encryptAuthToken(token, validKey);
      const encrypted2 = encryptAuthToken(token, validKey);
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('cannot decrypt with the wrong key', () => {
      const token = 'test-token';
      const encrypted = encryptAuthToken(token, validKey);
      const wrongKey = randomBytes(32);
      expect(() => decryptAuthToken(encrypted, wrongKey)).toThrow();
    });

    it('produces Base64 format encrypted result', () => {
      const token = 'test-token';
      const encrypted = encryptAuthToken(token, validKey);
      expect(() => Buffer.from(encrypted, 'base64')).not.toThrow();
    });

    it('encrypted data contains IV + ciphertext + authTag', () => {
      const token = 'test-token';
      const encrypted = encryptAuthToken(token, validKey);
      const combined = Buffer.from(encrypted, 'base64');
      // IV(12) + at least 1 byte of encrypted data + authTag(16) = minimum 29 bytes
      expect(combined.length).toBeGreaterThanOrEqual(29);
    });
  });

  describe('createAuthTokenWithEncryption', () => {
    it('generates token and encrypted data', () => {
      const result = createAuthTokenWithEncryption(validKey);
      expect(result.token).toHaveLength(64);
      expect(result.encrypted).toBeTruthy();
    });

    it('can correctly decrypt the generated token', () => {
      const result = createAuthTokenWithEncryption(validKey);
      const decrypted = decryptAuthToken(result.encrypted, validKey);
      expect(decrypted).toBe(result.token);
    });
  });

  describe('verifyAuthToken', () => {
    it('verification succeeds with correct token', () => {
      const { token, encrypted } = createAuthTokenWithEncryption(validKey);
      const result = verifyAuthToken(token, encrypted, validKey);
      expect(result).toBe(true);
    });

    it('verification fails with wrong token', () => {
      const { encrypted } = createAuthTokenWithEncryption(validKey);
      const result = verifyAuthToken('wrong-token', encrypted, validKey);
      expect(result).toBe(false);
    });

    it('verification fails when encrypted data is null', () => {
      const token = generateAuthToken();
      const result = verifyAuthToken(token, null, validKey);
      expect(result).toBe(false);
    });

    it('verification fails when encryption key is null', () => {
      const { token, encrypted } = createAuthTokenWithEncryption(validKey);
      const result = verifyAuthToken(token, encrypted, null);
      expect(result).toBe(false);
    });

    it('verification fails with invalid encrypted data', () => {
      const token = generateAuthToken();
      const result = verifyAuthToken(token, 'invalid-encrypted-data', validKey);
      expect(result).toBe(false);
    });

    it('verification fails with token of different length', () => {
      const { encrypted } = createAuthTokenWithEncryption(validKey);
      const result = verifyAuthToken('short', encrypted, validKey);
      expect(result).toBe(false);
    });

    it('verification fails with empty token', () => {
      const { encrypted } = createAuthTokenWithEncryption(validKey);
      const result = verifyAuthToken('', encrypted, validKey);
      expect(result).toBe(false);
    });

    it('verification fails with empty encrypted data', () => {
      const token = generateAuthToken();
      const result = verifyAuthToken(token, '', validKey);
      expect(result).toBe(false);
    });
  });
});
