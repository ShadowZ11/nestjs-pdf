import { type MJMLParsingOptions } from 'mjml-core';

import { type PdfSecurityOptions } from '../helpers/request-guard.helper';
import { type WatermarkOptions } from '../helpers/watermark.helper';
import {
  type PdfBrowser,
  type PdfOptions,
} from '../renderers/pdf-options.interface';
import {
  type Api2PdfRenderOptions,
  type GotenbergRenderOptions,
  type PdfProviderOptions,
} from '../renderers/pdf-provider.interface';
import { type BrowserTag } from './browser/browser.service';
import { type EjsOptions } from './engines/ejs/ejs.service';
import { type EtaOptions } from './engines/eta/eta.service';
import { type HandlebarsOptions } from './engines/handlebars/handlebars.service';
import { type LiquidOptions } from './engines/liquid/liquid.service';
import { type MustacheOptions } from './engines/mustache/mustache.service';
import { type NunjucksOptions } from './engines/nunjucks/nunjucks.service';
import { type PugOptions } from './engines/pug/pug.service';

export interface PuppeteerParameters {
  /**
   * Who prints the PDF: a local Chromium (`puppeteer`, default), a Gotenberg
   * server or the Api2Pdf API. Module-level only: ignored in per-call options.
   */
  provider?: PdfProviderOptions;
  /**
   * Page options. Remote providers translate the size, margins, orientation,
   * backgrounds, scale, page ranges and header/footer templates.
   */
  pdfOptions?: PdfOptions;
  /** Options only read by the Gotenberg provider. */
  gotenbergOptions?: GotenbergRenderOptions;
  /** Options only read by the Api2Pdf provider. */
  api2pdfOptions?: Api2PdfRenderOptions;
  /**
   * Cancels the generation when aborted, including while it waits for a free slot.
   * The promise rejects with `signal.reason`; use `AbortSignal.timeout(ms)` for a timeout.
   */
  signal?: AbortSignal;
  /** Watermark stamped on the generated PDF. */
  watermark?: WatermarkOptions;
  /** Request filter (SSRF protection). Puppeteer provider only. */
  security?: PdfSecurityOptions;
  hbsOptions?: HandlebarsOptions;
  mjmlOptions?: MJMLParsingOptions;
  pugOptions?: PugOptions;
  ejsOptions?: EjsOptions;
  nunjucksOptions?: NunjucksOptions;
  etaOptions?: EtaOptions;
  mustacheOptions?: MustacheOptions;
  liquidOptions?: LiquidOptions;
  chromiumRevision?: string;
  buildId?: string;
  headless?: boolean | 'shell';
  /** Browser to install. Accepts the `Browser` enum of `@puppeteer/browsers`. */
  browser?: PdfBrowser;
  browserTag?: BrowserTag;
  useLockedBrowser?: boolean;
  browserInstallBaseUrl?: string;
  extraPuppeteerArgs?: Array<string>;
  executablePath?: string;
  cleanupBrowserCacheOnExit?: boolean;
}
