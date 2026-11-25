import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { TemplateConfigurationException } from '../exceptions';
import { TemplateDirectoryGuard } from './template-path.helper';

// Under the project cwd: `templateDirectory` is resolved against `process.cwd()`.
describe('TemplateDirectoryGuard', () => {
  let root: string;
  let templates: string;
  let guard: TemplateDirectoryGuard;

  beforeEach(() => {
    root = mkdtempSync('template-guard-');
    templates = join(root, 'templates');
    mkdirSync(join(templates, 'partials'), { recursive: true });
    guard = new TemplateDirectoryGuard('Test', templates);
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('should resolve templateDirectory from process.cwd()', () => {
    expect(guard.baseDir).toBe(resolve(templates));
  });

  it('should return the resolved path of a file inside templateDirectory', () => {
    expect(guard.check('partials/header.tpl')).toBe(
      resolve(templates, 'partials', 'header.tpl'),
    );
    expect(guard.refused).toBeUndefined();
  });

  it('should keep the first refusal and throw a plain copy of it', () => {
    let thrown: unknown;
    try {
      guard.check('../secret.tpl');
    } catch (error) {
      thrown = error;
    }
    expect(() => guard.check('../other.tpl')).toThrow(Error);

    expect(guard.refused).toBeInstanceOf(TemplateConfigurationException);
    expect(guard.refused?.message).toContain('../secret.tpl');
    expect(thrown).not.toBeInstanceOf(TemplateConfigurationException);
    expect((thrown as Error).message).toBe(guard.refused?.message);
    expect((thrown as Error).cause).toBe(guard.refused);
  });

  it.each([
    ['templateDirectory itself', '.', true],
    ['a subdirectory', 'partials', true],
    ['an absolute subdirectory', () => resolve(templates, 'partials'), true],
    ['its parent', '..', false],
    ['a sibling sharing its prefix', '../templates-2', false],
  ])('should tell whether %s is contained', (_label, dir, expected) => {
    expect(guard.contains(typeof dir === 'function' ? dir() : dir)).toBe(
      expected,
    );
  });
});
