'use client';

import { Divider, NavLink, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconHome, IconUsers } from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const AdminNavMenu = () => {
  const pathname = usePathname();

  return (
    <Stack gap='xs' aria-label='Navigation menu'>
      <NavLink
        component={Link}
        href='/'
        label='Home'
        leftSection={
          <ThemeIcon variant='light' size='sm' color='gray'>
            <IconHome size={14} />
          </ThemeIcon>
        }
      />
      <Divider
        my='xs'
        label={
          <Text size='xs' c='dimmed' tt='uppercase' fw={500}>
            Management
          </Text>
        }
      />
      <NavLink
        component={Link}
        href='/admin/users'
        label='Users'
        leftSection={
          <ThemeIcon variant='light' size='sm' color={pathname?.startsWith('/admin/users') ? 'brand' : 'gray'}>
            <IconUsers size={14} />
          </ThemeIcon>
        }
        active={pathname?.startsWith('/admin/users')}
      />
    </Stack>
  );
};
