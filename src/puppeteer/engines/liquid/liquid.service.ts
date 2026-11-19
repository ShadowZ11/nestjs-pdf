import { readFileSync } from 'node:fs';

import { Injectable } from '@nestjs/common';
import type * as LiquidModule from 'liquidjs';
import type { Liquid, LiquidOptions as LiquidJsOptions } from 'liquidjs';

import {
  EngineNotAvailableException,
  TemplateRenderException,
} from '../../../exceptions';
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
  #liquid?: Liquid;
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
      const liquid =
        Object.keys(liquidOptions).length > 0
          ? new Liquid(liquidOptions)
          : (this.#liquid ??= new Liquid());

      return liquid.parseAndRenderSync(template, data) as string;
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
