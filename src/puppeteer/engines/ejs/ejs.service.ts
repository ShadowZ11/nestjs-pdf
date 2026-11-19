import { readFile } from 'node:fs/promises';

import { Injectable } from '@nestjs/common';
import type ejs from 'ejs';
import type { Data, Options } from 'ejs';

import { TemplateRenderException } from '../../../exceptions';
import {
  COMPILED_TEMPLATES_PER_SCOPE,
  LruCache,
  OptionsScopedCache,
} from '../../../helpers/template-cache.helper';
import { resolveTemplatePath } from '../../../helpers/template-path.helper';
import { loadEngine } from '../../libs/loadEngine.utils';

export interface EjsOptions extends Omit<Options, 'async'> {
  async?: boolean;
  /**
   * Base directory (absolute, or relative to `process.cwd()`) for files passed to `renderFile`.
   * When set, the file is resolved from it and may not leave it (symbolic links
   * included). Recommended when the file name can come from user input.
   */
  templateDirectory?: string;
}

@Injectable()
export class EjsService {
  #ejs?: typeof ejs;
  readonly #scopes = new OptionsScopedCache<
    LruCache<(data: Data) => string | Promise<string>>
  >();

  get #engine(): typeof ejs {
    return (this.#ejs ??= loadEngine<typeof ejs>('ejs', 'EJS'));
  }

  async render(template: string, data: Data = {}, options?: EjsOptions) {
    const engine = this.#engine;
    const { templateDirectory: _templateDirectory, ...ejsOptions } =
      options ?? {};
    try {
      return await this.#compile(engine, template, options, ejsOptions)(data);
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
    const { templateDirectory, ...ejsOptions } = options ?? {};
    const templatePath = resolveTemplatePath(
      'EJS',
      filePath,
      templateDirectory,
    );
    try {
      // Read on every call (cheap), compiled once per content: an edited file
      // is picked up. `filename` resolves includes relative to the file.
      const template = await readFile(templatePath, 'utf8');
      return await this.#compile(
        engine,
        template,
        options,
        ejsOptions,
        templatePath,
      )(data);
    } catch (error) {
      throw new TemplateRenderException(
        'EJS',
        `EJS file rendering failed: ${String(error)}`,
        { cause: error },
      );
    }
  }

  #compile(
    engine: typeof ejs,
    template: string,
    /** The caller's object, not the stripped copy: compared by reference when it holds functions. */
    scope: EjsOptions | undefined,
    options: Omit<EjsOptions, 'templateDirectory'>,
    filename?: string,
  ): (data: Data) => string | Promise<string> {
    return this.#scopes
      .get(scope, () => new LruCache(COMPILED_TEMPLATES_PER_SCOPE))
      .getOrCreate(`${filename ?? ''}\0${template}`, () =>
        engine.compile(template, {
          async: true,
          ...options,
          ...(filename === undefined ? {} : { filename }),
        }),
      );
  }
}
