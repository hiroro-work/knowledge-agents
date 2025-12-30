import { randomBytes, createCipheriv, createDecipheriv, timingSafeEqual } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

/**
 * Generate a random auth token
 */
export const generateAuthToken = (): string => {
  return randomBytes(32).toString('hex');
};

/**
 * Encrypt an auth token using AES-256-GCM
 * @param token - The plain text token to encrypt
 * @param encryptionKey - 32-byte encryption key
 * @returns Base64 encoded string containing IV + ciphertext + auth tag
 */
export const encryptAuthToken = (token: string, encryptionKey: Buffer): string => {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, encryptionKey, iv);

  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Combine IV + encrypted data + auth tag
  const combined = Buffer.concat([iv, encrypted, authTag]);
  return combined.toString('base64');
};

/**
 * Decrypt an auth token encrypted with AES-256-GCM
 * @param encryptedToken - Base64 encoded string containing IV + ciphertext + auth tag
 * @param encryptionKey - 32-byte encryption key
 * @returns The decrypted plain text token
 */
export const decryptAuthToken = (encryptedToken: string, encryptionKey: Buffer): string => {
  const combined = Buffer.from(encryptedToken, 'base64');

  // Extract IV, encrypted data, and auth tag
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH, combined.length - AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, encryptionKey, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
};

/**
 * Create an auth token and encrypt it in one step
 * @param encryptionKey - 32-byte encryption key
 * @returns Object containing both the plain token and encrypted token
 */
export const createAuthTokenWithEncryption = (encryptionKey: Buffer): { token: string; encrypted: string } => {
  const token = generateAuthToken();
  const encrypted = encryptAuthToken(token, encryptionKey);
  return { token, encrypted };
};

/**
 * Verify an auth token against an encrypted token
 * @param token - The plain text token to verify
 * @param encrypted - The encrypted token stored in database
 * @param encryptionKey - 32-byte encryption key
 * @returns true if the token matches, false otherwise
 */
export const verifyAuthToken = (token: string, encrypted: string | null, encryptionKey: Buffer | null): boolean => {
  if (!encrypted || !encryptionKey) {
    return false;
  }
  try {
    const decrypted = decryptAuthToken(encrypted, encryptionKey);
    // Use timing-safe comparison to prevent timing attacks
    const decryptedBuffer = Buffer.from(decrypted, 'utf8');
    const tokenBuffer = Buffer.from(token, 'utf8');
    if (decryptedBuffer.length !== tokenBuffer.length) {
      return false;
    }
    return timingSafeEqual(decryptedBuffer, tokenBuffer);
  } catch {
    return false;
  }
};
