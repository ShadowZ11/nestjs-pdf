import { readFileSync } from 'node:fs';

import type { Options } from 'pug';

import type { TemplateDirectoryGuard } from '../../../helpers/template-path.helper';

/**
 * A Pug plugin (`@types/pug` does not declare them): hooks on each compilation
 * step, see https://github.com/pugjs/pug/tree/master/packages/pug#plugins.
 *
 * Hooks are declared as methods so that a plugin typed with narrower values
 * (pug-lexer tokens, pug-parser nodes...) is accepted.
 */
export interface PugPlugin {
  preLex?(source: string, options: Options): string;
  postLex?(tokens: unknown, options: Options): unknown;
  preParse?(tokens: unknown, options: Options): unknown;
  postParse?(ast: unknown, options: Options): unknown;
  preLoad?(ast: unknown, options: Options): unknown;
  postLoad?(ast: unknown, options: Options): unknown;
  preFilters?(ast: unknown, options: Options): unknown;
  postFilters?(ast: unknown, options: Options): unknown;
  preLink?(ast: unknown, options: Options): unknown;
  postLink?(ast: unknown, options: Options): unknown;
  preCodeGen?(ast: unknown, options: Options): unknown;
  postCodeGen?(js: string, options: Options): string;
  /** Lexer extensions, passed to pug-lexer. */
  lex?: object;
  /** Parser extensions, passed to pug-parser. */
  parse?: object;
  /** Replaces how `include`/`extends` paths are resolved. */
  resolve?(filename: string, source: string, options: Options): string;
  /** Replaces how `include`/`extends` files are read. */
  read?(filename: string, options: Options): string | Buffer;
  /** Replaces the code generator. */
  generateCode?(ast: unknown, options: Options): string;
}

/**
 * Returns `plugins` with a `read` hook refusing `include`/`extends` files
 * outside `templateDirectory` (symbolic links included).
 *
 * Pug accepts a single plugin implementing `read`: when the caller provides
 * one, it is wrapped instead of being added to.
 */
export function confineReads(
  plugins: Array<PugPlugin> | undefined,
  guard: TemplateDirectoryGuard,
): Array<PugPlugin> {
  const confined = [...(plugins ?? [])];
  const index = confined.findIndex(
    (plugin) => typeof plugin.read === 'function',
  );
  if (index === -1) {
    confined.push({
      read: (filename) => readFileSync(guard.check(filename)),
    });
    return confined;
  }

  const plugin = confined[index];
  // Inherit from the plugin to keep its other hooks, class methods included.
  const wrapped = Object.create(plugin) as PugPlugin;
  wrapped.read = (filename, options) =>
    plugin.read!(guard.check(filename), options);
  confined[index] = wrapped;
  return confined;
}
