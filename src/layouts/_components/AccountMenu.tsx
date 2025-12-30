import { Avatar, Box, Group, NavLink, Text } from '@mantine/core';
import { useCallback } from 'react';
import { UnstyledConfirmButton } from '~/components/elements/buttons/UnstyledConfirmButton';
import { useAuth } from '~/contexts/auth';
import { signOut } from '~/utils/firebase/auth';
import { notify } from '~/utils/mantine/notifications';

export const AccountMenu = () => {
  const { currentUser } = useAuth();
  const handleConfirmSignOut = useCallback(async () => {
    await signOut();
    notify.info({
      message: 'Signed out successfully',
    });
  }, []);

  return (
    <Box aria-label='Account Menu'>
      <NavLink
        label={
          <Group wrap='nowrap'>
            <Avatar size='sm' />
            <Text truncate='end'>{currentUser?.email}</Text>
          </Group>
        }
      >
        <NavLink
          label='Sign Out'
          component={UnstyledConfirmButton}
          message='Are you sure you want to sign out?'
          onConfirm={handleConfirmSignOut}
        />
      </NavLink>
    </Box>
  );
};
