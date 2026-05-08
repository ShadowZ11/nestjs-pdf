import { Test, TestingModule } from '@nestjs/testing';
import { NestjsPdfService } from './nestjs-pdf.service';
import { PuppeteerService } from './puppeteer/puppeteer.service';

describe('NestjsPdfService', () => {
  let service: NestjsPdfService;
  let puppeteerService: jest.Mocked<PuppeteerService>;

  const mockPuppeteerService = {
    generatePdfFromHtml: jest.fn(),
    generatePdfFromTemplateString: jest.fn(),
    generatePdfFromTemplateFile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NestjsPdfService,
        {
          provide: PuppeteerService,
          useValue: mockPuppeteerService,
        },
      ],
    }).compile();

    service = module.get<NestjsPdfService>(NestjsPdfService);
    puppeteerService = module.get(PuppeteerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generatePdfFromHtml', () => {
    it('should delegate to puppeteerService.generatePdfFromHtml', async () => {
      const html = '<h1>Test</h1>';
      const mockPdf = new Uint8Array([1, 2, 3]);
      const spy = jest
        .spyOn(puppeteerService, 'generatePdfFromHtml')
        .mockResolvedValue(mockPdf);

      const result = await service.generatePdfFromHtml(html);

      expect(spy).toHaveBeenCalledWith(html, undefined);
      expect(result).toEqual(mockPdf);
    });

    it('should pass options to puppeteerService', async () => {
      const html = '<p>Content</p>';
      const options = { headless: false };
      const mockPdf = new Uint8Array([4, 5, 6]);
      const spy = jest
        .spyOn(puppeteerService, 'generatePdfFromHtml')
        .mockResolvedValue(mockPdf);

      const result = await service.generatePdfFromHtml(html, options);

      expect(spy).toHaveBeenCalledWith(html, options);
      expect(result).toEqual(mockPdf);
    });

    it('should propagate errors from puppeteerService', async () => {
      const html = '<h1>Error</h1>';
      const error = new Error('PDF generation failed');
      jest
        .spyOn(puppeteerService, 'generatePdfFromHtml')
        .mockRejectedValue(error);

      await expect(service.generatePdfFromHtml(html)).rejects.toThrow(error);
    });
  });

  describe('generatePdfFromTemplateString', () => {
    it('should delegate to puppeteerService.generatePdfFromTemplateString', async () => {
      const template = 'Hello {{name}}!';
      const parameters = { name: 'John' };
      const mockPdf = new Uint8Array([7, 8, 9]);
      const spy = jest
        .spyOn(puppeteerService, 'generatePdfFromTemplateString')
        .mockResolvedValue(mockPdf);

      const result = await service.generatePdfFromTemplateString(
        template,
        parameters,
      );

      expect(spy).toHaveBeenCalledWith(template, parameters, undefined);
      expect(result).toEqual(mockPdf);
    });

    it('should handle default parameters', async () => {
      const template = 'Test';
      const mockPdf = new Uint8Array([10, 11]);
      const spy = jest
        .spyOn(puppeteerService, 'generatePdfFromTemplateString')
        .mockResolvedValue(mockPdf);

      const result = await service.generatePdfFromTemplateString(template);

      expect(spy).toHaveBeenCalledWith(template, {}, undefined);
      expect(result).toEqual(mockPdf);
    });

    it('should pass custom options', async () => {
      const template = 'Invoice {{id}}';
      const parameters = { id: '12345' };
      const options = { pdfOptions: { format: 'A4' as const } };
      const mockPdf = new Uint8Array([12, 13]);
      const spy = jest
        .spyOn(puppeteerService, 'generatePdfFromTemplateString')
        .mockResolvedValue(mockPdf);

      await service.generatePdfFromTemplateString(
        template,
        parameters,
        options,
      );

      expect(spy).toHaveBeenCalledWith(template, parameters, options);
    });
  });

  describe('generatePdfFromTemplateFile', () => {
    it('should delegate to puppeteerService.generatePdfFromTemplateFile', async () => {
      const filePath = '/path/to/template.hbs';
      const parameters = { title: 'Document' };
      const mockPdf = new Uint8Array([14, 15, 16]);
      const spy = jest
        .spyOn(puppeteerService, 'generatePdfFromTemplateFile')
        .mockResolvedValue(mockPdf);

      const result = await service.generatePdfFromTemplateFile(
        filePath,
        parameters,
      );

      expect(spy).toHaveBeenCalledWith(filePath, parameters, undefined);
      expect(result).toEqual(mockPdf);
    });

    it('should handle default parameters', async () => {
      const filePath = '/path/to/template.hbs';
      const mockPdf = new Uint8Array([17, 18]);
      const spy = jest
        .spyOn(puppeteerService, 'generatePdfFromTemplateFile')
        .mockResolvedValue(mockPdf);

      await service.generatePdfFromTemplateFile(filePath);

      expect(spy).toHaveBeenCalledWith(filePath, {}, undefined);
    });

    it('should pass options through', async () => {
      const filePath = '/templates/invoice.hbs';
      const parameters = { amount: '100' };
      const options = { headless: true };
      const mockPdf = new Uint8Array([19, 20]);
      const spy = jest
        .spyOn(puppeteerService, 'generatePdfFromTemplateFile')
        .mockResolvedValue(mockPdf);

      await service.generatePdfFromTemplateFile(filePath, parameters, options);

      expect(spy).toHaveBeenCalledWith(filePath, parameters, options);
    });
  });
});
