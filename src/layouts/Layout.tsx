'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { ResponsiveLayout, useResponsiveLayoutContext } from '~/components/layouts/ResponsiveLayout';
import { LoadingScreen } from '~/components/screens/LoadingScreen';
import { useAuth } from '~/contexts/auth';
import { AccountMenu } from './_components/AccountMenu';
import { HeaderTitle } from './_components/HeaderTitle';
import { NavMenu } from './_components/NavMenu';
import type { ReactNode } from 'react';

export const Layout = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const search = searchParams.toString();
  const asPath = `${pathname}${search ? `?${search}` : ''}`;
  const { signedIn } = useAuth();

  useEffect(() => {
    if (signedIn === false) router.replace(`/sign-in?redirect=${encodeURIComponent(asPath)}`);
  }, [signedIn, router, asPath]);

  if (!signedIn) return <LoadingScreen />;

  return (
    <ResponsiveLayout
      header={{ title: <HeaderTitle />, props: { bg: 'black', c: 'white' } }}
      navbar={{ navMenu: <NavMenu />, accountMenu: <AccountMenu /> }}
    >
      {children}
    </ResponsiveLayout>
  );
};

export const useLayout = useResponsiveLayoutContext;
