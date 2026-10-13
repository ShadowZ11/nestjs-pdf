import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  EngineNotAvailableException,
  NestjsPdfErrorCode,
} from '../../exceptions';
import { loadEngine } from './loadEngine.utils';

describe('loadEngine', () => {
  it('should return a CommonJS engine as-is', () => {
    const mustache = loadEngine<{ render: unknown }>('mustache', 'Mustache');
    expect(typeof mustache.render).toBe('function');
  });

  it('should unwrap the default export of transpiled ES modules', () => {
    const handlebars = loadEngine<{ create: unknown }>(
      'handlebars',
      'Handlebars',
    );
    expect(typeof handlebars.create).toBe('function');
  });

  it('should return the namespace of native ES modules', () => {
    const eta = loadEngine<{ Eta: unknown }>('eta', 'Eta');
    expect(typeof eta.Eta).toBe('function');
  });

  it('should throw EngineNotAvailableException when the package is missing', () => {
    let caught: unknown;
    try {
      loadEngine('nestjs-pdf-missing-engine', 'Missing');
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(EngineNotAvailableException);
    expect(caught).toMatchObject({
      code: NestjsPdfErrorCode.ENGINE_NOT_AVAILABLE,
      message:
        "Missing engine is not available: the 'nestjs-pdf-missing-engine' package is not installed. Run `npm install nestjs-pdf-missing-engine` to use it.",
    });
    expect((caught as Error).cause).toMatchObject({
      code: 'MODULE_NOT_FOUND',
    });
  });

  it('should rethrow errors raised while evaluating the engine', () => {
    const dir = mkdtempSync(join(tmpdir(), 'nestjs-pdf-'));
    const brokenEngine = join(dir, 'broken.cjs');
    writeFileSync(brokenEngine, "throw new Error('boom');");

    try {
      expect(() => loadEngine(brokenEngine, 'Broken')).toThrow('boom');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
