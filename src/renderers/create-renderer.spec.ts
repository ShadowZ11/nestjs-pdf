import { RendererConfigurationException } from '../exceptions';
import type { BrowserService } from '../puppeteer/browser/browser.service';
import type { PuppeteerParameters } from '../puppeteer/puppeteer-parameters.interface';
import { createPdfRenderer, usesPuppeteer } from './create-renderer';

describe('createPdfRenderer', () => {
  const browserService = {} as BrowserService;

  it('should reject an unknown provider', () => {
    const params = {
      provider: { type: 'wkhtmltopdf' },
    } as unknown as PuppeteerParameters;

    expect(() => createPdfRenderer(params, browserService)).toThrow(
      new RendererConfigurationException(
        "Unknown PDF provider 'wkhtmltopdf': expected 'puppeteer', 'gotenberg' or 'api2pdf'",
      ),
    );
  });

  it.each([
    [{}, true],
    [{ provider: { type: 'puppeteer' } }, true],
    [{ provider: { type: 'gotenberg', url: 'http://g' } }, false],
    [{ provider: { type: 'api2pdf', apiKey: 'k' } }, false],
  ] as Array<[PuppeteerParameters, boolean]>)(
    'usesPuppeteer(%j) is %s',
    (params, expected) => {
      expect(usesPuppeteer(params)).toBe(expected);
    },
  );
});
