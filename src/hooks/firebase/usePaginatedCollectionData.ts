import { usePaginatedCollectionData as _usePaginatedCollectionData } from '@sonicgarden/react-fire-hooks';

export const usePaginatedCollectionData = <T>(...[query, options]: Parameters<typeof _usePaginatedCollectionData<T>>) =>
  _usePaginatedCollectionData(query, {
    ...options,
    snapshotOptions: { serverTimestamps: 'estimate', ...options?.snapshotOptions },
  });
