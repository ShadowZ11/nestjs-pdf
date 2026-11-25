import { resolve } from 'node:path';

import type { FS } from 'liquidjs';
import { vi } from 'vitest';

import { TemplateDirectoryGuard } from '../../../helpers/template-path.helper';
import { ConfinedFs } from './confined-fs';

describe('ConfinedFs', () => {
  const guard = new TemplateDirectoryGuard('Liquid', 'templates');
  const inside = resolve('templates', 'part.liquid');
  const outside = resolve('secret.liquid');
  let fs: FS;

  beforeEach(() => {
    fs = {
      exists: vi.fn().mockResolvedValue(true),
      existsSync: vi.fn().mockReturnValue(true),
      readFile: vi.fn().mockResolvedValue('async content'),
      readFileSync: vi.fn().mockReturnValue('sync content'),
      resolve: vi.fn().mockReturnValue('resolved'),
      sep: '/',
    };
  });

  it('should delegate lookups to the wrapped file system', async () => {
    const confined = new ConfinedFs(fs, guard);

    await expect(confined.exists(outside)).resolves.toBe(true);
    expect(confined.existsSync(outside)).toBe(true);
    expect(confined.resolve('dir', 'file', '.liquid')).toBe('resolved');
    expect(fs.resolve).toHaveBeenCalledWith('dir', 'file', '.liquid');
    expect(confined.sep).toBe('/');
  });

  it('should leave absent the optional members the wrapped one lacks', () => {
    const confined = new ConfinedFs(fs, guard);

    expect(confined.dirname).toBeUndefined();
    expect(confined.contains).toBeUndefined();
    expect(confined.containsSync).toBeUndefined();
    expect(confined.fallback).toBeUndefined();
  });

  it('should bind the optional members to the wrapped file system', () => {
    const custom = {
      ...fs,
      prefix: 'from:',
      dirname(this: { prefix: string }, file: string) {
        return this.prefix + file;
      },
    };

    expect(new ConfinedFs(custom, guard).dirname?.('x')).toBe('from:x');
  });

  it('should read files inside templateDirectory', async () => {
    const confined = new ConfinedFs(fs, guard);

    await expect(confined.readFile(inside)).resolves.toBe('async content');
    expect(confined.readFileSync(inside)).toBe('sync content');
  });

  it('should refuse to read files outside templateDirectory', async () => {
    const confined = new ConfinedFs(fs, guard);

    await expect(confined.readFile(outside)).rejects.toThrow(
      'resolves outside',
    );
    expect(() => confined.readFileSync(outside)).toThrow('resolves outside');
    expect(fs.readFile).not.toHaveBeenCalled();
    expect(fs.readFileSync).not.toHaveBeenCalled();
  });
});
