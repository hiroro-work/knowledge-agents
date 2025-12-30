import { Modal, Button, createPolymorphicComponent } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { forwardRef } from 'react';
import type { ModalProps, ButtonProps } from '@mantine/core';
import type { ReactNode } from 'react';

type Props = ButtonProps & {
  modalContent: ({ opened, close }: { opened: boolean; close: () => void }) => ReactNode;
  modalProps?: Omit<ModalProps, 'opened' | 'onClose'>;
};

const _ModalButton = forwardRef<HTMLButtonElement, Props>(({ modalContent, modalProps, ...props }: Props, ref) => {
  const [opened, { open, close }] = useDisclosure(false);
  return (
    <>
      <Button {...props} ref={ref} onClick={open} />
      <Modal {...modalProps} opened={opened} onClose={close}>
        {modalContent({ opened, close })}
      </Modal>
    </>
  );
});
_ModalButton.displayName = 'ModalButton';

export const ModalButton = createPolymorphicComponent<'button', Props, typeof _ModalButton>(_ModalButton);
