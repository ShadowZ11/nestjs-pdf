import {
  NestjsPdfErrorCode,
  RendererConfigurationException,
} from '../exceptions';
import {
  resolvePrintLayout,
  toApi2PdfOptions,
  toGotenbergForm,
  toInches,
} from './pdf-options.mapper';

describe('pdf-options.mapper', () => {
  describe('toInches', () => {
    it.each([
      [96, 1],
      ['96', 1],
      ['48px', 0.5],
      ['2in', 2],
      ['2.54cm', 1],
      ['25.4mm', 1],
      [' 1 IN ', 1],
      ['.5in', 0.5],
    ])('converts %j to %d inches', (value, expected) => {
      expect(toInches(value)).toBeCloseTo(expected, 6);
    });

    it.each(['', 'abc', '1pt', '1 em', '1in2'])('rejects %j', (value) => {
      expect(() => toInches(value)).toThrow(RendererConfigurationException);
    });
  });

  describe('resolvePrintLayout', () => {
    it('defaults to Letter without margins, like Puppeteer', () => {
      expect(resolvePrintLayout({})).toEqual({
        width: 8.5,
        height: 11,
        margin: {},
      });
    });

    it('resolves a format case-insensitively', () => {
      const { width, height } = resolvePrintLayout({ format: 'A4' });
      expect(width).toBeCloseTo(8.27, 2);
      expect(height).toBeCloseTo(11.69, 2);
      expect(resolvePrintLayout({ format: 'LEDGER' })).toMatchObject({
        width: 17,
        height: 11,
      });
    });

    it('lets width and height win over format', () => {
      expect(
        resolvePrintLayout({ format: 'A4', width: '10in', height: 480 }),
      ).toMatchObject({ width: 10, height: 5 });
    });

    it('completes a lone width or height with Letter', () => {
      expect(resolvePrintLayout({ width: '4in' })).toMatchObject({
        width: 4,
        height: 11,
      });
      expect(resolvePrintLayout({ height: '4in' })).toMatchObject({
        width: 8.5,
        height: 4,
      });
    });

    it('converts the given margins only', () => {
      expect(
        resolvePrintLayout({ margin: { top: '1in', left: 48 } }).margin,
      ).toEqual({ top: 1, left: 0.5 });
    });

    it('rejects an unknown format', () => {
      let error: unknown;
      try {
        resolvePrintLayout({ format: 'b5' as never });
      } catch (e) {
        error = e;
      }
      expect(error).toBeInstanceOf(RendererConfigurationException);
      expect((error as RendererConfigurationException).code).toBe(
        NestjsPdfErrorCode.RENDERER_CONFIGURATION_ERROR,
      );
    });
  });

  describe('toGotenbergForm', () => {
    it('sends the paper size, zero margins and the Puppeteer rendering defaults', () => {
      expect(toGotenbergForm({ format: 'A4' })).toEqual({
        fields: {
          paperWidth: '8.2677',
          paperHeight: '11.6929',
          marginTop: '0',
          marginRight: '0',
          marginBottom: '0',
          marginLeft: '0',
          emulatedMediaType: 'screen',
          skipNetworkIdleEvent: 'false',
        },
        files: {},
      });
    });

    it('maps the supported Puppeteer options', () => {
      const { fields } = toGotenbergForm({
        margin: { top: '1cm', bottom: '2in' },
        landscape: true,
        printBackground: true,
        omitBackground: false,
        scale: 0.8,
        pageRanges: '1-3, 5',
        preferCSSPageSize: true,
        tagged: true,
        outline: false,
      });

      expect(fields).toMatchObject({
        marginTop: '0.3937',
        marginBottom: '2',
        landscape: 'true',
        printBackground: 'true',
        omitBackground: 'false',
        scale: '0.8',
        nativePageRanges: '1-3, 5',
        preferCssPageSize: 'true',
        generateTaggedPdf: 'true',
        generateDocumentOutline: 'false',
      });
    });

    it('sends header and footer as full documents only when displayHeaderFooter is set', () => {
      const templates = {
        headerTemplate: '<span class="title"></span>',
        footerTemplate:
          '<html><head></head><body><span class="pageNumber"></span></body></html>',
      };

      expect(toGotenbergForm(templates).files).toEqual({});
      expect(
        toGotenbergForm({ ...templates, displayHeaderFooter: true }).files,
      ).toEqual({
        'header.html':
          '<!DOCTYPE html><html><head></head><body><span class="title"></span></body></html>',
        'footer.html': templates.footerTemplate,
      });
    });

    it('skips missing templates', () => {
      expect(
        toGotenbergForm({ displayHeaderFooter: true, footerTemplate: 'f' })
          .files,
      ).toEqual({
        'footer.html':
          '<!DOCTYPE html><html><head></head><body>f</body></html>',
      });
    });
  });

  describe('toApi2PdfOptions', () => {
    it('sends the paper size and margins in inches, screen media', () => {
      expect(
        toApi2PdfOptions({ format: 'Letter', margin: { top: 96 } }),
      ).toEqual({
        width: '8.5in',
        height: '11in',
        marginTop: '1in',
        marginRight: '0in',
        marginBottom: '0in',
        marginLeft: '0in',
        usePrintCss: false,
      });
    });

    it('passes the options Api2Pdf shares with Puppeteer through', () => {
      const options = toApi2PdfOptions({
        landscape: true,
        printBackground: true,
        omitBackground: true,
        scale: 1.2,
        pageRanges: '2',
        displayHeaderFooter: true,
        headerTemplate: '<b>h</b>',
        footerTemplate: '<b>f</b>',
        tagged: true,
      });

      expect(options).toMatchObject({
        landscape: true,
        printBackground: true,
        omitBackground: true,
        scale: 1.2,
        pageRanges: '2',
        displayHeaderFooter: true,
        headerTemplate: '<b>h</b>',
        footerTemplate: '<b>f</b>',
      });
      expect(options).not.toHaveProperty('tagged');
    });
  });
});
