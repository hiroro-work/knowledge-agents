import type { Timestamp, WithId } from '../firebase.js';

export const userRoles = [
  { label: 'User', value: 'user' },
  { label: 'Admin', value: 'admin' },
] as const;
export type UserRole = (typeof userRoles)[number]['value'];
export const defaultUserRole = 'user' as UserRole;

export type UserDocumentData = {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  email: string;
  role: UserRole;
};

export type User = WithId<UserDocumentData>;

export type Claims = {
  role: UserRole;
};
