import { Test, TestingModule } from '@nestjs/testing';
import { PuppeteerService } from './puppeteer.service';
import { BrowserService } from './browser/browser.service';
import { PDF_PARAMETERS } from '../helpers/tokens';
import { HandlebarsService } from '@gboutte/nestjs-hbs';
import { Logger, Provider } from '@nestjs/common';
import { MjmlService } from './engines/mjml/mjml.service';
import { PugService } from './engines/pug/pug.service';
import { EjsService } from './engines/ejs/ejs.service';
import { NunjucksService } from './engines/nunjucks/nunjucks.service';
import { EtaService } from './engines/eta/eta.service';
import { MustacheService } from './engines/mustache/mustache.service';

describe('PuppeteerService', () => {
  let service: PuppeteerService;
  let browserService: jest.Mocked<BrowserService>;
  let handlebarsService: jest.Mocked<HandlebarsService>;

  const mockBrowserService = {
    markJobStarted: jest.fn(),
    markJobFinished: jest.fn(),
    createContext: jest.fn(),
  };

  const mockHandlebarsService = {
    render: jest.fn(),
    renderFile: jest.fn(),
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

  const createServiceWithProviders = async (providers: Provider[] = []) => {
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

    jest.spyOn(Logger, 'error').mockImplementation(() => undefined);
    jest.spyOn(Logger, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generatePdfFromHtml', () => {
    it('should mark job started and finished', async () => {
      const mockContext = {
        newPage: jest.fn().mockResolvedValue({
          setContent: jest.fn().mockResolvedValue(undefined),
          emulateMediaType: jest.fn().mockResolvedValue(undefined),
          waitForNetworkIdle: jest.fn().mockResolvedValue(undefined),
          evaluate: jest.fn().mockResolvedValue(undefined),
          pdf: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
        }),
        close: jest.fn().mockResolvedValue(undefined),
      };

      (browserService.createContext as jest.Mock).mockResolvedValue(
        mockContext,
      );

      const html = '<h1>Test</h1>';
      await service.generatePdfFromHtml(html);

      expect(
        (browserService.markJobStarted as jest.Mock).mock.calls.length,
      ).toBeGreaterThan(0);
      expect(
        (browserService.markJobFinished as jest.Mock).mock.calls.length,
      ).toBeGreaterThan(0);
    });

    it('should create browser context with headless option', async () => {
      const mockContext = {
        newPage: jest.fn().mockResolvedValue({
          setContent: jest.fn().mockResolvedValue(undefined),
          emulateMediaType: jest.fn().mockResolvedValue(undefined),
          waitForNetworkIdle: jest.fn().mockResolvedValue(undefined),
          evaluate: jest.fn().mockResolvedValue(undefined),
          pdf: jest.fn().mockResolvedValue(new Uint8Array([1])),
        }),
        close: jest.fn().mockResolvedValue(undefined),
      };

      (browserService.createContext as jest.Mock).mockResolvedValue(
        mockContext,
      );

      const html = '<p>Content</p>';
      await service.generatePdfFromHtml(html);

      expect(browserService.createContext as jest.Mock).toHaveBeenCalledWith(
        expect.any(Array),
        true, // default headless value from mockPdfParameters
        undefined,
      );
    });

    it('should set page content with waitUntil domcontentloaded', async () => {
      const mockPage = {
        setContent: jest.fn().mockResolvedValue(undefined),
        emulateMediaType: jest.fn().mockResolvedValue(undefined),
        waitForNetworkIdle: jest.fn().mockResolvedValue(undefined),
        evaluate: jest.fn().mockResolvedValue(undefined),
        pdf: jest.fn().mockResolvedValue(new Uint8Array([2])),
      };

      const mockContext = {
        newPage: jest.fn().mockResolvedValue(mockPage),
        close: jest.fn().mockResolvedValue(undefined),
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
        setContent: jest.fn().mockResolvedValue(undefined),
        emulateMediaType: jest.fn().mockResolvedValue(undefined),
        waitForNetworkIdle: jest.fn().mockResolvedValue(undefined),
        evaluate: jest.fn().mockResolvedValue(undefined),
        pdf: jest.fn().mockResolvedValue(pdfBuffer),
      };

      const mockContext = {
        newPage: jest.fn().mockResolvedValue(mockPage),
        close: jest.fn().mockResolvedValue(undefined),
      };

      browserService.createContext.mockResolvedValue(mockContext as never);

      const html = '<h1>PDF</h1>';
      const result = await service.generatePdfFromHtml(html);

      expect(result).toEqual(pdfBuffer);
    });

    it('should handle custom options', async () => {
      const mockPage = {
        setContent: jest.fn().mockResolvedValue(undefined),
        emulateMediaType: jest.fn().mockResolvedValue(undefined),
        waitForNetworkIdle: jest.fn().mockResolvedValue(undefined),
        evaluate: jest.fn().mockResolvedValue(undefined),
        pdf: jest.fn().mockResolvedValue(new Uint8Array([1])),
      };

      const mockContext = {
        newPage: jest.fn().mockResolvedValue(mockPage),
        close: jest.fn().mockResolvedValue(undefined),
      };

      (browserService.createContext as jest.Mock).mockResolvedValue(
        mockContext,
      );

      const html = '<p>Custom</p>';
      const options = { headless: false };

      await service.generatePdfFromHtml(html, options);

      expect(browserService.createContext as jest.Mock).toHaveBeenCalledWith(
        expect.any(Array),
        false, // custom headless value,
        undefined,
      );
    });

    it('should close browser context on error', async () => {
      const mockPage = {
        setContent: jest.fn().mockRejectedValue(new Error('Page setup failed')),
        emulateMediaType: jest.fn(),
        waitForNetworkIdle: jest.fn(),
        evaluate: jest.fn(),
        pdf: jest.fn(),
      };

      const mockContext = {
        newPage: jest.fn().mockResolvedValue(mockPage),
        close: jest.fn().mockResolvedValue(undefined),
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
        setContent: jest.fn().mockResolvedValue(undefined),
        emulateMediaType: jest.fn().mockResolvedValue(undefined),
        waitForNetworkIdle: jest.fn().mockResolvedValue(undefined),
        evaluate: jest.fn().mockResolvedValue(undefined),
        pdf: jest.fn().mockResolvedValue(new Uint8Array([1])),
      };

      const mockContext = {
        newPage: jest.fn().mockResolvedValue(mockPage),
        close: jest.fn().mockResolvedValue(undefined),
      };

      (browserService.createContext as jest.Mock).mockResolvedValue(
        mockContext,
      );
      (handlebarsService.render as jest.Mock).mockReturnValue(
        '<p>Rendered HTML</p>',
      );

      const template = 'Hello {{name}}';
      const parameters = { name: 'World' };

      await service.generatePdfFromTemplateHbsString(template, parameters);

      expect(handlebarsService.render as jest.Mock).toHaveBeenCalledWith(
        template,
        parameters,
      );
      expect(mockPage.setContent).toHaveBeenCalledWith('<p>Rendered HTML</p>', {
        waitUntil: 'domcontentloaded',
      });
    });

    it('should handle empty parameters', async () => {
      const mockPage = {
        setContent: jest.fn().mockResolvedValue(undefined),
        emulateMediaType: jest.fn().mockResolvedValue(undefined),
        waitForNetworkIdle: jest.fn().mockResolvedValue(undefined),
        evaluate: jest.fn().mockResolvedValue(undefined),
        pdf: jest.fn().mockResolvedValue(new Uint8Array([1])),
      };

      const mockContext = {
        newPage: jest.fn().mockResolvedValue(mockPage),
        close: jest.fn().mockResolvedValue(undefined),
      };

      (browserService.createContext as jest.Mock).mockResolvedValue(
        mockContext,
      );
      (handlebarsService.render as jest.Mock).mockReturnValue('<p>Static</p>');

      const template = '<p>Static</p>';

      await service.generatePdfFromTemplateHbsString(template);

      expect(handlebarsService.render as jest.Mock).toHaveBeenCalledWith(
        template,
        {},
      );
    });

    it('should pass options to generatePdfFromHtml', async () => {
      const mockPage = {
        setContent: jest.fn().mockResolvedValue(undefined),
        emulateMediaType: jest.fn().mockResolvedValue(undefined),
        waitForNetworkIdle: jest.fn().mockResolvedValue(undefined),
        evaluate: jest.fn().mockResolvedValue(undefined),
        pdf: jest.fn().mockResolvedValue(new Uint8Array([1])),
      };

      const mockContext = {
        newPage: jest.fn().mockResolvedValue(mockPage),
        close: jest.fn().mockResolvedValue(undefined),
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
        setContent: jest.fn().mockResolvedValue(undefined),
        emulateMediaType: jest.fn().mockResolvedValue(undefined),
        waitForNetworkIdle: jest.fn().mockResolvedValue(undefined),
        evaluate: jest.fn().mockResolvedValue(undefined),
        pdf: jest.fn().mockResolvedValue(new Uint8Array([1])),
      };

      const mockContext = {
        newPage: jest.fn().mockResolvedValue(mockPage),
        close: jest.fn().mockResolvedValue(undefined),
      };

      (browserService.createContext as jest.Mock).mockResolvedValue(
        mockContext,
      );
      (handlebarsService.renderFile as jest.Mock).mockReturnValue(
        '<p>Rendered from file</p>',
      );

      const filePath = '/templates/invoice.hbs';
      const parameters = { id: '123' };

      await service.generatePdfFromTemplateHbsFile(filePath, parameters);

      expect(handlebarsService.renderFile as jest.Mock).toHaveBeenCalledWith(
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
        setContent: jest.fn().mockResolvedValue(undefined),
        emulateMediaType: jest.fn().mockResolvedValue(undefined),
        waitForNetworkIdle: jest.fn().mockResolvedValue(undefined),
        evaluate: jest.fn().mockResolvedValue(undefined),
        pdf: jest.fn().mockResolvedValue(new Uint8Array([1])),
      };

      const mockContext = {
        newPage: jest.fn().mockResolvedValue(mockPage),
        close: jest.fn().mockResolvedValue(undefined),
      };

      (browserService.createContext as jest.Mock).mockResolvedValue(
        mockContext,
      );
      (handlebarsService.renderFile as jest.Mock).mockReturnValue(
        '<p>Content</p>',
      );

      const filePath = '/path/template.hbs';

      await service.generatePdfFromTemplateHbsFile(filePath);

      expect(handlebarsService.renderFile as jest.Mock).toHaveBeenCalledWith(
        filePath,
        {},
      );
    });
  });

  describe('generatePdfFromMjmlString', () => {
    it('should render MJML template string to HTML', async () => {
      const mjmlService = {
        render: jest.fn().mockResolvedValue('<p>Rendered MJML</p>'),
      };
      const localService = await createServiceWithProviders([
        {
          provide: MjmlService,
          useValue: mjmlService,
        },
      ]);
      const generatePdfSpy = jest
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
        renderFile: jest.fn().mockResolvedValue('<p>Rendered MJML file</p>'),
      };
      const localService = await createServiceWithProviders([
        {
          provide: MjmlService,
          useValue: mjmlService,
        },
      ]);
      const generatePdfSpy = jest
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
        render: jest.fn().mockReturnValue('<p>Rendered Pug</p>'),
      };
      const localService = await createServiceWithProviders([
        {
          provide: PugService,
          useValue: pugService,
        },
      ]);
      const generatePdfSpy = jest
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
        renderFile: jest.fn().mockReturnValue('<p>Rendered Pug file</p>'),
      };
      const localService = await createServiceWithProviders([
        {
          provide: PugService,
          useValue: pugService,
        },
      ]);
      const generatePdfSpy = jest
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
        render: jest.fn().mockResolvedValue('<p>Rendered EJS</p>'),
      };
      const localService = await createServiceWithProviders([
        {
          provide: EjsService,
          useValue: ejsService,
        },
      ]);
      const generatePdfSpy = jest
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
        renderFile: jest.fn().mockResolvedValue('<p>Rendered EJS file</p>'),
      };
      const localService = await createServiceWithProviders([
        {
          provide: EjsService,
          useValue: ejsService,
        },
      ]);
      const generatePdfSpy = jest
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
        render: jest.fn().mockReturnValue('<p>Rendered Nunjucks</p>'),
      };
      const localService = await createServiceWithProviders([
        {
          provide: NunjucksService,
          useValue: nunjucksService,
        },
      ]);
      const generatePdfSpy = jest
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
        renderFile: jest.fn().mockReturnValue('<p>Rendered Nunjucks file</p>'),
      };
      const localService = await createServiceWithProviders([
        {
          provide: NunjucksService,
          useValue: nunjucksService,
        },
      ]);
      const generatePdfSpy = jest
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
        render: jest.fn().mockReturnValue('<p>Rendered Eta</p>'),
      };
      const localService = await createServiceWithProviders([
        {
          provide: EtaService,
          useValue: etaService,
        },
      ]);
      const generatePdfSpy = jest
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
        renderFile: jest.fn().mockReturnValue('<p>Rendered Eta file</p>'),
      };
      const localService = await createServiceWithProviders([
        {
          provide: EtaService,
          useValue: etaService,
        },
      ]);
      const generatePdfSpy = jest
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
        render: jest.fn().mockReturnValue('<p>Rendered Mustache</p>'),
      };
      const localService = await createServiceWithProviders([
        {
          provide: MustacheService,
          useValue: mustacheService,
        },
      ]);
      const generatePdfSpy = jest
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
        renderFile: jest.fn().mockReturnValue('<p>Rendered Mustache file</p>'),
      };
      const localService = await createServiceWithProviders([
        {
          provide: MustacheService,
          useValue: mustacheService,
        },
      ]);
      const generatePdfSpy = jest
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
