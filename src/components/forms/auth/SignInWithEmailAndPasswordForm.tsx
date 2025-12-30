'use client';

import { Stack, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useCallback, useState } from 'react';
import { z } from 'zod';
import { LoadingOverlayButton } from '~/components/elements/buttons/LoadingOverlayButton';
import { signInWithEmailAndPassword } from '~/utils/firebase/auth';
import { notify } from '~/utils/mantine/notifications';
import { emailValidation, EmailInput } from '../user/EmailInput';
import { passwordValidation, PasswordInput } from '../user/PasswordInput';

type FormValues = {
  email: string;
  password: string;
};

const schema = z.object({
  email: emailValidation,
  password: passwordValidation,
});

export const SignInWithEmailAndPasswordForm = ({ onSubmit }: { onSubmit?: () => void }) => {
  const form = useForm<FormValues>({
    validate: zod4Resolver(schema),
    initialValues: { email: '', password: '' },
  });
  const [loading, setLoading] = useState(false);
  const handleSubmit = useCallback(
    async ({ email, password }: FormValues) => {
      try {
        setLoading(true);
        await signInWithEmailAndPassword(email, password);
        notify.info({ message: 'Signed in successfully' });
        onSubmit?.();
        // NOTE: Don't clear loading here as form briefly appears before redirect
      } catch (error) {
        console.error(error);
        notify.error({ message: 'Sign in failed' });
        setLoading(false);
      }
    },
    [onSubmit, setLoading],
  );

  return (
    <form onSubmit={form.onSubmit(handleSubmit)} aria-label='Sign In Form'>
      <Stack gap='md'>
        <EmailInput form={form} withAsterisk />
        <PasswordInput form={form} withAsterisk />
      </Stack>
      <Group justify='flex-end' mt='lg'>
        <LoadingOverlayButton type='submit' variant='outline' aria-label='Sign In' loading={loading}>
          Sign In
        </LoadingOverlayButton>
      </Group>
    </form>
  );
};
