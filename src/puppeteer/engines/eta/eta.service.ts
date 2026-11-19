import { readFileSync } from 'node:fs';

import { Injectable } from '@nestjs/common';
import type * as EtaModule from 'eta';
import type { Eta, EtaConfig, TemplateFunction } from 'eta';

import {
  EngineNotAvailableException,
  TemplateConfigurationException,
  TemplateRenderException,
} from '../../../exceptions';
import {
  COMPILED_TEMPLATES_PER_SCOPE,
  LruCache,
  OptionsScopedCache,
} from '../../../helpers/template-cache.helper';
import {
  resolveTemplatePath,
  TemplateDirectoryGuard,
} from '../../../helpers/template-path.helper';
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
   * When set, the file is resolved from it and neither it nor its includes may
   * leave it (symbolic links included); `views` then defaults to it.
   * Recommended when the file name can come from user input.
   */
  templateDirectory?: string;
}

interface EtaScope {
  eta: Eta;
  compiled: LruCache<TemplateFunction>;
  /** Set for a scope whose includes and layouts are confined. */
  guard?: TemplateDirectoryGuard;
}

@Injectable()
export class EtaService {
  #etaModule?: typeof EtaModule;
  /** One Eta instance, and its compiled templates, per set of options. */
  readonly #scopes = new OptionsScopedCache<EtaScope>();
  /** For `renderFile` with `templateDirectory`. */
  readonly #confinedScopes = new OptionsScopedCache<EtaScope>();
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
    return this.#render(template, data, options, false);
  }

  /** With `confined`, includes and layouts may not leave `templateDirectory`. */
  #render(
    template: string,
    data: Record<string, unknown>,
    options: EtaOptions | undefined,
    confined: boolean,
  ): string {
    const { Eta } = this.#engine;
    const { templateDirectory, ...etaOptions } = options ?? {};
    // Scoped on the caller's object, not the stripped copy: options holding
    // functions are compared by reference.
    const scope =
      confined && templateDirectory !== undefined
        ? this.#confinedScopes.get(options, () =>
            this.#confinedScope(templateDirectory, etaOptions),
          )
        : this.#scopes.get(options, () => ({
            eta: new Eta({
              cache: true,
              autoEscape: true,
              useWith: true,
              ...etaOptions,
              varName: etaOptions.varName ?? 'it',
            }),
            compiled: new LruCache(COMPILED_TEMPLATES_PER_SCOPE),
          }));
    const { eta, compiled, guard } = scope;
    const render = () => {
      try {
        // Same as eta.renderString, without compiling the template every time.
        const templateFn = compiled.getOrCreate(template, () =>
          eta.compile(template, { async: false }),
        );
        return eta.render(templateFn, data);
      } catch (error) {
        if (guard?.refused) {
          throw guard.refused;
        }
        throw new TemplateRenderException(
          'Eta',
          `Eta rendering failed: ${String(error)}`,
          { cause: error },
        );
      }
    };
    // The guard is shared by every render of the scope.
    return guard ? guard.track(render) : render();
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
      return this.#render(template, data, options, true);
    } catch (error) {
      if (
        error instanceof EngineNotAvailableException ||
        error instanceof TemplateConfigurationException
      ) {
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
   * An Eta instance whose includes and layouts (resolved from `views`, by
   * default `templateDirectory`) may not leave `templateDirectory`.
   */
  #confinedScope(
    templateDirectory: string,
    etaOptions: Omit<EtaOptions, 'templateDirectory'>,
  ): EtaScope {
    const { Eta } = this.#engine;
    const guard = new TemplateDirectoryGuard('Eta', templateDirectory);
    const eta = new Eta({
      cache: true,
      autoEscape: true,
      useWith: true,
      ...etaOptions,
      views: etaOptions.views ?? guard.baseDir,
      varName: etaOptions.varName ?? 'it',
    });
    eta.readFile = (path: string) => readFileSync(guard.check(path), 'utf8');
    return {
      eta,
      compiled: new LruCache(COMPILED_TEMPLATES_PER_SCOPE),
      guard,
    };
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
