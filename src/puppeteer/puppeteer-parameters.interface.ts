import { HandlebarsOptions } from '@gboutte/nestjs-hbs/dist/handlebars-options.interface';
import { Browser } from '@puppeteer/browsers';
import { PDFOptions } from 'puppeteer';
import { BrowserTag } from './browser/browser.service';
import { MJMLParsingOptions } from 'mjml-core';
import { PugOptions } from './engines/pug/pug.service';
import { EjsOptions } from './engines/ejs/ejs.service';
import { NunjucksOptions } from './engines/nunjucks/nunjucks.service';
import { MustacheOptions } from './engines/mustache/mustache.service';

export interface PuppeteerParameters {
  pdfOptions?: PDFOptions;
  //'hbsOptions' has to be used in the module initialization
  hbsOptions?: HandlebarsOptions;
  mjmlOptions?: MJMLParsingOptions;
  pugOptions?: PugOptions;
  ejsOptions?: EjsOptions;
  nunjucksOptions?: NunjucksOptions;
  mustacheOptions?: MustacheOptions;
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
