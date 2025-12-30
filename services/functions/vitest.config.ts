import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['{src,test}/**/*.test.{js,ts}'],
    pool: 'threads',
    maxWorkers: 1,
    sequence: {
      hooks: 'parallel',
    },
  },
});
