'use client';

import {
  AppShell,
  Burger,
  Divider,
  Group,
  NavLink as MantineNavLink,
  ScrollArea,
  createPolymorphicComponent,
} from '@mantine/core';
import { useDisclosure, useViewportSize } from '@mantine/hooks';
import { useMemo, useCallback, createContext, useContext } from 'react';
import type { NavLinkProps } from '@mantine/core';
import type { MouseEvent, ReactNode } from 'react';

const HEADER_HEIGHT = 60;
const CONTENT_PADDING = 16;

type ResponsiveLayoutContextValue = {
  navbar: {
    toggle: () => void;
  };
  main: {
    height: number;
  };
};

const ResponsiveLayoutContext = createContext<ResponsiveLayoutContextValue>({
  navbar: { toggle: () => {} },
  main: { height: 0 },
});

export const useResponsiveLayoutContext = () => useContext(ResponsiveLayoutContext);

export const ResponsiveLayout = ({
  children,
  header,
  navbar,
  main,
}: {
  children: ReactNode;
  header: { title: ReactNode; props?: Parameters<typeof AppShell.Header>[0] };
  navbar?: {
    fixedMenu?: ReactNode;
    navMenu: ReactNode;
    accountMenu?: ReactNode;
    props?: Parameters<typeof AppShell.Navbar>[0];
  };
  main?: { props?: Parameters<typeof AppShell.Main>[0] };
}) => {
  const [opened, { toggle }] = useDisclosure();
  const { height } = useViewportSize();
  const navbarValues = useMemo(() => ({ toggle }), [toggle]);
  const mainValues = useMemo(() => ({ height: height - HEADER_HEIGHT - CONTENT_PADDING * 2 }), [height]);

  return (
    <ResponsiveLayoutContext.Provider value={{ navbar: navbarValues, main: mainValues }}>
      <AppShell
        header={{ height: HEADER_HEIGHT }}
        {...(navbar && {
          navbar: { width: { base: 240, md: 260, lg: 300 }, breakpoint: 'sm', collapsed: { mobile: !opened } },
        })}
        padding={CONTENT_PADDING}
      >
        <AppShell.Header {...header?.props}>
          <Group h='100%' px={CONTENT_PADDING}>
            {navbar && (
              <Burger
                opened={opened}
                onClick={toggle}
                hiddenFrom='sm'
                size='sm'
                aria-label='Menu Button'
                {...(header.props?.c && { color: header.props.c as Parameters<typeof Burger>[0]['color'] })}
              />
            )}
            {header.title}
          </Group>
        </AppShell.Header>
        {navbar && (
          <AppShell.Navbar {...navbar?.props}>
            {navbar.fixedMenu && <AppShell.Section p={CONTENT_PADDING}>{navbar.fixedMenu}</AppShell.Section>}
            <AppShell.Section grow p={CONTENT_PADDING} component={ScrollArea} aria-label='Navigation Menu'>
              {navbar.navMenu}
            </AppShell.Section>
            {navbar.accountMenu && (
              <>
                <Divider />
                <AppShell.Section p={16}>{navbar.accountMenu}</AppShell.Section>
              </>
            )}
          </AppShell.Navbar>
        )}
        <AppShell.Main {...main?.props}>{children}</AppShell.Main>
      </AppShell>
    </ResponsiveLayoutContext.Provider>
  );
};

const ResponsiveLayoutNavLink = ({ onClick, ...props }: NavLinkProps) => {
  const {
    navbar: { toggle },
  } = useResponsiveLayoutContext();
  const handleClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);
      toggle();
    },
    [toggle, onClick],
  );

  return <MantineNavLink {...props} onClick={handleClick} />;
};
export const NavLink = createPolymorphicComponent<'button', NavLinkProps, typeof ResponsiveLayoutNavLink>(
  ResponsiveLayoutNavLink,
);
ResponsiveLayout.NavLink = NavLink;
