import { HandlebarsService } from '@gboutte/nestjs-hbs';
import { Logger, type Provider } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { type Mock, type Mocked, vi } from 'vitest';

import { PDF_PARAMETERS } from '../helpers/tokens';
import { BrowserService } from './browser/browser.service';
import { EjsService } from './engines/ejs/ejs.service';
import { EtaService } from './engines/eta/eta.service';
import { MjmlService } from './engines/mjml/mjml.service';
import { MustacheService } from './engines/mustache/mustache.service';
import { NunjucksService } from './engines/nunjucks/nunjucks.service';
import { PugService } from './engines/pug/pug.service';
import { PuppeteerService } from './puppeteer.service';

describe('PuppeteerService', () => {
  let service: PuppeteerService;
  let browserService: Mocked<BrowserService>;
  let handlebarsService: Mocked<HandlebarsService>;

  const mockBrowserService = {
    markJobStarted: vi.fn(),
    markJobFinished: vi.fn(),
    createContext: vi.fn(),
  };

  const mockHandlebarsService = {
    render: vi.fn(),
    renderFile: vi.fn(),
  };

  const mockPdfParameters = {
    headless: true,
  };

  const createServiceWithoutHandlebars = async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PuppeteerService,
        {
          provide: BrowserService,
          useValue: mockBrowserService,
        },
        {
          provide: PDF_PARAMETERS,
          useValue: mockPdfParameters,
        },
      ],
    }).compile();

    return module.get<PuppeteerService>(PuppeteerService);
  };

  const createServiceWithProviders = async (
    providers: Array<Provider> = [],
  ) => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PuppeteerService,
        {
          provide: BrowserService,
          useValue: mockBrowserService,
        },
        {
          provide: PDF_PARAMETERS,
          useValue: mockPdfParameters,
        },
        ...providers,
      ],
    }).compile();

    return module.get<PuppeteerService>(PuppeteerService);
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PuppeteerService,
        {
          provide: BrowserService,
          useValue: mockBrowserService,
        },
        {
          provide: HandlebarsService,
          useValue: mockHandlebarsService,
        },
        {
          provide: PDF_PARAMETERS,
          useValue: mockPdfParameters,
        },
      ],
    }).compile();

    service = module.get<PuppeteerService>(PuppeteerService);
    browserService = module.get(BrowserService);
    handlebarsService = module.get(HandlebarsService);

    vi.spyOn(Logger, 'error').mockImplementation(() => undefined);
    vi.spyOn(Logger, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generatePdfFromHtml', () => {
    it('should mark job started and finished', async () => {
      const mockContext = {
        newPage: vi.fn().mockResolvedValue({
          setContent: vi.fn().mockResolvedValue(undefined),
          emulateMediaType: vi.fn().mockResolvedValue(undefined),
          waitForNetworkIdle: vi.fn().mockResolvedValue(undefined),
          evaluate: vi.fn().mockResolvedValue(undefined),
          pdf: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
        }),
        close: vi.fn().mockResolvedValue(undefined),
      };

      (browserService.createContext as Mock).mockResolvedValue(mockContext);

      const html = '<h1>Test</h1>';
      await service.generatePdfFromHtml(html);

      expect(
        (browserService.markJobStarted as Mock).mock.calls.length,
      ).toBeGreaterThan(0);
      expect(
        (browserService.markJobFinished as Mock).mock.calls.length,
      ).toBeGreaterThan(0);
    });

    it('should create browser context with headless option', async () => {
      const mockContext = {
        newPage: vi.fn().mockResolvedValue({
          setContent: vi.fn().mockResolvedValue(undefined),
          emulateMediaType: vi.fn().mockResolvedValue(undefined),
          waitForNetworkIdle: vi.fn().mockResolvedValue(undefined),
          evaluate: vi.fn().mockResolvedValue(undefined),
          pdf: vi.fn().mockResolvedValue(new Uint8Array([1])),
        }),
        close: vi.fn().mockResolvedValue(undefined),
      };

      (browserService.createContext as Mock).mockResolvedValue(mockContext);

      const html = '<p>Content</p>';
      await service.generatePdfFromHtml(html);

      expect(browserService.createContext as Mock).toHaveBeenCalledWith(
        expect.any(Array),
        true, // default headless value from mockPdfParameters
        undefined,
      );
    });

    it('should set page content with waitUntil domcontentloaded', async () => {
      const mockPage = {
        setContent: vi.fn().mockResolvedValue(undefined),
        emulateMediaType: vi.fn().mockResolvedValue(undefined),
        waitForNetworkIdle: vi.fn().mockResolvedValue(undefined),
        evaluate: vi.fn().mockResolvedValue(undefined),
        pdf: vi.fn().mockResolvedValue(new Uint8Array([2])),
      };

      const mockContext = {
        newPage: vi.fn().mockResolvedValue(mockPage),
        close: vi.fn().mockResolvedValue(undefined),
      };

      browserService.createContext.mockResolvedValue(mockContext as never);

      const html = '<div>Test Content</div>';
      await service.generatePdfFromHtml(html);

      expect(mockPage.setContent).toHaveBeenCalledWith(html, {
        waitUntil: 'domcontentloaded',
      });
    });

    it('should return PDF buffer', async () => {
      const pdfBuffer = new Uint8Array([1, 2, 3, 4, 5]);
      const mockPage = {
        setContent: vi.fn().mockResolvedValue(undefined),
        emulateMediaType: vi.fn().mockResolvedValue(undefined),
        waitForNetworkIdle: vi.fn().mockResolvedValue(undefined),
        evaluate: vi.fn().mockResolvedValue(undefined),
        pdf: vi.fn().mockResolvedValue(pdfBuffer),
      };

      const mockContext = {
        newPage: vi.fn().mockResolvedValue(mockPage),
        close: vi.fn().mockResolvedValue(undefined),
      };

      browserService.createContext.mockResolvedValue(mockContext as never);

      const html = '<h1>PDF</h1>';
      const result = await service.generatePdfFromHtml(html);

      expect(result).toEqual(pdfBuffer);
    });

    it('should handle custom options', async () => {
      const mockPage = {
        setContent: vi.fn().mockResolvedValue(undefined),
        emulateMediaType: vi.fn().mockResolvedValue(undefined),
        waitForNetworkIdle: vi.fn().mockResolvedValue(undefined),
        evaluate: vi.fn().mockResolvedValue(undefined),
        pdf: vi.fn().mockResolvedValue(new Uint8Array([1])),
      };

      const mockContext = {
        newPage: vi.fn().mockResolvedValue(mockPage),
        close: vi.fn().mockResolvedValue(undefined),
      };

      (browserService.createContext as Mock).mockResolvedValue(mockContext);

      const html = '<p>Custom</p>';
      const options = { headless: false };

      await service.generatePdfFromHtml(html, options);

      expect(browserService.createContext as Mock).toHaveBeenCalledWith(
        expect.any(Array),
        false, // custom headless value,
        undefined,
      );
    });

    it('should close browser context on error', async () => {
      const mockPage = {
        setContent: vi.fn().mockRejectedValue(new Error('Page setup failed')),
        emulateMediaType: vi.fn(),
        waitForNetworkIdle: vi.fn(),
        evaluate: vi.fn(),
        pdf: vi.fn(),
      };

      const mockContext = {
        newPage: vi.fn().mockResolvedValue(mockPage),
        close: vi.fn().mockResolvedValue(undefined),
      };

      browserService.createContext.mockResolvedValue(mockContext as never);

      const html = '<h1>Error</h1>';

      await expect(service.generatePdfFromHtml(html)).rejects.toThrow(
        'Page setup failed',
      );

      expect(mockContext.close).toHaveBeenCalled();
      expect(browserService.markJobFinished).toHaveBeenCalled();
    });
  });

  describe('generatePdfFromTemplateHbsString', () => {
    it('should render template string to HTML', async () => {
      const mockPage = {
        setContent: vi.fn().mockResolvedValue(undefined),
        emulateMediaType: vi.fn().mockResolvedValue(undefined),
        waitForNetworkIdle: vi.fn().mockResolvedValue(undefined),
        evaluate: vi.fn().mockResolvedValue(undefined),
        pdf: vi.fn().mockResolvedValue(new Uint8Array([1])),
      };

      const mockContext = {
        newPage: vi.fn().mockResolvedValue(mockPage),
        close: vi.fn().mockResolvedValue(undefined),
      };

      (browserService.createContext as Mock).mockResolvedValue(mockContext);
      (handlebarsService.render as Mock).mockReturnValue(
        '<p>Rendered HTML</p>',
      );

      const template = 'Hello {{name}}';
      const parameters = { name: 'World' };

      await service.generatePdfFromTemplateHbsString(template, parameters);

      expect(handlebarsService.render as Mock).toHaveBeenCalledWith(
        template,
        parameters,
      );
      expect(mockPage.setContent).toHaveBeenCalledWith('<p>Rendered HTML</p>', {
        waitUntil: 'domcontentloaded',
      });
    });

    it('should handle empty parameters', async () => {
      const mockPage = {
        setContent: vi.fn().mockResolvedValue(undefined),
        emulateMediaType: vi.fn().mockResolvedValue(undefined),
        waitForNetworkIdle: vi.fn().mockResolvedValue(undefined),
        evaluate: vi.fn().mockResolvedValue(undefined),
        pdf: vi.fn().mockResolvedValue(new Uint8Array([1])),
      };

      const mockContext = {
        newPage: vi.fn().mockResolvedValue(mockPage),
        close: vi.fn().mockResolvedValue(undefined),
      };

      (browserService.createContext as Mock).mockResolvedValue(mockContext);
      (handlebarsService.render as Mock).mockReturnValue('<p>Static</p>');

      const template = '<p>Static</p>';

      await service.generatePdfFromTemplateHbsString(template);

      expect(handlebarsService.render as Mock).toHaveBeenCalledWith(
        template,
        {},
      );
    });

    it('should pass options to generatePdfFromHtml', async () => {
      const mockPage = {
        setContent: vi.fn().mockResolvedValue(undefined),
        emulateMediaType: vi.fn().mockResolvedValue(undefined),
        waitForNetworkIdle: vi.fn().mockResolvedValue(undefined),
        evaluate: vi.fn().mockResolvedValue(undefined),
        pdf: vi.fn().mockResolvedValue(new Uint8Array([1])),
      };

      const mockContext = {
        newPage: vi.fn().mockResolvedValue(mockPage),
        close: vi.fn().mockResolvedValue(undefined),
      };

      browserService.createContext.mockResolvedValue(mockContext as never);
      handlebarsService.render.mockReturnValue('<p>Test</p>');

      const template = 'Template';
      const parameters = { key: 'value' };
      const options = { headless: false };

      await service.generatePdfFromTemplateHbsString(
        template,
        parameters,
        options,
      );

      expect(browserService.createContext).toHaveBeenCalledWith(
        expect.any(Array),
        false,
        undefined,
      );
    });
  });

  describe('generatePdfFromTemplateHbsFile', () => {
    it('should render template file to HTML', async () => {
      const mockPage = {
        setContent: vi.fn().mockResolvedValue(undefined),
        emulateMediaType: vi.fn().mockResolvedValue(undefined),
        waitForNetworkIdle: vi.fn().mockResolvedValue(undefined),
        evaluate: vi.fn().mockResolvedValue(undefined),
        pdf: vi.fn().mockResolvedValue(new Uint8Array([1])),
      };

      const mockContext = {
        newPage: vi.fn().mockResolvedValue(mockPage),
        close: vi.fn().mockResolvedValue(undefined),
      };

      (browserService.createContext as Mock).mockResolvedValue(mockContext);
      (handlebarsService.renderFile as Mock).mockReturnValue(
        '<p>Rendered from file</p>',
      );

      const filePath = '/templates/invoice.hbs';
      const parameters = { id: '123' };

      await service.generatePdfFromTemplateHbsFile(filePath, parameters);

      expect(handlebarsService.renderFile as Mock).toHaveBeenCalledWith(
        filePath,
        parameters,
      );
      expect(mockPage.setContent).toHaveBeenCalledWith(
        '<p>Rendered from file</p>',
        {
          waitUntil: 'domcontentloaded',
        },
      );
    });

    it('should handle default parameters for file rendering', async () => {
      const mockPage = {
        setContent: vi.fn().mockResolvedValue(undefined),
        emulateMediaType: vi.fn().mockResolvedValue(undefined),
        waitForNetworkIdle: vi.fn().mockResolvedValue(undefined),
        evaluate: vi.fn().mockResolvedValue(undefined),
        pdf: vi.fn().mockResolvedValue(new Uint8Array([1])),
      };

      const mockContext = {
        newPage: vi.fn().mockResolvedValue(mockPage),
        close: vi.fn().mockResolvedValue(undefined),
      };

      (browserService.createContext as Mock).mockResolvedValue(mockContext);
      (handlebarsService.renderFile as Mock).mockReturnValue('<p>Content</p>');

      const filePath = '/path/template.hbs';

      await service.generatePdfFromTemplateHbsFile(filePath);

      expect(handlebarsService.renderFile as Mock).toHaveBeenCalledWith(
        filePath,
        {},
      );
    });
  });

  describe('generatePdfFromMjmlString', () => {
    it('should render MJML template string to HTML', async () => {
      const mjmlService = {
        render: vi.fn().mockResolvedValue('<p>Rendered MJML</p>'),
      };
      const localService = await createServiceWithProviders([
        {
          provide: MjmlService,
          useValue: mjmlService,
        },
      ]);
      const generatePdfSpy = vi
        .spyOn(localService, 'generatePdfFromHtml')
        .mockResolvedValue(new Uint8Array([1]));
      const options = { mjmlOptions: { minify: true } };

      await localService.generatePdfFromMjmlString(
        '<mjml>Hello</mjml>',
        options,
      );

      expect(mjmlService.render).toHaveBeenCalledWith(
        '<mjml>Hello</mjml>',
        options.mjmlOptions,
      );
      expect(generatePdfSpy).toHaveBeenCalledWith(
        '<p>Rendered MJML</p>',
        options,
      );
    });
  });

  describe('generatePdfFromMjmlFile', () => {
    it('should render MJML file to HTML', async () => {
      const mjmlService = {
        renderFile: vi.fn().mockResolvedValue('<p>Rendered MJML file</p>'),
      };
      const localService = await createServiceWithProviders([
        {
          provide: MjmlService,
          useValue: mjmlService,
        },
      ]);
      const generatePdfSpy = vi
        .spyOn(localService, 'generatePdfFromHtml')
        .mockResolvedValue(new Uint8Array([1]));
      const options = { mjmlOptions: { minify: false } };

      await localService.generatePdfFromMjmlFile(
        '/templates/invoice.mjml',
        options,
      );

      expect(mjmlService.renderFile).toHaveBeenCalledWith(
        '/templates/invoice.mjml',
        options.mjmlOptions,
      );
      expect(generatePdfSpy).toHaveBeenCalledWith(
        '<p>Rendered MJML file</p>',
        options,
      );
    });
  });

  describe('generatePdfFromPugString', () => {
    it('should render Pug template string to HTML', async () => {
      const pugService = {
        render: vi.fn().mockReturnValue('<p>Rendered Pug</p>'),
      };
      const localService = await createServiceWithProviders([
        {
          provide: PugService,
          useValue: pugService,
        },
      ]);
      const generatePdfSpy = vi
        .spyOn(localService, 'generatePdfFromHtml')
        .mockResolvedValue(new Uint8Array([1]));
      const options = { pugOptions: { pretty: true } };

      await localService.generatePdfFromPugString(
        'p Hello',
        { name: 'World' },
        options,
      );

      expect(pugService.render).toHaveBeenCalledWith(
        'p Hello',
        { name: 'World' },
        options.pugOptions,
      );
      expect(generatePdfSpy).toHaveBeenCalledWith(
        '<p>Rendered Pug</p>',
        options,
      );
    });
  });

  describe('generatePdfFromPugFile', () => {
    it('should render Pug file to HTML', async () => {
      const pugService = {
        renderFile: vi.fn().mockReturnValue('<p>Rendered Pug file</p>'),
      };
      const localService = await createServiceWithProviders([
        {
          provide: PugService,
          useValue: pugService,
        },
      ]);
      const generatePdfSpy = vi
        .spyOn(localService, 'generatePdfFromHtml')
        .mockResolvedValue(new Uint8Array([1]));
      const options = { pugOptions: { pretty: false } };

      await localService.generatePdfFromPugFile(
        '/templates/invoice.pug',
        { name: 'World' },
        options,
      );

      expect(pugService.renderFile).toHaveBeenCalledWith(
        '/templates/invoice.pug',
        { name: 'World' },
        options.pugOptions,
      );
      expect(generatePdfSpy).toHaveBeenCalledWith(
        '<p>Rendered Pug file</p>',
        options,
      );
    });
  });

  describe('generatePdfFromEjsString', () => {
    it('should render EJS template string to HTML', async () => {
      const ejsService = {
        render: vi.fn().mockResolvedValue('<p>Rendered EJS</p>'),
      };
      const localService = await createServiceWithProviders([
        {
          provide: EjsService,
          useValue: ejsService,
        },
      ]);
      const generatePdfSpy = vi
        .spyOn(localService, 'generatePdfFromHtml')
        .mockResolvedValue(new Uint8Array([1]));
      const options = { ejsOptions: { async: false } };

      await localService.generatePdfFromEjsString(
        '<h1><%= title %></h1>',
        { title: 'Hello' },
        options,
      );

      expect(ejsService.render).toHaveBeenCalledWith(
        '<h1><%= title %></h1>',
        { title: 'Hello' },
        options.ejsOptions,
      );
      expect(generatePdfSpy).toHaveBeenCalledWith(
        '<p>Rendered EJS</p>',
        options,
      );
    });
  });

  describe('generatePdfFromEjsFile', () => {
    it('should render EJS file to HTML', async () => {
      const ejsService = {
        renderFile: vi.fn().mockResolvedValue('<p>Rendered EJS file</p>'),
      };
      const localService = await createServiceWithProviders([
        {
          provide: EjsService,
          useValue: ejsService,
        },
      ]);
      const generatePdfSpy = vi
        .spyOn(localService, 'generatePdfFromHtml')
        .mockResolvedValue(new Uint8Array([1]));
      const options = { ejsOptions: { async: true } };

      await localService.generatePdfFromEjsFile(
        '/templates/invoice.ejs',
        { title: 'Hello' },
        options,
      );

      expect(ejsService.renderFile).toHaveBeenCalledWith(
        '/templates/invoice.ejs',
        { title: 'Hello' },
        options.ejsOptions,
      );
      expect(generatePdfSpy).toHaveBeenCalledWith(
        '<p>Rendered EJS file</p>',
        options,
      );
    });
  });

  describe('generatePdfFromNunjucksString', () => {
    it('should render Nunjucks template string to HTML', async () => {
      const nunjucksService = {
        render: vi.fn().mockReturnValue('<p>Rendered Nunjucks</p>'),
      };
      const localService = await createServiceWithProviders([
        {
          provide: NunjucksService,
          useValue: nunjucksService,
        },
      ]);
      const generatePdfSpy = vi
        .spyOn(localService, 'generatePdfFromHtml')
        .mockResolvedValue(new Uint8Array([1]));
      const options = { nunjucksOptions: { throwOnUndefined: true } };

      await localService.generatePdfFromNunjucksString(
        '{{ title }}',
        { title: 'Hello' },
        options,
      );

      expect(nunjucksService.render).toHaveBeenCalledWith(
        '{{ title }}',
        { title: 'Hello' },
        options.nunjucksOptions,
      );
      expect(generatePdfSpy).toHaveBeenCalledWith(
        '<p>Rendered Nunjucks</p>',
        options,
      );
    });
  });

  describe('generatePdfFromNunjucksFile', () => {
    it('should render Nunjucks file to HTML', async () => {
      const nunjucksService = {
        renderFile: vi.fn().mockReturnValue('<p>Rendered Nunjucks file</p>'),
      };
      const localService = await createServiceWithProviders([
        {
          provide: NunjucksService,
          useValue: nunjucksService,
        },
      ]);
      const generatePdfSpy = vi
        .spyOn(localService, 'generatePdfFromHtml')
        .mockResolvedValue(new Uint8Array([1]));
      const options = { nunjucksOptions: { throwOnUndefined: false } };

      await localService.generatePdfFromNunjucksFile(
        '/templates/invoice.njk',
        { title: 'Hello' },
        options,
      );

      expect(nunjucksService.renderFile).toHaveBeenCalledWith(
        '/templates/invoice.njk',
        { title: 'Hello' },
        options.nunjucksOptions,
      );
      expect(generatePdfSpy).toHaveBeenCalledWith(
        '<p>Rendered Nunjucks file</p>',
        options,
      );
    });
  });

  describe('generatePdfFromEtaString', () => {
    it('should render Eta template string to HTML', async () => {
      const etaService = {
        render: vi.fn().mockReturnValue('<p>Rendered Eta</p>'),
      };
      const localService = await createServiceWithProviders([
        {
          provide: EtaService,
          useValue: etaService,
        },
      ]);
      const generatePdfSpy = vi
        .spyOn(localService, 'generatePdfFromHtml')
        .mockResolvedValue(new Uint8Array([1]));
      const options = { etaOptions: { cache: false } };

      await localService.generatePdfFromEtaString(
        '<%~ it.title %>',
        { title: 'Hello' },
        options,
      );

      expect(etaService.render).toHaveBeenCalledWith(
        '<%~ it.title %>',
        { title: 'Hello' },
        options.etaOptions,
      );
      expect(generatePdfSpy).toHaveBeenCalledWith(
        '<p>Rendered Eta</p>',
        options,
      );
    });
  });

  describe('generatePdfFromEtaFile', () => {
    it('should render Eta file to HTML', async () => {
      const etaService = {
        renderFile: vi.fn().mockReturnValue('<p>Rendered Eta file</p>'),
      };
      const localService = await createServiceWithProviders([
        {
          provide: EtaService,
          useValue: etaService,
        },
      ]);
      const generatePdfSpy = vi
        .spyOn(localService, 'generatePdfFromHtml')
        .mockResolvedValue(new Uint8Array([1]));
      const options = { etaOptions: { cache: true } };

      await localService.generatePdfFromEtaFile(
        '/templates/invoice.eta',
        { title: 'Hello' },
        options,
      );

      expect(etaService.renderFile).toHaveBeenCalledWith(
        '/templates/invoice.eta',
        { title: 'Hello' },
        options.etaOptions,
      );
      expect(generatePdfSpy).toHaveBeenCalledWith(
        '<p>Rendered Eta file</p>',
        options,
      );
    });
  });

  describe('generatePdfFromMustacheString', () => {
    it('should render Mustache template string to HTML', async () => {
      const mustacheService = {
        render: vi.fn().mockReturnValue('<p>Rendered Mustache</p>'),
      };
      const localService = await createServiceWithProviders([
        {
          provide: MustacheService,
          useValue: mustacheService,
        },
      ]);
      const generatePdfSpy = vi
        .spyOn(localService, 'generatePdfFromHtml')
        .mockResolvedValue(new Uint8Array([1]));
      const options = {
        mustacheOptions: { tags: ['<%', '%>'] as [string, string] },
      };

      await localService.generatePdfFromMustacheString(
        '<% title %>',
        { title: 'Hello' },
        options,
      );

      expect(mustacheService.render).toHaveBeenCalledWith(
        '<% title %>',
        { title: 'Hello' },
        options.mustacheOptions,
      );
      expect(generatePdfSpy).toHaveBeenCalledWith(
        '<p>Rendered Mustache</p>',
        options,
      );
    });
  });

  describe('generatePdfFromMustacheFile', () => {
    it('should render Mustache file to HTML', async () => {
      const mustacheService = {
        renderFile: vi.fn().mockReturnValue('<p>Rendered Mustache file</p>'),
      };
      const localService = await createServiceWithProviders([
        {
          provide: MustacheService,
          useValue: mustacheService,
        },
      ]);
      const generatePdfSpy = vi
        .spyOn(localService, 'generatePdfFromHtml')
        .mockResolvedValue(new Uint8Array([1]));
      const options = {
        mustacheOptions: { tags: ['[[', ']]'] as [string, string] },
      };

      await localService.generatePdfFromMustacheFile(
        '/templates/invoice.mustache',
        { title: 'Hello' },
        options,
      );

      expect(mustacheService.renderFile).toHaveBeenCalledWith(
        '/templates/invoice.mustache',
        { title: 'Hello' },
        options.mustacheOptions,
      );
      expect(generatePdfSpy).toHaveBeenCalledWith(
        '<p>Rendered Mustache file</p>',
        options,
      );
    });
  });

  describe('when Handlebars service is unavailable', () => {
    it.each([
      [
        'generatePdfFromTemplateHbsString',
        async (localService: PuppeteerService) =>
          localService.generatePdfFromTemplateHbsString('Hello {{name}}', {
            name: 'World',
          }),
      ],
      [
        'generatePdfFromTemplateHbsFile',
        async (localService: PuppeteerService) =>
          localService.generatePdfFromTemplateHbsFile(
            '/templates/invoice.hbs',
            { id: '123' },
          ),
      ],
    ])('should throw from %s', async (_, invoke) => {
      const localService = await createServiceWithoutHandlebars();

      await expect(invoke(localService)).rejects.toThrow(
        'Handlebars service is not available. If the problem persists, open an issue in the repo.',
      );
    });
  });
});
