import { useDocumentsData as _useDocumentsData } from '@sonicgarden/react-fire-hooks';

export const useDocumentsData = <T>(...[ref, options]: Parameters<typeof _useDocumentsData<T>>) =>
  _useDocumentsData(ref, {
    ...options,
    snapshotOptions: { serverTimestamps: 'estimate', ...options?.snapshotOptions },
  });
