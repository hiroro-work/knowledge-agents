'use client';

import { useEffect } from 'react';
import { InternalServerErrorScreen } from '~/components/screens/InternalServerErrorScreen';

export default function Error({ error }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <InternalServerErrorScreen />;
}
