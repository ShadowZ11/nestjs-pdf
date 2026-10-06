import { readFileSync } from 'node:fs';

import { Injectable } from '@nestjs/common';
import type mjml from 'mjml';
import type { MJMLParsingOptions } from 'mjml-core';

import { TemplateRenderException } from '../../../exceptions';
import { loadEngine } from '../../libs/loadEngine.utils';

@Injectable()
export class MjmlService {
  #mjml?: typeof mjml;

  get #engine(): typeof mjml {
    return (this.#mjml ??= loadEngine<typeof mjml>('mjml', 'MJML'));
  }

  async render(
    template: string,
    options?: MJMLParsingOptions,
  ): Promise<string> {
    const engine = this.#engine;
    try {
      const { html } = await engine(template, options);
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
