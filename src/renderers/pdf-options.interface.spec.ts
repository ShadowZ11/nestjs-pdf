import type { Browser } from '@puppeteer/browsers';
import type { PDFOptions } from 'puppeteer';
import { expectTypeOf } from 'vitest';

import type { PdfBrowser, PdfOptions } from './pdf-options.interface';

describe('Puppeteer type mirrors', () => {
  it('PdfOptions should match PDFOptions both ways', () => {
    expectTypeOf<PdfOptions>().toEqualTypeOf<PDFOptions>();
  });

  it('PdfBrowser should match the values of the Browser enum', () => {
    expectTypeOf<PdfBrowser>().toEqualTypeOf<`${Browser}`>();
    expectTypeOf<Browser>().toExtend<PdfBrowser>();
  });
});
