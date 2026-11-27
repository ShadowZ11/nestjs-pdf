import { readFileSync } from 'node:fs';

import { Injectable } from '@nestjs/common';
import type * as LiquidModule from 'liquidjs';
import type {
  Liquid,
  LiquidOptions as LiquidJsOptions,
  Template,
} from 'liquidjs';

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
import { ConfinedFs } from './confined-fs';

export interface LiquidOptions extends LiquidJsOptions {
  /**
   * Base directory (absolute, or relative to `process.cwd()`) for files passed to `renderFile`.
   * When set, the file is resolved from it and neither it nor its partials and
   * layouts may leave it (symbolic links included); `root` then defaults to it.
   * Recommended when the file name can come from user input.
   */
  templateDirectory?: string;
}

interface LiquidScope {
  liquid: Liquid;
  parsed: LruCache<Array<Template>>;
  /** Set for a scope whose partials and layouts are confined. */
  guard?: TemplateDirectoryGuard;
}

@Injectable()
export class LiquidService {
  #liquidModule?: typeof LiquidModule;
  /** One Liquid instance, and its parsed templates, per set of options. */
  readonly #scopes = new OptionsScopedCache<LiquidScope>();
  /** For `renderFile` with `templateDirectory`. */
  readonly #confinedScopes = new OptionsScopedCache<LiquidScope>();
  readonly #templateCache: Map<string, string> = new Map();
  readonly #maxCacheSize = 100;

  get #engine(): typeof LiquidModule {
    return (this.#liquidModule ??= loadEngine<typeof LiquidModule>(
      'liquidjs',
      'Liquid',
    ));
  }

  /**
   * Render a Liquid template from a string
   * @param template The template string to render
   * @param data The data object to use for rendering
   * @param options Optional Liquid engine options
   * @returns The rendered HTML string
   */
  render(
    template: string,
    data: Record<string, unknown> = {},
    options?: LiquidOptions,
  ): string {
    return this.#render(template, data, options, false);
  }

  /** With `confined`, partials and layouts may not leave `templateDirectory`. */
  #render(
    template: string,
    data: Record<string, unknown>,
    options: LiquidOptions | undefined,
    confined: boolean,
  ): string {
    const { Liquid } = this.#engine;
    const { templateDirectory, ...liquidOptions } = options ?? {};
    let scope: LiquidScope;
    try {
      // Scoped on the caller's object, not the stripped copy: options holding
      // functions are compared by reference.
      scope =
        confined && templateDirectory !== undefined
          ? this.#confinedScopes.get(options, () =>
              this.#confinedScope(templateDirectory, liquidOptions),
            )
          : this.#scopes.get(options, () => ({
              liquid:
                Object.keys(liquidOptions).length > 0
                  ? new Liquid(liquidOptions)
                  : new Liquid(),
              parsed: new LruCache(COMPILED_TEMPLATES_PER_SCOPE),
            }));
    } catch (error) {
      throw this.#renderError(error);
    }
    const { liquid, parsed, guard } = scope;
    const render = () => {
      try {
        // Same as liquid.parseAndRenderSync, without parsing every time.
        const templates = parsed.getOrCreate(template, () =>
          liquid.parse(template),
        );
        return liquid.renderSync(templates, data) as string;
      } catch (error) {
        throw guard?.refused ?? this.#renderError(error);
      }
    };
    // The guard is shared by every render of the scope.
    return guard ? guard.track(render) : render();
  }

  #renderError(error: unknown): TemplateRenderException {
    return new TemplateRenderException(
      'Liquid',
      `Liquid rendering failed: ${String(error)}`,
      { cause: error },
    );
  }

  /**
   * Render a Liquid template from a file
   * @param filePath The path to the template file
   * @param data The data object to use for rendering
   * @param options Optional Liquid engine options
   * @returns The rendered HTML string
   */
  renderFile(
    filePath: string,
    data: Record<string, unknown> = {},
    options?: LiquidOptions,
  ): string {
    const resolvedPath = resolveTemplatePath(
      'Liquid',
      filePath,
      options?.templateDirectory,
    );
    try {
      const useCache = options?.cache !== false;
      let template = useCache
        ? this.#templateCache.get(resolvedPath)
        : undefined;

      if (!template) {
        template = readFileSync(resolvedPath, 'utf-8');

        if (useCache && this.#templateCache.size < this.#maxCacheSize) {
          this.#templateCache.set(resolvedPath, template);
        }
      }
      return this.#render(template, data, options, true);
    } catch (error) {
      if (
        error instanceof EngineNotAvailableException ||
        error instanceof TemplateConfigurationException
      ) {
        throw error;
      }
      throw new TemplateRenderException(
        'Liquid',
        `Liquid file rendering failed for ${filePath}: ${String(error)}`,
        { cause: error },
      );
    }
  }

  /**
   * A Liquid instance whose partials and layouts (looked up from `root`, by
   * default `templateDirectory`) may not leave `templateDirectory`: LiquidJS
   * only confines them to `root`, which defaults to `process.cwd()`.
   */
  #confinedScope(
    templateDirectory: string,
    liquidOptions: Omit<LiquidOptions, 'templateDirectory'>,
  ): LiquidScope {
    const { Liquid } = this.#engine;
    const guard = new TemplateDirectoryGuard('Liquid', templateDirectory);
    return {
      liquid: new Liquid({
        ...liquidOptions,
        root: liquidOptions.root ?? guard.baseDir,
        fs: new ConfinedFs(liquidOptions.fs ?? new Liquid().options.fs, guard),
      }),
      parsed: new LruCache(COMPILED_TEMPLATES_PER_SCOPE),
      guard,
    };
  }

  /**
   * Clear the template cache
   */
  clearCache(): void {
    this.#templateCache.clear();
  }

  /**
   * Get the current cache size
   * @returns The number of cached templates
   */
  getCacheSize(): number {
    return this.#templateCache.size;
  }
}
