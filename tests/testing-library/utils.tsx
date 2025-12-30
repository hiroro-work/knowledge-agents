import { render as testingLibraryRender } from '@testing-library/react';
import { MantineProvider } from '~/utils/mantine/provider';
import type { ReactNode } from 'react';

export const render = (ui: ReactNode) =>
  testingLibraryRender(<>{ui}</>, {
    wrapper: ({ children }: { children: ReactNode }) => <MantineProvider>{children}</MantineProvider>,
  });
