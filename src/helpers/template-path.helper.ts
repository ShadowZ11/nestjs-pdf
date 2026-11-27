import { AsyncLocalStorage } from 'node:async_hooks';
import { realpathSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';

import { TemplateConfigurationException } from '../exceptions';

function isInside(baseDir: string, target: string): boolean {
  const rel = relative(baseDir, target);
  return (
    rel !== '' &&
    rel !== '..' &&
    !rel.startsWith(`..${sep}`) &&
    !isAbsolute(rel)
  );
}

/**
 * Resolves the file passed to an engine's `renderFile`.
 *
 * With `templateDirectory` (absolute, or relative to `process.cwd()`), `file` is resolved
 * from it and must stay inside it, symbolic links included: a file name coming
 * from a request cannot read the rest of the disk. Without it, `file` is
 * resolved from `process.cwd()` and is not restricted.
 */
export function resolveTemplatePath(
  engineName: string,
  file: string,
  templateDirectory: string | undefined,
): string {
  if (templateDirectory === undefined) {
    return resolve(file);
  }

  const baseDir = resolve(process.cwd(), templateDirectory);
  const templatePath = resolve(baseDir, file);
  const outside = () =>
    new TemplateConfigurationException(
      `${engineName} file rendering failed: ’${file}’ resolves outside \`templateDirectory\``,
    );

  if (!isInside(baseDir, templatePath)) {
    throw outside();
  }

  let realBase: string;
  let realTarget: string;
  try {
    realBase = realpathSync(baseDir);
    realTarget = realpathSync(templatePath);
  } catch {
    // Missing file or directory: nothing to leak, the read reports the error.
    return templatePath;
  }
  if (!isInside(realBase, realTarget)) {
    throw outside();
  }
  return templatePath;
}

/**
 * Applies the `templateDirectory` restriction to the files an engine loads by
 * itself while rendering (includes, partials, layouts...).
 *
 * Engines wrap, rewrite or replace the errors thrown by their loaders: `check`
 * hands the engine a copy and keeps the original refusal, which the service
 * rethrows from `refused` once rendering has failed.
 *
 * A guard can be kept with a cached engine instance and shared by renders,
 * concurrent ones included: run each render in `track` so that `refused` only
 * reports that render's refusal.
 */
export class TemplateDirectoryGuard {
  readonly baseDir: string;
  readonly #engineName: string;
  readonly #renders = new AsyncLocalStorage<{
    refused?: TemplateConfigurationException;
  }>();
  #refused?: TemplateConfigurationException;

  constructor(engineName: string, templateDirectory: string) {
    this.#engineName = engineName;
    this.baseDir = resolve(process.cwd(), templateDirectory);
  }

  /** The first refusal of the current `track`ed render (or of any, outside one). */
  get refused(): TemplateConfigurationException | undefined {
    const render = this.#renders.getStore();
    return render ? render.refused : this.#refused;
  }

  /** Runs one render, with its own `refused`. */
  track<T>(render: () => T): T {
    return this.#renders.run({}, render);
  }

  /** Resolves `file` from `baseDir`, or throws when it leaves it. */
  check(file: string): string {
    try {
      return resolveTemplatePath(this.#engineName, file, this.baseDir);
    } catch (error) {
      if (!(error instanceof TemplateConfigurationException)) throw error;
      const render = this.#renders.getStore();
      if (render) {
        render.refused ??= error;
      } else {
        this.#refused ??= error;
      }
      throw new Error(error.message, { cause: error });
    }
  }

  /** Whether `dir` is `baseDir` or inside it, symbolic links included. */
  contains(dir: string): boolean {
    const target = resolve(this.baseDir, dir);
    if (target === this.baseDir) return true;
    try {
      resolveTemplatePath(this.#engineName, target, this.baseDir);
      return true;
    } catch {
      return false;
    }
  }
}
