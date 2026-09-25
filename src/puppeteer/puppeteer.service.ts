import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { Data } from 'ejs';
import pLimit from 'p-limit';
import { LocalsObject } from 'pug';
import { PDFOptions } from 'puppeteer';

import { NestjsPdfException, PdfGenerationException } from '../exceptions';
import { mergePuppeteerParameters } from '../helpers/deepMergePdfparams';
import { PDF_PARAMETERS } from '../helpers/tokens';
import { addWatermark } from '../helpers/watermark.helper';
import { BrowserService } from './browser/browser.service';
import { EjsService } from './engines/ejs/ejs.service';
import { EtaService } from './engines/eta/eta.service';
import { HandlebarsService } from './engines/handlebars/handlebars.service';
import { MjmlService } from './engines/mjml/mjml.service';
import { MustacheService } from './engines/mustache/mustache.service';
import { NunjucksService } from './engines/nunjucks/nunjucks.service';
import { PugService } from './engines/pug/pug.service';
import { requireService } from './libs/requireService.utils';
import type { PuppeteerParameters } from './puppeteer-parameters.interface';

@Injectable()
export class PuppeteerService {
  readonly #browserService: BrowserService;
  readonly #options: PuppeteerParameters;
  readonly #hbsService?: HandlebarsService;
  readonly #mjmlService?: MjmlService;
  readonly #pugService?: PugService;
  readonly #ejsService?: EjsService;
  readonly #nunjucksService?: NunjucksService;
  readonly #etaService?: EtaService;
  readonly #mustacheService?: MustacheService;

  constructor(
    browserService: BrowserService,
    @Inject(PDF_PARAMETERS) options: PuppeteerParameters,
    @Optional() hbsService?: HandlebarsService,
    @Optional() mjmlService?: MjmlService,
    @Optional() pugService?: PugService,
    @Optional() ejsService?: EjsService,
    @Optional() nunjucksService?: NunjucksService,
    @Optional() etaService?: EtaService,
    @Optional() mustacheService?: MustacheService,
  ) {
    this.#browserService = browserService;
    this.#options = options;
    this.#hbsService = hbsService;
    this.#mjmlService = mjmlService;
    this.#pugService = pugService;
    this.#ejsService = ejsService;
    this.#nunjucksService = nunjucksService;
    this.#etaService = etaService;
    this.#mustacheService = mustacheService;
  }

  readonly #limit = pLimit(3);

