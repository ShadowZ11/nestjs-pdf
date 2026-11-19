import { relative, resolve } from 'node:path';

/**
 * Path of `relativeToModule` (relative to `moduleDir`), relative to `process.cwd()`.
 * @deprecated Every path option (`templateDirectory`, `partialDirectory`, the
 * files passed to `*File` methods) accepts an absolute path: pass
 * `join(__dirname, './templates')` instead. Will be removed in the next major version.
 */
export function getRelativePathToValue(
  moduleDir: string,
  relativeToModule: string,
): string {
  const fullTemplatePath = resolve(moduleDir, relativeToModule);
  return relative(process.cwd(), fullTemplatePath);
}
