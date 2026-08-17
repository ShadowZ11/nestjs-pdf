jest.mock('node:fs', () => ({
  existsSync: jest.fn(),
  promises: {
    rm: jest.fn(),
    readdir: jest.fn(),
  },
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

jest.mock('puppeteer', () => ({
  launch: jest.fn(),
}));

jest.mock('@puppeteer/browsers', () => ({
  Browser: {
    CHROMIUM: 'chromium',
    CHROME: 'chrome',
  },
  BrowserPlatform: {
    LINUX: 'linux',
  },
  canDownload: jest.fn(),
  detectBrowserPlatform: jest.fn(),
  getInstalledBrowsers: jest.fn(),
  resolveBuildId: jest.fn(),
  install: jest.fn(),
}));

import { existsSync, promises, readFileSync, writeFileSync } from 'node:fs';

import { Logger } from '@nestjs/common';
import {
  Browser as BrowserType,
  canDownload,
  detectBrowserPlatform,
  getInstalledBrowsers,
  install,
  type InstalledBrowser,
  resolveBuildId,
} from '@puppeteer/browsers';
import { type Browser as PuppeteerBrowser, launch } from 'puppeteer';

import type { PuppeteerParameters } from '../puppeteer-parameters.interface';
import { BrowserService, BrowserTag } from './browser.service';

type BrowserLike = {
  connected: boolean;
  close: jest.Mock;
  createBrowserContext: jest.Mock;
  on: jest.Mock;
};

type BrowserServiceTestState = {
  _browserInstance: BrowserLike | null;
  recycleRequested: boolean;
  recycling: boolean;
  useLockedBrowser: boolean;
  browser: BrowserType;
  writeLockFile(browser: BrowserType, buildId: string): void;
};

const testState = (instance: BrowserService) =>
  instance as unknown as BrowserServiceTestState;

describe('BrowserService', () => {
  let service: BrowserService;

  const mockInstalledBrowsers = [];

  const createService = (options: Partial<PuppeteerParameters> = {}) =>
    new BrowserService({
      cleanupBrowserCacheOnExit: false,
      ...options,
    });

  const createBrowser = (
    overrides: Partial<BrowserLike> = {},
  ): BrowserLike => ({
    connected: true,
    close: jest.fn().mockResolvedValue(undefined),
    createBrowserContext: jest.fn().mockResolvedValue({}),
    on: jest.fn(),
    ...overrides,
  });

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();

    (detectBrowserPlatform as jest.Mock).mockReturnValue(undefined);
    (getInstalledBrowsers as jest.Mock).mockResolvedValue(
      mockInstalledBrowsers,
    );
    (resolveBuildId as jest.Mock).mockResolvedValue('build-123');
    (canDownload as jest.Mock).mockResolvedValue(true);
    const installedBrowser = {
      browser: BrowserType.CHROMIUM,
      buildId: 'build-123',
      platform: 'linux',
      executablePath: '/installed/browser',
      path: '/installed/browser',
      folderPath: '/installed',
    } as unknown as Awaited<ReturnType<typeof install>>;
    (install as jest.Mock).mockResolvedValue(installedBrowser);
    (existsSync as jest.Mock).mockReturnValue(false);
    (readFileSync as jest.Mock).mockReturnValue(
      Buffer.from(
        JSON.stringify({
          browser: BrowserType.CHROMIUM,
          buildId: 'locked-build',
          date: '2026-01-01T00:00:00.000Z',
        }),
      ),
    );
    (promises.rm as jest.Mock).mockResolvedValue(undefined);
    (promises.readdir as jest.Mock).mockResolvedValue([]);
    (launch as jest.Mock).mockResolvedValue(createBrowser());

    jest.spyOn(Logger, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger, 'error').mockImplementation(() => undefined);

    service = createService();
  });

  describe('initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should initialize with default browser tag and browser', () => {
      expect(service.getBrowserTag()).toBe(BrowserTag.LATEST);
      expect(service.getBrowser()).toBe(BrowserType.CHROMIUM);
      expect(service.getBuildId()).toBeUndefined();
    });

    it('should honor explicit options', () => {
      const localService = createService({
        browser: BrowserType.CHROME,
        browserTag: BrowserTag.BETA,
        buildId: 'explicit-build',
        useLockedBrowser: true,
      });

      expect(localService.getBrowser()).toBe(BrowserType.CHROME);
      expect(localService.getBrowserTag()).toBe(BrowserTag.BETA);
      expect(localService.getBuildId()).toBe('explicit-build');
    });
  });

  describe('job tracking', () => {
    it('should increment active and total jobs on markJobStarted', () => {
      service.markJobStarted();
      service.markJobStarted();

      expect(service.activeJobs).toBe(2);
      expect(service.totalJobs).toBe(2);
    });

    it('should request recycle when total jobs reaches 200', () => {
      for (let i = 0; i < 200; i++) {
        service.markJobStarted();
      }

      const recycleRequested = testState(service).recycleRequested;
      expect(recycleRequested).toBe(true);
    });

    it('should decrement active jobs on markJobFinished', async () => {
      service.markJobStarted();
      service.markJobStarted();

      await service.markJobFinished();

      expect(service.activeJobs).toBe(1);
    });

    it('should not decrement below zero', async () => {
      await service.markJobFinished();

      expect(service.activeJobs).toBe(0);
    });
  });

  describe('getBrowserInstance', () => {
    it('should launch a browser when none is connected', async () => {
      const browser = createBrowser();
      (launch as jest.Mock).mockResolvedValue(browser);
      const getExecutablePathSpy = jest
        .spyOn(service, 'getExecutablePath')
        .mockResolvedValue('/browser/bin');

      const result = await service.getBrowserInstance(
        ['--no-sandbox'],
        true,
        undefined,
      );

      expect(getExecutablePathSpy).toHaveBeenCalled();
      expect(launch).toHaveBeenCalledWith({
        executablePath: '/browser/bin',
        headless: true,
        args: ['--no-sandbox'],
      });
      expect(result).toBe(browser);
      expect(browser.on).toHaveBeenCalledWith(
        'disconnected',
        expect.any(Function),
      );
    });

    it('should clear the cached browser when it disconnects', async () => {
      const browser = createBrowser();
      let disconnectedHandler: (() => void) | undefined;
      browser.on.mockImplementation((event: string, handler: () => void) => {
        if (event === 'disconnected') {
          disconnectedHandler = handler;
        }
        return browser;
      });
      (launch as jest.Mock).mockResolvedValue(browser);
      jest
        .spyOn(service, 'getExecutablePath')
        .mockResolvedValue('/browser/bin');

      await service.getBrowserInstance(['--no-sandbox'], true, undefined);
      expect(testState(service)._browserInstance).toBe(browser);

      disconnectedHandler?.();

      expect(testState(service)._browserInstance).toBeNull();
    });

    it('should reuse the existing browser instance when connected', async () => {
      const browser = createBrowser();
      testState(service)._browserInstance = browser;

      const result = await service.getBrowserInstance([], true, '/custom/bin');

      expect(launch).not.toHaveBeenCalled();
      expect(result).toBe(browser);
    });
  });

  describe('createContext', () => {
    it('should delegate to browser.createBrowserContext', async () => {
      const browser = createBrowser({
        createBrowserContext: jest.fn().mockResolvedValue({ id: 'ctx' }),
      });
      const puppeteerBrowser = browser as unknown as PuppeteerBrowser;
      const getBrowserInstanceSpy = jest.spyOn(
        service,
        'getBrowserInstance',
      ) as unknown as jest.Mock;
      getBrowserInstanceSpy.mockResolvedValue(puppeteerBrowser);

      const result = await service.createContext(['--test'], false, undefined);

      expect(browser.createBrowserContext).toHaveBeenCalled();
      expect(result).toEqual({ id: 'ctx' });
    });

    it('should relaunch once when browser closes while creating a context', async () => {
      const firstBrowser = createBrowser({
        createBrowserContext: jest.fn().mockRejectedValueOnce(
          Object.assign(
            new Error('Protocol error (Target.createTarget): Target closed'),
            {
              name: 'TargetCloseError',
            },
          ),
        ),
      });
      const secondBrowser = createBrowser({
        createBrowserContext: jest.fn().mockResolvedValue({ id: 'ctx-2' }),
      });

      (launch as jest.Mock)
        .mockResolvedValueOnce(firstBrowser)
        .mockResolvedValueOnce(secondBrowser);
      jest
        .spyOn(service, 'getExecutablePath')
        .mockResolvedValue('/browser/bin');

      const result = await service.createContext(['--test'], false, undefined);

      expect(launch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ id: 'ctx-2' });
    });

    it('should relaunch when the target is closed in the error message', async () => {
      const firstBrowser = createBrowser({
        createBrowserContext: jest
          .fn()
          .mockRejectedValueOnce(new Error('Target closed')),
      });
      const secondBrowser = createBrowser({
        createBrowserContext: jest.fn().mockResolvedValue({ id: 'ctx-3' }),
      });

      (launch as jest.Mock)
        .mockResolvedValueOnce(firstBrowser)
        .mockResolvedValueOnce(secondBrowser);
      jest
        .spyOn(service, 'getExecutablePath')
        .mockResolvedValue('/browser/bin');

      const result = await service.createContext(['--test'], false, undefined);

      expect(launch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ id: 'ctx-3' });
    });

    it('should relaunch when Target.createTarget appears in the error message', async () => {
      const firstBrowser = createBrowser({
        createBrowserContext: jest
          .fn()
          .mockRejectedValueOnce(
            new Error(
              'Protocol error (Target.createTarget): something went wrong',
            ),
          ),
      });
      const secondBrowser = createBrowser({
        createBrowserContext: jest.fn().mockResolvedValue({ id: 'ctx-4' }),
      });

      (launch as jest.Mock)
        .mockResolvedValueOnce(firstBrowser)
        .mockResolvedValueOnce(secondBrowser);
      jest
        .spyOn(service, 'getExecutablePath')
        .mockResolvedValue('/browser/bin');

      const result = await service.createContext(['--test'], false, undefined);

      expect(launch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ id: 'ctx-4' });
    });

    it('should rethrow when the error is not a target-closed error', async () => {
      const browser = createBrowser({
        createBrowserContext: jest
          .fn()
          .mockRejectedValueOnce(new Error('Unexpected failure')),
      });

      (launch as jest.Mock).mockResolvedValueOnce(browser);
      jest
        .spyOn(service, 'getExecutablePath')
        .mockResolvedValue('/browser/bin');

      await expect(
        service.createContext(['--test'], false, undefined),
      ).rejects.toThrow('Unexpected failure');
      expect(launch).toHaveBeenCalledTimes(1);
    });
  });

  describe('recycleBrowserIfNeeded', () => {
    it('should do nothing when recycle is not requested', async () => {
      await service.recycleBrowserIfNeeded();

      expect(launch).not.toHaveBeenCalled();
    });

    it('should recycle a connected browser when requested', async () => {
      const browser = createBrowser();
      testState(service).recycleRequested = true;
      testState(service)._browserInstance = browser;

      await service.recycleBrowserIfNeeded();

      expect(browser.close).toHaveBeenCalled();
      expect(service.totalJobs).toBe(0);
      expect(
        (service as unknown as { recycleRequested: boolean }).recycleRequested,
      ).toBe(false);
    });

    it('should keep going when browser recycle fails', async () => {
      const browser = createBrowser({
        close: jest.fn().mockRejectedValue(new Error('boom')),
      });
      testState(service).recycleRequested = true;
      testState(service)._browserInstance = browser;

      await service.recycleBrowserIfNeeded();

      expect(Logger.warn).toHaveBeenCalled();
      expect((service as unknown as { recycling: boolean }).recycling).toBe(
        false,
      );
    });
  });

  describe('install', () => {
    it('should return null when download is not allowed', async () => {
      (canDownload as jest.Mock).mockResolvedValue(false);
      const result = await service.install();

      expect(result).toBeNull();
    });

    it('should write lock file when browser is already installed', async () => {
      (getInstalledBrowsers as jest.Mock).mockResolvedValue([
        {
          browser: BrowserType.CHROMIUM,
          buildId: 'build-123',
          executablePath: '/already-installed',
        },
      ]);
      const writeLockSpy = jest
        .spyOn(testState(service), 'writeLockFile')
        .mockImplementation(() => undefined);

      const result = await service.install(true);

      expect(resolveBuildId).toHaveBeenCalled();
      expect(writeLockSpy).toHaveBeenCalledWith(
        BrowserType.CHROMIUM,
        'build-123',
      );
      expect(result).toBeUndefined();
    });

    it('should install and return executable path when missing', async () => {
      (getInstalledBrowsers as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          {
            browser: BrowserType.CHROMIUM,
            buildId: 'build-123',
            executablePath: '/installed/browser',
          },
        ]);
      const writeLockSpy = jest
        .spyOn(testState(service), 'writeLockFile')
        .mockImplementation(() => undefined);

      const result = await service.install(true);

      expect(install).toHaveBeenCalled();
      expect(writeLockSpy).toHaveBeenCalledWith(
        BrowserType.CHROMIUM,
        'build-123',
      );
      expect(result).toEqual(
        expect.objectContaining({
          executablePath: '/installed/browser',
        }),
      );
    });

    it('should call writeFileSync when the browser is already installed', async () => {
      (getInstalledBrowsers as jest.Mock).mockResolvedValue([
        {
          browser: BrowserType.CHROMIUM,
          buildId: 'build-123',
          executablePath: '/already-installed',
        },
      ]);

      const result = await service.install(true);

      expect(writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('chromium.lock'),
        expect.stringContaining('"buildId":"build-123"'),
      );
      expect(result).toBeUndefined();
    });
  });

  describe('getExecutablePath', () => {
    it('should return a locked installed browser path when lock file exists', async () => {
      testState(service).useLockedBrowser = true;
      testState(service).browser = BrowserType.CHROMIUM;
      (existsSync as jest.Mock).mockReturnValue(true);
      (readFileSync as jest.Mock).mockReturnValue(
        Buffer.from(
          JSON.stringify({
            browser: BrowserType.CHROMIUM,
            buildId: 'locked-build',
            date: '2026-01-01T00:00:00.000Z',
          }),
        ),
      );
      (getInstalledBrowsers as jest.Mock).mockResolvedValue([
        {
          browser: BrowserType.CHROMIUM,
          buildId: 'locked-build',
          executablePath: '/locked/browser',
        },
      ]);

      const result = await service.getExecutablePath();

      expect(resolveBuildId).not.toHaveBeenCalled();
      expect(result).toBe('/locked/browser');
    });

    it('should install the browser when it is missing', async () => {
      (getInstalledBrowsers as jest.Mock).mockResolvedValue([]);
      const installedBrowser = {
        browser: BrowserType.CHROMIUM,
        buildId: 'build-123',
        platform: 'linux',
        executablePath: '/downloaded/browser',
        path: '/downloaded/browser',
        folderPath: '/downloaded',
      } as unknown as InstalledBrowser;
      const installSpy = jest.spyOn(service, 'install') as unknown as jest.Mock;
      installSpy.mockResolvedValue(installedBrowser);

      const result = await service.getExecutablePath();

      expect(installSpy).toHaveBeenCalledWith();
      expect(result).toBe('/downloaded/browser');
    });

    it('should throw when installation fails', async () => {
      (getInstalledBrowsers as jest.Mock).mockResolvedValue([]);
      (
        jest.spyOn(service, 'install') as unknown as jest.Mock
      ).mockResolvedValue(null);

      await expect(service.getExecutablePath()).rejects.toThrow(
        'Could not install browser',
      );
    });
  });

  describe('cleanup and destroy', () => {
    it('should close browser on destroy and cleanup cache', async () => {
      const browser = createBrowser();
      testState(service)._browserInstance = browser;
      (existsSync as jest.Mock).mockReturnValue(true);

      await service.onModuleDestroy();

      expect(browser.close).toHaveBeenCalled();
      expect(promises.rm).toHaveBeenCalled();
      expect(promises.readdir).toHaveBeenCalled();
    });

    it('should retry cache cleanup on transient rm failure', async () => {
      testState(service)._browserInstance = null;
      (existsSync as jest.Mock)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);
      (promises.rm as jest.Mock)
        .mockRejectedValueOnce(
          Object.assign(new Error('busy'), { code: 'EPERM' }),
        )
        .mockResolvedValueOnce(undefined);

      await service.onModuleDestroy();

      expect(promises.rm).toHaveBeenCalledTimes(2);
    });
  });

  describe('locked browser id', () => {
    it('should return null when lock file does not exist', () => {
      (existsSync as jest.Mock).mockReturnValue(false);

      expect(service.getLockedBuildId(BrowserType.CHROMIUM)).toBeNull();
    });

    it('should read the lock file when it exists', () => {
      (existsSync as jest.Mock).mockReturnValue(true);

      expect(service.getLockedBuildId(BrowserType.CHROMIUM)).toBe(
        'locked-build',
      );
    });
  });

  describe('browser tag', () => {
    it('should set and get browser tag', () => {
      service.setBrowserTag(BrowserTag.STABLE);
      expect(service.getBrowserTag()).toBe(BrowserTag.STABLE);
    });
  });
});

describe('BrowserTag Enum', () => {
  it('should have all expected values', () => {
    expect(BrowserTag.LATEST).toBe('latest');
    expect(BrowserTag.BETA).toBe('beta');
    expect(BrowserTag.DEV).toBe('dev');
    expect(BrowserTag.STABLE).toBe('stable');
    expect(BrowserTag.CANARY).toBe('canary');
  });
});
