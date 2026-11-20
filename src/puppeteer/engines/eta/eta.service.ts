import { readFileSync } from 'node:fs';

import { Injectable } from '@nestjs/common';
import type * as EtaModule from 'eta';
import type { Eta, EtaConfig } from 'eta';

import {
  EngineNotAvailableException,
  TemplateRenderException,
} from '../../../exceptions';
import { resolveTemplatePath } from '../../../helpers/template-path.helper';
import { loadEngine } from '../../libs/loadEngine.utils';

export interface EtaOptions extends Partial<EtaConfig> {
  cache?: boolean;
  autoEscape?: boolean;
  varName?: string;
  views?: string;
  useWith?: boolean;
  plugins?: Array<any>;
  /**
   * Base directory (absolute, or relative to `process.cwd()`) for files passed to `renderFile`.
   * When set, the file is resolved from it and may not leave it (symbolic links
   * included). Recommended when the file name can come from user input.
   */
  templateDirectory?: string;
}

@Injectable()
export class EtaService {
  #etaModule?: typeof EtaModule;
  #eta?: Eta;
  readonly #templateCache: Map<string, string> = new Map();
  readonly #maxCacheSize = 100;

  get #engine(): typeof EtaModule {
    return (this.#etaModule ??= loadEngine<typeof EtaModule>('eta', 'Eta'));
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
    const { Eta } = this.#engine;
    const { templateDirectory: _templateDirectory, ...etaOptions } =
      options ?? {};
    try {
      const eta =
        Object.keys(etaOptions).length > 0
          ? new Eta({
              cache: true,
              autoEscape: true,
              useWith: true,
              ...etaOptions,
              varName: etaOptions.varName ?? 'it',
            })
          : (this.#eta ??= new Eta({
              cache: true,
              autoEscape: true,
              useWith: true,
            }));

      return eta.renderString(template, data);
    } catch (error) {
      throw new TemplateRenderException(
        'Eta',
        `Eta rendering failed: ${String(error)}`,
        { cause: error },
      );
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
    const resolvedPath = resolveTemplatePath(
      'Eta',
      filePath,
      options?.templateDirectory,
    );
    try {
      const useCache = options?.cache ?? true;
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
        'Eta',
        `Eta file rendering failed for ${filePath}: ${String(error)}`,
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
