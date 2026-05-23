import { Injectable } from '@nestjs/common';
import mjml from 'mjml';
import { readFileSync } from 'node:fs';
import { MJMLParsingOptions } from 'mjml-core';

@Injectable()
export class MjmlService {
  async render(
    template: string,
    options?: MJMLParsingOptions,
  ): Promise<string> {
    const { html } = await mjml(template, options);
    return html;
  }

  async renderFile(
    filePath: string,
    options?: MJMLParsingOptions,
  ): Promise<string> {
    const template = readFileSync(filePath, 'utf-8');
    return await this.render(template, options);
  }
}
