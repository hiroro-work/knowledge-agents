'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { ResponsiveLayout, useResponsiveLayoutContext } from '~/components/layouts/ResponsiveLayout';
import { LoadingScreen } from '~/components/screens/LoadingScreen';
import { useAuth } from '~/contexts/auth';
import { usePermissions } from '~/hooks/usePermissions';
import { AccountMenu } from './_components/AccountMenu';
import { AdminHeaderTitle } from './_components/AdminHeaderTitle';
import { AdminNavMenu } from './_components/AdminNavMenu';
import type { ReactNode } from 'react';

export const AdminLayout = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const search = searchParams.toString();
  const asPath = `${pathname}${search ? `?${search}` : ''}`;
  const { signedIn } = useAuth();
  const { validatePathPermission } = usePermissions();
  const validatedPathPermission = validatePathPermission(asPath);

  useEffect(() => {
    if (signedIn === false) router.replace(`/sign-in?redirect=${encodeURIComponent(asPath)}`);
    if (signedIn === true && !validatedPathPermission) router.replace('/');
  }, [signedIn, router, validatedPathPermission, asPath]);

  if (!signedIn) return <LoadingScreen />;
  if (!validatedPathPermission) return <LoadingScreen />;

  return (
    <ResponsiveLayout
      header={{ title: <AdminHeaderTitle />, props: { bg: 'black', c: 'white' } }}
      navbar={{ navMenu: <AdminNavMenu />, accountMenu: <AccountMenu /> }}
    >
      {children}
    </ResponsiveLayout>
  );
};

export const useAdminLayout = useResponsiveLayoutContext;
