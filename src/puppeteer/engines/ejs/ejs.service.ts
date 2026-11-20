import { Injectable } from '@nestjs/common';
import type ejs from 'ejs';
import type { Data, Options } from 'ejs';

import { TemplateRenderException } from '../../../exceptions';
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

  get #engine(): typeof ejs {
    return (this.#ejs ??= loadEngine<typeof ejs>('ejs', 'EJS'));
  }

  async render(template: string, data: Data = {}, options?: EjsOptions) {
    const engine = this.#engine;
    const { templateDirectory: _templateDirectory, ...ejsOptions } =
      options ?? {};
    try {
      return await engine.render(template, data, {
        async: true,
        ...ejsOptions,
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
    const { templateDirectory, ...ejsOptions } = options ?? {};
    const templatePath = resolveTemplatePath(
      'EJS',
      filePath,
      templateDirectory,
    );
    try {
      return await engine.renderFile(templatePath, data, {
        async: true,
        ...ejsOptions,
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
