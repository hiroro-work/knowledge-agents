import { AuthLayout as _AuthLayout } from '~/layouts/AuthLayout';
import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <_AuthLayout>{children}</_AuthLayout>;
}
