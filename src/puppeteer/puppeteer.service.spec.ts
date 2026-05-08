import { Test, TestingModule } from '@nestjs/testing';
import { PuppeteerService } from './puppeteer.service';
import { BrowserService } from './browser.service';
import { PDF_PARAMETERS } from './helpers/tokens';
import { HandlebarsService } from '@gboutte/nestjs-hbs';
import { Logger } from '@nestjs/common';

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

      browserService.createContext.mockResolvedValue(mockContext as any);

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

      browserService.createContext.mockResolvedValue(mockContext as any);

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
        false, // custom headless value
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

      browserService.createContext.mockResolvedValue(mockContext as any);

      const html = '<h1>Error</h1>';

      await expect(service.generatePdfFromHtml(html)).rejects.toThrow(
        'Page setup failed',
      );

      expect(mockContext.close).toHaveBeenCalled();
      expect(browserService.markJobFinished).toHaveBeenCalled();
    });
  });

  describe('generatePdfFromTemplateString', () => {
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

      await service.generatePdfFromTemplateString(template, parameters);

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

      await service.generatePdfFromTemplateString(template);

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

      browserService.createContext.mockResolvedValue(mockContext as any);
      handlebarsService.render.mockReturnValue('<p>Test</p>');

      const template = 'Template';
      const parameters = { key: 'value' };
      const options = { headless: false };

      await service.generatePdfFromTemplateString(
        template,
        parameters,
        options,
      );

      expect(browserService.createContext).toHaveBeenCalledWith(
        expect.any(Array),
        false,
      );
    });
  });

  describe('generatePdfFromTemplateFile', () => {
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

      await service.generatePdfFromTemplateFile(filePath, parameters);

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

      await service.generatePdfFromTemplateFile(filePath);

      expect(handlebarsService.renderFile as jest.Mock).toHaveBeenCalledWith(
        filePath,
        {},
      );
    });
  });
});
