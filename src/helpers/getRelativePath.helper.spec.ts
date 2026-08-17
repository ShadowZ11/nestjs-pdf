import { join, relative, resolve } from 'node:path';

import { getRelativePathToValue } from './getRelativePath.helper';

describe('getRelativePathToValue', () => {
  const cwdSpy = jest.spyOn(process, 'cwd');
  const cwd = resolve(__dirname, '..', '..');

  beforeEach(() => {
    cwdSpy.mockReset();
  });

  afterAll(() => {
    cwdSpy.mockRestore();
  });

  it('returns the path relative to the current working directory', () => {
    cwdSpy.mockReturnValue(cwd);

    const moduleDir = resolve(cwd, 'src', 'helpers');
    const relativeToModule = join('.', 'templates', 'my-template.hbs');

    const result = getRelativePathToValue(moduleDir, relativeToModule);

    expect(result).toBe(relative(cwd, resolve(moduleDir, relativeToModule)));
  });

  it('resolves relative segments before computing the relative path', () => {
    cwdSpy.mockReturnValue(cwd);

    const moduleDir = resolve(cwd, 'src', 'helpers');
    const relativeToModule = join(
      '..',
      'templates',
      '..',
      'templates',
      'contract.hbs',
    );

    const result = getRelativePathToValue(moduleDir, relativeToModule);

    expect(result).toBe(relative(cwd, resolve(moduleDir, relativeToModule)));
  });

  it('returns an upward relative path when the target is outside the cwd', () => {
    const moduleRoot = resolve(cwd, 'src');
    cwdSpy.mockReturnValue(moduleRoot);

    const moduleDir = resolve(moduleRoot, 'helpers');
    const relativeToModule = join('..', '..', 'shared', 'logo.png');

    const result = getRelativePathToValue(moduleDir, relativeToModule);

    expect(result).toBe(
      relative(moduleRoot, resolve(moduleDir, relativeToModule)),
    );
  });

  it('matches Node path behavior for the final resolved value', () => {
    cwdSpy.mockReturnValue(cwd);

    const moduleDir = resolve(cwd, 'src', 'helpers');
    const relativeToModule = join('.', 'templates', 'invoice.hbs');

    const expected = relative(
      process.cwd(),
      resolve(moduleDir, relativeToModule),
    );

    expect(getRelativePathToValue(moduleDir, relativeToModule)).toBe(expected);
  });
});
