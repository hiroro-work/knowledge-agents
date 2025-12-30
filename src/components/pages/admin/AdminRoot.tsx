'use client';

import { Card, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconUsers } from '@tabler/icons-react';
import Link from 'next/link';

export const AdminRoot = () => {
  return (
    <Stack gap='lg'>
      <Title order={2}>Admin</Title>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing='md'>
        <Card component={Link} href='/admin/users' shadow='sm' padding='lg' radius='md' withBorder>
          <Stack align='center' gap='md'>
            <IconUsers size={48} stroke={1.5} />
            <Text fw={500}>Users</Text>
            <Text size='sm' c='dimmed' ta='center'>
              Create, edit, and delete users
            </Text>
          </Stack>
        </Card>
      </SimpleGrid>
    </Stack>
  );
};
