import { Injectable } from '@nestjs/common';
import mustache, { EscapeFunction } from 'mustache';
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface MustacheOptions {
  tags?: [string, string];
  escape?: EscapeFunction;
}

@Injectable()
export class MustacheService {
  private readonly templateCache: Map<string, string> = new Map();
  private readonly maxCacheSize = 100;

  constructor() {
    // Initialize with default settings
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
    try {
      const tags = options?.tags ?? ['{{', '}}'];
      return mustache.render(template, data, undefined, {
        tags: tags,
        escape: options?.escape,
      });
    } catch (error) {
      throw new Error(`Mustache rendering failed: ${String(error)}`, {
        cause: error,
      });
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
      // Check cache first
      let template = this.templateCache.get(filePath);

      if (!template) {
        // Read template from file
        const resolvedPath = path.resolve(filePath);
        template = fs.readFileSync(resolvedPath, 'utf-8');

        // Add to cache if not full
        if (this.templateCache.size < this.maxCacheSize) {
          this.templateCache.set(filePath, template);
        }
      }

      return this.render(template, data, options);
    } catch (error) {
      throw new Error(
        `Mustache file rendering failed for ${filePath}: ${String(error)}`,
        {
          cause: error,
        },
      );
    }
  }

  /**
   * Clear the template cache
   */
  clearCache(): void {
    this.templateCache.clear();
  }

  /**
   * Get the current cache size
   * @returns The number of cached templates
   */
  getCacheSize(): number {
    return this.templateCache.size;
  }
}
