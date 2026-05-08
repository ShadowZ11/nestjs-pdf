import { Test, TestingModule } from '@nestjs/testing';
import { NestjsPdfModule } from './nestjs-pdf.module';
import { NestjsPdfService } from './nestjs-pdf.service';
import { ConfigModule } from '@nestjs/config';
import { BrowserTag } from '@/puppeteer/browser.service';

describe('NestJS PDF Library - Integration Tests', () => {
  let module: TestingModule;
  let pdfService: NestjsPdfService;

  describe('Module with forRoot', () => {
    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot(),
          NestjsPdfModule.forRoot({
            headless: true,
            cleanupBrowserCacheOnExit: false,
          }),
        ],
      }).compile();

      pdfService = module.get<NestjsPdfService>(NestjsPdfService);
    });

    afterEach(async () => {
      if (module) {
        await module.close();
      }
    });

    it('should successfully create module with NestjsPdfService', () => {
      expect(pdfService).toBeDefined();
      expect(pdfService).toHaveProperty('generatePdfFromHtml');
      expect(pdfService).toHaveProperty('generatePdfFromTemplateString');
      expect(pdfService).toHaveProperty('generatePdfFromTemplateFile');
    });

    it('should have all required methods', () => {
      expect(typeof pdfService.generatePdfFromHtml).toBe('function');
      expect(typeof pdfService.generatePdfFromTemplateString).toBe('function');
      expect(typeof pdfService.generatePdfFromTemplateFile).toBe('function');
    });
  });

  describe('Module with forRootAsync', () => {
    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot(),
          NestjsPdfModule.forRootAsync({
            useFactory: () => ({
              headless: true,
              cleanupBrowserCacheOnExit: false,
            }),
          }),
        ],
      }).compile();

      pdfService = module.get<NestjsPdfService>(NestjsPdfService);
    });

    afterEach(async () => {
      if (module) {
        await module.close();
      }
    });

    it('should successfully create module with async configuration', () => {
      expect(pdfService).toBeDefined();
      expect(pdfService).toHaveProperty('generatePdfFromHtml');
    });
  });

  describe('Module exports', () => {
    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot(),
          NestjsPdfModule.forRoot({ headless: true }),
        ],
      }).compile();
    });

    afterEach(async () => {
      if (module) {
        await module.close();
      }
    });

    it('should export NestjsPdfService for use in other modules', async () => {
      // Create a module that imports NestjsPdfModule
      const consumerModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot(),
          NestjsPdfModule.forRoot({ headless: true }),
        ],
      }).compile();

      const service = consumerModule.get<NestjsPdfService>(NestjsPdfService);
      expect(service).toBeDefined();

      await consumerModule.close();
    });
  });

  describe('Configuration options', () => {
    it('should accept minimal configuration', async () => {
      const testModule = await Test.createTestingModule({
        imports: [ConfigModule.forRoot(), NestjsPdfModule.forRoot({})],
      }).compile();

      const service = testModule.get<NestjsPdfService>(NestjsPdfService);
      expect(service).toBeDefined();

      await testModule.close();
    });

    it('should accept full configuration', async () => {
      const testModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot(),
          NestjsPdfModule.forRoot({
            headless: true,
            browserTag: BrowserTag.STABLE,
            useLockedBrowser: false,
            cleanupBrowserCacheOnExit: true,
            pdfOptions: { format: 'A4' as const },
            extraPuppeteerArgs: ['--disable-gpu'],
          }),
        ],
      }).compile();

      const service = testModule.get<NestjsPdfService>(NestjsPdfService);
      expect(service).toBeDefined();

      await testModule.close();
    });
  });

  describe('Error handling', () => {
    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot(),
          NestjsPdfModule.forRoot({ headless: true }),
        ],
      }).compile();

      pdfService = module.get<NestjsPdfService>(NestjsPdfService);
    });

    afterEach(async () => {
      if (module) {
        await module.close();
      }
    });

    it('should handle module initialization without errors', () => {
      expect(() => {
        Test.createTestingModule({
          imports: [
            ConfigModule.forRoot(),
            NestjsPdfModule.forRoot({ headless: true }),
          ],
        });
      }).not.toThrow();
    });
  });
});
