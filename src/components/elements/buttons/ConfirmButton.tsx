'use client';

import { Button, createPolymorphicComponent } from '@mantine/core';
import { useCallback, forwardRef } from 'react';
import { confirm } from '~/utils/mantine/modals';
import type { ButtonProps } from '@mantine/core';

type Props = ButtonProps & {
  title?: Parameters<typeof confirm>[0]['title'];
  message: Parameters<typeof confirm>[0]['message'];
  onConfirm: Parameters<typeof confirm>[0]['onConfirm'];
};

const _ConfirmButton = forwardRef<HTMLButtonElement, Props>(({ title, message, onConfirm, ...props }: Props, ref) => {
  const handleClick = useCallback(() => {
    confirm({ title, message, onConfirm });
  }, [title, message, onConfirm]);

  return <Button {...props} ref={ref} onClick={handleClick} />;
});
_ConfirmButton.displayName = 'ConfirmButton';

export const ConfirmButton = createPolymorphicComponent<'button', Props, typeof _ConfirmButton>(_ConfirmButton);
