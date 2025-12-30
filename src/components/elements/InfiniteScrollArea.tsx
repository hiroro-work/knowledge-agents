'use client';

import { ScrollArea } from '@mantine/core';
import { InfiniteScroll } from './InfiniteScroll';
import type { LoaderProps, ScrollAreaProps } from '@mantine/core';
import type { ReactNode } from 'react';

type Props = {
  h?: ScrollAreaProps['h'];
  loading?: boolean;
  hasMore?: boolean;
  loadMore?: () => void;
  children: ReactNode;
  loaderProps?: Omit<LoaderProps, 'ref'>;
};

const defaultLoaderProps: Omit<LoaderProps, 'ref'> = { size: 'sm', pos: 'sticky', left: '50%', p: 'md' };

export const InfiniteScrollArea = ({ h, loading, hasMore, loadMore, children, loaderProps }: Props) => {
  const content = (
    <InfiniteScroll
      loading={loading}
      hasMore={hasMore}
      loadMore={loadMore}
      loaderProps={{ ...defaultLoaderProps, ...loaderProps }}
    >
      {children}
    </InfiniteScroll>
  );

  if (h) {
    return <ScrollArea h={h}>{content}</ScrollArea>;
  }

  return <ScrollArea>{content}</ScrollArea>;
};
