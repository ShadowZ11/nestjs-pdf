import { fileURLToPath } from 'node:url';

import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // SWC handles emitDecoratorMetadata, which esbuild does not — required for Nest DI.
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    setupFiles: ['test/setup.ts'],
    alias: {
      'pdfjs-dist/legacy/build/pdf.mjs': fileURLToPath(
        new URL('./test/__mocks__/pdfjs-dist.ts', import.meta.url),
      ),
    },
    reporters: ['default', 'junit'],
    outputFile: { junit: 'coverage/junit.xml' },
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.(t|j)s'],
      exclude: ['src/index.ts', 'src/**/*.spec.ts'],
    },
  },
});
