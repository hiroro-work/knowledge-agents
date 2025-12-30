import { Layout } from '~/layouts/Layout';
import type { ReactNode } from 'react';

export default function DefaultLayout({ children }: { children: ReactNode }) {
  return <Layout>{children}</Layout>;
}
