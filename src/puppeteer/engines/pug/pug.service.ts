import { readFileSync } from 'node:fs';

import { Injectable } from '@nestjs/common';
import type pug from 'pug';
import type { LocalsObject, Options } from 'pug';

import {
  EngineNotAvailableException,
  TemplateRenderException,
} from '../../../exceptions';
import {
  COMPILED_TEMPLATES_PER_SCOPE,
  LruCache,
  OptionsScopedCache,
} from '../../../helpers/template-cache.helper';
import { resolveTemplatePath } from '../../../helpers/template-path.helper';
import { loadEngine } from '../../libs/loadEngine.utils';

export interface PugOptions extends Options {
  /**
   * Base directory (absolute, or relative to `process.cwd()`) for files passed to `renderFile`.
   * When set, the file is resolved from it and may not leave it (symbolic links
   * included). Recommended when the file name can come from user input.
   */
  templateDirectory?: string;
}

@Injectable()
export class PugService {
  #pug?: typeof pug;
  readonly #scopes = new OptionsScopedCache<LruCache<pug.compileTemplate>>();

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
      const { templateDirectory: _templateDirectory, ...pugOptions } =
        options ?? {};
      // The caller's object, not the stripped copy: compared by reference when it holds functions.
      const compiledFn = this.#scopes
        .get(options, () => new LruCache(COMPILED_TEMPLATES_PER_SCOPE))
        .getOrCreate(template, () => engine.compile(template, pugOptions));
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
    const templatePath = resolveTemplatePath(
      'Pug',
      filePath,
      options?.templateDirectory,
    );
    try {
      const template = readFileSync(templatePath, 'utf-8');
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
