import { Injectable } from '@nestjs/common';
import { PuppeteerService } from './puppeteer/puppeteer.service';
import { PuppeteerParameters } from './puppeteer/puppeteer-parameters.interface';
import { addSignatureFieldUsingAnchor } from './helpers/signature.helper';
import { LocalsObject } from 'pug';
import { Data } from 'ejs';

@Injectable()
export class NestjsPdfService {
  constructor(private readonly puppeteerService: PuppeteerService) {}

  /**
   * @param html HTML string to convert to PDF
   * @param options PDF generation options (optional)
   * @returns PDF generated from the provided HTML
   * @description This method uses the Puppeteer service to generate a PDF from an HTML string. Generation options can be customized by passing a `PuppeteerParameters` object as the second argument. This allows you to control various aspects of PDF rendering, such as page size, margins, background display, etc. If no options are provided, the default parameters defined in the Puppeteer service will be used.
   */
  generatePdfFromHtml(html: string, options?: PuppeteerParameters) {
    return this.puppeteerService.generatePdfFromHtml(html, options);
  }

  /**
   * @deprecated Use the new method generatePdfFromTemplateHbsString
   * @param template Handlebars template string
   * @param parameters Data parameters to inject into the template
   * @param options PDF generation options (optional)
   * @returns PDF generated from the provided Handlebars template with parameters applied
   * @description This method generates a PDF from a Handlebars template provided as a string. The parameters to inject into the template are passed in the `parameters` object, which is used to render the template before converting it to PDF. PDF generation options can also be customized by passing a `PuppeteerParameters` object as the third argument. This allows you to control various aspects of PDF rendering, such as page size, margins, background display, etc. If no options are provided, the default parameters defined in the Puppeteer service will be used.
   */
  generatePdfFromTemplateString(
    template: string,
    parameters: any = {},
    options?: PuppeteerParameters,
  ) {
    return this.generatePdfFromTemplateHbsString(template, parameters, options);
  }

  /**
   * @deprecated Use the new method generatePdfFromTemplateHbsFile
   * @param file Path to the Handlebars template file
   * @param parameters Data parameters to inject into the template
   * @param options PDF generation options (optional)
   * @returns PDF generated from the Handlebars template at the provided file path with parameters applied
   * @description This method generates a PDF from a Handlebars template located at the specified file path. The file path is passed as a string in the `file` parameter. The parameters to inject into the template are passed in the `parameters` object, which is used to render the template before converting it to PDF. PDF generation options can also be customized by passing a `PuppeteerParameters` object as the third argument. This allows you to control various aspects of PDF rendering, such as page size, margins, background display, etc. If no options are provided, the default parameters defined in the Puppeteer service will be used.
   */
  generatePdfFromTemplateFile(
    file: string,
    parameters: any = {},
    options?: PuppeteerParameters,
  ) {
    return this.generatePdfFromTemplateHbsFile(file, parameters, options);
  }

  /**
   * @param template Handlebars template string
   * @param parameters Data parameters to inject into the template
   * @param options PDF generation options (optional)
   * @returns PDF generated from the provided Handlebars template with parameters applied
   * @description This method generates a PDF from a Handlebars template provided as a string. The parameters to inject into the template are passed in the `parameters` object, which is used to render the template before converting it to PDF. PDF generation options can also be customized by passing a `PuppeteerParameters` object as the third argument. This allows you to control various aspects of PDF rendering, such as page size, margins, background display, etc. If no options are provided, the default parameters defined in the Puppeteer service will be used.
   */
  generatePdfFromTemplateHbsString(
    template: string,
    parameters: any = {},
    options?: PuppeteerParameters,
  ) {
    return this.puppeteerService.generatePdfFromTemplateHbsString(
      template,
      parameters,
      options,
    );
  }

