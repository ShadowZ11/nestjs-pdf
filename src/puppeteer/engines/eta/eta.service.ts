import { Injectable } from '@nestjs/common';
import { Eta, EtaConfig } from 'eta';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';

export interface EtaOptions extends Partial<EtaConfig> {
  cache?: boolean;
  autoEscape?: boolean;
  varName?: string;
  views?: string;
  useWith?: boolean;
  plugins?: any[];
}

@Injectable()
export class EtaService {
  private eta: Eta;
  private readonly templateCache: Map<string, string> = new Map();
  private readonly maxCacheSize = 100;

  constructor() {
    this.eta = new Eta({
      cache: true,
      autoEscape: true,
      useWith: true,
    });
  }

  /**
   * Render an Eta template from a string
   * @param template The template string to render
   * @param data The data object to use for rendering
   * @param options Optional Eta rendering options
   * @returns The rendered HTML string
   */
  render(
    template: string,
    data: Record<string, unknown> = {},
    options?: EtaOptions,
  ): string {
    try {
      const eta = options
        ? new Eta({
            cache: true,
            autoEscape: true,
            useWith: true,
            ...options,
            varName: options.varName ?? 'it',
          })
        : this.eta;

      return eta.renderString(template, data);
    } catch (error) {
      throw new Error(`Eta rendering failed: ${String(error)}`, {
        cause: error,
      });
    }
  }

  /**
   * Render an Eta template from a file
   * @param filePath The path to the template file
   * @param data The data object to use for rendering
   * @param options Optional Eta rendering options
   * @returns The rendered HTML string
   */
  renderFile(
    filePath: string,
    data: Record<string, unknown> = {},
    options?: EtaOptions,
  ): string {
    try {
      const resolvedPath = resolve(filePath);
      const useCache = options?.cache ?? true;
      let template = useCache
        ? this.templateCache.get(resolvedPath)
        : undefined;

      if (!template) {
        template = readFileSync(resolvedPath, 'utf-8');

        if (useCache && this.templateCache.size < this.maxCacheSize) {
          this.templateCache.set(resolvedPath, template);
        }
      }
      return this.render(template, data, options);
    } catch (error) {
      throw new Error(
        `Eta file rendering failed for ${filePath}: ${String(error)}`,
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
