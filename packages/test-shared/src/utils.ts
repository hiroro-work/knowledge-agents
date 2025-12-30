import type { Timestamp } from '@local/shared';

// NOTE: Using Timestamp or serverTimestamp causes errors, so we use Date instead
// https://github.com/firebase/firebase-js-sdk/issues/6077
export const timestamp = (date: Date) => date as unknown as Timestamp;
