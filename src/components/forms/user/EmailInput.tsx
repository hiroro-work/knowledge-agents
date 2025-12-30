import { TextInput } from '@mantine/core';
import { z } from 'zod';
import { userFieldLabels } from '@local/shared';
import type { TextInputProps } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';

export const emailValidation = z.email({ error: 'Invalid email format' });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const EmailInput = <Form extends UseFormReturnType<any>>({
  form,
  ...props
}: { form: Form } & Omit<TextInputProps, 'form'>) => {
  const name = 'email';
  const label = userFieldLabels[name];

  return <TextInput type='text' label={label} aria-label={label} {...props} {...form.getInputProps(name)} />;
};
