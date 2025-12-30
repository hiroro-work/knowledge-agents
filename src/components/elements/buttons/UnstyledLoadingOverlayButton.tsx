import { UnstyledButton, LoadingOverlay, createPolymorphicComponent } from '@mantine/core';
import { forwardRef } from 'react';
import type { UnstyledButtonProps } from '@mantine/core';
import type { ReactNode } from 'react';

type Props = UnstyledButtonProps & {
  loading?: boolean;
  children: ReactNode;
};

const _UnstyledLoadingOverlayButton = forwardRef<HTMLButtonElement, Props>(
  ({ loading, children, ...props }: Props, ref) => {
    return (
      <>
        <LoadingOverlay visible={loading} />
        <UnstyledButton {...props} disabled={loading} ref={ref}>
          {children}
        </UnstyledButton>
      </>
    );
  },
);
_UnstyledLoadingOverlayButton.displayName = 'UnstyledLoadingOverlayButton';

export const UnstyledLoadingOverlayButton = createPolymorphicComponent<
  'button',
  Props,
  typeof _UnstyledLoadingOverlayButton
>(_UnstyledLoadingOverlayButton);
