import { mergePuppeteerParameters } from './deepMergePdfparams';
import { PuppeteerParameters } from '../puppeteer-parameters.interface';
import { BrowserTag } from '@/puppeteer/browser.service';

describe('mergePuppeteerParameters', () => {
  describe('basic merging', () => {
    it('should merge two objects', () => {
      const defaults: PuppeteerParameters = {
        headless: true,
      };

      const overrides: PuppeteerParameters = {
        headless: false,
      };

      const result = mergePuppeteerParameters(defaults, overrides);

      expect(result.headless).toBe(false);
    });

    it('should keep default values when no override is provided', () => {
      const defaults: PuppeteerParameters = {
        headless: true,
        browserTag: BrowserTag.STABLE,
      };

      const result = mergePuppeteerParameters(defaults);

      expect(result.headless).toBe(true);
      expect(result.browserTag).toBe('stable');
    });

    it('should return a shallow copy when no overrides', () => {
      const defaults: PuppeteerParameters = {
        headless: true,
      };

      const result = mergePuppeteerParameters(defaults);

      expect(result).toEqual(defaults);
      expect(result).not.toBe(defaults); // Should be a new object
    });
  });

  describe('complex object merging', () => {
    it('should deep merge pdfOptions', () => {
      const defaults: PuppeteerParameters = {
        pdfOptions: {
          format: 'A4' as const,
          margin: {
            top: '10mm',
            bottom: '10mm',
            left: '5mm',
            right: '5mm',
          },
        },
      };

      const overrides: PuppeteerParameters = {
        pdfOptions: {
          format: 'Letter' as const,
        },
      };

      const result = mergePuppeteerParameters(defaults, overrides);

      expect(result.pdfOptions?.format).toBe('Letter');
      // Deep merge should preserve margin
      expect(result.pdfOptions?.margin).toBeDefined();
    });

    it('should deep merge hbsOptions', () => {
      const defaults: PuppeteerParameters = {
        hbsOptions: {
          templateDirectory: '/templates',
          partialDirectory: '/partials',
        },
      };

      const overrides: PuppeteerParameters = {
        hbsOptions: {
          templateDirectory: '/other',
        },
      };

      const result = mergePuppeteerParameters(defaults, overrides);

      expect(result.hbsOptions?.templateDirectory).toBe('/other');
      expect(result.hbsOptions?.partialDirectory).toBe('/partials');
    });

    it('should handle empty objects', () => {
      const defaults: PuppeteerParameters = {};
      const overrides: PuppeteerParameters = {};

      const result = mergePuppeteerParameters(defaults, overrides);

      expect(result).toEqual({});
    });
  });

  describe('array handling', () => {
    it('should merge arrays (deepmerge behavior)', () => {
      const defaults: PuppeteerParameters = {
        extraPuppeteerArgs: ['--disable-gpu', '--no-sandbox'],
      };

      const overrides: PuppeteerParameters = {
        extraPuppeteerArgs: ['--headless=chrome'],
      };

      const result = mergePuppeteerParameters(defaults, overrides);

      // deepmerge-ts merges arrays by concatenation
      expect(result.extraPuppeteerArgs).toContain('--disable-gpu');
      expect(result.extraPuppeteerArgs).toContain('--no-sandbox');
      expect(result.extraPuppeteerArgs).toContain('--headless=chrome');
    });

    it('should preserve array from defaults if no override', () => {
      const defaults: PuppeteerParameters = {
        extraPuppeteerArgs: ['--disable-gpu', '--no-sandbox'],
      };

      const result = mergePuppeteerParameters(defaults);

      expect(result.extraPuppeteerArgs).toEqual([
        '--disable-gpu',
        '--no-sandbox',
      ]);
    });
  });

  describe('edge cases', () => {
    it('should handle null values in defaults', () => {
      const defaults: PuppeteerParameters = {
        headless: true,
        pdfOptions: {},
      };

      const overrides: PuppeteerParameters = {
        pdfOptions: { format: 'A4' as const },
      };

      const result = mergePuppeteerParameters(defaults, overrides);

      expect(result.pdfOptions).toEqual({ format: 'A4' });
    });

    it('should handle undefined values correctly', () => {
      const defaults: PuppeteerParameters = {
        headless: true,
        buildId: 'default-123',
      };

      const overrides: PuppeteerParameters = {
        buildId: undefined,
        browserTag: BrowserTag.STABLE,
      };

      const result = mergePuppeteerParameters(defaults, overrides);

      //undefined values should not override defaults
      expect(result.headless).toBe(true);
      expect(result.browserTag).toBe('stable');
    });

    it('should handle boolean false values correctly', () => {
      const defaults: PuppeteerParameters = {
        headless: true,
        useLockedBrowser: true,
        cleanupBrowserCacheOnExit: true,
      };

      const overrides: PuppeteerParameters = {
        headless: false,
        useLockedBrowser: false,
        cleanupBrowserCacheOnExit: false,
      };

      const result = mergePuppeteerParameters(defaults, overrides);

      expect(result.headless).toBe(false);
      expect(result.useLockedBrowser).toBe(false);
      expect(result.cleanupBrowserCacheOnExit).toBe(false);
    });
  });

  describe('all properties', () => {
    it('should merge all parameter properties', () => {
      const defaults: PuppeteerParameters = {
        pdfOptions: { format: 'A4' as const },
        hbsOptions: { templateDirectory: '/templates' },
        chromiumRevision: '1234',
        buildId: 'chrome-123',
        headless: true,
        useLockedBrowser: false,
        browserInstallBaseUrl: 'https://example.com',
        extraPuppeteerArgs: ['--disable-gpu'],
        cleanupBrowserCacheOnExit: true,
      };

      const overrides: PuppeteerParameters = {
        headless: false,
        useLockedBrowser: true,
      };

      const result = mergePuppeteerParameters(defaults, overrides);

      expect(result.pdfOptions).toBeDefined();
      expect(result.hbsOptions).toBeDefined();
      expect(result.chromiumRevision).toBeDefined();
      expect(result.buildId).toBeDefined();
      expect(result.headless).toBe(false);
      expect(result.useLockedBrowser).toBe(true);
      expect(result.browserInstallBaseUrl).toBeDefined();
      expect(result.extraPuppeteerArgs).toBeDefined();
      expect(result.cleanupBrowserCacheOnExit).toBeDefined();
    });
  });

  describe('all properties', () => {
    it('should merge all parameter properties', () => {
      const defaults: PuppeteerParameters = {
        pdfOptions: { format: 'A4' as const },
        hbsOptions: { templateDirectory: '/templates' },
        chromiumRevision: '1234',
        buildId: 'chrome-123',
        headless: true,
        browserTag: BrowserTag.STABLE,
        useLockedBrowser: false,
        browserInstallBaseUrl: 'https://example.com',
        extraPuppeteerArgs: ['--disable-gpu'],
        cleanupBrowserCacheOnExit: true,
      };

      const overrides: PuppeteerParameters = {
        headless: false,
        browserTag: BrowserTag.LATEST,
        useLockedBrowser: true,
      };

      const result = mergePuppeteerParameters(defaults, overrides);

      // Check all properties are present
      expect(result.pdfOptions).toBeDefined();
      expect(result.hbsOptions).toBeDefined();
      expect(result.chromiumRevision).toBeDefined();
      expect(result.buildId).toBeDefined();
      expect(result.headless).toBe(false);
      expect(result.browserTag).toBe('latest');
      expect(result.useLockedBrowser).toBe(true);
      expect(result.browserInstallBaseUrl).toBeDefined();
      expect(result.extraPuppeteerArgs).toBeDefined();
      expect(result.cleanupBrowserCacheOnExit).toBeDefined();
    });
  });

  describe('immutability', () => {
    it('should not mutate the defaults object', () => {
      const defaults: PuppeteerParameters = {
        headless: true,
      };

      const overrides: PuppeteerParameters = {
        headless: false,
      };

      const defaultsBefore = JSON.stringify(defaults);
      mergePuppeteerParameters(defaults, overrides);
      const defaultsAfter = JSON.stringify(defaults);

      expect(defaultsBefore).toBe(defaultsAfter);
      expect(defaults.headless).toBe(true);
    });

    it('should not mutate the overrides object', () => {
      const defaults: PuppeteerParameters = {
        headless: true,
        buildId: 'stable',
      };

      const overrides: PuppeteerParameters = {
        headless: false,
      };

      const overridesBefore = JSON.stringify(overrides);
      mergePuppeteerParameters(defaults, overrides);
      const overridesAfter = JSON.stringify(overrides);

      expect(overridesBefore).toBe(overridesAfter);
    });
  });
});
