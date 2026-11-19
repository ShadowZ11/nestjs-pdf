import { Injectable } from '@nestjs/common';
import type { Data } from 'ejs';
import type { LocalsObject } from 'pug';

import { addSignatureFieldUsingAnchor } from './helpers/signature.helper';
import {
  addWatermark,
  type WatermarkOptions,
} from './helpers/watermark.helper';
import { PuppeteerService } from './puppeteer/puppeteer.service';
import { PuppeteerParameters } from './puppeteer/puppeteer-parameters.interface';

@Injectable()
export class NestjsPdfService {
  readonly #puppeteerService: PuppeteerService;

  constructor(puppeteerService: PuppeteerService) {
    this.#puppeteerService = puppeteerService;
  }

  /**
   * Converts an HTML string to a PDF.
   * @param html HTML string to convert to PDF
   * @param options Merged over the module options for this call.
   */
  generatePdfFromHtml(html: string, options?: PuppeteerParameters) {
    return this.#puppeteerService.generatePdfFromHtml(html, options);
  }

  /** Renders a Handlebars template string, then converts it to a PDF. */
  generatePdfFromTemplateHbsString(
    template: string,
    parameters: any = {},
    options?: PuppeteerParameters,
  ) {
    return this.#puppeteerService.generatePdfFromTemplateHbsString(
      template,
      parameters,
      options,
    );
  }

  /**
   * Renders a Handlebars template file, then converts it to a PDF.
   * @param file Resolved from `hbsOptions.templateDirectory`, which is required.
   */
  generatePdfFromTemplateHbsFile(
    file: string,
    parameters: any = {},
    options?: PuppeteerParameters,
  ) {
    return this.#puppeteerService.generatePdfFromTemplateHbsFile(
      file,
      parameters,
      options,
    );
  }

  /** Converts an MJML template string to HTML, then to a PDF. */
  generatePdfFromMjmlString(template: string, options?: PuppeteerParameters) {
    return this.#puppeteerService.generatePdfFromMjmlString(template, options);
  }

  /**
   * Converts an MJML template file to HTML, then to a PDF.
   * @param file Resolved from `mjmlOptions.templateDirectory` when set, otherwise from `process.cwd()`.
   */
  generatePdfFromMjmlFile(file: string, options?: PuppeteerParameters) {
    return this.#puppeteerService.generatePdfFromMjmlFile(file, options);
  }

  /** Renders a EJS template string, then converts it to a PDF. */
  generatePdfFromEjsString(
    template: string,
    data: Data = {},
    options?: PuppeteerParameters,
  ) {
    return this.#puppeteerService.generatePdfFromEjsString(
      template,
      data,
      options,
    );
  }

  /**
   * Renders a EJS template file, then converts it to a PDF.
   * @param file Resolved from `ejsOptions.templateDirectory` when set, otherwise from `process.cwd()`.
   */
  generatePdfFromEjsFile(
    file: string,
    data: Data = {},
    options?: PuppeteerParameters,
  ) {
    return this.#puppeteerService.generatePdfFromEjsFile(file, data, options);
  }

  /** Renders a Pug template string, then converts it to a PDF. */
  generatePdfFromPugString(
    template: string,
    data: LocalsObject = {},
    options?: PuppeteerParameters,
  ) {
    return this.#puppeteerService.generatePdfFromPugString(
      template,
      data,
      options,
    );
  }

  /**
   * Renders a Pug template file, then converts it to a PDF.
   * @param file Resolved from `pugOptions.templateDirectory` when set, otherwise from `process.cwd()`.
   */
  generatePdfFromPugFile(
    file: string,
    data: LocalsObject = {},
    options?: PuppeteerParameters,
  ) {
    return this.#puppeteerService.generatePdfFromPugFile(file, data, options);
  }

  /** Renders a Nunjucks template string, then converts it to a PDF. */
  generatePdfFromNunjucksString(
    template: string,
    data: Record<string, unknown> = {},
    options?: PuppeteerParameters,
  ) {
    return this.#puppeteerService.generatePdfFromNunjucksString(
      template,
      data,
      options,
    );
  }

  /**
   * Renders a Nunjucks template file, then converts it to a PDF.
   * @param file Resolved from `nunjucksOptions.templateDirectory` when set, otherwise from `process.cwd()`.
   */
  generatePdfFromNunjucksFile(
    file: string,
    data: Record<string, unknown> = {},
    options?: PuppeteerParameters,
  ) {
    return this.#puppeteerService.generatePdfFromNunjucksFile(
      file,
      data,
      options,
    );
  }

  /** Renders a Eta template string, then converts it to a PDF. */
  generatePdfFromEtaString(
    template: string,
    data: Record<string, unknown> = {},
    options?: PuppeteerParameters,
  ) {
    return this.#puppeteerService.generatePdfFromEtaString(
      template,
      data,
      options,
    );
  }

  /**
   * Renders a Eta template file, then converts it to a PDF.
   * @param file Resolved from `etaOptions.templateDirectory` when set, otherwise from `process.cwd()`.
   */
  generatePdfFromEtaFile(
    file: string,
    data: Record<string, unknown> = {},
    options?: PuppeteerParameters,
  ) {
    return this.#puppeteerService.generatePdfFromEtaFile(file, data, options);
  }

  /** Renders a Mustache template string, then converts it to a PDF. */
  generatePdfFromMustacheString(
    template: string,
    data: Record<string, unknown> = {},
    options?: PuppeteerParameters,
  ) {
    return this.#puppeteerService.generatePdfFromMustacheString(
      template,
      data,
      options,
    );
  }

  /**
   * Renders a Mustache template file, then converts it to a PDF.
   * @param file Resolved from `mustacheOptions.templateDirectory` when set, otherwise from `process.cwd()`.
   */
  generatePdfFromMustacheFile(
    file: string,
    data: Record<string, unknown> = {},
    options?: PuppeteerParameters,
  ) {
    return this.#puppeteerService.generatePdfFromMustacheFile(
      file,
      data,
      options,
    );
  }

  /** Renders a Liquid template string, then converts it to a PDF. */
  generatePdfFromLiquidString(
    template: string,
    data: Record<string, unknown> = {},
    options?: PuppeteerParameters,
  ) {
    return this.#puppeteerService.generatePdfFromLiquidString(
      template,
      data,
      options,
    );
  }

  /**
   * Renders a Liquid template file, then converts it to a PDF.
   * @param file Resolved from `liquidOptions.templateDirectory` when set, otherwise from `process.cwd()`.
   */
  generatePdfFromLiquidFile(
    file: string,
    data: Record<string, unknown> = {},
    options?: PuppeteerParameters,
  ) {
    return this.#puppeteerService.generatePdfFromLiquidFile(
      file,
      data,
      options,
    );
  }

  /**
   * Adds an empty signature field to an existing PDF, centered on the first
   * occurrence of `anchorText`, or at the bottom center of the last page when
   * the anchor is not found.
   */
  async addSignatureFieldSignatureDebtorRaw(
    pdf: Uint8Array | Buffer,
    fieldName: string = 'SignatureDebtor',
    anchorText: string = '__SIG_DEBTOR_ANCHOR__',
  ) {
    return await addSignatureFieldUsingAnchor(pdf, fieldName, anchorText);
  }

  /**
   * Stamps a text or image watermark on an existing PDF. To watermark while
   * generating, pass the same options as `watermark` instead.
   *
   * Text only supports WinAnsi characters (PDF standard fonts); use an `image`
   * for anything else.
   * @throws WatermarkException when the options are invalid or the PDF cannot be processed
   */
  async addWatermark(pdf: Uint8Array | Buffer, options: WatermarkOptions) {
    return await addWatermark(pdf, options);
  }
}
