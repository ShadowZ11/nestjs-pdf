import { Logger } from '@nestjs/common';
import type { PDFOptions } from 'puppeteer';

import { RendererConfigurationException } from '../exceptions';
import { installRequestGuard } from '../helpers/request-guard.helper';
import { type BrowserService } from '../puppeteer/browser/browser.service';
import type { PuppeteerParameters } from '../puppeteer/puppeteer-parameters.interface';
import { type PdfOptions } from './pdf-options.interface';
import type { PdfRenderer } from './pdf-renderer.interface';

//src: https://www.bannerbear.com/blog/ways-to-speed-up-puppeteer-screenshots/
const DEFAULT_ARGS = [
  '--autoplay-policy=user-gesture-required',
  '--disable-background-networking',
  '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows',
  '--disable-breakpad',
  '--disable-client-side-phishing-detection',
  '--disable-component-update',
  '--disable-default-apps',
  '--disable-dev-shm-usage',
  '--disable-domain-reliability',
  '--disable-extensions',
  '--disable-features=AudioServiceOutOfProcess',
  '--disable-hang-monitor',
  '--disable-ipc-flooding-protection',
  '--disable-notifications',
  '--disable-offer-store-unmasked-wallet-cards',
  '--disable-print-preview',
  '--disable-prompt-on-repost',
  '--disable-renderer-backgrounding',
  '--disable-setuid-sandbox',
  '--disable-speech-api',
  '--disable-sync',
  '--hide-scrollbars',
  '--ignore-gpu-blacklist',
  '--metrics-recording-only',
  '--mute-audio',
  '--no-default-browser-check',
  '--no-first-run',
  '--no-pings',
  '--password-store=basic',
  '--use-gl=swiftshader',
  '--use-mock-keychain',
  '--disable-accelerated-2d-canvas',
  '--no-zygote',
  '--disable-gpu',
];

const PDF_OPTION_KEYS: Record<keyof PDFOptions, true> = {
  scale: true,
  displayHeaderFooter: true,
  headerTemplate: true,
  footerTemplate: true,
  printBackground: true,
  landscape: true,
  pageRanges: true,
  format: true,
  width: true,
  height: true,
  preferCSSPageSize: true,
  margin: true,
  path: true,
  omitBackground: true,
  tagged: true,
  outline: true,
  timeout: true,
  waitForFonts: true,
};

function toPuppeteerPdfOptions(options?: PdfOptions): PDFOptions {
  if (!options) {
    return { format: 'A4' };
  }
  const invalidKeys = Object.keys(options).filter(
    (key) => !Object.hasOwn(PDF_OPTION_KEYS, key),
  );
  if (invalidKeys.length > 0) {
    throw new RendererConfigurationException(
      `Invalid PDF options: ${invalidKeys.join(', ')}. Please check the documentation for valid options.`,
    );
  }
  return options;
}

export class PuppeteerRenderer implements PdfRenderer {
  readonly #browserService: BrowserService;

  constructor(browserService: BrowserService) {
    this.#browserService = browserService;
  }

  async render(
    html: string,
    options: PuppeteerParameters,
    signal?: AbortSignal,
  ): Promise<Uint8Array> {
    if (options.chromiumRevision !== undefined) {
      Logger.warn(
        'Using `chromiumRevision` is no longer supported since the puppeteer update.',
      );
    }

    const pdfOptions = toPuppeteerPdfOptions(options.pdfOptions);
    const headless: boolean | 'shell' = options.headless ?? true;
    const executablePath = options.executablePath || undefined;
    const args = options.extraPuppeteerArgs || DEFAULT_ARGS;

    let context: Awaited<ReturnType<BrowserService['createContext']>> | null =
      null;

    let closing: Promise<void> | undefined;
    const onAbort = () => {
      if (!context) return;
      closing = context.close();
      closing.catch(() => undefined);
    };
    signal?.addEventListener('abort', onAbort, { once: true });

    try {
      context = await this.#browserService.createContext(
        args,
        headless,
        executablePath,
      );
      signal?.throwIfAborted();
      const page = await context.newPage();
      if (options.security) {
        await installRequestGuard(context, page, options.security);
      }

      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      await page.emulateMediaType('screen');
      await page.waitForNetworkIdle({ idleTime: 500, timeout: 30000 });
      // Executes inside the browser page context via Puppeteer, not in Node — unreachable by unit tests.
      /* v8 ignore next */
      await page.evaluate(() => document.fonts.ready);

      return await page.pdf(pdfOptions);
    } finally {
      signal?.removeEventListener('abort', onAbort);
      if (context) {
        try {
          if (closing) await closing;
          else await context.close();
        } catch (error) {
          Logger.error(error);
        }
      }
    }
  }
}
