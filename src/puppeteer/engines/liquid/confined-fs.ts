import type { FS } from 'liquidjs';

import type { TemplateDirectoryGuard } from '../../../helpers/template-path.helper';

/**
 * LiquidJS file system that refuses to read a partial or layout outside
 * `templateDirectory` (symbolic links included), and otherwise delegates to
 * the given one. LiquidJS only confines lookups to `root`, `partials` and
 * `layouts`, which may lie elsewhere.
 */
export class ConfinedFs implements FS {
  readonly sep?: string;
  readonly dirname?: (file: string) => string;
  readonly fallback?: (file: string) => string | undefined;
  readonly contains?: (root: string, file: string) => Promise<boolean>;
  readonly containsSync?: (root: string, file: string) => boolean;
  readonly #fs: FS;
  readonly #guard: TemplateDirectoryGuard;

  constructor(fs: FS, guard: TemplateDirectoryGuard) {
    this.#fs = fs;
    this.#guard = guard;
    // Optional members stay absent when `fs` lacks them: LiquidJS checks.
    this.sep = fs.sep;
    this.dirname = fs.dirname?.bind(fs) as FS['dirname'];
    this.fallback = fs.fallback?.bind(fs) as FS['fallback'];
    this.contains = fs.contains?.bind(fs) as FS['contains'];
    this.containsSync = fs.containsSync?.bind(fs) as FS['containsSync'];
  }

  exists(filepath: string): Promise<boolean> {
    return this.#fs.exists(filepath);
  }

  existsSync(filepath: string): boolean {
    return this.#fs.existsSync(filepath);
  }

  async readFile(filepath: string): Promise<string> {
    return this.#fs.readFile(this.#guard.check(filepath));
  }

  readFileSync(filepath: string): string {
    return this.#fs.readFileSync(this.#guard.check(filepath));
  }

  resolve(dir: string, file: string, ext: string): string {
    return this.#fs.resolve(dir, file, ext);
  }
}
