import type { PuppeteerParameters } from '../puppeteer/puppeteer-parameters.interface';

export const PDF_RENDERER = 'PDF_RENDERER' as const;

/** Turns an HTML document into a PDF. One implementation per provider. */
export interface PdfRenderer {
  /**
   * @param html the HTML document to print
   * @param options the generation options, already merged with the module defaults
   * @param signal aborts the rendering; the promise then rejects
   */
  render(
    html: string,
    options: PuppeteerParameters,
    signal?: AbortSignal,
  ): Promise<Uint8Array>;
}
