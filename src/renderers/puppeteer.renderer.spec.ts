import { vi } from 'vitest';

import { RendererConfigurationException } from '../exceptions';
import type { BrowserService } from '../puppeteer/browser/browser.service';
import type { PdfOptions } from './pdf-options.interface';
import { PuppeteerRenderer } from './puppeteer.renderer';

const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46]);

describe('PuppeteerRenderer', () => {
  const page = {
    setContent: vi.fn(),
    emulateMediaType: vi.fn(),
    waitForNetworkIdle: vi.fn(),
    evaluate: vi.fn(),
    pdf: vi.fn(),
  };
  const context = {
    newPage: vi.fn(),
    close: vi.fn(),
  };
  const browserService = { createContext: vi.fn() };

  const renderer = () =>
    new PuppeteerRenderer(browserService as unknown as BrowserService);

  beforeEach(() => {
    vi.clearAllMocks();
    page.pdf.mockResolvedValue(PDF);
    context.newPage.mockResolvedValue(page);
    context.close.mockResolvedValue(undefined);
    browserService.createContext.mockResolvedValue(context);
  });

  it('should print A4 when no pdf options are given', async () => {
    await expect(renderer().render('<p></p>', {})).resolves.toEqual(PDF);

    expect(page.pdf).toHaveBeenCalledWith({ format: 'A4' });
  });

  it('should pass the pdf options through to Puppeteer', async () => {
    const pdfOptions: PdfOptions = {
      format: 'Letter',
      landscape: true,
      margin: { top: '1cm' },
      printBackground: true,
    };

    await renderer().render('<p></p>', { pdfOptions });

    expect(page.pdf).toHaveBeenCalledWith(pdfOptions);
  });

  it('should reject unknown pdf options before opening a browser context', async () => {
    const pdfOptions = { format: 'A4', papper: 'A3', colour: true };

    const promise = renderer().render('<p></p>', {
      pdfOptions: pdfOptions as PdfOptions,
    });

    await expect(promise).rejects.toThrow(RendererConfigurationException);
    await expect(promise).rejects.toThrow(
      'Invalid PDF options: papper, colour',
    );
    expect(browserService.createContext).not.toHaveBeenCalled();
  });

  it('should not accept inherited keys as pdf options', async () => {
    const pdfOptions = { toString: 'nope' };

    await expect(
      renderer().render('<p></p>', {
        pdfOptions: pdfOptions as unknown as PdfOptions,
      }),
    ).rejects.toThrow('Invalid PDF options: toString');
  });
});
