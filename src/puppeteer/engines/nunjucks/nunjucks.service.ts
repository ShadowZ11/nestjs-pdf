import { relative } from 'node:path';

import { Injectable } from '@nestjs/common';
import type nunjucks from 'nunjucks';
import type { ConfigureOptions } from 'nunjucks';

import {
  NestjsPdfException,
  TemplateRenderException,
} from '../../../exceptions';
import {
  resolveTemplatePath,
  TemplateDirectoryGuard,
} from '../../../helpers/template-path.helper';
import { loadEngine } from '../../libs/loadEngine.utils';
import { ConfinedLoader } from './confined-loader';

export interface NunjucksOptions extends Partial<ConfigureOptions> {
  noCache?: boolean;
  watch?: boolean;
  throwOnUndefined?: boolean;
  trimBlocks?: boolean;
  lstripBlocks?: boolean;
  /**
   * Base directory (absolute, or relative to `process.cwd()`) for files passed to `renderFile`.
   * When set, the file is resolved from it and neither it nor its includes,
   * extends and imports may leave it (symbolic links included). Recommended when the file name can come from
   * user input.
   */
  templateDirectory?: string;
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
      if (options?.templateDirectory !== undefined) {
        const templatePath = resolveTemplatePath(
          'Nunjucks',
          filePath,
          options.templateDirectory,
        );
        const guard = new TemplateDirectoryGuard(
          'Nunjucks',
          options.templateDirectory,
        );
        const env = new nunjucks.Environment(
          new ConfinedLoader(
            new nunjucks.FileSystemLoader(guard.baseDir, {
              noCache: options.noCache ?? true,
              watch: options.watch ?? false,
            }),
            guard,
          ),
          {
            autoescape: options.autoescape ?? true,
            throwOnUndefined: options.throwOnUndefined ?? false,
            trimBlocks: options.trimBlocks ?? true,
            lstripBlocks: options.lstripBlocks ?? true,
          },
        );
        try {
          return env.render(relative(guard.baseDir, templatePath), data);
        } catch (error) {
          throw guard.refused ?? error;
        }
      }
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
      if (error instanceof NestjsPdfException) {
        throw error;
      }
      throw new TemplateRenderException(
        'Nunjucks',
        `Nunjucks file rendering failed: ${String(error)}`,
        { cause: error },
      );
    }
  }
}
