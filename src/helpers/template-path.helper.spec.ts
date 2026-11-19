import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';

import { TemplateConfigurationException } from '../exceptions';
import { resolveTemplatePath } from './template-path.helper';

// Under the project cwd: `templateDirectory` is resolved against `process.cwd()`.
describe('resolveTemplatePath', () => {
  let root: string;
  let templates: string;

  beforeEach(() => {
    root = mkdtempSync('template-path-');
    templates = join(root, 'templates');
    mkdirSync(join(templates, 'partials'), { recursive: true });
    writeFileSync(join(templates, 'invoice.tpl'), 'invoice');
    writeFileSync(join(templates, 'partials', 'header.tpl'), 'header');
    writeFileSync(join(root, 'secret.txt'), 'secret');
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('should resolve from process.cwd() without templateDirectory', () => {
    expect(resolveTemplatePath('Test', '../anything.tpl', undefined)).toBe(
      resolve('../anything.tpl'),
    );
  });

  it('should resolve a file inside templateDirectory', () => {
    expect(resolveTemplatePath('Test', 'invoice.tpl', templates)).toBe(
      resolve(templates, 'invoice.tpl'),
    );
    expect(resolveTemplatePath('Test', 'partials/header.tpl', templates)).toBe(
      resolve(templates, 'partials', 'header.tpl'),
    );
  });

  it('should return the path of a missing file inside templateDirectory', () => {
    expect(resolveTemplatePath('Test', 'missing.tpl', templates)).toBe(
      resolve(templates, 'missing.tpl'),
    );
  });

  it.each([
    ['a parent path', '../secret.txt'],
    ['a nested parent path', 'partials/../../secret.txt'],
    ['an absolute path', resolve('package.json')],
    ['the directory itself', '.'],
  ])('should reject %s', (_label, file) => {
    expect(() => resolveTemplatePath('Test', file, templates)).toThrow(
      TemplateConfigurationException,
    );
  });

  it('should name the engine and the file in the error', () => {
    expect(() =>
      resolveTemplatePath('Liquid', '../secret.txt', templates),
    ).toThrow(
      /^Liquid file rendering failed: ’\.\.\/secret\.txt’ resolves outside `templateDirectory`$/,
    );
  });

  it('should accept a file whose name starts with two dots', () => {
    writeFileSync(join(templates, '..invoice.tpl'), 'dots');

    expect(resolveTemplatePath('Test', '..invoice.tpl', templates)).toBe(
      resolve(templates, '..invoice.tpl'),
    );
  });

  it('should reject a symbolic link that leaves templateDirectory', () => {
    // A junction needs no privilege on Windows; it is a plain symlink elsewhere.
    symlinkSync(resolve(root), join(templates, 'escape'), 'junction');

    expect(() =>
      resolveTemplatePath('Test', 'escape/secret.txt', templates),
    ).toThrow(TemplateConfigurationException);
  });

  it('should accept a symbolic link that stays inside templateDirectory', () => {
    symlinkSync(
      resolve(templates, 'partials'),
      join(templates, 'alias'),
      'junction',
    );

    expect(resolveTemplatePath('Test', 'alias/header.tpl', templates)).toBe(
      resolve(templates, 'alias', 'header.tpl'),
    );
  });
});
