import { relative, resolve } from 'node:path';

/**
 * Get the relative path to a value from the module directory.
 * @param moduleDir the path of the module, typically __dirname
 * @param relativeToModule the path to the value relative to the module directory
 * @returns the relative path from the current working directory to the value
 * @example
 * getRelativePathToValue(__dirname, './templates/my-template.hbs');
 * // returns 'context/pdf/templates/my-template.hbs' if the current working directory is '/
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
