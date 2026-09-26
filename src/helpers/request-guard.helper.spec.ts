import {
  mkdirSync,
  mkdtempSync,
  promises,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { Logger } from '@nestjs/common';
import { type Mock, vi } from 'vitest';

vi.mock('node:dns/promises', () => ({ lookup: vi.fn() }));

import { lookup } from 'node:dns/promises';

import {
  installRequestGuard,
  isPrivateAddress,
  isRequestAllowed,
} from './request-guard.helper';

const lookupMock = lookup as unknown as Mock;

describe('request-guard.helper', () => {
  beforeEach(() => {
    lookupMock.mockReset();
    lookupMock.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
    vi.spyOn(Logger, 'warn').mockImplementation(() => undefined);
  });

  describe('isPrivateAddress', () => {
    it.each([
      '0.0.0.0',
      '10.1.2.3',
      '100.64.0.1',
      '127.0.0.1',
      '169.254.169.254',
      '172.16.0.1',
      '172.31.255.255',
      '192.0.0.1',
      '192.168.1.1',
      '198.18.0.1',
      '224.0.0.1',
      '255.255.255.255',
      '::',
      '::1',
      'fc00::1',
      'fd12:3456::1',
      'fe80::1',
      'ff02::1',
      '64:ff9b::7f00:1',
      '::ffff:7f00:1',
      '::ffff:a9fe:a9fe',
      '::ffff:c0a8:101',
      'not-an-ip',
    ])('refuses %s', (address) => {
      expect(isPrivateAddress(address)).toBe(true);
    });

    it.each([
      '93.184.216.34',
      '8.8.8.8',
      '172.32.0.1',
      '100.63.255.255',
      '2606:4700:4700::1111',
      '::ffff:5db8:d822',
    ])('accepts %s', (address) => {
      expect(isPrivateAddress(address)).toBe(false);
    });
  });

  describe('isRequestAllowed', () => {
    it.each([
      'about:blank',
      'data:text/plain;base64,AAAA',
      'blob:https://example.com/uuid',
    ])('always allows %s', async (url) => {
      await expect(isRequestAllowed(url, {})).resolves.toBe(true);
    });

    it.each([
      'ftp://example.com/file',
      'chrome://version',
      'ws://example.com',
      'javascript:alert(1)',
      'not a url',
    ])('refuses %s', async (url) => {
      await expect(isRequestAllowed(url, {})).resolves.toBe(false);
    });

    describe('private networks', () => {
      it('allows a public host', async () => {
        await expect(
          isRequestAllowed('https://example.com/a.png', {}),
        ).resolves.toBe(true);
      });

      it.each([
        'http://127.0.0.1/',
        'http://2130706433/',
        'http://0x7f.1/',
        'http://[::1]/',
        'http://[::ffff:127.0.0.1]/',
        'http://169.254.169.254/latest/meta-data',
        'http://localhost/',
        'http://app.localhost/',
      ])('refuses %s', async (url) => {
        await expect(isRequestAllowed(url, {})).resolves.toBe(false);
        expect(lookupMock).not.toHaveBeenCalled();
      });

      it('refuses a name that resolves to a private address', async () => {
        lookupMock.mockResolvedValue([
          { address: '93.184.216.34', family: 4 },
          { address: '10.0.0.5', family: 4 },
        ]);

        await expect(
          isRequestAllowed('http://internal.example.com/', {}),
        ).resolves.toBe(false);
      });

      it('refuses a name that does not resolve', async () => {
        lookupMock.mockRejectedValue(new Error('ENOTFOUND'));

        await expect(
          isRequestAllowed('http://nope.example.com/', {}),
        ).resolves.toBe(false);
      });

      it('can be turned off', async () => {
        await expect(
          isRequestAllowed('http://127.0.0.1/', {
            blockPrivateNetworks: false,
          }),
        ).resolves.toBe(true);
      });
    });

    describe('allowedHosts', () => {
      const options = { allowedHosts: ['example.com', '*.cdn.example.com'] };

      it.each([
        'https://example.com/a',
        'https://EXAMPLE.com/a',
        'https://img.cdn.example.com/a',
      ])('allows %s', async (url) => {
        await expect(isRequestAllowed(url, options)).resolves.toBe(true);
      });

      it.each([
        'https://other.com/a',
        'https://cdn.example.com/a',
        'https://evilexample.com/a',
        'https://example.com.evil.com/a',
      ])('refuses %s', async (url) => {
        await expect(isRequestAllowed(url, options)).resolves.toBe(false);
      });

      it('trusts a listed host even on a private address', async () => {
        await expect(
          isRequestAllowed('http://127.0.0.1:3000/a', {
            allowedHosts: ['127.0.0.1'],
          }),
        ).resolves.toBe(true);
        expect(lookupMock).not.toHaveBeenCalled();
      });
    });

    describe('file urls', () => {
      let dir: string;

      beforeAll(() => {
        dir = mkdtempSync(join(tmpdir(), 'nestjs-pdf-guard-'));
        mkdirSync(join(dir, 'assets'));
        mkdirSync(join(dir, 'secret'));
        writeFileSync(join(dir, 'assets', 'logo.png'), 'x');
        writeFileSync(join(dir, 'secret', 'key.pem'), 'x');
      });

      afterAll(() => {
        rmSync(dir, { recursive: true, force: true });
      });

      const fileUrl = (...parts: Array<string>) =>
        pathToFileURL(join(dir, ...parts)).href;

      it('refuses every file url by default', async () => {
        await expect(
          isRequestAllowed(fileUrl('assets', 'logo.png'), {}),
        ).resolves.toBe(false);
      });

      it('allows files inside an allowed root', async () => {
        const options = { allowedFileRoots: [join(dir, 'assets')] };

        await expect(
          isRequestAllowed(fileUrl('assets', 'logo.png'), options),
        ).resolves.toBe(true);
        await expect(
          isRequestAllowed(fileUrl('assets', 'missing.png'), options),
        ).resolves.toBe(true);
        await expect(
          isRequestAllowed(fileUrl('secret', 'key.pem'), options),
        ).resolves.toBe(false);
      });

      it('allows the root itself and any of several roots', async () => {
        const options = {
          allowedFileRoots: [join(dir, 'secret'), join(dir, 'assets')],
        };

        await expect(
          isRequestAllowed(fileUrl('assets'), options),
        ).resolves.toBe(true);
        await expect(
          isRequestAllowed(fileUrl('assets', 'logo.png'), options),
        ).resolves.toBe(true);
      });

      it('refuses path traversal out of the root', async () => {
        const url = `${fileUrl('assets')}/../secret/key.pem`;

        await expect(
          isRequestAllowed(url, { allowedFileRoots: [join(dir, 'assets')] }),
        ).resolves.toBe(false);
      });

      it('refuses a sibling directory sharing the root name prefix', async () => {
        mkdirSync(join(dir, 'assets-private'), { recursive: true });
        writeFileSync(join(dir, 'assets-private', 'a.txt'), 'x');

        await expect(
          isRequestAllowed(fileUrl('assets-private', 'a.txt'), {
            allowedFileRoots: [join(dir, 'assets')],
          }),
        ).resolves.toBe(false);
      });

      it('refuses network paths', async () => {
        await expect(
          isRequestAllowed('file://server/share/a.png', {
            allowedFileRoots: [dir],
          }),
        ).resolves.toBe(false);
      });

      it('accepts file://localhost', async () => {
        const url = fileUrl('assets', 'logo.png').replace(
          'file:///',
          'file://localhost/',
        );

        await expect(
          isRequestAllowed(url, { allowedFileRoots: [dir] }),
        ).resolves.toBe(true);
      });

      it('refuses urls that are not valid file paths', async () => {
        const url = 'file:///assets/%2Flogo.png';

        await expect(
          isRequestAllowed(url, { allowedFileRoots: [dir] }),
        ).resolves.toBe(false);
      });

      it('resolves symbolic links before checking the root', async () => {
        const link = join(dir, 'assets', 'link-to-secret');
        try {
          symlinkSync(join(dir, 'secret'), link, 'junction');
        } catch {
          return; // symlinks not permitted on this machine
        }

        await expect(
          isRequestAllowed(pathToFileURL(join(link, 'key.pem')).href, {
            allowedFileRoots: [join(dir, 'assets')],
          }),
        ).resolves.toBe(false);
      });

      it('resolves symbolic links in the parents of a missing file', async () => {
        const linkedRoot = join(dir, 'linked-assets');
        const escape = join(dir, 'assets', 'escape-to-secret');
        try {
          symlinkSync(join(dir, 'assets'), linkedRoot, 'junction');
          symlinkSync(join(dir, 'secret'), escape, 'junction');
        } catch {
          return; // symlinks not permitted on this machine
        }
        const options = { allowedFileRoots: [join(dir, 'assets')] };

        await expect(
          isRequestAllowed(
            pathToFileURL(join(linkedRoot, 'missing.png')).href,
            options,
          ),
        ).resolves.toBe(true);
        await expect(
          isRequestAllowed(
            pathToFileURL(join(escape, 'missing.pem')).href,
            options,
          ),
        ).resolves.toBe(false);
      });

      it('falls back to the lexical path when nothing can be resolved', async () => {
        const realpath = vi
          .spyOn(promises, 'realpath')
          .mockRejectedValue(new Error('ENOENT'));

        try {
          await expect(
            isRequestAllowed(fileUrl('assets', 'logo.png'), {
              allowedFileRoots: [join(dir, 'assets')],
            }),
          ).resolves.toBe(true);
        } finally {
          realpath.mockRestore();
        }
      });
    });
  });

  describe('installRequestGuard', () => {
    type Handler = (arg: unknown) => void;

    const setup = (options = {}) => {
      const handlers = new Map<string, Handler>();
      const contextHandlers = new Map<string, Handler>();
      const page = {
        setRequestInterception: vi.fn().mockResolvedValue(undefined),
        setJavaScriptEnabled: vi.fn().mockResolvedValue(undefined),
        on: vi.fn((event: string, handler: Handler) => {
          handlers.set(event, handler);
        }),
      };
      const context = {
        on: vi.fn((event: string, handler: Handler) => {
          contextHandlers.set(event, handler);
        }),
      };
      return {
        page,
        context,
        handlers,
        contextHandlers,
        install: () =>
          installRequestGuard(context as never, page as never, options),
      };
    };

    const makeRequest = (url: string, handled = false) => ({
      url: () => url,
      isInterceptResolutionHandled: vi.fn().mockReturnValue(handled),
      continue: vi.fn().mockResolvedValue(undefined),
      abort: vi.fn().mockResolvedValue(undefined),
    });

    const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

    it('turns request interception on and leaves javascript alone by default', async () => {
      const { page, install } = setup();

      await install();

      expect(page.setRequestInterception).toHaveBeenCalledWith(true);
      expect(page.setJavaScriptEnabled).not.toHaveBeenCalled();
    });

    it('disables javascript on demand', async () => {
      const { page, install } = setup({ javascriptEnabled: false });

      await install();

      expect(page.setJavaScriptEnabled).toHaveBeenCalledWith(false);
    });

    it('continues allowed requests', async () => {
      const { handlers, install } = setup();
      await install();
      const request = makeRequest('https://example.com/a.png');

      handlers.get('request')!(request);
      await flush();

      expect(request.continue).toHaveBeenCalled();
      expect(request.abort).not.toHaveBeenCalled();
    });

    it('aborts and logs blocked requests without leaking the query string', async () => {
      const { handlers, install } = setup();
      await install();
      const request = makeRequest('http://127.0.0.1:8080/admin?token=secret');

      handlers.get('request')!(request);
      await flush();

      expect(request.abort).toHaveBeenCalledWith('blockedbyclient');
      expect(request.continue).not.toHaveBeenCalled();
      expect(Logger.warn).toHaveBeenCalledWith(
        'Blocked request to http://127.0.0.1:8080/admin',
        'NestJsPdf',
      );
    });

    it('logs blocked urls without credentials and invalid urls as such', async () => {
      const { handlers, install } = setup();
      await install();

      handlers.get('request')!(makeRequest('ftp://example.com/x'));
      handlers.get('request')!(makeRequest('%%%'));
      await flush();

      expect(Logger.warn).toHaveBeenCalledWith(
        'Blocked request to ftp://example.com/x',
        'NestJsPdf',
      );
      expect(Logger.warn).toHaveBeenCalledWith(
        'Blocked request to <invalid url>',
        'NestJsPdf',
      );
    });

    it('describes a blocked file url by protocol and path', async () => {
      const { handlers, install } = setup();
      await install();

      handlers.get('request')!(makeRequest('file:///etc/passwd'));

      await vi.waitFor(() =>
        expect(Logger.warn).toHaveBeenCalledWith(
          'Blocked request to file:///etc/passwd',
          'NestJsPdf',
        ),
      );
    });

    it('ignores requests another handler already resolved', async () => {
      const { handlers, install } = setup();
      await install();
      const request = makeRequest('http://127.0.0.1/', true);

      handlers.get('request')!(request);
      await flush();

      expect(request.continue).not.toHaveBeenCalled();
      expect(request.abort).not.toHaveBeenCalled();
    });

    it('does not resolve a request that got handled while it was being checked', async () => {
      const { handlers, install } = setup();
      await install();
      const request = makeRequest('https://example.com/');
      request.isInterceptResolutionHandled
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);

      handlers.get('request')!(request);
      await flush();

      expect(request.continue).not.toHaveBeenCalled();
      expect(request.abort).not.toHaveBeenCalled();
    });

    it('swallows failures when the page is already gone', async () => {
      const { handlers, install } = setup();
      await install();
      const request = makeRequest('https://example.com/');
      request.continue.mockRejectedValue(new Error('Target closed'));

      handlers.get('request')!(request);

      await expect(flush()).resolves.toBeUndefined();
    });

    it('refuses the request when the check itself throws', async () => {
      const { handlers, install } = setup({
        get allowedHosts(): Array<string> {
          throw new Error('boom');
        },
      });
      await install();
      const request = makeRequest('https://example.com/');

      handlers.get('request')!(request);
      await flush();

      expect(request.abort).toHaveBeenCalledWith('blockedbyclient');
    });

    describe('pop-ups', () => {
      const target = (type: string, opener: unknown, page: unknown) => ({
        type: () => type,
        opener: () => opener,
        page: vi.fn().mockResolvedValue(page),
      });

      it('closes pages opened by another page', async () => {
        const { contextHandlers, install } = setup();
        await install();
        const popup = { close: vi.fn().mockResolvedValue(undefined) };

        contextHandlers.get('targetcreated')!(target('page', {}, popup));
        await flush();

        expect(popup.close).toHaveBeenCalled();
      });

      it('leaves the main page and other targets alone', async () => {
        const { contextHandlers, install } = setup();
        await install();
        const page = { close: vi.fn() };

        contextHandlers.get('targetcreated')!(target('page', null, page));
        contextHandlers.get('targetcreated')!(
          target('service_worker', {}, page),
        );
        await flush();

        expect(page.close).not.toHaveBeenCalled();
      });

      it('copes with a pop-up that vanished or cannot be closed', async () => {
        const { contextHandlers, install } = setup();
        await install();
        const stuck = {
          close: vi.fn().mockRejectedValue(new Error('gone')),
        };

        contextHandlers.get('targetcreated')!(target('page', {}, null));
        contextHandlers.get('targetcreated')!(target('page', {}, stuck));
        await flush();

        expect(stuck.close).toHaveBeenCalled();
      });
    });
  });
});
