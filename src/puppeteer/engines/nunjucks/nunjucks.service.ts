import { Injectable } from '@nestjs/common';
import type nunjucks from 'nunjucks';
import type { ConfigureOptions } from 'nunjucks';

import { TemplateRenderException } from '../../../exceptions';
import { loadEngine } from '../../libs/loadEngine.utils';

export interface NunjucksOptions extends Partial<ConfigureOptions> {
  noCache?: boolean;
  watch?: boolean;
  throwOnUndefined?: boolean;
  trimBlocks?: boolean;
  lstripBlocks?: boolean;
}

@Injectable()
export class NunjucksService {
  #nunjucks?: typeof nunjucks;

  get #engine(): typeof nunjucks {
    if (!this.#nunjucks) {
      this.#nunjucks = loadEngine<typeof nunjucks>('nunjucks', 'Nunjucks');
      // Configure default Nunjucks environment
      this.#nunjucks.configure({
        noCache: true,
        trimBlocks: true,
        lstripBlocks: true,
      });
    }
    return this.#nunjucks;
  }

  render(
    template: string,
    data: Record<string, unknown> = {},
    options?: NunjucksOptions,
  ) {
    const nunjucks = this.#engine;
    try {
      if (options) {
        const configOptions: Record<string, unknown> = {
          noCache: options.noCache ?? true,
          watch: options.watch ?? false,
          throwOnUndefined: options.throwOnUndefined ?? false,
          trimBlocks: options.trimBlocks ?? true,
          lstripBlocks: options.lstripBlocks ?? true,
        };
        nunjucks.configure(configOptions as ConfigureOptions);
      }
      return nunjucks.renderString(template, data);
    } catch (error) {
      throw new TemplateRenderException(
        'Nunjucks',
        `Nunjucks rendering failed: ${String(error)}`,
        { cause: error },
      );
    }
  }

  renderFile(
    filePath: string,
    data: Record<string, unknown> = {},
    options?: NunjucksOptions,
  ) {
    const nunjucks = this.#engine;
    try {
      if (options) {
        const configOptions: Record<string, unknown> = {
          noCache: options.noCache ?? true,
          watch: options.watch ?? false,
          throwOnUndefined: options.throwOnUndefined ?? false,
          trimBlocks: options.trimBlocks ?? true,
          lstripBlocks: options.lstripBlocks ?? true,
        };
        nunjucks.configure(configOptions as ConfigureOptions);
      }
      return nunjucks.render(filePath, data);
    } catch (error) {
      throw new TemplateRenderException(
        'Nunjucks',
        `Nunjucks file rendering failed: ${String(error)}`,
        { cause: error },
      );
    }
  }
}
