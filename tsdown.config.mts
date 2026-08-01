import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  deps: {
    neverBundle: [
      'pdfjs-dist',
      'pdf-lib',
      '@napi-rs/canvas',
      'ejs',
      'nunjucks',
      'pug',
      'mjml',
      '@gboutte/nestjs-hbs',
    ],
  },
  target: false,
});
