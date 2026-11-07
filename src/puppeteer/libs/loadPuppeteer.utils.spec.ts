import { vi } from 'vitest';

import { NestjsPdfErrorCode } from '../../exceptions';

function moduleNotFound(packageName: string, code = 'ERR_MODULE_NOT_FOUND') {
  return Object.assign(
    new Error(`Cannot find package '${packageName}' imported from /app`),
    { code },
  );
}

describe('loadPuppeteer.utils', () => {
  afterEach(() => {
    vi.doUnmock('puppeteer');
    vi.doUnmock('@puppeteer/browsers');
    vi.resetModules();
  });

  it('should load puppeteer and @puppeteer/browsers when installed', async () => {
    vi.doMock('puppeteer', () => ({ launch: 'launch' }));
    vi.doMock('@puppeteer/browsers', () => ({ install: 'install' }));
    const { loadPuppeteer, loadPuppeteerBrowsers } =
      await import('./loadPuppeteer.utils');

    await expect(loadPuppeteer()).resolves.toMatchObject({ launch: 'launch' });
    await expect(loadPuppeteerBrowsers()).resolves.toMatchObject({
      install: 'install',
    });
  });

  it.each(['ERR_MODULE_NOT_FOUND', 'MODULE_NOT_FOUND'])(
    'should explain how to install a missing package (%s)',
    async (code) => {
      const { loadOptional } = await import('./loadPuppeteer.utils');

      const promise = loadOptional('puppeteer', () =>
        Promise.reject(moduleNotFound('puppeteer', code)),
      );
      // Modules are reset between tests: compare the code, not the class.
      await expect(promise).rejects.toMatchObject({
        code: NestjsPdfErrorCode.ENGINE_NOT_AVAILABLE,
      });
      await expect(promise).rejects.toThrow(
        "Puppeteer engine is not available: the 'puppeteer' package is not installed. Run `npm install puppeteer` to use it.",
      );
    },
  );

  it('should rethrow when a dependency of the package is missing', async () => {
    const { loadOptional } = await import('./loadPuppeteer.utils');
    const broken = moduleNotFound('some-transitive-dep');

    await expect(
      loadOptional('puppeteer', () => Promise.reject(broken)),
    ).rejects.toBe(broken);
  });

  it('should rethrow other errors as is', async () => {
    const { loadOptional } = await import('./loadPuppeteer.utils');
    const broken = new TypeError('boom');

    await expect(
      loadOptional('puppeteer', () => Promise.reject(broken)),
    ).rejects.toBe(broken);
  });
});
