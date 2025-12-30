import { AdminLayout as _AdminLayout } from '~/layouts/AdminLayout';
import type { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <_AdminLayout>{children}</_AdminLayout>;
}
