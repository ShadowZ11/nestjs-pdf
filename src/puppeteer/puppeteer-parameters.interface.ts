import { HandlebarsOptions } from '@gboutte/nestjs-hbs/dist/handlebars-options.interface';
import { Browser } from '@puppeteer/browsers';
import { PDFOptions } from 'puppeteer';
import { BrowserTag } from './browser.service';
import { MJMLParsingOptions } from 'mjml-core';
import { EjsOptions } from './services/ejs.service';

export interface PuppeteerParameters {
  pdfOptions?: PDFOptions;
  hbsOptions?: HandlebarsOptions;
  mjmlOptions?: MJMLParsingOptions;
  ejsOptions?: EjsOptions;
  chromiumRevision?: string;
  buildId?: string;
  headless?: boolean | 'shell';
  browser?: Browser;
  browserTag?: BrowserTag;
  useLockedBrowser?: boolean;
  browserInstallBaseUrl?: string;
  extraPuppeteerArgs?: string[];
  cleanupBrowserCacheOnExit?: boolean;
}
