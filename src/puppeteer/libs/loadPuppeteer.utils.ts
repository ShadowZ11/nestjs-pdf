import type * as PuppeteerBrowsers from '@puppeteer/browsers';
import type * as Puppeteer from 'puppeteer';

import { EngineNotAvailableException } from '../../exceptions';

function isMissingPackage(error: unknown, packageName: string): boolean {
  const { code, message } = error as NodeJS.ErrnoException;
  return (
    (code === 'ERR_MODULE_NOT_FOUND' || code === 'MODULE_NOT_FOUND') &&
    typeof message === 'string' &&
    message.includes(`'${packageName}'`)
  );
}

/** Imports an optional peer dependency, turning "not installed" into a clear exception. */
export async function loadOptional<T>(
  packageName: string,
  importer: () => Promise<T>,
): Promise<T> {
  try {
    return await importer();
  } catch (error) {
    if (isMissingPackage(error, packageName)) {
      throw new EngineNotAvailableException('Puppeteer', packageName, {
        cause: error,
      });
    }
    throw error;
  }
}

/**
 * Puppeteer is an optional peer dependency, only needed by the `puppeteer`
 * provider: it is imported on first use, never when the library loads.
 */
export function loadPuppeteer(): Promise<typeof Puppeteer> {
  return loadOptional('puppeteer', () => import('puppeteer'));
}

export function loadPuppeteerBrowsers(): Promise<typeof PuppeteerBrowsers> {
  return loadOptional(
    '@puppeteer/browsers',
    () => import('@puppeteer/browsers'),
  );
}
