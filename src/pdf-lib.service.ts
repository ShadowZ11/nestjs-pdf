import { Injectable } from '@nestjs/common';
import { PuppeteerService } from './puppeteer/puppeteer.service';
import { PuppeteerParameters } from './puppeteer/puppeteer-parameters.interface';

@Injectable()
export class PdfLibService {
  constructor(private readonly puppeteerService: PuppeteerService) {}

  generatePdfFromHtml(html: string, options?: PuppeteerParameters) {
    return this.puppeteerService.generatePdfFromHtml(html, options);
  }

  generatePdfFromTemplateString(
    template: string,
    parameters: any = {},
    options?: PuppeteerParameters,
  ) {
    return this.puppeteerService.generatePdfFromTemplateString(
      template,
      parameters,
      options,
    );
  }

  generatePdfFromTemplateFile(
    file: string,
    parameters: any = {},
    options?: PuppeteerParameters,
  ) {
    return this.puppeteerService.generatePdfFromTemplateFile(
      file,
      parameters,
      options,
    );
  }
}
