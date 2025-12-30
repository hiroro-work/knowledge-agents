'use client';

import { Loader } from '@mantine/core';
import { useIntersection } from '@mantine/hooks';
import { useEffect } from 'react';
import type { LoaderProps } from '@mantine/core';

export const MoreLoader = ({ loadMore, ...props }: Omit<LoaderProps, 'ref'> & { loadMore?: () => void }) => {
  const { ref, entry } = useIntersection({ threshold: 1 });

  useEffect(() => {
    if (entry?.isIntersecting) loadMore?.();
  }, [entry?.isIntersecting, loadMore]);

  return <Loader ref={ref} {...props} />;
};
