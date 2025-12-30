import { defaultUserRole } from '../types/index.js';
import type { ModelFields } from '../types/index.js';

export const userFields: ModelFields = {
  createdAt: {
    default: null,
    label: 'Created At',
  },
  updatedAt: {
    default: null,
    label: 'Updated At',
  },
  email: {
    default: '',
    label: 'Email',
  },
  role: {
    default: defaultUserRole,
    label: 'Role',
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const userDefaultData: { [key: string]: any } = Object.entries(userFields).reduce(
  (defaults, [key, value]) => ({ ...defaults, [key]: value.default }),
  {},
);

export const userFieldLabels: { [key: string]: string } = Object.entries(userFields).reduce(
  (labels, [key, value]) => ({ ...labels, [key]: value.label }),
  {},
);

export const userDefaultClaims = {
  role: defaultUserRole,
};
