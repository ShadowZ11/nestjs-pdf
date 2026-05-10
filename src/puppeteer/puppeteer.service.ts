import { Inject, Injectable, Logger } from '@nestjs/common';
import type { PuppeteerParameters } from './puppeteer-parameters.interface';
import { PDF_PARAMETERS } from './helpers/tokens';
import { BrowserService } from './browser.service';
import { mergePuppeteerParameters } from '../helpers/deepMergePdfparams';
import pLimit from 'p-limit';
import { HandlebarsService } from '@gboutte/nestjs-hbs';
import { PDFOptions } from 'puppeteer';

@Injectable()
export class PuppeteerService {
  constructor(
    private readonly hbsService: HandlebarsService,
    private readonly browserService: BrowserService,
    @Inject(PDF_PARAMETERS) private readonly options: PuppeteerParameters,
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

  async generatePdfFromTemplateString(
    template: string,
    parameters: any = {},
    options?: PuppeteerParameters,
  ) {
    const html = this.hbsService.render(template, parameters);
    return this.generatePdfFromHtml(html, options);
  }

  async generatePdfFromTemplateFile(
    file: string,
    parameters: any = {},
    options?: PuppeteerParameters,
  ) {
    const html = this.hbsService.renderFile(file, parameters);
    return this.generatePdfFromHtml(html, options);
  }
}
