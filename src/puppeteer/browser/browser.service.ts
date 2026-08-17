import { existsSync, promises, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import {
  Browser as BrowserType,
  BrowserPlatform,
  canDownload,
  detectBrowserPlatform,
  getInstalledBrowsers,
  install,
  resolveBuildId,
} from '@puppeteer/browsers';
import { Browser, BrowserContext, launch } from 'puppeteer';

import type { PuppeteerParameters } from '../puppeteer-parameters.interface';

export enum BrowserTag {
  LATEST = 'latest',
  BETA = 'beta',
  DEV = 'dev',
  STABLE = 'stable',
  CANARY = 'canary',
}

export type Headless = boolean | 'shell' | undefined;

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function rmWithRetries(dir: string, retries = 5): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await promises.rm(dir, { recursive: true, force: true });
      return;
    } catch (err: unknown) {
      const code = (err as NodeJS.ErrnoException)?.code;

      const retryable =
        code === 'EPERM' || code === 'EBUSY' || code === 'ENOTEMPTY';

      if (!retryable || attempt === retries) {
        throw err;
      }

      await sleep(50 * 2 ** (attempt - 1));
    }
  }
}

function isTargetClosedError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  return (
    error.name === 'TargetCloseError' ||
    error.message.includes('Target closed') ||
    error.message.includes('Target.createTarget')
  );
}

@Injectable()
export class BrowserService implements OnModuleDestroy {
  private readonly cacheDir: string;
  private readonly options?: PuppeteerParameters;

  private _browserInstance: Browser | null = null;
  private browser: BrowserType;

  public activeJobs = 0;
  public totalJobs = 0;

  private recycleRequested = false;
  private recycling = false;

  private browserTag: BrowserTag;
  private useLockedBrowser: boolean;
  private buildId: string | undefined;

  constructor(@Inject('PDF_PARAMETERS') pdfParams: PuppeteerParameters) {
    this.cacheDir = resolve('.cache/puppeteer-browser');
    this.options = pdfParams;

    if (pdfParams.cleanupBrowserCacheOnExit) {
      this.registerCleanupHooks();
    }

    this.loadBuildId();
    this.loadBrowser();
    this.loadBrowserTag();
    this.loadUseLockedBrowser();
  }

