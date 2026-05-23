import { Test, TestingModule } from '@nestjs/testing';
import { NestjsPdfModule } from './nestjs-pdf.module';
import { NestjsPdfService } from './nestjs-pdf.service';
import { ConfigModule } from '@nestjs/config';
import { BrowserTag } from './puppeteer/browser/browser.service';

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
      expect(pdfService).toHaveProperty('generatePdfFromTemplateHbsString');
      expect(pdfService).toHaveProperty('generatePdfFromTemplateHbsFile');
      expect(pdfService).toHaveProperty('addSignatureFieldSignatureDebtorRaw');
    });

    it('should have all required methods', () => {
      expect(typeof pdfService.generatePdfFromHtml).toBe('function');
      expect(typeof pdfService.generatePdfFromTemplateHbsString).toBe(
        'function',
      );
      expect(typeof pdfService.generatePdfFromTemplateHbsFile).toBe('function');
      expect(typeof pdfService.addSignatureFieldSignatureDebtorRaw).toBe(
        'function',
      );
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
      expect(pdfService).toHaveProperty('addSignatureFieldSignatureDebtorRaw');
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
