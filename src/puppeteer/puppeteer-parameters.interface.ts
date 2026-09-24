import { type Browser } from '@puppeteer/browsers';
import { type MJMLParsingOptions } from 'mjml-core';
import { type PDFOptions } from 'puppeteer';

import { type WatermarkOptions } from '../helpers/watermark.helper';
import { type PdfSecurityOptions } from '../helpers/request-guard.helper';
import { type BrowserTag } from './browser/browser.service';
import { type EjsOptions } from './engines/ejs/ejs.service';
import { type EtaOptions } from './engines/eta/eta.service';
import { type HandlebarsOptions } from './engines/handlebars/handlebars.service';
import { type MustacheOptions } from './engines/mustache/mustache.service';
import { type NunjucksOptions } from './engines/nunjucks/nunjucks.service';
import { type PugOptions } from './engines/pug/pug.service';

export interface PuppeteerParameters {
  pdfOptions?: PDFOptions;
  /**
   * Cancels the generation when aborted, including while it waits for a free slot.
   * The promise rejects with `signal.reason`; use `AbortSignal.timeout(ms)` for a timeout.
   */
  signal?: AbortSignal;
  /** Watermark stamped on the generated PDF. */
  watermark?: WatermarkOptions;
  security?: PdfSecurityOptions;
  hbsOptions?: HandlebarsOptions;
  mjmlOptions?: MJMLParsingOptions;
  pugOptions?: PugOptions;
  ejsOptions?: EjsOptions;
  nunjucksOptions?: NunjucksOptions;
  etaOptions?: EtaOptions;
  mustacheOptions?: MustacheOptions;
  chromiumRevision?: string;
  buildId?: string;
  headless?: boolean | 'shell';
  browser?: Browser;
  browserTag?: BrowserTag;
  useLockedBrowser?: boolean;
  browserInstallBaseUrl?: string;
  extraPuppeteerArgs?: Array<string>;
  executablePath?: string;
  cleanupBrowserCacheOnExit?: boolean;
}