  async onModuleDestroy() {
    if (this._browserInstance?.connected) {
      try {
        await this._browserInstance.close();
      } catch (error) {
        Logger.warn(
          `Failed to close browser on module destroy: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    await this.cleanupCacheBestEffort();
  }

  async getBrowserInstance(
    args: Array<string>,
    headless: boolean | 'shell' | undefined,
    executablePathBin: string | undefined,
  ) {
    if (!this._browserInstance?.connected) {
      this._browserInstance = await this.launchBrowser(
        args,
        headless,
        executablePathBin,
      );
    }

    return this._browserInstance;
  }

  async createContext(
    args: Array<string>,
    headless: Headless,
    executablePath?: string,
  ): Promise<BrowserContext> {
    const browser = await this.getBrowserInstance(
      args,
      headless,
      executablePath,
    );
    try {
      return await browser.createBrowserContext();
    } catch (error) {
      if (!isTargetClosedError(error)) {
        throw error;
      }

      Logger.warn(
        'Puppeteer browser closed while creating a context, retrying once',
      );

      this._browserInstance = null;
      const freshBrowser = await this.getBrowserInstance(
        args,
        headless,
        executablePath,
      );
      return await freshBrowser.createBrowserContext();
    }
  }

  markJobStarted() {
    this.activeJobs += 1;
    this.totalJobs += 1;

    if (this.totalJobs >= 200) {
      this.recycleRequested = true;
    }
  }

  async markJobFinished() {
    this.activeJobs = Math.max(0, this.activeJobs - 1);
    await this.recycleBrowserIfNeeded();
  }

  async recycleBrowserIfNeeded() {
    if (!this.recycleRequested) return;
    if (this.recycling) return;
    if (this.activeJobs > 0) return;
    if (!this._browserInstance) return;

    this.recycling = true;

    try {
      if (this._browserInstance.connected) {
        await this._browserInstance.close();
      }

      this._browserInstance = null;
      this.totalJobs = 0;
      this.recycleRequested = false;

      Logger.log('Puppeteer browser recycled successfully');
    } catch (error) {
      Logger.warn(
        `Failed to recycle browser: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    } finally {
      this.recycling = false;
    }
  }

  private async cleanupCacheBestEffort() {
    const logger = new Logger('NestJsPdf');
    const dir = this.cacheDir;
    try {
      if (!existsSync(dir)) return;

      logger.log(`Cleanup puppeteer cache on signal: ${dir}`);

      await rmWithRetries(dir, 6);
      if (existsSync(dir)) {
        await sleep(100);
        await rmWithRetries(dir, 3);
      }

      logger.log('Cleanup done');
    } catch (err) {
      logger.error(
        `Cleanup failed for ${dir}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
    try {
      const leftover = await promises.readdir(dir, { recursive: true });
      logger.warn(`Leftover files: ${leftover.slice(0, 20).join(', ')}...`);
    } catch {
      logger.log(`No leftover files in ${dir}`);
    }
  }

  async install(lock: boolean = false) {
    const browser: BrowserType = this.browser;
    const versionTag: BrowserTag = this.browserTag;

    const browserPlatform = detectBrowserPlatform() ?? BrowserPlatform.LINUX;

    let buildId: string;
    if (this.buildId === undefined) {
      buildId = await resolveBuildId(browser, browserPlatform, versionTag);
    } else {
      buildId = this.buildId;
    }

    Logger.log(
      `Browser ${browser} ${versionTag} build id: ${buildId}`,
      'NestJsPdf',
    );

    if (await this.hasBrowserInstalled(browser, buildId)) {
      Logger.log('Browser already installed', 'NestJsPdf');
      if (lock) {
        this.writeLockFile(browser, buildId);
      }
      return;
    } else {
      Logger.log('Starting browser installation', 'NestJsPdf');

      const installOption = {
        cacheDir: this.cacheDir,
        browser: browser,
        buildId: buildId,
        baseUrl: this.options?.browserInstallBaseUrl ?? undefined,
      };

      if (await canDownload(installOption)) {
        Logger.log(
          `Installing ${installOption.browser} ${installOption.buildId}`,
          'NestJsPdf',
        );
        const installedBrowser = await install(installOption);
        if (await this.hasBrowserInstalled(browser, buildId)) {
          Logger.log('Browser installed successfully', 'NestJsPdf');
          if (lock) {
            this.writeLockFile(browser, buildId);
          }
          return installedBrowser;
        } else {
          Logger.error('Browser installation failed', 'NestJsPdf');
        }
      } else {
        Logger.error(
          `Error, can't install ${installOption.browser} ${installOption.buildId}`,
          'NestJsPdf',
        );
      }
    }
    return null;
  }

  private registerCleanupHooks() {
    const cleanup = async (signal: string) => {
      try {
        Logger.log(
          `Received ${signal}, cleaning up puppeteer cache...`,
          'NestJsPdf',
        );
        await this.cleanupCacheBestEffort();
        process.exit(0);
      } catch {
        process.exit(1);
      }
    };

    const cleanupHandler = (signal: string) => {
      void cleanup(signal);
    };

    process.once('SIGTERM', cleanupHandler);
    process.once('SIGINT', cleanupHandler); // ctrl+c
    process.once('exit', cleanupHandler);
  }

  private loadBrowser(): void {
    let browser: BrowserType;
    if (this.options?.browser === undefined) {
      browser = BrowserType.CHROMIUM;
    } else {
      browser = this.options.browser;
    }
    this.browser = browser;
  }

  public setBrowser(browser: BrowserType): void {
    this.browser = browser;
  }

  public getBrowser(): BrowserType {
    return this.browser;
  }

  private loadBrowserTag(): void {
    let versionTag: BrowserTag;
    if (this.options?.browserTag === undefined) {
      if (this.browser === BrowserType.CHROMIUM) {
        versionTag = BrowserTag.LATEST;
      } else {
        versionTag = BrowserTag.STABLE;
      }
    } else {
      versionTag = this.options.browserTag;
    }
    this.browserTag = versionTag;
  }

  private loadBuildId(): void {
    let buildId: string | undefined;
    if (this.options?.buildId === undefined) {
      buildId = undefined;
    } else {
      buildId = this.options.buildId;
    }
    this.buildId = buildId;
  }

  public setBrowserTag(browserTag: BrowserTag): void {
    this.browserTag = browserTag;
  }

  public getBrowserTag(): BrowserTag {
    return this.browserTag;
  }

  getBuildId(): string | undefined {
    return this.buildId;
  }

  setBuildId(value: string | undefined) {
    this.buildId = value;
  }

  private loadUseLockedBrowser(): void {
    let useLockedBrowser: boolean;
    if (this.options?.useLockedBrowser === undefined) {
      useLockedBrowser = false;
    } else {
      useLockedBrowser = this.options.useLockedBrowser;
    }
    this.useLockedBrowser = useLockedBrowser;
  }

  async hasBrowserInstalled(browser: BrowserType, buildId: string) {
    const installedBrowserlist = await getInstalledBrowsers({
      cacheDir: this.cacheDir,
    });

    const installedBrowser = installedBrowserlist.find((insBrowser) => {
      return insBrowser.browser === browser && insBrowser.buildId === buildId;
    });
    return installedBrowser !== undefined;
  }

  async getExecutablePath(): Promise<string> {
    const browser: BrowserType = this.browser;
    const versionTag: BrowserTag = this.browserTag;
    const browserPlatform = detectBrowserPlatform() ?? BrowserPlatform.LINUX;
    let buildId: string | null = null;
    if (this.useLockedBrowser) {
      buildId = this.getLockedBuildId(browser);
      Logger.log(`Using locked browser ${buildId}`, 'NestJsPdf');
    }
    buildId ??= await resolveBuildId(browser, browserPlatform, versionTag);
    const installedBrowserlist = await getInstalledBrowsers({
      cacheDir: this.cacheDir,
    });
    const installedBrowser = installedBrowserlist.find((insBrowser) => {
      return insBrowser.browser === browser && insBrowser.buildId === buildId;
    });
    if (installedBrowser === undefined) {
      const newinstalledBrowser = await this.install();
      if (newinstalledBrowser === null || newinstalledBrowser === undefined) {
        throw new Error('Could not install browser');
      } else {
        return newinstalledBrowser.executablePath;
      }
    }
    return installedBrowser.executablePath;
  }

  private async launchBrowser(
    args: Array<string>,
    headless: Headless,
    executablePathBin: string | undefined,
  ) {
    const executablePath =
      executablePathBin ?? (await this.getExecutablePath());

    const browser = await launch({
      executablePath,
      headless,
      args,
    });

    browser.on('disconnected', () => {
      Logger.warn('Puppeteer browser disconnected');
      if (this._browserInstance === browser) {
        this._browserInstance = null;
      }
    });

    return browser;
  }

  private writeLockFile(browser: BrowserType, buildId: string) {
    const lockFile = resolve(this.cacheDir, `${browser}.lock`);
    const data = JSON.stringify({
      browser: browser,
      buildId: buildId,
      date: new Date().toISOString(),
    });
    writeFileSync(lockFile, data);

    Logger.log(`Browser ${browser} locked to build ${buildId}`, 'NestJsPdf');
  }

  getLockedBuildId(browser: BrowserType): string | null {
    const lockFile = resolve(this.cacheDir, `${browser}.lock`);
    if (existsSync(lockFile)) {
      const data = readFileSync(lockFile);
      const lock = JSON.parse(data.toString()) as {
        browser: Browser;
        buildId: string;
        date: string;
      };
      return lock.buildId;
    }
    return null;
  }
}
