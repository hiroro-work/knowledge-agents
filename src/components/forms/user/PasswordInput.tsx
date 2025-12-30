import { PasswordInput as MantinePasswordInput } from '@mantine/core';
import { z } from 'zod';
import type { PasswordInputProps } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';

export const passwordValidation = z.string().min(8, { error: 'Password must be at least 8 characters' });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const PasswordInput = <Form extends UseFormReturnType<any>>({
  form,
  ...props
}: { form: Form } & Omit<PasswordInputProps, 'form'>) => {
  const name = 'password';
  const label = 'Password';

  return <MantinePasswordInput label={label} aria-label={label} {...props} {...form.getInputProps(name)} />;
};
