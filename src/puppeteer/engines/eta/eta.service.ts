import { readFileSync } from 'node:fs';

import { Injectable } from '@nestjs/common';
import type * as EtaModule from 'eta';
import type { Eta, EtaConfig, TemplateFunction } from 'eta';

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
  /** One Eta instance, and its compiled templates, per set of options. */
  readonly #scopes = new OptionsScopedCache<{
    eta: Eta;
    compiled: LruCache<TemplateFunction>;
  }>();
  readonly #templateCache: Map<string, string> = new Map();
  readonly #maxCacheSize = 100;

  get #engine(): typeof EtaModule {
    return (this.#etaModule ??= loadEngine<typeof EtaModule>('eta', 'Eta'));
  }

  render(
    template: string,
    data: Record<string, unknown> = {},
    options?: EtaOptions,
  ): string {
    const { Eta } = this.#engine;
    const { templateDirectory: _templateDirectory, ...etaOptions } =
      options ?? {};
    try {
      // The caller's object, not the stripped copy: compared by reference when it holds functions.
      const { eta, compiled } = this.#scopes.get(options, () => ({
        eta: new Eta({
          cache: true,
          autoEscape: true,
          useWith: true,
          ...etaOptions,
          varName: etaOptions.varName ?? 'it',
        }),
        compiled: new LruCache(COMPILED_TEMPLATES_PER_SCOPE),
      }));

      // Same as eta.renderString, without compiling the template every time.
      const templateFn = compiled.getOrCreate(template, () =>
        eta.compile(template, { async: false }),
      );
      return eta.render(templateFn, data);
    } catch (error) {
      throw new TemplateRenderException(
        'Eta',
        `Eta rendering failed: ${String(error)}`,
        { cause: error },
      );
    }
  }

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

  /** Forgets the files read by `renderFile`: edited files are read again. */
  clearCache(): void {
    this.#templateCache.clear();
  }

  /** Number of files kept by `renderFile`. */
  getCacheSize(): number {
    return this.#templateCache.size;
  }
}
