import { readFile } from 'node:fs/promises';

import { Injectable } from '@nestjs/common';
import type ejs from 'ejs';
import type { Data, IncluderCallback, Options } from 'ejs';

import { TemplateRenderException } from '../../../exceptions';
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

type CompiledTemplate = (data: Data) => string | Promise<string>;

@Injectable()
export class EjsService {
  #ejs?: typeof ejs;
  readonly #scopes = new OptionsScopedCache<LruCache<CompiledTemplate>>();
  /** For `renderFile` with `templateDirectory`: includes are confined. */
  readonly #confinedScopes = new OptionsScopedCache<{
    guard: TemplateDirectoryGuard;
    compiled: LruCache<CompiledTemplate>;
  }>();

  get #engine(): typeof ejs {
    return (this.#ejs ??= loadEngine<typeof ejs>('ejs', 'EJS'));
  }

  async render(template: string, data: Data = {}, options?: EjsOptions) {
    const engine = this.#engine;
    const { templateDirectory: _templateDirectory, ...ejsOptions } =
      options ?? {};
    try {
      // Scoped on the caller's object, not the stripped copy: options holding
      // functions are compared by reference.
      const compiled = this.#scopes.get(
        options,
        () => new LruCache(COMPILED_TEMPLATES_PER_SCOPE),
      );
      return await this.#compile(engine, compiled, template, ejsOptions)(data);
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
    const { guard, compiled } =
      templateDirectory === undefined
        ? {
            guard: undefined,
            compiled: this.#scopes.get(
              options,
              () => new LruCache(COMPILED_TEMPLATES_PER_SCOPE),
            ),
          }
        : this.#confinedScopes.get(options, () => ({
            guard: new TemplateDirectoryGuard('EJS', templateDirectory),
            compiled: new LruCache(COMPILED_TEMPLATES_PER_SCOPE),
          }));
    const render = async () => {
      try {
        // Read on every call (cheap), compiled once per content: an edited
        // file is picked up. `filename` resolves includes relative to the file.
        const template = await readFile(templatePath, 'utf8');
        return await this.#compile(
          engine,
          compiled,
          template,
          guard
            ? {
                ...ejsOptions,
                includer: this.#confinedIncluder(guard, ejsOptions.includer),
              }
            : ejsOptions,
          templatePath,
        )(data);
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
    };
    // Includes run while rendering: the guard is shared by concurrent renders.
    return guard ? await guard.track(render) : await render();
  }

  #compile(
    engine: typeof ejs,
    compiled: LruCache<CompiledTemplate>,
    template: string,
    options: Omit<EjsOptions, 'templateDirectory'>,
    filename?: string,
  ): CompiledTemplate {
    return compiled.getOrCreate(`${filename ?? ''}\0${template}`, () =>
      engine.compile(template, {
        async: true,
        ...options,
        ...(filename === undefined ? {} : { filename }),
      }),
    );
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
