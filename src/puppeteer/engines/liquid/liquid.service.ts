import { readFileSync } from 'node:fs';

import { Injectable } from '@nestjs/common';
import type * as LiquidModule from 'liquidjs';
import type { Liquid, LiquidOptions as LiquidJsOptions } from 'liquidjs';

import {
  EngineNotAvailableException,
  TemplateConfigurationException,
  TemplateRenderException,
} from '../../../exceptions';
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
    return this.#render(template, data, options);
  }

  #render(
    template: string,
    data: Record<string, unknown>,
    options: LiquidOptions | undefined,
    guard?: TemplateDirectoryGuard,
  ): string {
    const { Liquid } = this.#engine;
    const { templateDirectory: _templateDirectory, ...liquidOptions } =
      options ?? {};
    try {
      const liquid = guard
        ? this.#confinedLiquid(guard, liquidOptions)
        : Object.keys(liquidOptions).length > 0
          ? new Liquid(liquidOptions)
          : (this.#liquid ??= new Liquid());

      return liquid.parseAndRenderSync(template, data) as string;
    } catch (error) {
      if (guard?.refused) {
        throw guard.refused;
      }
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
      return this.#render(
        template,
        data,
        options,
        options?.templateDirectory === undefined
          ? undefined
          : new TemplateDirectoryGuard('Liquid', options.templateDirectory),
      );
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
  #confinedLiquid(
    guard: TemplateDirectoryGuard,
    liquidOptions: Omit<LiquidOptions, 'templateDirectory'>,
  ): Liquid {
    const { Liquid } = this.#engine;
    return new Liquid({
      ...liquidOptions,
      root: liquidOptions.root ?? guard.baseDir,
      fs: new ConfinedFs(liquidOptions.fs ?? new Liquid().options.fs, guard),
    });
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
