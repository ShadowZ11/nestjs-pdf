import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { Injectable } from '@nestjs/common';
import type * as LiquidModule from 'liquidjs';
import type { Liquid, LiquidOptions as LiquidJsOptions } from 'liquidjs';

import {
  EngineNotAvailableException,
  TemplateRenderException,
} from '../../../exceptions';
import { loadEngine } from '../../libs/loadEngine.utils';

export type LiquidOptions = LiquidJsOptions;

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
    try {
      const liquid =
        options && Object.keys(options).length > 0
          ? new Liquid(options)
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
    try {
      const resolvedPath = resolve(filePath);
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
