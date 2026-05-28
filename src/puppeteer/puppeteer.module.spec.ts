import { Test, TestingModule } from '@nestjs/testing';
import { PuppeteerModule } from './puppeteer.module';
import { PuppeteerService } from './puppeteer.service';
import { PDF_PARAMETERS, HANDLEBARS_PARAMETERS } from '../helpers/tokens';
import { ConfigModule } from '@nestjs/config';
import { PuppeteerParameters } from './puppeteer-parameters.interface';
import { BrowserTag } from './browser/browser.service';

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

    it('should provide HANDLEBARS_PARAMETERS token', async () => {
      const hbsOptions = { templateDirectory: '/templates' };
      const pdfParams: PuppeteerParameters = {
        headless: false,
        hbsOptions,
      };

      module = await Test.createTestingModule({
        imports: [ConfigModule.forRoot(), PuppeteerModule.forRoot(pdfParams)],
      }).compile();

      const params = module.get<typeof hbsOptions>(HANDLEBARS_PARAMETERS);
      expect(params).toBeDefined();
      expect(params).toEqual(hbsOptions);
    });

    it('should provide HANDLEBARS_PARAMETERS with default empty object', async () => {
      module = await Test.createTestingModule({
        imports: [ConfigModule.forRoot(), PuppeteerModule.forRoot({})],
      }).compile();

      const params = module.get<Record<string, never>>(HANDLEBARS_PARAMETERS);
      expect(params).toEqual({});
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
      const asyncFactory = jest.fn(
        (): PuppeteerParameters => ({
          headless: true,
        }),
      );

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

    it('should resolve HANDLEBARS_PARAMETERS from PDF_PARAMETERS', async () => {
      const hbsOptions = { templateDirectory: '/templates' };

      const useFactory = (): PuppeteerParameters => ({
        headless: true,
        hbsOptions,
      });

      module = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot(),
          PuppeteerModule.forRootAsync({
            useFactory,
          }),
        ],
      }).compile();

      const params = module.get<typeof hbsOptions>(HANDLEBARS_PARAMETERS);
      expect(params).toEqual(hbsOptions);
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
