import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { Injectable } from '@nestjs/common';
import type mustache from 'mustache';
import type { EscapeFunction } from 'mustache';

import {
  EngineNotAvailableException,
  TemplateRenderException,
} from '../../../exceptions';
import { loadEngine } from '../../libs/loadEngine.utils';

export interface MustacheOptions {
  tags?: [string, string];
  escape?: EscapeFunction;
}

@Injectable()
export class MustacheService {
  #mustache?: typeof mustache;
  readonly #templateCache: Map<string, string> = new Map();
  readonly #maxCacheSize = 100;

  get #engine(): typeof mustache {
    return (this.#mustache ??= loadEngine<typeof mustache>(
      'mustache',
      'Mustache',
    ));
  }

  /**
   * Render a Mustache template from a string
   * @param template The template string to render
   * @param data The data object to use for rendering
   * @param options Optional Mustache rendering options
   * @returns The rendered HTML string
   */
  render(
    template: string,
    data: Record<string, unknown> = {},
    options?: MustacheOptions,
  ): string {
    const engine = this.#engine;
    try {
      const tags = options?.tags ?? ['{{', '}}'];
      return engine.render(template, data, undefined, {
        tags: tags,
        escape: options?.escape,
      });
    } catch (error) {
      throw new TemplateRenderException(
        'Mustache',
        `Mustache rendering failed: ${String(error)}`,
        { cause: error },
      );
    }
  }

  /**
   * Render a Mustache template from a file
   * @param filePath The path to the template file
   * @param data The data object to use for rendering
   * @param options Optional Mustache rendering options
   * @returns The rendered HTML string
   */
  renderFile(
    filePath: string,
    data: Record<string, unknown> = {},
    options?: MustacheOptions,
  ): string {
    try {
      const resolvedPath = resolve(filePath);
      let template = this.#templateCache.get(resolvedPath);

      if (!template) {
        template = readFileSync(resolvedPath, 'utf-8');

        if (this.#templateCache.size < this.#maxCacheSize) {
          this.#templateCache.set(resolvedPath, template);
        }
      }

      return this.render(template, data, options);
    } catch (error) {
      if (error instanceof EngineNotAvailableException) {
        throw error;
      }
      throw new TemplateRenderException(
        'Mustache',
        `Mustache file rendering failed for ${filePath}: ${String(error)}`,
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
