'use client';

import { Divider, NavLink, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconRobot, IconSettings } from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '~/contexts/auth';

export const NavMenu = () => {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  const isAgentsActive = pathname === '/agents' || pathname?.startsWith('/agents/');

  return (
    <Stack gap='xs' aria-label='Navigation menu'>
      <NavLink
        component={Link}
        href='/agents'
        label='Agents'
        leftSection={
          <ThemeIcon variant='light' size='sm' color={isAgentsActive ? 'brand' : 'gray'}>
            <IconRobot size={14} />
          </ThemeIcon>
        }
        active={isAgentsActive}
      />
      {isAdmin && (
        <>
          <Divider
            my='xs'
            label={
              <Text size='xs' c='dimmed' tt='uppercase' fw={500}>
                Admin
              </Text>
            }
          />
          <NavLink
            component={Link}
            href='/admin'
            label='Admin'
            leftSection={
              <ThemeIcon variant='light' size='sm' color={pathname?.startsWith('/admin') ? 'brand' : 'gray'}>
                <IconSettings size={14} />
              </ThemeIcon>
            }
            active={pathname?.startsWith('/admin')}
          />
        </>
      )}
    </Stack>
  );
};
