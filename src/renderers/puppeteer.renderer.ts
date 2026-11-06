import { Logger } from '@nestjs/common';
import type { PDFOptions } from 'puppeteer';

import { installRequestGuard } from '../helpers/request-guard.helper';
import { type BrowserService } from '../puppeteer/browser/browser.service';
import type { PuppeteerParameters } from '../puppeteer/puppeteer-parameters.interface';
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

      // PdfOptions mirrors PDFOptions (checked in pdf-options.interface.spec.ts).
      const pdfOptions: PDFOptions = options.pdfOptions ?? { format: 'A4' };

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