  /**
   * @param file Path to the Handlebars template file
   * @param parameters Data parameters to inject into the template
   * @param options PDF generation options (optional)
   * @returns PDF generated from the Handlebars template at the provided file path with parameters applied
   * @description This method generates a PDF from a Handlebars template located at the specified file path. The file path is passed as a string in the `file` parameter. The parameters to inject into the template are passed in the `parameters` object, which is used to render the template before converting it to PDF. PDF generation options can also be customized by passing a `PuppeteerParameters` object as the third argument. This allows you to control various aspects of PDF rendering, such as page size, margins, background display, etc. If no options are provided, the default parameters defined in the Puppeteer service will be used.
   */
  generatePdfFromTemplateHbsFile(
    file: string,
    parameters: any = {},
    options?: PuppeteerParameters,
  ) {
    return this.puppeteerService.generatePdfFromTemplateHbsFile(
      file,
      parameters,
      options,
    );
  }

  /**
   * @param template MJML template string
   * @param options PDF generation options (optional)
   * @returns PDF generated from the provided MJML template
   * @description This method generates a PDF from an MJML template provided as a string. MJML (MJML Markup Language) is a markup language designed to reduce the pain of coding a responsive email. The template is first rendered to HTML using the MJML renderer, then converted to PDF. PDF generation options can be customized by passing a `PuppeteerParameters` object as the second argument.
   */
  generatePdfFromMjmlString(template: string, options?: PuppeteerParameters) {
    return this.puppeteerService.generatePdfFromMjmlString(template, options);
  }

  /**
   * @param file Path to the MJML template file
   * @param options PDF generation options (optional)
   * @returns PDF generated from the MJML template at the provided file path
   * @description This method generates a PDF from an MJML template located at the specified file path. The file path is passed as a string in the `file` parameter. The template is first rendered to HTML using the MJML renderer, then converted to PDF. PDF generation options can be customized by passing a `PuppeteerParameters` object as the second argument.
   */
  generatePdfFromMjmlFile(file: string, options?: PuppeteerParameters) {
    return this.puppeteerService.generatePdfFromMjmlFile(file, options);
  }

  /**
   * @param template EJS template string
   * @param data Data to inject into the template
   * @param options PDF generation options (optional)
   * @returns PDF generated from the provided EJS template with data applied
   * @description This method generates a PDF from an EJS (Embedded JavaScript) template provided as a string. EJS is a templating language with a simple, straightforward syntax. The data to inject into the template is passed in the `data` object, which is used to render the template before converting it to PDF. PDF generation options can be customized by passing a `PuppeteerParameters` object as the third argument.
   */
  generatePdfFromEjsString(
    template: string,
    data: Data = {},
    options?: PuppeteerParameters,
  ) {
    return this.puppeteerService.generatePdfFromEjsString(
      template,
      data,
      options,
    );
  }

  /**
   * @param file Path to the EJS template file
   * @param data Data to inject into the template
   * @param options PDF generation options (optional)
   * @returns PDF generated from the EJS template at the provided file path with data applied
   * @description This method generates a PDF from an EJS template located at the specified file path. The file path is passed as a string in the `file` parameter. The data to inject into the template is passed in the `data` object, which is used to render the template before converting it to PDF. PDF generation options can be customized by passing a `PuppeteerParameters` object as the third argument.
   */
  generatePdfFromEjsFile(
    file: string,
    data: Data = {},
    options?: PuppeteerParameters,
  ) {
    return this.puppeteerService.generatePdfFromEjsFile(file, data, options);
  }

  /**
   * @param template Pug template string
   * @param data Data to inject into the template
   * @param options PDF generation options (optional)
   * @returns PDF generated from the provided Pug template with data applied
   * @description This method generates a PDF from a Pug template provided as a string. Pug is a clean, whitespace-sensitive syntax for writing HTML. The data to inject into the template is passed in the `data` object, which is used to render the template before converting it to PDF. PDF generation options can be customized by passing a `PuppeteerParameters` object as the third argument.
   */
  generatePdfFromPugString(
    template: string,
    data: LocalsObject = {},
    options?: PuppeteerParameters,
  ) {
    return this.puppeteerService.generatePdfFromPugString(
      template,
      data,
      options,
    );
  }

