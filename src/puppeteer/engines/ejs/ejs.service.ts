import { Injectable } from '@nestjs/common';
import type ejs from 'ejs';
import type { Data, Options } from 'ejs';

import { TemplateRenderException } from '../../../exceptions';
import { loadEngine } from '../../libs/loadEngine.utils';

export interface EjsOptions extends Omit<Options, 'async'> {
  async?: boolean;
}

@Injectable()
export class EjsService {
  #ejs?: typeof ejs;

  get #engine(): typeof ejs {
    return (this.#ejs ??= loadEngine<typeof ejs>('ejs', 'EJS'));
  }

  async render(template: string, data: Data = {}, options?: EjsOptions) {
    const engine = this.#engine;
    try {
      return await engine.render(template, data, {
        async: true,
        ...options,
      });
    } catch (error) {
      throw new TemplateRenderException(
        'EJS',
        `EJS rendering failed: ${String(error)}`,
        { cause: error },
      );
    }
  }

  async renderFile(filePath: string, data: Data = {}, options?: EjsOptions) {
    const engine = this.#engine;
    try {
      return await engine.renderFile(filePath, data, {
        async: true,
        ...options,
      });
    } catch (error) {
      throw new TemplateRenderException(
        'EJS',
        `EJS file rendering failed: ${String(error)}`,
        { cause: error },
      );
    }
  }
}