  async generatePdfFromHtml(
    html: string,
    options?: PuppeteerParameters,
  ): Promise<Uint8Array> {
    const signal = options?.signal ?? this.#options.signal;
    signal?.throwIfAborted();

    let started = false;
    const job = this.#limit(async () => {
      signal?.throwIfAborted();
      started = true;

      const mergePuppeteerOptions = mergePuppeteerParameters(
        this.#options,
        options,
      );
      if (mergePuppeteerOptions.chromiumRevision !== undefined) {
        Logger.warn(
          'Using `chromiumRevision` is no longer supported since the puppeteer update.',
        );
      }

      const headless: boolean | 'shell' =
        mergePuppeteerOptions.headless ?? true;

      const executablePath = mergePuppeteerOptions.executablePath || undefined;

      //src: https://www.bannerbear.com/blog/ways-to-speed-up-puppeteer-screenshots/
      const args = mergePuppeteerOptions.extraPuppeteerArgs || [
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
        '--disable-popup-blocking',
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

      this.#browserService.markJobStarted();
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

        const pdfOptions: PDFOptions = mergePuppeteerOptions.pdfOptions ?? {
          format: 'A4',
        };

        await page.setContent(html, { waitUntil: 'domcontentloaded' });
        await page.emulateMediaType('screen');
        await page.waitForNetworkIdle({ idleTime: 500, timeout: 30000 });
        // Executes inside the browser page context via Puppeteer, not in Node — unreachable by unit tests.
        /* v8 ignore next */
        await page.evaluate(() => document.fonts.ready);

        const pdf = await page.pdf(pdfOptions);
        signal?.throwIfAborted();
        return mergePuppeteerOptions.watermark
          ? await addWatermark(pdf, mergePuppeteerOptions.watermark)
          : pdf;
      } catch (e) {
        if (signal?.aborted) {
          throw signal.reason;
        }
        Logger.error(e);
        if (e instanceof NestjsPdfException) {
          throw e;
        }
        throw new PdfGenerationException(
          `PDF generation failed: ${String(e)}`,
          { cause: e },
        );
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
        await this.#browserService.markJobFinished();
      }
    });

    if (!signal) {
      return job;
    }

    let onQueuedAbort!: () => void;
    const abortedWhileQueued = new Promise<never>((_, reject) => {
      onQueuedAbort = () => {
        // An abort reason can be any value; callers expect the exact one they passed.
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        if (!started) reject(signal.reason);
      };
      signal.addEventListener('abort', onQueuedAbort, { once: true });
    });
    try {
      return await Promise.race([job, abortedWhileQueued]);
    } finally {
      signal.removeEventListener('abort', onQueuedAbort);
    }
  }

  async generatePdfFromTemplateHbsString(
    template: string,
    parameters: any = {},
    options?: PuppeteerParameters,
  ) {
    const hbsService = requireService(this.#hbsService, 'Handlebars');
    const html = hbsService.render(
      template,
      parameters,
      options?.hbsOptions ?? this.#options.hbsOptions,
    );
    return this.generatePdfFromHtml(html, options);
  }

  async generatePdfFromTemplateHbsFile(
    file: string,
    parameters: any = {},
    options?: PuppeteerParameters,
  ) {
    const hbsService = requireService(this.#hbsService, 'Handlebars');
    const html = hbsService.renderFile(
      file,
      parameters,
      options?.hbsOptions ?? this.#options.hbsOptions,
    );
    return this.generatePdfFromHtml(html, options);
  }

  async generatePdfFromMjmlString(
    template: string,
    options?: PuppeteerParameters,
  ) {
    const mjmlService = requireService(this.#mjmlService, 'MJML');
    const html = await mjmlService.render(
      template,
      options?.mjmlOptions ?? this.#options.mjmlOptions,
    );
    return this.generatePdfFromHtml(html, options);
  }

  async generatePdfFromMjmlFile(file: string, options?: PuppeteerParameters) {
    const mjmlService = requireService(this.#mjmlService, 'MJML');
    const html = await mjmlService.renderFile(
      file,
      options?.mjmlOptions ?? this.#options.mjmlOptions,
    );
    return this.generatePdfFromHtml(html, options);
  }

  async generatePdfFromPugString(
    template: string,
    data: LocalsObject = {},
    options?: PuppeteerParameters,
  ) {
    const pugService = requireService(this.#pugService, 'Pug');
    const html = pugService.render(
      template,
      data,
      options?.pugOptions ?? this.#options.pugOptions,
    );
    return this.generatePdfFromHtml(html, options);
  }

  async generatePdfFromPugFile(
    file: string,
    data: LocalsObject = {},
    options?: PuppeteerParameters,
  ) {
    const pugService = requireService(this.#pugService, 'Pug');
    const html = pugService.renderFile(
      file,
      data,
      options?.pugOptions ?? this.#options.pugOptions,
    );
    return this.generatePdfFromHtml(html, options);
  }

  async generatePdfFromEjsString(
    template: string,
    data: Data = {},
    options?: PuppeteerParameters,
  ) {
    const ejsService = requireService(this.#ejsService, 'EJS');
    const html = await ejsService.render(
      template,
      data,
      options?.ejsOptions ?? this.#options.ejsOptions,
    );
    return this.generatePdfFromHtml(html, options);
  }

  async generatePdfFromEjsFile(
    file: string,
    data: Data = {},
    options?: PuppeteerParameters,
  ) {
    const ejsService = requireService(this.#ejsService, 'EJS');
    const html = await ejsService.renderFile(
      file,
      data,
      options?.ejsOptions ?? this.#options.ejsOptions,
    );
    return this.generatePdfFromHtml(html, options);
  }

  async generatePdfFromNunjucksString(
    template: string,
    data: Record<string, unknown> = {},
    options?: PuppeteerParameters,
  ) {
    const nunjucksService = requireService(this.#nunjucksService, 'Nunjucks');
    const html = nunjucksService.render(
      template,
      data,
      options?.nunjucksOptions ?? this.#options.nunjucksOptions,
    );
    return this.generatePdfFromHtml(html, options);
  }

  async generatePdfFromNunjucksFile(
    file: string,
    data: Record<string, unknown> = {},
    options?: PuppeteerParameters,
  ) {
    const nunjucksService = requireService(this.#nunjucksService, 'Nunjucks');
    const html = nunjucksService.renderFile(
      file,
      data,
      options?.nunjucksOptions ?? this.#options.nunjucksOptions,
    );
    return this.generatePdfFromHtml(html, options);
  }

  async generatePdfFromEtaString(
    template: string,
    data: Record<string, unknown> = {},
    options?: PuppeteerParameters,
  ) {
    const etaService = requireService(this.#etaService, 'Eta');
    const html = etaService.render(
      template,
      data,
      options?.etaOptions ?? this.#options.etaOptions,
    );
    return this.generatePdfFromHtml(html, options);
  }

  async generatePdfFromEtaFile(
    file: string,
    data: Record<string, unknown> = {},
    options?: PuppeteerParameters,
  ) {
    const etaService = requireService(this.#etaService, 'Eta');
    const html = etaService.renderFile(
      file,
      data,
      options?.etaOptions ?? this.#options.etaOptions,
    );
    return this.generatePdfFromHtml(html, options);
  }

  async generatePdfFromMustacheString(
    template: string,
    data: Record<string, unknown> = {},
    options?: PuppeteerParameters,
  ) {
    const mustacheService = requireService(this.#mustacheService, 'Mustache');
    const html = mustacheService.render(
      template,
      data,
      options?.mustacheOptions ?? this.#options.mustacheOptions,
    );
    return this.generatePdfFromHtml(html, options);
  }

  async generatePdfFromMustacheFile(
    file: string,
    data: Record<string, unknown> = {},
    options?: PuppeteerParameters,
  ) {
    const mustacheService = requireService(this.#mustacheService, 'Mustache');
    const html = mustacheService.renderFile(
      file,
      data,
      options?.mustacheOptions ?? this.#options.mustacheOptions,
    );
    return this.generatePdfFromHtml(html, options);
  }
}
