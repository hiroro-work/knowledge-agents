import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['src/**/_tests/**/*.test.ts', 'src/app/api/**/*.test.ts'],
    pool: 'threads',
    maxWorkers: 1,
  },
});
