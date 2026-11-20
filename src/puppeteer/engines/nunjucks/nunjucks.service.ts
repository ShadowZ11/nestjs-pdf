import { relative, resolve } from 'node:path';

import { Injectable } from '@nestjs/common';
import type nunjucks from 'nunjucks';
import type { ConfigureOptions } from 'nunjucks';

import {
  NestjsPdfException,
  TemplateRenderException,
} from '../../../exceptions';
import {
  COMPILED_TEMPLATES_PER_SCOPE,
  LruCache,
  OptionsScopedCache,
} from '../../../helpers/template-cache.helper';
import { resolveTemplatePath } from '../../../helpers/template-path.helper';
import { loadEngine } from '../../libs/loadEngine.utils';

export interface NunjucksOptions extends Partial<ConfigureOptions> {
  noCache?: boolean;
  watch?: boolean;
  throwOnUndefined?: boolean;
  trimBlocks?: boolean;
  lstripBlocks?: boolean;
  /**
   * Base directory (absolute, or relative to `process.cwd()`) for files passed to `renderFile`.
   * When set, the file (and its includes) is resolved from it and may not leave
   * it (symbolic links included). Recommended when the file name can come from
   * user input.
   */
  templateDirectory?: string;
}

/** What an environment depends on, defaults applied. */
interface EnvironmentConfig {
  /** Loader root; `.` is resolved from `process.cwd()` at each lookup. */
  searchPath: string;
  noCache: boolean;
  watch: boolean;
  autoescape: boolean;
  throwOnUndefined: boolean;
  trimBlocks: boolean;
  lstripBlocks: boolean;
}

@Injectable()
export class NunjucksService {
  #nunjucks?: typeof nunjucks;
  /**
   * One environment, and its compiled string templates, per configuration.
   * Environments are private: the global `nunjucks.configure()` is never
   * touched, so concurrent renders with different options do not interfere.
   */
  readonly #scopes = new OptionsScopedCache<{
    env: nunjucks.Environment;
    compiled: LruCache<nunjucks.Template>;
  }>();

  get #engine(): typeof nunjucks {
    return (this.#nunjucks ??= loadEngine<typeof nunjucks>(
      'nunjucks',
      'Nunjucks',
    ));
  }

  render(
    template: string,
    data: Record<string, unknown> = {},
    options?: NunjucksOptions,
  ) {
    const engine = this.#engine;
    try {
      const { env, compiled } = this.#scope(engine, options, '.');
      const nunjucksTemplate = compiled.getOrCreate(
        template,
        () => new engine.Template(template, env),
      );
      return nunjucksTemplate.render(data);
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
    const engine = this.#engine;
    try {
      if (options?.templateDirectory !== undefined) {
        const templatePath = resolveTemplatePath(
          'Nunjucks',
          filePath,
          options.templateDirectory,
        );
        const baseDir = resolve(process.cwd(), options.templateDirectory);
        return this.#scope(engine, options, baseDir).env.render(
          relative(baseDir, templatePath),
          data,
        );
      }
      return this.#scope(engine, options, '.').env.render(filePath, data);
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

  #scope(
    engine: typeof nunjucks,
    options: NunjucksOptions | undefined,
    searchPath: string,
  ) {
    const config: EnvironmentConfig = {
      searchPath,
      noCache: options?.noCache ?? true,
      watch: options?.watch ?? false,
      autoescape: options?.autoescape ?? true,
      throwOnUndefined: options?.throwOnUndefined ?? false,
      trimBlocks: options?.trimBlocks ?? true,
      lstripBlocks: options?.lstripBlocks ?? true,
    };
    return this.#scopes.get(config, () => {
      const { Environment, FileSystemLoader } = engine;
      return {
        env: new Environment(
          new FileSystemLoader(config.searchPath, {
            noCache: config.noCache,
            watch: config.watch,
          }),
          {
            autoescape: config.autoescape,
            throwOnUndefined: config.throwOnUndefined,
            trimBlocks: config.trimBlocks,
            lstripBlocks: config.lstripBlocks,
          },
        ),
        compiled: new LruCache(COMPILED_TEMPLATES_PER_SCOPE),
      };
    });
  }
}
