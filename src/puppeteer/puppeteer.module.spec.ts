import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';

import { PDF_PARAMETERS } from '../helpers/tokens';
import { BrowserService, BrowserTag } from './browser/browser.service';
import { PuppeteerModule } from './puppeteer.module';
import { PuppeteerService } from './puppeteer.service';
import { type PuppeteerParameters } from './puppeteer-parameters.interface';

describe('PuppeteerModule', () => {
  describe('forRoot', () => {
    let module: TestingModule;

    afterEach(async () => {
      if (module) {
        await module.close();
      }
    });

    it('should provide PuppeteerService', async () => {
      module = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot(),
          PuppeteerModule.forRoot({
            headless: true,
          }),
        ],
      }).compile();

      const service = module.get<PuppeteerService>(PuppeteerService);
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(PuppeteerService);
    });

    it('should provide PDF_PARAMETERS token', async () => {
      const pdfParams = {
        headless: false,
        browserTag: BrowserTag.STABLE,
      };

      module = await Test.createTestingModule({
        imports: [ConfigModule.forRoot(), PuppeteerModule.forRoot(pdfParams)],
      }).compile();

      const params = module.get<typeof pdfParams>(PDF_PARAMETERS);
      expect(params).toBeDefined();
      expect(params).toEqual(pdfParams);
    });

    it('should export PuppeteerService', async () => {
      module = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot(),
          PuppeteerModule.forRoot({ headless: true }),
        ],
      }).compile();

      const service = module.get<PuppeteerService>(PuppeteerService);
      expect(service).toBeDefined();
    });
  });

  describe('forRootAsync', () => {
    let module: TestingModule;

    afterEach(async () => {
      if (module) {
        await module.close();
      }
    });

    it('should provide PuppeteerService with async configuration', async () => {
      module = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot(),
          PuppeteerModule.forRootAsync({
            useFactory: () => ({
              headless: true,
            }),
          }),
        ],
      }).compile();

      const service = module.get<PuppeteerService>(PuppeteerService);
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(PuppeteerService);
    });

    it('should inject dependencies for async factory', async () => {
      const asyncFactory = vi.fn((): PuppeteerParameters => ({
        headless: true,
      }));

      module = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot(),
          PuppeteerModule.forRootAsync({
            inject: [],
            useFactory: asyncFactory,
          }),
        ],
      }).compile();

      const service = module.get<PuppeteerService>(PuppeteerService);
      expect(service).toBeDefined();
    });

    it('should resolve PDF_PARAMETERS from async factory', async () => {
      const expectedParams: PuppeteerParameters = {
        headless: false,
        useLockedBrowser: true,
      };

      module = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot(),
          PuppeteerModule.forRootAsync({
            useFactory: (): PuppeteerParameters => expectedParams,
          }),
        ],
      }).compile();

      const params: PuppeteerParameters = module.get(PDF_PARAMETERS);
      expect(params).toEqual(expectedParams);
    });

    it('should export PuppeteerService in async mode', async () => {
      const useFactory = (): PuppeteerParameters => ({
        headless: true,
      });

      module = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot(),
          PuppeteerModule.forRootAsync({
            useFactory,
          }),
        ],
      }).compile();

      const service = module.get<PuppeteerService>(PuppeteerService);
      expect(service).toBeDefined();
    });
  });

  describe('onModuleInit', () => {
    let module: TestingModule;

    afterEach(async () => {
      if (module) {
        await module.close();
      }
    });

    it('should install the browser when no executablePath is provided', async () => {
      const install = vi.fn().mockResolvedValue(undefined);

      module = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot(),
          PuppeteerModule.forRoot({ headless: true }),
        ],
      })
        .overrideProvider(BrowserService)
        .useValue({ install })
        .compile();

      await module.init();

      expect(install).toHaveBeenCalledWith(false);
    });

    it('should install the browser with the locked flag when useLockedBrowser is true', async () => {
      const install = vi.fn().mockResolvedValue(undefined);

      module = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot(),
          PuppeteerModule.forRoot({ headless: true, useLockedBrowser: true }),
        ],
      })
        .overrideProvider(BrowserService)
        .useValue({ install })
        .compile();

      await module.init();

      expect(install).toHaveBeenCalledWith(true);
    });

    it('should not install the browser when executablePath is provided', async () => {
      const install = vi.fn().mockResolvedValue(undefined);

      module = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot(),
          PuppeteerModule.forRoot({
            headless: true,
            executablePath: '/usr/bin/chromium',
          }),
        ],
      })
        .overrideProvider(BrowserService)
        .useValue({ install })
        .compile();

      await module.init();

      expect(install).not.toHaveBeenCalled();
    });
  });

  describe('module registration', () => {
    it('forRoot should return a DynamicModule', () => {
      const result = PuppeteerModule.forRoot({ headless: true });
      expect(result).toHaveProperty('module', PuppeteerModule);
      expect(result).toHaveProperty('imports');
      expect(result).toHaveProperty('providers');
      expect(result).toHaveProperty('exports');
    });

    it('forRootAsync should return a DynamicModule', () => {
      const useFactory = (): Promise<PuppeteerParameters> =>
        Promise.resolve({ headless: true });
      const result = PuppeteerModule.forRootAsync({
        useFactory,
      });
      expect(result).toHaveProperty('module', PuppeteerModule);
      expect(result).toHaveProperty('imports');
      expect(result).toHaveProperty('providers');
      expect(result).toHaveProperty('exports');
    });

    it('should include ConfigModule in forRoot imports', () => {
      const result = PuppeteerModule.forRoot({});
      expect(result.imports).toBeDefined();
      expect(Array.isArray(result.imports)).toBe(true);
      expect(result.imports?.length).toBeGreaterThan(0);
    });

    it('should include ConfigModule in forRootAsync imports', () => {
      const useFactory = (): Promise<PuppeteerParameters> =>
        Promise.resolve({});
      const result = PuppeteerModule.forRootAsync({
        useFactory,
      });
      expect(result.imports).toBeDefined();
    });
  });
});
