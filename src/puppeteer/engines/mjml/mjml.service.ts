import { readFileSync } from 'node:fs';

import { Injectable } from '@nestjs/common';
import mjml from 'mjml';
import { type MJMLParsingOptions } from 'mjml-core';

import { TemplateRenderException } from '../../../exceptions';

@Injectable()
export class MjmlService {
  async render(
    template: string,
    options?: MJMLParsingOptions,
  ): Promise<string> {
    try {
      const { html } = await mjml(template, options);
      return html;
    } catch (error) {
      throw new TemplateRenderException(
        'MJML',
        `MJML rendering failed: ${String(error)}`,
        { cause: error },
      );
    }
  }

  async renderFile(
    filePath: string,
    options?: MJMLParsingOptions,
  ): Promise<string> {
    let template: string;
    try {
      template = readFileSync(filePath, 'utf-8');
    } catch (error) {
      throw new TemplateRenderException(
        'MJML',
        `MJML file rendering failed: ${String(error)}`,
        { cause: error },
      );
    }
    return await this.render(template, options);
  }
}
