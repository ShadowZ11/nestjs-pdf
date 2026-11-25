import type { FileSystemLoader, ILoader, LoaderSource } from 'nunjucks';

import type { TemplateDirectoryGuard } from '../../../helpers/template-path.helper';

/**
 * Nunjucks loader that applies the `templateDirectory` restriction (symbolic
 * links included) to every load: the rendered file and each `{% include %}`,
 * `{% extends %}` and `{% import %}`, relative ones included.
 *
 * Nunjucks' own FileSystemLoader only runs a string prefix test on the lexical
 * path, which accepts sibling directories (`templates-2`) and symbolic links
 * leading outside. It wraps that loader instead of extending it: Nunjucks is an
 * optional dependency, loaded at runtime, so its classes are not available when
 * this module is loaded.
 */
export class ConfinedLoader implements ILoader {
  readonly #loader: FileSystemLoader;
  readonly #guard: TemplateDirectoryGuard;

  constructor(loader: FileSystemLoader, guard: TemplateDirectoryGuard) {
    this.#loader = loader;
    this.#guard = guard;
  }

  getSource(name: string): LoaderSource {
    this.#guard.check(name);
    return this.#loader.getSource(name);
  }

  // Nunjucks listens to the loader's `update` (watch) and `load` events.
  on(name: string, listener: (...args: Array<unknown>) => unknown): void {
    this.#loader.on(name, listener);
  }

  isRelative(filename: string): boolean {
    return this.#loader.isRelative(filename);
  }

  resolve(from: string, to: string): string {
    return this.#loader.resolve(from, to);
  }
}
