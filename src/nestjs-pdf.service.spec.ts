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
