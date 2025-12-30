'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { ResponsiveLayout, useResponsiveLayoutContext } from '~/components/layouts/ResponsiveLayout';
import { LoadingScreen } from '~/components/screens/LoadingScreen';
import { useAuth } from '~/contexts/auth';
import { AdminHeaderTitle } from './_components/AdminHeaderTitle';
import { HeaderTitle } from './_components/HeaderTitle';
import type { ReactNode } from 'react';

export const AuthLayout = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirect = searchParams.get('redirect');
  const { signedIn } = useAuth();
  const isAdminPage = useMemo(() => pathname.startsWith('/admin'), [pathname]);
  const header = useMemo(
    () =>
      isAdminPage ? { title: <AdminHeaderTitle />, props: { bg: 'black', c: 'white' } } : { title: <HeaderTitle /> },
    [isAdminPage],
  );
  const rootPath = useMemo(() => (isAdminPage ? '/admin' : '/'), [isAdminPage]);

  useEffect(() => {
    if (signedIn === true) router.replace(redirect ?? rootPath);
  }, [signedIn, router, rootPath, redirect]);

  if (signedIn !== false) return <LoadingScreen />;

  return <ResponsiveLayout header={header}>{children}</ResponsiveLayout>;
};

export const useAuthLayout = useResponsiveLayoutContext;
