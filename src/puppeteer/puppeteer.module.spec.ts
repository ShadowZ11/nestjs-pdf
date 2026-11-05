import { Test, type TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';

import { RendererConfigurationException } from '../exceptions';
import { PDF_PARAMETERS } from '../helpers/tokens';
import { Api2PdfRenderer } from '../renderers/api2pdf.renderer';
import { GotenbergRenderer } from '../renderers/gotenberg.renderer';
import { PDF_RENDERER } from '../renderers/pdf-renderer.interface';
import { PuppeteerRenderer } from '../renderers/puppeteer.renderer';
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
        imports: [PuppeteerModule.forRoot(pdfParams)],
      }).compile();

      const params = module.get<typeof pdfParams>(PDF_PARAMETERS);
      expect(params).toBeDefined();
      expect(params).toEqual(pdfParams);
    });

    it('should export PuppeteerService', async () => {
      module = await Test.createTestingModule({
        imports: [PuppeteerModule.forRoot({ headless: true })],
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
        imports: [PuppeteerModule.forRoot({ headless: true })],
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
          PuppeteerModule.forRoot({ headless: true, useLockedBrowser: true }),
        ],
      })
        .overrideProvider(BrowserService)
        .useValue({ install })
        .compile();

      await module.init();

      expect(install).toHaveBeenCalledWith(true);
    });

    it.each([
      { type: 'gotenberg' as const, url: 'http://gotenberg:3000' },
      { type: 'api2pdf' as const, apiKey: 'key' },
    ])(
      'should not install the browser with the $type provider',
      async (provider) => {
        const install = vi.fn().mockResolvedValue(undefined);

        module = await Test.createTestingModule({
          imports: [PuppeteerModule.forRoot({ provider })],
        })
          .overrideProvider(BrowserService)
          .useValue({ install })
          .compile();

        await module.init();

        expect(install).not.toHaveBeenCalled();
      },
    );

    it('should not install the browser when executablePath is provided', async () => {
      const install = vi.fn().mockResolvedValue(undefined);

      module = await Test.createTestingModule({
        imports: [
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

  describe('PDF renderer', () => {
    let module: TestingModule;

    afterEach(async () => {
      if (module) {
        await module.close();
      }
    });

    it.each([
      [undefined, PuppeteerRenderer],
      [{ type: 'puppeteer' as const }, PuppeteerRenderer],
      [
        { type: 'gotenberg' as const, url: 'http://gotenberg:3000' },
        GotenbergRenderer,
      ],
      [{ type: 'api2pdf' as const, apiKey: 'key' }, Api2PdfRenderer],
    ])(
      'should build the renderer of provider %j',
      async (provider, expected) => {
        module = await Test.createTestingModule({
          imports: [PuppeteerModule.forRoot({ provider })],
        }).compile();

        expect(module.get(PDF_RENDERER)).toBeInstanceOf(expected);
      },
    );

    it('should build the renderer from an async configuration', async () => {
      module = await Test.createTestingModule({
        imports: [
          PuppeteerModule.forRootAsync({
            useFactory: () => ({
              provider: { type: 'gotenberg', url: 'http://gotenberg:3000' },
            }),
          }),
        ],
      }).compile();

      expect(module.get(PDF_RENDERER)).toBeInstanceOf(GotenbergRenderer);
    });

    it('should fail fast on an invalid provider configuration', async () => {
      await expect(
        Test.createTestingModule({
          imports: [
            PuppeteerModule.forRoot({
              provider: { type: 'api2pdf', apiKey: '' },
            }),
          ],
        }).compile(),
      ).rejects.toBeInstanceOf(RendererConfigurationException);
    });
  });

  describe('module registration', () => {
    it('forRoot should return a DynamicModule', () => {
      const result = PuppeteerModule.forRoot({ headless: true });
      expect(result).toHaveProperty('module', PuppeteerModule);
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

    it('should not add any imports in forRoot', () => {
      const result = PuppeteerModule.forRoot({});
      expect(result.imports).toBeUndefined();
    });

    it('should only forward the given imports in forRootAsync', () => {
      const useFactory = (): Promise<PuppeteerParameters> =>
        Promise.resolve({});
      const withoutImports = PuppeteerModule.forRootAsync({ useFactory });
      class SomeModule {}
      const withImports = PuppeteerModule.forRootAsync({
        imports: [SomeModule],
        useFactory,
      });
      expect(withoutImports.imports).toEqual([]);
      expect(withImports.imports).toEqual([SomeModule]);
    });
  });
});
