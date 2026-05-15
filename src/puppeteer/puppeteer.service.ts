import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import type { PuppeteerParameters } from './puppeteer-parameters.interface';
import { PDF_PARAMETERS } from './helpers/tokens';
import { BrowserService } from './browser.service';
import { mergePuppeteerParameters } from '../helpers/deepMergePdfparams';
import pLimit from 'p-limit';
import { HandlebarsService } from '@gboutte/nestjs-hbs';
import { MjmlService } from './services/mjml.service';
import { PugService } from './services/pug.service';
import { EjsService } from './services/ejs.service';
import { PDFOptions } from 'puppeteer';
import { LocalsObject } from 'pug';
import { Data } from 'ejs';

@Injectable()
export class PuppeteerService {
  constructor(
    private readonly hbsService: HandlebarsService,
    private readonly browserService: BrowserService,
    @Inject(PDF_PARAMETERS) private readonly options: PuppeteerParameters,
    @Optional() private readonly mjmlService?: MjmlService,
    @Optional() private readonly pugService?: PugService,
    @Optional() private readonly ejsService?: EjsService,
  ) {}

  private readonly limit = pLimit(3);

  async generatePdfFromHtml(
    html: string,
    options?: PuppeteerParameters,
  ): Promise<Uint8Array> {
    return this.limit(async () => {
      const mergePuppeteerOptions = mergePuppeteerParameters(
        this.options,
        options,
      );
      if (mergePuppeteerOptions.chromiumRevision !== undefined) {
        Logger.warn(
          'Using `chromiumRevision` is no longer supported since the puppeteer update.',
        );
      }

      const headless: boolean | 'shell' =
        mergePuppeteerOptions.headless ?? true;

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

      this.browserService.markJobStarted();
      let context: Awaited<ReturnType<BrowserService['createContext']>> | null =
        null;

      try {
        context = await this.browserService.createContext(args, headless);
        const page = await context.newPage();

        const pdfOptions: PDFOptions = mergePuppeteerOptions.pdfOptions ?? {
          format: 'A4',
        };

        await page.setContent(html, { waitUntil: 'domcontentloaded' });
        await page.emulateMediaType('screen');
        await page.waitForNetworkIdle({ idleTime: 500, timeout: 30000 });
        await page.evaluate(() => document.fonts.ready);

        return await page.pdf(pdfOptions);
      } catch (e) {
        Logger.error(e);
        throw e;
      } finally {
        if (context) {
          try {
            await context.close();
          } catch (error) {
            Logger.error(error);
          }
        }
        await this.browserService.markJobFinished();
      }
    });
  }

  async generatePdfFromTemplateHbsString(
    template: string,
    parameters: any = {},
    options?: PuppeteerParameters,
  ) {
    const html = this.hbsService.render(template, parameters);
    return this.generatePdfFromHtml(html, options);
  }

  async generatePdfFromTemplateHbsFile(
    file: string,
    parameters: any = {},
    options?: PuppeteerParameters,
  ) {
    const html = this.hbsService.renderFile(file, parameters);
    return this.generatePdfFromHtml(html, options);
  }

  async generatePdfFromMjmlString(
    template: string,
    options?: PuppeteerParameters,
  ) {
    if (!this.mjmlService) {
      throw new Error(
        'MJML service is not available. If the problem persists, open an issue in the repo.',
      );
    }
    const html = await this.mjmlService.render(
      template,
      options?.mjmlOptions ?? this.options.mjmlOptions,
    );
    return this.generatePdfFromHtml(html, options);
  }

  async generatePdfFromMjmlFile(file: string, options?: PuppeteerParameters) {
    if (!this.mjmlService) {
      throw new Error(
        'MJML service is not available. If the problem persists, open an issue in the repo.',
      );
    }
    const html = await this.mjmlService.renderFile(
      file,
      options?.mjmlOptions ?? this.options.mjmlOptions,
    );
    return this.generatePdfFromHtml(html, options);
  }

  async generatePdfFromPugString(
    template: string,
    data: LocalsObject = {},
    options?: PuppeteerParameters,
  ) {
    if (!this.pugService) {
      throw new Error(
        'Pug service is not available. If the problem persists, open an issue in the repo.',
      );
    }
    const html = this.pugService.render(
      template,
      data,
      options?.pugOptions ?? this.options.pugOptions,
    );
    return this.generatePdfFromHtml(html, options);
  }

  async generatePdfFromPugFile(
    file: string,
    data: LocalsObject = {},
    options?: PuppeteerParameters,
  ) {
    if (!this.pugService) {
      throw new Error(
        'Pug service is not available. If the problem persists, open an issue in the repo.',
      );
    }
    const html = this.pugService.renderFile(
      file,
      data,
      options?.pugOptions ?? this.options.pugOptions,
    );
    return this.generatePdfFromHtml(html, options);
  }

  async generatePdfFromEjsString(
    template: string,
    data: Data = {},
    options?: PuppeteerParameters,
  ) {
    if (!this.ejsService) {
      throw new Error(
        'EJS service is not available. If the problem persists, open an issue in the repo.',
      );
    }
    const html = await this.ejsService.render(
      template,
      data,
      options?.ejsOptions ?? this.options.ejsOptions,
    );
    return this.generatePdfFromHtml(html, options);
  }

  async generatePdfFromEjsFile(
    file: string,
    data: Data = {},
    options?: PuppeteerParameters,
  ) {
    if (!this.ejsService) {
      throw new Error(
        'EJS service is not available. If the problem persists, open an issue in the repo.',
      );
    }
    const html = await this.ejsService.renderFile(
      file,
      data,
      options?.ejsOptions ?? this.options.ejsOptions,
    );
    return this.generatePdfFromHtml(html, options);
  }
}
