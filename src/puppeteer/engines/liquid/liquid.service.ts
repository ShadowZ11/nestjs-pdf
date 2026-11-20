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
  TemplateRenderException,
} from '../../../exceptions';
import {
  COMPILED_TEMPLATES_PER_SCOPE,
  LruCache,
  OptionsScopedCache,
} from '../../../helpers/template-cache.helper';
import { resolveTemplatePath } from '../../../helpers/template-path.helper';
import { loadEngine } from '../../libs/loadEngine.utils';

export interface LiquidOptions extends LiquidJsOptions {
  /**
   * Base directory (absolute, or relative to `process.cwd()`) for files passed to `renderFile`.
   * When set, the file is resolved from it and may not leave it (symbolic links
   * included). Recommended when the file name can come from user input.
   */
  templateDirectory?: string;
}

@Injectable()
export class LiquidService {
  #liquidModule?: typeof LiquidModule;
  /** One Liquid instance, and its parsed templates, per set of options. */
  readonly #scopes = new OptionsScopedCache<{
    liquid: Liquid;
    parsed: LruCache<Array<Template>>;
  }>();
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
    const { Liquid } = this.#engine;
    const { templateDirectory: _templateDirectory, ...liquidOptions } =
      options ?? {};
    try {
      // Scoped on the caller's object, not the stripped copy: options holding
      // functions are compared by reference.
      const { liquid, parsed } = this.#scopes.get(options, () => ({
        liquid:
          Object.keys(liquidOptions).length > 0
            ? new Liquid(liquidOptions)
            : new Liquid(),
        parsed: new LruCache(COMPILED_TEMPLATES_PER_SCOPE),
      }));

      // Same as liquid.parseAndRenderSync, without parsing every time.
      const templates = parsed.getOrCreate(template, () =>
        liquid.parse(template),
      );
      return liquid.renderSync(templates, data) as string;
    } catch (error) {
      throw new TemplateRenderException(
        'Liquid',
        `Liquid rendering failed: ${String(error)}`,
        { cause: error },
      );
    }
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
      return this.render(template, data, options);
    } catch (error) {
      if (error instanceof EngineNotAvailableException) {
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
