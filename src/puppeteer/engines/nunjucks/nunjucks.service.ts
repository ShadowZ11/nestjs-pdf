import { relative } from 'node:path';

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

interface NunjucksScope {
  env: nunjucks.Environment;
  compiled: LruCache<nunjucks.Template>;
}

@Injectable()
export class NunjucksService {
  #nunjucks?: typeof nunjucks;
  /**
   * One environment, and its compiled string templates, per configuration.
   * Environments are private: the global `nunjucks.configure()` is never
   * touched, so concurrent renders with different options do not interfere.
   */
  readonly #scopes = new OptionsScopedCache<NunjucksScope>();
  /** For `renderFile` with `templateDirectory`. */
  readonly #confinedScopes = new OptionsScopedCache<
    NunjucksScope & { guard: TemplateDirectoryGuard }
  >();

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
      const { env, compiled } = this.#scope(engine, options);
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
        const { env, guard } = this.#confinedScope(
          engine,
          options,
          options.templateDirectory,
        );
        // The guard is shared by every render of the environment.
        return guard.track(() => {
          try {
            return env.render(relative(guard.baseDir, templatePath), data);
          } catch (error) {
            throw guard.refused ?? error;
          }
        });
      }
      return this.#scope(engine, options).env.render(filePath, data);
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

  /** Templates are looked up from `process.cwd()`, without restriction. */
  #scope(
    engine: typeof nunjucks,
    options: NunjucksOptions | undefined,
  ): NunjucksScope {
    return this.#scopes.get(this.#config(options, '.'), () =>
      this.#environment(engine, options, '.'),
    );
  }

  /** Every load (includes, extends, imports) must stay in `templateDirectory`. */
  #confinedScope(
    engine: typeof nunjucks,
    options: NunjucksOptions,
    templateDirectory: string,
  ) {
    return this.#confinedScopes.get(
      this.#config(options, templateDirectory),
      () => {
        const guard = new TemplateDirectoryGuard('Nunjucks', templateDirectory);
        return {
          ...this.#environment(engine, options, guard.baseDir, guard),
          guard,
        };
      },
    );
  }

  #config(
    options: NunjucksOptions | undefined,
    searchPath: string,
  ): EnvironmentConfig {
    return {
      searchPath,
      noCache: options?.noCache ?? true,
      watch: options?.watch ?? false,
      autoescape: options?.autoescape ?? true,
      throwOnUndefined: options?.throwOnUndefined ?? false,
      trimBlocks: options?.trimBlocks ?? true,
      lstripBlocks: options?.lstripBlocks ?? true,
    };
  }

  #environment(
    engine: typeof nunjucks,
    options: NunjucksOptions | undefined,
    searchPath: string,
    guard?: TemplateDirectoryGuard,
  ): NunjucksScope {
    const config = this.#config(options, searchPath);
    const { Environment, FileSystemLoader } = engine;
    const loader = new FileSystemLoader(config.searchPath, {
      noCache: config.noCache,
      watch: config.watch,
    });
    return {
      env: new Environment(guard ? new ConfinedLoader(loader, guard) : loader, {
        autoescape: config.autoescape,
        throwOnUndefined: config.throwOnUndefined,
        trimBlocks: config.trimBlocks,
        lstripBlocks: config.lstripBlocks,
      }),
      compiled: new LruCache<nunjucks.Template>(COMPILED_TEMPLATES_PER_SCOPE),
    };
  }
}
