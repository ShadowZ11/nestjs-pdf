import { resolve } from 'node:path';

import { vi } from 'vitest';

import { TemplateDirectoryGuard } from '../../../helpers/template-path.helper';
import { confineReads, type PugPlugin } from './confined-read.plugin';
import type { PugOptions } from './pug.service';

describe('confineReads', () => {
  const guard = new TemplateDirectoryGuard('Pug', 'templates');
  const inside = resolve('templates', 'part.pug');
  const outside = resolve('secret.pug');

  it('should add a read hook when no plugin has one', () => {
    const other: PugPlugin = { preLex: vi.fn() };

    const plugins = confineReads([other], guard);

    expect(plugins).toHaveLength(2);
    expect(plugins[0]).toBe(other);
    expect(() => plugins[1].read!(outside, {})).toThrow('resolves outside');
  });

  it('should wrap the caller read hook instead of adding one', () => {
    const read = vi.fn().mockReturnValue('content');
    const preLex = vi.fn();
    const options = { basedir: 'templates' };

    const plugins = confineReads([{ read, preLex }], guard);

    expect(plugins).toHaveLength(1);
    expect(plugins[0].preLex).toBe(preLex);
    expect(plugins[0].read!(inside, options)).toBe('content');
    expect(read).toHaveBeenCalledWith(inside, options);
    expect(() => plugins[0].read!(outside, options)).toThrow(
      'resolves outside',
    );
    expect(read).toHaveBeenCalledTimes(1);
  });

  it('should keep the hooks of a class-based plugin', () => {
    class Plugin {
      readonly prefix = 'read:';
      read(filename: string) {
        return this.prefix + filename;
      }
      postCodeGen(js: string) {
        return js;
      }
    }

    const [wrapped] = confineReads([new Plugin()], guard);

    expect(wrapped.read!(inside, {})).toBe(`read:${inside}`);
    expect(wrapped.postCodeGen!('js', {})).toBe('js');
  });

  it('should type plugins whose hooks take narrower values', () => {
    interface Token {
      type: string;
    }
    interface LexerPlugin {
      postLex(tokens: Array<Token>): Array<Token>;
    }
    const plugin: LexerPlugin = { postLex: (tokens) => tokens };

    // Compiles: `PugOptions.plugins` accepts it.
    const options: PugOptions = { plugins: [plugin] };

    expect(options.plugins).toEqual([plugin]);
  });

  it('should accept no plugins', () => {
    expect(confineReads(undefined, guard)).toHaveLength(1);
  });
});
