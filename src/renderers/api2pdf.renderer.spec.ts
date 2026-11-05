import { type Mock, vi } from 'vitest';

import {
  PdfGenerationException,
  RendererConfigurationException,
} from '../exceptions';
import { Api2PdfRenderer } from './api2pdf.renderer';

const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46]);

function pdfResponse(): Response {
  return new Response(PDF, {
    status: 200,
    headers: { 'content-type': 'application/pdf' },
  });
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

describe('Api2PdfRenderer', () => {
  let fetchMock: Mock;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(pdfResponse());
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const renderer = () =>
    new Api2PdfRenderer({ type: 'api2pdf', apiKey: 'secret-key' });

  it('should require an api key', () => {
    expect(() => new Api2PdfRenderer({ type: 'api2pdf', apiKey: '' })).toThrow(
      RendererConfigurationException,
    );
  });

  it('should post the HTML with binary output and return the PDF', async () => {
    const pdf = await renderer().render('<h1>Hi</h1>', {
      pdfOptions: { format: 'Letter', landscape: true },
    });

    expect(pdf).toEqual(PDF);
    const [url, init] = fetchMock.mock.lastCall as [string, RequestInit];
    expect(url).toBe(
      'https://v2.api2pdf.com/chrome/pdf/html?outputBinary=true',
    );
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({
      Authorization: 'secret-key',
      'Content-Type': 'application/json',
    });
    expect(JSON.parse(init.body as string)).toEqual({
      html: '<h1>Hi</h1>',
      inline: false,
      options: {
        width: '8.5in',
        height: '11in',
        marginTop: '0in',
        marginRight: '0in',
        marginBottom: '0in',
        marginLeft: '0in',
        usePrintCss: false,
        landscape: true,
      },
    });
  });

  it('should use the base url, headers, file name and raw options', async () => {
    const custom = new Api2PdfRenderer({
      type: 'api2pdf',
      apiKey: 'secret-key',
      baseUrl: 'https://eu.api2pdf.test/',
      headers: { Tag: 'invoices', Authorization: 'overridden' },
    });

    await custom.render('<p></p>', {
      api2pdfOptions: {
        fileName: 'invoice.pdf',
        options: { delay: 500, usePrintCss: true },
      },
    });

    const [url, init] = fetchMock.mock.lastCall as [string, RequestInit];
    expect(url).toBe(
      'https://eu.api2pdf.test/chrome/pdf/html?outputBinary=true',
    );
    // The configured API key always wins.
    expect(init.headers).toMatchObject({
      Tag: 'invoices',
      Authorization: 'secret-key',
    });
    const body = JSON.parse(init.body as string) as {
      fileName: string;
      options: Record<string, unknown>;
    };
    expect(body.fileName).toBe('invoice.pdf');
    expect(body.options).toMatchObject({ delay: 500, usePrintCss: true });
  });

  it('should download the file when Api2Pdf answers with a link', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ Success: true, FileUrl: 'https://storage.test/f.pdf' }),
      )
      .mockResolvedValueOnce(pdfResponse());
    const controller = new AbortController();

    const pdf = await renderer().render('<p></p>', {}, controller.signal);

    expect(pdf).toEqual(PDF);
    expect(fetchMock).toHaveBeenLastCalledWith('https://storage.test/f.pdf', {
      signal: controller.signal,
    });
  });

  it('should throw when Api2Pdf reports a failure', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ Success: false, Error: 'Invalid HTML' }),
    );

    await expect(renderer().render('<p></p>', {})).rejects.toThrow(
      'Api2Pdf could not generate the PDF: Invalid HTML',
    );
  });

  it('should accept a response that only carries an Error', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ Error: 'Quota exceeded' }));

    await expect(renderer().render('<p></p>', {})).rejects.toThrow(
      'Api2Pdf could not generate the PDF: Quota exceeded',
    );
  });

  it('should download the file when the response only carries a FileUrl', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ FileUrl: 'https://storage.test/f.pdf' }),
      )
      .mockResolvedValueOnce(pdfResponse());

    await expect(renderer().render('<p></p>', {})).resolves.toEqual(PDF);
  });

  it.each([{ message: 'not api2pdf' }, null, 'oops', 42])(
    'should reject an unexpected JSON response (%j)',
    async (body) => {
      fetchMock.mockResolvedValue(jsonResponse(body));

      const promise = renderer().render('<p></p>', {});
      await expect(promise).rejects.toThrow(PdfGenerationException);
      await expect(promise).rejects.toThrow(
        `Api2Pdf returned an unexpected response: ${JSON.stringify(body)}`,
      );
    },
  );

  it('should throw when Api2Pdf returns no file', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ Success: true }));

    await expect(renderer().render('<p></p>', {})).rejects.toThrow(
      'Api2Pdf could not generate the PDF: no file returned',
    );
  });

  it('should throw when the file download fails', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ Success: true, FileUrl: 'https://storage.test/f.pdf' }),
      )
      .mockResolvedValueOnce(new Response('gone', { status: 404 }));

    await expect(renderer().render('<p></p>', {})).rejects.toThrow(
      'Api2Pdf responded with HTTP 404: gone',
    );
  });

  it('should throw a PdfGenerationException on an HTTP error', async () => {
    fetchMock.mockResolvedValue(
      new Response('{"Error":"Invalid API key"}', { status: 401 }),
    );

    await expect(renderer().render('<p></p>', {})).rejects.toThrow(
      PdfGenerationException,
    );
  });

  it('should refuse the security option', async () => {
    await expect(
      renderer().render('<p></p>', { security: {} }),
    ).rejects.toThrow(RendererConfigurationException);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
