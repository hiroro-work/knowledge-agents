'use client';

import { IconBrandGoogle } from '@tabler/icons-react';
import { useCallback, useState } from 'react';
import { LoadingOverlayButton } from '~/components/elements/buttons/LoadingOverlayButton';
import { signInWithGoogle } from '~/utils/firebase/auth';
import { notify } from '~/utils/mantine/notifications';

export const SignInWithGoogleForm = ({ onSubmit }: { onSubmit?: () => void }) => {
  const [loading, setLoading] = useState(false);
  const handleClick = useCallback(async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      notify.info({ message: 'Signed in successfully' });
      onSubmit?.();
    } catch (error) {
      console.error(error);
      notify.error({ message: 'Sign in failed' });
    } finally {
      setLoading(false);
    }
  }, [onSubmit, setLoading]);

  return (
    <LoadingOverlayButton
      loading={loading}
      onClick={handleClick}
      variant='default'
      size='md'
      fullWidth
      leftSection={<IconBrandGoogle />}
      aria-label='Sign in with Google'
    >
      Sign in with Google
    </LoadingOverlayButton>
  );
};
