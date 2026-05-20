import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: [
    'pdfjs-dist',
    'pdf-lib',
    '@napi-rs/canvas',
    'ejs',
    'nunjucks',
    'pug',
    'mjml',
    '@gboutte/nestjs-hbs',
  ],
});
