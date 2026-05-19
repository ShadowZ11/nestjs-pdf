import { HandlebarsOptions } from '@gboutte/nestjs-hbs/dist/handlebars-options.interface';
import { Browser } from '@puppeteer/browsers';
import { PDFOptions } from 'puppeteer';
import { BrowserTag } from './browser.service';
import { MJMLParsingOptions } from 'mjml-core';
import { PugOptions } from './services/pug.service';
import { EjsOptions } from './services/ejs.service';
import { NunjucksOptions } from './services/nunjucks.service';

export interface PuppeteerParameters {
  pdfOptions?: PDFOptions;
  hbsOptions?: HandlebarsOptions;
  mjmlOptions?: MJMLParsingOptions;
  pugOptions?: PugOptions;
  ejsOptions?: EjsOptions;
  nunjucksOptions?: NunjucksOptions;
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
