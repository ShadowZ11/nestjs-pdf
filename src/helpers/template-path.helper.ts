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
