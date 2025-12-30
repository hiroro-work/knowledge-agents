'use client';

import { Badge, Card, Group, Stack, Text, TextInput, Title, Tooltip } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconEdit, IconSearch, IconTrash, IconUserPlus } from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import { userRoles } from '@local/shared';
import { ConfirmButton } from '~/components/elements/buttons/ConfirmButton';
import { ModalButton } from '~/components/elements/buttons/ModalButton';
import { ScrollTable } from '~/components/elements/tables/ScrollTable';
import { AddUserForm } from '~/components/forms/user/AddUserForm';
import { UpdateUserRoleForm } from '~/components/forms/user/UpdateUserRoleForm';
import { useAdminLayout } from '~/layouts/AdminLayout';
import { usePaginatedUserCollection, usersQuery, usersQueryByEmail } from '~/models/user';
import { deleteUser } from '~/utils/api/fetch';
import { notify } from '~/utils/mantine/notifications';
import type { User } from '@local/shared';

// Title row (~40px) + Stack gap (lg=24px) + Search box (~36px) + Stack gap (lg=24px) + Card padding (md=16px*2)
const TABLE_OFFSET = 40 + 24 + 36 + 24 + 32;

type UserRowProps = {
  user: User;
};

const UserRow = ({ user }: UserRowProps) => {
  const roleInfo = userRoles.find((r) => r.value === user.role);

  const handleDelete = async () => {
    try {
      await deleteUser({ userId: user.id });
      notify.info({ message: 'User deleted successfully' });
    } catch (error) {
      console.error(error);
      notify.error({ message: 'Failed to delete user' });
    }
  };

  return (
    <ScrollTable.Tr>
      <ScrollTable.Td>
        <Text size='xs' c='dimmed'>
          {user.id}
        </Text>
      </ScrollTable.Td>
      <ScrollTable.Td>{user.email}</ScrollTable.Td>
      <ScrollTable.Td>
        <Group gap='xs'>
          <Badge color={user.role === 'admin' ? 'blue' : 'gray'} variant='light'>
            {roleInfo?.label ?? user.role}
          </Badge>
          <Tooltip label='Edit role' withArrow>
            <ModalButton
              variant='subtle'
              size='compact-xs'
              px={4}
              aria-label='Edit role'
              modalProps={{ title: 'Edit Role' }}
              modalContent={({ close }) => <UpdateUserRoleForm user={user} onSubmit={close} />}
            >
              <IconEdit size={14} />
            </ModalButton>
          </Tooltip>
        </Group>
      </ScrollTable.Td>
      <ScrollTable.Td>
        <Tooltip label='Delete' withArrow>
          <ConfirmButton
            variant='light'
            color='red'
            size='compact-xs'
            px={7}
            aria-label='Delete'
            message={`Are you sure you want to delete user "${user.email}"?\nThis action cannot be undone.`}
            onConfirm={handleDelete}
          >
            <IconTrash size={14} />
          </ConfirmButton>
        </Tooltip>
      </ScrollTable.Td>
    </ScrollTable.Tr>
  );
};

export const Users = () => {
  const { main } = useAdminLayout();
  const tableHeight = main.height - TABLE_OFFSET;
  const [searchEmail, setSearchEmail] = useState('');
  const [debouncedSearchEmail] = useDebouncedValue(searchEmail, 300);
  const userQuery = useMemo(
    () => (debouncedSearchEmail ? usersQueryByEmail(debouncedSearchEmail) : usersQuery()),
    [debouncedSearchEmail],
  );
  const {
    data: users,
    loading: usersLoading,
    hasMore,
    loadMore,
  } = usePaginatedUserCollection(userQuery, { limit: 20 });

  return (
    <Stack gap='lg'>
      <Group justify='space-between'>
        <Title order={2}>Users</Title>
        <Tooltip label='Add user' withArrow>
          <ModalButton
            variant='filled'
            size='compact-md'
            px={7}
            aria-label='Add user'
            modalProps={{ title: 'Create User' }}
            modalContent={({ close }) => <AddUserForm onSubmit={close} />}
          >
            <IconUserPlus size={16} />
          </ModalButton>
        </Tooltip>
      </Group>

      <TextInput
        placeholder='Search by email'
        leftSection={<IconSearch size={16} />}
        value={searchEmail}
        onChange={(e) => setSearchEmail(e.currentTarget.value)}
        aria-label='Search by email'
      />

      {users.length > 0 || usersLoading ? (
        <Card shadow='sm' padding='md' radius='md' withBorder>
          <ScrollTable h={tableHeight} loading={usersLoading} hasMore={hasMore} loadMore={loadMore}>
            <ScrollTable.Thead>
              <ScrollTable.Tr>
                <ScrollTable.Th miw={200}>UID</ScrollTable.Th>
                <ScrollTable.Th miw={200}>EMAIL</ScrollTable.Th>
                <ScrollTable.Th miw={120}>ROLE</ScrollTable.Th>
                <ScrollTable.Th miw={60}></ScrollTable.Th>
              </ScrollTable.Tr>
            </ScrollTable.Thead>
            <ScrollTable.Tbody>
              {users.map((user) => (
                <UserRow key={user.id} user={user} />
              ))}
            </ScrollTable.Tbody>
          </ScrollTable>
        </Card>
      ) : (
        <Card shadow='sm' padding='xl' radius='md' withBorder>
          <Text ta='center' c='dimmed'>
            {debouncedSearchEmail ? 'No users found matching your search.' : 'No users registered yet.'}
            <br />
            {!debouncedSearchEmail && 'Click the + button above to add a user.'}
          </Text>
        </Card>
      )}
    </Stack>
  );
};
