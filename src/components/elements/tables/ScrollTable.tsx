import { Table as MantineScrollTable, ScrollArea } from '@mantine/core';
import cx from 'clsx';
import { InfiniteScroll } from '../InfiniteScroll';
import classes from './_styles/ScrollTable.module.css';
import type {
  ScrollAreaProps,
  TableProps,
  TableTheadProps,
  TableTbodyProps,
  TableTrProps,
  TableThProps,
  TableTdProps,
} from '@mantine/core';

type Props = TableProps & {
  h?: ScrollAreaProps['h'];
  loading?: boolean;
  hasMore?: boolean;
  loadMore?: () => void;
};

export const ScrollTable = ({ h, loading = false, hasMore, loadMore, ...ScrollTableProps }: Props) => {
  return (
    <ScrollArea {...(h && { h })}>
      <InfiniteScroll
        loading={loading}
        hasMore={hasMore}
        loadMore={loadMore}
        loaderProps={{ size: 'sm', pos: 'sticky', left: '50%', p: 'md' }}
      >
        <MantineScrollTable {...ScrollTableProps} />
      </InfiniteScroll>
    </ScrollArea>
  );
};

const ScrollTableThead = ({ sticky, ...props }: { sticky?: boolean } & TableTheadProps) => {
  const className = sticky ? cx(classes.header, props.className) : props.className;

  return <MantineScrollTable.Thead {...props} className={className} />;
};

const ScrollTableTbody = (props: TableTbodyProps) => {
  return <MantineScrollTable.Tbody {...props} />;
};

const ScrollTableTr = (props: TableTrProps) => {
  return <MantineScrollTable.Tr {...props} />;
};

const ScrollTableTh = ({ sticky, ...props }: { sticky?: boolean } & TableThProps) => {
  const className = sticky ? cx(classes.sticky, props.className) : props.className;

  return <MantineScrollTable.Th {...props} className={className} />;
};

const ScrollTableTd = ({ sticky, ...props }: { sticky?: boolean } & TableTdProps) => {
  const className = sticky ? cx(classes.sticky, props.className) : props.className;

  return <MantineScrollTable.Td {...props} className={className} />;
};

ScrollTable.Thead = ScrollTableThead;
ScrollTable.Tbody = ScrollTableTbody;
ScrollTable.Tr = ScrollTableTr;
ScrollTable.Th = ScrollTableTh;
ScrollTable.Td = ScrollTableTd;
