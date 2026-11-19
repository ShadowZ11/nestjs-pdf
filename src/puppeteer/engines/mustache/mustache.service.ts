import { readFileSync } from 'node:fs';

import { Injectable } from '@nestjs/common';
import type mustache from 'mustache';
import type { EscapeFunction } from 'mustache';

import {
  EngineNotAvailableException,
  TemplateRenderException,
} from '../../../exceptions';
import { resolveTemplatePath } from '../../../helpers/template-path.helper';
import { loadEngine } from '../../libs/loadEngine.utils';

export interface MustacheOptions {
  tags?: [string, string];
  escape?: EscapeFunction;
  /**
   * Base directory (absolute, or relative to `process.cwd()`) for files passed to `renderFile`.
   * When set, the file is resolved from it and may not leave it (symbolic links
   * included). Recommended when the file name can come from user input.
   */
  templateDirectory?: string;
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

  renderFile(
    filePath: string,
    data: Record<string, unknown> = {},
    options?: MustacheOptions,
  ): string {
    const resolvedPath = resolveTemplatePath(
      'Mustache',
      filePath,
      options?.templateDirectory,
    );
    try {
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

  /** Forgets the files read by `renderFile`: edited files are read again. */
  clearCache(): void {
    this.#templateCache.clear();
  }

  /** Number of files kept by `renderFile`. */
  getCacheSize(): number {
    return this.#templateCache.size;
  }
}
