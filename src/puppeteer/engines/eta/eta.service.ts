import { Injectable } from '@nestjs/common';
import { Eta, EtaConfig } from 'eta';
import fs from 'node:fs';
import path from 'node:path';

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
    // Initialize Eta with default settings
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
      if (options) {
        this.eta = new Eta({
          cache: options.cache ?? true,
          autoEscape: options.autoEscape ?? true,
          varName: options.varName ?? 'it',
          views: options.views,
          useWith: options.useWith ?? true,
          plugins: options.plugins,
        });
      }

      return this.eta.renderString(template, data);
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
      if (options) {
        this.eta = new Eta({
          cache: options.cache ?? true,
          autoEscape: options.autoEscape ?? true,
          varName: options.varName ?? 'it',
          views: options.views,
          useWith: options.useWith ?? true,
          plugins: options.plugins,
        });
      }

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
