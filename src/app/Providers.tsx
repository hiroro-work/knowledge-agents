'use client';

import { AuthProvider } from '~/contexts/auth';
import type { ReactNode } from 'react';

export const Providers = ({ children }: { children: ReactNode }) => {
  return <AuthProvider>{children}</AuthProvider>;
};
