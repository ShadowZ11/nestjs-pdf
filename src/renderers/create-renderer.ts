import { RendererConfigurationException } from '../exceptions';
import type { BrowserService } from '../puppeteer/browser/browser.service';
import type { PuppeteerParameters } from '../puppeteer/puppeteer-parameters.interface';
import { Api2PdfRenderer } from './api2pdf.renderer';
import { GotenbergRenderer } from './gotenberg.renderer';
import type { PdfRenderer } from './pdf-renderer.interface';
import { PuppeteerRenderer } from './puppeteer.renderer';

/** True when the PDFs are printed by the local Chromium (the default). */
export function usesPuppeteer(params: PuppeteerParameters): boolean {
  return (params.provider?.type ?? 'puppeteer') === 'puppeteer';
}

export function createPdfRenderer(
  params: PuppeteerParameters,
  browserService: BrowserService,
): PdfRenderer {
  const provider = params.provider ?? { type: 'puppeteer' };

  switch (provider.type) {
    case 'puppeteer':
      return new PuppeteerRenderer(browserService);
    case 'gotenberg':
      return new GotenbergRenderer(provider);
    case 'api2pdf':
      return new Api2PdfRenderer(provider);
    default:
      throw new RendererConfigurationException(
        `Unknown PDF provider '${String((provider as { type?: unknown }).type)}': expected 'puppeteer', 'gotenberg' or 'api2pdf'`,
      );
  }
}
