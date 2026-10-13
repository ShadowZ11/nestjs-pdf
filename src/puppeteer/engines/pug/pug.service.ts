import { readFileSync } from 'node:fs';

import { Injectable } from '@nestjs/common';
import type pug from 'pug';
import type { LocalsObject, Options } from 'pug';

import {
  EngineNotAvailableException,
  TemplateRenderException,
} from '../../../exceptions';
import { loadEngine } from '../../libs/loadEngine.utils';

export type PugOptions = Options;

@Injectable()
export class PugService {
  #pug?: typeof pug;

  get #engine(): typeof pug {
    return (this.#pug ??= loadEngine<typeof pug>('pug', 'Pug'));
  }

  render(
    template: string,
    data: LocalsObject = {},
    options?: PugOptions,
  ): string {
    const engine = this.#engine;
    try {
      const compiledFn = engine.compile(template, {
        ...options,
      });
      return compiledFn(data);
    } catch (error) {
      throw new TemplateRenderException(
        'Pug',
        `Pug rendering failed: ${String(error)}`,
        { cause: error },
      );
    }
  }

  renderFile(
    filePath: string,
    data: LocalsObject = {},
    options?: PugOptions,
  ): string {
    try {
      const template = readFileSync(filePath, 'utf-8');
      return this.render(template, data, options);
    } catch (error) {
      if (error instanceof EngineNotAvailableException) {
        throw error;
      }
      throw new TemplateRenderException(
        'Pug',
        `Pug file rendering failed: ${String(error)}`,
        { cause: error },
      );
    }
  }
}
