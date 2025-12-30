'use client';

import { Group, Select, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useCallback, useState } from 'react';
import { z } from 'zod';
import { userRoles } from '@local/shared';
import { LoadingOverlayButton } from '~/components/elements/buttons/LoadingOverlayButton';
import { createUser } from '~/utils/api/fetch';
import { notify } from '~/utils/mantine/notifications';
import type { UserRole } from '@local/shared';

type FormValues = {
  email: string;
  role: UserRole;
};

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['user', 'admin']),
});

type Props = {
  onSubmit?: () => void;
};

export const AddUserForm = ({ onSubmit }: Props) => {
  const form = useForm<FormValues>({
    validate: zod4Resolver(schema),
    initialValues: {
      email: '',
      role: 'user',
    },
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async ({ email, role }: FormValues) => {
      try {
        setLoading(true);
        await createUser({ email, role });
        notify.info({ message: 'User created successfully' });
        onSubmit?.();
      } catch (error) {
        console.error(error);
        notify.error({ message: 'Failed to create user' });
      } finally {
        setLoading(false);
      }
    },
    [onSubmit],
  );

  return (
    <form onSubmit={form.onSubmit(handleSubmit)} aria-label='Create user form'>
      <Stack gap='md'>
        <TextInput
          label='Email'
          aria-label='Email'
          placeholder='user@example.com'
          type='email'
          withAsterisk
          {...form.getInputProps('email')}
        />
        <Select label='Role' aria-label='Role' data={userRoles} withAsterisk {...form.getInputProps('role')} />
      </Stack>
      <Group justify='flex-end' mt='lg'>
        <LoadingOverlayButton type='submit' variant='outline' aria-label='Create' loading={loading}>
          Create
        </LoadingOverlayButton>
      </Group>
    </form>
  );
};
