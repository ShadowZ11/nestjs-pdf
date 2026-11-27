import { readFileSync } from 'node:fs';

import { Injectable } from '@nestjs/common';
import type pug from 'pug';
import type { LocalsObject, Options } from 'pug';

import {
  EngineNotAvailableException,
  TemplateConfigurationException,
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
import { confineReads, type PugPlugin } from './confined-read.plugin';

export interface PugOptions extends Options {
  /** Pug plugins (not declared by `@types/pug`). */
  plugins?: Array<PugPlugin>;
  /**
   * Base directory (absolute, or relative to `process.cwd()`) for files passed to `renderFile`.
   * When set, the file is resolved from it and neither it nor its includes and
   * extends may leave it (symbolic links included); `basedir` then defaults to
   * it. Recommended when the file name can come from user input.
   */
  templateDirectory?: string;
}

@Injectable()
export class PugService {
  #pug?: typeof pug;
  readonly #scopes = new OptionsScopedCache<LruCache<pug.compileTemplate>>();
  /** For `renderFile` with `templateDirectory`: includes are confined. */
  readonly #confinedScopes = new OptionsScopedCache<{
    guard: TemplateDirectoryGuard;
    compiled: LruCache<pug.compileTemplate>;
  }>();

  get #engine(): typeof pug {
    return (this.#pug ??= loadEngine<typeof pug>('pug', 'Pug'));
  }

  render(
    template: string,
    data: LocalsObject = {},
    options?: PugOptions,
  ): string {
    return this.#render(template, data, options);
  }

  /**
   * With `filename`, `template` is the content of that file: its includes and
   * extends resolve from it (or from `basedir`, by default
   * `templateDirectory`) and may not leave `templateDirectory`.
   */
  #render(
    template: string,
    data: LocalsObject,
    options: PugOptions | undefined,
    filename?: string,
  ): string {
    const engine = this.#engine;
    const { templateDirectory, ...pugOptions } = options ?? {};
    if (filename === undefined || templateDirectory === undefined) {
      try {
        // Scoped on the caller's object, not the stripped copy: options
        // holding functions are compared by reference.
        const compiledFn = this.#compile(
          this.#scopes.get(
            options,
            () => new LruCache(COMPILED_TEMPLATES_PER_SCOPE),
          ),
          template,
          () => engine.compile(template, pugOptions),
        );
        return compiledFn(data);
      } catch (error) {
        throw this.#renderError(error);
      }
    }

    const { guard, compiled } = this.#confinedScopes.get(options, () => ({
      guard: new TemplateDirectoryGuard('Pug', templateDirectory),
      compiled: new LruCache(COMPILED_TEMPLATES_PER_SCOPE),
    }));
    const compileOptions: PugOptions = {
      ...pugOptions,
      filename,
      basedir: pugOptions.basedir ?? guard.baseDir,
      plugins: confineReads(pugOptions.plugins, guard),
    };
    // Includes are read while compiling: the guard must see that compilation.
    return guard.track(() => {
      try {
        const compiledFn = this.#compile(
          compiled,
          `${filename}\0${template}`,
          () => engine.compile(template, compileOptions),
        );
        return compiledFn(data);
      } catch (error) {
        throw guard.refused ?? this.#renderError(error);
      }
    });
  }

  /**
   * Pug inlines includes and extends when compiling: a function that has any
   * is not kept, so that edits to them are picked up.
   */
  #compile(
    compiled: LruCache<pug.compileTemplate>,
    key: string,
    compile: () => pug.compileTemplate,
  ): pug.compileTemplate {
    const cached = compiled.get(key);
    if (cached) {
      return cached;
    }
    const compiledFn: pug.compileTemplate & { dependencies?: Array<string> } =
      compile();
    if (!compiledFn.dependencies?.length) {
      compiled.set(key, compiledFn);
    }
    return compiledFn;
  }

  #renderError(error: unknown): TemplateRenderException {
    return new TemplateRenderException(
      'Pug',
      `Pug rendering failed: ${String(error)}`,
      { cause: error },
    );
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
      return this.#render(template, data, options, templatePath);
    } catch (error) {
      if (
        error instanceof EngineNotAvailableException ||
        error instanceof TemplateConfigurationException
      ) {
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
