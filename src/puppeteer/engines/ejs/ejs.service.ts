import { Injectable } from '@nestjs/common';
import type ejs from 'ejs';
import type { Data, IncluderCallback, Options } from 'ejs';

import { TemplateRenderException } from '../../../exceptions';
import {
  resolveTemplatePath,
  TemplateDirectoryGuard,
} from '../../../helpers/template-path.helper';
import { loadEngine } from '../../libs/loadEngine.utils';

export interface EjsOptions extends Omit<Options, 'async'> {
  async?: boolean;
  /**
   * Base directory (absolute, or relative to `process.cwd()`) for files passed to `renderFile`.
   * When set, the file is resolved from it and neither it nor its includes may
   * leave it (symbolic links included). Recommended when the file name can come
   * from user input.
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
    const guard =
      templateDirectory === undefined
        ? undefined
        : new TemplateDirectoryGuard('EJS', templateDirectory);
    try {
      return await engine.renderFile(templatePath, data, {
        async: true,
        ...ejsOptions,
        ...(guard && {
          includer: this.#confinedIncluder(guard, ejsOptions.includer),
        }),
      });
    } catch (error) {
      if (guard?.refused) {
        throw guard.refused;
      }
      throw new TemplateRenderException(
        'EJS',
        `EJS file rendering failed: ${String(error)}`,
        { cause: error },
      );
    }
  }

  /**
   * EJS calls `includer` for every include, with the path it resolved (from
   * the including file, `root` or `views`). Each file it is about to read must
   * stay inside `templateDirectory`; a template returned by the caller's own
   * `includer` is not read from disk.
   */
  #confinedIncluder(
    guard: TemplateDirectoryGuard,
    includer: IncluderCallback | undefined,
  ): IncluderCallback {
    return (originalPath, parsedPath) => {
      const result = includer?.(originalPath, parsedPath);
      if (typeof result?.template === 'string') {
        return result;
      }
      const filename = result?.filename ?? parsedPath;
      if (!filename) {
        throw new Error(`Could not find the include file "${originalPath}"`);
      }
      return { filename: guard.check(filename) };
    };
  }
}
