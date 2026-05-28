import { Test, TestingModule } from '@nestjs/testing';
import { NestjsPdfService } from './nestjs-pdf.service';
import { PuppeteerService } from './puppeteer/puppeteer.service';
import { addSignatureFieldUsingAnchor } from './helpers/signature.helper';

jest.mock('@/helpers/signature.helper', () => ({
  addSignatureFieldUsingAnchor: jest.fn(),
}));

describe('NestjsPdfService', () => {
  let service: NestjsPdfService;
  let puppeteerService: jest.Mocked<PuppeteerService>;
  let signatureHelper: jest.MockedFunction<typeof addSignatureFieldUsingAnchor>;

  const mockPuppeteerService = {
    generatePdfFromHtml: jest.fn(),
    generatePdfFromTemplateHbsString: jest.fn(),
    generatePdfFromTemplateHbsFile: jest.fn(),
    generatePdfFromMjmlString: jest.fn(),
    generatePdfFromMjmlFile: jest.fn(),
    generatePdfFromEjsString: jest.fn(),
    generatePdfFromEjsFile: jest.fn(),
    generatePdfFromPugString: jest.fn(),
    generatePdfFromPugFile: jest.fn(),
    generatePdfFromNunjucksString: jest.fn(),
    generatePdfFromNunjucksFile: jest.fn(),
    generatePdfFromEtaString: jest.fn(),
    generatePdfFromEtaFile: jest.fn(),
    generatePdfFromMustacheString: jest.fn(),
    generatePdfFromMustacheFile: jest.fn(),
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
    signatureHelper = jest.mocked(addSignatureFieldUsingAnchor);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generatePdfFromHtml', () => {
    it('should delegate to puppeteerService.generatePdfFromHtml', async () => {
      const html = '<p>Hello John!</p>';
      const options = { pdfOptions: { format: 'A4' as const } };
      const mockPdf = new Uint8Array([1, 2, 3]);
      const spy = jest
        .spyOn(puppeteerService, 'generatePdfFromHtml')
        .mockResolvedValue(mockPdf);
      const result = await service.generatePdfFromHtml(html, options);
      expect(spy).toHaveBeenCalledWith(html, options);
      expect(result).toEqual(mockPdf);
    });

    it('should delegate to puppeteerService.generatePdfFromHtml with undefined options by default', async () => {
      const html = '<p>Hello default!</p>';
      const mockPdf = new Uint8Array([4, 5, 6]);
      const spy = jest
        .spyOn(puppeteerService, 'generatePdfFromHtml')
        .mockResolvedValue(mockPdf);
      const result = await service.generatePdfFromHtml(html);
      expect(spy).toHaveBeenCalledWith(html, undefined);
      expect(result).toEqual(mockPdf);
    });

    it('should propagate errors from puppeteerService.generatePdfFromHtml', async () => {
      const html = '<p>Hello error!</p>';
      const error = new Error('PDF generation failed');
      jest
        .spyOn(puppeteerService, 'generatePdfFromHtml')
        .mockRejectedValue(error);
      await expect(service.generatePdfFromHtml(html)).rejects.toThrow(
        'PDF generation failed',
      );
    });
  });

  describe('generatePdfFromTemplateHbsString', () => {
    it('should delegate to puppeteerService.generatePdfFromTemplateHbsString', async () => {
      const template = 'Hello {{name}}!';
      const parameters = { name: 'John' };
      const mockPdf = new Uint8Array([7, 8, 9]);
      const spy = jest
        .spyOn(puppeteerService, 'generatePdfFromTemplateHbsString')
        .mockResolvedValue(mockPdf);

      const result = await service.generatePdfFromTemplateHbsString(
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
        .spyOn(puppeteerService, 'generatePdfFromTemplateHbsString')
        .mockResolvedValue(mockPdf);

      const result = await service.generatePdfFromTemplateHbsString(template);

      expect(spy).toHaveBeenCalledWith(template, {}, undefined);
      expect(result).toEqual(mockPdf);
    });

    it('should pass custom options', async () => {
      const template = 'Invoice {{id}}';
      const parameters = { id: '12345' };
      const options = { pdfOptions: { format: 'A4' as const } };
      const mockPdf = new Uint8Array([12, 13]);
      const spy = jest
        .spyOn(puppeteerService, 'generatePdfFromTemplateHbsString')
        .mockResolvedValue(mockPdf);

      await service.generatePdfFromTemplateHbsString(
        template,
        parameters,
        options,
      );

      expect(spy).toHaveBeenCalledWith(template, parameters, options);
    });
  });

  describe('generatePdfFromTemplateHbsFile', () => {
    it('should delegate to puppeteerService.generatePdfFromTemplateHbsFile', async () => {
      const filePath = '/path/to/template.hbs';
      const parameters = { title: 'Document' };
      const mockPdf = new Uint8Array([14, 15, 16]);
      const spy = jest
        .spyOn(puppeteerService, 'generatePdfFromTemplateHbsFile')
        .mockResolvedValue(mockPdf);

      const result = await service.generatePdfFromTemplateHbsFile(
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
        .spyOn(puppeteerService, 'generatePdfFromTemplateHbsFile')
        .mockResolvedValue(mockPdf);

      await service.generatePdfFromTemplateHbsFile(filePath);

      expect(spy).toHaveBeenCalledWith(filePath, {}, undefined);
    });

    it('should pass options through', async () => {
      const filePath = '/templates/invoice.hbs';
      const parameters = { amount: '100' };
      const options = { headless: true };
      const mockPdf = new Uint8Array([19, 20]);
      const spy = jest
        .spyOn(puppeteerService, 'generatePdfFromTemplateHbsFile')
        .mockResolvedValue(mockPdf);

      await service.generatePdfFromTemplateHbsFile(
        filePath,
        parameters,
        options,
      );

      expect(spy).toHaveBeenCalledWith(filePath, parameters, options);
    });
  });

  describe('generatePdfFromMjmlString', () => {
    it('should delegate to puppeteerService.generatePdfFromMjmlString', async () => {
      const template =
        '<mjml><mj-body><mj-section><mj-column><mj-text>Hello</mj-text></mj-column></mj-section></mj-body></mjml>';
      const mockPdf = new Uint8Array([33, 34, 35]);
      const spy = jest
        .spyOn(puppeteerService, 'generatePdfFromMjmlString')
        .mockResolvedValue(mockPdf);

      const result = await service.generatePdfFromMjmlString(template);

      expect(spy).toHaveBeenCalledWith(template, undefined);
      expect(result).toEqual(mockPdf);
    });

    it('should pass custom options', async () => {
      const template =
        '<mjml><mj-body><mj-section><mj-column><mj-text>Email</mj-text></mj-column></mj-section></mj-body></mjml>';
      const options = { pdfOptions: { format: 'A4' as const } };
      const mockPdf = new Uint8Array([36, 37, 38]);
      const spy = jest
        .spyOn(puppeteerService, 'generatePdfFromMjmlString')
        .mockResolvedValue(mockPdf);

      await service.generatePdfFromMjmlString(template, options);

      expect(spy).toHaveBeenCalledWith(template, options);
    });

    it('should propagate errors', async () => {
      const template = '<invalid>';
      const error = new Error('Invalid MJML');
      jest
        .spyOn(puppeteerService, 'generatePdfFromMjmlString')
        .mockRejectedValue(error);

      await expect(service.generatePdfFromMjmlString(template)).rejects.toThrow(
        'Invalid MJML',
      );
    });
  });

  describe('generatePdfFromMjmlFile', () => {
    it('should delegate to puppeteerService.generatePdfFromMjmlFile', async () => {
      const filePath = '/path/to/template.mjml';
      const mockPdf = new Uint8Array([39, 40, 41]);
      const spy = jest
        .spyOn(puppeteerService, 'generatePdfFromMjmlFile')
        .mockResolvedValue(mockPdf);

      const result = await service.generatePdfFromMjmlFile(filePath);

      expect(spy).toHaveBeenCalledWith(filePath, undefined);
      expect(result).toEqual(mockPdf);
    });

    it('should pass custom options', async () => {
      const filePath = '/templates/email.mjml';
      const options = { pdfOptions: { format: 'Letter' as const } };
      const mockPdf = new Uint8Array([42, 43, 44]);
      const spy = jest
        .spyOn(puppeteerService, 'generatePdfFromMjmlFile')
        .mockResolvedValue(mockPdf);

      await service.generatePdfFromMjmlFile(filePath, options);

      expect(spy).toHaveBeenCalledWith(filePath, options);
    });

    it('should propagate errors', async () => {
      const filePath = '/path/to/missing.mjml';
      const error = new Error('File not found');
      jest
        .spyOn(puppeteerService, 'generatePdfFromMjmlFile')
        .mockRejectedValue(error);

      await expect(service.generatePdfFromMjmlFile(filePath)).rejects.toThrow(
        'File not found',
      );
    });
  });

  describe('generatePdfFromEjsString', () => {
    it('should delegate to puppeteerService.generatePdfFromEjsString', async () => {
      const template = '<p><%= name %></p>';
      const data = { name: 'John' };
      const mockPdf = new Uint8Array([45, 46, 47]);
      const spy = jest
        .spyOn(puppeteerService, 'generatePdfFromEjsString')
        .mockResolvedValue(mockPdf);

      const result = await service.generatePdfFromEjsString(template, data);

      expect(spy).toHaveBeenCalledWith(template, data, undefined);
      expect(result).toEqual(mockPdf);
    });

    it('should handle default data', async () => {
      const template = '<p>Hello</p>';
      const mockPdf = new Uint8Array([48, 49, 50]);
      const spy = jest
        .spyOn(puppeteerService, 'generatePdfFromEjsString')
        .mockResolvedValue(mockPdf);

      const result = await service.generatePdfFromEjsString(template);

      expect(spy).toHaveBeenCalledWith(template, {}, undefined);
      expect(result).toEqual(mockPdf);
    });

    it('should pass custom options', async () => {
      const template = '<p><%= title %></p>';
      const data = { title: 'Document' };
      const options = { pdfOptions: { format: 'A4' as const } };
      const mockPdf = new Uint8Array([51, 52, 53]);
      const spy = jest
        .spyOn(puppeteerService, 'generatePdfFromEjsString')
        .mockResolvedValue(mockPdf);

      await service.generatePdfFromEjsString(template, data, options);

      expect(spy).toHaveBeenCalledWith(template, data, options);
    });

    it('should propagate errors', async () => {
      const template = '<p><%= invalid.nested %></p>';
      const error = new Error('EJS render error');
      jest
        .spyOn(puppeteerService, 'generatePdfFromEjsString')
        .mockRejectedValue(error);

      await expect(service.generatePdfFromEjsString(template)).rejects.toThrow(
        'EJS render error',
      );
    });
  });

  describe('generatePdfFromEjsFile', () => {
    it('should delegate to puppeteerService.generatePdfFromEjsFile', async () => {
      const filePath = '/path/to/template.ejs';
      const data = { content: 'Test' };
      const mockPdf = new Uint8Array([54, 55, 56]);
      const spy = jest
        .spyOn(puppeteerService, 'generatePdfFromEjsFile')
        .mockResolvedValue(mockPdf);

      const result = await service.generatePdfFromEjsFile(filePath, data);

      expect(spy).toHaveBeenCalledWith(filePath, data, undefined);
      expect(result).toEqual(mockPdf);
    });

    it('should handle default data', async () => {
      const filePath = '/templates/document.ejs';
      const mockPdf = new Uint8Array([57, 58, 59]);
      const spy = jest
        .spyOn(puppeteerService, 'generatePdfFromEjsFile')
        .mockResolvedValue(mockPdf);

      await service.generatePdfFromEjsFile(filePath);

      expect(spy).toHaveBeenCalledWith(filePath, {}, undefined);
    });

    it('should pass options through', async () => {
      const filePath = '/templates/invoice.ejs';
      const data = { amount: '500' };
      const options = { pdfOptions: { format: 'A4' as const } };
      const mockPdf = new Uint8Array([60, 61, 62]);
      const spy = jest
        .spyOn(puppeteerService, 'generatePdfFromEjsFile')
        .mockResolvedValue(mockPdf);

      await service.generatePdfFromEjsFile(filePath, data, options);

      expect(spy).toHaveBeenCalledWith(filePath, data, options);
    });

    it('should propagate errors', async () => {
      const filePath = '/path/to/missing.ejs';
      const error = new Error('File not found');
      jest
        .spyOn(puppeteerService, 'generatePdfFromEjsFile')
        .mockRejectedValue(error);

      await expect(service.generatePdfFromEjsFile(filePath)).rejects.toThrow(
        'File not found',
      );
    });
  });

  describe('generatePdfFromPugString', () => {
    it('should delegate to puppeteerService.generatePdfFromPugString', async () => {
      const template = 'p= name';
      const data = { name: 'John' };
      const mockPdf = new Uint8Array([63, 64, 65]);
      const spy = jest
        .spyOn(puppeteerService, 'generatePdfFromPugString')
        .mockResolvedValue(mockPdf);

      const result = await service.generatePdfFromPugString(template, data);

      expect(spy).toHaveBeenCalledWith(template, data, undefined);
      expect(result).toEqual(mockPdf);
    });

    it('should handle default data', async () => {
      const template = 'p Hello';
      const mockPdf = new Uint8Array([66, 67, 68]);
      const spy = jest
        .spyOn(puppeteerService, 'generatePdfFromPugString')
        .mockResolvedValue(mockPdf);

      const result = await service.generatePdfFromPugString(template);

      expect(spy).toHaveBeenCalledWith(template, {}, undefined);
      expect(result).toEqual(mockPdf);
    });

    it('should pass custom options', async () => {
      const template = 'p= title';
      const data = { title: 'Report' };
      const options = { pdfOptions: { format: 'A3' as const } };
      const mockPdf = new Uint8Array([69, 70, 71]);
      const spy = jest
        .spyOn(puppeteerService, 'generatePdfFromPugString')
        .mockResolvedValue(mockPdf);

      await service.generatePdfFromPugString(template, data, options);

      expect(spy).toHaveBeenCalledWith(template, data, options);
    });

    it('should propagate errors', async () => {
      const template = 'invalid pug syntax [[';
      const error = new Error('Pug syntax error');
      jest
        .spyOn(puppeteerService, 'generatePdfFromPugString')
        .mockRejectedValue(error);

      await expect(service.generatePdfFromPugString(template)).rejects.toThrow(
        'Pug syntax error',
      );
    });
  });

  describe('generatePdfFromPugFile', () => {
    it('should delegate to puppeteerService.generatePdfFromPugFile', async () => {
      const filePath = '/path/to/template.pug';
      const data = { user: 'Alice' };
      const mockPdf = new Uint8Array([72, 73, 74]);
      const spy = jest
        .spyOn(puppeteerService, 'generatePdfFromPugFile')
        .mockResolvedValue(mockPdf);

      const result = await service.generatePdfFromPugFile(filePath, data);

      expect(spy).toHaveBeenCalledWith(filePath, data, undefined);
      expect(result).toEqual(mockPdf);
    });

    it('should handle default data', async () => {
      const filePath = '/templates/report.pug';
      const mockPdf = new Uint8Array([75, 76, 77]);
      const spy = jest
        .spyOn(puppeteerService, 'generatePdfFromPugFile')
        .mockResolvedValue(mockPdf);

      await service.generatePdfFromPugFile(filePath);

      expect(spy).toHaveBeenCalledWith(filePath, {}, undefined);
    });

    it('should pass options through', async () => {
      const filePath = '/templates/cert.pug';
      const data = { recipient: 'Bob' };
      const options = { pdfOptions: { format: 'A4' as const } };
      const mockPdf = new Uint8Array([78, 79, 80]);
      const spy = jest
        .spyOn(puppeteerService, 'generatePdfFromPugFile')
        .mockResolvedValue(mockPdf);

      await service.generatePdfFromPugFile(filePath, data, options);

      expect(spy).toHaveBeenCalledWith(filePath, data, options);
    });

    it('should propagate errors', async () => {
      const filePath = '/path/to/missing.pug';
      const error = new Error('File not found');
      jest
        .spyOn(puppeteerService, 'generatePdfFromPugFile')
        .mockRejectedValue(error);

      await expect(service.generatePdfFromPugFile(filePath)).rejects.toThrow(
        'File not found',
      );
    });
  });

  describe('generatePdfFromNunjucksString', () => {
    it('should delegate to puppeteerService.generatePdfFromNunjucksString', async () => {
      const template = '<p>{{ name }}</p>';
      const data = { name: 'Emma' };
      const mockPdf = new Uint8Array([81, 82, 83]);
      const spy = jest
        .spyOn(puppeteerService, 'generatePdfFromNunjucksString')
        .mockResolvedValue(mockPdf);

      const result = await service.generatePdfFromNunjucksString(
        template,
        data,
      );

      expect(spy).toHaveBeenCalledWith(template, data, undefined);
      expect(result).toEqual(mockPdf);
    });

    it('should handle default data', async () => {
      const template = '<p>Hello World</p>';
      const mockPdf = new Uint8Array([84, 85, 86]);
      const spy = jest
        .spyOn(puppeteerService, 'generatePdfFromNunjucksString')
        .mockResolvedValue(mockPdf);

      const result = await service.generatePdfFromNunjucksString(template);

      expect(spy).toHaveBeenCalledWith(template, {}, undefined);
      expect(result).toEqual(mockPdf);
    });

    it('should pass custom options', async () => {
      const template = '<p>{{ title }}</p>';
      const data = { title: 'Nunjucks' };
      const options = { pdfOptions: { format: 'A4' as const } };
      const mockPdf = new Uint8Array([87, 88, 89]);
      const spy = jest
        .spyOn(puppeteerService, 'generatePdfFromNunjucksString')
        .mockResolvedValue(mockPdf);

      await service.generatePdfFromNunjucksString(template, data, options);

      expect(spy).toHaveBeenCalledWith(template, data, options);
    });

    it('should propagate errors', async () => {
      const template = '<p>{{ undefined_var }}</p>';
      const error = new Error('Nunjucks render error');
      jest
        .spyOn(puppeteerService, 'generatePdfFromNunjucksString')
        .mockRejectedValue(error);

      await expect(
        service.generatePdfFromNunjucksString(template),
      ).rejects.toThrow('Nunjucks render error');
    });
  });

  describe('generatePdfFromNunjucksFile', () => {
    it('should delegate to puppeteerService.generatePdfFromNunjucksFile', async () => {
      const filePath = '/path/to/template.njk';
      const data = { version: '1.0' };
      const mockPdf = new Uint8Array([90, 91, 92]);
      const spy = jest
        .spyOn(puppeteerService, 'generatePdfFromNunjucksFile')
        .mockResolvedValue(mockPdf);

      const result = await service.generatePdfFromNunjucksFile(filePath, data);

      expect(spy).toHaveBeenCalledWith(filePath, data, undefined);
      expect(result).toEqual(mockPdf);
    });

    it('should handle default data', async () => {
      const filePath = '/templates/page.njk';
      const mockPdf = new Uint8Array([93, 94, 95]);
      const spy = jest
        .spyOn(puppeteerService, 'generatePdfFromNunjucksFile')
        .mockResolvedValue(mockPdf);

      await service.generatePdfFromNunjucksFile(filePath);

      expect(spy).toHaveBeenCalledWith(filePath, {}, undefined);
    });

    it('should pass options through', async () => {
      const filePath = '/templates/manifest.njk';
      const data = { items: ['a', 'b', 'c'] };
      const options = { pdfOptions: { format: 'A4' as const } };
      const mockPdf = new Uint8Array([96, 97, 98]);
      const spy = jest
        .spyOn(puppeteerService, 'generatePdfFromNunjucksFile')
        .mockResolvedValue(mockPdf);

      await service.generatePdfFromNunjucksFile(filePath, data, options);

      expect(spy).toHaveBeenCalledWith(filePath, data, options);
    });

    it('should propagate errors', async () => {
      const filePath = '/path/to/missing.njk';
      const error = new Error('File not found');
      jest
        .spyOn(puppeteerService, 'generatePdfFromNunjucksFile')
        .mockRejectedValue(error);

      await expect(
        service.generatePdfFromNunjucksFile(filePath),
      ).rejects.toThrow('File not found');
    });
  });

  describe('generatePdfFromMustacheString', () => {
    it('should delegate to puppeteerService.generatePdfFromMustacheString', async () => {
      const template = '<p>{{name}}</p>';
      const data = { name: 'Frank' };
      const mockPdf = new Uint8Array([99, 100, 101]);
      const spy = jest
        .spyOn(puppeteerService, 'generatePdfFromMustacheString')
        .mockResolvedValue(mockPdf);

      const result = await service.generatePdfFromMustacheString(
        template,
        data,
      );

      expect(spy).toHaveBeenCalledWith(template, data, undefined);
      expect(result).toEqual(mockPdf);
    });

    it('should handle default data', async () => {
      const template = '<p>Hello Mustache</p>';
      const mockPdf = new Uint8Array([102, 103, 104]);
      const spy = jest
        .spyOn(puppeteerService, 'generatePdfFromMustacheString')
        .mockResolvedValue(mockPdf);

      const result = await service.generatePdfFromMustacheString(template);

      expect(spy).toHaveBeenCalledWith(template, {}, undefined);
      expect(result).toEqual(mockPdf);
    });

    it('should pass custom options', async () => {
      const template = '<p>{{title}}</p>';
      const data = { title: 'Mustache Template' };
      const options = { pdfOptions: { format: 'A4' as const } };
      const mockPdf = new Uint8Array([105, 106, 107]);
      const spy = jest
        .spyOn(puppeteerService, 'generatePdfFromMustacheString')
        .mockResolvedValue(mockPdf);

      await service.generatePdfFromMustacheString(template, data, options);

      expect(spy).toHaveBeenCalledWith(template, data, options);
    });

    it('should propagate errors', async () => {
      const template = '<p>{{invalid}}</p>';
      const error = new Error('Mustache render error');
      jest
        .spyOn(puppeteerService, 'generatePdfFromMustacheString')
        .mockRejectedValue(error);

      await expect(
        service.generatePdfFromMustacheString(template),
      ).rejects.toThrow('Mustache render error');
    });
  });

  describe('generatePdfFromMustacheFile', () => {
    it('should delegate to puppeteerService.generatePdfFromMustacheFile', async () => {
      const filePath = '/path/to/template.mustache';
      const data = { user: 'Charlie' };
      const mockPdf = new Uint8Array([108, 109, 110]);
      const spy = jest
        .spyOn(puppeteerService, 'generatePdfFromMustacheFile')
        .mockResolvedValue(mockPdf);

      const result = await service.generatePdfFromMustacheFile(filePath, data);

      expect(spy).toHaveBeenCalledWith(filePath, data, undefined);
      expect(result).toEqual(mockPdf);
    });

    it('should handle default data', async () => {
      const filePath = '/templates/document.mustache';
      const mockPdf = new Uint8Array([111, 112, 113]);
      const spy = jest
        .spyOn(puppeteerService, 'generatePdfFromMustacheFile')
        .mockResolvedValue(mockPdf);

      await service.generatePdfFromMustacheFile(filePath);

      expect(spy).toHaveBeenCalledWith(filePath, {}, undefined);
    });

    it('should pass options through', async () => {
      const filePath = '/templates/invoice.mustache';
      const data = { amount: '750' };
      const options = { pdfOptions: { format: 'A4' as const } };
      const mockPdf = new Uint8Array([114, 115, 116]);
      const spy = jest
        .spyOn(puppeteerService, 'generatePdfFromMustacheFile')
        .mockResolvedValue(mockPdf);

      await service.generatePdfFromMustacheFile(filePath, data, options);

      expect(spy).toHaveBeenCalledWith(filePath, data, options);
    });

    it('should propagate errors', async () => {
      const filePath = '/path/to/missing.mustache';
      const error = new Error('File not found');
      jest
        .spyOn(puppeteerService, 'generatePdfFromMustacheFile')
        .mockRejectedValue(error);

      await expect(
        service.generatePdfFromMustacheFile(filePath),
      ).rejects.toThrow('File not found');
    });
  });

  describe('generatePdfFromEtaString', () => {
    it('should delegate to puppeteerService.generatePdfFromEtaString', async () => {
      const template = '<p><%= it.name %></p>';
      const data = { name: 'Diana' };
      const mockPdf = new Uint8Array([99, 100, 101]);
      const spy = jest
        .spyOn(puppeteerService, 'generatePdfFromEtaString')
        .mockResolvedValue(mockPdf);

      const result = await service.generatePdfFromEtaString(template, data);

      expect(spy).toHaveBeenCalledWith(template, data, undefined);
      expect(result).toEqual(mockPdf);
    });

    it('should handle default data', async () => {
      const template = '<p>Hello from Eta</p>';
      const mockPdf = new Uint8Array([102, 103, 104]);
      const spy = jest
        .spyOn(puppeteerService, 'generatePdfFromEtaString')
        .mockResolvedValue(mockPdf);

      const result = await service.generatePdfFromEtaString(template);

      expect(spy).toHaveBeenCalledWith(template, {}, undefined);
      expect(result).toEqual(mockPdf);
    });

    it('should pass custom options', async () => {
      const template = '<p><%= it.title %></p>';
      const data = { title: 'Eta Template' };
      const options = { pdfOptions: { format: 'A4' as const } };
      const mockPdf = new Uint8Array([105, 106, 107]);
      const spy = jest
        .spyOn(puppeteerService, 'generatePdfFromEtaString')
        .mockResolvedValue(mockPdf);

      await service.generatePdfFromEtaString(template, data, options);

      expect(spy).toHaveBeenCalledWith(template, data, options);
    });

    it('should propagate errors', async () => {
      const template = '<p><%= it.invalid %></p>';
      const error = new Error('Eta render error');
      jest
        .spyOn(puppeteerService, 'generatePdfFromEtaString')
        .mockRejectedValue(error);

      await expect(service.generatePdfFromEtaString(template)).rejects.toThrow(
        'Eta render error',
      );
    });
  });

  describe('generatePdfFromEtaFile', () => {
    it('should delegate to puppeteerService.generatePdfFromEtaFile', async () => {
      const filePath = '/path/to/template.eta';
      const data = { user: 'George' };
      const mockPdf = new Uint8Array([108, 109, 110]);
      const spy = jest
        .spyOn(puppeteerService, 'generatePdfFromEtaFile')
        .mockResolvedValue(mockPdf);

      const result = await service.generatePdfFromEtaFile(filePath, data);

      expect(spy).toHaveBeenCalledWith(filePath, data, undefined);
      expect(result).toEqual(mockPdf);
    });

    it('should handle default data', async () => {
      const filePath = '/templates/document.eta';
      const mockPdf = new Uint8Array([111, 112, 113]);
      const spy = jest
        .spyOn(puppeteerService, 'generatePdfFromEtaFile')
        .mockResolvedValue(mockPdf);

      await service.generatePdfFromEtaFile(filePath);

      expect(spy).toHaveBeenCalledWith(filePath, {}, undefined);
    });

    it('should pass options through', async () => {
      const filePath = '/templates/invoice.eta';
      const data = { amount: '999' };
      const options = { pdfOptions: { format: 'A4' as const } };
      const mockPdf = new Uint8Array([114, 115, 116]);
      const spy = jest
        .spyOn(puppeteerService, 'generatePdfFromEtaFile')
        .mockResolvedValue(mockPdf);

      await service.generatePdfFromEtaFile(filePath, data, options);

      expect(spy).toHaveBeenCalledWith(filePath, data, options);
    });

    it('should propagate errors', async () => {
      const filePath = '/path/to/missing.eta';
      const error = new Error('File not found');
      jest
        .spyOn(puppeteerService, 'generatePdfFromEtaFile')
        .mockRejectedValue(error);

      await expect(service.generatePdfFromEtaFile(filePath)).rejects.toThrow(
        'File not found',
      );
    });
  });

  describe('addSignatureFieldSignatureDebtorRaw', () => {
    it('should delegate to addSignatureFieldUsingAnchor with default parameters', async () => {
      const pdf = new Uint8Array([21, 22, 23]);
      const mockPdf = new Uint8Array([24, 25, 26]);
      signatureHelper.mockResolvedValue(mockPdf);

      await expect(
        service.addSignatureFieldSignatureDebtorRaw(pdf),
      ).resolves.toEqual(mockPdf);

      expect(signatureHelper).toHaveBeenCalledWith(
        pdf,
        'SignatureDebtor',
        '__SIG_DEBTOR_ANCHOR__',
      );
    });

    it('should pass custom field name and anchor text', async () => {
      const pdf = Buffer.from([27, 28, 29]);
      const mockPdf = new Uint8Array([30, 31, 32]);
      signatureHelper.mockResolvedValue(mockPdf);

      await service.addSignatureFieldSignatureDebtorRaw(
        pdf,
        'CustomSignature',
        '__CUSTOM_ANCHOR__',
      );

      expect(signatureHelper).toHaveBeenCalledWith(
        pdf,
        'CustomSignature',
        '__CUSTOM_ANCHOR__',
      );
    });

    it('should propagate errors from addSignatureFieldUsingAnchor', async () => {
      const pdf = new Uint8Array([33, 34, 35]);
      const error = new Error('Signature field creation failed');
      signatureHelper.mockRejectedValue(error);

      await expect(
        service.addSignatureFieldSignatureDebtorRaw(pdf),
      ).rejects.toThrow(error);
    });
  });
});
