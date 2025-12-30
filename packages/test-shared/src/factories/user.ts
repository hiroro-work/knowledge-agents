import { defaultUserRole } from '@local/shared';
import { Factory } from 'fishery';
import { timestamp } from '../utils.js';
import type { User, UserDocumentData } from '@local/shared';

const userData = ({ sequence }: { sequence: number }) => ({
  createdAt: timestamp(new Date()),
  updatedAt: timestamp(new Date()),
  email: `user-${sequence}@example.com`,
  role: defaultUserRole,
});

export const userDataFactory = Factory.define<UserDocumentData>(({ sequence }) => userData({ sequence }));

export const userFactory = Factory.define<User>(({ sequence }) => ({
  id: `user-${sequence}`,
  ...userData({ sequence }),
}));
