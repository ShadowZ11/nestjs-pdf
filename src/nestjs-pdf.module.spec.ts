import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';

import { NestjsPdfModule } from './nestjs-pdf.module';
import { NestjsPdfService } from './nestjs-pdf.service';
import { BrowserTag } from './puppeteer/browser/browser.service';

describe('NestjsPdfModule', () => {
  describe('forRoot', () => {
    let module: TestingModule;

    afterEach(async () => {
      if (module) {
        await module.close();
      }
    });

    it('should provide NestjsPdfService', async () => {
      module = await Test.createTestingModule({
        imports: [
          NestjsPdfModule.forRoot({
            headless: true,
          }),
        ],
      }).compile();

      const service = module.get<NestjsPdfService>(NestjsPdfService);
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(NestjsPdfService);
    });

    it('should export NestjsPdfService', async () => {
      const imports = [
        NestjsPdfModule.forRoot({
          headless: true,
        }),
      ];

      module = await Test.createTestingModule({
        imports,
      }).compile();

      const service = module.get<NestjsPdfService>(NestjsPdfService);
      expect(service).toBeDefined();
    });

    it('should pass options to PuppeteerModule', async () => {
      const options = {
        headless: false,
        browserTag: BrowserTag.STABLE,
        cleanupBrowserCacheOnExit: true,
      };

      module = await Test.createTestingModule({
        imports: [NestjsPdfModule.forRoot(options)],
      }).compile();

      const service = module.get<NestjsPdfService>(NestjsPdfService);
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

    it('should provide NestjsPdfService with async configuration', async () => {
      module = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot(),
          NestjsPdfModule.forRootAsync({
            useFactory: () => ({
              headless: true,
            }),
          }),
        ],
      }).compile();

      const service = module.get<NestjsPdfService>(NestjsPdfService);
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(NestjsPdfService);
    });

    it('should inject dependencies for async factory', async () => {
      module = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot(),
          NestjsPdfModule.forRootAsync({
            useFactory: () => ({
              headless: true,
            }),
          }),
        ],
      }).compile();

      const service = module.get<NestjsPdfService>(NestjsPdfService);
      expect(service).toBeDefined();
    });

    it('should handle async factory with parameters', async () => {
      const asyncFactory = vi.fn().mockResolvedValue({
        headless: true,
        browserTag: 'latest' as const,
      });

      module = await Test.createTestingModule({
        imports: [
          NestjsPdfModule.forRootAsync({
            useFactory: asyncFactory,
          }),
        ],
      }).compile();

      const service = module.get<NestjsPdfService>(NestjsPdfService);
      expect(service).toBeDefined();
      expect(asyncFactory).toHaveBeenCalled();
    });
  });

  describe('module registration', () => {
    it('forRoot should return a DynamicModule', () => {
      const result = NestjsPdfModule.forRoot({});
      expect(result).toHaveProperty('module', NestjsPdfModule);
      expect(result).toHaveProperty('imports');
      expect(result).toHaveProperty('providers');
      expect(result).toHaveProperty('exports');
    });

    it('forRootAsync should return a DynamicModule', () => {
      const result = NestjsPdfModule.forRootAsync({
        useFactory: () => ({}),
      });
      expect(result).toHaveProperty('module', NestjsPdfModule);
      expect(result).toHaveProperty('imports');
      expect(result).toHaveProperty('providers');
      expect(result).toHaveProperty('exports');
    });
  });
});