  /**
   * @param file Path to the Pug template file
   * @param data Data to inject into the template
   * @param options PDF generation options (optional)
   * @returns PDF generated from the Pug template at the provided file path with data applied
   * @description This method generates a PDF from a Pug template located at the specified file path. The file path is passed as a string in the `file` parameter. The data to inject into the template is passed in the `data` object, which is used to render the template before converting it to PDF. PDF generation options can be customized by passing a `PuppeteerParameters` object as the third argument.
   */
  generatePdfFromPugFile(
    file: string,
    data: LocalsObject = {},
    options?: PuppeteerParameters,
  ) {
    return this.puppeteerService.generatePdfFromPugFile(file, data, options);
  }

  /**
   * @param template Nunjucks template string
   * @param data Data to inject into the template
   * @param options PDF generation options (optional)
   * @returns PDF generated from the provided Nunjucks template with data applied
   * @description This method generates a PDF from a Nunjucks template provided as a string. Nunjucks is a powerful templating language with support for inheritance, macros, and filters. The data to inject into the template is passed in the `data` object, which is used to render the template before converting it to PDF. PDF generation options can be customized by passing a `PuppeteerParameters` object as the third argument.
   */
  generatePdfFromNunjucksString(
    template: string,
    data: Record<string, unknown> = {},
    options?: PuppeteerParameters,
  ) {
    return this.puppeteerService.generatePdfFromNunjucksString(
      template,
      data,
      options,
    );
  }

  /**
   * @param file Path to the Nunjucks template file
   * @param data Data to inject into the template
   * @param options PDF generation options (optional)
   * @returns PDF generated from the Nunjucks template at the provided file path with data applied
   * @description This method generates a PDF from a Nunjucks template located at the specified file path. The file path is passed as a string in the `file` parameter. The data to inject into the template is passed in the `data` object, which is used to render the template before converting it to PDF. PDF generation options can be customized by passing a `PuppeteerParameters` object as the third argument.
   */
  generatePdfFromNunjucksFile(
    file: string,
    data: Record<string, unknown> = {},
    options?: PuppeteerParameters,
  ) {
    return this.puppeteerService.generatePdfFromNunjucksFile(
      file,
      data,
      options,
    );
  }

  /**
   * @param pdf The PDF bytes to modify
   * @param fieldName The name of the signature field to add (default: 'SignatureDebtor')
   * @param anchorText The text anchor to locate the signature field position (default: '__SIG_DEBTOR_ANCHOR__')
   * @returns Modified PDF with a signature field added at the anchor position
   * @description This method adds a signature field to a PDF using a text anchor as a reference for the field position. It uses the `addSignatureFieldUsingAnchor` function which finds the anchor in the PDF and inserts a signature field at that location. The signature field is named according to the `fieldName` parameter and the anchor is defined by `anchorText`.
   *
   * Usage example:
   * ```typescript
   * const modifiedPdf = await pdfService.addSignatureFieldSignatureDebtorRaw(
   *   originalPdfBytes,
   *   'SignatureDebtor',
   *   '__SIG_DEBTOR_ANCHOR__'
   * );
   * ```
   *
   * In this example, `originalPdfBytes` is a byte array representing the original PDF, `SignatureDebtor` is the name of the signature field to add, and `__SIG_DEBTOR_ANCHOR__` is the anchor text used to position the signature field in the PDF.
   *
   * If the anchor is not found, the signature field will be added at a default position (centered at the bottom of the last page).
   *
   * Note: Ensure that the input PDF contains the anchor defined by `anchorText` for the signature field to be positioned correctly. Otherwise, it will be added at a default position.
   */
  async addSignatureFieldSignatureDebtorRaw(
    pdf: Uint8Array | Buffer,
    fieldName: string = 'SignatureDebtor',
    anchorText: string = '__SIG_DEBTOR_ANCHOR__',
  ) {
    return await addSignatureFieldUsingAnchor(pdf, fieldName, anchorText);
  }
}
