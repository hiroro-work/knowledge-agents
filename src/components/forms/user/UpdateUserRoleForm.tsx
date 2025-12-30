'use client';

import { Group, Select, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useCallback, useState } from 'react';
import { z } from 'zod';
import { userRoles } from '@local/shared';
import { LoadingOverlayButton } from '~/components/elements/buttons/LoadingOverlayButton';
import { updateUserRole } from '~/utils/api/fetch';
import { notify } from '~/utils/mantine/notifications';
import type { User, UserRole } from '@local/shared';

type FormValues = {
  role: UserRole;
};

const schema = z.object({
  role: z.enum(['user', 'admin']),
});

type Props = {
  user: User;
  onSubmit?: () => void;
};

export const UpdateUserRoleForm = ({ user, onSubmit }: Props) => {
  const form = useForm<FormValues>({
    validate: zod4Resolver(schema),
    initialValues: {
      role: user.role,
    },
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async ({ role }: FormValues) => {
      try {
        setLoading(true);
        await updateUserRole({ userId: user.id, role });
        notify.info({ message: 'Role updated successfully' });
        onSubmit?.();
      } catch (error) {
        console.error(error);
        notify.error({ message: 'Failed to update role' });
      } finally {
        setLoading(false);
      }
    },
    [user.id, onSubmit],
  );

  return (
    <form onSubmit={form.onSubmit(handleSubmit)} aria-label='Update role form'>
      <Stack gap='md'>
        <Select label='Role' aria-label='Role' data={userRoles} withAsterisk {...form.getInputProps('role')} />
      </Stack>
      <Group justify='flex-end' mt='lg'>
        <LoadingOverlayButton type='submit' variant='outline' aria-label='Update' loading={loading}>
          Update
        </LoadingOverlayButton>
      </Group>
    </form>
  );
};
